import React from 'react';
import '../styles/admin-components.css';

interface LoadingSpinnerProps {
    size?: 'small' | 'medium' | 'large';
    message?: string;
}

export default function LoadingSpinner({ size = 'medium', message }: LoadingSpinnerProps) {
    return (
        <div className="admin-loading-spinner" data-size={size}>
            <i className="fa-solid fa-spinner fa-spin"></i>
            {message && <p className="admin-loading-message">{message}</p>}
        </div>
    );
}
