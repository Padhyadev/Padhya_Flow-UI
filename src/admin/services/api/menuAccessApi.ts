import { ApiResponse, MenuAccessResponse, MenuAccessItem } from '../types/apiTypes';
import { logError } from '../../utils/logError';

const API_BASE_URL = 'https://aj.padhyasoft.com/api';
// const API_BASE_URL = 'https://localhost:7087/api';

/**
 * Menu Access API Service
 * Fetches user-specific menu permissions from backend
 */
export const menuAccessApi = {
    /**
     * Get Menu Access for a specific user
     * GET: /api/MenuAccess/GetMenuAccess?userId={userId}
     */
    getMenuAccess: async (userId: string): Promise<ApiResponse<MenuAccessResponse>> => {
        try {
            console.log('🔥 MENU ACCESS API: Fetching menu permissions for user:', userId);

            const token = localStorage.getItem('admin_token');
            const apiUrl = `${API_BASE_URL}/MenuAccess/GetMenuAccess?userId=${encodeURIComponent(userId)}`;

            console.log('🔥 MENU ACCESS API: Calling endpoint:', apiUrl);

            const response = await fetch(apiUrl, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` }),
                },
            });

            console.log('🔥 MENU ACCESS API: Response status:', response.status);

            const data = await response.json();
            console.log('🔥 MENU ACCESS API: Response data:', data);

            if (response.ok && data) {
                // API returns array directly
                let menus: MenuAccessItem[] = [];

                if (Array.isArray(data)) {
                    menus = data;
                } else if (data.data && Array.isArray(data.data)) {
                    menus = data.data;
                } else if (data.menus && Array.isArray(data.menus)) {
                    menus = data.menus;
                }

                // Filter only active and non-deleted menus
                // AND Map potential missing controller names from menuName
                const activeMenus = menus
                    .filter((menu: any) => menu.isActive === true && menu.isDeleted === false)
                    .map((menu: any) => ({
                        ...menu,
                        // Fallback: If controller is empty/'0', try menuName, then name
                        controller: (menu.controller && menu.controller !== '0') ? menu.controller : (menu.menuName || menu.name || '')
                    }));

                console.log('🔥 MENU ACCESS API: Total menus:', menus.length);
                console.log('🔥 MENU ACCESS API: Active menus:', activeMenus.length);
                console.log('🔥 MENU ACCESS API: Controllers:', activeMenus.map((m: any) => m.controller).join(', '));

                const menuAccessResponse: MenuAccessResponse = {
                    userId: userId,
                    menus: activeMenus,
                };

                return {
                    success: true,
                    data: menuAccessResponse,
                    message: 'Menu access retrieved successfully',
                    timestamp: new Date().toISOString(),
                };
            } else {
                console.warn('🔥 MENU ACCESS API: Failed to fetch menu access');
                return {
                    success: false,
                    data: { userId, menus: [] } as MenuAccessResponse,
                    message: data.message || 'Failed to fetch menu access',
                    errors: [data.message || 'API returned error'],
                    timestamp: new Date().toISOString(),
                };
            }
        } catch (error) {
            console.error('🔥 MENU ACCESS API: Error:', error);

            await logError({
                controllerName: 'MenuAccessApi',
                methodName: 'GetMenuAccess',
                requestUrl: `${API_BASE_URL}/MenuAccess/GetMenuAccess?userId=${encodeURIComponent(userId)}`,
                requestPayload: { userId },
                error
            });

            return {
                success: false,
                data: { userId, menus: [] } as MenuAccessResponse,
                message: 'Network error occurred',
                errors: [error instanceof Error ? error.message : 'Unknown error'],
                timestamp: new Date().toISOString(),
            };
        }
    },
};

export default menuAccessApi;
