/**
 * Permission Utility Helpers
 * 
 * IMPORTANT: This is a minimal, safe addition to support dynamic permissions.
 * Does NOT modify or break any existing code.
 */

/**
 * Build a normalized permission key from controller and action
 * Converts to lowercase to prevent case-sensitivity issues
 * 
 * @param controller - Controller name (e.g., "PropertyType")
 * @param action - Action name (e.g., "view", "add", "edit", "delete")
 * @returns Normalized permission key (e.g., "propertytype.view")
 */
export const buildPermissionKey = (controller: string, action: string): string => {
    if (!controller || !action) {
        if (process.env.NODE_ENV === 'development') {
            console.warn('⚠️ buildPermissionKey: Empty controller or action', { controller, action });
        }
        return '';
    }

    // Normalize to lowercase
    return `${controller.trim().toLowerCase()}.${action.trim().toLowerCase()}`;
};

/**
 * Check if a permission exists in the permissions array
 * Case-insensitive comparison
 * 
 * @param permissions - Array of permission strings
 * @param controller - Controller name
 * @param action - Action name
 * @returns True if permission exists
 */
export const hasPermissionInArray = (
    permissions: string[],
    controller: string,
    action: string
): boolean => {
    if (!permissions || permissions.length === 0) {
        if (process.env.NODE_ENV === 'development') {
            console.warn('⚠️ hasPermissionInArray: Empty permissions array');
        }
        return false;
    }

    const permissionKey = buildPermissionKey(controller, action);
    const normalizedPermissions = permissions.map(p => p.toLowerCase());

    return normalizedPermissions.includes(permissionKey);
};

/**
 * Role-Based Permission Helpers
 * 
 * Role Structure:
 * - SA Admin: Full access to everything (super admin)
 * - Admin: User Management only + future assigned permissions
 * - Viewer: Read-only access (view only, no add/edit/delete)
 * - Others (sales, data_entry, manager, marketing): Full CRUD permissions
 */

/**
 * Check if user is SA Admin (full access to everything)
 */
export const isSAAdmin = (role: string | undefined): boolean => {
    return role?.toLowerCase() === 'sa admin' || role?.toLowerCase() === 'sa_admin';
};

/**
 * Check if user is Admin role (User Management permissions)
 */
export const isAdminRole = (role: string | undefined): boolean => {
    return role?.toLowerCase() === 'admin';
};

/**
 * Check if user is Viewer (read-only access)
 */
export const isViewerRole = (role: string | undefined): boolean => {
    return role?.toLowerCase() === 'viewer';
};

/**
 * Check if user has full CRUD permissions based on role
 * SA Admin: Always true
 * Admin: Only for User Management controllers
 * Viewer: Always false (read-only)
 * Others: Always true
 */
export const hasFullCRUDAccess = (role: string | undefined, controller?: string): boolean => {
    // SA Admin has full access to everything
    if (isSAAdmin(role)) return true;

    // Viewer never has CRUD access
    if (isViewerRole(role)) return false;

    // Admin has CRUD only for User Management
    if (isAdminRole(role)) {
        const userManagementControllers = ['user', 'role', 'menu'];
        return controller ? userManagementControllers.includes(controller.toLowerCase()) : false;
    }

    // All other roles have full CRUD
    return true;
};
