import { ApiResponse, LoginRequest, LoginResponse } from '../types/apiTypes';
import { mockUsers, getUserByEmail } from '../../data/mockData';

// Simulated API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const API_DELAY = 800;

/**
 * Dummy Authentication API
 * Mimics .NET Web API authentication endpoints
 * Ready to be replaced with real API calls
 */
export const dummyAuthApi = {
    /**
     * Login
     * POST /api/auth/login
     */
    login: async (request: LoginRequest): Promise<ApiResponse<LoginResponse>> => {
        await delay(API_DELAY);

        try {
            // Find user by email
            const user = getUserByEmail(request.email);

            // Check if user exists and is active
            if (!user || user.status !== 'active') {
                return {
                    success: false,
                    data: null as any,
                    message: 'Invalid email or password',
                    errors: ['User not found or inactive'],
                    timestamp: new Date().toISOString(),
                };
            }

            // For demo: any password works
            // In real API, password would be validated

            // Generate mock token
            const token = `mock_token_${user.id}_${Date.now()}`;
            const refreshToken = `mock_refresh_${user.id}_${Date.now()}`;

            const response: LoginResponse = {
                token,
                refreshToken,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                },
                expiresIn: 3600, // 1 hour
            };

            return {
                success: true,
                data: response,
                message: 'Login successful',
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            return {
                success: false,
                data: null as any,
                message: 'Login failed',
                errors: [error instanceof Error ? error.message : 'Unknown error'],
                timestamp: new Date().toISOString(),
            };
        }
    },

    /**
     * Logout
     * POST /api/auth/logout
     */
    logout: async (): Promise<ApiResponse<null>> => {
        await delay(API_DELAY);

        return {
            success: true,
            data: null,
            message: 'Logout successful',
            timestamp: new Date().toISOString(),
        };
    },

    /**
     * Refresh Token
     * POST /api/auth/refresh
     */
    refreshToken: async (refreshToken: string): Promise<ApiResponse<LoginResponse>> => {
        await delay(API_DELAY);

        try {
            // Extract user ID from refresh token (mock implementation)
            const userId = refreshToken.split('_')[2];
            const user = mockUsers.find(u => u.id === userId);

            if (!user) {
                return {
                    success: false,
                    data: null as any,
                    message: 'Invalid refresh token',
                    errors: ['Token expired or invalid'],
                    timestamp: new Date().toISOString(),
                };
            }

            // Generate new tokens
            const newToken = `mock_token_${user.id}_${Date.now()}`;
            const newRefreshToken = `mock_refresh_${user.id}_${Date.now()}`;

            const response: LoginResponse = {
                token: newToken,
                refreshToken: newRefreshToken,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                },
                expiresIn: 3600,
            };

            return {
                success: true,
                data: response,
                message: 'Token refreshed successfully',
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            return {
                success: false,
                data: null as any,
                message: 'Token refresh failed',
                errors: [error instanceof Error ? error.message : 'Unknown error'],
                timestamp: new Date().toISOString(),
            };
        }
    },

    /**
     * Verify Token
     * GET /api/auth/verify
     */
    verifyToken: async (token: string): Promise<ApiResponse<boolean>> => {
        await delay(API_DELAY);

        try {
            // Mock token validation
            const isValid = token.startsWith('mock_token_');

            return {
                success: true,
                data: isValid,
                message: isValid ? 'Token is valid' : 'Token is invalid',
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            return {
                success: false,
                data: false,
                message: 'Token verification failed',
                errors: [error instanceof Error ? error.message : 'Unknown error'],
                timestamp: new Date().toISOString(),
            };
        }
    },

    /**
     * Change Password
     * POST /api/auth/change-password
     */
    changePassword: async (
        userId: string,
        oldPassword: string,
        newPassword: string
    ): Promise<ApiResponse<null>> => {
        await delay(API_DELAY);

        try {
            const user = mockUsers.find(u => u.id === userId);

            if (!user) {
                return {
                    success: false,
                    data: null,
                    message: 'User not found',
                    errors: ['Invalid user ID'],
                    timestamp: new Date().toISOString(),
                };
            }

            // For demo: password change always succeeds
            return {
                success: true,
                data: null,
                message: 'Password changed successfully',
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            return {
                success: false,
                data: null,
                message: 'Password change failed',
                errors: [error instanceof Error ? error.message : 'Unknown error'],
                timestamp: new Date().toISOString(),
            };
        }
    },
};

export default dummyAuthApi;
