import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/admin.css';
import '../styles/admin-responsive.css';

export default function AccessDenied() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/admin/login');
    };

    const getRoleName = (role: string) => {
        const roleMap: Record<string, string> = {
            'admin': 'Administrator',
            'manager': 'Manager',
            'marketing': 'Marketing',
            'sales': 'Sales',
            'data_entry': 'Data Entry',
            'viewer': 'Viewer'
        };
        return roleMap[role] || role;
    };

    const getDashboardRoute = () => {
        switch (user?.role) {
            case 'admin':
            case 'manager':
            case 'marketing':
                return '/admin/dashboard';
            case 'sales':
                return '/admin/sales-dashboard';
            case 'data_entry':
                return '/admin/data-entry-dashboard';
            case 'viewer':
                return '/admin/viewer-dashboard';
            default:
                return '/admin/dashboard';
        }
    };

    return (
        <div className="admin-access-denied-page">
            <div className="admin-access-denied-container">
                <div className="admin-access-denied-card">
                    <div className="admin-access-denied-icon">
                        <i className="fa-solid fa-shield-halved"></i>
                    </div>

                    <h1 className="admin-access-denied-title">Access Denied</h1>

                    <p className="admin-access-denied-message">
                        You don't have permission to access this page.
                    </p>

                    {user && (
                        <div className="admin-access-denied-info">
                            <div className="admin-access-denied-user">
                                <i className="fa-solid fa-user"></i>
                                <span>{user.name}</span>
                            </div>
                            <div className="admin-access-denied-role">
                                <i className="fa-solid fa-id-badge"></i>
                                <span>Role: {getRoleName(user.role)}</span>
                            </div>
                        </div>
                    )}

                    <div className="admin-access-denied-actions">
                        <Link to={getDashboardRoute()} className="admin-btn admin-btn-primary">
                            <i className="fa-solid fa-home"></i>
                            Go to Dashboard
                        </Link>
                        <button onClick={handleLogout} className="admin-btn admin-btn-outline">
                            <i className="fa-solid fa-right-from-bracket"></i>
                            Logout
                        </button>
                    </div>

                    <div className="admin-access-denied-help">
                        <p>
                            <i className="fa-solid fa-circle-info"></i>
                            If you believe this is an error, please contact your administrator.
                        </p>
                    </div>
                </div>
            </div>

            <style>{`
                .admin-access-denied-page {
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    padding: 20px;
                }

                .admin-access-denied-container {
                    width: 100%;
                    max-width: 500px;
                }

                .admin-access-denied-card {
                    background: white;
                    border-radius: 16px;
                    padding: 48px 32px;
                    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                    text-align: center;
                }

                .admin-access-denied-icon {
                    width: 100px;
                    height: 100px;
                    margin: 0 auto 24px;
                    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    animation: pulse 2s infinite;
                }

                .admin-access-denied-icon i {
                    font-size: 48px;
                    color: white;
                }

                @keyframes pulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.05); }
                }

                .admin-access-denied-title {
                    font-size: 32px;
                    font-weight: 700;
                    color: #1e293b;
                    margin: 0 0 16px;
                }

                .admin-access-denied-message {
                    font-size: 16px;
                    color: #64748b;
                    margin: 0 0 32px;
                    line-height: 1.6;
                }

                .admin-access-denied-info {
                    background: #f8fafc;
                    border-radius: 12px;
                    padding: 20px;
                    margin-bottom: 32px;
                }

                .admin-access-denied-user,
                .admin-access-denied-role {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    color: #475569;
                    font-size: 14px;
                    margin: 8px 0;
                }

                .admin-access-denied-user i,
                .admin-access-denied-role i {
                    color: #3b82f6;
                }

                .admin-access-denied-actions {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    margin-bottom: 24px;
                }

                .admin-access-denied-help {
                    padding-top: 24px;
                    border-top: 1px solid #e2e8f0;
                }

                .admin-access-denied-help p {
                    font-size: 14px;
                    color: #64748b;
                    margin: 0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                }

                .admin-access-denied-help i {
                    color: #3b82f6;
                }

                @media (max-width: 768px) {
                    .admin-access-denied-card {
                        padding: 32px 24px;
                    }

                    .admin-access-denied-title {
                        font-size: 24px;
                    }

                    .admin-access-denied-icon {
                        width: 80px;
                        height: 80px;
                    }

                    .admin-access-denied-icon i {
                        font-size: 36px;
                    }
                }
            `}</style>
        </div>
    );
}
