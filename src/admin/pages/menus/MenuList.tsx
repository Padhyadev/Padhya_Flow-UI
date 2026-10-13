import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, menuApi } from '../../services/api/menuApi';
import DataTable, { Column } from '../../components/DataTable';
import ConfirmDialog from '../../components/ConfirmDialog';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import PermissionGuard from '../../components/PermissionGuard';
import { usePermissions } from '../../hooks/usePermissions';
import { logError } from '../../utils/logError';
import '../../styles/admin.css';

export default function MenuList() {
    const { user: currentUser } = useAuth();
    const { showSuccess, showError } = useToast();
    const navigate = useNavigate();
    const permissions = usePermissions('Menu');
    const [menus, setMenus] = useState<Menu[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; menu: Menu | null }>({
        isOpen: false,
        menu: null
    });

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [entriesPerPage, setEntriesPerPage] = useState(10);
    const [totalRecords, setTotalRecords] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const [allMenusData, setAllMenusData] = useState<Menu[]>([]);

    const loadMenus = async (page: number = currentPage, pageSize: number = entriesPerPage, search: string = searchTerm) => {
        try {
            setLoading(true);
            setError(null);

            console.log('🔥 MenuList: Loading menus with pagination:', { page, pageSize, search });

            // Fetch a larger batch to enable global search on client side (as requested)
            const totalResponse = await menuApi.getAllMenusPage(0, 1000, 'asc');

            if (totalResponse.success) {
                const fetchedMenus = totalResponse.data || [];
                setAllMenusData(fetchedMenus);

                // Global Filter: Search across all fields in the menu object
                const filteredMenus = fetchedMenus.filter(menu => {
                    const searchStr = search.toLowerCase();
                    return Object.values(menu).some(value =>
                        value !== null &&
                        value !== undefined &&
                        String(value).toLowerCase().includes(searchStr)
                    );
                });

                const totalCount = filteredMenus.length;
                setTotalRecords(totalCount);
                setTotalPages(Math.ceil(totalCount / pageSize));

                // Now slice the data for current page from filtered results
                const startIndex = (page - 1) * pageSize;
                const endIndex = startIndex + pageSize;
                const pageData = filteredMenus.slice(startIndex, endIndex);

                setMenus(pageData);
            } else {
                setError(totalResponse.message || 'Failed to fetch menus');
                setMenus([]);
                setAllMenusData([]);
                setTotalRecords(0);
                setTotalPages(0);
            }
        } catch (err) {
            setError('Network error occurred while fetching menus');
            console.error('Error fetching menus:', err);

            await logError({
                controllerName: 'MenuList',
                methodName: 'LoadMenus',
                requestUrl: 'menuApi.getAllMenusPage',
                requestPayload: { page, pageSize, search },
                error: err
            });

            setMenus([]);
            setAllMenusData([]);
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
        loadMenus(1, entriesPerPage, value);
    };

    const handlePageChange = (page: number) => {
        console.log('🔥 MenuList: Changing to page:', page);
        setCurrentPage(page);
        loadMenus(page, entriesPerPage, searchTerm);
    };

    const handleEntriesPerPageChange = (newEntriesPerPage: number) => {
        console.log('🔥 MenuList: Changing entries per page to:', newEntriesPerPage);
        setEntriesPerPage(newEntriesPerPage);
        setCurrentPage(1);
        loadMenus(1, newEntriesPerPage, searchTerm);
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

    useEffect(() => {
        const token = localStorage.getItem('admin_token');
        console.log('🔥 MenuList: Token check:', token ? token.substring(0, 20) + '...' : 'No token found');
        console.log('🔥 MenuList: Current user:', currentUser);

        loadMenus();
    }, [currentUser]);

    const columns: Column<Menu>[] = [
        {
            key: 'id',
            label: 'Sr No.',
            width: '80px',
            render: (_: any, __: Menu, index: number) => ((currentPage - 1) * entriesPerPage) + index + 1
        },
        {
            key: 'name',
            label: 'Menu Name',
            width: '200px',
            sortable: true,
            render: (value: string, row: Menu) => (
                <div>
                    <div style={{ fontWeight: '600', color: 'var(--admin-gray-900)', fontSize: '15px' }}>
                        {row.icon && <i className={row.icon} style={{ marginRight: '8px' }}></i>}
                        {value}
                    </div>
                    <small style={{ color: 'var(--admin-gray-500)' }}>
                        {row.url || 'No URL'}
                    </small>
                </div>
            )
        },
        {
            key: 'area',
            label: 'Area',
            width: '150px',
            sortable: true,
            render: (value: string) => (
                <span style={{
                    color: 'var(--admin-gray-700)',
                    fontSize: '14px',
                    fontWeight: '500'
                }}>
                    {value || '-'}
                </span>
            )
        },
        {
            key: 'controller',
            label: 'Controller',
            width: '150px',
            sortable: true,
            render: (value: string) => (
                <span style={{
                    color: 'var(--admin-gray-700)',
                    fontSize: '14px'
                }}>
                    {value || '-'}
                </span>
            )
        },
        {
            key: 'displayOrder',
            label: 'Order',
            width: '80px',
            sortable: true,
            render: (value: number) => (
                <span style={{
                    color: 'var(--admin-gray-700)',
                    fontSize: '14px',
                    fontWeight: '600'
                }}>
                    {value}
                </span>
            )
        }
    ];

    const handleDeleteMenu = async () => {
        if (!deleteDialog.menu) return;

        console.log('🔥 MenuList: Deleting menu:', deleteDialog.menu);

        if (!deleteDialog.menu.id) {
            setError('Cannot delete menu: Invalid menu ID');
            return;
        }

        try {
            const response = await menuApi.deleteMenu(deleteDialog.menu.id);

            if (response.success) {
                await loadMenus();
                setDeleteDialog({ isOpen: false, menu: null });
                showSuccess('Menu deleted successfully');
            } else {
                setError(response.message || 'Failed to delete menu');
            }
        } catch (err) {
            setError('Network error occurred while deleting menu');
            console.error('Error deleting menu:', err);

            await logError({
                controllerName: 'MenuList',
                methodName: 'DeleteMenu',
                requestUrl: `menuApi.deleteMenu/${deleteDialog.menu?.id}`,
                requestPayload: { menuId: deleteDialog.menu?.id },
                error: err
            });
        }
    };

    return (
        <div className="admin-page">
            <div className="admin-page-header">
                <div>
                    <h1 className="admin-page-title">Menu</h1>
                    <p className="admin-page-subtitle">Manage System Menu And Navigation</p>
                </div>
                <div className="admin-page-actions">
                    <PermissionGuard controller="Menu" permission="add">
                        <Link to="/admin/menus/new" className="admin-btn admin-btn-primary">
                            <i className="fa-solid fa-plus"></i>
                            Add Menu
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
                        <h2 style={{ margin: 0 }}>{loading ? 'Loading...' : `${totalRecords} Menu`}</h2>

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
                                placeholder="Search Menus..."
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

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '14px', color: 'var(--admin-gray-600)' }}>Show</span>
                        <select
                            value={entriesPerPage}
                            onChange={(e) => handleEntriesPerPageChange(parseInt(e.target.value))}
                            style={{
                                padding: '6px 12px',
                                border: '1px solid var(--admin-gray-300)',
                                borderRadius: '6px',
                                fontSize: '14px',
                                backgroundColor: 'white',
                                cursor: 'pointer'
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
                <div className="admin-card-body" style={{ padding: 0 }}>
                    {loading ? (
                        <div style={{ padding: '40px', textAlign: 'center' }}>
                            <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '24px', color: 'var(--admin-primary)' }}></i>
                            <p style={{ marginTop: '16px', color: 'var(--admin-gray-600)' }}>Loading Menus...</p>
                        </div>
                    ) : menus.length === 0 ? (
                        <div style={{ padding: '40px', textAlign: 'center' }}>
                            <i className="fa-solid fa-bars" style={{ fontSize: '48px', color: 'var(--admin-gray-400)' }}></i>
                            <h3 style={{ marginTop: '16px', color: 'var(--admin-gray-700)' }}>No Menus Found</h3>
                            <p style={{ color: 'var(--admin-gray-500)' }}>No menus are available in the system.</p>
                        </div>
                    ) : (
                        <>
                            <DataTable
                                columns={columns}
                                data={menus}
                                onEdit={permissions.getEditCallback((menu: Menu) => navigate(`/admin/menus/${menu.id}/edit`, { state: { menuData: menu } }))}
                                onDelete={permissions.getDeleteCallback((menu: Menu) => setDeleteDialog({ isOpen: true, menu }))}
                            />

                            {/* Pagination Controls */}
                            <div style={{
                                padding: '20px',
                                borderTop: '1px solid var(--admin-gray-200)',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                backgroundColor: 'var(--admin-gray-50)'
                            }}>
                                <div style={{ fontSize: '14px', color: 'var(--admin-gray-600)' }}>
                                    Showing {((currentPage - 1) * entriesPerPage) + 1} To {Math.min(currentPage * entriesPerPage, totalRecords)} Of {totalRecords} Entries
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <button
                                        onClick={handlePrevious}
                                        disabled={currentPage <= 1}
                                        style={{
                                            padding: '8px 12px',
                                            border: '1px solid var(--admin-gray-300)',
                                            borderRadius: '6px',
                                            backgroundColor: currentPage <= 1 ? 'var(--admin-gray-100)' : 'white',
                                            color: currentPage <= 1 ? 'var(--admin-gray-400)' : 'var(--admin-gray-700)',
                                            cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
                                            fontSize: '14px'
                                        }}
                                    >
                                        <i className="fa-solid fa-chevron-left"></i> Previous
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
                                                        padding: '8px 12px',
                                                        border: '1px solid var(--admin-gray-300)',
                                                        borderRadius: '6px',
                                                        backgroundColor: pageNum === currentPage ? 'var(--admin-primary)' : 'white',
                                                        color: pageNum === currentPage ? 'white' : 'var(--admin-gray-700)',
                                                        cursor: 'pointer',
                                                        fontSize: '14px',
                                                        minWidth: '40px'
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
                                            padding: '8px 12px',
                                            border: '1px solid var(--admin-gray-300)',
                                            borderRadius: '6px',
                                            backgroundColor: currentPage >= totalPages ? 'var(--admin-gray-100)' : 'white',
                                            color: currentPage >= totalPages ? 'var(--admin-gray-400)' : 'var(--admin-gray-700)',
                                            cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
                                            fontSize: '14px'
                                        }}
                                    >
                                        Next <i className="fa-solid fa-chevron-right"></i>
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>

            <ConfirmDialog
                isOpen={deleteDialog.isOpen}
                title="Delete Menu"
                message={`Are you sure you want to delete menu "${deleteDialog.menu?.name}"?`}
                confirmText="Delete"
                type="danger"
                onConfirm={handleDeleteMenu}
                onCancel={() => setDeleteDialog({ isOpen: false, menu: null })}
            />
        </div>
    );
}
