import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Menu, menuApi } from '../../services/api/menuApi';
import FormField from '../../components/FormField';
import { useAuth } from '../../context/AuthContext';
import { usePermission } from '../../hooks/usePermission'; // ✅ NEW: Import permission hook
import { useToast } from '../../context/ToastContext';
import { logError } from '../../utils/logError';
import '../../styles/admin.css';
import '../../styles/admin-components.css';

interface MenuFormData {
    parentId: number;
    area: string;
    controller: string;
    url: string;
    name: string;
    icon: string;
    displayOrder: number;
}

export default function MenuForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { user: currentUser } = useAuth();
    const { showSuccess, showError } = useToast();
    const isEditMode = Boolean(id);

    // ✅ NEW: Get dynamic permissions for Menu controller
    const { hasPermission } = usePermission();

    const passedMenuData = location.state?.menuData as Menu | undefined;

    const [formData, setFormData] = useState<MenuFormData>({
        parentId: 0,
        area: '',
        controller: '',
        url: '',
        name: '',
        icon: '',
        displayOrder: 0
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [parentMenus, setParentMenus] = useState<Array<{ value: number; label: string }>>([]);
    const [existingMenus, setExistingMenus] = useState<Menu[]>([]);

    // Load existing menus for duplicate checking
    const loadExistingMenus = async () => {
        try {
            const response = await menuApi.getAllMenusPage(0, 1000, 'asc');
            if (response.success && response.data) {
                setExistingMenus(response.data);
            }
        } catch (error) {
            console.error('Error loading existing menus:', error);
        }
    };

    // Load parent menus for dropdown
    useEffect(() => {
        loadExistingMenus();
        const loadParentMenus = async () => {
            try {
                const response = await menuApi.getMenuParentList();
                if (response.success && response.data) {
                    const options = response.data.map(parent => ({
                        value: parent.id,
                        label: parent.name
                    }));
                    setParentMenus(options);
                }
            } catch (error) {
                console.error('Error loading parent menus:', error);

                await logError({
                    controllerName: 'MenuForm',
                    methodName: 'LoadParentMenus',
                    requestUrl: 'menuApi.getMenuParentList',
                    requestPayload: null,
                    error
                });

                // Set default "No Parent" option if API fails
                setParentMenus([{ value: 0, label: 'No Parent' }]);
            }
        };
        loadParentMenus();
    }, []);

    useEffect(() => {
        if (isEditMode && id) {
            if (passedMenuData) {
                console.log('🔥 MenuForm: Using passed menu data:', passedMenuData);
                setFormData({
                    parentId: passedMenuData.parentId || 0,
                    area: passedMenuData.area || '',
                    controller: passedMenuData.controller || '',
                    url: passedMenuData.url || '',
                    name: passedMenuData.name || '',
                    icon: passedMenuData.icon || '',
                    displayOrder: passedMenuData.displayOrder || 0
                });
            } else {
                loadMenuData(id);
            }
        }
    }, [isEditMode, id, passedMenuData]);

    const loadMenuData = async (menuId: string) => {
        try {
            setLoading(true);
            setErrors({});

            console.log('🔥 MenuForm: Loading menu data for ID:', menuId);

            let response = await menuApi.getMenuById(menuId);

            console.log('🔥 MenuForm: GetById API Response:', response);

            if (!response.success && response.message?.includes('404')) {
                console.log('🔥 MenuForm: GetById failed, trying to get from list...');

                const listResponse = await menuApi.getAllMenusPage(0, 1000, 'asc');
                console.log('🔥 MenuForm: List API Response:', listResponse);

                if (listResponse.success && listResponse.data) {
                    const menu = listResponse.data.find(m => m.id === menuId);
                    console.log('🔥 MenuForm: Found menu in list:', menu);

                    if (menu) {
                        response = {
                            success: true,
                            data: menu,
                            message: 'Menu retrieved from list',
                            timestamp: new Date().toISOString()
                        };
                    }
                }
            }

            if (response.success && response.data) {
                console.log('🔥 MenuForm: Setting form data');

                setFormData({
                    parentId: response.data.parentId || 0,
                    area: response.data.area || '',
                    controller: response.data.controller || '',
                    url: response.data.url || '',
                    name: response.data.name || '',
                    icon: response.data.icon || '',
                    displayOrder: response.data.displayOrder || 0
                });
            } else {
                console.error('🔥 MenuForm: Failed to load menu data:', response.message);
                setErrors({ general: response.message || 'Failed to load menu data' });
            }
        } catch (error) {
            console.error('🔥 MenuForm: Error loading menu:', error);

            await logError({
                controllerName: 'MenuForm',
                methodName: 'LoadMenuData',
                requestUrl: `menuApi.getMenuById/${menuId}`,
                requestPayload: { menuId },
                error
            });

            setErrors({ general: 'Network error occurred while loading menu data' });
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;

        // Convert to number for numeric fields
        const processedValue = (name === 'parentId' || name === 'displayOrder')
            ? parseInt(value) || 0
            : value;

        setFormData(prev => ({
            ...prev,
            [name]: processedValue
        }));

        // Real-time duplicate check for menu name
        if (name === 'name' && value.trim()) {
            const duplicate = existingMenus.find(menu =>
                menu.name.toLowerCase() === value.trim().toLowerCase() &&
                (!isEditMode || menu.id !== id)
            );
            if (duplicate) {
                setErrors(prev => ({ ...prev, name: 'This menu name already exists' }));
            } else if (errors[name]) {
                setErrors(prev => ({ ...prev, [name]: '' }));
            }
        } else if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.name?.trim()) {
            newErrors.name = 'Menu name is required';
        } else if (formData.name.trim().length < 2) {
            newErrors.name = 'Menu name must be at least 2 characters';
        }

        if (!formData.url?.trim()) {
            newErrors.url = 'URL is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

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
        //     setErrors({ general: 'You do not have permission to perform this action' });
        //     return;
        // }
        //
        // ✅ NEW: Permission enforcement via route guards and menu access
        // No need to block form submission here

        try {
            setSubmitting(true);
            setErrors({});

            let response;
            if (isEditMode && id) {
                console.log('🔥 MenuForm: Updating menu:', formData);
                response = await menuApi.updateMenu(id, formData);
            } else {
                console.log('🔥 MenuForm: Creating menu:', formData);
                response = await menuApi.addMenu(formData);
            }

            console.log('🔥 MenuForm: API Response:', response);

            if (response.success) {
                console.log('🔥 MenuForm: Success! Navigating back...');
                showSuccess(`Menu ${isEditMode ? 'updated' : 'created'} successfully`);
                navigate('/admin/menus');
            } else {
                setErrors({ general: response.message || `Failed to ${isEditMode ? 'update' : 'create'} menu` });
            }
        } catch (error) {
            console.error('🔥 MenuForm: Submit error:', error);

            await logError({
                controllerName: 'MenuForm',
                methodName: isEditMode ? 'UpdateMenu' : 'CreateMenu',
                requestUrl: isEditMode ? `menuApi.updateMenu/${id}` : 'menuApi.addMenu',
                requestPayload: formData,
                error
            });

            setErrors({ general: 'Network error occurred. Please try again.' });
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="admin-page">
                <div style={{ padding: '40px', textAlign: 'center' }}>
                    <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '24px', color: 'var(--admin-primary)' }}></i>
                    <p style={{ marginTop: '16px', color: 'var(--admin-gray-600)' }}>Loading menu data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-page">
            <div className="admin-page-header">
                <div>
                    <h1 className="admin-page-title">
                        {isEditMode ? 'Edit Menu' : 'Add New Menu'}
                    </h1>
                    <p className="admin-page-subtitle">
                        {isEditMode ? 'Update menu information' : 'Create a New Menu Entry'}
                    </p>
                </div>
                <div className="admin-page-actions">
                    <button
                        type="button"
                        onClick={() => navigate('/admin/menus')}
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
                    <h2>Menu Information</h2>
                </div>
                <div className="admin-card-body">
                    <form onSubmit={handleSubmit} className="admin-form">
                        <div className="admin-form-grid">
                            <div className="admin-form-group">
                                <FormField
                                    label="Menu Name"
                                    name="name"
                                    type="text"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    error={errors.name}
                                    required
                                    placeholder="Enter Menu Name"
                                />
                            </div>

                            <div className="admin-form-group">
                                <FormField
                                    label="URL"
                                    name="url"
                                    type="text"
                                    value={formData.url}
                                    onChange={handleInputChange}
                                    error={errors.url}
                                    required
                                    placeholder="/admin/example"
                                />
                            </div>

                            <div className="admin-form-group">
                                <FormField
                                    label="Icon"
                                    name="icon"
                                    type="text"
                                    value={formData.icon}
                                    onChange={handleInputChange}
                                    error={errors.icon}
                                    placeholder="Fa-Solid Fa-Home"
                                // helpText="Font Awesome icon class"
                                />
                            </div>

                            <div className="admin-form-group">
                                <FormField
                                    label="Display Order"
                                    name="displayOrder"
                                    type="number"
                                    value={formData.displayOrder}
                                    onChange={handleInputChange}
                                    error={errors.displayOrder}
                                    placeholder="0"
                                />
                            </div>

                            <div className="admin-form-group">
                                <FormField
                                    label="Area"
                                    name="area"
                                    type="text"
                                    value={formData.area}
                                    onChange={handleInputChange}
                                    error={errors.area}
                                    placeholder="Admin"
                                />
                            </div>

                            <div className="admin-form-group">
                                <FormField
                                    label="Controller"
                                    name="controller"
                                    type="text"
                                    value={formData.controller}
                                    onChange={handleInputChange}
                                    error={errors.controller}
                                    placeholder="Dashboard"
                                />
                            </div>

                            <div className="admin-form-group">
                                <FormField
                                    label="Parent Menu"
                                    name="parentId"
                                    type="select"
                                    value={formData.parentId}
                                    onChange={handleInputChange}
                                    error={errors.parentId}
                                    options={parentMenus}
                                    helpText="Select Parent Menu or 'No Parent' for top-level menu"
                                />
                            </div>
                        </div>

                        <div className="admin-form-actions">
                            <button
                                type="submit"
                                className="admin-btn admin-btn-primary"
                                disabled={submitting}
                            >
                                {submitting ? 'Saving...' : 'Save'}
                            </button>
                            <button
                                type="button"
                                onClick={() => navigate('/admin/menus')}
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
