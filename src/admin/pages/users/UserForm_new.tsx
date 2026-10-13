import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { User, userApi, RoleDropdownItem } from '../../services/api/userApi';
import FormField from '../../components/FormField';
import { useAuth } from '../../context/AuthContext';
import { logError } from '../../utils/logError';
import '../../styles/admin.css';
import '../../styles/admin-components.css';

// Helper function to decrypt Base64 encoded password
const decryptPassword = (encryptedPassword: string): string => {
    try {
        if (!encryptedPassword) return '';
        // Decode Base64 password
        return atob(encryptedPassword);
    } catch (error) {
        console.error('Failed to decrypt password:', error);
        return ''; // Return empty if decryption fails
    }
};

export default function UserForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { user: currentUser } = useAuth();
    const isEditMode = Boolean(id);

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

    useEffect(() => {
        loadRoles();

        if (isEditMode && id) {
            // If user data was passed through navigation state, use it directly
            if (passedUserData) {
                console.log('🔥 UserForm: Using passed user data:', passedUserData);

                setFormData({
                    userName: passedUserData.userName || '',
                    password: decryptPassword(passedUserData.password || ''), // Decrypt and show the password
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
                controllerName: 'UserForm_new',
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

            console.log('🔥 UserForm: Loading user data for ID:', userId);

            // First try GetById API
            let response = await userApi.getUserById(userId);

            console.log('🔥 UserForm: GetById API Response:', response);

            // If GetById fails with 404, try to get from the list
            if (!response.success && response.message?.includes('404')) {
                console.log('🔥 UserForm: GetById failed, trying to get from list...');

                const listResponse = await userApi.getAllUsersPage(0, 150, 'asc');
                console.log('🔥 UserForm: List API Response:', listResponse);

                if (listResponse.success && listResponse.data) {
                    const user = listResponse.data.find(u => u.id === userId);
                    console.log('🔥 UserForm: Found user in list:', user);

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
                console.log('🔥 UserForm: Setting form data:', {
                    userName: response.data.userName,
                    email: response.data.email,
                    mobileNumber: response.data.mobileNumber,
                    roleId: response.data.roleId
                });

                setFormData({
                    userName: response.data.userName || '',
                    password: decryptPassword(response.data.password || ''), // Decrypt and show the password
                    email: response.data.email || '',
                    mobileNumber: response.data.mobileNumber || '',
                    roleId: response.data.roleId || 0
                });
            } else {
                console.error('🔥 UserForm: Failed to load user data:', response.message);
                setErrors({ general: response.message || 'Failed to load user data' });
            }
        } catch (error) {
            console.error('🔥 UserForm: Error loading user:', error);

            await logError({
                controllerName: 'UserForm_new',
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

        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
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

        // Password validation - required for new users, optional for edit mode
        if (!isEditMode) {
            // For new users, password is required
            if (!formData.password?.trim()) {
                newErrors.password = 'Password is required';
            } else if (formData.password.trim().length < 6) {
                newErrors.password = 'Password must be at least 6 characters';
            }
        } else {
            // For edit mode, password is optional but must be valid if provided
            if (formData.password?.trim() && formData.password.trim().length < 6) {
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

        // Role-based access control: Only admin can add/edit users
        if (currentUser?.role !== 'admin') {
            setErrors({ general: 'You do not have permission to perform this action' });
            return;
        }

        try {
            setSubmitting(true);
            setErrors({});

            let response;
            if (isEditMode && id) {
                console.log('🔥 UserForm: Updating user:', formData);
                // Only send password if it's been changed (not empty)
                const updateData = formData.password?.trim()
                    ? formData
                    : { ...formData, password: undefined };
                response = await userApi.updateUser(id, updateData);
            } else {
                console.log('🔥 UserForm: Creating user:', formData);
                response = await userApi.addUser(formData);
            }

            console.log('🔥 UserForm: API Response:', response);

            if (response.success) {
                console.log('🔥 UserForm: Success! Navigating back...');
                alert(`User ${isEditMode ? 'updated' : 'created'} successfully!`);
                navigate('/admin/users');
            } else {
                setErrors({ general: response.message || `Failed to ${isEditMode ? 'update' : 'create'} user` });
            }
        } catch (error) {
            console.error('🔥 UserForm: Submit error:', error);

            await logError({
                controllerName: 'UserForm_new',
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
                        {isEditMode ? 'Update user information' : 'Create a new user account'}
                    </p>
                </div>
                <div className="admin-page-actions">
                    <button
                        type="button"
                        onClick={() => navigate('/admin/users')}
                        className="admin-btn admin-btn-secondary"
                    >
                        <i className="fa-solid fa-arrow-left"></i>
                        Back to Users
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
                    <form onSubmit={handleSubmit} className="admin-form">
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
                                    required
                                    placeholder="Enter user name"
                                />
                            </div>
                            <div style={{ flex: 1 }}>
                                <FormField
                                    label="Email"
                                    name="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    error={errors.email}
                                    required
                                    placeholder="Enter email address"
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
                                    error={errors.mobileNumber}
                                    required
                                    placeholder="Enter 10-digit mobile number"
                                    maxLength={10}
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
                                    required
                                    options={roleOptions}
                                />
                            </div>
                        </div>

                        {/* Row 3: Password (Full Width) */}
                        <div style={{ marginBottom: '30px' }}>
                            <FormField
                                label="Password"
                                name="password"
                                type="password"
                                value={formData.password}
                                onChange={handleInputChange}
                                error={errors.password}
                                required={!isEditMode}
                                placeholder="Enter password"
                            />
                        </div>

                        <div className="admin-form-actions">
                            <button
                                type="button"
                                onClick={() => navigate('/admin/users')}
                                className="admin-btn admin-btn-secondary"
                                disabled={submitting}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="admin-btn admin-btn-primary"
                                disabled={submitting || Object.keys(errors).length > 0}
                            >
                                {submitting ? (
                                    <>
                                        <i className="fa-solid fa-spinner fa-spin"></i>
                                        {isEditMode ? 'Updating...' : 'Creating...'}
                                    </>
                                ) : (
                                    <>
                                        <i className={`fa-solid fa-${isEditMode ? 'save' : 'plus'}`}></i>
                                        {isEditMode ? 'Update User' : 'Create User'}
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
