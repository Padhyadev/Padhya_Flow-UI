import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PadhyaFlowLogo } from '../components/PadhyaFlowLogo';
import '../styles/admin.css';
import '../styles/admin-responsive.css';
import '../styles/admin-mobile-fix.css';

export default function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login, getRoleDashboard } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const result = await login(username, password);

            if (result.user) {
                // Successful login - redirect to role-specific dashboard
                const dashboardPath = getRoleDashboard(result.user.role);
                navigate(dashboardPath);
            } else {
                // Login failed - show API error message on login screen
                setError(result.error || 'Invalid Username or Password');
            }
        } catch (err) {
            console.error('Login error:', err);
            setError('An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="admin-login-page">
            <div className="admin-login-container">
                <div className="admin-login-card">
                    <div className="admin-login-header">
                        <div className="admin-logo" style={{ background: 'transparent', width: 'auto', height: 'auto', boxShadow: 'none' }}>
                            <PadhyaFlowLogo size="large" />
                        </div>
                        <h1>Padhya Flow</h1>
                        <p></p>
                    </div>

                    {error && (
                        <div className="admin-alert admin-alert-error">
                            <i className="fa-solid fa-circle-exclamation"></i>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="admin-login-form">
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
                                    required
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        <div className="admin-form-group">
                            <label htmlFor="password">Password</label>
                            <div className="admin-input-with-icon">
                                <i className="fa-solid fa-lock"></i>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    id="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter your password"
                                    required
                                    disabled={loading}
                                />
                                <button
                                    type="button"
                                    className="admin-password-toggle"
                                    onClick={() => setShowPassword(!showPassword)}
                                    tabIndex={-1}
                                >
                                    <i className={`fa-solid ${showPassword ? 'fa-eye' : 'fa-eye-slash'}`}></i>
                                </button>
                            </div>
                        </div>

                        <div className="admin-form-options">
                            {/* <label className="admin-checkbox">
                                <input
                                    type="checkbox"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                    disabled={loading}
                                />
                                <span>Remember me</span>
                            </label> */}
                            <Link to="/admin/forgot-password" className="admin-forgot-link">Forgot Password?</Link>
                        </div>

                        <button
                            type="submit"
                            className="admin-btn admin-btn-primary admin-btn-block"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <i className="fa-solid fa-spinner fa-spin"></i>
                                    Signing In...
                                </>
                            ) : (
                                <>
                                    <i className="fa-solid fa-right-to-bracket"></i>
                                    Sign In
                                </>
                            )}
                        </button>
                    </form>

                    {/* <div className="admin-login-footer">
                        <p className="admin-demo-credentials">
                            <strong>Resido Admin Panel</strong><br />
                            <em>Enter your username and password to access the system</em>
                        </p>
                    </div> */}
                </div>
            </div>
        </div>
    );
}
