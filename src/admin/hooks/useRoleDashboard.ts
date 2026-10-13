import { useMemo } from 'react';
import { useAuth } from '../context/AuthContext';

/**
 * Hook to get role-specific dashboard path
 * This is dynamic and can be configured from backend in the future
 * 
 * @returns Dashboard path for the current user's role
 */
/**
 * Hook to get role-specific dashboard path
 * ✅ UPDATED: Now dynamically determines dashboard from menu permissions
 * 
 * @returns Dashboard path from user's assigned menus
 */
export const useRoleDashboard = (): string => {
    return useMemo(() => {
        // Try to get permissions from localStorage
        const storedMenus = localStorage.getItem('admin_menu_permissions');
        if (storedMenus) {
            try {
                const menus = JSON.parse(storedMenus);

                // Priority 1: Find any role-specific dashboard (e.g., Sales Dashboard, Data Entry Dashboard)
                const roleSpecificDashboard = menus.find((m: any) =>
                    m.url && m.url.toLowerCase().includes('dashboard') &&
                    m.url.toLowerCase() !== '/admin/dashboard' &&
                    m.isActive && !m.isDeleted
                );

                if (roleSpecificDashboard) return roleSpecificDashboard.url;

                // Priority 2: Find the main admin dashboard
                const mainDashboard = menus.find((m: any) =>
                    m.url && m.url.toLowerCase() === '/admin/dashboard' &&
                    m.isActive && !m.isDeleted
                );
                if (mainDashboard) return mainDashboard.url;

                // Priority 3: Just return the first available menu as a landing page if no dashboard
                if (menus.length > 0 && menus[0].url) return menus[0].url;
            } catch (e) {
                console.error("❌ Error parsing menus to determine dashboard:", e);
            }
        }

        // Default fallback
        return '/admin/dashboard';
    }, []); // Only compute once or based on storage change (Auth handle storage)
};

/**
 * Utility to get dashboard path for a specific role
 * ✅ UPDATED: This is now just a fallback, use useRoleDashboard hook for dynamic behavior
 * 
 * @param role - User role
 * @returns Dashboard path
 */
export const getDashboardForRole = (role: string): string => {
    // We try to return the same logic but since this is a static utility, 
    // it will try to read from localStorage.
    const storedMenus = localStorage.getItem('admin_menu_permissions');
    if (storedMenus) {
        try {
            const menus = JSON.parse(storedMenus);
            const roleDash = menus.find((m: any) =>
                m.url && m.url.toLowerCase().includes('dashboard') &&
                m.url.toLowerCase() !== '/admin/dashboard'
            );
            if (roleDash) return roleDash.url;

            const mainDash = menus.find((m: any) => m.url && m.url.toLowerCase() === '/admin/dashboard');
            if (mainDash) return mainDash.url;
        } catch (e) { }
    }

    // Static fallbacks for cases where menus aren't loaded yet (e.g., during login transition)
    const normalizedRole = role?.toLowerCase() || '';
    if (normalizedRole.includes('sales')) return '/admin/sales-dashboard';
    if (normalizedRole.includes('data') || normalizedRole.includes('entry')) return '/admin/data-entry-dashboard';
    if (normalizedRole.includes('viewer')) return '/admin/viewer-dashboard';

    return '/admin/dashboard';
};

export default useRoleDashboard;
