import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Component that redirects users to their role-specific dashboard
 */
export default function DashboardRedirect() {
    const { user } = useAuth();

    // Redirect based on user role
    if (user?.role === 'sales') {
        return <Navigate to="/admin/sales-dashboard" replace />;
    }

    if (user?.role === 'data_entry') {
        return <Navigate to="/admin/data-entry-dashboard" replace />;
    }

    if (user?.role === 'viewer') {
        return <Navigate to="/admin/viewer-dashboard" replace />;
    }

    // Admin, Manager, Marketing go to main dashboard
    return <Navigate to="/admin/dashboard" replace />;
}
