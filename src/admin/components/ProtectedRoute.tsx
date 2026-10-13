import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { logError } from '../utils/logError';

interface ProtectedRouteProps {
    children: React.ReactNode;
    requiredRole?: string[];
}

// Controller to Route mapping (same as AdminSidebar)
const routeToControllerMap: Record<string, string> = {
    '/admin/cities': 'Cities',
    '/admin/areas': 'Areas',
    '/admin/locations': 'Locations',
    '/admin/properties': 'Properties',
    '/admin/property-amenities': 'PropertyAmenities',
    '/admin/property-types': 'PropertyType',
    '/admin/property-categories': 'PropertyCategorie',
    '/admin/leads': 'Leads',
    '/admin/lead-followups': 'LeadFollowups',
    '/admin/lead-timelines': 'LeadTimeline',
    '/admin/services': 'ServicesMaster', // Matches API controller name
    '/admin/users': 'User',
    '/admin/roles': 'Role',
    '/admin/menus': 'Menu',
    '/admin/lov': 'Lov',
    '/admin/clients': 'Client',
    '/admin/client-followups': 'ClientFollowup',
    '/admin/projects': 'Project',
    '/admin/employees': 'Employee',
    '/admin/holidays': 'Holiday',
    '/admin/leavetypes': 'LeaveType',
    '/admin/leaveapplications': 'LeaveApplications',
    '/admin/leave-balances': 'LeaveBalance',
    '/admin/short-leaves': 'ShortLeave',
    '/admin/office-expense-types': 'OfficeExpenseType',
    '/admin/expenses': 'OfficeExpense',
    '/admin/vendors': 'Vendor',
    '/admin/settings': 'Menu', // Settings usually requires general menu/admin access
    '/admin/daily-tasks': 'DailyTask',
    '/admin/bni-chapters': 'BNIChapter',
    '/admin/bni-members': 'BNIMember',
    '/admin/bni-followups': 'BNIFollowup',
    '/admin/bni-meetings': 'BNIMeeting',
};

// Controller Aliases (Map generic controller name to possible variants/Masters in DB)
const controllerAliases: Record<string, string[]> = {
    'project': ['projectmaster'],
    'client': ['clientmaster'],
    'vendor': ['vendormaster'],
    'country': ['countrymaster'],
    'holiday': ['holidaymaster', 'holidays'],
    'service': ['servicesmaster', 'services'],
    'servicesmaster': ['service', 'services'],
    'leavetype': ['leavetypes', 'leavetypemaster'],
    'leaveapplications': ['leaveapplication'],
    'leavebalance': ['leavebalances'],
    'shortleave': ['shortleaves']
};

// ✅ NEW: Helper function to get role-specific dashboard
// ✅ UPDATED: Always return main dashboard for all roles
const getRoleDashboard = (role: string): string => {
    return '/admin/dashboard';
};

export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
    const { isAuthenticated, user, loading } = useAuth();
    const location = useLocation();

    // Wait for authentication check to complete before making any decisions
    if (loading) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)'
            }}>
                <div style={{ textAlign: 'center' }}>
                    <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '2rem', color: '#3b82f6', marginBottom: '1rem' }}></i>
                    <p style={{ color: '#64748b', margin: 0 }}>Loading...</p>
                </div>
            </div>
        );
    }

    console.log('🔥 ROUTE CHECK: Path:', location.pathname, 'User:', user?.role, 'Authenticated:', isAuthenticated);

    // Only redirect to login if loading is complete and user is not authenticated
    if (!isAuthenticated) {
        console.log('🔥 ROUTE CHECK: Not authenticated - redirecting to login');
        return <Navigate to="/admin/login" replace />;
    }

    // ✅ Admin and SA Admin users have access to all ROUTES (but sidebar menus are still dynamic)
    // This allows admins to access pages even if menu permissions aren't assigned yet
    const userRole = user?.role?.toLowerCase();

    // ✅ RESTORED: Admin and SA Admin users have access to all ROUTES (bypass dynamic check)
    if (userRole === 'admin' || userRole === 'sa admin' || userRole === 'sa_admin') {
        console.log('🔥 ROUTE CHECK: Admin bypass - access granted');
        return <>{children}</>;
    }

    // Dashboard is always accessible for authenticated users
    if (location.pathname.includes('/admin/dashboard')) {
        console.log('🔥 ROUTE CHECK: Dashboard - access granted');
        return <>{children}</>;
    }

    // Check menu permissions for non-admin users
    const menuPermissionsStr = localStorage.getItem('admin_menu_permissions');

    if (menuPermissionsStr) {
        try {
            const menuPermissions = JSON.parse(menuPermissionsStr);
            const currentPath = location.pathname;

            // Find the controller for the current route
            let controller = routeToControllerMap[currentPath];

            if (!controller) {
                // Check if current path is a sub-route of any base route
                for (const [route, ctrl] of Object.entries(routeToControllerMap)) {
                    if (currentPath.startsWith(route + '/') || currentPath === route) {
                        controller = ctrl;
                        break;
                    }
                }
            }

            console.log('🔥 ROUTE CHECK: Controller:', controller);

            if (controller) {
                // Check if user has permission for this controller
                const hasAccess = menuPermissions.some((menu: any) => {
                    const menuController = (menu.controller || '').toLowerCase().trim();
                    const menuName = (menu.menuName || menu.name || '').toLowerCase().trim();
                    const targetController = controller.toLowerCase();

                    // 1. Direct Controller Match
                    if (menuController === targetController) return true;

                    // 1b. Alias Match
                    if (controllerAliases[targetController] && controllerAliases[targetController].includes(menuController)) return true;

                    // 2. Name Match (Fallback if controller is empty/0)
                    if (menuName === targetController) return true;

                    // 2b. Name Alias Match
                    if (controllerAliases[targetController] && controllerAliases[targetController].includes(menuName)) return true;

                    // 3. Group Match (If user has access to the Group, they get access to the Item)
                    const groupMap: Record<string, string[]> = {
                        'user management': ['user', 'role', 'menu', 'lov'],
                        'client management': ['client', 'clientmaster', 'clientfollowup', 'project', 'projectmaster'],
                        'employee management': ['employee'],
                        'holiday management': ['holiday', 'holidays', 'holidaymaster'],
                        'leave management': ['leavetypes', 'leavetype', 'leaveapplications', 'leavebalance', 'shortleave'],
                        'office management': ['officeexpensetype', 'officeexpense', 'officeexpenses'],
                        'vendor management': ['vendor', 'vendormaster'],
                        'property master': ['properties', 'propertytype', 'propertyamenities', 'propertycategorie', 'subpropertytype'],
                        'lead master': ['leads', 'leadtimeline', 'leadsource', 'leadfollowups'],
                        'service master': ['service', 'servicesmaster', 'services'],
                        'services master': ['service', 'servicesmaster', 'services'],
                        'task management': ['dailytask'],
                        'bni management': ['bnichapter', 'bnimember', 'bnifollowup', 'bnimeeting'],
                        'cities master': ['cities', 'areas', 'locations']
                    };

                    const groupItems = groupMap[menuName] || groupMap[menuController]; // e.g. menuName='property master' -> returns array
                    if (groupItems && groupItems.includes(targetController)) {
                        return true;
                    }

                    return false;
                });

                console.log('🔥 ROUTE CHECK: Has access:', hasAccess);

                if (hasAccess) {
                    console.log('🔥 ROUTE CHECK: Permission granted - rendering page');
                    return <>{children}</>;
                } else {
                    // ✅ UPDATED: Redirect to role-specific dashboard instead of access denied
                    console.log('🔥 ROUTE CHECK: Permission denied - redirecting to dashboard');
                    const dashboardPath = getRoleDashboard(user?.role || 'admin');
                    return <Navigate to={dashboardPath} replace />;
                }
            }
        } catch (error) {
            console.error('🔥 ROUTE CHECK: Error:', error);

            logError({
                controllerName: 'ProtectedRoute',
                methodName: 'CheckPermissions',
                requestUrl: location.pathname,
                requestPayload: { menuPermissionsStr },
                error
            });
        }
    }

    // Fallback to role-based check
    if (requiredRole && user && !requiredRole.includes(user.role)) {
        console.log('🔥 ROUTE CHECK: Role check failed - redirecting to dashboard');
        // ✅ UPDATED: Redirect to role-specific dashboard instead of access denied
        const dashboardPath = getRoleDashboard(user?.role || 'admin');
        return <Navigate to={dashboardPath} replace />;
    }

    console.log('🔥 ROUTE CHECK: Default - access granted');
    return <>{children}</>;
}
