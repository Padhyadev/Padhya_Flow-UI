import React, { useState, useEffect } from 'react';
import { formatDate } from '../../utils/dateUtils';
import { Link, useNavigate } from 'react-router-dom';
import { ShortLeave, shortLeaveApi } from '../../services/api/shortLeaveApi';
import DataTable from '../../components/DataTable';
import ConfirmDialog from '../../components/ConfirmDialog';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import PermissionGuard from '../../components/PermissionGuard';
import { usePermissions } from '../../hooks/usePermissions';
import { logError } from '../../utils/logError';
import '../../styles/admin.css';
import '../../styles/admin-components.css';

export default function ShortLeaveList() {
    const { user: currentUser } = useAuth();
    const { showSuccess, showError } = useToast();
    const navigate = useNavigate();
    const permissions = usePermissions('ShortLeave');

    const [shortLeaves, setShortLeaves] = useState<ShortLeave[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; shortLeave: ShortLeave | null }>({
        isOpen: false,
        shortLeave: null
    });

    const [searchTerm, setSearchTerm] = useState('');
    const [allShortLeaves, setAllShortLeaves] = useState<ShortLeave[]>([]);

    // LOV Maps
    const [statusMap, setStatusMap] = useState<Record<string, string>>({});

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [entriesPerPage, setEntriesPerPage] = useState(10);
    const [totalRecords, setTotalRecords] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    const loadShortLeaves = async (page: number = currentPage, pageSize: number = entriesPerPage, search: string = searchTerm) => {
        try {
            setLoading(true);
            setError(null);

            const response = await shortLeaveApi.getAllShortLeavesPage(0, 1000, 'asc');

            if (response.success) {
                const fetchedLeaves = response.data || [];
                setAllShortLeaves(fetchedLeaves);

                // Global Filter: Search across all fields
                const filteredLeaves = fetchedLeaves.filter(leave => {
                    const searchStr = search.toLowerCase();
                    return Object.values(leave).some(value =>
                        value !== null &&
                        value !== undefined &&
                        String(value).toLowerCase().includes(searchStr)
                    );
                });

                const totalCount = filteredLeaves.length;
                setTotalRecords(totalCount);
                setTotalPages(Math.ceil(totalCount / pageSize));

                // Slice data for current page
                const startIndex = (page - 1) * pageSize;
                const endIndex = startIndex + pageSize;
                const pageData = filteredLeaves.slice(startIndex, endIndex);

                setShortLeaves(pageData);
            } else {
                setError(response.message || 'Failed to fetch short leaves');
                setShortLeaves([]);
                setAllShortLeaves([]);
                setTotalRecords(0);
                setTotalPages(0);
            }
        } catch (err) {
            setError('Network error occurred while fetching short leaves');
            console.error('Error fetching short leaves:', err);

            await logError({
                controllerName: 'ShortLeaveList',
                methodName: 'LoadShortLeaves',
                requestUrl: 'shortLeaveApi.getAllShortLeavesPage',
                requestPayload: { page, pageSize, search },
                error: err
            });

            setShortLeaves([]);
            setAllShortLeaves([]);
            setTotalRecords(0);
            setTotalPages(0);
        } finally {
            setLoading(false);
        }
    };

    // Handle Search
    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchTerm(value);
        setCurrentPage(1);
        loadShortLeaves(1, entriesPerPage, value);
    };

    // Pagination handlers
    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        loadShortLeaves(page, entriesPerPage, searchTerm);
    };

    const handleEntriesPerPageChange = (newEntriesPerPage: number) => {
        setEntriesPerPage(newEntriesPerPage);
        setCurrentPage(1);
        loadShortLeaves(1, newEntriesPerPage, searchTerm);
    };

    const handlePrevious = () => {
        if (currentPage > 1) {
            handlePageChange(currentPage - 1);
        }
    };

    const handleNext = () => {
        if (currentPage < totalPages) {
            handlePageChange(currentPage + 1);
        }
    };

    useEffect(() => {
        const loadInitialData = async () => {
            const statusRes = await shortLeaveApi.getStatusDropdown();
            if (statusRes.success && statusRes.data) {
                const map: Record<string, string> = {};
                statusRes.data.forEach(item => {
                    const key = item.code || item.name;
                    map[key] = item.name;
                    if (item.name) map[item.name] = item.name;
                });
                setStatusMap(map);
            }
            loadShortLeaves();
        };
        loadInitialData();
    }, [currentUser]);



    // Format time
    const formatTime = (timeString: string) => {
        if (!timeString) return '-';
        const time = new Date(timeString);
        return time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    };

    const columns = [
        {
            key: 'id',
            label: 'Sr No.',
            width: '80px',
            render: (_: any, __: ShortLeave, index: number) => ((currentPage - 1) * entriesPerPage) + index + 1
        },
        {
            key: 'employeeName',
            label: 'Employee Name',
            width: '200px',
            sortable: true
        },
        {
            key: 'leaveDate',
            label: 'Leave Date',
            width: '120px',
            sortable: true,
            render: (value: string) => (
                <span style={{ fontWeight: '500' }}>
                    {formatDate(value)}
                </span>
            )
        },
        {
            key: 'fromTime',
            label: 'From Time',
            width: '100px',
            sortable: true,
            render: (value: string) => (
                <span style={{ color: 'var(--admin-info)' }}>
                    {formatTime(value)}
                </span>
            )
        },
        {
            key: 'toTime',
            label: 'To Time',
            width: '100px',
            sortable: true,
            render: (value: string) => (
                <span style={{ color: 'var(--admin-info)' }}>
                    {formatTime(value)}
                </span>
            )
        },
        {
            key: 'totalMinutes',
            label: 'Duration (Mins)',
            width: '120px',
            sortable: true,
            render: (value: number) => (
                <span style={{ color: 'var(--admin-primary)', fontWeight: '600' }}>
                    {value}
                </span>
            )
        },
        {
            key: 'status',
            label: 'Status',
            width: '150px',
            sortable: true,
            render: (value: string) => {
                let statusColor = 'var(--admin-gray-600)';
                if (value?.toLowerCase() === 'approved') statusColor = 'var(--admin-success)';
                else if (value?.toLowerCase() === 'pending') statusColor = 'var(--admin-warning)';
                else if (value?.toLowerCase() === 'rejected') statusColor = 'var(--admin-danger)';

                return (
                    <span className="user-role-badge" style={{ backgroundColor: statusColor, color: 'white' }}>
                        {statusMap[value] || value || '-'}
                    </span>
                );
            }
        },
        {
            key: 'approvedFrom',
            label: 'Approved From',
            width: '150px',
            sortable: true,
            render: (value: string) => (
                <span style={{ fontSize: '13px', color: 'var(--admin-gray-700)' }}>
                    {value || '-'}
                </span>
            )
        },
        {
            key: 'approvedDate',
            label: 'Approved Date',
            width: '120px',
            sortable: true,
            render: (value: string) => (
                <span style={{ fontSize: '13px' }}>
                    {formatDate(value)}
                </span>
            )
        }
    ];

    // Handle delete short leave
    const handleDeleteShortLeave = async () => {
        if (!deleteDialog.shortLeave) return;
        if (!deleteDialog.shortLeave.id) {
            setError('Cannot delete short leave: Invalid ID');
            return;
        }

        try {
            const response = await shortLeaveApi.deleteShortLeave(deleteDialog.shortLeave.id);
            if (response.success) {
                await loadShortLeaves();
                setDeleteDialog({ isOpen: false, shortLeave: null });
                showSuccess('Short leave deleted successfully!');
            } else {
                setError(response.message || 'Failed to delete short leave');
            }
        } catch (err) {
            setError('Network error occurred while deleting short leave');
            console.error('Error deleting short leave:', err);
            await logError({
                controllerName: 'ShortLeaveList',
                methodName: 'DeleteShortLeave',
                requestUrl: `shortLeaveApi.deleteShortLeave/${deleteDialog.shortLeave?.id}`,
                requestPayload: { shortLeaveId: deleteDialog.shortLeave?.id },
                error: err
            });
        }
    };

    return (
        <div className="admin-page">
            <div className="admin-page-header">
                <div>
                    <h1 className="admin-page-title">Short Leave</h1>
                    <p className="admin-page-subtitle">Manage Short Leave Request</p>
                </div>
                <div className="admin-page-actions">
                    {/* <PermissionGuard controller="ShortLeave" permission="add"> */}
                    <Link to="/admin/short-leaves/new" className="admin-btn admin-btn-primary">
                        <i className="fa-solid fa-plus"></i>
                        Add Short Leave
                    </Link>
                    {/* </PermissionGuard> */}
                </div>
            </div>

            {error && (
                <div className="admin-alert admin-alert-error">
                    <i className="fa-solid fa-circle-exclamation"></i>
                    {error}
                    <button
                        onClick={() => setError(null)}
                        style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'inherit' }}
                    >
                        <i className="fa-solid fa-times"></i>
                    </button>
                </div>
            )}

            <div className="admin-card">
                <div className="admin-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <h2 style={{ margin: 0 }}>{loading ? 'Loading...' : `${totalRecords} Short Leave`}</h2>

                        {/* Search Input */}
                        <div className="admin-search-wrapper">
                            <i className="fa-solid fa-search admin-search-icon"></i>
                            <input
                                type="text"
                                placeholder="Search Short Leave..."
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
                            <p>Loading Short Leaves...</p>
                        </div>
                    ) : shortLeaves.length === 0 ? (
                        <div className="admin-table-empty">
                            <i className="fa-solid fa-clock"></i>
                            <h3>No Short Leaves Found</h3>
                            <p>No short leave records are available in the system.</p>
                        </div>
                    ) : (
                        <>
                            <DataTable
                                columns={columns}
                                data={shortLeaves}
                                onEdit={(leave: ShortLeave) => navigate(`/admin/short-leaves/${leave.id}/edit`, { state: { shortLeaveData: leave } })}
                                onDelete={(leave: ShortLeave) => setDeleteDialog({ isOpen: true, shortLeave: leave })}
                            />

                            {/* Pagination Controls */}
                            <div className="admin-pagination">
                                <div className="admin-pagination-info">
                                    Showing {((currentPage - 1) * entriesPerPage) + 1} To {Math.min(currentPage * entriesPerPage, totalRecords)} Of {totalRecords} Entries
                                </div>

                                <div className="admin-pagination-controls">
                                    <button
                                        onClick={handlePrevious}
                                        disabled={currentPage <= 1}
                                        className="admin-pagination-btn"
                                    >
                                        <i className="fa-solid fa-chevron-left" style={{ fontSize: '11px' }}></i> Previous
                                    </button>

                                    <div className="admin-pagination-pages">
                                        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                                            let pageNum;
                                            if (totalPages <= 5) {
                                                pageNum = i + 1;
                                            } else if (currentPage <= 3) {
                                                pageNum = i + 1;
                                            } else if (currentPage >= totalPages - 2) {
                                                pageNum = totalPages - 4 + i;
                                            } else {
                                                pageNum = currentPage - 2 + i;
                                            }

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

                                    <button
                                        onClick={handleNext}
                                        disabled={currentPage >= totalPages}
                                        className="admin-pagination-btn"
                                    >
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
                title="Delete Short Leave"
                message={`Are you sure you want to delete this short leave request?`}
                confirmText="Delete"
                type="danger"
                onConfirm={handleDeleteShortLeave}
                onCancel={() => setDeleteDialog({ isOpen: false, shortLeave: null })}
            />
        </div>
    );
}
