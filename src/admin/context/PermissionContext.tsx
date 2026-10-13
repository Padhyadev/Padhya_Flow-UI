/**
 * Permission Context
 * 
 * Provides normalized permissions to all components via React Context.
 * Permissions are normalized during login based on user role.
 * 
 * IMPORTANT: This context contains NO role-specific logic.
 * All role rules are applied in the permission normalization layer.
 */

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Permission } from '../types/permissions';

interface PermissionContextType {
    permissions: Permission[];
    setPermissions: (permissions: Permission[]) => void;
    clearPermissions: () => void;
}

const PermissionContext = createContext<PermissionContextType | undefined>(undefined);

interface PermissionProviderProps {
    children: ReactNode;
}

/**
 * Permission Provider Component
 * Wraps the application to provide permission context
 */
export function PermissionProvider({ children }: PermissionProviderProps) {
    const [permissions, setPermissionsState] = useState<Permission[]>(() => {
        // Load permissions from localStorage on initialization
        const stored = localStorage.getItem('user_permissions');
        if (stored) {
            try {
                return JSON.parse(stored);
            } catch (error) {
                console.error('Failed to parse stored permissions:', error);
                return [];
            }
        }
        return [];
    });

    const setPermissions = (newPermissions: Permission[]) => {
        console.log('🔐 PermissionContext: Setting permissions:', newPermissions.length);
        setPermissionsState(newPermissions);
        // Persist to localStorage
        localStorage.setItem('user_permissions', JSON.stringify(newPermissions));
    };

    const clearPermissions = () => {
        console.log('🔐 PermissionContext: Clearing permissions');
        setPermissionsState([]);
        localStorage.removeItem('user_permissions');
    };

    return (
        <PermissionContext.Provider value={{ permissions, setPermissions, clearPermissions }}>
            {children}
        </PermissionContext.Provider>
    );
}

/**
 * Hook to access permission context
 * Must be used within PermissionProvider
 */
export function usePermissionContext() {
    const context = useContext(PermissionContext);
    if (context === undefined) {
        throw new Error('usePermissionContext must be used within PermissionProvider');
    }
    return context;
}
