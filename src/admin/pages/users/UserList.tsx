import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, userApi, RoleDropdownItem } from '../../services/api/userApi';
import DataTable, { Column } from '../../components/DataTable';
import ConfirmDialog from '../../components/ConfirmDialog';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import PermissionGuard from '../../components/PermissionGuard';
import { usePermissions } from '../../hooks/usePermissions';
import { logError } from '../../utils/logError';
import '../../styles/admin.css';
import '../../styles/admin-components.css'; // Ensure components CSS is loaded

export default function UserList() {
    const { user: currentUser } = useAuth();
    const { showSuccess, showError } = useToast();
    const navigate = useNavigate();
    const permissions = usePermissions('User');
    const [users, setUsers] = useState<User[]>([]);
    const [roles, setRoles] = useState<RoleDropdownItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; user: User | null }>({
        isOpen: false,
        user: null
    });

    const [searchTerm, setSearchTerm] = useState('');
    const [allUsers, setAllUsers] = useState<User[]>([]);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [entriesPerPage, setEntriesPerPage] = useState(10);
    const [totalRecords, setTotalRecords] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    const loadUsers = async (page: number = currentPage, pageSize: number = entriesPerPage, search: string = searchTerm) => {
        try {
            setLoading(true);
            setError(null);

            console.log('🔥 UserList: Loading users with pagination:', { page, pageSize, search });

            // First, get total data by fetching a larger batch (as requested for 100 length or more)
            const totalResponse = await userApi.getAllUsersPage(0, 1000, 'asc');

            if (totalResponse.success) {
                const fetchedUsers = totalResponse.data || [];
                setAllUsers(fetchedUsers);

                // Global Filter: Search across all fields in the user object
                const filteredUsers = fetchedUsers.filter(user => {
                    const searchStr = search.toLowerCase();
                    // Check if any property value contains the search string
                    return Object.values(user).some(value =>
                        value !== null &&
                        value !== undefined &&
                        String(value).toLowerCase().includes(searchStr)
                    );
                });

                const totalCount = filteredUsers.length;
                setTotalRecords(totalCount);
                setTotalPages(Math.ceil(totalCount / pageSize));

                // Now slice the data for current page from filtered results
                const startIndex = (page - 1) * pageSize;
                const endIndex = startIndex + pageSize;
                const pageData = filteredUsers.slice(startIndex, endIndex);

                setUsers(pageData);
            } else {
                setError(totalResponse.message || 'Failed to fetch users');
                setUsers([]);
                setAllUsers([]);
                setTotalRecords(0);
                setTotalPages(0);
            }
        } catch (err) {
            setError('Network error occurred while fetching users');
            console.error('Error fetching users:', err);

            await logError({
                controllerName: 'UserList',
                methodName: 'LoadUsers',
                requestUrl: 'userApi.getAllUsersPage',
                requestPayload: { page, pageSize, search },
                error: err
            });

            setUsers([]);
            setAllUsers([]);
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
        loadUsers(1, entriesPerPage, value);
    };

    // Pagination handlers
    const handlePageChange = (page: number) => {
        console.log('🔥 UserList: Changing to page:', page);
        setCurrentPage(page);
        loadUsers(page, entriesPerPage, searchTerm);
    };

    const handleEntriesPerPageChange = (newEntriesPerPage: number) => {
        console.log('🔥 UserList: Changing entries per page to:', newEntriesPerPage);
        setEntriesPerPage(newEntriesPerPage);
        setCurrentPage(1);
        loadUsers(1, newEntriesPerPage, searchTerm);
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

    const loadRoles = async () => {
        try {
            console.log('🔍 Loading role dropdown...');
            const response = await userApi.getRoleDropdown();

            if (response.success) {
                setRoles(response.data || []);
            } else {
                console.error('🔍 Failed to load roles:', response.message);
            }
        } catch (err) {
            console.error('Error fetching roles:', err);
            await logError({
                controllerName: 'UserList',
                methodName: 'LoadRoles',
                requestUrl: 'userApi.getRoleDropdown',
                requestPayload: null,
                error: err
            });
        }
    };

    useEffect(() => {
        loadUsers();
        loadRoles();
    }, [currentUser]);

    // Helper function to get role name by ID
    const getRoleName = (row: User) => {
        if (row.roleName && row.roleName.trim() !== '') {
            return row.roleName;
        }

        if (roles.length === 0 && row.roleId) {
            return 'Loading...';
        }

        if (row.roleId) {
            const role = roles.find(r => Number(r.id) === Number(row.roleId));
            return role ? role.name : 'Unknown Role';
        }

        return 'No role assigned';
    };

    const columns: Column<User>[] = [
        {
            key: 'id',
            label: 'Sr No.',
            width: '80px',
            render: (_: any, __: User, index: number) => ((currentPage - 1) * entriesPerPage) + index + 1
        },
        {
            key: 'userName',
            label: 'User Name',
            width: '200px',
            sortable: true
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
            key: 'mobileNumber',
            label: 'Mobile',
            width: '150px',
            sortable: true,
            render: (value: string) => value || '-'
        },
        {
            key: 'roleName',
            label: 'Role',
            width: '100px',
            sortable: true,
            render: (value: string, row: User) => (
                <div style={{ textTransform: 'capitalize' }}>
                    {getRoleName(row)}
                </div>
            )
        }
    ];

    // Handle delete user with real API
    const handleDeleteUser = async () => {
        if (!deleteDialog.user) return;
        if (!deleteDialog.user.id) {
            setError('Cannot delete user: Invalid user ID');
            return;
        }

        try {
            const response = await userApi.deleteUser(deleteDialog.user.id);
            if (response.success) {
                await loadUsers();
                setDeleteDialog({ isOpen: false, user: null });
                showSuccess('User deleted successfully!');
            } else {
                setError(response.message || 'Failed to delete user');
            }
        } catch (err) {
            setError('Network error occurred while deleting user');
            console.error('Error deleting user:', err);
            await logError({
                controllerName: 'UserList',
                methodName: 'DeleteUser',
                requestUrl: `userApi.deleteUser/${deleteDialog.user?.id}`,
                requestPayload: { userId: deleteDialog.user?.id },
                error: err
            });
        }
    };

    return (
        <div className="admin-page">
            <div className="admin-page-header">
                <div>
                    <h1 className="admin-page-title">User</h1>
                    <p className="admin-page-subtitle">Manage User</p>
                </div>
                <div className="admin-page-actions">
                    <PermissionGuard controller="User" permission="add">
                        <Link to="/admin/users/new" className="admin-btn admin-btn-primary">
                            <i className="fa-solid fa-plus"></i>
                            Add User
                        </Link>
                    </PermissionGuard>
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
                <div className="admin-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <h2 style={{ margin: 0 }}>{loading ? 'Loading...' : `${totalRecords} User`}</h2>

                        {/* Search Input - Matching RoleList */}
                        <div className="admin-search-wrapper">
                            <i className="fa-solid fa-search admin-search-icon"></i>
                            <input
                                type="text"
                                placeholder="Search User..."
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
                            <p>Loading User...</p>
                        </div>
                    ) : users.length === 0 ? (
                        <div className="admin-table-empty">
                            <i className="fa-solid fa-users"></i>
                            <h3>No User Found</h3>
                            <p>No user are available in the system.</p>
                        </div>
                    ) : (
                        <>
                            <DataTable
                                columns={columns}
                                data={users}
                                onEdit={permissions.getEditCallback((user: User) => navigate(`/admin/users/${user.id}/edit`, { state: { userData: user } }))}
                                onDelete={permissions.getDeleteCallback((user: User) => setDeleteDialog({ isOpen: true, user }))}
                            />

                            {/* Pagination Controls - Matching RoleList */}
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

            <ConfirmDialog
                isOpen={deleteDialog.isOpen}
                title="Delete User"
                message={`Are you sure you want to delete user "${deleteDialog.user?.userName}"?`}
                confirmText="Delete"
                type="danger"
                onConfirm={handleDeleteUser}
                onCancel={() => setDeleteDialog({ isOpen: false, user: null })}
            />
        </div>
    );
}
