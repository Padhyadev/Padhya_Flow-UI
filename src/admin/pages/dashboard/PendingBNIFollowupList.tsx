import React, { useState, useEffect } from 'react';
import { formatDate, formatDateTime } from '../../utils/dateUtils';
import { useNavigate } from 'react-router-dom';
import { dashboardApi } from '../../services/api/dashboardApi';
import { bniFollowupApi } from '../../services/api/bniFollowupApi';
import DataTable from '../../components/DataTable';
import { useToast } from '../../context/ToastContext';
import '../../styles/admin.css';
import '../../styles/admin-components.css';

interface PendingBNIFollowup {
    followupId: number;
    memberName: string;
    followupType: string;
    followupDate: string;
    responseStatus: string;
    nextFollowupDate: string;
    remarks: string;
    [key: string]: any;
}

export default function PendingBNIFollowupList() {
    const { showSuccess, showError } = useToast();
    const navigate = useNavigate();

    const [followups, setFollowups] = useState<PendingBNIFollowup[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [allFollowups, setAllFollowups] = useState<PendingBNIFollowup[]>([]);

    const [lovMaps, setLovMaps] = useState<{
        followupType: Record<string, string>;
        responseStatus: Record<string, string>;
    }>({ followupType: {}, responseStatus: {} });

    useEffect(() => {
        loadLovAssignments();
    }, []);

    const loadLovAssignments = async () => {
        try {
            const [typesRes, statusesRes] = await Promise.all([
                bniFollowupApi.getLovMasterDropdown('BNIFollowupType'),
                bniFollowupApi.getLovMasterDropdown('BNIFollowupStatus')
            ]);

            const newLovMaps = {
                followupType: {} as Record<string, string>,
                responseStatus: {} as Record<string, string>
            };

            if (typesRes.success) {
                typesRes.data.forEach(item => {
                    const key = item.code || item.name;
                    newLovMaps.followupType[key] = item.name;
                    if (item.name) newLovMaps.followupType[item.name] = item.name;
                });
            }

            if (statusesRes.success) {
                statusesRes.data.forEach(item => {
                    const key = item.code || item.name;
                    newLovMaps.responseStatus[key] = item.name;
                    if (item.name) newLovMaps.responseStatus[item.name] = item.name;
                });
            }

            setLovMaps(newLovMaps);
        } catch (error) {
            console.error('Error loading LOV data:', error);
        }
    };

    // Pagination constants
    const [currentPage, setCurrentPage] = useState(1);
    const [entriesPerPage, setEntriesPerPage] = useState(10);
    const [totalRecords, setTotalRecords] = useState(0);

    const loadFollowups = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await dashboardApi.getPendingBNIFollowups(0, 1000, 'asc');

            if (response.success) {
                const data = response.data || [];
                // Map the data to ensure fields exist, based on what we saw in BNIFollowupList
                const mappedData = data.map((item: any) => ({
                    followupId: item.followupId || item.FollowupId,
                    memberName: item.memberName || item.MemberName || '',
                    followupType: item.followupType || item.FollowupType || '',
                    followupDate: item.followupDate || item.FollowupDate || item.followupDateUTC || item.FollowupDateUTC || '',
                    responseStatus: item.responseStatus || item.ResponseStatus || '',
                    nextFollowupDate: item.nextFollowupDate || item.NextFollowupDate || item.nextFollowupDateUTC || item.NextFollowupDateUTC || '',
                    remarks: item.remarks || item.Remarks || ''
                }));

                setAllFollowups(mappedData);
                filterAndPaginate(mappedData, searchTerm, currentPage, entriesPerPage);
            } else {
                setError(response.message || 'Failed to fetch pending BNI followups');
                setFollowups([]);
            }
        } catch (err) {
            setError('Network error occurred');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const filterAndPaginate = (data: PendingBNIFollowup[], search: string, page: number, size: number) => {
        let filtered = data;
        if (search) {
            const lowerSearch = search.toLowerCase();
            filtered = data.filter(item =>
                String(item.memberName || '').toLowerCase().includes(lowerSearch) ||
                String(item.followupType || '').toLowerCase().includes(lowerSearch) ||
                String(item.responseStatus || '').toLowerCase().includes(lowerSearch) ||
                String(item.remarks || '').toLowerCase().includes(lowerSearch)
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
            key: 'followupId',
            label: 'Sr No.',
            render: (_: any, __: any, index: number) => ((currentPage - 1) * entriesPerPage) + index + 1
        },
        {
            key: 'memberName',
            label: 'Member Name',
            sortable: true,
            render: (value: string) => <span style={{ fontWeight: 500 }}>{value || '-'}</span>
        },
        {
            key: 'followupType',
            label: 'Type',
            sortable: true,
            render: (value: string) => lovMaps.followupType[value] || value || '-'
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
            key: 'responseStatus',
            label: 'Status',
            sortable: true,
            render: (val: string) => {
                let color = 'var(--admin-gray-600)';
                const displayValue = lovMaps.responseStatus[val] || val || '-';
                const status = String(displayValue).toLowerCase().trim();

                if (status === 'completed' || status === 'closed' || status === 'positive') color = 'var(--admin-success)';
                else if (status === 'pending' || status === 'follow up' || status === 'follow-up') color = 'var(--admin-warning)';
                else if (status === 'cancelled' || status === 'negative') color = 'var(--admin-danger)';

                return <span style={{ color, fontWeight: '600', textTransform: 'capitalize' }}>{displayValue}</span>;
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
                    <h1 className="admin-page-title">
                        Pending BNI Followup
                        <span style={{
                            fontSize: '16px',
                            color: 'var(--admin-gray-500)',
                            marginLeft: '10px',
                            fontWeight: 'normal'
                        }}>
                            {/* ({totalRecords}) */}
                        </span>
                    </h1>
                    {/* <p className="admin-page-subtitle">List Of BNI Followups That Require Attention</p> */}
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
                                placeholder="Search BNI Followup..."
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
                        emptyMessage="No Pending BNI Followups Found"
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
