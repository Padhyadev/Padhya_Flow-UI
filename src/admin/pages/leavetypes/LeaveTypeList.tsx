import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { leaveTypesApi, LeaveType } from '../../services/api/leaveTypesApi';
import DataTable, { Column } from '../../components/DataTable';
import ConfirmDialog from '../../components/ConfirmDialog';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import PermissionGuard from '../../components/PermissionGuard';
import { usePermissions } from '../../hooks/usePermissions';
import { logError } from '../../utils/logError';
import '../../styles/admin.css';
import '../../styles/admin-components.css';

export default function LeaveTypeList() {
    const { user: currentUser } = useAuth();
    const { showSuccess } = useToast();
    const navigate = useNavigate();
    const permissions = usePermissions('LeaveTypes');
    const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; leaveType: LeaveType | null }>({
        isOpen: false,
        leaveType: null
    });

    const [searchTerm, setSearchTerm] = useState('');
    const [allLeaveTypes, setAllLeaveTypes] = useState<LeaveType[]>([]);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [entriesPerPage, setEntriesPerPage] = useState(10);
    const [totalRecords, setTotalRecords] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    const loadLeaveTypes = async (page: number = currentPage, pageSize: number = entriesPerPage, search: string = searchTerm) => {
        try {
            setLoading(true);
            setError(null);

            // Use backend search and pagination
            const start = (page - 1) * pageSize;
            const response = await leaveTypesApi.getAllLeaveTypesPage(start, pageSize, 'asc');

            if (response.success) {
                const fetchedData = response.data || [];
                // If totalRecords is provided by API use it, otherwise use fetched length
                const totalCount = (response as any).totalRecords || fetchedData.length;

                setLeaveTypes(fetchedData);
                setTotalRecords(totalCount);
                setTotalPages(Math.ceil(totalCount / pageSize));
            } else {
                setError(response.message || 'Failed to fetch leave types');
                setLeaveTypes([]);
            }
        } catch (err) {
            setError('Network error occurred while fetching leave types');
            console.error('Error fetching leave types:', err);
            await logError({
                controllerName: 'LeaveTypeList',
                methodName: 'LoadLeaveTypes',
                requestUrl: 'leaveTypesApi.getAllLeaveTypesPage',
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
        loadLeaveTypes(1, entriesPerPage, value);
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        loadLeaveTypes(page, entriesPerPage, searchTerm);
    };

    const handleEntriesPerPageChange = (newEntriesPerPage: number) => {
        setEntriesPerPage(newEntriesPerPage);
        setCurrentPage(1);
        loadLeaveTypes(1, newEntriesPerPage, searchTerm);
    };

    const handlePrevious = () => {
        if (currentPage > 1) handlePageChange(currentPage - 1);
    };

    const handleNext = () => {
        if (currentPage < totalPages) handlePageChange(currentPage + 1);
    };

    useEffect(() => {
        loadLeaveTypes();
    }, [currentUser]);

    const handleDeleteLeaveType = async () => {
        if (!deleteDialog.leaveType) return;

        try {
            const response = await leaveTypesApi.deleteLeaveType(
                deleteDialog.leaveType.leaveTypeId,
                currentUser?.id ? Number(currentUser.id) : 0
            );
            if (response.success) {
                await loadLeaveTypes();
                setDeleteDialog({ isOpen: false, leaveType: null });
                showSuccess('Leave Type deleted successfully!');
            } else {
                setError(response.message || 'Failed to delete leave type');
            }
        } catch (err) {
            setError('Network error occurred while deleting leave type');
        }
    };

    const columns: Column<LeaveType>[] = [
        {
            key: 'leaveTypeId',
            label: 'Sr No.',
            render: (_: any, __: LeaveType, index: number) => ((currentPage - 1) * entriesPerPage) + index + 1
        },
        {
            key: 'leaveCode',
            label: 'Leave Code',
            sortable: true
        },
        {
            key: 'leaveName',
            label: 'Leave Name',
            sortable: true
        },
        {
            key: 'yearlyQuota',
            label: 'Yearly Quota',
            sortable: true
        },

        {
            key: 'isCarryForward',
            label: 'Carry Forward',
            render: (val: boolean) => (val ? 'Yes' : 'No'),
            sortable: true
        }
    ];

    return (
        <div className="admin-page">
            <div className="admin-page-header">
                <div>
                    <h1 className="admin-page-title">Leave Type</h1>
                    <p className="admin-page-subtitle">Manage Leave Categories And Policy</p>
                </div>
                <div className="admin-page-actions">
                    {/* <PermissionGuard controller="LeaveTypes" permission="add"> */}
                    <Link to="/admin/leavetypes/add" className="admin-btn admin-btn-primary">
                        <i className="fa-solid fa-plus"></i>
                        Add Leave Type
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
                        <h2 style={{ margin: 0 }}>{loading ? 'Loading...' : `${totalRecords} Leave Type`}</h2>
                        <div className="admin-search-wrapper">
                            <i className="fa-solid fa-search admin-search-icon"></i>
                            <input
                                type="text"
                                placeholder="Search Leave Type..."
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
                            <p>Loading Leave Types...</p>
                        </div>
                    ) : leaveTypes.length === 0 ? (
                        <div className="admin-table-empty">
                            <i className="fa-solid fa-file-invoice"></i>
                            <h3>No Leave Types Found</h3>
                            <p>No leave types recorded.</p>
                        </div>
                    ) : (
                        <>
                            <DataTable
                                keyField="leaveTypeId"
                                columns={columns}
                                data={leaveTypes}
                                onEdit={(leaveType: LeaveType) => navigate(`/admin/leavetypes/edit/${leaveType.leaveTypeId}`, { state: { leaveData: leaveType } })}
                                onDelete={(leaveType: LeaveType) => setDeleteDialog({ isOpen: true, leaveType })}
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
                title="Delete Leave Type"
                message={`Are you sure you want to delete leave type "${deleteDialog.leaveType?.leaveName}"?`}
                confirmText="Delete"
                type="danger"
                onConfirm={handleDeleteLeaveType}
                onCancel={() => setDeleteDialog({ isOpen: false, leaveType: null })}
            />
        </div>
    );
}
