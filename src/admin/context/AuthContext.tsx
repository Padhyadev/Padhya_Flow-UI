import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole } from '../types';
import { authApi } from '../services/api/authApi';
// ✅ NEW: Import permission normalization utilities
import { normalizePermissions } from '../utils/permissionNormalizer';
import { Permission } from '../types/permissions';

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    loading: boolean;
    login: (username: string, password: string) => Promise<{ user: User | null; error?: string }>;
    logout: () => Promise<void>;
    hasPermission: (permission: string) => boolean;
    isRole: (role: UserRole) => boolean;
    getRoleDashboard: (role: UserRole) => string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true); // Start with loading true

    // Check for existing session on mount
    useEffect(() => {
        const checkAuthStatus = async () => {
            console.log('🔍 Starting auth check...');
            setLoading(true);
            const storedUser = localStorage.getItem('admin_user');
            const token = localStorage.getItem('admin_token');

            console.log('🔍 Stored user:', storedUser ? 'Found' : 'Not found');
            console.log('🔍 Token:', token ? 'Found' : 'Not found');

            if (storedUser && token) {
                try {
                    // Parse stored user data
                    const userObj: User = JSON.parse(storedUser);

                    // Validate token format (JWT should have 3 parts)
                    const tokenParts = token.split('.');
                    if (tokenParts.length !== 3) {
                        console.error('🔒 Invalid token format - clearing session');
                        throw new Error('Invalid token format');
                    }

                    // Try to decode JWT payload to check expiration
                    // DISABLED: Token expiry check to prevent automatic logout
                    // Users will stay logged in until manual logout
                    let tokenExpired = false;
                    /* 
                    try {
                        const payload = JSON.parse(atob(tokenParts[1]));

                        // Check if token has expired
                        if (payload.exp) {
                            const expirationTime = payload.exp * 1000; // Convert to milliseconds
                            const currentTime = Date.now();

                            if (currentTime >= expirationTime) {
                                console.log('🔒 Token has expired - clearing session');
                                tokenExpired = true;
                            }
                        }
                    } catch (decodeError) {
                        // If we can't decode the payload, we'll still trust the token
                        // It will fail on actual API calls if invalid
                        console.warn('⚠️ Could not decode token payload, but will trust it');
                    }
                    */

                    // If token is expired, clear session
                    if (tokenExpired) {
                        throw new Error('Token expired');
                    }

                    // Token appears valid, restore session
                    setUser(userObj);
                    setIsAuthenticated(true);
                    console.log('✅ Session restored from localStorage for user:', userObj.name);
                } catch (error) {
                    // Error parsing data or token expired, clear storage
                    console.error('🔒 Auth check error:', error);
                    localStorage.removeItem('admin_user');
                    localStorage.removeItem('admin_token');
                    localStorage.removeItem('admin_refresh_token');
                    localStorage.removeItem('admin_menu_permissions');
                    setUser(null);
                    setIsAuthenticated(false);
                }
            } else {
                setUser(null);
                setIsAuthenticated(false);
            }

            setLoading(false);
        };

        checkAuthStatus();
    }, []);

    const login = async (username: string, password: string): Promise<{ user: User | null; error?: string }> => {
        setLoading(true);

        try {
            // Call real Auth API
            const response = await authApi.login(username, password);

            if (response.success && response.data) {
                const { token, refreshToken, user: userData } = response.data;

                // Convert API user format to local User type
                const userObj: User = {
                    id: userData.id,
                    name: userData.name,
                    email: userData.email,
                    role: userData.role as UserRole,
                    status: 'active',
                    createdAt: new Date().toISOString(),
                };

                setUser(userObj);
                setIsAuthenticated(true);

                // Store in localStorage
                localStorage.setItem('admin_user', JSON.stringify(userObj));
                localStorage.setItem('admin_token', token);
                if (refreshToken) {
                    localStorage.setItem('admin_refresh_token', refreshToken);
                }

                // ✅ NEW: Fetch and normalize menu permissions for ALL roles
                // This applies the Viewer read-only rule and full permissions for other roles
                console.log('📋 Fetching menu permissions for role:', userObj.role);
                try {
                    const menuAccessApi = (await import('../services/api/menuAccessApi')).default;
                    const menuResponse = await menuAccessApi.getMenuAccess(userObj.id);

                    if (menuResponse.success && menuResponse.data) {
                        // Convert menu data to Permission format
                        const rawPermissions: Permission[] = menuResponse.data.menus.map((menu: any) => ({
                            controller: menu.controller || menu.name,
                            action: 'view' as const // Backend returns menus with view access
                        }));

                        // ⭐ APPLY ROLE RULES: Normalize permissions based on user role
                        // - Viewer: Read-only (only 'view' action)
                        // - All others: Full permissions (view, add, edit, delete)
                        const normalizedPermissions = normalizePermissions(rawPermissions, userObj.role);
                        console.log('🔐 Normalized permissions:', normalizedPermissions.length);
                        console.log('🔐 Sample permissions:', normalizedPermissions.slice(0, 5));

                        // Store normalized permissions in localStorage
                        // PermissionContext will load these on initialization
                        localStorage.setItem('user_permissions', JSON.stringify(normalizedPermissions));

                        // Also keep original menu data for backward compatibility
                        localStorage.setItem('admin_menu_permissions', JSON.stringify(menuResponse.data.menus));
                        console.log('✅ Permissions normalized and stored');
                    } else {
                        localStorage.removeItem('user_permissions');
                        localStorage.removeItem('admin_menu_permissions');
                    }
                } catch (error) {
                    console.error('❌ Error fetching menu permissions:', error);
                    localStorage.removeItem('user_permissions');
                    localStorage.removeItem('admin_menu_permissions');
                }

                return { user: userObj };
            }

            // Login failed - return API error message
            return {
                user: null,
                error: response.message || 'Invalid Username or Password'
            };
        } catch (error) {
            console.error('Auth login error:', error);
            return {
                user: null,
                error: 'Network error. Please check your connection.'
            };
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        setLoading(true);

        try {
            // Call real Auth API
            await authApi.logout();

            setUser(null);
            setIsAuthenticated(false);
            localStorage.removeItem('admin_user');
            localStorage.removeItem('admin_token');
            localStorage.removeItem('admin_refresh_token');
            localStorage.removeItem('admin_menu_permissions');
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            setLoading(false);
        }
    };

    const hasPermission = (permission: string): boolean => {
        if (!user) return false;
        // SA Admin has all permissions
        const role = user.role?.toLowerCase();
        return role === 'sa admin' || role === 'sa_admin';
    };

    const isRole = (role: UserRole): boolean => {
        return user?.role === role;
    };

    const getRoleDashboard = (role: UserRole): string => {
        // Return role-specific dashboard
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
            case 'ac_admin':
            default:
                return '/admin/dashboard';
        }
    };

    const value: AuthContextType = {
        user,
        isAuthenticated,
        loading,
        login,
        logout,
        hasPermission,
        isRole,
        getRoleDashboard,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
