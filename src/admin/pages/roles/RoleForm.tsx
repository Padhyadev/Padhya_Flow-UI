import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Role, roleApi, CreateRoleRequest, MenuDropdownItem } from '../../services/api/roleApi';
import FormField from '../../components/FormField';
import { useAuth } from '../../context/AuthContext';
import { usePermission } from '../../hooks/usePermission'; // ✅ NEW
import { useToast } from '../../context/ToastContext';
import { logError } from '../../utils/logError';
import '../../styles/admin.css';

export default function RoleForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { user: currentUser } = useAuth();
    const { showToast } = useToast();
    const isEditMode = Boolean(id);

    // ✅ NEW: Get dynamic permissions for Role controller
    const { hasPermission } = usePermission();

    // Get role data from navigation state if available
    const roleDataFromState = location.state?.roleData;

    const [formData, setFormData] = useState<Partial<CreateRoleRequest>>({
        name: '',
        selectedMenu: '',
        createdBy: 0,
        lastModifiedBy: 0,
    });

    const [selectedMenus, setSelectedMenus] = useState<string[]>([]);
    const [menuOptions, setMenuOptions] = useState<{ value: string; label: string }[]>([]);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [existingRoles, setExistingRoles] = useState<Role[]>([]);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Load existing roles for duplicate checking
    const loadExistingRoles = async () => {
        try {
            const response = await roleApi.getAllRolesPage(0, 1000, 'asc');
            if (response.success && response.data) {
                setExistingRoles(response.data);
            }
        } catch (error) {
            console.error('Error loading existing roles:', error);
        }
    };

    useEffect(() => {
        loadMenuOptions();
        loadExistingRoles();
        if (isEditMode && id) {
            if (roleDataFromState) {
                // Use data from navigation state
                setFormData({
                    name: roleDataFromState.name || '',
                    selectedMenu: roleDataFromState.selectedMenu || '',
                    createdBy: roleDataFromState.createdBy || 0,
                    lastModifiedBy: roleDataFromState.lastModifiedBy || 0,
                });
                // Parse selected menus if comma-separated
                if (roleDataFromState.selectedMenu) {
                    setSelectedMenus(roleDataFromState.selectedMenu.split(','));
                }
            } else {
                // Load from API
                loadRoleData(id);
            }
        }
    }, [isEditMode, id, roleDataFromState]);

    const loadMenuOptions = async () => {
        try {
            const response = await roleApi.getMenuDropdown();
            if (response.success) {
                const options = response.data.map((menu: MenuDropdownItem) => ({
                    value: menu.id,
                    label: menu.name
                }));
                setMenuOptions(options);
            } else {
                setErrors({ general: 'Failed to load menu options' });
            }
        } catch (error) {
            console.error('Error loading menu options:', error);

            await logError({
                controllerName: 'RoleForm',
                methodName: 'LoadMenuOptions',
                requestUrl: 'roleApi.getMenuDropdown',
                requestPayload: null,
                error
            });

            setErrors({ general: 'Network error occurred while loading menu options' });
        }
    };

    const loadRoleData = async (roleId: string) => {
        try {
            setLoading(true);
            setErrors({});
            console.log('Loading role data for ID:', roleId);
            const response = await roleApi.getRoleById(roleId);
            console.log('API Response:', response);
            if (response.success && response.data) {
                setFormData({
                    name: response.data.name || '',
                    selectedMenu: response.data.selectedMenu || '',
                    createdBy: response.data.createdBy || 0,
                    lastModifiedBy: response.data.lastModifiedBy || 0,
                });
                // Parse selected menus if comma-separated
                if (response.data.selectedMenu) {
                    setSelectedMenus(response.data.selectedMenu.split(','));
                }
            } else {
                setErrors({ general: response.message || 'Failed to load role data' });
            }
        } catch (error) {
            console.error('Error loading role:', error);

            await logError({
                controllerName: 'RoleForm',
                methodName: 'LoadRoleData',
                requestUrl: `roleApi.getRoleById/${roleId}`,
                requestPayload: { roleId },
                error
            });

            setErrors({ general: 'Network error occurred while loading role data' });
        } finally {
            setLoading(false);
        }
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.name?.trim()) {
            newErrors.name = 'Role name is required';
        }

        if (selectedMenus.length === 0) {
            newErrors.selectedMenu = 'At least one menu selection is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Handle menu selection toggle
    const toggleMenuSelection = (menuId: string) => {
        setSelectedMenus(prev => {
            const newSelection = prev.includes(menuId)
                ? prev.filter(id => id !== menuId)
                : [...prev, menuId];

            // Update form data
            setFormData(prevData => ({
                ...prevData,
                selectedMenu: newSelection.join(',')
            }));

            // Clear error if any menu is selected
            if (newSelection.length > 0 && errors.selectedMenu) {
                setErrors(prevErrors => ({ ...prevErrors, selectedMenu: '' }));
            }

            return newSelection;
        });
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validate()) {
            return;
        }

        // ❌ REMOVED: Blocking permission check
        // Permission enforcement is handled at route/menu level via PermissionGuard
        // If user can access this form, they have the necessary permissions
        //
        // ❌ STATIC ROLE CHECK (Commented out)
        // if (currentUser?.role !== 'admin' && currentUser?.role !== 'manager') {
        //     setErrors({ general: 'You do not have permission to add or edit roles' });
        //     return;
        // }
        //
        // ✅ NEW: Permission enforcement via route guards and menu access
        // No need to block form submission here

        setSubmitting(true);
        setErrors({});

        console.log('🔥 ROLE FORM: Submitting role form');
        console.log('🔥 ROLE FORM: Is Edit Mode:', isEditMode);
        console.log('🔥 ROLE FORM: Form Data:', formData);
        console.log('🔥 ROLE FORM: Selected Menus:', selectedMenus);
        console.log('🔥 ROLE FORM: Current User:', currentUser);

        try {
            const roleData: CreateRoleRequest = {
                name: formData.name!,
                selectedMenu: selectedMenus.join(','), // Join multiple menus with comma
                createdBy: formData.createdBy || 0,
                lastModifiedBy: formData.lastModifiedBy || 0,
            };

            console.log('🔥 ROLE FORM: Calling API...');
            const response = isEditMode
                ? await roleApi.updateRole(id!, roleData)
                : await roleApi.addRole(roleData);

            console.log('🔥 ROLE FORM: API Response:', response);

            if (response.success) {
                console.log('🔥 ROLE FORM: ✅ Role saved successfully!');
                showToast(
                    isEditMode ? 'Role updated successfully!' : 'Role created successfully!',
                    'success'
                );
                navigate('/admin/roles');
            } else {
                console.error('🔥 ROLE FORM: ❌ API returned failure:', response.message);
                setErrors({ general: response.message || 'Failed to save role' });
            }
        } catch (error) {
            console.error('🔥 ROLE FORM: ❌ Exception occurred:', error);

            await logError({
                controllerName: 'RoleForm',
                methodName: isEditMode ? 'UpdateRole' : 'CreateRole',
                requestUrl: isEditMode ? `roleApi.updateRole/${id}` : 'roleApi.addRole',
                requestPayload: formData,
                error
            });

            setErrors({ general: 'Network error occurred. Please try again.' });
        } finally {
            setSubmitting(false);
        }
    };

    const handleFieldChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        // Real-time duplicate check for role name
        if (name === 'name') {
            if (value.trim()) {
                const duplicate = existingRoles.find(role =>
                    role.name.toLowerCase() === value.trim().toLowerCase() &&
                    (!isEditMode || role.id !== id)
                );

                if (duplicate) {
                    setErrors(prev => ({ ...prev, name: 'This role name already exists' }));
                } else {
                    // Always clear error if no duplicate found
                    setErrors(prev => ({ ...prev, name: '' }));
                }
            } else {
                // Clear error if field is empty
                setErrors(prev => ({ ...prev, name: '' }));
            }
        } else if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };


    if (loading) {
        return (
            <div className="admin-page">
                <div style={{ padding: '40px', textAlign: 'center' }}>
                    <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '24px', color: 'var(--admin-primary)' }}></i>
                    <p style={{ marginTop: '16px', color: 'var(--admin-gray-600)' }}>Loading role data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-page">
            <div className="admin-page-header">
                <div>
                    <h1 className="admin-page-title">
                        {isEditMode ? 'Edit Role' : 'Add New Role'}
                    </h1>
                    <p className="admin-page-subtitle">
                        {isEditMode ? 'Update role information and menu access' : 'Create a New Role With Menu Access'}
                    </p>
                </div>
                <div className="admin-page-actions">
                    <button
                        type="button"
                        onClick={() => navigate('/admin/roles')}
                        className="admin-btn admin-btn-secondary"
                    >
                        <i className="fa-solid fa-arrow-left"></i>
                        Back to List
                    </button>
                </div>
            </div>

            {errors.general && (
                <div className="admin-alert admin-alert-error">
                    <i className="fa-solid fa-circle-exclamation"></i>
                    {errors.general}
                </div>
            )}

            <div className="admin-card">
                <div className="admin-card-header">
                    <h2>Role Information</h2>
                </div>
                <div className="admin-card-body">
                    <form onSubmit={handleSubmit} className="admin-form">
                        {/* Role Name */}
                        <div style={{ marginBottom: '20px' }}>
                            <FormField
                                label="Role Name"
                                name="name"
                                type="text"
                                value={formData.name}
                                onChange={handleFieldChange}
                                error={errors.name}
                                required
                                placeholder="Enter Role Name"
                            />
                        </div>

                        {/* Multiple Menu Selection Dropdown */}
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{
                                display: 'block',
                                marginBottom: '8px',
                                fontWeight: '600',
                                color: 'var(--admin-gray-900)'
                            }}>
                                Menu Access <span style={{ color: 'var(--admin-danger)' }}>*</span>
                            </label>

                            {errors.selectedMenu && (
                                <div style={{
                                    color: 'var(--admin-danger)',
                                    fontSize: '14px',
                                    marginBottom: '8px'
                                }}>
                                    {errors.selectedMenu}
                                </div>
                            )}

                            {/* Custom Multi-Select Dropdown */}
                            <div ref={dropdownRef} style={{ position: 'relative' }}>
                                {/* Dropdown Trigger */}
                                <div
                                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                    style={{
                                        width: '100%',
                                        minHeight: '48px',
                                        padding: '12px 16px',
                                        border: `2px solid ${errors.selectedMenu ? 'var(--admin-danger)' : '#e5e7eb'}`,
                                        borderRadius: '8px',
                                        fontSize: '14px',
                                        backgroundColor: 'white',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        transition: 'border-color 0.2s ease'
                                    }}
                                >
                                    <span style={{
                                        color: selectedMenus.length > 0 ? 'var(--admin-gray-900)' : 'var(--admin-gray-500)',
                                        flex: 1
                                    }}>
                                        {selectedMenus.length > 0
                                            ? `${selectedMenus.length} menu${selectedMenus.length > 1 ? 's' : ''} selected`
                                            : 'Select Menus...'
                                        }
                                    </span>
                                    <i
                                        className={`fa-solid fa-chevron-${isDropdownOpen ? 'up' : 'down'}`}
                                        style={{
                                            color: 'var(--admin-gray-400)',
                                            fontSize: '12px',
                                            transition: 'transform 0.2s ease'
                                        }}
                                    />
                                </div>

                                {/* Dropdown Menu */}
                                {isDropdownOpen && (
                                    <div style={{
                                        position: 'absolute',
                                        top: '100%',
                                        left: 0,
                                        right: 0,
                                        backgroundColor: 'white',
                                        border: '2px solid #e5e7eb',
                                        borderTop: 'none',
                                        borderRadius: '0 0 8px 8px',
                                        maxHeight: '200px',
                                        overflowY: 'auto',
                                        zIndex: 1000,
                                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                                    }}>
                                        {menuOptions.map(menu => (
                                            <div
                                                key={menu.value}
                                                onClick={() => toggleMenuSelection(menu.value)}
                                                style={{
                                                    padding: '12px 16px',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '12px',
                                                    borderBottom: '1px solid #f3f4f6',
                                                    backgroundColor: selectedMenus.includes(menu.value)
                                                        ? 'var(--admin-primary-bg)'
                                                        : 'white',
                                                    transition: 'background-color 0.2s ease'
                                                }}
                                                onMouseEnter={(e) => {
                                                    if (!selectedMenus.includes(menu.value)) {
                                                        e.currentTarget.style.backgroundColor = '#f9fafb';
                                                    }
                                                }}
                                                onMouseLeave={(e) => {
                                                    if (!selectedMenus.includes(menu.value)) {
                                                        e.currentTarget.style.backgroundColor = 'white';
                                                    }
                                                }}
                                            >
                                                <div style={{
                                                    width: '18px',
                                                    height: '18px',
                                                    border: '2px solid var(--admin-primary)',
                                                    borderRadius: '4px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    backgroundColor: selectedMenus.includes(menu.value)
                                                        ? 'var(--admin-primary)'
                                                        : 'white',
                                                    transition: 'all 0.2s ease'
                                                }}>
                                                    {selectedMenus.includes(menu.value) && (
                                                        <i
                                                            className="fa-solid fa-check"
                                                            style={{
                                                                color: 'white',
                                                                fontSize: '10px'
                                                            }}
                                                        />
                                                    )}
                                                </div>
                                                <span style={{
                                                    fontSize: '14px',
                                                    color: 'var(--admin-gray-900)',
                                                    fontWeight: selectedMenus.includes(menu.value) ? '600' : '500'
                                                }}>
                                                    {menu.label}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <p style={{
                                fontSize: '12px',
                                color: 'var(--admin-gray-500)',
                                marginTop: '6px'
                            }}>
                                Click to select/deselect multiple menus
                            </p>

                            {selectedMenus.length > 0 && (
                                <div style={{
                                    marginTop: '12px',
                                    padding: '12px',
                                    backgroundColor: '#f0fdf4',
                                    borderRadius: '8px',
                                    border: '1px solid #86efac'
                                }}>
                                    <p style={{ fontSize: '14px', color: '#166534', fontWeight: '600' }}>
                                        <i className="fa-solid fa-check-circle"></i> Selected: {selectedMenus.map(menuId => {
                                            const menu = menuOptions.find(m => m.value === menuId);
                                            return menu ? menu.label : menuId;
                                        }).join(', ')}
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="admin-form-actions">
                            <button
                                type="submit"
                                className="admin-btn admin-btn-primary"
                                disabled={submitting || Boolean(errors.name)}
                            >
                                {submitting ? 'Saving...' : 'Save'}
                            </button>
                            <button
                                type="button"
                                onClick={() => navigate('/admin/roles')}
                                className="admin-btn admin-btn-secondary"
                                disabled={submitting}
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
