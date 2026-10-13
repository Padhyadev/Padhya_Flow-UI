import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Role, roleApi, MenuDropdownItem } from '../../services/api/roleApi';
import DataTable, { Column } from '../../components/DataTable';
import ConfirmDialog from '../../components/ConfirmDialog';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import PermissionGuard from '../../components/PermissionGuard';
import { usePermissions } from '../../hooks/usePermissions';
import { logError } from '../../utils/logError';
import '../../styles/admin.css';

export default function RoleList() {
    const { user: currentUser } = useAuth();
    const { showSuccess, showError } = useToast();
    const navigate = useNavigate();
    const permissions = usePermissions('Role');
    const [roles, setRoles] = useState<Role[]>([]);
    const [menus, setMenus] = useState<MenuDropdownItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; role: Role | null }>({
        isOpen: false,
        role: null
    });

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [entriesPerPage, setEntriesPerPage] = useState(10);
    const [totalRecords, setTotalRecords] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const [allRoles, setAllRoles] = useState<Role[]>([]);

    const loadRoles = async (page: number = currentPage, pageSize: number = entriesPerPage, search: string = searchTerm) => {
        try {
            setLoading(true);
            setError(null);

            console.log('🔥 RoleList: Loading roles with pagination:', { page, pageSize, search });

            // First, get total count by fetching all records (Batch size 1000 to cover all)
            const response = await roleApi.getAllRolesPage(0, 1000, 'asc');

            if (response.success) {
                const fetchedRoles = response.data || [];
                setAllRoles(fetchedRoles);

                // Global Filter: Search across all fields in the role object
                const filteredRoles = fetchedRoles.filter(role => {
                    const searchStr = search.toLowerCase();
                    return Object.values(role).some(value =>
                        value !== null &&
                        value !== undefined &&
                        String(value).toLowerCase().includes(searchStr)
                    );
                });

                const totalCount = filteredRoles.length;
                setTotalRecords(totalCount);
                setTotalPages(Math.ceil(totalCount / pageSize));

                // Now slice the data for current page from filtered results
                const startIndex = (page - 1) * pageSize;
                const endIndex = startIndex + pageSize;
                const pageData = filteredRoles.slice(startIndex, endIndex);

                setRoles(pageData);
            } else {
                setError(response.message || 'Failed to fetch roles');
                setRoles([]);
                setAllRoles([]);
                setTotalRecords(0);
                setTotalPages(0);
            }
        } catch (err) {
            setError('Network error occurred while fetching roles');
            console.error('Error fetching roles:', err);

            await logError({
                controllerName: 'RoleList',
                methodName: 'LoadRoles',
                requestUrl: 'roleApi.getAllRolesPage',
                requestPayload: { page, pageSize, search },
                error: err
            });

            setRoles([]);
            setAllRoles([]);
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
        loadRoles(1, entriesPerPage, value);
    };

    // Pagination handlers
    const handlePageChange = (page: number) => {
        console.log('🔥 RoleList: Changing to page:', page);
        setCurrentPage(page);
        loadRoles(page, entriesPerPage, searchTerm);
    };

    const handleEntriesPerPageChange = (newEntriesPerPage: number) => {
        console.log('🔥 RoleList: Changing entries per page to:', newEntriesPerPage);
        setEntriesPerPage(newEntriesPerPage);
        setCurrentPage(1);
        loadRoles(1, newEntriesPerPage, searchTerm);
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

    const loadMenus = async () => {
        try {
            console.log('🔍 Loading menu dropdown...');
            const response = await roleApi.getMenuDropdown();
            console.log('🔍 Menu dropdown response:', response);

            if (response.success) {
                console.log('🔍 Menu dropdown data:', response.data);
                console.log('🔍 Number of menus loaded:', response.data?.length || 0);

                // Log each menu item for debugging
                response.data?.forEach((menu, index) => {
                    console.log(`🔍 Menu ${index + 1}: ID="${menu.id}" (type: ${typeof menu.id}), Name="${menu.name}"`);
                });

                setMenus(response.data || []);
            } else {
                console.error('🔍 Failed to load menus:', response.message);
            }
        } catch (err) {
            console.error('Error fetching menus:', err);

            await logError({
                controllerName: 'RoleList',
                methodName: 'LoadMenus',
                requestUrl: 'roleApi.getMenuDropdown',
                requestPayload: null,
                error: err
            });
        }
    };

    useEffect(() => {
        const token = localStorage.getItem('admin_token');
        console.log('🔥 RoleList: Token check:', token ? token.substring(0, 20) + '...' : 'No token found');
        console.log('🔥 RoleList: Current user:', currentUser);

        loadRoles();
        loadMenus();
    }, [currentUser]);

    // Helper function to get menu names by IDs (supports multiple menus)
    // Helper function to get menu names by IDs (supports multiple menus)
    const getMenuNames = (row: Role) => {
        let names: string[] = [];

        // Priority 1: Use menuName from the role data if available
        if (row.menuName && row.menuName.trim() !== '') {
            names = row.menuName.split(',').map(n => n.trim());
        }
        // Priority 2: Fallback to selectedMenu IDs mapping
        else if (row.selectedMenu && row.selectedMenu.trim() !== '') {
            // If menus dropdown hasn't loaded yet, show loading
            if (menus.length === 0) {
                return 'Loading menus...';
            }

            const menuIds = row.selectedMenu.split(',').map(id => id.trim()).filter(id => id !== '');

            names = menuIds.map(menuId => {
                const menu = menus.find(m => String(m.id) === String(menuId));
                return menu ? menu.name : '';
            }).filter(name => name !== '');
        }

        if (names.length > 0) {
            // Deduplicate
            const uniqueNames = Array.from(new Set(names));

            // Sort by order in 'menus' array (presumed correctly ordered master list)
            if (menus.length > 0) {
                uniqueNames.sort((a, b) => {
                    const indexA = menus.findIndex(m => m.name === a);
                    const indexB = menus.findIndex(m => m.name === b);
                    // Treat not found items as last
                    return (indexA === -1 ? 9999 : indexA) - (indexB === -1 ? 9999 : indexB);
                });
            } else {
                // Fallback if menus master list isn't available
                uniqueNames.sort((a, b) => a.localeCompare(b));
            }

            return uniqueNames.join(', ');
        }

        return 'No menus assigned';
    };

    const columns: Column<Role>[] = [
        {
            key: 'id',
            label: 'Sr No.',
            width: '80px',
            render: (_: any, __: Role, index: number) => ((currentPage - 1) * entriesPerPage) + index + 1
        },
        {
            key: 'name',
            label: 'Role Name',
            width: '200px',
            sortable: true,
            render: (value: string) => (
                <div style={{ fontWeight: '600', color: 'var(--admin-gray-900)', fontSize: '15px', textTransform: 'capitalize' }}>
                    {value}
                </div>
            )
        },
        {
            key: 'selectedMenu',
            label: 'Menu',
            sortable: true,
            render: (value: string, row: Role) => (
                <div style={{
                    color: 'var(--admin-gray-700)',
                    fontSize: '14px',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                }}>
                    <i className="fa-solid fa-bars" style={{ color: 'var(--admin-gray-500)' }}></i>
                    {getMenuNames(row)}
                </div>
            )
        }
    ];

    const handleDeleteRole = async () => {
        if (!deleteDialog.role) return;

        console.log('🔥 RoleList: Deleting role:', deleteDialog.role);

        if (!deleteDialog.role.id) {
            setError('Cannot delete role: Invalid role ID');
            return;
        }

        try {
            const response = await roleApi.deleteRole(deleteDialog.role.id);

            if (response.success) {
                await loadRoles();
                setDeleteDialog({ isOpen: false, role: null });
                showSuccess('Role deleted successfully');
            } else {
                setError(response.message || 'Failed to delete role');
            }
        } catch (err) {
            setError('Network error occurred while deleting role');
            console.error('Error deleting role:', err);

            await logError({
                controllerName: 'RoleList',
                methodName: 'DeleteRole',
                requestUrl: `roleApi.deleteRole/${deleteDialog.role?.id}`,
                requestPayload: { roleId: deleteDialog.role?.id },
                error: err
            });
        }
    };

    return (
        <div className="admin-page">
            <div className="admin-page-header">
                <div>
                    <h1 className="admin-page-title">Role</h1>
                    <p className="admin-page-subtitle">Manage Role With Menu Access</p>
                </div>
                <div className="admin-page-actions">
                    <PermissionGuard controller="Role" permission="add">
                        <Link to="/admin/roles/new" className="admin-btn admin-btn-primary">
                            <i className="fa-solid fa-plus"></i>
                            Add Role
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
                        <h2 style={{ margin: 0 }}>{loading ? 'Loading...' : `${totalRecords} Role`}</h2>

                        {/* Search Input */}
                        <div className="admin-search-wrapper" style={{ position: 'relative' }}>
                            <i className="fa-solid fa-search" style={{
                                position: 'absolute',
                                left: '12px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                color: 'var(--admin-gray-400)',
                                fontSize: '14px'
                            }}></i>
                            <input
                                type="text"
                                placeholder="Search Role..."
                                value={searchTerm}
                                onChange={handleSearch}
                                style={{
                                    padding: '8px 12px 8px 35px',
                                    border: '1px solid var(--admin-gray-300)',
                                    borderRadius: '6px',
                                    fontSize: '14px',
                                    width: '250px',
                                    backgroundColor: 'white',
                                    outline: 'none',
                                    transition: 'all 0.2s'
                                }}
                                onFocus={(e) => e.target.style.borderColor = 'var(--admin-primary)'}
                                onBlur={(e) => e.target.style.borderColor = 'var(--admin-gray-300)'}
                            />
                        </div>
                    </div>

                    <div className="pagination-controls" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div className="entries-per-page" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <span style={{ fontSize: '14px', color: 'var(--admin-gray-600)' }}>Show</span>
                            <select
                                value={entriesPerPage}
                                onChange={(e) => handleEntriesPerPageChange(Number(e.target.value))}
                                style={{
                                    padding: '4px 8px',
                                    borderRadius: '4px',
                                    border: '1px solid var(--admin-gray-200)',
                                    fontSize: '14px',
                                    color: 'var(--admin-gray-700)'
                                }}
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
                </div>
                <div className="admin-card-body" style={{ padding: 0 }}>
                    {loading ? (
                        <div style={{ padding: '40px', textAlign: 'center' }}>
                            <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '24px', color: 'var(--admin-primary)' }}></i>
                            <p style={{ marginTop: '16px', color: 'var(--admin-gray-600)' }}>Loading Roles...</p>
                        </div>
                    ) : roles.length === 0 ? (
                        <div style={{ padding: '40px', textAlign: 'center' }}>
                            <i className="fa-solid fa-user-shield" style={{ fontSize: '48px', color: 'var(--admin-gray-400)' }}></i>
                            <h3 style={{ marginTop: '16px', color: 'var(--admin-gray-700)' }}>No Roles Found</h3>
                            <p style={{ color: 'var(--admin-gray-500)' }}>No roles are available in the system.</p>
                        </div>
                    ) : (
                        <>
                            <DataTable
                                columns={columns}
                                data={roles}
                                onEdit={permissions.getEditCallback((role: Role) => navigate(`/admin/roles/${role.id}/edit`, { state: { roleData: role } }))}
                                onDelete={permissions.getDeleteCallback((role: Role) => setDeleteDialog({ isOpen: true, role }))}
                            />

                            {/* Pagination Controls */}
                            <div style={{
                                padding: '16px 20px',
                                borderTop: '1px solid var(--admin-gray-200)',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                backgroundColor: 'white',
                                gap: '20px'
                            }}>
                                <div style={{ fontSize: '13px', color: 'var(--admin-gray-600)', fontWeight: '500' }}>
                                    Showing {((currentPage - 1) * entriesPerPage) + 1} To {Math.min(currentPage * entriesPerPage, totalRecords)} Of {totalRecords} Entries
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <button
                                        onClick={handlePrevious}
                                        disabled={currentPage <= 1}
                                        style={{
                                            padding: '6px 14px',
                                            border: '1px solid var(--admin-gray-300)',
                                            borderRadius: '6px',
                                            backgroundColor: currentPage <= 1 ? 'var(--admin-gray-50)' : 'white',
                                            color: currentPage <= 1 ? 'var(--admin-gray-400)' : 'var(--admin-gray-700)',
                                            cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
                                            fontSize: '13px',
                                            fontWeight: '500',
                                            transition: 'all 0.2s',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px'
                                        }}
                                    >
                                        <i className="fa-solid fa-chevron-left" style={{ fontSize: '11px' }}></i>
                                        Previous
                                    </button>

                                    {/* Page Numbers */}
                                    <div style={{ display: 'flex', gap: '4px' }}>
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
                                                    style={{
                                                        padding: '6px 12px',
                                                        border: pageNum === currentPage ? 'none' : '1px solid var(--admin-gray-300)',
                                                        borderRadius: '6px',
                                                        backgroundColor: pageNum === currentPage ? 'var(--admin-primary)' : 'white',
                                                        color: pageNum === currentPage ? 'white' : 'var(--admin-gray-700)',
                                                        cursor: 'pointer',
                                                        fontSize: '13px',
                                                        fontWeight: pageNum === currentPage ? '600' : '500',
                                                        minWidth: '36px',
                                                        transition: 'all 0.2s',
                                                        boxShadow: pageNum === currentPage ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'
                                                    }}
                                                >
                                                    {pageNum}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    <button
                                        onClick={handleNext}
                                        disabled={currentPage >= totalPages}
                                        style={{
                                            padding: '6px 14px',
                                            border: '1px solid var(--admin-gray-300)',
                                            borderRadius: '6px',
                                            backgroundColor: currentPage >= totalPages ? 'var(--admin-gray-50)' : 'white',
                                            color: currentPage >= totalPages ? 'var(--admin-gray-400)' : 'var(--admin-gray-700)',
                                            cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
                                            fontSize: '13px',
                                            fontWeight: '500',
                                            transition: 'all 0.2s',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px'
                                        }}
                                    >
                                        Next
                                        <i className="fa-solid fa-chevron-right" style={{ fontSize: '11px' }}></i>
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>

            <ConfirmDialog
                isOpen={deleteDialog.isOpen}
                title="Delete Role"
                message={`Are you sure you want to delete role "${deleteDialog.role?.name}"?`}
                confirmText="Delete"
                type="danger"
                onConfirm={handleDeleteRole}
                onCancel={() => setDeleteDialog({ isOpen: false, role: null })}
            />
        </div>
    );
}

