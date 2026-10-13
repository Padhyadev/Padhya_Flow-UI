import { ApiResponse } from '../types/apiTypes';
import { logError } from '../../utils/logError';

const API_BASE_URL = 'https://aj.padhyasoft.com/api';
// const API_BASE_URL = 'https://localhost:7087/api';

export interface Role {
    id: string;
    name: string;
    selectedMenu: string; // Can be comma-separated for multiple menus
    createdBy: number;
    lastModifiedBy: number;
    createdAt?: string;
    updatedAt?: string;
    menuName?: string; // For display purposes
    selectedMenus?: string[]; // Array of selected menu IDs for multi-select
}

export interface CreateRoleRequest {
    name: string;
    selectedMenu: string;
    createdBy: number;
    lastModifiedBy: number;
}

export interface UpdateRoleRequest {
    id: number;
    name: string;
    selectedMenu: string;
    createdBy: number;
    lastModifiedBy: number;
}

export interface MenuDropdownItem {
    id: string;
    name: string;
}

/**
 * Get auth token from localStorage
 */
const getAuthToken = (): string | null => {
    return localStorage.getItem('admin_token');
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
 * Handle API response and check for authentication errors
 */
const handleApiResponse = async (response: Response) => {
    if (response.status === 401) {
        localStorage.removeItem('admin_user');
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_refresh_token');
        window.location.href = '/admin/login';
        throw new Error('Authentication required');
    }

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}`);
    }

    return response.json();
};

/**
 * Role API Service
 */
export const roleApi = {
    /**
     * Get all roles with pagination
     * GET /api/Role/GetAllpage?start=0&length=100&sortColumnDir=asc
     */
    getAllRolesPage: async (start: number = 0, length: number = 100, sortColumnDir: string = 'asc'): Promise<ApiResponse<Role[]>> => {
        try {
            const token = getAuthToken();
            if (!token) {
                console.error('🔥 ROLE API: No authentication token found');
                throw new Error('No authentication token found');
            }

            console.log('🔥 ROLE API: Fetching roles with pagination');
            console.log('🔥 ROLE API: Parameters:', { start, length, sortColumnDir });
            console.log('🔥 ROLE API: Full URL:', `${API_BASE_URL}/Role/GetAllpage?start=${start}&length=${length}&sortColumnDir=${sortColumnDir}`);

            const headers = createAuthHeaders();
            console.log('🔥 ROLE API: Request headers:', headers);

            const response = await fetch(
                `${API_BASE_URL}/Role/GetAllpage?start=${start}&length=${length}&sortColumnDir=${sortColumnDir}`,
                {
                    method: 'GET',
                    headers: headers,
                }
            );

            console.log('🔥 ROLE API: Response status:', response.status);
            console.log('🔥 ROLE API: Response ok:', response.ok);

            // Get raw response text first for debugging
            const responseText = await response.text();
            console.log('🔥 ROLE API: Raw response text:', responseText);

            // Parse JSON
            let data;
            try {
                data = responseText ? JSON.parse(responseText) : {};
            } catch (parseError) {
                console.error('🔥 ROLE API: Failed to parse JSON response:', parseError);
                throw new Error('Invalid JSON response from server');
            }

            console.log('🔥 ROLE API: Parsed response data:', data);

            // Check for authentication error
            if (response.status === 401) {
                console.error('🔥 ROLE API: Authentication failed - token expired or invalid');
                localStorage.removeItem('admin_user');
                localStorage.removeItem('admin_token');
                localStorage.removeItem('admin_refresh_token');
                window.location.href = '/admin/login';
                throw new Error('Authentication required. Please login again.');
            }

            if (!response.ok) {
                const errorMessage = data?.message || data?.Message || `HTTP ${response.status}: ${response.statusText}`;
                console.error('🔥 ROLE API: API error:', errorMessage);
                throw new Error(errorMessage);
            }

            // Handle different possible response formats
            let rolesArray: any[] = [];

            console.log('🔥 ROLE API: Analyzing response structure...');

            if (Array.isArray(data)) {
                console.log('🔥 ROLE API: Response is direct array');
                rolesArray = data;
            } else if (data && Array.isArray(data.data)) {
                console.log('🔥 ROLE API: Response has data array at data.data');
                rolesArray = data.data;
            } else if (data && data.data && Array.isArray(data.data.data)) {
                console.log('🔥 ROLE API: Response has data array at data.data.data');
                rolesArray = data.data.data;
            } else if (data && Array.isArray(data.roles)) {
                console.log('🔥 ROLE API: Response has data array at data.roles');
                rolesArray = data.roles;
            } else if (data && Array.isArray(data.Roles)) {
                console.log('🔥 ROLE API: Response has data array at data.Roles');
                rolesArray = data.Roles;
            } else {
                console.log('🔥 ROLE API: Unknown response format, trying to extract array...');
                console.log('🔥 ROLE API: Full response structure:', JSON.stringify(data, null, 2));

                // Try to find any array in the response
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
                console.log('🔥 ROLE API: Found array with length:', rolesArray.length);
            }

            console.log('🔥 ROLE API: Extracted roles array length:', rolesArray.length);
            console.log('🔥 ROLE API: First role sample:', rolesArray[0]);

            // Map API response to our Role format
            const roles: Role[] = rolesArray.map((apiRole: any, index: number) => {
                console.log(`🔥 ROLE API: Mapping role ${index + 1}:`, apiRole);

                const mappedRole: Role = {
                    id: String(apiRole.id || apiRole.Id || apiRole.roleId || apiRole.RoleId || index),
                    name: apiRole.name || apiRole.Name || apiRole.roleName || apiRole.RoleName || 'Unknown Role',
                    selectedMenu: apiRole.selectedMenu || apiRole.SelectedMenu || apiRole.menuId || apiRole.MenuId || '',
                    createdBy: apiRole.createdBy || apiRole.CreatedBy || 0,
                    lastModifiedBy: apiRole.lastModifiedBy || apiRole.LastModifiedBy || 0,
                    createdAt: apiRole.createdDate || apiRole.CreatedDate || apiRole.createdAt || apiRole.CreatedAt || new Date().toISOString(),
                    updatedAt: apiRole.updatedDate || apiRole.UpdatedDate || apiRole.updatedAt || apiRole.UpdatedAt || new Date().toISOString(),
                    menuName: apiRole.menuName || apiRole.MenuName || '', // For display
                };

                console.log(`🔥 ROLE API: Mapped role ${index + 1}:`, mappedRole);
                return mappedRole;
            });

            console.log('🔥 ROLE API: Final mapped roles count:', roles.length);
            console.log('🔥 ROLE API: Final roles array:', roles);

            return {
                success: true,
                data: roles,
                message: `Successfully retrieved ${roles.length} roles`,
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            console.error('🔥 ROLE API: Get Roles Page API Error:', error);

            await logError({
                controllerName: 'RoleApi',
                methodName: 'Get',
                requestUrl: `${API_BASE_URL}/Role/GetAllpage?start=${start}&length=${length}&sortColumnDir=${sortColumnDir}`,
                requestPayload: { start, length, sortColumnDir },
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

    /**
     * Add New Role
     * POST /api/Role/Add
     */
    addRole: async (roleData: CreateRoleRequest): Promise<ApiResponse<Role>> => {
        try {
            const token = getAuthToken();
            if (!token) {
                throw new Error('No authentication token found');
            }

            const userId = getUserId();
            const headers = createAuthHeaders();

            const requestBody = {
                name: roleData.name,
                selectedMenu: roleData.selectedMenu,
                createdBy: userId,
                lastModifiedBy: userId,
            };

            console.log('🔥 ROLE API: Adding role with token:', token.substring(0, 20) + '...');
            console.log('🔥 ROLE API: Request headers:', headers);
            console.log('🔥 ROLE API: Request body:', requestBody);
            console.log('🔥 ROLE API: Full URL:', `${API_BASE_URL}/Role/Add`);

            const response = await fetch(
                `${API_BASE_URL}/Role/Add`,
                {
                    method: 'POST',
                    headers: headers,
                    body: JSON.stringify(requestBody),
                }
            );

            console.log('🔥 ROLE API: Add role response status:', response.status);
            console.log('🔥 ROLE API: Add role response ok:', response.ok);

            // Check if response has content
            const contentType = response.headers.get('content-type');
            console.log('🔥 ROLE API: Response content-type:', contentType);

            let data;
            if (response.status === 204 || !contentType || !contentType.includes('application/json')) {
                console.log('🔥 ROLE API: Response has no JSON content');
                data = {};
            } else {
                const responseText = await response.text();
                console.log('🔥 ROLE API: Add role raw response text:', responseText);

                try {
                    data = responseText ? JSON.parse(responseText) : {};
                } catch (e) {
                    console.error('🔥 ROLE API: Failed to parse response:', e);
                    data = {};
                }
            }

            console.log('🔥 ROLE API: Add role response data:', data);

            // Check for authentication error
            if (response.status === 401) {
                console.error('🔥 ROLE API: Authentication failed - token expired or invalid');
                localStorage.removeItem('admin_user');
                localStorage.removeItem('admin_token');
                localStorage.removeItem('admin_refresh_token');
                window.location.href = '/admin/login';
                throw new Error('Authentication required. Please login again.');
            }

            // Check if response indicates success
            const isSuccess = response.ok && (response.status === 200 || response.status === 201 || response.status === 204);

            if (!isSuccess) {
                throw new Error(data.message || `Failed to add role (Status: ${response.status})`);
            }

            // Extract role data from response or create from request
            let role: Role;
            const actualData = data.data || data;

            if (actualData && actualData.id) {
                // Backend returned role data
                console.log('🔥 ROLE API: Backend returned role data');
                role = {
                    id: String(actualData.id || actualData.Id),
                    name: actualData.name || actualData.Name || roleData.name,
                    selectedMenu: actualData.selectedMenu || actualData.SelectedMenu || roleData.selectedMenu,
                    createdBy: actualData.createdBy || actualData.CreatedBy || userId,
                    lastModifiedBy: actualData.lastModifiedBy || actualData.LastModifiedBy || userId,
                    createdAt: actualData.createdDate || actualData.CreatedDate || new Date().toISOString(),
                    updatedAt: actualData.updatedDate || actualData.UpdatedDate || new Date().toISOString(),
                    menuName: actualData.menuName || actualData.MenuName || '',
                };
            } else {
                // Backend returned empty - create from request data
                console.log('🔥 ROLE API: Backend returned empty, creating role from request data');
                role = {
                    id: String(Date.now()), // Generate temporary ID
                    name: roleData.name,
                    selectedMenu: roleData.selectedMenu,
                    createdBy: userId,
                    lastModifiedBy: userId,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    menuName: '',
                };
            }

            console.log('🔥 ROLE API: Final role object:', role);

            return {
                success: true,
                data: role,
                message: 'Role created successfully',
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            console.error('Add Role API Error:', error);

            await logError({
                controllerName: 'RoleApi',
                methodName: 'Add',
                requestUrl: `${API_BASE_URL}/Role/Add`,
                requestPayload: roleData,
                error
            });

            return {
                success: false,
                data: null as any,
                message: error instanceof Error ? error.message : 'Failed to create role',
                timestamp: new Date().toISOString(),
            };
        }
    },

    /**
     * Get Role By ID
     * GET /api/Role/GetById?id={id}
     */
    getRoleById: async (id: string): Promise<ApiResponse<Role>> => {
        try {
            const token = getAuthToken();
            if (!token) {
                throw new Error('No authentication token found');
            }

            console.log('🔥 ROLE API: Getting role by ID:', id);

            const response = await fetch(
                `${API_BASE_URL}/Role/GetById?id=${id}`,
                {
                    method: 'GET',
                    headers: createAuthHeaders(),
                }
            );

            const data = await handleApiResponse(response);
            console.log('🔥 ROLE API: GetById response:', data);

            const actualData = data.data || data;

            const role: Role = {
                id: String(actualData.id || actualData.Id || id),
                name: actualData.name || actualData.Name || '',
                selectedMenu: actualData.selectedMenu || actualData.SelectedMenu || '',
                createdBy: actualData.createdBy || actualData.CreatedBy || 0,
                lastModifiedBy: actualData.lastModifiedBy || actualData.LastModifiedBy || 0,
                createdAt: actualData.createdDate || actualData.CreatedDate || new Date().toISOString(),
                updatedAt: actualData.updatedDate || actualData.UpdatedDate || new Date().toISOString(),
                menuName: actualData.menuName || actualData.MenuName || '',
            };

            return {
                success: true,
                data: role,
                message: 'Role retrieved successfully',
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            console.error('Get Role By ID API Error:', error);

            await logError({
                controllerName: 'RoleApi',
                methodName: 'GetById',
                requestUrl: `${API_BASE_URL}/Role/GetById?id=${id}`,
                requestPayload: { id },
                error
            });

            return {
                success: false,
                data: null as any,
                message: error instanceof Error ? error.message : 'Failed to retrieve role',
                timestamp: new Date().toISOString(),
            };
        }
    },

    /**
     * Update Role
     * PUT /api/Role/Update
     */
    updateRole: async (id: string, roleData: Partial<CreateRoleRequest>): Promise<ApiResponse<Role>> => {
        try {
            const token = getAuthToken();
            if (!token) {
                throw new Error('No authentication token found');
            }

            const userId = getUserId();

            const requestBody = {
                id: parseInt(id),
                name: roleData.name,
                selectedMenu: roleData.selectedMenu,
                createdBy: roleData.createdBy || userId,
                lastModifiedBy: userId,
            };

            console.log('🔥 ROLE API: Updating role:', requestBody);

            const response = await fetch(
                `${API_BASE_URL}/Role/Add`,
                {
                    method: 'POST',
                    headers: createAuthHeaders(),
                    body: JSON.stringify(requestBody),
                }
            );

            const data = await handleApiResponse(response);
            console.log('🔥 ROLE API: Update role response:', data);

            const actualData = data.data || data;

            const role: Role = {
                id: String(actualData.id || actualData.Id || id),
                name: actualData.name || actualData.Name || roleData.name || '',
                selectedMenu: actualData.selectedMenu || actualData.SelectedMenu || roleData.selectedMenu || '',
                createdBy: actualData.createdBy || actualData.CreatedBy || userId,
                lastModifiedBy: actualData.lastModifiedBy || actualData.LastModifiedBy || userId,
                createdAt: actualData.createdDate || actualData.CreatedDate || new Date().toISOString(),
                updatedAt: actualData.updatedDate || actualData.UpdatedDate || new Date().toISOString(),
                menuName: actualData.menuName || actualData.MenuName || '',
            };

            return {
                success: true,
                data: role,
                message: 'Role updated successfully',
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            console.error('Update Role API Error:', error);

            await logError({
                controllerName: 'RoleApi',
                methodName: 'Update',
                requestUrl: `${API_BASE_URL}/Role/Add`,
                requestPayload: { id, ...roleData },
                error
            });

            return {
                success: false,
                data: null as any,
                message: error instanceof Error ? error.message : 'Failed to update role',
                timestamp: new Date().toISOString(),
            };
        }
    },

    /**
     * Delete Role
     * DELETE /api/Role/Delete?id={id}
     */
    deleteRole: async (id: string): Promise<ApiResponse<null>> => {
        try {
            const token = getAuthToken();
            if (!token) {
                throw new Error('No authentication token found');
            }

            console.log('🔥 ROLE API: Deleting role ID:', id);

            const response = await fetch(
                `${API_BASE_URL}/Role/Delete?id=${id}`,
                {
                    method: 'DELETE',
                    headers: createAuthHeaders(),
                }
            );

            await handleApiResponse(response);

            return {
                success: true,
                data: null,
                message: 'Role deleted successfully',
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            console.error('Delete Role API Error:', error);

            await logError({
                controllerName: 'RoleApi',
                methodName: 'Delete',
                requestUrl: `${API_BASE_URL}/Role/Delete?id=${id}`,
                requestPayload: { id },
                error
            });

            return {
                success: false,
                data: null,
                message: error instanceof Error ? error.message : 'Failed to delete role',
                timestamp: new Date().toISOString(),
            };
        }
    },

    /**
     * Get Menu Dropdown List
     * GET /api/Dropdown/MenuList
     */
    getMenuDropdown: async (): Promise<ApiResponse<MenuDropdownItem[]>> => {
        try {
            const token = getAuthToken();
            if (!token) {
                throw new Error('No authentication token found');
            }

            console.log('🔥 ROLE API: Fetching menu dropdown');

            const response = await fetch(
                `${API_BASE_URL}/Dropdown/MenuList`,
                {
                    method: 'GET',
                    headers: createAuthHeaders(),
                }
            );

            const data = await handleApiResponse(response);
            console.log('🔥 ROLE API: Menu dropdown response:', data);

            // Handle different possible response formats
            let menuArray: any[] = [];

            if (Array.isArray(data)) {
                menuArray = data;
            } else if (data && Array.isArray(data.data)) {
                menuArray = data.data;
            } else if (data && data.data && Array.isArray(data.data.data)) {
                menuArray = data.data.data;
            } else {
                console.log('🔥 ROLE API: Unknown menu response format:', data);
                menuArray = [];
            }

            // Map to MenuDropdownItem format
            const menus: MenuDropdownItem[] = menuArray.map((menu: any) => ({
                id: String(menu.id || menu.Id || menu.value || menu.Value || ''),
                name: menu.name || menu.Name || menu.text || menu.Text || menu.label || menu.Label || 'Unknown Menu',
            }));

            console.log('🔥 ROLE API: Mapped menus:', menus);

            return {
                success: true,
                data: menus,
                message: `Successfully retrieved ${menus.length} menus`,
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            console.error('Get Menu Dropdown API Error:', error);

            await logError({
                controllerName: 'RoleApi',
                methodName: 'GetMenuDropdown',
                requestUrl: `${API_BASE_URL}/Dropdown/MenuList`,
                requestPayload: null,
                error
            });

            return {
                success: false,
                data: [],
                message: error instanceof Error ? error.message : 'Failed to fetch menu dropdown',
                timestamp: new Date().toISOString(),
            };
        }
    },
};

export default roleApi;