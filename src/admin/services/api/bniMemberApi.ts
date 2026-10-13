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

export interface BNIMember {
    memberId: number;
    chapterId: number;
    memberName: string;
    companyName: string;
    category: string;
    mobile: string;
    email: string;
    website: string;
    countryId: number;
    regionId: number;
    cityId: number;
    linkedInProfile: string;
    other_Vertical: string;
    notes: string;

    // Display fields (optional, populated by backend on get)
    chapterName?: string;
    countryName?: string;
    regionName?: string;
    cityName?: string;
}

export interface DropdownItem {
    id: number;
    name: string;
    code?: string;
}

export const bniMemberApi = {
    /**
     * Get all BNI Members with pagination
     * GET /api/BNIMember/GetAllPage?start=0&length=100&sortColumnDir=asc
     */
    getAllMembers: async (start: number = 0, length: number = 100, sortColumnDir: string = 'asc'): Promise<ApiResponse<BNIMember[]>> => {
        try {
            const token = getAuthToken();
            if (!token) throw new Error('No authentication token found');

            const url = `${API_BASE_URL}/BNIMember/GetAllPage?start=${start}&length=${length}&sortColumnDir=${sortColumnDir}`;
            console.log('🚀 Fetching BNI Members:', url);

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

            // Extract array from various possible structures (defensive programming as seen in chapter api)
            let itemsArray: any[] = [];
            if (Array.isArray(data)) {
                itemsArray = data;
            } else if (data && Array.isArray(data.data)) {
                itemsArray = data.data;
            } else if (data && data.data && Array.isArray(data.data.data)) {
                itemsArray = data.data.data;
            }

            console.log('✅ Found BNI Members count:', itemsArray.length);

            return {
                success: true,
                data: itemsArray,
                message: `Successfully retrieved ${itemsArray.length} BNI members`,
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            console.error('❌ Get BNI Members Error:', error);
            return {
                success: false,
                data: [],
                message: error instanceof Error ? error.message : 'Failed to fetch BNI members',
                timestamp: new Date().toISOString(),
            };
        }
    },

    /**
     * Get BNI Member by ID
     * GET /api/BNIMember/GetById?id={id}
     */
    getMemberById: async (id: number): Promise<ApiResponse<BNIMember | null>> => {
        try {
            const token = getAuthToken();
            if (!token) throw new Error('No authentication token found');

            const url = `${API_BASE_URL}/BNIMember/GetById?id=${id}`;
            console.log('🚀 Fetching BNI Member by ID:', url);

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

            let memberData = data;
            if (data && data.data) {
                memberData = data.data;
            }

            return {
                success: true,
                data: memberData,
                message: 'BNI Member retrieved successfully',
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            console.error('❌ Get BNI Member By ID Error:', error);
            return {
                success: false,
                data: null,
                message: error instanceof Error ? error.message : 'Failed to fetch BNI member',
                timestamp: new Date().toISOString(),
            };
        }
    },

    /**
     * Add or Update BNI Member
     * POST /api/BNIMember/Add
     */
    addMember: async (member: Partial<BNIMember>): Promise<ApiResponse<BNIMember | null>> => {
        try {
            const token = getAuthToken();
            if (!token) throw new Error('No authentication token found');

            const url = `${API_BASE_URL}/BNIMember/Add`;
            console.log('🚀 Adding/Updating BNI Member:', url, member);

            const response = await fetch(url, {
                method: 'POST',
                headers: createAuthHeaders(),
                body: JSON.stringify(member),
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
                message: 'BNI Member saved successfully',
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            console.error('❌ Add/Update BNI Member Error:', error);
            return {
                success: false,
                data: null,
                message: error instanceof Error ? error.message : 'Failed to save BNI member',
                timestamp: new Date().toISOString(),
            };
        }
    },

    /**
     * Delete BNI Member
     * DELETE /api/BNIMember/Delete?id={id}&operatedBy={operatedBy}
     */
    deleteMember: async (id: number, operatedBy: number): Promise<ApiResponse<null>> => {
        try {
            const token = getAuthToken();
            if (!token) throw new Error('No authentication token found');

            const url = `${API_BASE_URL}/BNIMember/Delete?id=${id}&operatedBy=${operatedBy}`;
            console.log('🚀 Deleting BNI Member:', url);

            const response = await fetch(url, {
                method: 'DELETE',
                headers: createAuthHeaders(),
            });

            if (!response.ok) {
                const responseText = await response.text();
                let data = {};
                try { data = JSON.parse(responseText) } catch (e) { }
                throw new Error((data as any).message || `HTTP ${response.status}`);
            }

            return {
                success: true,
                data: null,
                message: 'BNI Member deleted successfully',
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            console.error('❌ Delete BNI Member Error:', error);
            return {
                success: false,
                data: null,
                message: error instanceof Error ? error.message : 'Failed to delete BNI member',
                timestamp: new Date().toISOString(),
            };
        }
    },

    // ==================== DROPDOWN APIs ====================

    getBNIChapterDropdown: async (): Promise<ApiResponse<DropdownItem[]>> => {
        return fetchDropdown(`${API_BASE_URL}/Dropdown/BNIChapterName`, 'BNI Chapters');
    },

    getCountryDropdown: async (): Promise<ApiResponse<DropdownItem[]>> => {
        return fetchDropdown(`${API_BASE_URL}/Dropdown/CountryName`, 'Countries');
    },

    getRegionDropdown: async (countryId: number): Promise<ApiResponse<DropdownItem[]>> => {
        return fetchDropdown(`${API_BASE_URL}/Dropdown/RegionNameList?CountryId=${countryId}`, 'Regions');
    },

    getCityDropdown: async (regionId: number): Promise<ApiResponse<DropdownItem[]>> => {
        return fetchDropdown(`${API_BASE_URL}/Dropdown/CityNameList?RegionId=${regionId}`, 'Cities');
    }
};

// Helper for dropdowns
const fetchDropdown = async (url: string, logName: string): Promise<ApiResponse<DropdownItem[]>> => {
    try {
        const token = getAuthToken();
        if (!token) throw new Error('No authentication token found');

        console.log(`🌐 Fetching ${logName} from:`, url);
        const response = await fetch(url, {
            method: 'GET',
            headers: createAuthHeaders(),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || `HTTP ${response.status}`);
        }

        let items: DropdownItem[] = [];
        if (Array.isArray(data)) {
            items = data.map((item: any) => ({
                id: item.id || item.Id || item.chapterId || item.countryId || item.regionId || item.cityId || item.stateId || item.StateId || item.districtId || item.DistrictId,
                name: item.name || item.Name || item.chapterName || item.countryName || item.regionName || item.cityName || item.stateName || item.StateName || item.districtName || item.DistrictName,
                code: item.code || item.Code || undefined
            }));
        } else if (data && Array.isArray(data.data)) {
            items = data.data.map((item: any) => ({
                id: item.id || item.Id || item.chapterId || item.countryId || item.regionId || item.cityId || item.stateId || item.StateId || item.districtId || item.DistrictId,
                name: item.name || item.Name || item.chapterName || item.countryName || item.regionName || item.cityName || item.stateName || item.StateName || item.districtName || item.DistrictName,
                code: item.code || item.Code || undefined
            }));
        }

        return { success: true, data: items, message: `${logName} fetched`, timestamp: new Date().toISOString() };
    } catch (error) {
        console.error(`❌ Get ${logName} Dropdown Error:`, error);
        return { success: false, data: [], message: error instanceof Error ? error.message : 'Failed', timestamp: new Date().toISOString() };
    }
};
