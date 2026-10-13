import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
// Removed mock data import - using real API data only
import { Notification } from '../types';
import '../styles/admin.css';
import '../styles/admin-sidebar.css';
import '../styles/admin-components.css';
import '../styles/admin-responsive.css';

interface AdminNavbarProps {
    onToggleMobileMenu?: () => void;
}

export default function AdminNavbar({ onToggleMobileMenu }: AdminNavbarProps) {
    const { user, logout } = useAuth();
    const [showNotifications, setShowNotifications] = useState(false);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);

    const unreadCount = notifications.filter(n => !n.read).length;

    // Helper function to format role names for display
    const formatRoleName = (role: string): string => {
        if (!role) return '';
        // Replace underscores with spaces and capitalize each word
        return role
            .replace(/_/g, ' ')
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    };

    const handleLogout = () => {
        if (window.confirm('Are you sure you want to logout?')) {
            logout();
        }
    };

    const markAsRead = (id: string) => {
        setNotifications(prev =>
            prev.map(n => (n.id === id ? { ...n, read: true } : n))
        );
    };

    const markAllAsRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (!target.closest('.admin-navbar-notifications') && !target.closest('.admin-navbar-profile')) {
                setShowNotifications(false);
                setShowProfileMenu(false);
            }
        };

        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        return `${diffDays}d ago`;
    };

    return (
        <nav className="admin-navbar">
            <div className="admin-navbar-left">
                <button
                    className="admin-mobile-menu-toggle"
                    onClick={onToggleMobileMenu}
                >
                    <i className="fa-solid fa-bars"></i>
                </button>
            </div>

            <div className="admin-navbar-right">
                {/* Search */}
                {/* <div className="admin-navbar-search">
                    <i className="fa-solid fa-search"></i>
                    <input type="text" placeholder="Search properties, leads..." />
                </div> */}

                {/* Notifications */}
                {/* <div className="admin-navbar-notifications">
                    <button
                        className="admin-navbar-icon-btn"
                        onClick={() => setShowNotifications(!showNotifications)}
                    >
                        <i className="fa-solid fa-bell"></i>
                        {unreadCount > 0 && (
                            <span className="admin-badge">{unreadCount}</span>
                        )}
                    </button>

                    {showNotifications && (
                        <div className="admin-dropdown admin-notifications-dropdown">
                            <div className="admin-dropdown-header">
                                <h3>Notifications</h3>
                                {unreadCount > 0 && (
                                    <button
                                        className="admin-btn-link"
                                        onClick={markAllAsRead}
                                    >
                                        Mark all as read
                                    </button>
                                )}
                            </div>

                            <div className="admin-dropdown-body">
                                {notifications.length === 0 ? (
                                    <div className="admin-empty-state">
                                        <i className="fa-solid fa-bell-slash"></i>
                                        <p>No notifications</p>
                                    </div>
                                ) : (
                                    <ul className="admin-notification-list">
                                        {notifications.map((notification) => (
                                            <li
                                                key={notification.id}
                                                className={`admin-notification-item ${!notification.read ? 'unread' : ''}`}
                                                onClick={() => markAsRead(notification.id)}
                                            >
                                                <div className={`admin-notification-icon ${notification.type}`}>
                                                    <i
                                                        className={`fa-solid ${notification.type === 'lead'
                                                            ? 'fa-user-plus'
                                                            : notification.type === 'reminder'
                                                                ? 'fa-clock'
                                                                : notification.type === 'property'
                                                                    ? 'fa-building'
                                                                    : 'fa-info-circle'
                                                            }`}
                                                    ></i>
                                                </div>
                                                <div className="admin-notification-content">
                                                    <h4>{notification.title}</h4>
                                                    <p>{notification.message}</p>
                                                    <span className="admin-notification-time">
                                                        {formatTime(notification.createdAt)}
                                                    </span>
                                                </div>
                                                {!notification.read && (
                                                    <span className="admin-notification-dot"></span>
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>

                            <div className="admin-dropdown-footer">
                                <Link
                                    to="/admin/notifications"
                                    className="admin-dropdown-footer-link"
                                    onClick={() => setShowNotifications(false)}
                                >
                                    View All Notifications
                                    <i className="fa-solid fa-arrow-right"></i>
                                </Link>
                            </div>
                        </div>
                    )}
                </div> */}

                {/* Profile Menu */}
                <div className="admin-navbar-profile">
                    <button
                        className="admin-profile-btn"
                        onClick={() => setShowProfileMenu(!showProfileMenu)}
                    >
                        <div className="admin-profile-avatar">
                            <i className="fa-solid fa-user"></i>
                        </div>
                        <div className="admin-profile-info">
                            <span className="admin-profile-name">{user?.name}</span>
                            <span className="admin-profile-role">{formatRoleName(user?.role || '')}</span>
                        </div>
                        <i className="fa-solid fa-chevron-down"></i>
                    </button>

                    {showProfileMenu && (
                        <div className="admin-dropdown admin-profile-dropdown">
                            <ul className="admin-dropdown-menu">
                                <li>
                                    <Link to="/admin/profile" onClick={() => setShowProfileMenu(false)}>
                                        <i className="fa-solid fa-user"></i>
                                        My Profile
                                    </Link>
                                </li>
                                {/* <li>
                                    <Link to="/admin/settings" onClick={() => setShowProfileMenu(false)}>
                                        <i className="fa-solid fa-gear"></i>
                                        Settings
                                    </Link>
                                </li> */}
                                <li className="admin-dropdown-divider"></li>
                                <li>
                                    <button onClick={handleLogout} className="admin-logout-btn">
                                        <i className="fa-solid fa-right-from-bracket"></i>
                                        Logout
                                    </button>
                                </li>
                            </ul>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
}
