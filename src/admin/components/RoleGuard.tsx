import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

interface RoleGuardProps {
    children: React.ReactNode;
    allowedRoles: UserRole[];
    redirectTo?: string;
}

// ✅ NEW: Helper function to get role-specific dashboard
const getRoleDashboard = (role: string): string => {
    // Static dashboard mapping commented out
    /*
    const normalizedRole = role?.toLowerCase();
    switch (normalizedRole) {
        case 'sales':
            return '/admin/sales-dashboard';
        case 'data_entry':
            return '/admin/data-entry-dashboard';
        case 'viewer':
            return '/admin/viewer-dashboard';
        case 'admin':
        case 'manager':
        case 'marketing':
        case 'SA Admin':
        case 'sa_admin':
        default:
            return '/admin/dashboard';
    }
    */
    return '/admin/dashboard';
};

/**
 * RoleGuard Component
 * Protects routes based on user roles
 * Redirects unauthorized users to their role-specific dashboard
 */
export default function RoleGuard({ children, allowedRoles, redirectTo }: RoleGuardProps) {
    const { user, loading } = useAuth();

    // Show loading while checking authentication
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

    // Check if user has required role (case-insensitive comparison)
    const userRoleNormalized = user?.role?.toLowerCase();
    const allowedRolesNormalized = allowedRoles.map(r => r.toLowerCase());

    if (!user || !userRoleNormalized || !allowedRolesNormalized.includes(userRoleNormalized)) {
        // ✅ UPDATED: Redirect to role-specific dashboard instead of access denied
        const dashboardPath = redirectTo || getRoleDashboard(user?.role || 'admin');
        return <Navigate to={dashboardPath} replace />;
    }

    return <>{children}</>;
}
