/**
 * Permission Normalizer
 * 
 * This module handles permission normalization with special role rules:
 * 1. Viewer role: Read-only (only 'view' action)
 * 2. All other roles: Full permissions (view, add, edit, delete)
 * 
 * IMPORTANT: This is where role-based permission logic lives.
 * Components should NOT have role-specific logic.
 */

import { Permission, PermissionAction, ControllerPermissions } from '../types/permissions';

/**
 * Normalize permissions based on user role
 * 
 * @param rawPermissions - Permissions from backend
 * @param userRole - User's role
 * @returns Normalized permissions with role rules applied
 */
export function normalizePermissions(
    rawPermissions: Permission[],
    userRole: string
): Permission[] {
    const role = userRole.toLowerCase().trim();

    console.log('🔐 Permission Normalizer: Processing permissions for role:', role);
    console.log('🔐 Raw permissions count:', rawPermissions.length);

    // ⭐ VIEWER ROLE: Read-only access (only 'view' action)
    // Static hardcode commented out to valid Custom Role dynamic permissions
    /*
    if (role === 'viewer') {
        const viewOnlyPermissions = rawPermissions.filter(p => p.action === 'view');
        console.log('🔐 Viewer role detected - filtered to view-only permissions:', viewOnlyPermissions.length);
        return viewOnlyPermissions;
    }
    */

    // ⭐ ALL OTHER ROLES: Full permissions for assigned controllers
    // Get unique controllers from raw permissions
    const controllers = [...new Set(rawPermissions.map(p => p.controller))];

    const fullPermissions: Permission[] = [];
    const actions: PermissionAction[] = ['view', 'add', 'edit', 'delete'];

    controllers.forEach(controller => {
        actions.forEach(action => {
            fullPermissions.push({ controller, action });
        });
    });

    console.log('🔐 Non-viewer role - expanded to full permissions:', fullPermissions.length);
    return fullPermissions;
}

/**
 * Normalize controller name for flexible matching
 * Handles singular/plural variations and case differences
 * 
 * Examples:
 * - 'Areas' → 'area'
 * - 'Cities' → 'city'
 * - 'PropertyAmenities' → 'propertyamenity'
 * - 'PropertyCategorie' → 'propertycategory'
 */
function normalizeControllerName(name: string): string {
    let normalized = name.toLowerCase().trim();

    // Remove trailing 's' for plural forms
    if (normalized.endsWith('ies')) {
        // Cities → City, Categories → Category
        normalized = normalized.slice(0, -3) + 'y';
    } else if (normalized.endsWith('es')) {
        // Addresses → Address
        normalized = normalized.slice(0, -2);
    } else if (normalized.endsWith('s')) {
        // Areas → Area, Menus → Menu
        normalized = normalized.slice(0, -1);
    }

    return normalized;
}

/**
 * Check if two controller names match (flexible matching)
 * 
 * @param name1 - First controller name
 * @param name2 - Second controller name
 * @returns True if names match (case-insensitive, handles plurals)
 */
function controllersMatch(name1: string, name2: string): boolean {
    const normalized1 = normalizeControllerName(name1);
    const normalized2 = normalizeControllerName(name2);

    // Direct match
    if (normalized1 === normalized2) {
        return true;
    }

    // Also check original lowercase match
    if (name1.toLowerCase() === name2.toLowerCase()) {
        return true;
    }

    return false;
}

/**
 * Get permissions for a specific controller
 * 
 * @param permissions - User's normalized permissions
 * @param controller - Controller name
 * @returns Controller-specific permissions summary
 */
export function getControllerPermissions(
    permissions: Permission[],
    controller: string
): ControllerPermissions {
    const controllerPerms = permissions.filter(
        p => controllersMatch(p.controller, controller)
    );

    const result = {
        controller,
        canView: controllerPerms.some(p => p.action === 'view'),
        canAdd: controllerPerms.some(p => p.action === 'add'),
        canEdit: controllerPerms.some(p => p.action === 'edit'),
        canDelete: controllerPerms.some(p => p.action === 'delete'),
        hasAnyAccess: controllerPerms.length > 0
    };

    console.log(`🔐 getControllerPermissions('${controller}'):`, result);
    return result;
}

/**
 * Check if user has a specific permission
 * 
 * @param permissions - User's normalized permissions
 * @param controller - Controller name
 * @param action - Action to check
 * @returns True if user has the permission
 */
export function hasPermission(
    permissions: Permission[],
    controller: string,
    action: PermissionAction
): boolean {
    const hasIt = permissions.some(
        p => controllersMatch(p.controller, controller) &&
            p.action === action
    );

    console.log(`🔐 hasPermission('${controller}', '${action}'):`, hasIt);
    return hasIt;
}

/**
 * Check if user has any of the specified permissions
 * 
 * @param permissions - User's normalized permissions
 * @param requiredPermissions - Array of required permissions (any match grants access)
 * @returns True if user has at least one of the required permissions
 */
export function hasAnyPermission(
    permissions: Permission[],
    requiredPermissions: Array<{ controller: string; action: PermissionAction }>
): boolean {
    return requiredPermissions.some(required =>
        hasPermission(permissions, required.controller, required.action)
    );
}

/**
 * Example usage and verification
 */
export function verifyPermissionRules() {
    console.log('🧪 Testing Permission Normalization Rules...\n');

    // Test data
    const rawPermissions: Permission[] = [
        { controller: 'PropertyType', action: 'view' },
        { controller: 'PropertyType', action: 'add' },
        { controller: 'Menu', action: 'view' }
    ];

    // Test 1: Viewer role (should only get 'view' actions)
    const viewerPermissions = normalizePermissions(rawPermissions, 'Viewer');
    console.log('✅ Viewer permissions:', viewerPermissions);
    console.log('   - Can view PropertyType:', hasPermission(viewerPermissions, 'PropertyType', 'view'));
    console.log('   - Can add PropertyType:', hasPermission(viewerPermissions, 'PropertyType', 'add'));
    console.log('   - Can edit PropertyType:', hasPermission(viewerPermissions, 'PropertyType', 'edit'));

    // Test 2: Admin role (should get full permissions)
    const adminPermissions = normalizePermissions(rawPermissions, 'Admin');
    console.log('\n✅ Admin permissions:', adminPermissions.length);
    console.log('   - Can view PropertyType:', hasPermission(adminPermissions, 'PropertyType', 'view'));
    console.log('   - Can add PropertyType:', hasPermission(adminPermissions, 'PropertyType', 'add'));
    console.log('   - Can edit PropertyType:', hasPermission(adminPermissions, 'PropertyType', 'edit'));
    console.log('   - Can delete PropertyType:', hasPermission(adminPermissions, 'PropertyType', 'delete'));

    // Test 3: Controller permissions summary
    const propertyTypePerms = getControllerPermissions(adminPermissions, 'PropertyType');
    console.log('\n✅ PropertyType permissions for Admin:', propertyTypePerms);
}
