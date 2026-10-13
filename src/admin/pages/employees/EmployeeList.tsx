import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { employeeApi, Employee } from '../../services/api/employeeApi';
import DataTable, { Column } from '../../components/DataTable';
import ConfirmDialog from '../../components/ConfirmDialog';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import PermissionGuard from '../../components/PermissionGuard';
import { usePermissions } from '../../hooks/usePermissions';
import { logError } from '../../utils/logError';
import '../../styles/admin.css';
import '../../styles/admin-components.css';

export default function EmployeeList() {
    const { user: currentUser } = useAuth();
    const { showSuccess } = useToast();
    const navigate = useNavigate();
    const permissions = usePermissions('Employee'); // Using 'Employee' controller
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; employee: Employee | null }>({
        isOpen: false,
        employee: null
    });

    const [searchTerm, setSearchTerm] = useState('');
    const [allEmployees, setAllEmployees] = useState<Employee[]>([]);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [entriesPerPage, setEntriesPerPage] = useState(10);
    const [totalRecords, setTotalRecords] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    const loadEmployees = async (page: number = currentPage, pageSize: number = entriesPerPage, search: string = searchTerm) => {
        try {
            setLoading(true);
            setError(null);

            // Fetch larger batch for client-side filtering/pagination if API doesn't support full search yet
            // Based on user request URL: /api/Employee/GetAllpage?start=0&length=100
            const totalResponse = await employeeApi.getAllEmployeesPage(0, 2000, 'desc');

            if (totalResponse.success) {
                const fetchedData = totalResponse.data || [];

                // Sort by ID descending to show newest first
                fetchedData.sort((a, b) => b.employeeId - a.employeeId);

                setAllEmployees(fetchedData);

                // Filter
                const filtered = fetchedData.filter(emp => {
                    const searchStr = search.toLowerCase();
                    return Object.values(emp).some(value =>
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

                setEmployees(pageData);
            } else {
                setError(totalResponse.message || 'Failed to fetch employees');
                setEmployees([]);
            }
        } catch (err) {
            setError('Network error occurred while fetching employees');
            console.error('Error fetching employees:', err);
            await logError({
                controllerName: 'EmployeeList',
                methodName: 'LoadEmployees',
                requestUrl: 'employeeApi.getAllEmployeesPage',
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
        loadEmployees(1, entriesPerPage, value);
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        loadEmployees(page, entriesPerPage, searchTerm);
    };

    const handleEntriesPerPageChange = (newEntriesPerPage: number) => {
        setEntriesPerPage(newEntriesPerPage);
        setCurrentPage(1);
        loadEmployees(1, newEntriesPerPage, searchTerm);
    };

    const handlePrevious = () => {
        if (currentPage > 1) handlePageChange(currentPage - 1);
    };

    const handleNext = () => {
        if (currentPage < totalPages) handlePageChange(currentPage + 1);
    };

    useEffect(() => {
        loadEmployees();
    }, [currentUser]);

    const columns: Column<Employee>[] = [
        {
            key: 'employeeId',
            label: 'Sr No.',
            width: '80px',
            render: (_: any, __: Employee, index: number) => ((currentPage - 1) * entriesPerPage) + index + 1
        },
        {
            key: 'firstName',
            label: 'Employee Name',
            width: '200px',
            sortable: true,
            render: (_: any, row: Employee) => `${row.firstName} ${row.lastName}`
        },
        {
            key: 'employeeCode',
            label: 'Employee Code',
            width: '150px',
            sortable: true,
            render: (value: string) => (
                <span style={{ color: 'var(--admin-gray-600)', fontWeight: '500' }}>
                    <i className="fa-solid fa-id-badge" style={{ marginRight: '6px', color: 'var(--admin-primary)' }}></i>
                    {value}
                </span>
            )
        },
        {
            key: 'email',
            label: 'Email',
            width: '220px',
            sortable: true,
            render: (value: string) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--admin-gray-600)', fontSize: '13px' }}>
                    <i className="fa-solid fa-envelope" style={{ color: 'var(--admin-primary)', opacity: 0.8 }}></i>
                    {value}
                </div>
            )
        },
        {
            key: 'mobile',
            label: 'Mobile',
            width: '150px',
            sortable: true,
            render: (value: string) => (
                <span className="user-mobile-badge">
                    {value || '-'}
                </span>
            )
        },
        {
            key: 'designation',
            label: 'Designation',
            width: '150px',
            sortable: true,
            render: (value: string) => <span style={{ fontWeight: '500' }}>{value}</span>
        },
        {
            key: 'workLocation',
            label: 'Location',
            width: '150px',
            sortable: true
        }
    ];

    const handleDeleteEmployee = async () => {
        if (!deleteDialog.employee) return;

        try {
            const response = await employeeApi.deleteEmployee(deleteDialog.employee.employeeId);
            if (response.success) {
                await loadEmployees();
                setDeleteDialog({ isOpen: false, employee: null });
                showSuccess('Employee deleted successfully!');
            } else {
                setError(response.message || 'Failed to delete employee');
            }
        } catch (err) {
            setError('Network error occurred while deleting employee');
        }
    };

    return (
        <div className="admin-page">
            <div className="admin-page-header">
                <div>
                    <h1 className="admin-page-title">Employee</h1>
                    <p className="admin-page-subtitle">Manage Employee Record</p>
                </div>
                <div className="admin-page-actions">
                    <PermissionGuard controller="Employee" permission="add">
                        <Link to="/admin/employees/new" className="admin-btn admin-btn-primary">
                            <i className="fa-solid fa-plus"></i>
                            Add Employee
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
                        <h2 style={{ margin: 0 }}>{loading ? 'Loading...' : `${totalRecords} Employee`}</h2>
                        <div className="admin-search-wrapper">
                            <i className="fa-solid fa-search admin-search-icon"></i>
                            <input
                                type="text"
                                placeholder="Search Employee..."
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
                            <p>Loading Employees...</p>
                        </div>
                    ) : employees.length === 0 ? (
                        <div className="admin-table-empty">
                            <i className="fa-solid fa-users"></i>
                            <h3>No Employees Found</h3>
                            <p>No employee records available.</p>
                        </div>
                    ) : (
                        <>
                            <DataTable
                                columns={columns}
                                data={employees}
                                onEdit={permissions.getEditCallback((emp: Employee) => navigate(`/admin/employees/${emp.employeeId}/edit`, { state: { employeeData: emp } }))}
                                onDelete={permissions.getDeleteCallback((emp: Employee) => setDeleteDialog({ isOpen: true, employee: emp }))}
                                customActions={(emp: Employee) => (
                                    <button
                                        className="admin-btn-icon"
                                        style={{ color: 'var(--admin-primary)', backgroundColor: 'rgba(59, 130, 246, 0.1)', borderColor: 'rgba(59, 130, 246, 0.2)' }}
                                        onClick={() => navigate(`/admin/employees/${emp.employeeId}/assign-project`, { state: { employee: emp } })}

                                    >
                                        <i className="fa-solid fa-folder-plus"></i>
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
                title="Delete Employee"
                message={`Are you sure you want to delete employee "${deleteDialog.employee?.firstName} ${deleteDialog.employee?.lastName}"?`}
                confirmText="Delete"
                type="danger"
                onConfirm={handleDeleteEmployee}
                onCancel={() => setDeleteDialog({ isOpen: false, employee: null })}
            />
        </div>
    );
}
