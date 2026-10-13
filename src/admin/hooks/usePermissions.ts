import { useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { isSAAdmin, isViewerRole, isAdminRole } from '../utils/permissionHelpers';

/**
 * Custom hook to check menu-based permissions
 * Returns permission flags based on user's menu access from backend
 * 
 * ✅ UPDATED: Now grants full permissions to non-Viewer roles by default
 * Only Viewer role has read-only access
 */
/**
 * Helper to match controller names with aliases and groups
 */
const matchesControllerOrGroup = (menuCtrl: string, targetCtrl: string): boolean => {
    menuCtrl = menuCtrl.toLowerCase().trim();
    targetCtrl = targetCtrl.toLowerCase().trim();

    // 1. Direct Match
    if (menuCtrl === targetCtrl) return true;

    // 2. Alias handling for Services
    if ((targetCtrl === 'service' || targetCtrl === 'servicesmaster') &&
        (menuCtrl === 'service' || menuCtrl === 'servicesmaster' || menuCtrl === 'services' || menuCtrl === 'service master' || menuCtrl === 'services master')) {
        return true;
    }

    // 3. Alias handling for Property Category (Requirement Types)
    if ((targetCtrl === 'propertycategorie' || targetCtrl === 'propertycategory') &&
        (menuCtrl === 'propertycategorie' || menuCtrl === 'propertycategory' || menuCtrl === 'propertycategories' || menuCtrl === 'property master')) {
        return true;
    }

    // 4. Alias handling for Lead Source
    if ((targetCtrl === 'leadsource' || targetCtrl === 'leadsources') &&
        (menuCtrl === 'leadsource' || menuCtrl === 'leadsources' || menuCtrl === 'lead master')) {
        return true;
    }

    // 4b. Alias handling for Holiday
    if ((targetCtrl === 'holiday' || targetCtrl === 'holidays' || targetCtrl === 'holidaymaster') &&
        (menuCtrl === 'holiday' || menuCtrl === 'holidays' || menuCtrl === 'holidaymaster')) {
        return true;
    }

    // 4c. Alias handling for LeaveTypes
    if ((targetCtrl === 'leavetypes' || targetCtrl === 'leavetype') &&
        (menuCtrl === 'leavetypes' || menuCtrl === 'leavetype')) {
        return true;
    }

    // 4d. Alias handling for ShortLeave
    if ((targetCtrl === 'shortleave' || targetCtrl === 'shortleaves') &&
        (menuCtrl === 'shortleave' || menuCtrl === 'shortleaves' || menuCtrl === 'short leave' || menuCtrl === 'short leaves')) {
        return true;
    }

    // 4e. Alias handling for OfficeExpense
    if ((targetCtrl === 'officeexpense' || targetCtrl === 'officeexpenses') &&
        (menuCtrl === 'officeexpense' || menuCtrl === 'officeexpenses' || menuCtrl === 'office expense' || menuCtrl === 'office expenses')) {
        return true;
    }

    // 5. Group-based matching logic (Expanded)
    const groupMap: Record<string, string[]> = {
        'property master': ['properties', 'propertytype', 'propertyamenities', 'propertycategorie', 'propertycategory', 'subpropertytype', 'property categories', 'property types', 'property amenities'],
        'user management': ['user', 'role', 'menu', 'users', 'roles', 'menus'],
        'employee management': ['employees', 'employee'],
        'holiday management': ['holidays', 'holiday', 'holidaymaster'],
        'leave management': ['leavetypes', 'leavetype', 'leave type', 'leave types', 'leaveapplications', 'leaveapplication', 'shortleave', 'shortleaves'],
        'office management': ['officeexpense', 'officeexpenses', 'officeexpensetype', 'officeexpensetypes'],
        'lead master': ['leads', 'leadtimeline', 'leadsource', 'leadsources', 'leadfollowups', 'lead timelines', 'lead sources'],
        'service master': ['service', 'servicesmaster', 'services', 'services master'],
        'services master': ['service', 'servicesmaster', 'services', 'services master'],
        'cities master': ['cities', 'areas', 'locations', 'city', 'area', 'location']
    };

    const groupItems = groupMap[menuCtrl];
    if (groupItems && groupItems.includes(targetCtrl)) {
        return true;
    }

    // 6. Reverse check: if targetCtrl is a known group part
    for (const [group, items] of Object.entries(groupMap)) {
        if (items.includes(targetCtrl) && menuCtrl === group) {
            return true;
        }
    }

    return false;
};

export const usePermissions = (controllerName: string) => {
    const { user } = useAuth();

    const permissions = useMemo(() => {
        // SA Admin always has all permissions
        if (isSAAdmin(user?.role)) {
            return {
                canView: true,
                canAdd: true,
                canEdit: true,
                canDelete: true,
                hasAccess: true,
            };
        }

        // Check if user is Viewer (read-only role)
        const isViewer = isViewerRole(user?.role);

        // Get menu permissions from localStorage
        const menuPermissionsStr = localStorage.getItem('admin_menu_permissions');

        if (!menuPermissionsStr) {
            return {
                canView: false,
                canAdd: false,
                canEdit: false,
                canDelete: false,
                hasAccess: false,
            };
        }

        try {
            const menuPermissions = JSON.parse(menuPermissionsStr);

            // Find the menu item for this controller using our helper
            const menuItem = menuPermissions.find(
                (menu: any) => matchesControllerOrGroup(menu.controller || menu.menuName || menu.name || '', controllerName)
            );

            if (!menuItem) {
                return {
                    canView: false,
                    canAdd: false,
                    canEdit: false,
                    canDelete: false,
                    hasAccess: false,
                };
            }

            // If menu item exists, grant permissions
            // Viewer role: only view permission
            // Other roles: full permissions (add, edit, delete)
            return {
                canView: true,
                canAdd: !isViewer,
                canEdit: !isViewer,
                canDelete: !isViewer,
                hasAccess: true,
            };
        } catch (error) {
            console.error('Error parsing menu permissions:', error);
            return {
                canView: false,
                canAdd: false,
                canEdit: false,
                canDelete: false,
                hasAccess: false,
            };
        }
    }, [user, controllerName]);

    const getEditCallback = <T = any>(callback: (item: T) => void) => {
        return permissions.canEdit ? callback : undefined;
    };

    const getDeleteCallback = <T = any>(callback: (item: T) => void) => {
        return permissions.canDelete ? callback : undefined;
    };

    return {
        ...permissions,
        getEditCallback,
        getDeleteCallback,
    };
};

/**
 * Helper function to check if user has specific permission for a controller
 */
export const hasPermission = (
    controllerName: string,
    permissionType: 'view' | 'add' | 'edit' | 'delete' = 'view'
): boolean => {
    const userJson = localStorage.getItem('admin_user');
    const user = userJson ? JSON.parse(userJson) : {};

    if (isSAAdmin(user?.role)) return true;

    const menuPermissionsStr = localStorage.getItem('admin_menu_permissions');
    if (!menuPermissionsStr) return false;

    try {
        const menuPermissions = JSON.parse(menuPermissionsStr);
        const menuItem = menuPermissions.find(
            (menu: any) => matchesControllerOrGroup(menu.controller || menu.menuName || menu.name || '', controllerName)
        );

        return !!menuItem;
    } catch {
        return false;
    }
};
