import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { officeExpenseTypeApi, OfficeExpenseType } from '../../services/api/officeExpenseTypeApi';
import DataTable, { Column } from '../../components/DataTable';
import ConfirmDialog from '../../components/ConfirmDialog';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { usePermissions } from '../../hooks/usePermissions';
import { logError } from '../../utils/logError';
import '../../styles/admin.css';
import '../../styles/admin-components.css';

export default function OfficeExpenseTypeList() {
    const { user: currentUser } = useAuth();
    const { showSuccess, showError } = useToast();
    const navigate = useNavigate();
    const permissions = usePermissions('OfficeExpenseType');
    const [expenseTypes, setExpenseTypes] = useState<OfficeExpenseType[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; expenseType: OfficeExpenseType | null }>({
        isOpen: false,
        expenseType: null
    });

    const [searchTerm, setSearchTerm] = useState('');

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [entriesPerPage, setEntriesPerPage] = useState(10);
    const [totalRecords, setTotalRecords] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    const loadExpenseTypes = async (page: number = currentPage, pageSize: number = entriesPerPage, search: string = searchTerm) => {
        try {
            setLoading(true);
            setError(null);

            const start = (page - 1) * pageSize;
            const response = await officeExpenseTypeApi.getAllOfficeExpenseTypesPage(start, pageSize, 'asc');

            if (response.success) {
                const fetchedData = response.data || [];
                const totalCount = (response as any).totalRecords || fetchedData.length;

                setExpenseTypes(fetchedData);
                setTotalRecords(totalCount);
                setTotalPages(Math.ceil(totalCount / pageSize));
            } else {
                setError(response.message || 'Failed to fetch expense types');
                setExpenseTypes([]);
            }
        } catch (err) {
            setError('Network error occurred while fetching expense types');
            console.error('Error fetching expense types:', err);
            await logError({
                controllerName: 'OfficeExpenseTypeList',
                methodName: 'LoadExpenseTypes',
                requestUrl: 'officeExpenseTypeApi.getAllOfficeExpenseTypesPage',
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
        // Implementation might need backend search support, but for now we follow the pattern
        loadExpenseTypes(1, entriesPerPage, value);
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        loadExpenseTypes(page, entriesPerPage, searchTerm);
    };

    const handleEntriesPerPageChange = (newEntriesPerPage: number) => {
        setEntriesPerPage(newEntriesPerPage);
        setCurrentPage(1);
        loadExpenseTypes(1, newEntriesPerPage, searchTerm);
    };

    const handlePrevious = () => {
        if (currentPage > 1) handlePageChange(currentPage - 1);
    };

    const handleNext = () => {
        if (currentPage < totalPages) handlePageChange(currentPage + 1);
    };

    useEffect(() => {
        loadExpenseTypes();
    }, [currentUser]);

    const handleDeleteExpenseType = async () => {
        if (!deleteDialog.expenseType) return;

        try {
            const response = await officeExpenseTypeApi.deleteOfficeExpenseType(
                deleteDialog.expenseType.expenseTypeId,
                currentUser?.id ? Number(currentUser.id) : 0
            );
            if (response.success) {
                await loadExpenseTypes();
                setDeleteDialog({ isOpen: false, expenseType: null });
                showSuccess('Expense Type deleted successfully!');
            } else {
                showError(response.message || 'Failed to delete expense type');
            }
        } catch (err) {
            showError('Network error occurred while deleting expense type');
        }
    };

    const columns: Column<OfficeExpenseType>[] = [
        {
            key: 'expenseTypeId',
            label: 'Sr No.',
            width: '80px',
            render: (_: any, __: OfficeExpenseType, index: number) => ((currentPage - 1) * entriesPerPage) + index + 1
        },
        {
            key: 'expenseTypeName',
            label: 'Expense Type Name',
            width: '250px',
            sortable: true
        },
        {
            key: 'description',
            label: 'Description',
            width: '300px',
            sortable: true
        },
        {
            key: 'isRecurring',
            label: 'Is Recurring',
            width: '120px',
            render: (val: boolean) => val ? 'Yes' : 'No',
            sortable: true
        }
    ];

    return (
        <div className="admin-page">
            <div className="admin-page-header">
                <div>
                    <h1 className="admin-page-title">Office Expense Type</h1>
                    <p className="admin-page-subtitle">Manage Types Of Office Expense</p>
                </div>
                <div className="admin-page-actions">
                    <Link to="/admin/office-expense-types/add" className="admin-btn admin-btn-primary">
                        <i className="fa-solid fa-plus"></i>
                        Add Expense Type
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
                        <h2 style={{ margin: 0 }}>{loading ? 'Loading...' : `${totalRecords} Expense Type`}</h2>
                        <div className="admin-search-wrapper">
                            <i className="fa-solid fa-search admin-search-icon"></i>
                            <input
                                type="text"
                                placeholder="Search Expense Type..."
                                value={searchTerm}
                                onChange={handleSearch}
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
                            <option value={100}>100</option>
                        </select>
                        <span style={{ fontSize: '14px', color: 'var(--admin-gray-600)' }}>Entries</span>
                    </div>
                </div>

                <div className="admin-card-body" style={{ padding: 0 }}>
                    {loading ? (
                        <div className="admin-table-loading">
                            <i className="fa-solid fa-spinner fa-spin"></i>
                            <p>Loading Expense Types...</p>
                        </div>
                    ) : expenseTypes.length === 0 ? (
                        <div className="admin-table-empty">
                            <i className="fa-solid fa-file-invoice-dollar"></i>
                            <h3>No Expense Types Found</h3>
                            <p>No office expense types recorded.</p>
                        </div>
                    ) : (
                        <>
                            <DataTable
                                keyField="expenseTypeId"
                                columns={columns}
                                data={expenseTypes}
                                onEdit={(item: OfficeExpenseType) => navigate(`/admin/office-expense-types/edit/${item.expenseTypeId}`, { state: { expenseData: item } })}
                                onDelete={(item: OfficeExpenseType) => setDeleteDialog({ isOpen: true, expenseType: item })}
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
                title="Delete Expense Type"
                message={`Are you sure you want to delete expense type "${deleteDialog.expenseType?.expenseTypeName}"?`}
                confirmText="Delete"
                type="danger"
                onConfirm={handleDeleteExpenseType}
                onCancel={() => setDeleteDialog({ isOpen: false, expenseType: null })}
            />
        </div>
    );
}
