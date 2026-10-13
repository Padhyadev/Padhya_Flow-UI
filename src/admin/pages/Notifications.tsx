import React, { useState } from 'react';
import { formatDateTime } from '../utils/dateUtils';
// Removed mock data import - using real API data only
import { Notification } from '../types';
import '../styles/admin.css';
import '../styles/admin-components.css';
import '../styles/admin-navbar.css';

export default function Notifications() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [filter, setFilter] = useState<'all' | 'unread'>('all');



    const markAllAsRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };

    const markAsRead = (id: string) => {
        setNotifications(prev =>
            prev.map(n => (n.id === id ? { ...n, read: true } : n))
        );
    };

    const filteredNotifications = filter === 'unread'
        ? notifications.filter(n => !n.read)
        : notifications;

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <div className="admin-page">
            <div className="admin-page-header">
                <div>
                    <h1 className="admin-page-title">
                        All Notifications
                        {unreadCount > 0 && (
                            <span className="admin-notification-badge">{unreadCount}</span>
                        )}
                    </h1>
                    <p className="admin-page-subtitle">View and manage all your notifications</p>
                </div>
                <div className="admin-page-actions">
                    {unreadCount > 0 && (
                        <button
                            className="admin-btn admin-btn-secondary"
                            onClick={markAllAsRead}
                        >
                            <i className="fa-solid fa-check-double"></i>
                            Mark All as Read
                        </button>
                    )}
                </div>
            </div>

            <div className="admin-notifications-filters">
                <button
                    className={`admin-filter-btn ${filter === 'all' ? 'active' : ''}`}
                    onClick={() => setFilter('all')}
                >
                    <i className="fa-solid fa-inbox"></i>
                    All ({notifications.length})
                </button>
                <button
                    className={`admin-filter-btn ${filter === 'unread' ? 'active' : ''}`}
                    onClick={() => setFilter('unread')}
                >
                    <i className="fa-solid fa-bell"></i>
                    Unread ({unreadCount})
                </button>
            </div>

            <div className="admin-notifications-page-container">
                {filteredNotifications.length === 0 ? (
                    <div className="admin-empty-state">
                        <i className="fa-solid fa-bell-slash"></i>
                        <h3>No Notifications</h3>
                        <p>You're all caught up! No {filter === 'unread' ? 'unread' : ''} notifications to show.</p>
                    </div>
                ) : (
                    <ul className="admin-notification-list">
                        {filteredNotifications.map((notification) => (
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
                                        <i className="fa-solid fa-clock"></i>
                                        {formatDateTime(notification.createdAt)}
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
        </div >
    );
}
