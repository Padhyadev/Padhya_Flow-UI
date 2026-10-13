import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams, useLocation } from 'react-router-dom';
import { cityApi, City } from '../../services/api/cityApi';
import { Region } from '../../services/api/regionApi';
import { Country } from '../../services/api/countryApi';
import DataTable, { Column } from '../../components/DataTable';
import ConfirmDialog from '../../components/ConfirmDialog';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import '../../styles/admin.css';
import '../../styles/admin-components.css';

export default function CityList() {
    const { countryId, stateId } = useParams();
    const location = useLocation();
    const { user: currentUser } = useAuth();
    const { showSuccess, showError } = useToast();
    const navigate = useNavigate();

    const state = location.state?.state as Region | undefined;
    const country = location.state?.country as Country | undefined;

    const [cities, setCities] = useState<City[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; city: City | null }>({
        isOpen: false,
        city: null
    });

    const [searchTerm, setSearchTerm] = useState('');

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [entriesPerPage, setEntriesPerPage] = useState(10);
    const [totalRecords, setTotalRecords] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    const loadCities = async (page: number = currentPage, pageSize: number = entriesPerPage, search: string = searchTerm) => {
        try {
            setLoading(true);
            setError(null);

            const start = (page - 1) * pageSize;
            const response = await cityApi.getAllCitiesPage(start, pageSize, 'asc');

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

                // Filter by stateId and countryId
                if (stateId && countryId) {
                    fetchedData = fetchedData.filter((city: City) =>
                        city.regionId === parseInt(stateId) && city.countryId === parseInt(countryId)
                    );
                }

                const totalCount = fetchedData.length;

                setCities(fetchedData);
                setTotalRecords(totalCount);
                setTotalPages(Math.ceil(totalCount / pageSize));
            } else {
                setError(response.message || 'Failed to fetch cities');
                setCities([]);
            }
        } catch (err) {
            setError('Network error occurred while fetching cities');
            console.error('Error fetching cities:', err);
            setCities([]);
        } finally {
            setLoading(false);
        }
    };

    // Search & Pagination Handlers
    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchTerm(value);
        setCurrentPage(1);
        loadCities(1, entriesPerPage, value);
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        loadCities(page, entriesPerPage, searchTerm);
    };

    const handleEntriesPerPageChange = (newEntriesPerPage: number) => {
        setEntriesPerPage(newEntriesPerPage);
        setCurrentPage(1);
        loadCities(1, newEntriesPerPage, searchTerm);
    };

    const handlePrevious = () => {
        if (currentPage > 1) handlePageChange(currentPage - 1);
    };

    const handleNext = () => {
        if (currentPage < totalPages) handlePageChange(currentPage + 1);
    };

    useEffect(() => {
        loadCities();
    }, [currentUser, countryId, stateId]);

    const handleDeleteCity = async () => {
        if (!deleteDialog.city) return;

        try {
            const response = await cityApi.deleteCity(
                deleteDialog.city.cityId,
                currentUser?.id ? Number(currentUser.id) : 0
            );
            if (response.success) {
                await loadCities();
                setDeleteDialog({ isOpen: false, city: null });
                showSuccess('City deleted successfully!');
            } else {
                showError(response.message || 'Failed to delete city');
            }
        } catch (err) {
            showError('Network error occurred while deleting city');
        }
    };

    const columns: Column<City>[] = [
        {
            key: 'cityId',
            label: 'Sr No.',
            render: (_: any, __: City, index: number) => ((currentPage - 1) * entriesPerPage) + index + 1
        },
        {
            key: 'cityName',
            label: 'City Name',
            sortable: true
        }
    ];

    return (
        <div className="admin-page">
            <div className="admin-page-header">
                <div>
                    <h1 className="admin-page-title">City Management - {state?.regionName || 'State'}</h1>
                    <p className="admin-page-subtitle">{country?.countryName || 'Country'}</p>
                </div>
                <div className="admin-page-actions">
                    <button
                        onClick={() => navigate(`/admin/countries/${countryId}/states`, { state: { country } })}
                        className="admin-btn admin-btn-secondary"
                    >
                        <i className="fa-solid fa-arrow-left"></i> Back to List
                    </button>
                    <Link
                        to={`/admin/countries/${countryId}/states/${stateId}/cities/add`}
                        state={{ state, country }}
                        className="admin-btn admin-btn-primary"
                    >
                        <i className="fa-solid fa-plus"></i>
                        Add City
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
                        <h2 style={{ margin: 0 }}>{loading ? 'Loading...' : `${totalRecords} City`}</h2>
                        <div className="admin-search-wrapper">
                            <i className="fa-solid fa-search admin-search-icon"></i>
                            <input
                                type="text"
                                placeholder="Search City..."
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
                            <p>Loading Cities...</p>
                        </div>
                    ) : cities.length === 0 ? (
                        <div className="admin-table-empty">
                            <i className="fa-solid fa-city"></i>
                            <h3>No Cities Found</h3>
                            <p>No cities recorded for this state.</p>
                        </div>
                    ) : (
                        <>
                            <DataTable
                                keyField="cityId"
                                columns={columns}
                                data={cities}
                                onEdit={(city: City) => navigate(`/admin/countries/${countryId}/states/${stateId}/cities/edit/${city.cityId}`, { state: { cityData: city, state, country } })}
                                onDelete={(city: City) => setDeleteDialog({ isOpen: true, city })}
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
                title="Delete City"
                message={`Are you sure you want to delete city "${deleteDialog.city?.cityName}"?`}
                confirmText="Delete"
                type="danger"
                onConfirm={handleDeleteCity}
                onCancel={() => setDeleteDialog({ isOpen: false, city: null })}
            />
        </div>
    );
}
