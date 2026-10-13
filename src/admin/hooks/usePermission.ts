/**
 * usePermission Hook
 * 
 * Provides permission checking functions to components.
 * Uses normalized permissions from PermissionContext.
 * 
 * IMPORTANT: This hook contains NO role-specific logic.
 * All role rules are applied in the permission normalization layer.
 */

import { usePermissionContext } from '../context/PermissionContext';
import { PermissionAction, ControllerPermissions } from '../types/permissions';
import {
    hasPermission as checkPermission,
    getControllerPermissions as getControllerPerms,
    hasAnyPermission as checkAnyPermission
} from '../utils/permissionNormalizer';

/**
 * Hook for checking permissions
 * 
 * @returns Permission checking functions
 */
export function usePermission() {
    const { permissions } = usePermissionContext();

    /**
     * Check if user has a specific permission
     * 
     * @param controller - Controller name (e.g., 'PropertyType')
     * @param action - Action to check (e.g., 'view', 'add', 'edit', 'delete')
     * @returns True if user has the permission
     */
    const hasPermission = (controller: string, action: PermissionAction): boolean => {
        return checkPermission(permissions, controller, action);
    };

    /**
     * Get all permissions for a specific controller
     * 
     * @param controller - Controller name
     * @returns Controller permissions summary
     */
    const getControllerPermissions = (controller: string): ControllerPermissions => {
        return getControllerPerms(permissions, controller);
    };

    /**
     * Check if user has any of the specified permissions
     * 
     * @param requiredPermissions - Array of required permissions
     * @returns True if user has at least one of the required permissions
     */
    const hasAnyPermission = (
        requiredPermissions: Array<{ controller: string; action: PermissionAction }>
    ): boolean => {
        return checkAnyPermission(permissions, requiredPermissions);
    };

    return {
        hasPermission,
        getControllerPermissions,
        hasAnyPermission,
        permissions // Expose raw permissions if needed
    };
}
