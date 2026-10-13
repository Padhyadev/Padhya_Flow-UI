import React, { useState, useEffect } from 'react';
import { formatDate } from '../../utils/dateUtils';
import { Link, useNavigate } from 'react-router-dom';
import { ClientFollowup, clientFollowupApi, ClientFollowupStatusHistory } from '../../services/api/clientFollowupApi';
import DataTable, { Column } from '../../components/DataTable';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import PermissionGuard from '../../components/PermissionGuard';
import { usePermissions } from '../../hooks/usePermissions';
import { logError } from '../../utils/logError';
import '../../styles/admin.css';
import '../../styles/admin-components.css';

export default function ClientFollowupList() {
    const { user: currentUser } = useAuth();
    const { showSuccess, showError } = useToast();
    const navigate = useNavigate();
    const permissions = usePermissions('ClientFollowup');
    const [followups, setFollowups] = useState<ClientFollowup[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [searchTerm, setSearchTerm] = useState('');
    const [allFollowups, setAllFollowups] = useState<ClientFollowup[]>([]);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [entriesPerPage, setEntriesPerPage] = useState(10);
    const [totalRecords, setTotalRecords] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    const loadFollowups = async (page: number = currentPage, pageSize: number = entriesPerPage, search: string = searchTerm) => {
        try {
            setLoading(true);
            setError(null);

            const totalResponse = await clientFollowupApi.getAllClientFollowupsPage(0, 1000, 'asc');

            if (totalResponse.success) {
                const fetchedFollowups = totalResponse.data || [];
                setAllFollowups(fetchedFollowups);

                // Global Filter: Search across all fields
                const filteredFollowups = fetchedFollowups.filter(followup => {
                    const searchStr = search.toLowerCase();
                    return Object.values(followup).some(value =>
                        value !== null &&
                        value !== undefined &&
                        String(value).toLowerCase().includes(searchStr)
                    );
                });

                const totalCount = filteredFollowups.length;
                setTotalRecords(totalCount);
                setTotalPages(Math.ceil(totalCount / pageSize));

                // Slice data for current page
                const startIndex = (page - 1) * pageSize;
                const endIndex = startIndex + pageSize;
                const pageData = filteredFollowups.slice(startIndex, endIndex);

                setFollowups(pageData);
            } else {
                setError(totalResponse.message || 'Failed to fetch client followups');
                setFollowups([]);
                setAllFollowups([]);
                setTotalRecords(0);
                setTotalPages(0);
            }
        } catch (err) {
            setError('Network error occurred while fetching client followups');
            console.error('Error fetching client followups:', err);

            await logError({
                controllerName: 'ClientFollowupList',
                methodName: 'LoadFollowups',
                requestUrl: 'clientFollowupApi.getAllClientFollowupsPage',
                requestPayload: { page, pageSize, search },
                error: err
            });

            setFollowups([]);
            setAllFollowups([]);
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
        loadFollowups(1, entriesPerPage, value);
    };

    // Pagination handlers
    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        loadFollowups(page, entriesPerPage, searchTerm);
    };

    const handleEntriesPerPageChange = (newEntriesPerPage: number) => {
        setEntriesPerPage(newEntriesPerPage);
        setCurrentPage(1);
        loadFollowups(1, newEntriesPerPage, searchTerm);
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
        loadFollowups();
    }, [currentUser]);



    const columns: Column<ClientFollowup>[] = [
        {
            key: 'followupId',
            label: 'Sr No.',
            width: '80px',
            render: (_: any, __: ClientFollowup, index: number) => ((currentPage - 1) * entriesPerPage) + index + 1
        },
        {
            key: 'projectName',
            label: 'Project Name',
            width: '250px',
            sortable: true
        },
        {
            key: 'nextFollowupDate',
            label: 'Next Followup Date',
            width: '180px',
            sortable: true,
            render: (value: string) => formatDate(value)
        },
        {
            key: 'status',
            label: 'Status',
            width: '200px',
            sortable: true,
            render: (val: string) => {
                let statusColor = 'var(--admin-gray-600)';
                const status = val?.toLowerCase();
                if (status === 'completed' || status === 'closed' || status === 'won') {
                    statusColor = 'var(--admin-success)';
                } else if (status === 'pending' || status === 'in progress' || status === 'follow up') {
                    statusColor = 'var(--admin-warning)';
                } else if (status === 'cancelled' || status === 'lost') {
                    statusColor = 'var(--admin-danger)';
                }

                return (
                    <span style={{
                        color: statusColor,
                        padding: '0',
                        fontSize: '14px',
                        fontWeight: '600',
                        display: 'inline-block'
                    }}>
                        {val || '-'}
                    </span>
                );
            }
        },
        {
            key: 'remarks',
            label: 'Remarks',
            width: '350px',
            sortable: true,
            render: (value: string) => (
                <span style={{ fontSize: '13px', color: 'var(--admin-gray-700)' }}>
                    {value || '-'}
                </span>
            )
        }
    ];

    return (
        <div className="admin-page">
            <div className="admin-page-header">
                <div>
                    <h1 className="admin-page-title">Client Followup</h1>
                    <p className="admin-page-subtitle">Manage Client Followup Record</p>
                </div>
                <div className="admin-page-actions">
                    <Link to="/admin/client-followups/new" className="admin-btn admin-btn-primary">
                        <i className="fa-solid fa-plus"></i>
                        Add Client Followup
                    </Link>
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
                        <h2 style={{ margin: 0 }}>{loading ? 'Loading...' : `${totalRecords} Followup`}</h2>

                        <div className="admin-search-wrapper">
                            <i className="fa-solid fa-search admin-search-icon"></i>
                            <input
                                type="text"
                                placeholder="Search Followup..."
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
                            <p>Loading Followups...</p>
                        </div>
                    ) : followups.length === 0 ? (
                        <div className="admin-table-empty">
                            <i className="fa-solid fa-clipboard-list"></i>
                            <h3>No Followups Found</h3>
                            <p>No client followup records are available in the system.</p>
                        </div>
                    ) : (
                        <>
                            <DataTable
                                columns={columns}
                                data={followups}
                                loading={loading}
                                onView={(followup: ClientFollowup) => navigate(`/admin/client-followups/${followup.followupId}/history`)}
                                customActions={(followup: ClientFollowup) => (
                                    <button
                                        className="admin-btn-icon"
                                        onClick={() => navigate(`/admin/client-followups/${followup.followupId}/edit`, { state: { followupData: followup } })}
                                        title="Update Status"
                                        style={{
                                            backgroundColor: 'var(--admin-primary)',
                                            color: 'white',
                                            border: 'none',
                                            boxShadow: 'var(--admin-shadow-sm)'
                                        }}
                                    >
                                        <i className="fa-solid fa-plus"></i>
                                    </button>
                                )}
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

        </div>
    );
}
