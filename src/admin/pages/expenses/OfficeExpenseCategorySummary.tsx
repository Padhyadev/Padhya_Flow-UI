import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { officeExpenseApi } from '../../services/api/officeExpenseApi';
import DataTable from '../../components/DataTable';
import FormField from '../../components/FormField';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import '../../styles/admin.css';
import '../../styles/admin-components.css';

export default function OfficeExpenseCategorySummary() {
    const { user: currentUser } = useAuth();
    const { showSuccess, showError } = useToast();
    const navigate = useNavigate();

    const [categoryData, setCategoryData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [showResults, setShowResults] = useState(false);

    // Form state
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [entriesPerPage, setEntriesPerPage] = useState(10);
    const [totalRecords, setTotalRecords] = useState(0);

    const validate = () => {
        const newErrors: Record<string, string> = {};

        if (!fromDate) {
            newErrors.fromDate = 'From Date is required';
        }

        if (!toDate) {
            newErrors.toDate = 'To Date is required';
        }

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
            const formatDate = (dateStr: string) => {
                const date = new Date(dateStr);
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                const year = date.getFullYear();
                return `${month}-${day}-${year}`;
            };

            const formattedFromDate = formatDate(fromDate);
            const formattedToDate = formatDate(toDate);

            const response = await officeExpenseApi.getOfficeExpenseCategorySummary(
                formattedFromDate,
                formattedToDate
            );

            if (response.success) {
                const data = response.data || [];
                setCategoryData(data);
                setTotalRecords(data.length);
                setShowResults(true);
                setCurrentPage(1);

                if (data.length === 0) {
                    showError('No expense categories found for the selected date range');
                } else {
                    showSuccess(`Found ${data.length} categories`);
                }
            } else {
                showError(response.message || 'Failed to fetch category summary');
                setCategoryData([]);
                setTotalRecords(0);
                setShowResults(true); // Show empty state
            }
        } catch (err) {
            showError('Network error occurred');
            console.error(err);
            setCategoryData([]);
            setTotalRecords(0);
            setShowResults(true); // Show empty state
        } finally {
            setLoading(false);
        }
    };

    // Pagination logic
    const paginatedData = React.useMemo(() => {
        const start = (currentPage - 1) * entriesPerPage;
        return categoryData.slice(start, start + entriesPerPage);
    }, [categoryData, currentPage, entriesPerPage]);

    // ... handleInputChange helper if needed (not really needed for 2 fields) ...
    // ... handleInputChange helper if needed (not really needed for 2 fields) ...
    const handleFromDateChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFromDate(e.target.value);
        if (errors.fromDate) setErrors(prev => ({ ...prev, fromDate: '' }));
    };

    const handleToDateChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setToDate(e.target.value);
        if (errors.toDate) setErrors(prev => ({ ...prev, toDate: '' }));
    };

    const columns = [
        {
            key: 'categoryName',
            label: 'Category Name',
            sortable: true,
            render: (val: string, row: any) => (
                <span style={{ fontWeight: 600, color: 'var(--admin-gray-900)', fontSize: '14px' }}>
                    {val || row.expenseTypeName || row.ExpenseTypeName || '-'}
                </span>
            )
        },
        {
            key: 'totalAmount',
            label: 'Amount',
            sortable: true,
            render: (val: number, row: any) => {
                const amount = val || row.amount || row.Amount || row.totalAmount || row.TotalAmount || 0;
                return (
                    <span style={{ fontWeight: 700, color: 'var(--admin-primary)', fontSize: '16px' }}>
                        {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount)}
                    </span>
                );
            }
        },
        {
            key: 'percentage',
            label: 'Percentage',
            sortable: true,
            render: (val: number, row: any) => {
                const percentage = val || row.percentage || row.Percentage || 0;
                return (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                            flex: 1,
                            height: '8px',
                            backgroundColor: 'var(--admin-gray-200)',
                            borderRadius: '4px',
                            overflow: 'hidden'
                        }}>
                            <div style={{
                                width: `${percentage}%`,
                                height: '100%',
                                backgroundColor: 'var(--admin-primary)',
                                transition: 'width 0.3s ease'
                            }} />
                        </div>
                        <span style={{ fontWeight: 600, color: 'var(--admin-gray-700)', minWidth: '60px', fontSize: '14px' }}>
                            {percentage.toFixed(2)}%
                        </span>
                    </div>
                );
            }
        }
    ];

    // Calculate total amount (excluding TOTAL row to avoid double counting)
    const totalAmount = categoryData
        .filter(item => (item.expenseTypeName || item.ExpenseTypeName || '').toUpperCase() !== 'TOTAL')
        .reduce((sum, item) => {
            const amount = item.amount || item.Amount || item.totalAmount || item.TotalAmount || 0;
            return sum + amount;
        }, 0);

    return (
        <div className="admin-page">
            <div className="admin-page-header">
                <div>
                    <h1 className="admin-page-title">Office Expense Category Summary</h1>
                    <p className="admin-page-subtitle">View Category-Wise Expense Summary By Date Range</p>
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
                                <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '14px', marginBottom: '8px' }}>Total Categories</p>
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
                            <h2 style={{ margin: 0 }}>Category Detail</h2>
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
                                    <p>Loading category summary...</p>
                                </div>
                            ) : categoryData.length === 0 ? (
                                <div className="admin-table-empty">
                                    <i className="fa-solid fa-inbox" style={{ fontSize: '48px', color: 'var(--admin-gray-400)', marginBottom: '16px' }}></i>
                                    <h3 style={{ color: 'var(--admin-gray-700)', marginBottom: '8px' }}>No Expense Records Found</h3>
                                    <p style={{ color: 'var(--admin-gray-600)', marginBottom: '4px' }}>There are no expense categories for the selected date range.</p>
                                    {/* <p style={{ color: 'var(--admin-gray-500)', fontSize: '13px' }}>Try adjusting your date range or check back later.</p> */}
                                </div>
                            ) : (
                                <>
                                    <DataTable
                                        columns={columns}
                                        data={paginatedData}
                                        loading={loading}
                                        emptyMessage="No category data found"
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
