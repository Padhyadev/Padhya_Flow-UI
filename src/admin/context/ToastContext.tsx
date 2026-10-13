import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import Toast, { ToastType } from '../components/Toast';

interface ToastMessage {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    showToast: (message: string, type: ToastType) => void;
    showSuccess: (message: string) => void;
    showError: (message: string) => void;
    showWarning: (message: string) => void;
    showInfo: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within ToastProvider');
    }
    return context;
};

interface ToastProviderProps {
    children: ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
    const [toasts, setToasts] = useState<ToastMessage[]>([]);

    const showToast = useCallback((message: string, type: ToastType) => {
        const id = Date.now().toString();
        setToasts((prev) => [...prev, { id, message, type }]);
    }, []);

    const showSuccess = useCallback((message: string) => {
        showToast(message, 'success');
    }, [showToast]);

    const showError = useCallback((message: string) => {
        // Disabled - no error toasts will be shown
        // showToast(message, 'error');
    }, [showToast]);

    const showWarning = useCallback((message: string) => {
        showToast(message, 'warning');
    }, [showToast]);

    const showInfo = useCallback((message: string) => {
        showToast(message, 'info');
    }, [showToast]);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, []);

    const value: ToastContextType = {
        showToast,
        showSuccess,
        showError,
        showWarning,
        showInfo,
    };

    return (
        <ToastContext.Provider value={value}>
            {children}
            <div className="admin-toast-container">
                {toasts.map((toast) => (
                    <Toast
                        key={toast.id}
                        message={toast.message}
                        type={toast.type}
                        onClose={() => removeToast(toast.id)}
                    />
                ))}
            </div>
        </ToastContext.Provider>
    );
};

export default ToastContext;
