import React, { useEffect } from 'react';
import '../styles/admin-components.css';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
    message: string;
    type: ToastType;
    onClose: () => void;
    duration?: number;
}

export default function Toast({ message, type, onClose, duration = 3000 }: ToastProps) {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, onClose]);

    const getIcon = () => {
        switch (type) {
            case 'success':
                return 'fa-check-circle';
            case 'error':
                return 'fa-circle-exclamation';
            case 'warning':
                return 'fa-triangle-exclamation';
            case 'info':
                return 'fa-info-circle';
            default:
                return 'fa-info-circle';
        }
    };

    return (
        <div className={`admin-toast admin-toast-${type}`}>
            <i className={`fa-solid ${getIcon()}`}></i>
            <span>{message}</span>
            <button onClick={onClose} className="admin-toast-close">
                <i className="fa-solid fa-times"></i>
            </button>
        </div>
    );
}
