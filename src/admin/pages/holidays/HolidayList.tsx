import React, { useState, useEffect } from 'react';
import { formatDate } from '../../utils/dateUtils';
import { Link, useNavigate } from 'react-router-dom';
import { holidayApi, Holiday } from '../../services/api/holidayApi';
import DataTable, { Column } from '../../components/DataTable';
import ConfirmDialog from '../../components/ConfirmDialog';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import PermissionGuard from '../../components/PermissionGuard';
import { usePermissions } from '../../hooks/usePermissions';
import { logError } from '../../utils/logError';
import '../../styles/admin.css';
import '../../styles/admin-components.css';

export default function HolidayList() {
    const { user: currentUser } = useAuth();
    const { showSuccess } = useToast();
    const navigate = useNavigate();
    const permissions = usePermissions('Holiday'); // Or 'HolidayMaster'
    const [holidays, setHolidays] = useState<Holiday[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; holiday: Holiday | null }>({
        isOpen: false,
        holiday: null
    });

    const [searchTerm, setSearchTerm] = useState('');
    const [allHolidays, setAllHolidays] = useState<Holiday[]>([]);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [entriesPerPage, setEntriesPerPage] = useState(10);
    const [totalRecords, setTotalRecords] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    // Format date for display


    const loadHolidays = async (page: number = currentPage, pageSize: number = entriesPerPage, search: string = searchTerm) => {
        try {
            setLoading(true);
            setError(null);

            // Fetch larger batch for client-side filtering/pagination
            const response = await holidayApi.getAllHolidaysPage(0, 1000);

            if (response.success) {
                const fetchedData = response.data || [];
                setAllHolidays(fetchedData);

                // Filter
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

                // Slice
                const startIndex = (page - 1) * pageSize;
                const endIndex = startIndex + pageSize;
                const pageData = filtered.slice(startIndex, endIndex);

                setHolidays(pageData);
            } else {
                setError(response.message || 'Failed to fetch holidays');
                setHolidays([]);
            }
        } catch (err) {
            setError('Network error occurred while fetching holidays');
            console.error('Error fetching holidays:', err);
            await logError({
                controllerName: 'HolidayList',
                methodName: 'LoadHolidays',
                requestUrl: 'holidayApi.getAllHolidaysPage',
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
        loadHolidays(1, entriesPerPage, value);
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        loadHolidays(page, entriesPerPage, searchTerm);
    };

    const handleEntriesPerPageChange = (newEntriesPerPage: number) => {
        setEntriesPerPage(newEntriesPerPage);
        setCurrentPage(1);
        loadHolidays(1, newEntriesPerPage, searchTerm);
    };

    const handlePrevious = () => {
        if (currentPage > 1) handlePageChange(currentPage - 1);
    };

    const handleNext = () => {
        if (currentPage < totalPages) handlePageChange(currentPage + 1);
    };

    useEffect(() => {
        loadHolidays();
    }, [currentUser]);

    const handleDeleteHoliday = async () => {
        if (!deleteDialog.holiday) return;

        try {
            const response = await holidayApi.deleteHoliday(
                deleteDialog.holiday.id,
                currentUser?.id ? Number(currentUser.id) : 0
            );
            if (response.success) {
                await loadHolidays();
                setDeleteDialog({ isOpen: false, holiday: null });
                showSuccess('Holiday deleted successfully!');
            } else {
                setError(response.message || 'Failed to delete holiday');
            }
        } catch (err) {
            setError('Network error occurred while deleting holiday');
        }
    };

    const columns: Column<Holiday>[] = [
        {
            key: 'id',
            label: 'Sr No.',
            width: '80px',
            render: (_: any, __: Holiday, index: number) => ((currentPage - 1) * entriesPerPage) + index + 1
        },
        {
            key: 'holiday_Name',
            label: 'Holiday Name',
            width: '250px',
            sortable: true
        },
        {
            key: 'holiday_Date',
            label: 'Date',
            width: '150px',
            render: (value: string) => formatDate(value),
            sortable: true
        },
        {
            key: 'holiday_Year',
            label: 'Year',
            width: '100px',
            sortable: true
        }
    ];

    return (
        <div className="admin-page">
            <div className="admin-page-header">
                <div>
                    <h1 className="admin-page-title">Holiday</h1>
                    <p className="admin-page-subtitle">Manage Company Holiday And Event</p>
                </div>
                <div className="admin-page-actions">
                    <PermissionGuard controller="Holiday" permission="add">
                        <Link to="/admin/holidays/add" className="admin-btn admin-btn-primary">
                            <i className="fa-solid fa-plus"></i>
                            Add Holiday
                        </Link>
                    </PermissionGuard>
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
                        <h2 style={{ margin: 0 }}>{loading ? 'Loading...' : `${totalRecords} Holiday`}</h2>
                        <div className="admin-search-wrapper">
                            <i className="fa-solid fa-search admin-search-icon"></i>
                            <input
                                type="text"
                                placeholder="Search Holiday..."
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
                            <p>Loading Holidays...</p>
                        </div>
                    ) : holidays.length === 0 ? (
                        <div className="admin-table-empty">
                            <i className="fa-solid fa-calendar-xmark"></i>
                            <h3>No Holidays Found</h3>
                            <p>No holiday records available.</p>
                        </div>
                    ) : (
                        <>
                            <DataTable
                                columns={columns}
                                data={holidays}
                                onEdit={permissions.getEditCallback((holiday: Holiday) => navigate(`/admin/holidays/edit/${holiday.id}`, { state: { holidayData: holiday } }))}
                                onDelete={permissions.getDeleteCallback((holiday: Holiday) => setDeleteDialog({ isOpen: true, holiday }))}
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
                title="Delete Holiday"
                message={`Are you sure you want to delete holiday "${deleteDialog.holiday?.holiday_Name}"?`}
                confirmText="Delete"
                type="danger"
                onConfirm={handleDeleteHoliday}
                onCancel={() => setDeleteDialog({ isOpen: false, holiday: null })}
            />
        </div>
    );
}
