import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../styles/admin.css';
import '../styles/admin-components.css';

interface Reminder {
    id: string;
    leadId: string;
    leadName: string;
    title: string;
    notes: string;
    dueDate: string;
    dueTime: string;
    completed: boolean;
    priority: 'low' | 'medium' | 'high';
    type: 'call' | 'email' | 'meeting' | 'follow_up' | 'site_visit';
}

interface ReminderWidgetProps {
    limit?: number;
    showCompleted?: boolean;
    loading?: boolean;
    onReminderComplete?: (reminderId: string) => void;
}

export default function ReminderWidget({ 
    limit = 5, 
    showCompleted = false, 
    loading = false,
    onReminderComplete 
}: ReminderWidgetProps) {
    const [reminders, setReminders] = useState<Reminder[]>([]);

    // Mock reminders data
    useEffect(() => {
        const mockReminders: Reminder[] = [
            {
                id: '1',
                leadId: 'lead-1',
                leadName: 'Rajesh Kumar',
                title: 'Follow-up Call',
                notes: 'Discuss 2BHK options in Baner area',
                dueDate: new Date().toISOString().split('T')[0], // Today
                dueTime: '10:00',
                completed: false,
                priority: 'high',
                type: 'call'
            },
            {
                id: '2',
                leadId: 'lead-2',
                leadName: 'Priya Sharma',
                title: 'Site Visit',
                notes: 'Show properties in Wakad',
                dueDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Yesterday (overdue)
                dueTime: '15:30',
                completed: false,
                priority: 'high',
                type: 'site_visit'
            },
            {
                id: '3',
                leadId: 'lead-3',
                leadName: 'Amit Patel',
                title: 'Send Brochure',
                notes: 'Email property brochures for commercial spaces',
                dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Tomorrow
                dueTime: '11:00',
                completed: false,
                priority: 'medium',
                type: 'email'
            },
            {
                id: '4',
                leadId: 'lead-4',
                leadName: 'Sneha Joshi',
                title: 'Contract Discussion',
                notes: 'Finalize terms for 3BHK apartment',
                dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Day after tomorrow
                dueTime: '14:00',
                completed: false,
                priority: 'high',
                type: 'meeting'
            },
            {
                id: '5',
                leadId: 'lead-5',
                leadName: 'Vikram Singh',
                title: 'Price Negotiation',
                notes: 'Discuss final pricing for plot in Hinjewadi',
                dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                dueTime: '16:00',
                completed: false,
                priority: 'medium',
                type: 'call'
            }
        ];

        setReminders(mockReminders);
    }, []);

    const getReminderStatus = (reminder: Reminder) => {
        const today = new Date().toISOString().split('T')[0];
        const dueDate = reminder.dueDate;
        
        if (reminder.completed) return 'completed';
        if (dueDate < today) return 'overdue';
        if (dueDate === today) return 'today';
        return 'upcoming';
    };

    const getReminderIcon = (type: Reminder['type']) => {
        switch (type) {
            case 'call':
                return 'fa-phone';
            case 'email':
                return 'fa-envelope';
            case 'meeting':
                return 'fa-handshake';
            case 'site_visit':
                return 'fa-map-location-dot';
            case 'follow_up':
                return 'fa-clock';
            default:
                return 'fa-bell';
        }
    };

    const formatRelativeDate = (dateString: string) => {
        const date = new Date(dateString);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const dateStr = date.toISOString().split('T')[0];
        const todayStr = today.toISOString().split('T')[0];
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        const tomorrowStr = tomorrow.toISOString().split('T')[0];

        if (dateStr === todayStr) return 'Today';
        if (dateStr === yesterdayStr) return 'Yesterday';
        if (dateStr === tomorrowStr) return 'Tomorrow';
        
        const diffTime = date.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays > 0) {
            return `In ${diffDays} day${diffDays > 1 ? 's' : ''}`;
        } else {
            return `${Math.abs(diffDays)} day${Math.abs(diffDays) > 1 ? 's' : ''} ago`;
        }
    };

    const handleCompleteReminder = (reminderId: string) => {
        setReminders(prev => 
            prev.map(reminder => 
                reminder.id === reminderId 
                    ? { ...reminder, completed: true }
                    : reminder
            )
        );
        onReminderComplete?.(reminderId);
    };

    const filteredReminders = reminders
        .filter(reminder => showCompleted || !reminder.completed)
        .slice(0, limit);

    if (loading) {
        return (
            <div className="reminder-widget">
                <div className="reminder-widget-header">
                    <h3>Upcoming Reminders</h3>
                </div>
                <div className="reminder-widget-loading">
                    <i className="fa-solid fa-spinner fa-spin"></i>
                    <span>Loading reminders...</span>
                </div>
            </div>
        );
    }

    if (filteredReminders.length === 0) {
        return (
            <div className="reminder-widget">
                <div className="reminder-widget-header">
                    <h3>Upcoming Reminders</h3>
                </div>
                <div className="reminder-widget-empty">
                    <i className="fa-solid fa-bell-slash"></i>
                    <h4>No Reminders</h4>
                    <p>You're all caught up! No pending reminders.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="reminder-widget">
            <div className="reminder-widget-header">
                <h3>Upcoming Reminders</h3>
                <span className="reminder-widget-count">
                    {filteredReminders.length} pending
                </span>
            </div>

            <div className="reminder-widget-list">
                {filteredReminders.map((reminder) => {
                    const status = getReminderStatus(reminder);
                    
                    return (
                        <div 
                            key={reminder.id} 
                            className={`reminder-widget-item ${status} priority-${reminder.priority}`}
                        >
                            <div className="reminder-widget-icon">
                                <i className={`fa-solid ${getReminderIcon(reminder.type)}`}></i>
                            </div>
                            
                            <div className="reminder-widget-content">
                                <div className="reminder-widget-header-row">
                                    <h4 className="reminder-widget-title">{reminder.title}</h4>
                                    <div className="reminder-widget-actions">
                                        {!reminder.completed && (
                                            <button
                                                className="reminder-widget-complete"
                                                onClick={() => handleCompleteReminder(reminder.id)}
                                                title="Mark as completed"
                                            >
                                                <i className="fa-solid fa-check"></i>
                                            </button>
                                        )}
                                    </div>
                                </div>
                                
                                <div className="reminder-widget-lead">
                                    <Link to={`/admin/leads/${reminder.leadId}`}>
                                        <i className="fa-solid fa-user"></i>
                                        {reminder.leadName}
                                    </Link>
                                </div>
                                
                                <p className="reminder-widget-notes">{reminder.notes}</p>
                                
                                <div className="reminder-widget-meta">
                                    <span className={`reminder-widget-date ${status}`}>
                                        <i className="fa-solid fa-calendar"></i>
                                        {formatRelativeDate(reminder.dueDate)}
                                    </span>
                                    <span className="reminder-widget-time">
                                        <i className="fa-solid fa-clock"></i>
                                        {reminder.dueTime}
                                    </span>
                                    {status === 'overdue' && (
                                        <span className="reminder-widget-overdue">
                                            <i className="fa-solid fa-exclamation-triangle"></i>
                                            Overdue
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="reminder-widget-footer">
                <Link to="/admin/reminders" className="reminder-widget-view-all">
                    View All Reminders
                    <i className="fa-solid fa-arrow-right"></i>
                </Link>
            </div>
        </div>
    );
}
