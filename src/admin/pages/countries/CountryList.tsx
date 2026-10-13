import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { countryApi, Country } from '../../services/api/countryApi';
import DataTable, { Column } from '../../components/DataTable';
import ConfirmDialog from '../../components/ConfirmDialog';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import '../../styles/admin.css';
import '../../styles/admin-components.css';

export default function CountryList() {
    const { user: currentUser } = useAuth();
    const { showSuccess, showError } = useToast();
    const navigate = useNavigate();

    const [countries, setCountries] = useState<Country[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; country: Country | null }>({
        isOpen: false,
        country: null
    });

    const [searchTerm, setSearchTerm] = useState('');

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [entriesPerPage, setEntriesPerPage] = useState(10);
    const [totalRecords, setTotalRecords] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    const loadCountries = async (page: number = currentPage, pageSize: number = entriesPerPage, search: string = searchTerm) => {
        try {
            setLoading(true);
            setError(null);

            const start = (page - 1) * pageSize;
            const response = await countryApi.getAllCountriesPage(start, pageSize, 'asc');

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

                const totalCount = (response as any).totalRecords || (response as any).recordsTotal || fetchedData.length;

                setCountries(fetchedData);
                setTotalRecords(totalCount);
                setTotalPages(Math.ceil(totalCount / pageSize));
            } else {
                setError(response.message || 'Failed to fetch countries');
                setCountries([]);
            }
        } catch (err) {
            setError('Network error occurred while fetching countries');
            console.error('Error fetching countries:', err);
            setCountries([]);
        } finally {
            setLoading(false);
        }
    };

    // Search & Pagination Handlers
    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchTerm(value);
        setCurrentPage(1);
        loadCountries(1, entriesPerPage, value);
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        loadCountries(page, entriesPerPage, searchTerm);
    };

    const handleEntriesPerPageChange = (newEntriesPerPage: number) => {
        setEntriesPerPage(newEntriesPerPage);
        setCurrentPage(1);
        loadCountries(1, newEntriesPerPage, searchTerm);
    };

    const handlePrevious = () => {
        if (currentPage > 1) handlePageChange(currentPage - 1);
    };

    const handleNext = () => {
        if (currentPage < totalPages) handlePageChange(currentPage + 1);
    };

    useEffect(() => {
        loadCountries();
    }, [currentUser]);

    const handleDeleteCountry = async () => {
        if (!deleteDialog.country) return;

        try {
            const response = await countryApi.deleteCountry(
                deleteDialog.country.countryId,
                currentUser?.id ? Number(currentUser.id) : 0
            );
            if (response.success) {
                await loadCountries();
                setDeleteDialog({ isOpen: false, country: null });
                showSuccess('Country deleted successfully!');
            } else {
                showError(response.message || 'Failed to delete country');
            }
        } catch (err) {
            showError('Network error occurred while deleting country');
        }
    };

    const columns: Column<Country>[] = [
        {
            key: 'countryId',
            label: 'Sr No.',
            render: (_: any, __: Country, index: number) => ((currentPage - 1) * entriesPerPage) + index + 1
        },
        {
            key: 'countryName',
            label: 'Country Name',
            sortable: true
        },
        {
            key: 'countryCode',
            label: 'Country Code',
            sortable: true
        },
        {
            key: 'currencyCode',
            label: 'Currency Code',
            sortable: true
        },
        {
            key: 'timeZone',
            label: 'Time Zone',
            sortable: true
        }
    ];

    return (
        <div className="admin-page">
            <div className="admin-page-header">
                <div>
                    <h1 className="admin-page-title">Country Management</h1>
                    <p className="admin-page-subtitle">Manage Country, State, And City</p>
                </div>
                <div className="admin-page-actions">
                    <Link to="/admin/countries/add" className="admin-btn admin-btn-primary">
                        <i className="fa-solid fa-plus"></i>
                        Add Country
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
                        <h2 style={{ margin: 0 }}>{loading ? 'Loading...' : `${totalRecords} Country`}</h2>
                        <div className="admin-search-wrapper">
                            <i className="fa-solid fa-search admin-search-icon"></i>
                            <input
                                type="text"
                                placeholder="Search Country..."
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
                            <p>Loading Countries...</p>
                        </div>
                    ) : countries.length === 0 ? (
                        <div className="admin-table-empty">
                            <i className="fa-solid fa-globe"></i>
                            <h3>No Countries Found</h3>
                            <p>No countries recorded.</p>
                        </div>
                    ) : (
                        <>
                            <DataTable
                                keyField="countryId"
                                columns={columns}
                                data={countries}
                                onEdit={(country: Country) => navigate(`/admin/countries/edit/${country.countryId}`, { state: { countryData: country } })}
                                onDelete={(country: Country) => setDeleteDialog({ isOpen: true, country })}
                                customActions={(country: Country) => (
                                    <button
                                        className="admin-btn-icon admin-btn-success"
                                        onClick={() => navigate(`/admin/countries/${country.countryId}/states`, { state: { country } })}
                                        title="View States"
                                    >
                                        <i className="fa-solid fa-map-location-dot"></i>
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
                title="Delete Country"
                message={`Are you sure you want to delete country "${deleteDialog.country?.countryName}"?`}
                confirmText="Delete"
                type="danger"
                onConfirm={handleDeleteCountry}
                onCancel={() => setDeleteDialog({ isOpen: false, country: null })}
            />
        </div>
    );
}
