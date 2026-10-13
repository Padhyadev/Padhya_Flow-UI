import { ApiResponse } from '../types/apiTypes';
import { logError } from '../../utils/logError';

// const API_BASE_URL = 'https://localhost:7087/api';
const API_BASE_URL = 'https://aj.padhyasoft.com/api';
export interface User {
    id: string;
    userName: string;
    password?: string; // Password field for edit mode
    email: string;
    mobileNumber: string;
    roleId: number;
    createdBy: number;
    lastModifiedBy: number;
    createdAt?: string;
    updatedAt?: string;
    roleName?: string; // For display purposes
}

export interface CreateUserRequest {
    userName: string;
    password: string;
    email: string;
    mobileNumber: string;
    roleId: number;
    createdBy?: number; // Optional - will be set automatically
    lastModifiedBy?: number; // Optional - will be set automatically
}

export interface UpdateUserRequest {
    id: number;
    userName: string;
    password?: string;
    email: string;
    mobileNumber: string;
    roleId: number;
    lastModifiedBy: number;
}

export interface RoleDropdownItem {
    id: number;
    name: string;
}

/**
 * Get auth token from localStorage
 */
const getAuthToken = (): string | null => {
    return localStorage.getItem('admin_token');
    // return 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9uYW1laWRlbnRpZmllciI6IjYiLCJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9uYW1lIjoiYWRtaW4iLCJleHAiOjE3NjQ4MzE2MDEsImlzcyI6IkJyb2tlciIsImF1ZCI6IkJyb2tlckFQSVVzZXJzIn0.wLyH69QP9PIIFUtWFwSZtD_c0nQbaXRSuIvyPrDTFEQ';
};

/**
 * Get user ID from localStorage admin_user
 */
const getUserId = (): number => {
    const adminUser = localStorage.getItem('admin_user');
    if (adminUser) {
        try {
            const user = JSON.parse(adminUser);
            return parseInt(user.id) || 0;
        } catch {
            return 0;
        }
    }
    return 0;
};

/**
 * Create headers with authorization token
 */
const createAuthHeaders = (): HeadersInit => {
    const token = getAuthToken();
    return {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
    };
};

/**
 * User API Service
 */
export const userApi = {
    /**
     * Get all users with pagination
     * GET /api/User/GetAllpage?start=0&length=150&sortColumnDir=asc
     */
    getAllUsersPage: async (start: number = 0, length: number = 150, sortColumnDir: string = 'asc'): Promise<ApiResponse<User[]>> => {
        try {
            const token = getAuthToken();
            if (!token) {
                throw new Error('No authentication token found');
            }

            const response = await fetch(
                `${API_BASE_URL}/User/GetAllpage?start=${start}&length=${length}&sortColumnDir=${sortColumnDir}`,
                {
                    method: 'GET',
                    headers: createAuthHeaders(),
                }
            );

            const responseText = await response.text();
            let data;
            try {
                data = responseText ? JSON.parse(responseText) : {};
            } catch (parseError) {
                throw new Error('Invalid JSON response from server');
            }

            if (!response.ok) {
                throw new Error(data.message || `HTTP ${response.status}: ${response.statusText}`);
            }

            // Handle different possible response formats
            let usersArray: any[] = [];

            if (Array.isArray(data)) {
                usersArray = data;
            } else if (data && Array.isArray(data.data)) {
                usersArray = data.data;
            } else if (data && data.data && Array.isArray(data.data.data)) {
                usersArray = data.data.data;
            } else {
                const findArray = (obj: any): any[] => {
                    if (Array.isArray(obj)) return obj;
                    if (typeof obj === 'object' && obj !== null) {
                        for (const key in obj) {
                            const result = findArray(obj[key]);
                            if (result.length > 0) return result;
                        }
                    }
                    return [];
                };
                usersArray = findArray(data);
            }

            // Map API response to our User format
            const users: User[] = usersArray.map((apiUser: any, index: number) => ({
                id: String(apiUser.id || apiUser.Id || apiUser.userId || apiUser.UserId || index),
                userName: apiUser.userName || apiUser.UserName || apiUser.name || apiUser.Name || 'Unknown User',
                password: apiUser.password || apiUser.Password || '', // Include password for edit mode
                email: apiUser.email || apiUser.Email || '',
                mobileNumber: apiUser.mobileNumber || apiUser.MobileNumber || apiUser.mobile || apiUser.Mobile || '',
                roleId: apiUser.roleId || apiUser.RoleId || 0,
                createdBy: apiUser.createdBy || apiUser.CreatedBy || 0,
                lastModifiedBy: apiUser.lastModifiedBy || apiUser.LastModifiedBy || 0,
                createdAt: apiUser.createdDate || apiUser.CreatedDate || apiUser.createdAt || apiUser.CreatedAt || new Date().toISOString(),
                updatedAt: apiUser.updatedDate || apiUser.UpdatedDate || apiUser.updatedAt || apiUser.UpdatedAt || new Date().toISOString(),
                roleName: apiUser.roleName || apiUser.RoleName || '',
            }));

            return {
                success: true,
                data: users,
                message: `Successfully retrieved ${users.length} users`,
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            console.error('Get Users API Error:', error);

            await logError({
                controllerName: 'UserApi',
                methodName: 'Get',
                requestUrl: `${API_BASE_URL}/User/GetAllpage?start=${start}&length=${length}&sortColumnDir=${sortColumnDir}`,
                requestPayload: { start, length, sortColumnDir },
                error
            });

            return {
                success: false,
                data: [],
                message: error instanceof Error ? error.message : 'Failed to fetch users',
                timestamp: new Date().toISOString(),
            };
        }
    },

    /**
     * Add New User
     * POST /api/User/Add
     */
    addUser: async (userData: CreateUserRequest): Promise<ApiResponse<User>> => {
        try {
            const token = getAuthToken();
            if (!token) {
                throw new Error('No authentication token found');
            }

            const userId = getUserId();
            const requestBody = {
                userName: userData.userName,
                password: userData.password,
                email: userData.email,
                mobileNumber: userData.mobileNumber,
                roleId: userData.roleId,
                createdBy: userData.createdBy || userId, // Use provided value or current user ID
                lastModifiedBy: userData.lastModifiedBy || userId, // Use provided value or current user ID
            };

            const response = await fetch(
                `${API_BASE_URL}/User/Add`,
                {
                    method: 'POST',
                    headers: createAuthHeaders(),
                    body: JSON.stringify(requestBody),
                }
            );

            let data;
            if (response.status === 204 || !response.headers.get('content-type')?.includes('application/json')) {
                data = {};
            } else {
                const responseText = await response.text();
                try {
                    data = responseText ? JSON.parse(responseText) : {};
                } catch (e) {
                    data = {};
                }
            }

            if (!response.ok) {
                throw new Error(data.message || `Failed to add user (Status: ${response.status})`);
            }

            // Extract user data from response or create from request
            let user: User;
            const actualData = data.data || data;

            if (actualData && actualData.id) {
                user = {
                    id: String(actualData.id || actualData.Id),
                    userName: actualData.userName || actualData.UserName || userData.userName,
                    email: actualData.email || actualData.Email || userData.email,
                    mobileNumber: actualData.mobileNumber || actualData.MobileNumber || userData.mobileNumber,
                    roleId: actualData.roleId || actualData.RoleId || userData.roleId,
                    createdBy: actualData.createdBy || actualData.CreatedBy || userId,
                    lastModifiedBy: actualData.lastModifiedBy || actualData.LastModifiedBy || userId,
                    createdAt: actualData.createdDate || actualData.CreatedDate || new Date().toISOString(),
                    updatedAt: actualData.updatedDate || actualData.UpdatedDate || new Date().toISOString(),
                    roleName: actualData.roleName || actualData.RoleName || '',
                };
            } else {
                user = {
                    id: String(Date.now()),
                    userName: userData.userName,
                    email: userData.email,
                    mobileNumber: userData.mobileNumber,
                    roleId: userData.roleId,
                    createdBy: userId,
                    lastModifiedBy: userId,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    roleName: '',
                };
            }

            return {
                success: true,
                data: user,
                message: 'User created successfully',
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            console.error('Add User API Error:', error);

            await logError({
                controllerName: 'UserApi',
                methodName: 'Add',
                requestUrl: `${API_BASE_URL}/User/Add`,
                requestPayload: userData,
                error
            });

            return {
                success: false,
                data: null as any,
                message: error instanceof Error ? error.message : 'Failed to create user',
                timestamp: new Date().toISOString(),
            };
        }
    },

    /**
     * Get User By ID
     * GET /api/User/GetById?id={id}
     */
    getUserById: async (id: string): Promise<ApiResponse<User>> => {
        try {
            const token = getAuthToken();
            if (!token) {
                throw new Error('No authentication token found');
            }

            const response = await fetch(
                `${API_BASE_URL}/User/GetById?id=${id}`,
                {
                    method: 'GET',
                    headers: createAuthHeaders(),
                }
            );

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            const actualData = data.data || data;

            const user: User = {
                id: String(actualData.id || actualData.Id || id),
                userName: actualData.userName || actualData.UserName || '',
                password: actualData.password || actualData.Password || '', // Include password for edit mode
                email: actualData.email || actualData.Email || '',
                mobileNumber: actualData.mobileNumber || actualData.MobileNumber || '',
                roleId: actualData.roleId || actualData.RoleId || 0,
                createdBy: actualData.createdBy || actualData.CreatedBy || 0,
                lastModifiedBy: actualData.lastModifiedBy || actualData.LastModifiedBy || 0,
                createdAt: actualData.createdDate || actualData.CreatedDate || new Date().toISOString(),
                updatedAt: actualData.updatedDate || actualData.UpdatedDate || new Date().toISOString(),
                roleName: actualData.roleName || actualData.RoleName || '',
            };

            return {
                success: true,
                data: user,
                message: 'User retrieved successfully',
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            console.error('Get User By ID API Error:', error);

            await logError({
                controllerName: 'UserApi',
                methodName: 'GetById',
                requestUrl: `${API_BASE_URL}/User/GetById?id=${id}`,
                requestPayload: { id },
                error
            });

            return {
                success: false,
                data: null as any,
                message: error instanceof Error ? error.message : 'Failed to retrieve user',
                timestamp: new Date().toISOString(),
            };
        }
    },

    /**
     * Update User
     * PUT /api/User/Update
     */
    updateUser: async (id: string, userData: { userName: string; password?: string; email: string; mobileNumber: string; roleId: number }): Promise<ApiResponse<User>> => {
        try {
            const token = getAuthToken();
            if (!token) {
                throw new Error('No authentication token found');
            }

            const userId = getUserId();

            const requestBody: UpdateUserRequest = {
                id: parseInt(id),
                userName: userData.userName,
                email: userData.email,
                mobileNumber: userData.mobileNumber,
                roleId: userData.roleId,
                lastModifiedBy: userId,
            };

            if (userData.password && userData.password.trim()) {
                requestBody.password = userData.password;
            }


            const response = await fetch(
                `${API_BASE_URL}/User/Add`,
                {
                    method: 'POST',
                    headers: createAuthHeaders(),
                    body: JSON.stringify(requestBody),
                }
            );

            let data;
            if (response.status === 204) {
                data = {};
            } else {
                data = await response.json();
            }

            if (!response.ok) {
                throw new Error(data.message || `HTTP ${response.status}: ${response.statusText}`);
            }

            const actualData = data.data || data;

            const user: User = {
                id: String(actualData.id || actualData.Id || id),
                userName: actualData.userName || actualData.UserName || userData.userName,
                email: actualData.email || actualData.Email || userData.email,
                mobileNumber: actualData.mobileNumber || actualData.MobileNumber || userData.mobileNumber,
                roleId: actualData.roleId || actualData.RoleId || userData.roleId,
                createdBy: actualData.createdBy || actualData.CreatedBy || 0,
                lastModifiedBy: actualData.lastModifiedBy || actualData.LastModifiedBy || userId,
                createdAt: actualData.createdDate || actualData.CreatedDate || new Date().toISOString(),
                updatedAt: actualData.updatedDate || actualData.UpdatedDate || new Date().toISOString(),
                roleName: actualData.roleName || actualData.RoleName || '',
            };

            return {
                success: true,
                data: user,
                message: 'User updated successfully',
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            console.error('Update User API Error:', error);

            await logError({
                controllerName: 'UserApi',
                methodName: 'Update',
                requestUrl: `${API_BASE_URL}/User/Add`,
                requestPayload: { id, ...userData },
                error
            });

            return {
                success: false,
                data: null as any,
                message: error instanceof Error ? error.message : 'Failed to update user',
                timestamp: new Date().toISOString(),
            };
        }
    },

    /**
     * Delete User
     * DELETE /api/User/Delete?id={id}
     */
    deleteUser: async (id: string): Promise<ApiResponse<null>> => {
        try {
            const token = getAuthToken();
            if (!token) {
                throw new Error('No authentication token found');
            }

            const response = await fetch(
                `${API_BASE_URL}/User/Delete?id=${id}`,
                {
                    method: 'DELETE',
                    headers: createAuthHeaders(),
                }
            );

            if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                throw new Error(data.message || `HTTP ${response.status}: ${response.statusText}`);
            }

            return {
                success: true,
                data: null,
                message: 'User deleted successfully',
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            console.error('Delete User API Error:', error);

            await logError({
                controllerName: 'UserApi',
                methodName: 'Delete',
                requestUrl: `${API_BASE_URL}/User/Delete?id=${id}`,
                requestPayload: { id },
                error
            });

            return {
                success: false,
                data: null,
                message: error instanceof Error ? error.message : 'Failed to delete user',
                timestamp: new Date().toISOString(),
            };
        }
    },

    /**
     * Get Role Dropdown List
     * GET /api/Dropdown/RoleName
     */
    getRoleDropdown: async (): Promise<ApiResponse<RoleDropdownItem[]>> => {
        try {
            const token = getAuthToken();
            if (!token) {
                throw new Error('No authentication token found');
            }

            console.log('🔥 USER API: Fetching role dropdown from', `${API_BASE_URL}/Dropdown/RoleName`);

            const response = await fetch(
                `${API_BASE_URL}/Dropdown/RoleName`,
                {
                    method: 'GET',
                    headers: createAuthHeaders(),
                }
            );

            const data = await response.json();
            console.log('🔥 USER API: Role dropdown response data:', data);

            if (!response.ok) {
                throw new Error(data.message || `HTTP ${response.status}: ${response.statusText}`);
            }

            // Handle different possible response formats
            let rolesArray: any[] = [];

            if (Array.isArray(data)) {
                rolesArray = data;
            } else if (data && Array.isArray(data.data)) {
                rolesArray = data.data;
            } else if (data && Array.isArray(data.roles)) {
                rolesArray = data.roles;
            } else {
                const findArray = (obj: any): any[] => {
                    if (Array.isArray(obj)) return obj;
                    if (typeof obj === 'object' && obj !== null) {
                        for (const key in obj) {
                            const result = findArray(obj[key]);
                            if (result.length > 0) return result;
                        }
                    }
                    return [];
                };
                rolesArray = findArray(data);
            }

            // Map to RoleDropdownItem format
            const roles: RoleDropdownItem[] = rolesArray.map((apiRole: any) => ({
                id: apiRole.id || apiRole.Id || apiRole.roleId || apiRole.RoleId || 0,
                name: apiRole.name || apiRole.Name || apiRole.roleName || apiRole.RoleName || 'Unknown Role',
            }));

            return {
                success: true,
                data: roles,
                message: `Successfully retrieved ${roles.length} roles`,
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            console.error('Get Role Dropdown API Error:', error);

            await logError({
                controllerName: 'UserApi',
                methodName: 'GetRoleDropdown',
                requestUrl: `${API_BASE_URL}/Dropdown/RoleName`,
                requestPayload: null,
                error
            });

            return {
                success: false,
                data: [],
                message: error instanceof Error ? error.message : 'Failed to fetch roles',
                timestamp: new Date().toISOString(),
            };
        }
    },
};

export default userApi;
