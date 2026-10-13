import React, { ReactNode } from 'react';
import '../styles/admin-components.css';

interface EmptyStateProps {
    icon: string;
    title: string;
    description: string;
    action?: ReactNode;
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
    return (
        <div className="admin-empty-state">
            <i className={`fa-solid ${icon}`}></i>
            <h3>{title}</h3>
            <p>{description}</p>
            {action && <div className="admin-empty-state-action">{action}</div>}
        </div>
    );
}
