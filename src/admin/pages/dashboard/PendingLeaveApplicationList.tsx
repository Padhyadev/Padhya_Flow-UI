import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardApi, PendingLeaveApplication } from '../../services/api/dashboardApi';
import DataTable from '../../components/DataTable';
import { useToast } from '../../context/ToastContext';
import { formatDate } from '../../utils/dateUtils';
import '../../styles/admin.css';
import '../../styles/admin-components.css';
// import '../../styles/admin-dashboard.css'; // Assuming dashboard specific styles might be needed

export default function PendingLeaveApplicationList() {
    const navigate = useNavigate();
    const { showError } = useToast();

    const [leaves, setLeaves] = useState<PendingLeaveApplication[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [entriesPerPage, setEntriesPerPage] = useState(10);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            // Using the new API method
            const response = await dashboardApi.getPendingLeaveApplications(0, 100, 'asc');
            if (response.success && response.data) {
                console.log('📊 Component received data:', response.data);
                if (response.data.length > 0) {
                    console.log('📊 First item keys:', Object.keys(response.data[0]));
                    console.log('📊 First item totalDays:', response.data[0].totalDays);
                }
                setLeaves(response.data);
            } else {
                showError(response.message || 'Failed to load pending leaves');
            }
        } catch (error) {
            showError('Network error');
        } finally {
            setLoading(false);
        }
    };

    // Filter Logic
    const filteredData = leaves.filter(item =>
        item.employeeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.leaveType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.reason?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Pagination Logic
    const totalRecords = filteredData.length;
    const totalPages = Math.ceil(totalRecords / entriesPerPage);
    const startIndex = (currentPage - 1) * entriesPerPage;
    const paginatedData = filteredData.slice(startIndex, startIndex + entriesPerPage);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const handleEntriesPerPageChange = (value: number) => {
        setEntriesPerPage(value);
        setCurrentPage(1);
    };

    const columns = [
        {
            key: 'leaveId',
            label: 'Sr No.',
            width: '80px',
            render: (_: any, __: any, index: number) => startIndex + index + 1
        },
        {
            key: 'employeeName',
            label: 'Employee Name',
            sortable: true,
            render: (val: string) => <span style={{ fontWeight: 500 }}>{val || '-'}</span>
        },
        {
            key: 'leaveType',
            label: 'Leave Type',
            width: '150px',
            sortable: true,
            render: (val: string) => val || '-'
        },
        {
            key: 'fromDate',
            label: 'From Date',
            width: '120px',
            sortable: true,
            render: (val: string) => formatDate(val)
        },
        {
            key: 'toDate',
            label: 'To Date',
            width: '120px',
            sortable: true,
            render: (val: string) => formatDate(val)
        },
        {
            key: 'totalDays',
            label: 'Days',
            width: '80px',
            sortable: true
            // No render - just display raw value from row.totalDays
        },
        {
            key: 'reason',
            label: 'Reason',
            sortable: true,
            render: (val: string) => (
                <div title={val} style={{ maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {val || '-'}
                </div>
            )
        },
    ];

    return (
        <div className="admin-page">
            <div className="admin-page-header">
                <div>
                    <h1 className="admin-page-title">Pending Leave Application</h1>
                    {/* <p className="admin-page-subtitle">List Of Pending Leave Applications For The Upcoming 60 Days</p> */}
                </div>
                <div className="admin-page-actions">
                    <button onClick={() => navigate('/admin/dashboard')} className="admin-btn admin-btn-secondary">
                        <i className="fa-solid fa-arrow-left"></i> Back to Dashboard
                    </button>
                </div>
            </div>

            <div className="admin-card">
                <div className="admin-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <h2 style={{ margin: 0 }}>{loading ? 'Loading...' : `${totalRecords} item`}</h2>

                        <div className="admin-search-wrapper">
                            <i className="fa-solid fa-search admin-search-icon"></i>
                            <input
                                type="text"
                                placeholder="Search Leave..."
                                value={searchTerm}
                                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                className="admin-search-input"
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
                        </select>
                        <span style={{ fontSize: '14px', color: 'var(--admin-gray-600)' }}>Entries</span>
                    </div>
                </div>
                <div className="admin-card-body" style={{ padding: 0 }}>
                    <DataTable
                        columns={columns}
                        data={paginatedData}
                        loading={loading}
                        emptyMessage="No Pending Leave Applications Found"
                        keyField="leaveId"
                    />

                    {/* Pagination */}
                    {totalRecords > 0 && (
                        <div className="admin-pagination">
                            <div className="admin-pagination-info">
                                Showing {startIndex + 1} to {Math.min(startIndex + entriesPerPage, totalRecords)} of {totalRecords} entries
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
                                            if (currentPage > 3) pageNum = currentPage - 2 + i;
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
