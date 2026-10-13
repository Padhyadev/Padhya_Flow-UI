import React, { useState } from 'react';
import '../styles/admin-components.css';

interface ConfirmDialogProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    onCancel: () => void;
    type?: 'danger' | 'warning' | 'info';
}

export default function ConfirmDialog({
    isOpen,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    onConfirm,
    onCancel,
    type = 'warning'
}: ConfirmDialogProps) {
    if (!isOpen) return null;

    const getIcon = () => {
        switch (type) {
            case 'danger':
                return 'fa-triangle-exclamation';
            case 'warning':
                return 'fa-exclamation-circle';
            case 'info':
                return 'fa-info-circle';
            default:
                return 'fa-question-circle';
        }
    };

    return (
        <div className="admin-modal-overlay" onClick={onCancel}>
            <div className="admin-modal admin-confirm-dialog" onClick={(e) => e.stopPropagation()}>
                <div className={`admin-confirm-icon admin-confirm-${type}`}>
                    <i className={`fa-solid ${getIcon()}`}></i>
                </div>
                <h3 className="admin-confirm-title">{title}</h3>
                <p className="admin-confirm-message">{message}</p>
                <div className="admin-confirm-actions">
                    <button
                        className="admin-btn admin-btn-secondary"
                        onClick={onCancel}
                    >
                        {cancelText}
                    </button>
                    <button
                        className={`admin-btn admin-btn-${type === 'danger' ? 'danger' : 'primary'}`}
                        onClick={() => {
                            onConfirm();
                            onCancel();
                        }}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}
