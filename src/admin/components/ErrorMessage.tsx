import React from 'react';
import '../styles/admin-components.css';

interface ErrorMessageProps {
    message: string;
    onRetry?: () => void;
}

export default function ErrorMessage({ message, onRetry }: ErrorMessageProps) {
    return (
        <div className="admin-error-message">
            <i className="fa-solid fa-circle-exclamation"></i>
            <p>{message}</p>
            {onRetry && (
                <button onClick={onRetry} className="admin-btn admin-btn-sm admin-btn-primary">
                    <i className="fa-solid fa-rotate-right"></i>
                    Retry
                </button>
            )}
        </div>
    );
}
