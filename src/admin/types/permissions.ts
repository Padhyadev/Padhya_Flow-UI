/**
 * Permission System Types
 * 
 * Defines types for the dynamic controller+action based permission system
 */

/**
 * Permission actions that can be performed on a controller
 */
export type PermissionAction = 'view' | 'add' | 'edit' | 'delete';

/**
 * Single permission entry
 */
export interface Permission {
    controller: string;
    action: PermissionAction;
}

/**
 * User's complete permission set
 */
export interface UserPermissions {
    permissions: Permission[];
    role: string; // Kept for fallback to static role checks if needed
}

/**
 * Permission check result with detailed info
 */
export interface PermissionCheckResult {
    allowed: boolean;
    reason?: string; // Why permission was granted/denied
    usedFallback?: boolean; // Whether static role fallback was used
}

/**
 * Controller permission summary
 */
export interface ControllerPermissions {
    controller: string;
    canView: boolean;
    canAdd: boolean;
    canEdit: boolean;
    canDelete: boolean;
    hasAnyAccess: boolean;
}

/**
 * Menu item structure for the admin sidebar/navigation
 */
export interface MenuItem {
    path: string;
    icon: string;
    label: string;
    controller: string;
    submenu?: MenuItem[];
}
