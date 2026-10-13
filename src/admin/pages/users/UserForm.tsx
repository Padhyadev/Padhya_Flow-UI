import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { User, userApi, RoleDropdownItem } from '../../services/api/userApi';
import FormField from '../../components/FormField';
import { useAuth } from '../../context/AuthContext';
import { usePermission } from '../../hooks/usePermission'; // ✅ NEW
import { useToast } from '../../context/ToastContext';
import { logError } from '../../utils/logError';
import '../../styles/admin.css';
import '../../styles/admin-components.css';

export default function UserForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { user: currentUser } = useAuth();
    const { showSuccess, showError } = useToast();
    const isEditMode = Boolean(id);

    // ✅ NEW: Get dynamic permissions for User controller
    const { hasPermission } = usePermission();

    // Get user data from navigation state if available
    const passedUserData = location.state?.userData as User | undefined;

    const [formData, setFormData] = useState<{
        userName: string;
        password: string;
        email: string;
        mobileNumber: string;
        roleId: number;
    }>({
        userName: '',
        password: '',
        email: '',
        mobileNumber: '',
        roleId: 0
    });

    const [roles, setRoles] = useState<RoleDropdownItem[]>([]);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [existingUsers, setExistingUsers] = useState<User[]>([]);
    const [showPassword, setShowPassword] = useState(false); // Password hidden by default

    // Load existing users for duplicate checking
    const loadExistingUsers = async () => {
        try {
            const response = await userApi.getAllUsersPage(0, 1000, 'asc');
            if (response.success && response.data) {
                setExistingUsers(response.data);
            }
        } catch (error) {
            console.error('Error loading existing users:', error);
        }
    };

    useEffect(() => {
        loadRoles();
        loadExistingUsers();

        if (isEditMode && id) {
            // If user data was passed through navigation state, use it directly
            if (passedUserData) {
                console.log('✅ UserForm: Using passed user data:', passedUserData);
                console.log('✅ UserForm: Password from passed data:', passedUserData.password);

                setFormData({
                    userName: passedUserData.userName || '',
                    // password: passedUserData.password || '', // Show existing password in edit mode
                    password: '', // Keep password blank in edit mode
                    email: passedUserData.email || '',
                    mobileNumber: passedUserData.mobileNumber || '',
                    roleId: passedUserData.roleId || 0
                });
            } else {
                // Fallback to API call
                loadUserData(id);
            }
        }
    }, [isEditMode, id, passedUserData]);

    const loadRoles = async () => {
        try {
            const response = await userApi.getRoleDropdown();
            if (response.success) {
                setRoles(response.data || []);
            } else {
                setErrors({ general: 'Failed to load roles. Please refresh the page.' });
            }
        } catch (error) {
            console.error('Error loading roles:', error);

            await logError({
                controllerName: 'UserForm',
                methodName: 'LoadRoles',
                requestUrl: 'userApi.getRoleDropdown',
                requestPayload: null,
                error
            });

            setErrors({ general: 'Failed to load roles. Please refresh the page.' });
        }
    };

    const loadUserData = async (userId: string) => {
        try {
            setLoading(true);
            setErrors({});

            console.log(' UserForm: Loading user data for ID:', userId);

            // First try GetById API
            let response = await userApi.getUserById(userId);

            console.log(' UserForm: GetById API Response:', response);

            // If GetById fails with 404, try to get from the list
            if (!response.success && response.message?.includes('404')) {
                console.log(' UserForm: GetById failed, trying to get from list...');

                const listResponse = await userApi.getAllUsersPage(0, 150, 'asc');
                console.log(' UserForm: List API Response:', listResponse);

                if (listResponse.success && listResponse.data) {
                    const user = listResponse.data.find(u => u.id === userId);
                    console.log(' UserForm: Found user in list:', user);

                    if (user) {
                        response = {
                            success: true,
                            data: user,
                            message: 'User retrieved from list',
                            timestamp: new Date().toISOString()
                        };
                    }
                }
            }

            if (response.success && response.data) {
                console.log('✅ UserForm: API Response data:', response.data);
                console.log('✅ UserForm: Password from API:', response.data.password);
                console.log('✅ UserForm: Setting form data:', {
                    userName: response.data.userName,
                    password: response.data.password,
                    email: response.data.email,
                    mobileNumber: response.data.mobileNumber,
                    roleId: response.data.roleId
                });

                setFormData({
                    userName: response.data.userName || '',
                    // password: response.data.password || '', // Show existing password in edit mode
                    password: '', // Keep password blank in edit mode
                    email: response.data.email || '',
                    mobileNumber: response.data.mobileNumber || '',
                    roleId: response.data.roleId || 0
                });
            } else {
                console.error(' UserForm: Failed to load user data:', response.message);
                setErrors({ general: response.message || 'Failed to load user data' });
            }
        } catch (error) {
            console.error(' UserForm: Error loading user:', error);

            await logError({
                controllerName: 'UserForm',
                methodName: 'LoadUserData',
                requestUrl: `userApi.getUserById/${userId}`,
                requestPayload: { userId },
                error
            });

            setErrors({ general: 'Network error occurred while loading user data' });
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;

        // Automatically convert email to lowercase
        const processedValue = name === 'email' ? value.toLowerCase() : value;

        setFormData(prev => ({
            ...prev,
            [name]: name === 'roleId' ? parseInt(processedValue) : processedValue
        }));

        // Real-time duplicate check for userName, email, and mobileNumber
        if (name === 'userName') {
            if (value.trim()) {
                const duplicate = existingUsers.find(user =>
                    user.userName.toLowerCase() === value.trim().toLowerCase() &&
                    (!isEditMode || user.id !== id)
                );
                if (duplicate) {
                    setErrors(prev => ({ ...prev, userName: 'This username already exists' }));
                } else {
                    // Always clear error if no duplicate found
                    setErrors(prev => ({ ...prev, userName: '' }));
                }
            } else {
                // Clear error if field is empty
                setErrors(prev => ({ ...prev, userName: '' }));
            }
        } else if (name === 'email') {
            if (value.trim()) {
                const duplicate = existingUsers.find(user =>
                    user.email.toLowerCase() === value.trim().toLowerCase() &&
                    (!isEditMode || user.id !== id)
                );
                if (duplicate) {
                    setErrors(prev => ({ ...prev, email: 'This email already exists' }));
                } else {
                    // Always clear error if no duplicate found
                    setErrors(prev => ({ ...prev, email: '' }));
                }
            } else {
                // Clear error if field is empty
                setErrors(prev => ({ ...prev, email: '' }));
            }
        } else if (name === 'mobileNumber') {
            if (value.trim()) {
                const duplicate = existingUsers.find(user =>
                    user.mobileNumber === value.trim() &&
                    (!isEditMode || user.id !== id)
                );
                if (duplicate) {
                    setErrors(prev => ({ ...prev, mobileNumber: 'This mobile number already exists' }));
                } else {
                    // Always clear error if no duplicate found
                    setErrors(prev => ({ ...prev, mobileNumber: '' }));
                }
            } else {
                // Clear error if field is empty
                setErrors(prev => ({ ...prev, mobileNumber: '' }));
            }
        } else if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.userName?.trim()) {
            newErrors.userName = 'User name is required';
        } else if (formData.userName.trim().length < 3) {
            newErrors.userName = 'User name must be at least 3 characters';
        }

        if (!formData.email?.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Please enter a valid email address';
        }

        if (!formData.mobileNumber?.trim()) {
            newErrors.mobileNumber = 'Mobile number is required';
        } else if (!/^\d{10}$/.test(formData.mobileNumber.trim())) {
            newErrors.mobileNumber = 'Mobile number must be exactly 10 digits';
        }


        // Password is required only when adding new users (not in edit mode)
        if (!isEditMode) {
            if (!formData.password?.trim()) {
                newErrors.password = 'Password is required';
            } else if (formData.password.trim().length < 6) {
                newErrors.password = 'Password must be at least 6 characters';
            }
        }


        if (!formData.roleId || formData.roleId === 0) {
            newErrors.roleId = 'Role is required';
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
        // if (currentUser?.role !== 'admin') {
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
                console.log(' UserForm: Updating user:', formData);
                response = await userApi.updateUser(id, formData);
            } else {
                console.log(' UserForm: Creating user:', formData);
                response = await userApi.addUser(formData);
            }

            console.log(' UserForm: API Response:', response);

            if (response.success) {
                console.log(' UserForm: Success! Navigating back...');
                showSuccess(`User ${isEditMode ? 'updated' : 'created'} successfully`);
                navigate('/admin/users');
            } else {
                setErrors({ general: response.message || `Failed to ${isEditMode ? 'update' : 'create'} user` });
            }
        } catch (error) {
            console.error(' UserForm: Submit error:', error);

            await logError({
                controllerName: 'UserForm',
                methodName: isEditMode ? 'UpdateUser' : 'CreateUser',
                requestUrl: isEditMode ? `userApi.updateUser/${id}` : 'userApi.addUser',
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
                    <p style={{ marginTop: '16px', color: 'var(--admin-gray-600)' }}>Loading user data...</p>
                </div>
            </div>
        );
    }

    // Convert roles to options format
    const roleOptions = roles.map(role => ({
        value: role.id,
        label: role.name
    }));

    return (
        <div className="admin-page">
            <div className="admin-page-header">
                <div>
                    <h1 className="admin-page-title">
                        {isEditMode ? 'Edit User' : 'Add New User'}
                    </h1>
                    <p className="admin-page-subtitle">
                        {isEditMode ? 'Update user information' : 'Create a New User Account'}
                    </p>
                </div>
                <div className="admin-page-actions">
                    <button
                        type="button"
                        onClick={() => navigate('/admin/users')}
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
                    <h2>User Information</h2>
                </div>
                <div className="admin-card-body">
                    <form onSubmit={handleSubmit} className="admin-form" noValidate>
                        {/* Row 1: User Name and Email */}
                        <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
                            <div style={{ flex: 1 }}>
                                <FormField
                                    label="User Name"
                                    name="userName"
                                    type="text"
                                    value={formData.userName}
                                    onChange={handleInputChange}
                                    error={errors.userName}
                                    placeholder="Enter User Name"
                                    required={true}
                                />
                            </div>
                            <div style={{ flex: 1 }}>
                                <FormField
                                    label="Email"
                                    name="email"
                                    type="text"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    error={errors.email}
                                    placeholder="Enter Email Address"
                                    required={true}
                                />
                            </div>
                        </div>

                        {/* Row 2: Mobile Number and Role */}
                        <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
                            <div style={{ flex: 1 }}>
                                <FormField
                                    label="Mobile Number"
                                    name="mobileNumber"
                                    type="text"
                                    value={formData.mobileNumber}
                                    onChange={handleInputChange}
                                    onKeyPress={(e) => {
                                        // Only allow numeric digits (0-9)
                                        if (!/[0-9]/.test(e.key)) {
                                            e.preventDefault();
                                        }
                                    }}
                                    error={errors.mobileNumber}
                                    placeholder="Enter 10-Digit Mobile Number"
                                    maxLength={10}
                                    required={true}
                                />
                            </div>
                            <div style={{ flex: 1 }}>
                                <FormField
                                    label="Role"
                                    name="roleId"
                                    type="select"
                                    value={formData.roleId}
                                    onChange={handleInputChange}
                                    error={errors.roleId}
                                    options={roleOptions}
                                    required={true}
                                />
                            </div>
                        </div>

                        {/* Row 3: Password (Full Width) with Eye Icon - Only show in Add mode */}
                        {!isEditMode && (
                            <div style={{ marginBottom: '30px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '14px' }}>
                                    Password <span style={{ color: 'var(--admin-danger)' }}>*</span>
                                </label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        name="password"
                                        value={formData.password}
                                        onChange={handleInputChange}
                                        placeholder="Enter Password"
                                        style={{
                                            width: '100%',
                                            padding: '12px',
                                            paddingRight: '45px',
                                            border: errors.password ? '2px solid var(--admin-danger)' : '2px solid #e5e7eb',
                                            borderRadius: '8px',
                                            fontSize: '14px',
                                            outline: 'none',
                                            transition: 'border-color 0.2s'
                                        }}
                                        onFocus={(e) => {
                                            if (!errors.password) {
                                                e.target.style.borderColor = 'var(--admin-primary)';
                                            }
                                        }}
                                        onBlur={(e) => {
                                            if (!errors.password) {
                                                e.target.style.borderColor = '#e5e7eb';
                                            }
                                        }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        style={{
                                            position: 'absolute',
                                            right: '12px',
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            background: 'none',
                                            border: 'none',
                                            cursor: 'pointer',
                                            padding: '4px',
                                            color: '#6b7280',
                                            fontSize: '18px'
                                        }}
                                        title={showPassword ? 'Hide password' : 'Show password'}
                                    >
                                        <i className={showPassword ? 'fa-solid fa-eye' : 'fa-solid fa-eye-slash'}></i>
                                    </button>
                                </div>
                                {errors.password && (
                                    <span style={{
                                        display: 'block',
                                        fontSize: '12px',
                                        color: 'var(--admin-danger)',
                                        marginTop: '4px',
                                        fontWeight: '500'
                                    }}>
                                        {errors.password}
                                    </span>
                                )}
                            </div>
                        )}


                        <div className="admin-form-actions">
                            <button
                                type="submit"
                                className="admin-btn admin-btn-primary"
                                disabled={submitting || Boolean(errors.userName || errors.email || errors.mobileNumber)}
                            >
                                {submitting ? 'Saving...' : 'Save'}
                            </button>
                            <button
                                type="button"
                                onClick={() => navigate('/admin/users')}
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