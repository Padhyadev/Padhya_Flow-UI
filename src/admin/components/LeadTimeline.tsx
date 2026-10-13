import React from 'react';
import { formatDate } from '../utils/dateUtils';
import '../styles/admin.css';
import '../styles/admin-components.css';

interface TimelineActivity {
    id: string;
    type: 'created' | 'stage_change' | 'assignment' | 'remark' | 'reminder';
    title: string;
    description: string;
    timestamp: string;
    user?: string;
    oldValue?: string;
    newValue?: string;
}

interface LeadTimelineProps {
    leadId: string;
    activities?: TimelineActivity[];
    loading?: boolean;
}

export default function LeadTimeline({ leadId, activities = [], loading = false }: LeadTimelineProps) {
    // Mock activities for demonstration
    const mockActivities: TimelineActivity[] = [
        {
            id: '1',
            type: 'created',
            title: 'Lead Created',
            description: 'Lead was created from website inquiry',
            timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            user: 'System'
        },
        {
            id: '2',
            type: 'assignment',
            title: 'Lead Assigned',
            description: 'Lead assigned to sales representative',
            timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            user: 'Admin',
            newValue: 'John Doe'
        },
        {
            id: '3',
            type: 'stage_change',
            title: 'Stage Updated',
            description: 'Lead stage changed from New to Contacted',
            timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
            user: 'John Doe',
            oldValue: 'New',
            newValue: 'Contacted'
        },
        {
            id: '4',
            type: 'remark',
            title: 'Remark Added',
            description: 'Customer is interested in 2BHK apartments in Baner area',
            timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
            user: 'John Doe'
        },
        {
            id: '5',
            type: 'reminder',
            title: 'Reminder Set',
            description: 'Follow-up call scheduled for tomorrow 10:00 AM',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            user: 'John Doe'
        }
    ];

    const displayActivities = activities.length > 0 ? activities : mockActivities;

    const getActivityIcon = (type: TimelineActivity['type']) => {
        switch (type) {
            case 'created':
                return 'fa-user-plus';
            case 'stage_change':
                return 'fa-arrow-right';
            case 'assignment':
                return 'fa-user-tag';
            case 'remark':
                return 'fa-comment';
            case 'reminder':
                return 'fa-clock';
            default:
                return 'fa-circle';
        }
    };

    const getActivityColor = (type: TimelineActivity['type']) => {
        switch (type) {
            case 'created':
                return 'var(--admin-success)';
            case 'stage_change':
                return 'var(--admin-primary)';
            case 'assignment':
                return 'var(--admin-info)';
            case 'remark':
                return 'var(--admin-warning)';
            case 'reminder':
                return 'var(--admin-purple)';
            default:
                return 'var(--admin-gray-400)';
        }
    };

    const formatRelativeTime = (timestamp: string) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return formatDate(date);
    };

    if (loading) {
        return (
            <div className="lead-timeline">
                <div className="lead-timeline-loading">
                    <i className="fa-solid fa-spinner fa-spin"></i>
                    <span>Loading timeline...</span>
                </div>
            </div>
        );
    }

    if (displayActivities.length === 0) {
        return (
            <div className="lead-timeline">
                <div className="lead-timeline-empty">
                    <i className="fa-solid fa-clock"></i>
                    <h3>No Activity Yet</h3>
                    <p>Lead activity will appear here as actions are taken.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="lead-timeline">
            <div className="lead-timeline-header">
                <h3>Activity Timeline</h3>
                <span className="lead-timeline-count">{displayActivities.length} activities</span>
            </div>

            <div className="lead-timeline-list">
                {displayActivities.map((activity, index) => (
                    <div key={activity.id} className="lead-timeline-item">
                        <div
                            className="lead-timeline-icon"
                            style={{ backgroundColor: getActivityColor(activity.type) }}
                        >
                            <i className={`fa-solid ${getActivityIcon(activity.type)}`}></i>
                        </div>

                        <div className="lead-timeline-content">
                            <div className="lead-timeline-header-row">
                                <h4 className="lead-timeline-title">{activity.title}</h4>
                                <span className="lead-timeline-time">
                                    {formatRelativeTime(activity.timestamp)}
                                </span>
                            </div>

                            <p className="lead-timeline-description">{activity.description}</p>

                            <div className="lead-timeline-meta">
                                {activity.user && (
                                    <span className="lead-timeline-user">
                                        <i className="fa-solid fa-user"></i>
                                        {activity.user}
                                    </span>
                                )}
                                {activity.oldValue && activity.newValue && (
                                    <span className="lead-timeline-change">
                                        <span className="old-value">{activity.oldValue}</span>
                                        <i className="fa-solid fa-arrow-right"></i>
                                        <span className="new-value">{activity.newValue}</span>
                                    </span>
                                )}
                            </div>
                        </div>

                        {index < displayActivities.length - 1 && (
                            <div className="lead-timeline-line"></div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
