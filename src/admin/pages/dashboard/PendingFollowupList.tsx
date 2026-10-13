import React, { useState, useEffect } from 'react';
import { formatDate } from '../../utils/dateUtils';
import { useNavigate } from 'react-router-dom';
import { dashboardApi, PendingFollowup } from '../../services/api/dashboardApi';
import DataTable from '../../components/DataTable';
import { useToast } from '../../context/ToastContext';
import '../../styles/admin.css';
import '../../styles/admin-components.css';

export default function PendingFollowupList() {
    const { showSuccess, showError } = useToast();
    const navigate = useNavigate();

    const [followups, setFollowups] = useState<PendingFollowup[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [allFollowups, setAllFollowups] = useState<PendingFollowup[]>([]);

    // Pagination constants
    const [currentPage, setCurrentPage] = useState(1);
    const [entriesPerPage, setEntriesPerPage] = useState(10);
    const [totalRecords, setTotalRecords] = useState(0);

    const loadFollowups = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await dashboardApi.getPendingClientFollowups(0, 1000, 'asc');

            if (response.success) {
                const data = response.data || [];
                setAllFollowups(data);
                filterAndPaginate(data, searchTerm, currentPage, entriesPerPage);
            } else {
                setError(response.message || 'Failed to fetch pending followups');
                setFollowups([]);
            }
        } catch (err) {
            setError('Network error occurred');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const filterAndPaginate = (data: PendingFollowup[], search: string, page: number, size: number) => {
        let filtered = data;
        if (search) {
            const lowerSearch = search.toLowerCase();
            filtered = data.filter(item =>
                String(item.projectName || '').toLowerCase().includes(lowerSearch) ||
                String(item.clientName || '').toLowerCase().includes(lowerSearch) ||
                String(item.remarks || '').toLowerCase().includes(lowerSearch) ||
                String(item.clientFollowupStatus || '').toLowerCase().includes(lowerSearch)
            );
        }

        setTotalRecords(filtered.length);
        const start = (page - 1) * size;
        setFollowups(filtered.slice(start, start + size));
    };

    useEffect(() => {
        loadFollowups();
    }, []);

    useEffect(() => {
        filterAndPaginate(allFollowups, searchTerm, currentPage, entriesPerPage);
    }, [searchTerm, currentPage, entriesPerPage, allFollowups]);



    const columns = [
        {
            key: 'id',
            label: 'Sr No.',
            render: (_: any, __: any, index: number) => ((currentPage - 1) * entriesPerPage) + index + 1
        },
        {
            key: 'projectName',
            label: 'Project',
            sortable: true,
            render: (_: any, row: PendingFollowup) => (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontWeight: '600', color: 'var(--admin-primary)' }}>{row.projectName}</span>
                </div>
            )
        },
        {
            key: 'nextFollowupDate',
            label: 'Next Followup',
            sortable: true,
            render: (val: string) => (
                <span style={{ fontWeight: '500' }}>{formatDate(val)}</span>
            )
        },
        {
            key: 'clientFollowupStatus',
            label: 'Status',
            sortable: true,
            render: (val: string) => {
                let color = 'var(--admin-gray-600)';
                const status = String(val || '').toLowerCase().trim();

                if (status === 'won' || status === 'completed' || status === 'meeting scheduled') color = 'var(--admin-success)';
                else if (status === 'pending' || status === 'follow up' || status === 'follow-up') color = 'var(--admin-warning)';
                else if (status === 'lost' || status === 'cancelled') color = 'var(--admin-danger)';

                return <span style={{ color, fontWeight: '600', textTransform: 'capitalize' }}>{val || '-'}</span>;
            }
        },
        {
            key: 'remarks',
            label: 'Remarks',
            render: (val: string) => (
                <div style={{ maxWidth: '250px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={val}>
                    {val || '-'}
                </div>
            )
        }
    ];

    return (
        <div className="admin-page">
            <div className="admin-page-header">
                <div>
                    <h1 className="admin-page-title">Pending Client Followup</h1>
                    {/* <p className="admin-page-subtitle">List Of Followups That Require Attention</p> */}
                </div>
                <div className="admin-page-actions">
                    <button onClick={() => navigate('/admin/dashboard')} className="admin-btn admin-btn-secondary">
                        <i className="fa-solid fa-arrow-left"></i> Back to Dashboard
                    </button>
                </div>
            </div>

            {error && (
                <div className="admin-alert admin-alert-error">
                    <i className="fa-solid fa-circle-exclamation"></i>
                    {error}
                </div>
            )}

            <div className="admin-card">
                <div className="admin-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <h2 style={{ margin: 0 }}>{loading ? 'Loading...' : `${totalRecords} Record`}</h2>
                        <div className="admin-search-wrapper">
                            <i className="fa-solid fa-search admin-search-icon"></i>
                            <input
                                type="text"
                                placeholder="Search Followup..."
                                value={searchTerm}
                                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                className="admin-search-input"
                            />
                        </div>
                    </div>
                </div>

                <div className="admin-card-body" style={{ padding: 0 }}>
                    <DataTable
                        columns={columns}
                        data={followups}
                        loading={loading}
                        onEdit={(row) => navigate(`/admin/client-followups/${row.followupId}/edit`, { state: { followupData: row } })}
                        onView={(row) => navigate(`/admin/client-followups/${row.followupId}/history`)}
                        emptyMessage="No Pending Followups Found"
                    />

                    {/* Pagination */}
                    {!loading && totalRecords > 0 && (
                        <div className="admin-pagination">
                            <div className="admin-pagination-info">
                                Showing {((currentPage - 1) * entriesPerPage) + 1} To {Math.min(currentPage * entriesPerPage, totalRecords)} Of {totalRecords} Entries
                            </div>
                            <div className="admin-pagination-controls">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="admin-pagination-btn"
                                >
                                    Previous
                                </button>
                                <span style={{ margin: '0 10px', fontSize: '14px' }}>Page {currentPage}</span>
                                <button
                                    onClick={() => setCurrentPage(p => (p * entriesPerPage < totalRecords ? p + 1 : p))}
                                    disabled={currentPage * entriesPerPage >= totalRecords}
                                    className="admin-pagination-btn"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
