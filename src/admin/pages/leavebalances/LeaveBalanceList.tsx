import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LeaveBalance, leaveBalanceApi } from '../../services/api/leaveBalanceApi';
import DataTable from '../../components/DataTable';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { usePermissions } from '../../hooks/usePermissions';
import { logError } from '../../utils/logError';
import '../../styles/admin.css';
import '../../styles/admin-components.css';

export default function LeaveBalanceList() {
    const { user: currentUser } = useAuth();
    const { showSuccess, showError } = useToast();
    const navigate = useNavigate();
    const permissions = usePermissions('LeaveBalance');

    const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [allLeaveBalances, setAllLeaveBalances] = useState<LeaveBalance[]>([]);

    // Year filter state
    const [filterYear, setFilterYear] = useState<number>(new Date().getFullYear());
    const [yearInput, setYearInput] = useState<string>(String(new Date().getFullYear()));

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [entriesPerPage, setEntriesPerPage] = useState(10);
    const [totalRecords, setTotalRecords] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    const loadLeaveBalances = async (year: number = filterYear, page: number = currentPage, pageSize: number = entriesPerPage, search: string = searchTerm) => {
        try {
            setLoading(true);
            setError(null);

            console.log('🔥 LeaveBalanceList: Loading leave balances for year:', year);

            const response = await leaveBalanceApi.getByYear(year);

            if (response.success) {
                const fetchedBalances = response.data || [];
                setAllLeaveBalances(fetchedBalances);

                // Global Filter: Search across all fields
                const filteredBalances = fetchedBalances.filter(balance => {
                    const searchStr = search.toLowerCase();
                    return Object.values(balance).some(value =>
                        value !== null &&
                        value !== undefined &&
                        String(value).toLowerCase().includes(searchStr)
                    );
                });

                const totalCount = filteredBalances.length;
                setTotalRecords(totalCount);
                setTotalPages(Math.ceil(totalCount / pageSize));

                // Slice data for current page
                const startIndex = (page - 1) * pageSize;
                const endIndex = startIndex + pageSize;
                const pageData = filteredBalances.slice(startIndex, endIndex);

                setLeaveBalances(pageData);
            } else {
                setError(response.message || 'Failed to fetch leave balances');
                setLeaveBalances([]);
                setAllLeaveBalances([]);
                setTotalRecords(0);
                setTotalPages(0);
            }
        } catch (err) {
            setError('Network error occurred while fetching leave balances');
            console.error('Error fetching leave balances:', err);

            await logError({
                controllerName: 'LeaveBalanceList',
                methodName: 'LoadLeaveBalances',
                requestUrl: 'leaveBalanceApi.getByYear',
                requestPayload: { year, page, pageSize, search },
                error: err
            });

            setLeaveBalances([]);
            setAllLeaveBalances([]);
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
        loadLeaveBalances(filterYear, 1, entriesPerPage, value);
    };

    // Handle Year Filter
    const handleViewYear = () => {
        const year = parseInt(yearInput);
        if (isNaN(year) || year < 2000 || year > 2100) {
            showError('Please enter a valid year between 2000 and 2100');
            return;
        }
        setFilterYear(year);
        setCurrentPage(1);
        loadLeaveBalances(year, 1, entriesPerPage, searchTerm);
    };

    // Handle Allocate Leave Balance
    const [allocating, setAllocating] = useState(false);

    const handleAllocate = async () => {
        const year = parseInt(yearInput);
        if (isNaN(year) || year < 2000 || year > 2100) {
            showError('Please enter a valid year between 2000 and 2100');
            return;
        }

        try {
            setAllocating(true);
            console.log('🔥 LeaveBalanceList: Allocating leave balance for year:', year);

            const response = await leaveBalanceApi.allocate(year);

            if (response.success) {
                showSuccess(`Leave balance allocated successfully for year ${year}`);
                // Reload the data for the allocated year
                setFilterYear(year);
                setCurrentPage(1);
                loadLeaveBalances(year, 1, entriesPerPage, searchTerm);
            } else {
                showError(response.message || 'Failed to allocate leave balance');
            }
        } catch (err) {
            console.error('Error allocating leave balance:', err);
            showError('Network error occurred while allocating leave balance');

            await logError({
                controllerName: 'LeaveBalanceList',
                methodName: 'AllocateLeaveBalance',
                requestUrl: 'leaveBalanceApi.allocate',
                requestPayload: { year },
                error: err
            });
        } finally {
            setAllocating(false);
        }
    };

    // Pagination handlers
    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        loadLeaveBalances(filterYear, page, entriesPerPage, searchTerm);
    };

    const handleEntriesPerPageChange = (newEntriesPerPage: number) => {
        setEntriesPerPage(newEntriesPerPage);
        setCurrentPage(1);
        loadLeaveBalances(filterYear, 1, newEntriesPerPage, searchTerm);
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
        loadLeaveBalances();
    }, [currentUser]);

    const columns = [
        {
            key: 'id',
            label: 'Sr No.',
            render: (_: any, __: LeaveBalance, index: number) => ((currentPage - 1) * entriesPerPage) + index + 1
        },
        {
            key: 'employeeName',
            label: 'Employee Name',
            sortable: true
        },
        {
            key: 'leaveYear',
            label: 'Year',
            sortable: true,
            render: (value: number) => (
                <span style={{ fontWeight: '600', color: 'var(--admin-primary)' }}>
                    {value}
                </span>
            )
        },
        {
            key: 'cl',
            label: 'Casual Leave',
            sortable: true,
            render: (value: number) => (
                <span style={{ color: 'var(--admin-success)', fontWeight: '500' }}>
                    {value}
                </span>
            )
        },
        {
            key: 'sl',
            label: 'Sick Leave',
            sortable: true,
            render: (value: number) => (
                <span style={{ color: 'var(--admin-info)', fontWeight: '500' }}>
                    {value}
                </span>
            )
        },
        {
            key: 'totalLeaves',
            label: 'Total Leave',
            sortable: true,
            render: (value: number) => (
                <span style={{ color: 'var(--admin-primary)', fontWeight: '600' }}>
                    {value}
                </span>
            )
        },
        {
            key: 'usedLeaves',
            label: 'Used Leave',
            sortable: true,
            render: (value: number) => (
                <span style={{ color: 'var(--admin-warning)', fontWeight: '500' }}>
                    {value}
                </span>
            )
        },
        {
            key: 'balanceLeaves',
            label: 'Balance Leave',
            sortable: true,
            render: (value: number) => (
                <span style={{ color: 'var(--admin-success)', fontWeight: '600' }}>
                    {value}
                </span>
            )
        }
    ];

    return (
        <div className="admin-page">
            <div className="admin-page-header">
                <div>
                    <h1 className="admin-page-title">Leave Balance</h1>
                    <p className="admin-page-subtitle">Manage Leave Balance Allocation</p>
                </div>
                <div className="admin-page-actions">
                    <button
                        onClick={() => navigate('/admin/leave-balances/allocate')}
                        className="admin-btn admin-btn-primary"
                    >
                        <i className="fa-solid fa-plus"></i> Add Leave Balance
                    </button>
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
                {/* Year Filter Section */}
                <div className="admin-card-header" style={{ borderBottom: '1px solid var(--admin-gray-200)', paddingBottom: '15px', marginBottom: '15px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                        <label style={{ fontSize: '14px', fontWeight: '500', color: 'var(--admin-gray-700)' }}>
                            Filter by Year:
                        </label>
                        <input
                            type="number"
                            value={yearInput}
                            onChange={(e) => setYearInput(e.target.value)}
                            placeholder="Enter Year"
                            className="admin-form-control"
                            style={{ width: '150px', padding: '8px 12px' }}
                            min="2000"
                            max="2100"
                        />
                        <button
                            onClick={handleViewYear}
                            className="admin-btn admin-btn-primary"
                            style={{ padding: '8px 20px' }}
                            disabled={allocating}
                        >
                            <i className="fa-solid fa-eye"></i>
                            View
                        </button>
                        {/* <button
                            onClick={handleAllocate}
                            className="admin-btn admin-btn-success"
                            style={{ padding: '8px 20px' }}
                            disabled={allocating}
                        > */}
                        {/* {allocating ? (
                            <>
                                <i className="fa-solid fa-spinner fa-spin"></i>
                                Allocating...
                            </>
                        ) : ( */}
                        {/* // <>
                            //     <i className="fa-solid fa-check"></i>
                            //     Allocate
                            // </> */}
                        {/* )} */}
                        {/* </button> */}
                        <span style={{ fontSize: '13px', color: 'var(--admin-gray-500)', marginLeft: '10px' }}>
                            Currently showing: <strong style={{ color: 'var(--admin-primary)' }}>{filterYear}</strong>
                        </span>
                    </div>
                </div>

                {/* Table Header with Search and Pagination Controls */}
                <div className="admin-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <h2 style={{ margin: 0 }}>{loading ? 'Loading...' : `${totalRecords} Record`}</h2>

                        {/* Search Input */}
                        <div className="admin-search-wrapper">
                            <i className="fa-solid fa-search admin-search-icon"></i>
                            <input
                                type="text"
                                placeholder="Search Leave Balance..."
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
                            <p>Loading Leave Balances...</p>
                        </div>
                    ) : leaveBalances.length === 0 ? (
                        <div className="admin-table-empty">
                            <i className="fa-solid fa-calendar-check"></i>
                            <h3>No Leave Balances Found</h3>
                            <p>No leave balance records are available for year {filterYear}.</p>
                        </div>
                    ) : (
                        <>
                            <DataTable
                                columns={columns}
                                data={leaveBalances}
                                onEdit={undefined}
                                onDelete={undefined}
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
        </div >
    );
}
