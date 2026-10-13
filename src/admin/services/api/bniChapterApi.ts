import { ApiResponse } from '../types/apiTypes';

const API_BASE_URL = 'https://aj.padhyasoft.com/api';

/**
 * Get auth token from localStorage
 */
const getAuthToken = (): string | null => {
    return localStorage.getItem('admin_token');
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

// BNI Chapter Interface
export interface BNIChapter {
    chapterId: number;
    countryId: number;
    regionId: number;
    cityId: number;
    chapterName: string;
    meetingDay: string;
    meetingTime: string;
    meetingTimeZone: string;
    language: string;
    chapterType: string;
    meetingsDay: string;
    createdBy?: number;
    lastModifiedBy?: number;
    // Display names from API
    countryName?: string;
    regionName?: string;
    cityName?: string;
}

// Dropdown Item Interface
export interface DropdownItem {
    id: number;
    name: string;
}

export interface LovDropdownItem {
    lovDetailId: number;
    lovColumn: string;
    lovValue: string;
    lovCode?: string;
    lovDisplayOrder: number;
}

export const bniChapterApi = {
    /**
     * Get all BNI Chapters with pagination
     * GET /api/BNIChapter/GetAllPage?start=0&length=100&sortColumnDir=asc
     */
    getAllChapters: async (start: number = 0, length: number = 100, sortColumnDir: string = 'asc'): Promise<ApiResponse<BNIChapter[]>> => {
        try {
            const token = getAuthToken();
            if (!token) throw new Error('No authentication token found');

            const url = `${API_BASE_URL}/BNIChapter/GetAllPage?start=${start}&length=${length}&sortColumnDir=${sortColumnDir}`;
            console.log('🚀 Fetching BNI Chapters:', url);

            const response = await fetch(url, {
                method: 'GET',
                headers: createAuthHeaders(),
            });

            const responseText = await response.text();
            let data;
            try {
                data = responseText ? JSON.parse(responseText) : {};
            } catch (parseError) {
                console.error('❌ JSON Parse Error:', parseError);
                throw new Error('Invalid JSON response from server');
            }

            if (!response.ok) {
                throw new Error(data.message || `HTTP ${response.status}: ${response.statusText}`);
            }

            // Extract array from various possible structures
            let itemsArray: any[] = [];
            if (Array.isArray(data)) {
                itemsArray = data;
            } else if (data && Array.isArray(data.data)) {
                itemsArray = data.data;
            } else if (data && data.data && Array.isArray(data.data.data)) {
                itemsArray = data.data.data;
            } else if (data && typeof data === 'object') {
                const possibleKeys = ['items', 'list', 'chapters', 'Chapters'];
                for (const key of possibleKeys) {
                    if (Array.isArray(data[key])) {
                        itemsArray = data[key];
                        break;
                    }
                }
            }

            console.log('✅ Found BNI Chapters count:', itemsArray.length);
            // Debug: Log first item to see all available fields
            if (itemsArray.length > 0) {
                console.log('📋 Chapter Data Structure (first item):', itemsArray[0]);
                console.log('📋 All fields:', Object.keys(itemsArray[0]));
                console.log('📋 ChapterType value:', itemsArray[0].chapterType, '| Type:', typeof itemsArray[0].chapterType);
            }

            return {
                success: true,
                data: itemsArray,
                message: `Successfully retrieved ${itemsArray.length} BNI chapters`,
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            console.error('❌ Get BNI Chapters Error:', error);
            return {
                success: false,
                data: [],
                message: error instanceof Error ? error.message : 'Failed to fetch BNI chapters',
                timestamp: new Date().toISOString(),
            };
        }
    },

    /**
     * Get BNI Chapter by ID
     * GET /api/BNIChapter/GetById?id={id}
     */
    getChapterById: async (id: number): Promise<ApiResponse<BNIChapter | null>> => {
        try {
            const token = getAuthToken();
            if (!token) throw new Error('No authentication token found');

            const url = `${API_BASE_URL}/BNIChapter/GetById?id=${id}`;
            console.log('🚀 Fetching BNI Chapter by ID:', url);

            const response = await fetch(url, {
                method: 'GET',
                headers: createAuthHeaders(),
            });

            const responseText = await response.text();
            let data;
            try {
                data = responseText ? JSON.parse(responseText) : {};
            } catch (parseError) {
                console.error('❌ JSON Parse Error:', parseError);
                throw new Error('Invalid JSON response from server');
            }

            if (!response.ok) {
                throw new Error(data.message || `HTTP ${response.status}`);
            }

            // Extract chapter data
            let chapterData = data;
            if (data && data.data) {
                chapterData = data.data;
            }

            return {
                success: true,
                data: chapterData,
                message: 'BNI Chapter retrieved successfully',
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            console.error('❌ Get BNI Chapter By ID Error:', error);
            return {
                success: false,
                data: null,
                message: error instanceof Error ? error.message : 'Failed to fetch BNI chapter',
                timestamp: new Date().toISOString(),
            };
        }
    },

    /**
     * Add new BNI Chapter
     * POST /api/BNIChapter/Add
     */
    addChapter: async (chapter: Partial<BNIChapter>): Promise<ApiResponse<BNIChapter | null>> => {
        try {
            const token = getAuthToken();
            if (!token) throw new Error('No authentication token found');

            const url = `${API_BASE_URL}/BNIChapter/Add`;
            console.log('🚀 Adding BNI Chapter:', url, chapter);

            const response = await fetch(url, {
                method: 'POST',
                headers: createAuthHeaders(),
                body: JSON.stringify(chapter),
            });

            const responseText = await response.text();
            let data;
            try {
                data = responseText ? JSON.parse(responseText) : {};
            } catch (parseError) {
                console.error('❌ JSON Parse Error:', parseError);
                throw new Error('Invalid JSON response from server');
            }

            if (!response.ok) {
                throw new Error(data.message || `HTTP ${response.status}`);
            }

            return {
                success: true,
                data: data.data || data,
                message: 'BNI Chapter added successfully',
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            console.error('❌ Add BNI Chapter Error:', error);
            return {
                success: false,
                data: null,
                message: error instanceof Error ? error.message : 'Failed to add BNI chapter',
                timestamp: new Date().toISOString(),
            };
        }
    },

    /**
     * Update BNI Chapter
     * POST /api/BNIChapter/Add (with chapterId for update)
     */
    updateChapter: async (chapter: Partial<BNIChapter>): Promise<ApiResponse<BNIChapter | null>> => {
        try {
            const token = getAuthToken();
            if (!token) throw new Error('No authentication token found');

            const url = `${API_BASE_URL}/BNIChapter/Add`;
            console.log('🚀 Updating BNI Chapter:', url, chapter);

            const response = await fetch(url, {
                method: 'POST',
                headers: createAuthHeaders(),
                body: JSON.stringify(chapter),
            });

            const responseText = await response.text();
            let data;
            try {
                data = responseText ? JSON.parse(responseText) : {};
            } catch (parseError) {
                console.error('❌ JSON Parse Error:', parseError);
                throw new Error('Invalid JSON response from server');
            }

            if (!response.ok) {
                throw new Error(data.message || `HTTP ${response.status}`);
            }

            return {
                success: true,
                data: data.data || data,
                message: 'BNI Chapter updated successfully',
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            console.error('❌ Update BNI Chapter Error:', error);
            return {
                success: false,
                data: null,
                message: error instanceof Error ? error.message : 'Failed to update BNI chapter',
                timestamp: new Date().toISOString(),
            };
        }
    },

    /**
     * Delete BNI Chapter
     * DELETE /api/BNIChapter/Delete?id={id}&operatedBy={operatedBy}
     */
    deleteChapter: async (id: number, operatedBy: number): Promise<ApiResponse<null>> => {
        try {
            const token = getAuthToken();
            if (!token) throw new Error('No authentication token found');

            const url = `${API_BASE_URL}/BNIChapter/Delete?id=${id}&operatedBy=${operatedBy}`;
            console.log('🚀 Deleting BNI Chapter:', url);

            const response = await fetch(url, {
                method: 'DELETE',
                headers: createAuthHeaders(),
            });

            const responseText = await response.text();
            let data;
            try {
                data = responseText ? JSON.parse(responseText) : {};
            } catch (parseError) {
                // If no response body, that's okay for DELETE
                data = {};
            }

            if (!response.ok) {
                throw new Error(data.message || `HTTP ${response.status}`);
            }

            return {
                success: true,
                data: null,
                message: 'BNI Chapter deleted successfully',
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            console.error('❌ Delete BNI Chapter Error:', error);
            return {
                success: false,
                data: null,
                message: error instanceof Error ? error.message : 'Failed to delete BNI chapter',
                timestamp: new Date().toISOString(),
            };
        }
    },

    // ==================== DROPDOWN APIs ====================

    /**
     * Get Country Dropdown
     * GET /api/Dropdown/CountryName
     */
    getCountryDropdown: async (): Promise<ApiResponse<DropdownItem[]>> => {
        try {
            const token = getAuthToken();
            if (!token) throw new Error('No authentication token found');

            const url = `${API_BASE_URL}/Dropdown/CountryName`;
            console.log('🌐 Fetching Countries from:', url);

            const response = await fetch(url, {
                method: 'GET',
                headers: createAuthHeaders(),
            });

            const data = await response.json();
            console.log('🌐 Countries Raw Response:', data);

            if (!response.ok) {
                throw new Error(data.message || `HTTP ${response.status}`);
            }

            let items: DropdownItem[] = [];
            if (Array.isArray(data)) {
                items = data.map((item: any) => ({
                    id: item.id || item.countryId || item.Id,
                    name: item.name || item.countryName || item.Name
                }));
            } else if (data && Array.isArray(data.data)) {
                items = data.data.map((item: any) => ({
                    id: item.id || item.countryId || item.Id,
                    name: item.name || item.countryName || item.Name
                }));
            }

            console.log('🌐 Countries Mapped Items:', items);
            return { success: true, data: items, message: 'Countries fetched', timestamp: new Date().toISOString() };
        } catch (error) {
            console.error('❌ Get Country Dropdown Error:', error);
            return { success: false, data: [], message: error instanceof Error ? error.message : 'Failed', timestamp: new Date().toISOString() };
        }
    },

    /**
     * Get Region/State Dropdown by Country ID
     * GET /api/Dropdown/RegionNameList?CountryId={countryId}
     */
    getRegionDropdown: async (countryId: number): Promise<ApiResponse<DropdownItem[]>> => {
        try {
            const token = getAuthToken();
            if (!token) throw new Error('No authentication token found');

            const url = `${API_BASE_URL}/Dropdown/RegionNameList?CountryId=${countryId}`;
            console.log('🌐 Fetching Regions from:', url);

            const response = await fetch(url, {
                method: 'GET',
                headers: createAuthHeaders(),
            });

            const data = await response.json();
            console.log('🌐 Regions Raw Response:', data);

            if (!response.ok) {
                throw new Error(data.message || `HTTP ${response.status}`);
            }

            let items: DropdownItem[] = [];
            if (Array.isArray(data)) {
                items = data.map((item: any) => ({
                    id: item.id || item.regionId || item.Id,
                    name: item.name || item.regionName || item.Name
                }));
            } else if (data && Array.isArray(data.data)) {
                items = data.data.map((item: any) => ({
                    id: item.id || item.regionId || item.Id,
                    name: item.name || item.regionName || item.Name
                }));
            }

            console.log('🌐 Regions Mapped Items:', items);
            return { success: true, data: items, message: 'Regions fetched', timestamp: new Date().toISOString() };
        } catch (error) {
            console.error('❌ Get Region Dropdown Error:', error);
            return { success: false, data: [], message: error instanceof Error ? error.message : 'Failed', timestamp: new Date().toISOString() };
        }
    },

    /**
     * Get City Dropdown by Region ID
     * GET /api/Dropdown/CityNameList?RegionId={regionId}
     */
    getCityDropdown: async (regionId: number): Promise<ApiResponse<DropdownItem[]>> => {
        try {
            const token = getAuthToken();
            if (!token) throw new Error('No authentication token found');

            const url = `${API_BASE_URL}/Dropdown/CityNameList?RegionId=${regionId}`;
            console.log('🌐 Fetching Cities from:', url);

            const response = await fetch(url, {
                method: 'GET',
                headers: createAuthHeaders(),
            });

            const data = await response.json();
            console.log('🌐 Cities Raw Response:', data);

            if (!response.ok) {
                throw new Error(data.message || `HTTP ${response.status}`);
            }

            let items: DropdownItem[] = [];
            if (Array.isArray(data)) {
                items = data.map((item: any) => ({
                    id: item.id || item.cityId || item.Id,
                    name: item.name || item.cityName || item.Name
                }));
            } else if (data && Array.isArray(data.data)) {
                items = data.data.map((item: any) => ({
                    id: item.id || item.cityId || item.Id,
                    name: item.name || item.cityName || item.Name
                }));
            }

            console.log('🌐 Cities Mapped Items:', items);
            return { success: true, data: items, message: 'Cities fetched', timestamp: new Date().toISOString() };
        } catch (error) {
            console.error('❌ Get City Dropdown Error:', error);
            return { success: false, data: [], message: error instanceof Error ? error.message : 'Failed', timestamp: new Date().toISOString() };
        }
    },

    /**
     * Get LOV Master Dropdown
     * GET /api/Dropdown/LovMaster?Lov_column={lovColumn}
     */
    getLovDropdown: async (lovColumn: string): Promise<ApiResponse<LovDropdownItem[]>> => {
        try {
            const token = getAuthToken();
            if (!token) throw new Error('No authentication token found');

            const url = `${API_BASE_URL}/Dropdown/LovMaster?Lov_column=${lovColumn}`;
            console.log('🌐 Fetching LOV from:', url);

            const response = await fetch(url, {
                method: 'GET',
                headers: createAuthHeaders(),
            });

            const data = await response.json();
            console.log(`🌐 LOV [${lovColumn}] Raw Response:`, data);

            if (!response.ok) {
                throw new Error(data.message || `HTTP ${response.status}`);
            }

            let rawItems: any[] = [];
            if (Array.isArray(data)) {
                rawItems = data;
            } else if (data && Array.isArray(data.data)) {
                rawItems = data.data;
            }

            // Map items with flexible field names to handle different API response structures
            const items: LovDropdownItem[] = rawItems.map((item: any) => ({
                lovDetailId: item.lovDetailId || item.LovDetailId || item.id || item.Id || 0,
                lovColumn: item.lovColumn || item.LovColumn || item.lov_column || lovColumn,
                lovValue: item.lovValue || item.LovValue || item.lov_Value || item.Lov_Value ||
                    item.value || item.Value || item.name || item.Name || item.text || item.Text || '',
                lovCode: item.code || item.Code || item.lovCode || item.LovCode || undefined,
                lovDisplayOrder: item.lovDisplayOrder || item.LovDisplayOrder || item.displayOrder || 0
            }));

            console.log(`🌐 LOV [${lovColumn}] Mapped Items:`, items);
            return { success: true, data: items, message: 'LOV fetched', timestamp: new Date().toISOString() };
        } catch (error) {
            console.error(`❌ Get LOV [${lovColumn}] Dropdown Error:`, error);
            return { success: false, data: [], message: error instanceof Error ? error.message : 'Failed', timestamp: new Date().toISOString() };
        }
    },
};
