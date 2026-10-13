import React from 'react';
import '../styles/admin-components.css';

interface StatusBadgeProps {
    status: string;
    type?: 'property' | 'lead';
}

export default function StatusBadge({ status, type = 'property' }: StatusBadgeProps) {
    const getStatusConfig = () => {
        if (type === 'property') {
            switch (status.toLowerCase()) {
                case 'active':
                    return { label: 'Active', color: 'success' };
                case 'inactive':
                    return { label: 'Inactive', color: 'gray' };
                case 'sold':
                    return { label: 'Sold', color: 'primary' };
                case 'rented':
                    return { label: 'Rented', color: 'purple' };
                case 'under_process':
                case 'under process':
                    return { label: 'Under Process', color: 'warning' };
                default:
                    return { label: status, color: 'gray' };
            }
        } else {
            // Lead statuses
            switch (status.toLowerCase()) {
                case 'new':
                    return { label: 'New', color: 'info' };
                case 'contacted':
                    return { label: 'Contacted', color: 'cyan' };
                case 'in_discussion':
                case 'in discussion':
                    return { label: 'In Discussion', color: 'purple' };
                case 'site_visit':
                case 'site visit':
                case 'site_visit_scheduled':
                    return { label: 'Site Visit', color: 'orange' };
                case 'negotiation':
                    return { label: 'Negotiation', color: 'warning' };
                case 'closed_won':
                case 'closed won':
                    return { label: 'Closed - Won', color: 'success' };
                case 'closed_lost':
                case 'closed lost':
                    return { label: 'Closed - Lost', color: 'danger' };
                default:
                    return { label: status, color: 'gray' };
            }
        }
    };

    const config = getStatusConfig();

    return (
        <span className={`admin-status-badge admin-status-${config.color}`}>
            {config.label}
        </span>
    );
}
