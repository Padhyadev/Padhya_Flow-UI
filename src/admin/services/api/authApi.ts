import { ApiResponse, LoginRequest, LoginResponse } from '../types/apiTypes';
import { UserRole } from '../../types';
import { logError } from '../../utils/logError';

const API_BASE_URL = 'https://aj.padhyasoft.com/api';

/**
 * Real Authentication API Service
 * Connects to .NET Web API
 */
export const authApi = {
    /**
     * Login - Real API
     * POST: https://aj.padhyasoft.com/api/Auth/Login?userName={username}&password={password}
     */
    login: async (username: string, password: string): Promise<ApiResponse<LoginResponse>> => {
        try {
            const apiUrl = `${API_BASE_URL}/Auth/Login?userName=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`;

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
            });

            const data = await response.json();

            if (response.ok && data && data.isSuccess) {
                // Extract token from message field (appears to be in format: "S|Message|TOKEN")
                let token = '';
                let userData: any = {};
                let userId = '';

                if (data.message && typeof data.message === 'string') {
                    const messageParts = data.message.split('|');
                    if (messageParts.length >= 3) {
                        token = messageParts[2].trim(); // Token is the third part
                    }
                }

                // Decode JWT token to extract user ID
                if (token) {
                    try {
                        const tokenParts = token.split('.');
                        if (tokenParts.length === 3) {
                            const payload = JSON.parse(atob(tokenParts[1]));
                            // Extract user ID from .NET claim format
                            userId = payload.userId ||
                                payload.sub ||
                                payload.id ||
                                payload.nameid ||
                                payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] ||
                                '';
                            userData.roleName = payload.RoleName || payload.roleName || '';
                            userData.roleId = payload.RoleId || payload.roleId || '';
                        }
                    } catch (e) {
                        console.warn('Could not decode token');
                    }
                }

                // Extract user data from API response (if available)
                if (data.data) {
                    userData = data.data;
                } else if (data.user) {
                    userData = data.user;
                } else if (data.Data) {
                    userData = data.Data;
                }

                // Check if user is admin based on username
                const isAdminUser = username.toLowerCase() === 'admin' || username.toLowerCase() === 'administrator';

                // Map role name to UserRole type
                const mapRoleToUserRole = (roleName: string, isAdmin: boolean): UserRole => {
                    // If username is admin, always return admin role
                    if (isAdmin) return 'admin';

                    const normalizedRole = (roleName || '').toLowerCase().replace(/\s+/g, '_');
                    return normalizedRole as UserRole;
                };

                const userRole = userData.roleName || '';
                const mappedRole = mapRoleToUserRole(userRole, isAdminUser);

                const loginResponse: LoginResponse = {
                    token: token || 'mock-token-' + Date.now(),
                    refreshToken: data.refreshToken || data.RefreshToken || 'mock-refresh-token-' + Date.now(),
                    user: {
                        id: userId || userData.id || userData.userId || userData.UserId || '',
                        name: userData.name || userData.userName || userData.UserName || username,
                        email: userData.email || userData.Email || username,
                        role: mappedRole,
                    },
                    expiresIn: data.expiresIn || data.ExpiresIn || 3600,
                };

                return {
                    success: true,
                    data: loginResponse,
                    message: 'Login successful',
                    timestamp: new Date().toISOString(),
                };
            } else {
                // Login failed - extract error message from API response
                let errorMessage = 'Invalid Username or Password';

                if (data && !data.isSuccess) {
                    // API returned failure
                    // Parse message format: "E|Invalid username or password|0"
                    let rawMessage = data.message || 'Login failed';

                    // Check if message is in pipe-separated format
                    if (typeof rawMessage === 'string' && rawMessage.includes('|')) {
                        const messageParts = rawMessage.split('|');
                        if (messageParts.length >= 2) {
                            // Extract the actual message (second part)
                            errorMessage = messageParts[1].trim();
                        } else {
                            errorMessage = rawMessage;
                        }
                    } else {
                        errorMessage = rawMessage;
                    }
                } else if (response.status === 401) {
                    errorMessage = 'Invalid Username or Password';
                } else if (response.status === 400) {
                    errorMessage = 'Please enter valid username and password';
                }

                return {
                    success: false,
                    data: null as any,
                    message: errorMessage,
                    errors: [errorMessage],
                    timestamp: new Date().toISOString(),
                };
            }
        } catch (error) {
            console.error('Login API Error:', error);

            await logError({
                controllerName: 'AuthApi',
                methodName: 'Login',
                requestUrl: `${API_BASE_URL}/Auth/Login?userName=${encodeURIComponent(username)}`,
                requestPayload: { username }, // Don't log password for security
                error
            });

            return {
                success: false,
                data: null as any,
                message: 'Network error occurred',
                errors: [error instanceof Error ? error.message : 'Unknown error'],
                timestamp: new Date().toISOString(),
            };
        }
    },

    /**
     * Logout - Clear local storage
     */
    logout: async (): Promise<ApiResponse<null>> => {
        try {
            // Clear local storage
            localStorage.removeItem('admin_user');
            localStorage.removeItem('admin_token');
            localStorage.removeItem('admin_refresh_token');

            return {
                success: true,
                data: null,
                message: 'Logout successful',
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            return {
                success: false,
                data: null,
                message: 'Logout failed',
                errors: [error instanceof Error ? error.message : 'Unknown error'],
                timestamp: new Date().toISOString(),
            };
        }
    },

    /**
     * Verify Token - Check if token is valid by calling backend
     */
    verifyToken: async (): Promise<ApiResponse<any>> => {
        try {
            const token = localStorage.getItem('admin_token');

            if (!token) {
                return {
                    success: false,
                    data: null,
                    message: 'No token found',
                    timestamp: new Date().toISOString(),
                };
            }

            // Call backend to verify token
            const response = await fetch(`${API_BASE_URL}/Auth/VerifyToken`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();

                if (data && data.isSuccess) {
                    // Token is valid, return user data
                    return {
                        success: true,
                        data: data.data || data.Data,
                        message: 'Token is valid',
                        timestamp: new Date().toISOString(),
                    };
                }
            }

            // Token is invalid
            return {
                success: false,
                data: null,
                message: 'Invalid or expired token',
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            console.error('Token verification error:', error);
            return {
                success: false,
                data: null,
                message: 'Token verification failed',
                errors: [error instanceof Error ? error.message : 'Unknown error'],
                timestamp: new Date().toISOString(),
            };
        }
    },
};

export default authApi;
