import React, { useState, useEffect } from 'react';
import { formatDate } from '../../utils/dateUtils';
import { Link, useNavigate } from 'react-router-dom';
import { OfficeExpense, officeExpenseApi } from '../../services/api/officeExpenseApi';
import DataTable from '../../components/DataTable';
import ConfirmDialog from '../../components/ConfirmDialog';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { usePermissions } from '../../hooks/usePermissions';
import { logError } from '../../utils/logError';
import '../../styles/admin.css';
import '../../styles/admin-components.css';

export default function OfficeExpenseList() {
    const { user: currentUser } = useAuth();
    const { showSuccess, showError } = useToast();
    const navigate = useNavigate();
    // Assuming 'officeexpense' or similar key for permissions
    const permissions = usePermissions('OfficeExpense');

    const [expenses, setExpenses] = useState<OfficeExpense[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; expense: OfficeExpense | null }>({
        isOpen: false,
        expense: null
    });
    const [paymentMethods, setPaymentMethods] = useState<{ code: string; name: string }[]>([]);
    const [expenseTypes, setExpenseTypes] = useState<{ id: number; name: string }[]>([]);

    const [searchTerm, setSearchTerm] = useState('');
    const [allExpenses, setAllExpenses] = useState<OfficeExpense[]>([]);

    // Pagination constants
    const [currentPage, setCurrentPage] = useState(1);
    const [entriesPerPage, setEntriesPerPage] = useState(10);
    const [totalRecords, setTotalRecords] = useState(0);

    const loadExpenses = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await officeExpenseApi.getAllOfficeExpensesPage(0, 1000, 'desc');

            if (response.success) {
                const data = response.data || [];
                console.log('Fetched Expenses:', data); // Debug log
                setAllExpenses(data);
                filterAndPaginate(data, searchTerm, currentPage, entriesPerPage);
            } else {
                setError(response.message || 'Failed to fetch expenses');
                setExpenses([]);
            }
        } catch (err) {
            setError('Network error occurred');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const loadPaymentMethods = async () => {
        try {
            const response = await officeExpenseApi.getPaymentMethodDropdown();
            if (response.success && response.data) {
                setPaymentMethods(response.data.map((p: any) => ({
                    code: String(p.code || p.value || p.id),
                    name: p.name
                })));
            }
        } catch (err) {
            console.error('Failed to load payment methods for mapping');
        }
    };

    const loadExpenseTypes = async () => {
        try {
            const response = await officeExpenseApi.getExpenseTypeDropdown();
            if (response.success && response.data) {
                setExpenseTypes(response.data);
            }
        } catch (err) {
            console.error('Failed to load expense types');
        }
    };

    const filterAndPaginate = (data: OfficeExpense[], search: string, page: number, size: number) => {
        let filtered = data;
        if (search) {
            const lowerSearch = search.toLowerCase();
            filtered = data.filter(item =>
                item.vendorName?.toLowerCase().includes(lowerSearch) ||
                item.description?.toLowerCase().includes(lowerSearch) ||
                item.referenceNo?.toLowerCase().includes(lowerSearch) ||
                String(item.amount).includes(lowerSearch)
            );
        }

        setTotalRecords(filtered.length);
        const start = (page - 1) * size;
        setExpenses(filtered.slice(start, start + size));
    };

    useEffect(() => {
        loadExpenses();
        loadPaymentMethods();
        loadExpenseTypes();
    }, [currentUser]);

    useEffect(() => {
        filterAndPaginate(allExpenses, searchTerm, currentPage, entriesPerPage);
    }, [searchTerm, currentPage, entriesPerPage, allExpenses]);

    const handleDelete = async () => {
        if (!deleteDialog.expense?.id) return;
        try {
            const response = await officeExpenseApi.deleteOfficeExpense(deleteDialog.expense.id);
            if (response.success) {
                showSuccess('Expense deleted successfully');
                loadExpenses(); // Reload full list
                setDeleteDialog({ isOpen: false, expense: null });
            } else {
                showError(response.message || 'Failed to delete');
            }
        } catch (err) {
            showError('Network error deleting expense');
        }
    };



    const columns = [
        {
            key: 'id',
            label: 'Sr No.',
            width: '80px',
            render: (_: any, __: any, index: number) => ((currentPage - 1) * entriesPerPage) + index + 1
        },
        {
            key: 'expenseDate',
            label: 'Date',
            width: '120px',
            sortable: true,
            render: (val: string) => formatDate(val)
        },
        {
            key: 'vendorName',
            label: 'Vendor',
            width: '150px',
            sortable: true,
            render: (val: string) => val || '-'
        },
        {
            key: 'expenseTypeId',
            label: 'Expense Type',
            width: '200px',
            sortable: true,
            render: (val: number, row: any) => {
                const expenseType = expenseTypes.find(t => t.id === val);
                return (
                    <span style={{ fontWeight: 500, color: 'var(--admin-gray-700)' }}>
                        {expenseType?.name || '-'}
                    </span>
                );
            }
        },
        {
            key: 'amount',
            label: 'Amount',
            width: '150px',
            sortable: true,
            render: (val: number) => (
                <span style={{ fontWeight: 600, color: 'var(--admin-primary)' }}>
                    {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val)}
                </span>
            )
        },
        {
            key: 'paymentMethod',
            label: 'Payment Method',
            width: '150px',
            sortable: true,
            render: (val: string) => {
                const method = paymentMethods.find(m => m.code === String(val));
                const displayName = method ? method.name : val;
                return (
                    <span style={{ fontWeight: 500, color: 'var(--admin-gray-700)' }}>
                        {displayName || '-'}
                    </span>
                );
            }
        },
        {
            key: 'referenceNo',
            label: 'Ref No.',
            width: '150px',
            sortable: true,
            render: (val: string) => val || '-'
        }
    ];

    return (
        <div className="admin-page">
            <div className="admin-page-header">
                <div>
                    <h1 className="admin-page-title">Office Expense</h1>
                    <p className="admin-page-subtitle">Manage Office Expense Record</p>
                </div>
                <div className="admin-page-actions">
                    <button
                        onClick={() => navigate('/admin/expenses/summary')}
                        className="admin-btn admin-btn-success"
                        style={{ marginRight: '12px' }}
                    >
                        <i className="fa-solid fa-chart-line"></i> View Summary
                    </button>
                    <Link to="/admin/expenses/new" className="admin-btn admin-btn-primary">
                        <i className="fa-solid fa-plus"></i> Add Office Expense
                    </Link>
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
                                placeholder="Search Vendors, Ref No..."
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
                            onChange={(e) => { setEntriesPerPage(parseInt(e.target.value)); setCurrentPage(1); }}
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
                        data={expenses}
                        loading={loading}
                        onEdit={(row) => navigate(`/admin/expenses/${row.id}/edit`, { state: { expenseData: row } })}
                        onDelete={(row) => setDeleteDialog({ isOpen: true, expense: row })}
                        emptyMessage="No expenses found"
                    />

                    {/* Pagination Controls */}
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

            <ConfirmDialog
                isOpen={deleteDialog.isOpen}
                title="Delete Expense"
                message="Are you sure you want to delete this expense record?"
                onConfirm={handleDelete}
                onCancel={() => setDeleteDialog({ isOpen: false, expense: null })}
                type="danger"
            />
        </div>
    );
}
