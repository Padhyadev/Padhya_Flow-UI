import React, { useState, useEffect } from 'react';
import { formatDate } from '../../utils/dateUtils';
import { useNavigate } from 'react-router-dom';
import { OfficeExpense, officeExpenseApi } from '../../services/api/officeExpenseApi';
import DataTable from '../../components/DataTable';
import FormField from '../../components/FormField';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import '../../styles/admin.css';
import '../../styles/admin-components.css';

export default function OfficeExpenseSummary() {
    const { user: currentUser } = useAuth();
    const { showSuccess, showError } = useToast();
    const navigate = useNavigate();

    const [expenses, setExpenses] = useState<OfficeExpense[]>([]);
    const [expenseTypes, setExpenseTypes] = useState<{ id: number; name: string }[]>([]);
    const [paymentMethods, setPaymentMethods] = useState<{ code: string; name: string }[]>([]);
    const [loading, setLoading] = useState(false);
    const [showResults, setShowResults] = useState(false);

    // Form state
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [selectedExpenseType, setSelectedExpenseType] = useState<number>(0);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [entriesPerPage, setEntriesPerPage] = useState(10);
    const [totalRecords, setTotalRecords] = useState(0);

    // Load expense types and payment methods dropdown
    useEffect(() => {
        const loadExpenseTypes = async () => {
            try {
                const response = await officeExpenseApi.getExpenseTypeDropdown();
                if (response.success && response.data) {
                    setExpenseTypes(response.data);
                }
            } catch (err) {
                console.error('Failed to load expense types:', err);
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
                console.error('Failed to load payment methods:', err);
            }
        };

        loadExpenseTypes();
        loadPaymentMethods();
    }, []);

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!fromDate) newErrors.fromDate = 'From Date is required';
        if (!toDate) newErrors.toDate = 'To Date is required';
        if (!selectedExpenseType) newErrors.selectedExpenseType = 'Expense Type is required';

        if (fromDate && toDate) {
            if (new Date(toDate) < new Date(fromDate)) {
                newErrors.toDate = 'To Date cannot be earlier than From Date';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Handle View button click
    const handleView = async () => {
        if (!validate()) {
            return;
        }

        try {
            setLoading(true);
            setShowResults(false);

            // Format dates to MM-DD-YYYY format as per API requirement
            const formatDateForApi = (dateStr: string) => {
                const date = new Date(dateStr);
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                const year = date.getFullYear();
                return `${month}-${day}-${year}`;
            };

            const formattedFromDate = formatDateForApi(fromDate);
            const formattedToDate = formatDateForApi(toDate);

            const response = await officeExpenseApi.getOfficeExpenseByDate(
                formattedFromDate,
                formattedToDate,
                selectedExpenseType
            );

            if (response.success) {
                const data = response.data || [];
                setExpenses(data);
                setTotalRecords(data.length);
                setShowResults(true);
                setCurrentPage(1);

                if (data.length === 0) {
                    showError('No expenses found for the selected criteria');
                } else {
                    showSuccess(`Found ${data.length} expenses`);
                }
            } else {
                showError(response.message || 'Failed to fetch expenses');
                setExpenses([]);
                setTotalRecords(0);
                setShowResults(true); // Show empty state
            }
        } catch (err) {
            showError('Network error occurred');
            console.error(err);
            setExpenses([]);
            setTotalRecords(0);
            setShowResults(true); // Show empty state
        } finally {
            setLoading(false);
        }
    };

    // Pagination logic
    const paginatedExpenses = React.useMemo(() => {
        const start = (currentPage - 1) * entriesPerPage;
        return expenses.slice(start, start + entriesPerPage);
    }, [expenses, currentPage, entriesPerPage]);


    const expenseTypeOptions = expenseTypes.map(type => ({
        value: type.id,
        label: type.name
    }));

    // Handlers to clear errors
    // Handlers to clear errors
    const handleFromDateChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFromDate(e.target.value);
        if (errors.fromDate) setErrors(prev => ({ ...prev, fromDate: '' }));
    };

    const handleToDateChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setToDate(e.target.value);
        if (errors.toDate) setErrors(prev => ({ ...prev, toDate: '' }));
    };

    const handleExpenseTypeChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setSelectedExpenseType(Number(e.target.value));
        if (errors.selectedExpenseType) setErrors(prev => ({ ...prev, selectedExpenseType: '' }));
    };

    const columns = [
        {
            key: 'id',
            label: 'Sr No.',
            render: (_: any, __: any, index: number) => ((currentPage - 1) * entriesPerPage) + index + 1
        },
        {
            key: 'expenseDate',
            label: 'Date',
            sortable: true,
            render: (val: string) => formatDate(val)
        },
        {
            key: 'vendorName',
            label: 'Vendor',
            sortable: true,
            render: (val: string) => val || '-'
        },
        {
            key: 'expenseTypeId',
            label: 'Expense Type',
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
            sortable: true,
            render: (val: number) => (
                <span style={{ fontWeight: 600, color: 'var(--admin-primary)' }}>
                    {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val)}
                </span>
            )
        },
        {
            key: 'paymentMethod',
            label: 'Payment Mode',
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
            sortable: true,
            render: (val: string) => val || '-'
        },
        {
            key: 'description',
            label: 'Description',
            render: (val: string) => (
                <span style={{ fontSize: '13px', color: 'var(--admin-gray-600)' }}>
                    {val || '-'}
                </span>
            )
        }
    ];

    // Calculate total amount
    const totalAmount = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);

    return (
        <div className="admin-page">
            <div className="admin-page-header">
                <div>
                    <h1 className="admin-page-title">Office Expense Summary</h1>
                    <p className="admin-page-subtitle">View Expense Summary By Date Range And Type</p>
                </div>
                <div className="admin-page-actions">
                    <button
                        onClick={() => navigate('/admin/expenses')}
                        className="admin-btn admin-btn-secondary"
                    >
                        <i className="fa-solid fa-arrow-left"></i> Back to List
                    </button>
                </div>
            </div>

            {/* Filter Form */}
            <div className="admin-card" style={{ marginBottom: '24px' }}>
                <div className="admin-card-header">
                    <h2>Filter Criteria</h2>
                </div>
                <div className="admin-card-body">
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '20px' }}>
                        {/* From Date */}
                        <FormField
                            label="From Date"
                            name="fromDate"
                            type="date"
                            value={fromDate}
                            onChange={handleFromDateChange}
                            required
                            error={errors.fromDate}
                        />

                        {/* To Date */}
                        <FormField
                            label="To Date"
                            name="toDate"
                            type="date"
                            value={toDate}
                            onChange={handleToDateChange}
                            required
                            error={errors.toDate}
                            min={fromDate || undefined}
                        />

                        {/* Expense Type */}
                        <FormField
                            label="Expense Type"
                            name="selectedExpenseType"
                            type="select"
                            value={selectedExpenseType}
                            onChange={handleExpenseTypeChange}
                            required
                            error={errors.selectedExpenseType}
                            options={expenseTypeOptions}
                            placeholder="Select Expense Type"
                        />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                        <button
                            onClick={handleView}
                            className="admin-btn admin-btn-primary"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <i className="fa-solid fa-spinner fa-spin"></i> Loading...
                                </>
                            ) : (
                                <>
                                    <i className="fa-solid fa-eye"></i> View Summary
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Results Section */}
            {showResults && (
                <>
                    {/* Summary Stats */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '24px' }}>
                        <div className="admin-card" style={{ background: 'linear-gradient(135deg, var(--admin-primary) 0%, var(--admin-primary-dark) 100%)' }}>
                            <div className="admin-card-body" style={{ padding: '20px', textAlign: 'center' }}>
                                <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '14px', marginBottom: '8px' }}>Total Records</p>
                                <h2 style={{ color: 'white', fontSize: '32px', margin: 0 }}>{totalRecords}</h2>
                            </div>
                        </div>
                        <div className="admin-card" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
                            <div className="admin-card-body" style={{ padding: '20px', textAlign: 'center' }}>
                                <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '14px', marginBottom: '8px' }}>Total Amount</p>
                                <h2 style={{ color: 'white', fontSize: '32px', margin: 0 }}>
                                    {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(totalAmount)}
                                </h2>
                            </div>
                        </div>
                    </div>

                    {/* Data Table */}
                    <div className="admin-card">
                        <div className="admin-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
                            <h2 style={{ margin: 0 }}>Expense Details</h2>
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
                            {loading ? (
                                <div className="admin-table-loading">
                                    <i className="fa-solid fa-spinner fa-spin"></i>
                                    <p>Loading expenses...</p>
                                </div>
                            ) : expenses.length === 0 ? (
                                <div className="admin-table-empty">
                                    <i className="fa-solid fa-inbox" style={{ fontSize: '48px', color: 'var(--admin-gray-400)', marginBottom: '16px' }}></i>
                                    <h3 style={{ color: 'var(--admin-gray-700)', marginBottom: '8px' }}>No Expense Records Found</h3>
                                    <p style={{ color: 'var(--admin-gray-600)', marginBottom: '4px' }}>There are no expenses for the selected criteria.</p>
                                </div>
                            ) : (
                                <>
                                    <DataTable
                                        columns={columns}
                                        data={paginatedExpenses}
                                        loading={loading}
                                        emptyMessage="No expenses found"
                                    />

                                    {/* Pagination Controls */}
                                    {totalRecords > 0 && (
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
                                                    <i className="fa-solid fa-chevron-left" style={{ fontSize: '11px' }}></i> Previous
                                                </button>
                                                <span style={{ margin: '0 10px', fontSize: '14px' }}>Page {currentPage}</span>
                                                <button
                                                    onClick={() => setCurrentPage(p => (p * entriesPerPage < totalRecords ? p + 1 : p))}
                                                    disabled={currentPage * entriesPerPage >= totalRecords}
                                                    className="admin-pagination-btn"
                                                >
                                                    Next <i className="fa-solid fa-chevron-right" style={{ fontSize: '11px' }}></i>
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
