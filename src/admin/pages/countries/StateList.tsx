import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams, useLocation } from 'react-router-dom';
import { regionApi, Region } from '../../services/api/regionApi';
import { Country } from '../../services/api/countryApi';
import DataTable, { Column } from '../../components/DataTable';
import ConfirmDialog from '../../components/ConfirmDialog';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import '../../styles/admin.css';
import '../../styles/admin-components.css';

export default function StateList() {
    const { countryId } = useParams();
    const location = useLocation();
    const { user: currentUser } = useAuth();
    const { showSuccess, showError } = useToast();
    const navigate = useNavigate();

    const country = location.state?.country as Country | undefined;

    const [states, setStates] = useState<Region[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; state: Region | null }>({
        isOpen: false,
        state: null
    });

    const [searchTerm, setSearchTerm] = useState('');

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [entriesPerPage, setEntriesPerPage] = useState(10);
    const [totalRecords, setTotalRecords] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    const loadStates = async (page: number = currentPage, pageSize: number = entriesPerPage, search: string = searchTerm) => {
        try {
            setLoading(true);
            setError(null);

            const start = (page - 1) * pageSize;
            const response = await regionApi.getAllRegionsPage(start, pageSize, 'asc');

            if (response.success) {
                // Ensure fetchedData is always an array
                let fetchedData = response.data || [];

                // Handle if data is nested in another property
                if (!Array.isArray(fetchedData) && (fetchedData as any).data) {
                    fetchedData = (fetchedData as any).data;
                }

                // Final safety check
                if (!Array.isArray(fetchedData)) {
                    fetchedData = [];
                }

                // Filter by countryId
                if (countryId) {
                    fetchedData = fetchedData.filter((state: Region) => state.countryId === parseInt(countryId));
                }

                const totalCount = fetchedData.length;

                setStates(fetchedData);
                setTotalRecords(totalCount);
                setTotalPages(Math.ceil(totalCount / pageSize));
            } else {
                setError(response.message || 'Failed to fetch states');
                setStates([]);
            }
        } catch (err) {
            setError('Network error occurred while fetching states');
            console.error('Error fetching states:', err);
            setStates([]);
        } finally {
            setLoading(false);
        }
    };

    // Search & Pagination Handlers
    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchTerm(value);
        setCurrentPage(1);
        loadStates(1, entriesPerPage, value);
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        loadStates(page, entriesPerPage, searchTerm);
    };

    const handleEntriesPerPageChange = (newEntriesPerPage: number) => {
        setEntriesPerPage(newEntriesPerPage);
        setCurrentPage(1);
        loadStates(1, newEntriesPerPage, searchTerm);
    };

    const handlePrevious = () => {
        if (currentPage > 1) handlePageChange(currentPage - 1);
    };

    const handleNext = () => {
        if (currentPage < totalPages) handlePageChange(currentPage + 1);
    };

    useEffect(() => {
        loadStates();
    }, [currentUser, countryId]);

    const handleDeleteState = async () => {
        if (!deleteDialog.state) return;

        try {
            const response = await regionApi.deleteRegion(
                deleteDialog.state.regionId,
                currentUser?.id ? Number(currentUser.id) : 0
            );
            if (response.success) {
                await loadStates();
                setDeleteDialog({ isOpen: false, state: null });
                showSuccess('State deleted successfully!');
            } else {
                showError(response.message || 'Failed to delete state');
            }
        } catch (err) {
            showError('Network error occurred while deleting state');
        }
    };

    const columns: Column<Region>[] = [
        {
            key: 'regionId',
            label: 'Sr No.',
            render: (_: any, __: Region, index: number) => ((currentPage - 1) * entriesPerPage) + index + 1
        },
        {
            key: 'regionName',
            label: 'State Name',
            sortable: true
        },
        {
            key: 'regionCode',
            label: 'State Code',
            sortable: true
        }
    ];

    return (
        <div className="admin-page">
            <div className="admin-page-header">
                <div>
                    <h1 className="admin-page-title">State Management - {country?.countryName || 'Country'}</h1>
                    <p className="admin-page-subtitle">Manage States For This Country</p>
                </div>
                <div className="admin-page-actions">
                    <button
                        onClick={() => navigate('/admin/countries')}
                        className="admin-btn admin-btn-secondary"
                    >
                        <i className="fa-solid fa-arrow-left"></i> Back to List
                    </button>
                    <Link
                        to={`/admin/countries/${countryId}/states/add`}
                        state={{ country }}
                        className="admin-btn admin-btn-primary"
                    >
                        <i className="fa-solid fa-plus"></i>
                        Add State
                    </Link>
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
                        <h2 style={{ margin: 0 }}>{loading ? 'Loading...' : `${totalRecords} State`}</h2>
                        <div className="admin-search-wrapper">
                            <i className="fa-solid fa-search admin-search-icon"></i>
                            <input
                                type="text"
                                placeholder="Search State..."
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
                            <p>Loading States...</p>
                        </div>
                    ) : states.length === 0 ? (
                        <div className="admin-table-empty">
                            <i className="fa-solid fa-map"></i>
                            <h3>No States Found</h3>
                            <p>No states recorded for this country.</p>
                        </div>
                    ) : (
                        <>
                            <DataTable
                                keyField="regionId"
                                columns={columns}
                                data={states}
                                onEdit={(state: Region) => navigate(`/admin/countries/${countryId}/states/edit/${state.regionId}`, { state: { stateData: state, country } })}
                                onDelete={(state: Region) => setDeleteDialog({ isOpen: true, state })}
                                customActions={(state: Region) => (
                                    <button
                                        className="admin-btn-icon admin-btn-info"
                                        onClick={() => navigate(`/admin/countries/${countryId}/states/${state.regionId}/cities`, { state: { state, country } })}
                                        title="View Cities"
                                    >
                                        <i className="fa-solid fa-building-flag"></i>
                                    </button>
                                )}
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
                title="Delete State"
                message={`Are you sure you want to delete state "${deleteDialog.state?.regionName}"?`}
                confirmText="Delete"
                type="danger"
                onConfirm={handleDeleteState}
                onCancel={() => setDeleteDialog({ isOpen: false, state: null })}
            />
        </div>
    );
}
