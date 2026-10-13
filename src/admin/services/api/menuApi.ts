import { ApiResponse } from '../types/apiTypes';
import { logError } from '../../utils/logError';

const API_BASE_URL = 'https://aj.padhyasoft.com/api';
// const API_BASE_URL = 'https://localhost:7087/api';


export interface Menu {
    id: string;
    parentId: number;
    area: string;
    controller: string;
    url: string;
    name: string;
    icon: string;
    displayOrder: number;
    createdBy: number;
    lastModifiedBy: number;
    createdAt?: string;
    updatedAt?: string;
}

export interface MenuParent {
    id: number;
    name: string;
}

export interface CreateMenuRequest {
    id: number;
    parentId: number;
    area: string;
    controller: string;
    url: string;
    name: string;
    icon: string;
    displayOrder: number;
    createdBy: number;
    lastModifiedBy: number;
}

export interface UpdateMenuRequest {
    id: number;
    parentId: number;
    area: string;
    controller: string;
    url: string;
    name: string;
    icon: string;
    displayOrder: number;
    lastModifiedBy: number;
}

/**
 * Get auth token from localStorage
 */
const getAuthToken = (): string | null => {
    return localStorage.getItem('admin_token');
};

/**
 * Get user ID from localStorage admin_user for createdBy/lastModifiedBy
 */
const getUserId = (): number => {
    const adminUser = localStorage.getItem('admin_user');
    if (adminUser) {
        try {
            const user = JSON.parse(adminUser);
            return parseInt(user.id || user.userId || '0');
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
 * Menu API Service
 */
export const menuApi = {
    /**
     * Get Menu Parent Name List for Dropdown
     * GET /api/Dropdown/MenuParentNameList
     */
    getMenuParentList: async (): Promise<ApiResponse<MenuParent[]>> => {
        try {
            const token = getAuthToken();
            if (!token) {
                console.error('🔥 MENU API: No authentication token found');
                throw new Error('No authentication token found');
            }

            console.log('🔥 MENU API: Fetching menu parent list');

            const response = await fetch(
                `${API_BASE_URL}/Dropdown/MenuParentNameList`,
                {
                    method: 'GET',
                    headers: createAuthHeaders(),
                }
            );

            console.log('🔥 MENU API: Parent list response status:', response.status);

            const responseText = await response.text();
            console.log('🔥 MENU API: Parent list raw response:', responseText);

            let data;
            try {
                data = responseText ? JSON.parse(responseText) : {};
            } catch (parseError) {
                console.error('🔥 MENU API: Failed to parse JSON:', parseError);
                throw new Error('Invalid JSON response from server');
            }

            if (response.status === 401) {
                localStorage.removeItem('admin_user');
                localStorage.removeItem('admin_token');
                localStorage.removeItem('admin_refresh_token');
                window.location.href = '/admin/login';
                throw new Error('Authentication required');
            }

            if (!response.ok) {
                throw new Error(data?.message || data?.Message || `HTTP ${response.status}`);
            }

            // Handle different response formats
            let parentsArray: any[] = [];

            if (Array.isArray(data)) {
                parentsArray = data;
            } else if (data && Array.isArray(data.data)) {
                parentsArray = data.data;
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
                parentsArray = findArray(data);
            }

            console.log('🔥 MENU API: Extracted parents count:', parentsArray.length);

            const parents: MenuParent[] = parentsArray.map((item: any) => ({
                id: item.id || item.Id || item.value || item.Value || 0,
                name: item.name || item.Name || item.text || item.Text || item.label || item.Label || '',
            }));

            // Add "No Parent" option at the beginning
            const parentsWithNoParent: MenuParent[] = [
                { id: 0, name: 'No Parent' },
                ...parents
            ];

            console.log('🔥 MENU API: Final parents with No Parent:', parentsWithNoParent);

            return {
                success: true,
                data: parentsWithNoParent,
                message: `Successfully retrieved ${parents.length} parent menus`,
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            console.error('🔥 MENU API: Error:', error);

            await logError({
                controllerName: 'MenuApi',
                methodName: 'GetMenuParentList',
                requestUrl: `${API_BASE_URL}/Dropdown/MenuParentNameList`,
                requestPayload: null,
                error
            });

            return {
                success: false,
                data: [{ id: 0, name: 'No Parent' }], // Return at least "No Parent" option on error
                message: error instanceof Error ? error.message : 'Failed to fetch parent menus',
                timestamp: new Date().toISOString(),
            };
        }
    },

    /**
     * Get all menus with pagination
     * GET /api/Menu/GetAllpage?start=0&length=100&sortColumnDir=asc
     */
    getAllMenusPage: async (start: number = 0, length: number = 100, sortColumnDir: string = 'asc'): Promise<ApiResponse<Menu[]>> => {
        try {
            const token = getAuthToken();
            if (!token) {
                console.error('🔥 MENU API: No authentication token found');
                throw new Error('No authentication token found');
            }

            console.log('🔥 MENU API: Fetching menus with pagination');
            console.log('🔥 MENU API: Parameters:', { start, length, sortColumnDir });

            const response = await fetch(
                `${API_BASE_URL}/Menu/GetAllpage?start=${start}&length=${length}&sortColumnDir=${sortColumnDir}`,
                {
                    method: 'GET',
                    headers: createAuthHeaders(),
                }
            );

            console.log('🔥 MENU API: Response status:', response.status);

            const responseText = await response.text();
            console.log('🔥 MENU API: Raw response:', responseText);

            let data;
            try {
                data = responseText ? JSON.parse(responseText) : {};
            } catch (parseError) {
                console.error('🔥 MENU API: Failed to parse JSON:', parseError);
                throw new Error('Invalid JSON response from server');
            }

            if (response.status === 401) {
                localStorage.removeItem('admin_user');
                localStorage.removeItem('admin_token');
                localStorage.removeItem('admin_refresh_token');
                window.location.href = '/admin/login';
                throw new Error('Authentication required');
            }

            if (!response.ok) {
                throw new Error(data?.message || data?.Message || `HTTP ${response.status}`);
            }

            // Handle different response formats
            let menusArray: any[] = [];

            if (Array.isArray(data)) {
                menusArray = data;
            } else if (data && Array.isArray(data.data)) {
                menusArray = data.data;
            } else if (data && data.data && Array.isArray(data.data.data)) {
                menusArray = data.data.data;
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
                menusArray = findArray(data);
            }

            console.log('🔥 MENU API: Extracted menus count:', menusArray.length);

            const menus: Menu[] = menusArray.map((item: any) => ({
                id: String(item.id || item.Id || item.menuId || item.MenuId),
                parentId: item.parentId || item.ParentId || 0,
                area: item.area || item.Area || '',
                controller: item.controller || item.Controller || '',
                url: item.url || item.Url || item.URL || '',
                name: item.name || item.Name || item.menuName || item.MenuName || '',
                icon: item.icon || item.Icon || '',
                displayOrder: item.displayOrder || item.DisplayOrder || 0,
                createdBy: item.createdBy || item.CreatedBy || 0,
                lastModifiedBy: item.lastModifiedBy || item.LastModifiedBy || 0,
                createdAt: item.createdDate || item.CreatedDate || item.createdAt || item.CreatedAt,
                updatedAt: item.updatedDate || item.UpdatedDate || item.updatedAt || item.UpdatedAt,
            }));

            console.log('🔥 MENU API: Final menus:', menus);

            return {
                success: true,
                data: menus,
                message: `Successfully retrieved ${menus.length} menus`,
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            console.error('🔥 MENU API: Error:', error);

            await logError({
                controllerName: 'MenuApi',
                methodName: 'Get',
                requestUrl: `${API_BASE_URL}/Menu/GetAllpage?start=${start}&length=${length}&sortColumnDir=${sortColumnDir}`,
                requestPayload: { start, length, sortColumnDir },
                error
            });

            return {
                success: false,
                data: [],
                message: error instanceof Error ? error.message : 'Failed to fetch menus',
                timestamp: new Date().toISOString(),
            };
        }
    },

    /**
     * Add New Menu
     * POST /api/Menu/Add
     */
    addMenu: async (menuData: Omit<CreateMenuRequest, 'id' | 'createdBy' | 'lastModifiedBy'>): Promise<ApiResponse<Menu>> => {
        try {
            const token = getAuthToken();
            if (!token) {
                throw new Error('No authentication token found');
            }

            const userId = getUserId();

            const requestBody: CreateMenuRequest = {
                id: 0, // Default ID for new menu
                ...menuData,
                createdBy: userId,
                lastModifiedBy: userId,
            };

            console.log('🔥 MENU API: Adding menu:', requestBody);

            const response = await fetch(
                `${API_BASE_URL}/Menu/Add`,
                {
                    method: 'POST',
                    headers: createAuthHeaders(),
                    body: JSON.stringify(requestBody),
                }
            );

            console.log('🔥 MENU API: Add response status:', response.status);

            const contentType = response.headers.get('content-type');
            let data;
            if (response.status === 204 || !contentType || !contentType.includes('application/json')) {
                data = {};
            } else {
                const responseText = await response.text();
                console.log('🔥 MENU API: Add response:', responseText);
                data = responseText ? JSON.parse(responseText) : {};
            }

            if (response.status === 401) {
                localStorage.removeItem('admin_user');
                localStorage.removeItem('admin_token');
                window.location.href = '/admin/login';
                throw new Error('Authentication required');
            }

            const isSuccess = response.ok && (response.status === 200 || response.status === 201 || response.status === 204);

            if (!isSuccess) {
                throw new Error(data.message || `Failed to add menu (Status: ${response.status})`);
            }

            const actualData = data.data || data;
            const menu: Menu = {
                id: String(actualData.id || actualData.Id || Date.now()),
                parentId: actualData.parentId || actualData.ParentId || menuData.parentId,
                area: actualData.area || actualData.Area || menuData.area,
                controller: actualData.controller || actualData.Controller || menuData.controller,
                url: actualData.url || actualData.Url || menuData.url,
                name: actualData.name || actualData.Name || menuData.name,
                icon: actualData.icon || actualData.Icon || menuData.icon,
                displayOrder: actualData.displayOrder || actualData.DisplayOrder || menuData.displayOrder,
                createdBy: actualData.createdBy || actualData.CreatedBy || userId,
                lastModifiedBy: actualData.lastModifiedBy || actualData.LastModifiedBy || userId,
                createdAt: actualData.createdDate || actualData.CreatedDate || new Date().toISOString(),
                updatedAt: actualData.updatedDate || actualData.UpdatedDate || new Date().toISOString(),
            };

            return {
                success: true,
                data: menu,
                message: 'Menu created successfully',
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            console.error('Add Menu API Error:', error);

            await logError({
                controllerName: 'MenuApi',
                methodName: 'Add',
                requestUrl: `${API_BASE_URL}/Menu/Add`,
                requestPayload: menuData,
                error
            });

            return {
                success: false,
                data: null as any,
                message: error instanceof Error ? error.message : 'Failed to create menu',
                timestamp: new Date().toISOString(),
            };
        }
    },

    /**
     * Get Menu By ID
     * GET /api/Menu/GetById?id={id}
     */
    getMenuById: async (id: string): Promise<ApiResponse<Menu>> => {
        try {
            const token = getAuthToken();
            if (!token) {
                throw new Error('No authentication token found');
            }

            console.log('🔥 MENU API: Getting menu by ID:', id);

            const response = await fetch(
                `${API_BASE_URL}/Menu/GetById?id=${id}`,
                {
                    method: 'GET',
                    headers: createAuthHeaders(),
                }
            );

            const responseText = await response.text();
            console.log('🔥 MENU API: GetById response:', responseText);

            let data = responseText ? JSON.parse(responseText) : {};

            if (response.status === 401) {
                localStorage.removeItem('admin_user');
                localStorage.removeItem('admin_token');
                window.location.href = '/admin/login';
                throw new Error('Authentication required');
            }

            if (!response.ok) {
                throw new Error(data?.message || data?.Message || `HTTP ${response.status}`);
            }

            const actualData = data.data || data;

            const menu: Menu = {
                id: String(actualData.id || actualData.Id || id),
                parentId: actualData.parentId || actualData.ParentId || 0,
                area: actualData.area || actualData.Area || '',
                controller: actualData.controller || actualData.Controller || '',
                url: actualData.url || actualData.Url || '',
                name: actualData.name || actualData.Name || '',
                icon: actualData.icon || actualData.Icon || '',
                displayOrder: actualData.displayOrder || actualData.DisplayOrder || 0,
                createdBy: actualData.createdBy || actualData.CreatedBy || 0,
                lastModifiedBy: actualData.lastModifiedBy || actualData.LastModifiedBy || 0,
                createdAt: actualData.createdDate || actualData.CreatedDate,
                updatedAt: actualData.updatedDate || actualData.UpdatedDate,
            };

            return {
                success: true,
                data: menu,
                message: 'Menu retrieved successfully',
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            console.error('Get Menu By ID API Error:', error);

            await logError({
                controllerName: 'MenuApi',
                methodName: 'GetById',
                requestUrl: `${API_BASE_URL}/Menu/GetById?id=${id}`,
                requestPayload: { id },
                error
            });

            return {
                success: false,
                data: null as any,
                message: error instanceof Error ? error.message : 'Failed to retrieve menu',
                timestamp: new Date().toISOString(),
            };
        }
    },

    /**
     * Update Menu
     * POST /api/Menu/Add (with id for update)
     */
    updateMenu: async (id: string, menuData: Omit<CreateMenuRequest, 'id' | 'createdBy' | 'lastModifiedBy'>): Promise<ApiResponse<Menu>> => {
        try {
            const token = getAuthToken();
            if (!token) {
                throw new Error('No authentication token found');
            }

            const userId = getUserId();

            const requestBody: UpdateMenuRequest = {
                id: parseInt(id),
                ...menuData,
                lastModifiedBy: userId,
            };

            console.log('🔥 MENU API: Updating menu:', requestBody);

            const response = await fetch(
                `${API_BASE_URL}/Menu/Add`,
                {
                    method: 'POST',
                    headers: createAuthHeaders(),
                    body: JSON.stringify(requestBody),
                }
            );

            console.log('🔥 MENU API: Update response status:', response.status);

            const responseText = await response.text();
            let data = responseText && response.status !== 204 ? JSON.parse(responseText) : {};

            if (response.status === 401) {
                localStorage.removeItem('admin_user');
                localStorage.removeItem('admin_token');
                window.location.href = '/admin/login';
                throw new Error('Authentication required');
            }

            if (!response.ok) {
                throw new Error(data?.message || data?.Message || `HTTP ${response.status}`);
            }

            const actualData = data.data || data;

            const menu: Menu = {
                id: String(actualData.id || actualData.Id || id),
                parentId: actualData.parentId || actualData.ParentId || menuData.parentId,
                area: actualData.area || actualData.Area || menuData.area,
                controller: actualData.controller || actualData.Controller || menuData.controller,
                url: actualData.url || actualData.Url || menuData.url,
                name: actualData.name || actualData.Name || menuData.name,
                icon: actualData.icon || actualData.Icon || menuData.icon,
                displayOrder: actualData.displayOrder || actualData.DisplayOrder || menuData.displayOrder,
                createdBy: actualData.createdBy || actualData.CreatedBy || 0,
                lastModifiedBy: actualData.lastModifiedBy || actualData.LastModifiedBy || userId,
                createdAt: actualData.createdDate || actualData.CreatedDate || new Date().toISOString(),
                updatedAt: actualData.updatedDate || actualData.UpdatedDate || new Date().toISOString(),
            };

            return {
                success: true,
                data: menu,
                message: 'Menu updated successfully',
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            console.error('Update Menu API Error:', error);

            await logError({
                controllerName: 'MenuApi',
                methodName: 'Update',
                requestUrl: `${API_BASE_URL}/Menu/Add`,
                requestPayload: { id, ...menuData },
                error
            });

            return {
                success: false,
                data: null as any,
                message: error instanceof Error ? error.message : 'Failed to update menu',
                timestamp: new Date().toISOString(),
            };
        }
    },

    /**
     * Delete Menu
     * DELETE /api/Menu/Delete?id={id}
     */
    deleteMenu: async (id: string): Promise<ApiResponse<null>> => {
        try {
            const token = getAuthToken();
            if (!token) {
                throw new Error('No authentication token found');
            }

            console.log('🔥 MENU API: Deleting menu ID:', id);

            const response = await fetch(
                `${API_BASE_URL}/Menu/Delete?id=${id}`,
                {
                    method: 'DELETE',
                    headers: createAuthHeaders(),
                }
            );

            await handleApiResponse(response);

            return {
                success: true,
                data: null,
                message: 'Menu deleted successfully',
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            console.error('Delete Menu API Error:', error);

            await logError({
                controllerName: 'MenuApi',
                methodName: 'Delete',
                requestUrl: `${API_BASE_URL}/Menu/Delete?id=${id}`,
                requestPayload: { id },
                error
            });

            return {
                success: false,
                data: null,
                message: error instanceof Error ? error.message : 'Failed to delete menu',
                timestamp: new Date().toISOString(),
            };
        }
    },
};

export default menuApi;
