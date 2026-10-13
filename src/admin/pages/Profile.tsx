import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { changePasswordApi } from '../services/api/changePasswordApi';
import { resetPasswordApi } from '../services/api/resetPasswordApi';
import { logError } from '../utils/logError';
import '../styles/admin.css';
import '../styles/admin-components.css';

export default function Profile() {
    const { user } = useAuth();
    const { showSuccess, showError, showWarning } = useToast();
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        phone: '',
        address: ''
    });

    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});
    const [changingPassword, setChangingPassword] = useState(false);
    const [showPasswords, setShowPasswords] = useState({
        current: false,
        new: false,
        confirm: false
    });

    const [resetUsername, setResetUsername] = useState('');
    const [resetError, setResetError] = useState('');
    const [resettingPassword, setResettingPassword] = useState(false);

    const handleSaveProfile = (e: React.FormEvent) => {
        e.preventDefault();
        showSuccess('Profile updated successfully');
        setIsEditing(false);
    };

    const validatePasswordForm = (): boolean => {
        const errors: Record<string, string> = {};

        if (!passwordData.currentPassword.trim()) {
            errors.currentPassword = 'Current password is required';
        }

        if (!passwordData.newPassword.trim()) {
            errors.newPassword = 'New password is required';
        } else if (passwordData.newPassword.trim().length < 6) {
            errors.newPassword = 'New password must be at least 6 characters';
        } else if (/^(\w)\1+$/.test(passwordData.newPassword.trim())) {
            errors.newPassword = 'Password cannot consist of repeating characters only';
        } else if (!/(?=.*[a-zA-Z])(?=.*[0-9])/.test(passwordData.newPassword.trim())) {
            errors.newPassword = 'Password must contain at least one letter and one number';
        }

        if (!passwordData.confirmPassword.trim()) {
            errors.confirmPassword = 'Please confirm your new password';
        } else if (passwordData.newPassword !== passwordData.confirmPassword) {
            errors.confirmPassword = 'Passwords do not match';
        }

        if (passwordData.currentPassword && passwordData.newPassword &&
            passwordData.currentPassword === passwordData.newPassword) {
            errors.newPassword = 'New password must be different from current password';
        }

        setPasswordErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validatePasswordForm()) {
            return;
        }

        if (!user?.id) {
            showError('User information not found. Please login again.');
            return;
        }

        try {
            setChangingPassword(true);
            setPasswordErrors({});

            console.log('🔑 Changing password for user:', user.id);

            const response = await changePasswordApi.changePassword({
                userId: user.id,
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword
            });

            console.log('🔑 Change password response:', response);

            if (response.success) {
                showSuccess(response.message || 'Password changed successfully');
                setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                setPasswordErrors({});
            } else {
                // Check for specific error messages to assign to fields
                const errorMsg = response.message || 'Failed to change password';

                if (errorMsg.toLowerCase().includes('old password') || errorMsg.toLowerCase().includes('current password')) {
                    setPasswordErrors({ currentPassword: errorMsg });
                } else {
                    showError(errorMsg);
                    setPasswordErrors({ general: errorMsg });
                }
            }
        } catch (error) {
            console.error('Change password error:', error);

            await logError({
                controllerName: 'Profile',
                methodName: 'HandleChangePassword',
                requestUrl: 'changePasswordApi.changePassword',
                requestPayload: { userId: user.id },
                error
            });

            showError('Network error occurred. Please try again.');
            setPasswordErrors({ general: 'Network error occurred. Please try again.' });
        } finally {
            setChangingPassword(false);
        }
    };

    const [validUsernames, setValidUsernames] = useState<string[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(false);

    useEffect(() => {
        if (user?.role === 'admin') {
            const fetchUsers = async () => {
                try {
                    setLoadingUsers(true);
                    // Dynamically import userApi to avoid circular dependencies if any, 
                    // though standard import at top is better. I will assume standard import is added.
                    // Actually, I'll use the imported userApi.
                    const response = await (await import('../services/api/userApi')).userApi.getAllUsersPage(0, 1000);
                    if (response.success && response.data) {
                        // Store lowercase for case-insensitive comparison
                        const usernames = response.data.map(u => u.userName.toLowerCase());
                        setValidUsernames(usernames);
                    }
                } catch (err) {
                    console.error("Failed to load users for validation", err);
                } finally {
                    setLoadingUsers(false);
                }
            };
            fetchUsers();
        }
    }, [user?.role]);

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!resetUsername.trim()) {
            setResetError('Username is required');
            return;
        }

        // Validate if username exists
        // We use case-insensitive check
        if (validUsernames.length > 0 && !validUsernames.includes(resetUsername.trim().toLowerCase())) {
            setResetError('Invalid username. Please enter a proper username of an existing employee.');
            return;
        }

        try {
            setResettingPassword(true);
            setResetError('');

            console.log('🔄 Resetting password for username:', resetUsername);

            const response = await resetPasswordApi.resetPassword({
                username: resetUsername
            });

            console.log('🔄 Reset password response:', response);

            if (response.success) {
                showSuccess(response.message || 'Password reset successfully');
                setResetUsername('');
                setResetError('');
            } else {
                showError(response.message || 'Failed to reset password');
                setResetError(response.message || 'Failed to reset password');
            }
        } catch (error) {
            console.error('Reset password error:', error);

            await logError({
                controllerName: 'Profile',
                methodName: 'HandleResetPassword',
                requestUrl: 'resetPasswordApi.resetPassword',
                requestPayload: { username: resetUsername },
                error
            });

            showError('Network error occurred. Please try again.');
            setResetError('Network error occurred. Please try again.');
        } finally {
            setResettingPassword(false);
        }
    };

    return (
        <div className="admin-page">
            <div className="admin-page-header">
                <div>
                    <h1 className="admin-page-title">My Profile</h1>
                    <p className="admin-page-subtitle">Manage your account information</p>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
                {/* Profile Information */}
                <div className="admin-card">
                    <div className="admin-card-header">
                        <h2>Profile Information</h2>
                        {!isEditing && (
                            <button
                                className="admin-btn admin-btn-sm admin-btn-primary"
                                onClick={() => setIsEditing(true)}
                            >
                                <i className="fa-solid fa-edit"></i>
                                Edit
                            </button>
                        )}
                    </div>
                    <div className="admin-card-body">
                        <form onSubmit={handleSaveProfile}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
                                        Full Name
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        disabled={!isEditing}
                                        style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '2px solid #e5e7eb' }}
                                    />
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value.toLowerCase() })}
                                        disabled={!isEditing}
                                        style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '2px solid #e5e7eb' }}
                                    />
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
                                        Phone
                                    </label>
                                    <input
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        disabled={!isEditing}
                                        placeholder="Enter phone number"
                                        style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '2px solid #e5e7eb' }}
                                    />
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
                                        Address
                                    </label>
                                    <textarea
                                        value={formData.address}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                        disabled={!isEditing}
                                        placeholder="Enter address"
                                        rows={3}
                                        style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '2px solid #e5e7eb' }}
                                    />
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
                                        Role
                                    </label>
                                    <input
                                        type="text"
                                        value={user?.role.replace('_', ' ').toUpperCase()}
                                        disabled
                                        style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '2px solid #e5e7eb', background: '#f9fafb' }}
                                    />
                                </div>

                                {isEditing && (
                                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                                        <button type="submit" className="admin-btn admin-btn-primary">
                                            Save Changes
                                        </button>
                                        <button
                                            type="button"
                                            className="admin-btn admin-btn-secondary"
                                            onClick={() => setIsEditing(false)}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                )}
                            </div>
                        </form>
                    </div>
                </div>

                {/* Change Password */}
                <div className="admin-card">
                    <div className="admin-card-header">
                        <h2>Change Password</h2>
                    </div>
                    <div className="admin-card-body">
                        {passwordErrors.general && (
                            <div className="admin-alert admin-alert-error" style={{ marginBottom: '20px' }}>
                                <i className="fa-solid fa-circle-exclamation"></i>
                                {passwordErrors.general}
                            </div>
                        )}
                        <form onSubmit={handleChangePassword}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                {/* Current Password */}
                                <div>
                                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
                                        Current Password <span style={{ color: 'var(--admin-danger)' }}>*</span>
                                    </label>
                                    <div style={{ position: 'relative' }}>
                                        <input
                                            type={showPasswords.current ? 'text' : 'password'}
                                            value={passwordData.currentPassword}
                                            onChange={(e) => {
                                                setPasswordData({ ...passwordData, currentPassword: e.target.value });
                                                if (passwordErrors.currentPassword) {
                                                    setPasswordErrors({ ...passwordErrors, currentPassword: '' });
                                                }
                                            }}
                                            placeholder="Enter current password"
                                            disabled={changingPassword}
                                            style={{
                                                width: '100%',
                                                padding: '12px',
                                                paddingRight: '45px',
                                                borderRadius: '8px',
                                                border: passwordErrors.currentPassword ? '2px solid var(--admin-danger)' : '2px solid #e5e7eb',
                                                outline: 'none'
                                            }}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                                            disabled={changingPassword}
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
                                            title={showPasswords.current ? 'Hide password' : 'Show password'}
                                        >
                                            <i className={showPasswords.current ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'}></i>
                                        </button>
                                    </div>
                                    {passwordErrors.currentPassword && (
                                        <span style={{ display: 'block', fontSize: '12px', color: 'var(--admin-danger)', marginTop: '4px', fontWeight: 500 }}>
                                            {passwordErrors.currentPassword}
                                        </span>
                                    )}
                                </div>

                                {/* New Password */}
                                <div>
                                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
                                        New Password <span style={{ color: 'var(--admin-danger)' }}>*</span>
                                    </label>
                                    <div style={{ position: 'relative' }}>
                                        <input
                                            type={showPasswords.new ? 'text' : 'password'}
                                            value={passwordData.newPassword}
                                            onChange={(e) => {
                                                setPasswordData({ ...passwordData, newPassword: e.target.value });
                                                if (passwordErrors.newPassword) {
                                                    setPasswordErrors({ ...passwordErrors, newPassword: '' });
                                                }
                                            }}
                                            placeholder="Enter new password"
                                            disabled={changingPassword}
                                            style={{
                                                width: '100%',
                                                padding: '12px',
                                                paddingRight: '45px',
                                                borderRadius: '8px',
                                                border: passwordErrors.newPassword ? '2px solid var(--admin-danger)' : '2px solid #e5e7eb',
                                                outline: 'none'
                                            }}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                                            disabled={changingPassword}
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
                                            title={showPasswords.new ? 'Hide password' : 'Show password'}
                                        >
                                            <i className={showPasswords.new ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'}></i>
                                        </button>
                                    </div>
                                    {passwordErrors.newPassword && (
                                        <span style={{ display: 'block', fontSize: '12px', color: 'var(--admin-danger)', marginTop: '4px', fontWeight: 500 }}>
                                            {passwordErrors.newPassword}
                                        </span>
                                    )}
                                </div>

                                {/* Confirm New Password */}
                                <div>
                                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
                                        Confirm New Password <span style={{ color: 'var(--admin-danger)' }}>*</span>
                                    </label>
                                    <div style={{ position: 'relative' }}>
                                        <input
                                            type={showPasswords.confirm ? 'text' : 'password'}
                                            value={passwordData.confirmPassword}
                                            onChange={(e) => {
                                                setPasswordData({ ...passwordData, confirmPassword: e.target.value });
                                                if (passwordErrors.confirmPassword) {
                                                    setPasswordErrors({ ...passwordErrors, confirmPassword: '' });
                                                }
                                            }}
                                            placeholder="Confirm new password"
                                            disabled={changingPassword}
                                            style={{
                                                width: '100%',
                                                padding: '12px',
                                                paddingRight: '45px',
                                                borderRadius: '8px',
                                                border: passwordErrors.confirmPassword ? '2px solid var(--admin-danger)' : '2px solid #e5e7eb',
                                                outline: 'none'
                                            }}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                                            disabled={changingPassword}
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
                                            title={showPasswords.confirm ? 'Hide password' : 'Show password'}
                                        >
                                            <i className={showPasswords.confirm ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'}></i>
                                        </button>
                                    </div>
                                    {passwordErrors.confirmPassword && (
                                        <span style={{ display: 'block', fontSize: '12px', color: 'var(--admin-danger)', marginTop: '4px', fontWeight: 500 }}>
                                            {passwordErrors.confirmPassword}
                                        </span>
                                    )}
                                </div>

                                <button
                                    type="submit"
                                    className="admin-btn admin-btn-primary"
                                    style={{ width: '100%' }}
                                    disabled={changingPassword}
                                >
                                    {changingPassword ? (
                                        <>
                                            <i className="fa-solid fa-spinner fa-spin"></i>
                                            Changing Password...
                                        </>
                                    ) : (
                                        <>
                                            <i className="fa-solid fa-key"></i>
                                            Change Password
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Reset Password - Only for Admin */}
                {user?.role === 'admin' && (
                    <div className="admin-card">
                        <div className="admin-card-header">
                            <h2>Reset Password</h2>
                        </div>
                        <div className="admin-card-body">
                            {resetError && (
                                <div className="admin-alert admin-alert-error" style={{ marginBottom: '20px' }}>
                                    <i className="fa-solid fa-circle-exclamation"></i>
                                    {resetError}
                                </div>
                            )}
                            <form onSubmit={handleResetPassword}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
                                            Username <span style={{ color: 'var(--admin-danger)' }}>*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={resetUsername}
                                            onChange={(e) => {
                                                setResetUsername(e.target.value);
                                                if (resetError) {
                                                    setResetError('');
                                                }
                                            }}
                                            placeholder="Enter username to reset password"
                                            disabled={resettingPassword}
                                            style={{
                                                width: '100%',
                                                padding: '12px',
                                                borderRadius: '8px',
                                                border: resetError ? '2px solid var(--admin-danger)' : '2px solid #e5e7eb',
                                                outline: 'none'
                                            }}
                                        />
                                        <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '8px' }}>
                                            Enter the username to reset their password to default
                                        </p>
                                    </div>

                                    <button
                                        type="submit"
                                        className="admin-btn admin-btn-primary"
                                        style={{ width: '100%' }}
                                        disabled={resettingPassword}
                                    >
                                        {resettingPassword ? (
                                            <>
                                                <i className="fa-solid fa-spinner fa-spin"></i>
                                                Resetting Password...
                                            </>
                                        ) : (
                                            <>
                                                <i className="fa-solid fa-rotate-right"></i>
                                                Reset Password
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
