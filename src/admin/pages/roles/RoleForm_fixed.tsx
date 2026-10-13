import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Role, roleApi, CreateRoleRequest, MenuDropdownItem } from '../../services/api/roleApi';
import FormField from '../../components/FormField';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import '../../styles/admin.css';

export default function RoleForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { user: currentUser } = useAuth();
    const { showToast } = useToast();
    const isEditMode = Boolean(id);

    // Get role data from navigation state if available
    const roleDataFromState = location.state?.roleData;

    const [formData, setFormData] = useState<Partial<CreateRoleRequest>>({
        name: '',
        selectedMenu: '',
        createdBy: 0,
        lastModifiedBy: 0,
    });

    const [menuOptions, setMenuOptions] = useState<{ value: string; label: string }[]>([]);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        loadMenuOptions();
        if (isEditMode && id) {
            if (roleDataFromState) {
                // Use data from navigation state
                setFormData({
                    name: roleDataFromState.name || '',
                    selectedMenu: roleDataFromState.selectedMenu || '',
                    createdBy: roleDataFromState.createdBy || 0,
                    lastModifiedBy: roleDataFromState.lastModifiedBy || 0,
                });
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
            } else {
                setErrors({ general: response.message || 'Failed to load role data' });
            }
        } catch (error) {
            console.error('Error loading role:', error);
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

        if (!formData.selectedMenu?.trim()) {
            newErrors.selectedMenu = 'Menu selection is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validate()) {
            return;
        }

        // Role-based access control
        if (currentUser?.role !== 'admin' && currentUser?.role !== 'manager') {
            setErrors({ general: 'You do not have permission to add or edit roles' });
            return;
        }

        setSubmitting(true);
        setErrors({});

        console.log('🔥 ROLE FORM: Submitting role form');
        console.log('🔥 ROLE FORM: Is Edit Mode:', isEditMode);
        console.log('🔥 ROLE FORM: Form Data:', formData);
        console.log('🔥 ROLE FORM: Current User:', currentUser);

        try {
            const roleData: CreateRoleRequest = {
                name: formData.name!,
                selectedMenu: formData.selectedMenu!,
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
            setErrors({ general: 'Network error occurred. Please try again.' });
        } finally {
            setSubmitting(false);
        }
    };

    const handleFieldChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
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
                        {isEditMode ? 'Update role information and menu access' : 'Create a new role with menu access'}
                    </p>
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
                        {/* Row 1: Role Name and Menu Selection */}
                        <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
                            <div style={{ flex: 1 }}>
                                <FormField
                                    label="Role Name"
                                    name="name"
                                    type="text"
                                    value={formData.name}
                                    onChange={handleFieldChange}
                                    error={errors.name}
                                    required
                                    placeholder="Enter role name"
                                />
                            </div>
                            <div style={{ flex: 1 }}>
                                <FormField
                                    label="Menu Access"
                                    name="selectedMenu"
                                    type="select"
                                    value={formData.selectedMenu}
                                    onChange={handleFieldChange}
                                    error={errors.selectedMenu}
                                    required
                                    options={menuOptions}
                                />
                            </div>
                        </div>

                        <div className="admin-form-actions">
                            <button
                                type="button"
                                onClick={() => navigate('/admin/roles')}
                                className="admin-btn admin-btn-secondary"
                                disabled={submitting}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="admin-btn admin-btn-primary"
                                disabled={submitting}
                            >
                                {submitting ? (
                                    <>
                                        <i className="fa-solid fa-spinner fa-spin"></i>
                                        {isEditMode ? 'Updating...' : 'Creating...'}
                                    </>
                                ) : (
                                    <>
                                        <i className={`fa-solid fa-${isEditMode ? 'save' : 'plus'}`}></i>
                                        {isEditMode ? 'Update Role' : 'Create Role'}
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
