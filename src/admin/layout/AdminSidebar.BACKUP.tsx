/**
 * BACKUP: Old Hardcoded Menu Items
 *
 * This file contains the original hardcoded menu structure for reference.
 * The new AdminSidebar.tsx is now fully dynamic and builds menus from database permissions.
 *
 * Date: 2025-12-18
 * Reason: Migration to dynamic permission-based sidebar
 */

/*
const menuItems: MenuItem[] = [
    // Dashboard - Role-specific
    {
        path: user?.role === 'SA Admin' || user?.role === 'SA Admin' || user?.role === 'ac_admin' ||
            user?.role === 'admin' || user?.role === 'manager' || user?.role === 'marketing' ? '/admin/dashboard' :
            user?.role === 'sales' ? '/admin/sales-dashboard' :
                user?.role === 'data_entry' ? '/admin/data-entry-dashboard' :
                    '/admin/viewer-dashboard',
        icon: 'fa-chart-line',
        label: 'Dashboard'
    },
    // User Management Master
    {
        icon: 'fa-users-gear',
        label: 'User Management',
        roles: ['admin'],
        submenu: [
            {
                path: '/admin/users',
                icon: 'fa-user-gear',
                label: 'Users',
                roles: ['admin']
            },
            {
                path: '/admin/roles',
                icon: 'fa-user-shield',
                label: 'Roles',
                roles: ['admin']
            },
            {
                path: '/admin/menus',
                icon: 'fa-bars',
                label: 'Menus',
                roles: ['admin']
            }
        ]
    },
    // Property Master
    {
        icon: 'fa-building-circle-check',
        label: 'Property Master',
        roles: ['admin', 'manager', 'data_entry', 'viewer', 'sales'],
        submenu: [
            {
                path: '/admin/properties',
                icon: 'fa-building',
                label: 'Properties',
                roles: ['admin', 'data_entry', 'viewer', 'sales']
            },
            {
                path: '/admin/property-types',
                icon: 'fa-home',
                label: 'Property Types',
                roles: ['admin', 'manager']
            },
            {
                path: '/admin/property-amenities',
                icon: 'fa-list-check',
                label: 'Property Amenities',
                roles: ['admin', 'manager']
            },
            {
                path: '/admin/property-categories',
                icon: 'fa-tags',
                label: 'Requirement Types',
                roles: ['admin', 'manager']
            },
            {
                path: '/admin/sub-property-types',
                icon: 'fa-layer-group',
                label: 'Sub Property Types',
                roles: ['admin', 'manager']
            }
        ]
    },
    // Lead Master
    {
        icon: 'fa-user-tag',
        label: 'Lead Master',
        roles: ['admin', 'sales', 'manager'],
        submenu: [
            {
                path: '/admin/leads',
                icon: 'fa-users',
                label: 'Leads',
                roles: ['admin', 'sales']
            },
            {
                path: '/admin/lead-timelines',
                icon: 'fa-clock-rotate-left',
                label: 'Lead Timelines',
                roles: ['admin', 'sales']
            },
            {
                path: '/admin/lead-sources',
                icon: 'fa-list',
                label: 'Lead Sources',
                roles: ['admin', 'manager', 'sales']
            }
        ]
    },
    // Service Master
    {
        icon: 'fa-briefcase',
        label: 'Service Master',
        roles: ['admin', 'manager'],
        submenu: [
            {
                path: '/admin/services',
                icon: 'fa-briefcase',
                label: 'Services',
                roles: ['admin', 'manager']
            }
        ]
    },
    // Cities Master
    {
        icon: 'fa-city',
        label: 'Cities Master',
        roles: ['admin', 'manager'],
        submenu: [
            {
                path: '/admin/cities',
                icon: 'fa-city',
                label: 'Cities',
                roles: ['admin', 'manager']
            }
        ]
    },
    // Areas Master
    {
        icon: 'fa-map-location-dot',
        label: 'Areas Master',
        roles: ['admin', 'manager'],
        submenu: [
            {
                path: '/admin/areas',
                icon: 'fa-map-location-dot',
                label: 'Areas',
                roles: ['admin', 'manager']
            }
        ]
    },
    // Locations Master
    {
        icon: 'fa-location-dot',
        label: 'Locations Master',
        roles: ['admin', 'manager'],
        submenu: [
            {
                path: '/admin/locations',
                icon: 'fa-location-dot',
                label: 'Locations',
                roles: ['admin', 'manager']
            }
        ]
    }
];
*/

// export { };
