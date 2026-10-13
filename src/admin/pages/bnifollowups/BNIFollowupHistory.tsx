import React, { useState, useEffect } from 'react';
import { formatDate, formatDateTime } from '../../utils/dateUtils';
import { useParams, useNavigate } from 'react-router-dom';
import { bniFollowupApi, BNIFollowupHistory } from '../../services/api/bniFollowupApi';
import DataTable, { Column } from '../../components/DataTable';
import { useToast } from '../../context/ToastContext';
import '../../styles/admin.css';
import '../../styles/admin-components.css';

export default function BNIFollowupHistoryPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { showError } = useToast();

    const [items, setItems] = useState<BNIFollowupHistory[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [entriesPerPage, setEntriesPerPage] = useState(10);
    const [memberName, setMemberName] = useState<string>('');

    useEffect(() => {
        if (id) {
            loadData(parseInt(id));
        }
    }, [id]);

    const loadData = async (followupId: number) => {
        setLoading(true);
        try {
            const response = await bniFollowupApi.getFollowupHistory(followupId);
            if (response.success && response.data) {
                setItems(response.data);
                if (response.data.length > 0) {
                    setMemberName(response.data[0].memberName || '');
                }
                setCurrentPage(1);
            } else {
                showError(response.message || 'Failed to load followup history');
            }
        } catch (error) {
            showError('An error occurred while loading followup history');
        } finally {
            setLoading(false);
        }
    };

    // Filter Items based on Search
    const filteredItems = items.filter(item => {
        if (!searchTerm) return true;
        const lowerTerm = searchTerm.toLowerCase();
        return (
            (item.status && item.status.toLowerCase().includes(lowerTerm)) ||
            (item.remarks && item.remarks.toLowerCase().includes(lowerTerm)) ||
            (item.followupByName && item.followupByName.toLowerCase().includes(lowerTerm)) ||
            (item.followupDate && item.followupDate.toLowerCase().includes(lowerTerm))
        );
    });

    // Calculate Pagination
    const totalRecords = filteredItems.length;
    const totalPages = Math.ceil(totalRecords / entriesPerPage);
    const startIndex = (currentPage - 1) * entriesPerPage;
    const paginatedData = filteredItems.slice(startIndex, startIndex + entriesPerPage);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const handleEntriesPerPageChange = (value: number) => {
        setEntriesPerPage(value);
        setCurrentPage(1);
    };

    const columns: Column<BNIFollowupHistory>[] = [
        {
            key: 'id',
            label: 'Sr No.',
            width: '80px',
            render: (_: any, __: any, index: number) => startIndex + index + 1
        },
        {
            key: 'followupDate',
            label: 'Update Date',
            width: '220px',
            sortable: true,
            render: (val: string) => formatDateTime(val)
        },
        {
            key: 'oldStatus',
            label: 'Old Status',
            width: '200px',
            sortable: true,
            render: (val: string) => (
                <span style={{ color: 'var(--admin-gray-600)', fontWeight: '500' }}>{val || '-'}</span>
            )
        },
        {
            key: 'status',
            label: 'New Status',
            width: '200px',
            sortable: true,
            render: (val: string) => {
                let statusColor = 'var(--admin-gray-600)';
                const status = val?.toLowerCase();
                if (status === 'completed' || status === 'closed' || status === 'positive') {
                    statusColor = 'var(--admin-success)';
                } else if (status === 'pending' || status === 'in progress' || status === 'follow up') {
                    statusColor = 'var(--admin-warning)';
                } else if (status === 'cancelled' || status === 'negative') {
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
            key: 'nextFollowupDate',
            label: 'Next Followup',
            width: '150px',
            sortable: true,
            render: (val: string) => formatDate(val)
        },
        {
            key: 'remarks',
            label: 'Remarks',
            width: '350px',
            align: 'left',
            sortable: true,
            render: (val: string) => (
                <span style={{ fontSize: '13px', color: 'var(--admin-gray-700)' }}>
                    {val || '-'}
                </span>
            )
        }
    ];

    return (
        <div className="admin-page">
            <div className="admin-page-header">
                <div>
                    <h1 className="admin-page-title">Followup History {memberName ? `- ${memberName}` : ''}</h1>
                    <p className="admin-page-subtitle">Historical Status Updates For This Followup</p>
                </div>
                <div className="admin-page-actions">
                    <button
                        onClick={() => navigate('/admin/bni-followups')}
                        className="admin-btn admin-btn-secondary"
                    >
                        <i className="fa-solid fa-arrow-left"></i> Back to List
                    </button>
                </div>
            </div>

            <div className="admin-card">
                <div className="admin-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <h2 style={{ margin: 0 }}>{loading ? 'Loading...' : `${totalRecords} Records`}</h2>

                        {/* Search Input */}
                        <div className="admin-search-wrapper">
                            <i className="fa-solid fa-search admin-search-icon"></i>
                            <input
                                type="text"
                                placeholder="Search History..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="admin-search-input"
                            />
                        </div>
                    </div>

                    {/* Entries Per Page Dropdown */}
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
                        </select>
                        <span style={{ fontSize: '14px', color: 'var(--admin-gray-600)' }}>Entries</span>
                    </div>
                </div>

                <div className="admin-card-body" style={{ padding: 0 }}>
                    <DataTable
                        columns={columns}
                        data={paginatedData}
                        loading={loading}
                        emptyMessage="No history records found"
                    />

                    {/* Pagination Controls */}
                    {totalRecords > 0 && (
                        <div className="admin-pagination">
                            <div className="admin-pagination-info">
                                Showing {startIndex + 1} To {Math.min(startIndex + entriesPerPage, totalRecords)} Of {totalRecords} Entries
                            </div>
                            <div className="admin-pagination-controls">
                                <button
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className="admin-pagination-btn"
                                >
                                    <i className="fa-solid fa-chevron-left" style={{ fontSize: '11px' }}></i> Previous
                                </button>

                                <div className="admin-pagination-pages">
                                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                                        let pageNum = i + 1;
                                        if (totalPages > 5) {
                                            if (currentPage > 3) {
                                                pageNum = currentPage - 2 + i;
                                            }
                                            if (pageNum > totalPages) pageNum = totalPages - (4 - i);
                                        }
                                        if (pageNum > 0 && pageNum <= totalPages) {
                                            return (
                                                <button
                                                    key={pageNum}
                                                    onClick={() => handlePageChange(pageNum)}
                                                    className={`admin-pagination-btn ${pageNum === currentPage ? 'active' : ''}`}
                                                >
                                                    {pageNum}
                                                </button>
                                            );
                                        }
                                        return null;
                                    })}
                                </div>

                                <button
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    className="admin-pagination-btn"
                                >
                                    Next <i className="fa-solid fa-chevron-right" style={{ fontSize: '11px' }}></i>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
