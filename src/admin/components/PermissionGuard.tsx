import React, { ReactNode } from 'react';
import { usePermissions } from '../hooks/usePermissions';

interface PermissionGuardProps {
    children: ReactNode;
    controller: string;
    permission?: 'view' | 'add' | 'edit' | 'delete';
    fallback?: ReactNode;
}

/**
 * Permission Guard Component
 * Shows children only if user has permission for the specified controller
 * 
 * @example
 * <PermissionGuard controller="Menu" permission="add">
 *   <button>Add Menu</button>
 * </PermissionGuard>
 */
export const PermissionGuard: React.FC<PermissionGuardProps> = ({
    children,
    controller,
    permission = 'view',
    fallback = null,
}) => {
    const permissions = usePermissions(controller);

    // Check if user has the required permission
    const hasPermission = () => {
        switch (permission) {
            case 'view':
                return permissions.canView;
            case 'add':
                return permissions.canAdd;
            case 'edit':
                return permissions.canEdit;
            case 'delete':
                return permissions.canDelete;
            default:
                return false;
        }
    };

    if (!hasPermission()) {
        return <>{fallback}</>;
    }

    return <>{children}</>;
};

export default PermissionGuard;
