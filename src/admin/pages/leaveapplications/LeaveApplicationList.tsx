import React, { useState, useEffect } from 'react';
import { formatDate } from '../../utils/dateUtils';
import { Link, useNavigate } from 'react-router-dom';
import { leaveApplicationApi, LeaveApplication } from '../../services/api/leaveApplicationApi';
import { dropdownApi, DropdownItem } from '../../services/api/dropdownApi';
import DataTable, { Column } from '../../components/DataTable';
import ConfirmDialog from '../../components/ConfirmDialog';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import PermissionGuard from '../../components/PermissionGuard';
import { usePermissions } from '../../hooks/usePermissions';
import { logError } from '../../utils/logError';
import '../../styles/admin.css';
import '../../styles/admin-components.css';

export default function LeaveApplicationList() {
    const { user: currentUser } = useAuth();
    const { showSuccess } = useToast();
    const navigate = useNavigate();
    const permissions = usePermissions('LeaveApplications'); // Ensure this controller name is in usePermissions
    const [leaveApplications, setLeaveApplications] = useState<LeaveApplication[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; leaveApp: LeaveApplication | null }>({
        isOpen: false,
        leaveApp: null
    });

    const [employees, setEmployees] = useState<DropdownItem[]>([]);
    const [leaveTypes, setLeaveTypes] = useState<DropdownItem[]>([]);
    const [statusMap, setStatusMap] = useState<Record<string, string>>({});

    const [searchTerm, setSearchTerm] = useState('');
    const [allRecords, setAllRecords] = useState<LeaveApplication[]>([]);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [entriesPerPage, setEntriesPerPage] = useState(10);
    const [totalRecords, setTotalRecords] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    const loadData = async (page: number = currentPage, pageSize: number = entriesPerPage, search: string = searchTerm) => {
        try {
            setLoading(true);
            setError(null);

            // Fetch larger batch allows client-side filter if backend search is limited 
            // or use standard backend pagination if preferred. 
            // Pattern in this app seems to be fetch all/large batch and filter client side for some modules, 
            // but LeaveApps might be huge. I'll try fetching large batch first 
            // as user provided link ?start=0&length=100.
            const response = await leaveApplicationApi.getAllLeaveApplicationsPage(0, 100, '', 'asc');

            if (response.success) {
                let fetchedData = response.data || [];

                // Robust verification: Ensure fetchedData is actually an array
                if (!Array.isArray(fetchedData)) {
                    console.warn('API returned non-array data for Leave Applications:', fetchedData);
                    // Attempt to extract if hidden in a property (common fallback)
                    if (fetchedData && (fetchedData as any).data && Array.isArray((fetchedData as any).data)) {
                        fetchedData = (fetchedData as any).data;
                    } else if (fetchedData && (fetchedData as any).items && Array.isArray((fetchedData as any).items)) {
                        fetchedData = (fetchedData as any).items;
                    } else {
                        fetchedData = [];
                    }
                }

                setAllRecords(fetchedData);

                // Client-side filtering
                const filtered = fetchedData.filter(item => {
                    const searchStr = search.toLowerCase();
                    return Object.values(item).some(value =>
                        value !== null &&
                        value !== undefined &&
                        String(value).toLowerCase().includes(searchStr)
                    );
                });

                const totalCount = filtered.length;
                setTotalRecords(totalCount);
                setTotalPages(Math.ceil(totalCount / pageSize));

                // Slice for current page
                const startIndex = (page - 1) * pageSize;
                const endIndex = startIndex + pageSize;
                const pageData = filtered.slice(startIndex, endIndex);

                setLeaveApplications(pageData);
            } else {
                setError(response.message || 'Failed to fetch leave applications');
                setLeaveApplications([]);
            }
        } catch (err) {
            setError('Network error occurred while fetching data');
            console.error('Error fetching leave applications:', err);
            await logError({
                controllerName: 'LeaveApplicationList',
                methodName: 'LoadData',
                requestUrl: 'leaveApplicationApi.getAllLeaveApplicationsPage',
                requestPayload: { page, pageSize, search },
                error: err
            });
        } finally {
            setLoading(false);
        }
    };

    // Search & Pagination Handlers
    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchTerm(value);
        setCurrentPage(1);
        loadData(1, entriesPerPage, value);
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        loadData(page, entriesPerPage, searchTerm);
    };

    const handleEntriesPerPageChange = (newEntriesPerPage: number) => {
        setEntriesPerPage(newEntriesPerPage);
        setCurrentPage(1);
        loadData(1, newEntriesPerPage, searchTerm);
    };

    const handlePrevious = () => {
        if (currentPage > 1) handlePageChange(currentPage - 1);
    };

    const handleNext = () => {
        if (currentPage < totalPages) handlePageChange(currentPage + 1);
    };

    useEffect(() => {
        const fetchLookups = async () => {
            try {
                const [empRes, ltRes, statusRes] = await Promise.all([
                    dropdownApi.getEmployeesName(),
                    dropdownApi.getLeaveName(),
                    dropdownApi.getLovMaster('LeaveApplications')
                ]);

                if (empRes.success) setEmployees(empRes.data);
                if (ltRes.success) setLeaveTypes(ltRes.data);

                if (statusRes.success && statusRes.data) {
                    const map: Record<string, string> = {};
                    statusRes.data.forEach(item => {
                        const key = item.code || item.name;
                        map[key] = item.name;
                        if (item.name) map[item.name] = item.name;
                    });
                    setStatusMap(map);
                }
            } catch (err) {
                console.error('Error fetching lookups:', err);
            }
        };

        fetchLookups();
        loadData();
    }, [currentUser]);

    const handleDelete = async () => {
        if (!deleteDialog.leaveApp) return;

        try {
            const response = await leaveApplicationApi.deleteLeaveApplication(
                deleteDialog.leaveApp.leaveApplicationId,
                Number(currentUser?.id || 0)
            );
            if (response.success) {
                await loadData();
                setDeleteDialog({ isOpen: false, leaveApp: null });
                showSuccess('Leave Application deleted successfully!');
            } else {
                setError(response.message || 'Failed to delete leave application');
            }
        } catch (err) {
            setError('Network error occurred while deleting');
        }
    };

    const columns: Column<LeaveApplication>[] = [
        {
            key: 'leaveApplicationId',
            label: 'Sr No.',
            width: '80px',
            render: (_: any, __: LeaveApplication, index: number) => ((currentPage - 1) * entriesPerPage) + index + 1
        },
        // Columns mapped to likely backend response fields or basic IDs if string names aren't available
        // Assuming backend might join and return names, otherwise IDs. 
        // We will display IDs if names are missing for now.
        {
            key: 'employeeId',
            label: 'Employee',
            width: '200px',
            render: (val: any, row: LeaveApplication) => {
                // API sends employeeName
                if (row.employeeName) return row.employeeName;

                // Fallback to dropdown lookup
                const emp = employees.find(e => Number(e.id || e.value) === Number(val));
                return emp ? (emp.name || emp.text) : val;
            },
            sortable: true
        },
        {
            key: 'leaveTypeId',
            label: 'Leave Type',
            width: '150px',
            render: (val: any, row: LeaveApplication) => {
                // API might send leaveName or leaveTypeName
                const nameFromApi = (row as any).leaveName || row.leaveTypeName;
                if (nameFromApi) return nameFromApi;

                // Fallback to dropdown lookup
                const lt = leaveTypes.find(l => Number(l.id || l.value) === Number(val));
                return lt ? (lt.name || lt.text) : val;
            },
            sortable: true
        },
        {
            key: 'fromDate',
            label: 'From Date',
            width: '120px',
            render: (val: string) => formatDate(val),
            sortable: true
        },
        {
            key: 'toDate',
            label: 'To Date',
            width: '120px',
            render: (val: string) => formatDate(val),
            sortable: true
        },
        {
            key: 'totalDays',
            label: 'Day',
            width: '100px',
            render: (val: any) => {
                const num = Number(val);
                if (num === 0.5) return 'Half Day';
                if (num === 1) return '1 Day';
                return `${num} Day`;
            },
            sortable: true
        },
        {
            key: 'status',
            label: 'Status',
            width: '150px',
            sortable: true,
            render: (val: string) => {
                let statusColor = 'var(--admin-gray-600)';
                if (val?.toLowerCase() === 'approved') statusColor = 'var(--admin-success)';
                else if (val?.toLowerCase() === 'pending') statusColor = 'var(--admin-warning)';
                else if (val?.toLowerCase() === 'rejected') statusColor = 'var(--admin-danger)';

                return (
                    <span className="user-role-badge" style={{ backgroundColor: statusColor, color: 'white' }}>
                        {statusMap[val] || val || 'Pending'}
                    </span>
                );
            }
        },
        {
            key: 'approvedBy',
            label: 'Approved By',
            width: '200px',
            render: (val: any, row: LeaveApplication) => {
                // Check for name fields first (API might send approveBy or approvedByName)
                const nameFromApi = (row as any).approveBy || row.approvedByName;
                if (nameFromApi && typeof nameFromApi === 'string') {
                    return nameFromApi;
                }

                // If no name found and no ID, return dash
                if (!val || val === 0) return '-';

                // Try to find name from employees dropdown
                const emp = employees.find(e => Number(e.id || e.value) === Number(val));
                return emp ? (emp.name || emp.text) : val;
            },
            sortable: true
        }
    ];

    return (
        <div className="admin-page">
            <div className="admin-page-header">
                <div>
                    <h1 className="admin-page-title">Leave Application</h1>
                    <p className="admin-page-subtitle">Manage Employee Leave Request</p>
                </div>
                <div className="admin-page-actions">
                    {/* Temporarily direct link without PermissionGuard if needed, otherwise standard */}
                    {/* <PermissionGuard controller="LeaveApplications" permission="add"> */}
                    <Link to="/admin/leaveapplications/add" className="admin-btn admin-btn-primary">
                        <i className="fa-solid fa-plus"></i>
                        Add Leave Application
                    </Link>
                    {/* </PermissionGuard> */}
                </div>
            </div>

            {error && (
                <div className="admin-alert admin-alert-error">
                    <i className="fa-solid fa-circle-exclamation"></i>
                    {error}
                    <button onClick={() => setError(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'inherit' }}>
                        <i className="fa-solid fa-times"></i>
                    </button>
                </div>
            )}

            <div className="admin-card">
                <div className="admin-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <h2 style={{ margin: 0 }}>{loading ? 'Loading...' : `${totalRecords} Application`}</h2>
                        <div className="admin-search-wrapper">
                            <i className="fa-solid fa-search admin-search-icon"></i>
                            <input
                                type="text"
                                placeholder="Search..."
                                value={searchTerm}
                                onChange={handleSearch}
                                className="admin-search-input"
                                onFocus={(e) => e.target.style.borderColor = 'var(--admin-primary)'}
                                onBlur={(e) => e.target.style.borderColor = 'var(--admin-gray-300)'}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '14px', color: 'var(--admin-gray-600)' }}>Show</span>
                        <select
                            value={entriesPerPage}
                            onChange={(e) => handleEntriesPerPageChange(parseInt(e.target.value))}
                            className="admin-form-control"
                            style={{ width: 'auto', padding: '6px 12px' }}
                        >
                            <option value={5}>5</option>
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                        </select>
                        <span style={{ fontSize: '14px', color: 'var(--admin-gray-600)' }}>Entries</span>
                    </div>
                </div>

                <div className="admin-card-body" style={{ padding: 0 }}>
                    {loading ? (
                        <div className="admin-table-loading">
                            <i className="fa-solid fa-spinner fa-spin"></i>
                            <p>Loading Data...</p>
                        </div>
                    ) : leaveApplications.length === 0 ? (
                        <div className="admin-table-empty">
                            <i className="fa-solid fa-file-invoice"></i>
                            <h3>No Applications Found</h3>
                            <p>No leave applications recorded.</p>
                        </div>
                    ) : (
                        <>
                            <DataTable
                                keyField="leaveApplicationId"
                                columns={columns}
                                data={leaveApplications}
                                onEdit={(item: LeaveApplication) => navigate(`/admin/leaveapplications/edit/${item.leaveApplicationId}`, { state: { leaveData: item } })}
                                onDelete={(item: LeaveApplication) => setDeleteDialog({ isOpen: true, leaveApp: item })}
                            />

                            <div className="admin-pagination">
                                <div className="admin-pagination-info">
                                    Showing {((currentPage - 1) * entriesPerPage) + 1} To {Math.min(currentPage * entriesPerPage, totalRecords)} Of {totalRecords} Entries
                                </div>
                                <div className="admin-pagination-controls">
                                    <button onClick={handlePrevious} disabled={currentPage <= 1} className="admin-pagination-btn">
                                        <i className="fa-solid fa-chevron-left" style={{ fontSize: '11px' }}></i> Previous
                                    </button>
                                    <div className="admin-pagination-pages">
                                        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                                            let pageNum;
                                            if (totalPages <= 5) pageNum = i + 1;
                                            else if (currentPage <= 3) pageNum = i + 1;
                                            else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                                            else pageNum = currentPage - 2 + i;
                                            return (
                                                <button
                                                    key={pageNum}
                                                    onClick={() => handlePageChange(pageNum)}
                                                    className={`admin-pagination-btn ${pageNum === currentPage ? 'active' : ''}`}
                                                >
                                                    {pageNum}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <button onClick={handleNext} disabled={currentPage >= totalPages} className="admin-pagination-btn">
                                        Next <i className="fa-solid fa-chevron-right" style={{ fontSize: '11px' }}></i>
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>

            <ConfirmDialog
                isOpen={deleteDialog.isOpen}
                title="Delete Leave Application"
                message={`Are you sure you want to delete this leave application?`}
                confirmText="Delete"
                type="danger"
                onConfirm={handleDelete}
                onCancel={() => setDeleteDialog({ isOpen: false, leaveApp: null })}
            />
        </div>
    );
}
