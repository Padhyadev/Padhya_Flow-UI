import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import '../styles/admin.css';
import '../styles/admin-responsive.css';
import '../styles/admin-mobile-fix.css';
import { forgotPasswordApi } from '../services/api/forgotPasswordApi';

const API_BASE_URL = 'https://aj.padhyasoft.com/api';

export default function ForgotPassword() {
    const [username, setUsername] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setNewPassword('');

        // Validation
        if (!username.trim()) {
            setError('Please enter your username');
            return;
        }

        setLoading(true);

        try {
            console.log('🔑 Forgot Password: Sending request for username:', username.trim());

            const response = await forgotPasswordApi.forgotPassword(username.trim());

            if (response.success) {
                const resetData = response.data;
                const resetPassword = resetData?.password || '';

                if (resetPassword) {
                    console.log('✅ Password reset successful. New password:', resetPassword);
                    setNewPassword(resetPassword);
                    setSuccess('Password reset successfully! Redirecting to login...');

                    // Redirect to login after 60 seconds (give user time to copy) or manual
                    // Actually, let's keep it on screen until user clicks "Back to Login" or manual timeout
                    // But previous logic had 3s timeout. I'll increase it or remove auto-redirect if password is shown.
                    // Let's keep a longer timeout just in case.
                    setTimeout(() => {
                        navigate('/admin/login');
                    }, 10000);
                } else {
                    setSuccess(response.message || 'Password reset link sent to your email.');
                    setTimeout(() => {
                        navigate('/admin/login');
                    }, 3000);
                }
            } else {
                setError(response.message || 'Failed to reset password. Please check your username.');
            }
        } catch (err) {
            console.error('❌ Forgot password error:', err);
            setError('An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        navigate('/admin/login');
    };

    return (
        <div className="admin-login-page">
            <div className="admin-login-container">
                <div className="admin-login-card">
                    <div className="admin-login-header">
                        <div className="admin-logo">
                            <i className="fa-solid fa-key"></i>
                        </div>
                        <h1>Forgot Password</h1>
                        <p>Enter your username to reset your password</p>
                    </div>

                    {error && (
                        <div className="admin-alert admin-alert-error">
                            <i className="fa-solid fa-circle-exclamation"></i>
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="admin-alert admin-alert-success">
                            <i className="fa-solid fa-circle-check"></i>
                            {success}
                        </div>
                    )}

                    {newPassword && (
                        <div className="admin-alert admin-alert-info" style={{ marginTop: '16px' }}>
                            <i className="fa-solid fa-info-circle"></i>
                            <div>
                                <strong>Your New Password:</strong>
                                <p style={{
                                    fontFamily: 'monospace',
                                    fontSize: '16px',
                                    fontWeight: 'bold',
                                    marginTop: '8px',
                                    padding: '8px',
                                    background: 'rgba(255,255,255,0.2)',
                                    borderRadius: '4px'
                                }}>
                                    {newPassword}
                                </p>
                                <small style={{ display: 'block', marginTop: '8px' }}>
                                    Please save this password. You will be redirected to login page.
                                </small>
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="admin-login-form" noValidate>
                        <div className="admin-form-group">
                            <label htmlFor="username">Username</label>
                            <div className="admin-input-with-icon">
                                <i className="fa-solid fa-user"></i>
                                <input
                                    type="text"
                                    id="username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="Enter your username"
                                    disabled={loading || !!newPassword}
                                />
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                            <button
                                type="submit"
                                className="admin-btn admin-btn-primary"
                                style={{ flex: 1 }}
                                disabled={loading || !!newPassword}
                            >
                                {loading ? (
                                    <>
                                        <i className="fa-solid fa-spinner fa-spin"></i>
                                        Resetting...
                                    </>
                                ) : (
                                    <>
                                        <i className="fa-solid fa-key"></i>
                                        Reset Password
                                    </>
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={handleCancel}
                                className="admin-btn admin-btn-secondary"
                                style={{ flex: 1 }}
                                disabled={loading}
                            >
                                <i className="fa-solid fa-arrow-left"></i>
                                Cancel
                            </button>
                        </div>
                    </form>

                    <div className="admin-login-footer">
                        <p style={{ textAlign: 'center', marginTop: '16px' }}>
                            <Link to="/admin/login" className="admin-forgot-link">
                                <i className="fa-solid fa-arrow-left"></i> Back to Login
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
