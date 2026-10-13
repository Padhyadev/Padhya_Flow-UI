import { ApiResponse } from '../types/apiTypes';
import { logError } from '../../utils/logError';

const API_BASE_URL = 'https://aj.padhyasoft.com/api';

export interface BNIFollowup {
    followupId: number;
    memberId: number;
    memberName?: string;
    followupDateUTC: string;
    localTimeZone: string;
    followupType: string;
    responseStatus: string;
    remarks: string;
    nextFollowupDateUTC: string;
    createdBy: number;
    lastModifiedBy: number;
    createdAt?: string;
    updatedAt?: string;
}

export interface BNIFollowupHistory {
    id: number;
    followupId: number;
    memberName?: string;
    followupDate: string;
    nextFollowupDate?: string;
    oldStatus?: string;
    newStatus?: string;
    status: string;
    remarks: string;
    followupByName?: string;
    createdAt?: string;
}

export interface CreateBNIFollowupRequest {
    memberId: number;
    followupDateUTC: string;
    localTimeZone: string;
    followupType: string;
    responseStatus: string;
    remarks: string;
    nextFollowupDateUTC: string;
    createdBy: number;
}

export interface UpdateBNIFollowupRequest {
    followupId: number;
    nextFollowupDateUTC: string;
    responseStatus: string;
    remarks: string;
}

export interface DropdownItem {
    id: number;
    name: string;
    code?: string;
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
 * BNI Followup API Service
 */
export const bniFollowupApi = {
    /**
     * Get all BNI followups with pagination
     * GET /api/BNIFollowup/GetAllPage?start=0&length=100&sortColumnDir=asc
     */
    getAllFollowups: async (start: number = 0, length: number = 100, sortColumnDir: string = 'asc'): Promise<ApiResponse<BNIFollowup[]>> => {
        try {
            const token = getAuthToken();
            if (!token) {
                throw new Error('No authentication token found');
            }

            const response = await fetch(
                `${API_BASE_URL}/BNIFollowup/GetAllPage?start=${start}&length=${length}&sortColumnDir=${sortColumnDir}`,
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

            console.log('🚀 BNI Followup GetAll API Response:', data);

            // Handle different possible response formats
            let followupsArray: any[] = [];

            if (data && Array.isArray(data.data)) {
                followupsArray = data.data;
            } else if (data && data.data && Array.isArray(data.data.data)) {
                followupsArray = data.data.data;
            } else if (Array.isArray(data)) {
                followupsArray = data;
            } else {
                const findArray = (obj: any): any[] => {
                    if (Array.isArray(obj)) return obj;
                    if (typeof obj === 'object' && obj !== null) {
                        for (const key in obj) {
                            const result = findArray(obj[key]);
                            if (result && result.length > 0) return result;
                        }
                    }
                    return [];
                };
                followupsArray = findArray(data);
            }

            console.log('📦 Processed Followups Array:', followupsArray);

            // Map API response to our BNIFollowup format
            const followups: BNIFollowup[] = followupsArray.map((apiFollowup: any) => ({
                followupId: apiFollowup.followupId || apiFollowup.FollowupId || apiFollowup.id || apiFollowup.Id || 0,
                memberId: apiFollowup.memberId || apiFollowup.MemberId || 0,
                memberName: apiFollowup.memberName || apiFollowup.MemberName || '',
                followupDateUTC: apiFollowup.followupDateUTC || apiFollowup.FollowupDateUTC || '',
                localTimeZone: apiFollowup.localTimeZone || apiFollowup.LocalTimeZone || '',
                followupType: apiFollowup.followupType || apiFollowup.FollowupType || '',
                responseStatus: apiFollowup.responseStatus || apiFollowup.ResponseStatus || '',
                remarks: apiFollowup.remarks || apiFollowup.Remarks || '',
                nextFollowupDateUTC: apiFollowup.nextFollowupDateUTC || apiFollowup.NextFollowupDateUTC || '',
                createdBy: apiFollowup.createdBy || apiFollowup.CreatedBy || 0,
                lastModifiedBy: apiFollowup.lastModifiedBy || apiFollowup.LastModifiedBy || 0,
                createdAt: apiFollowup.createdDate || apiFollowup.CreatedDate || apiFollowup.createdAt || '',
                updatedAt: apiFollowup.updatedDate || apiFollowup.UpdatedDate || apiFollowup.updatedAt || '',
            }));

            return {
                success: true,
                data: followups,
                message: `Successfully retrieved ${followups.length} BNI followups`,
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            console.error('Get BNI Followups API Error:', error);

            await logError({
                controllerName: 'BNIFollowupApi',
                methodName: 'GetAllPage',
                requestUrl: `${API_BASE_URL}/BNIFollowup/GetAllPage`,
                requestPayload: { start, length, sortColumnDir },
                error
            });

            return {
                success: false,
                data: [],
                message: error instanceof Error ? error.message : 'Failed to fetch BNI followups',
                timestamp: new Date().toISOString(),
            };
        }
    },

    /**
     * Add New BNI Followup
     * POST /api/BNIFollowup/Add
     */
    addFollowup: async (followupData: any): Promise<ApiResponse<BNIFollowup>> => {
        try {
            const token = getAuthToken();
            if (!token) {
                throw new Error('No authentication token found');
            }

            const userId = getUserId();

            const requestBody = {
                FollowupId: followupData.followupId || 0,
                MemberId: followupData.memberId,
                FollowupDateUTC: followupData.followupDateUTC,
                LocalTimeZone: followupData.localTimeZone,
                FollowupType: followupData.followupType,
                ResponseStatus: followupData.responseStatus,
                Remarks: followupData.remarks || '',
                NextFollowupDateUTC: followupData.nextFollowupDateUTC,
                CreatedBy: userId,
                LastModifiedBy: userId
            };

            const bodyJson = JSON.stringify(requestBody);
            console.log('🚀 API REQUEST BODY (JSON):', bodyJson);

            const response = await fetch(
                `${API_BASE_URL}/BNIFollowup/Add`,
                {
                    method: 'POST',
                    headers: createAuthHeaders(),
                    body: bodyJson,
                }
            );

            console.log('🚀 API RESPONSE STATUS:', response.status);

            let data;
            const responseText = await response.text();
            console.log('🚀 API RESPONSE BODY:', responseText);

            if (response.status === 204 || !response.headers.get('content-type')?.includes('application/json')) {
                data = {};
            } else {
                try {
                    data = responseText ? JSON.parse(responseText) : {};
                } catch (e) {
                    data = {};
                }
            }

            if (!response.ok || (data && data.isSuccess === false)) {
                throw new Error(data.message || `Failed to add BNI followup (Status: ${response.status})`);
            }

            const actualData = data.data || data;
            const followup: BNIFollowup = {
                followupId: actualData.followupId || actualData.FollowupId || 0,
                memberId: actualData.memberId || actualData.MemberId || followupData.memberId,
                memberName: actualData.memberName || actualData.MemberName || '',
                followupDateUTC: actualData.followupDateUTC || actualData.FollowupDateUTC || followupData.followupDateUTC,
                localTimeZone: actualData.localTimeZone || actualData.LocalTimeZone || followupData.localTimeZone,
                followupType: actualData.followupType || actualData.FollowupType || followupData.followupType,
                responseStatus: actualData.responseStatus || actualData.ResponseStatus || followupData.responseStatus,
                remarks: actualData.remarks || actualData.Remarks || followupData.remarks,
                nextFollowupDateUTC: actualData.nextFollowupDateUTC || actualData.NextFollowupDateUTC || followupData.nextFollowupDateUTC,
                createdBy: userId,
                lastModifiedBy: userId,
                createdAt: actualData.createdDate || actualData.CreatedDate || new Date().toISOString(),
                updatedAt: actualData.updatedDate || actualData.UpdatedDate || new Date().toISOString(),
            };

            return {
                success: true,
                data: followup,
                message: 'BNI followup created successfully',
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            console.error('Add BNI Followup API Error:', error);

            await logError({
                controllerName: 'BNIFollowupApi',
                methodName: 'Add',
                requestUrl: `${API_BASE_URL}/BNIFollowup/Add`,
                requestPayload: followupData,
                error
            });

            return {
                success: false,
                data: null as any,
                message: error instanceof Error ? error.message : 'Failed to create BNI followup',
                timestamp: new Date().toISOString(),
            };
        }
    },

    /**
     * Get BNI Followup By ID
     * GET /api/BNIFollowup/GetById?id={id}
     */
    getFollowupById: async (id: number): Promise<ApiResponse<BNIFollowup>> => {
        try {
            const token = getAuthToken();
            if (!token) {
                throw new Error('No authentication token found');
            }

            const response = await fetch(
                `${API_BASE_URL}/BNIFollowup/GetById?id=${id}`,
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

            const followup: BNIFollowup = {
                followupId: actualData.followupId || actualData.FollowupId || id,
                memberId: actualData.memberId || actualData.MemberId || 0,
                memberName: actualData.memberName || actualData.MemberName || '',
                followupDateUTC: actualData.followupDateUTC || actualData.FollowupDateUTC || '',
                localTimeZone: actualData.localTimeZone || actualData.LocalTimeZone || '',
                followupType: actualData.followupType || actualData.FollowupType || '',
                responseStatus: actualData.responseStatus || actualData.ResponseStatus || '',
                remarks: actualData.remarks || actualData.Remarks || '',
                nextFollowupDateUTC: actualData.nextFollowupDateUTC || actualData.NextFollowupDateUTC || '',
                createdBy: actualData.createdBy || actualData.CreatedBy || 0,
                lastModifiedBy: actualData.lastModifiedBy || actualData.LastModifiedBy || 0,
                createdAt: actualData.createdDate || actualData.CreatedDate || '',
                updatedAt: actualData.updatedDate || actualData.UpdatedDate || '',
            };

            return {
                success: true,
                data: followup,
                message: 'BNI followup retrieved successfully',
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            console.error('Get BNI Followup By ID API Error:', error);

            await logError({
                controllerName: 'BNIFollowupApi',
                methodName: 'GetById',
                requestUrl: `${API_BASE_URL}/BNIFollowup/GetById?id=${id}`,
                requestPayload: { id },
                error
            });

            return {
                success: false,
                data: null as any,
                message: error instanceof Error ? error.message : 'Failed to retrieve BNI followup',
                timestamp: new Date().toISOString(),
            };
        }
    },

    /**
     * Delete BNI Followup
     * DELETE /api/BNIFollowup/Delete?id={id}&operatedBy={operatedBy}
     */
    deleteFollowup: async (id: number, operatedBy: number): Promise<ApiResponse<void>> => {
        try {
            const token = getAuthToken();
            if (!token) {
                throw new Error('No authentication token found');
            }

            const response = await fetch(
                `${API_BASE_URL}/BNIFollowup/Delete?id=${id}&operatedBy=${operatedBy}`,
                {
                    method: 'DELETE',
                    headers: createAuthHeaders(),
                }
            );

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            return {
                success: true,
                data: undefined,
                message: 'BNI followup deleted successfully',
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            console.error('Delete BNI Followup API Error:', error);

            await logError({
                controllerName: 'BNIFollowupApi',
                methodName: 'Delete',
                requestUrl: `${API_BASE_URL}/BNIFollowup/Delete?id=${id}&operatedBy=${operatedBy}`,
                requestPayload: { id, operatedBy },
                error
            });

            return {
                success: false,
                data: undefined,
                message: error instanceof Error ? error.message : 'Failed to delete BNI followup',
                timestamp: new Date().toISOString(),
            };
        }
    },

    /**
     * Get BNI Followup History by FollowupId
     * GET /api/BNIFollowup/BNIFollowupHistorybyFollowupId?id={id}
     */
    getFollowupHistory: async (id: number): Promise<ApiResponse<BNIFollowupHistory[]>> => {
        try {
            const token = getAuthToken();
            if (!token) {
                throw new Error('No authentication token found');
            }

            const response = await fetch(
                `${API_BASE_URL}/BNIFollowup/BNIFollowupHistorybyFollowupId?id=${id}`,
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
            let historyArray: any[] = [];

            if (Array.isArray(data)) {
                historyArray = data;
            } else if (data && Array.isArray(data.data)) {
                historyArray = data.data;
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
                historyArray = findArray(data);
            }

            const history: BNIFollowupHistory[] = historyArray.map((item: any) => ({
                id: item.id || item.Id || 0,
                followupId: item.followupId || item.FollowupId || id,
                memberName: item.memberName || item.MemberName || '',
                followupDate: item.createdDate || item.CreatedDate || item.followupDate || item.FollowupDate || '',
                nextFollowupDate: item.nextFollowupDateUTC || item.NextFollowupDateUTC || item.nextFollowupDate || item.NextFollowupDate || '',
                oldStatus: item.oldStatus || item.OldStatus || '',
                newStatus: item.newStatus || item.NewStatus || '',
                status: item.newStatus || item.NewStatus || item.status || item.Status || item.responseStatus || item.ResponseStatus || '',
                remarks: item.remarks || item.Remarks || '',
                followupByName: item.followupByName || item.FollowupByName || '',
                createdAt: item.createdDate || item.CreatedDate || item.createdAt || '',
            }));

            return {
                success: true,
                data: history,
                message: `Successfully retrieved ${history.length} history records`,
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            console.error('Get BNI Followup History API Error:', error);

            await logError({
                controllerName: 'BNIFollowupApi',
                methodName: 'GetHistory',
                requestUrl: `${API_BASE_URL}/BNIFollowup/BNIFollowupHistorybyFollowupId?id=${id}`,
                requestPayload: { id },
                error
            });

            return {
                success: false,
                data: [],
                message: error instanceof Error ? error.message : 'Failed to fetch followup history',
                timestamp: new Date().toISOString(),
            };
        }
    },

    /**
     * Get BNI Member Dropdown
     * GET /api/Dropdown/BNIMemberNamelist
     */
    getBNIMemberDropdown: async (): Promise<ApiResponse<DropdownItem[]>> => {
        try {
            const token = getAuthToken();
            if (!token) {
                throw new Error('No authentication token found');
            }

            const response = await fetch(
                `${API_BASE_URL}/Dropdown/BNIMemberNamelist`,
                {
                    method: 'GET',
                    headers: createAuthHeaders(),
                }
            );

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            let itemsArray: any[] = [];

            if (Array.isArray(data)) {
                itemsArray = data;
            } else if (data && Array.isArray(data.data)) {
                itemsArray = data.data;
            }

            const items: DropdownItem[] = itemsArray.map((item: any) => ({
                id: item.id || item.Id || item.value || item.Value || 0,
                name: item.name || item.Name || item.text || item.Text || ''
            }));

            return {
                success: true,
                data: items,
                message: 'BNI Member dropdown loaded successfully',
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            console.error('Get BNI Member Dropdown API Error:', error);

            return {
                success: false,
                data: [],
                message: error instanceof Error ? error.message : 'Failed to load BNI member dropdown',
                timestamp: new Date().toISOString(),
            };
        }
    },

    /**
     * Get LOV Master Dropdown
     * GET /api/Dropdown/LovMaster?Lov_column={column}
     */
    getLovMasterDropdown: async (lovColumn: string): Promise<ApiResponse<DropdownItem[]>> => {
        try {
            const token = getAuthToken();
            if (!token) {
                throw new Error('No authentication token found');
            }

            const response = await fetch(
                `${API_BASE_URL}/Dropdown/LovMaster?Lov_column=${lovColumn}`,
                {
                    method: 'GET',
                    headers: createAuthHeaders(),
                }
            );

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            let itemsArray: any[] = [];

            if (Array.isArray(data)) {
                itemsArray = data;
            } else if (data && Array.isArray(data.data)) {
                itemsArray = data.data;
            }

            const items: DropdownItem[] = itemsArray.map((item: any) => ({
                id: item.id || item.Id || item.value || item.Value || 0,
                name: item.name || item.Name || item.text || item.Text || item.lov_Value || item.Lov_Value || '',
                code: item.code || item.Code || item.lovCode || item.LovCode || undefined
            }));

            return {
                success: true,
                data: items,
                message: `${lovColumn} dropdown loaded successfully`,
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            console.error(`Get ${lovColumn} Dropdown API Error:`, error);

            return {
                success: false,
                data: [],
                message: error instanceof Error ? error.message : `Failed to load ${lovColumn} dropdown`,
                timestamp: new Date().toISOString(),
            };
        }
    },
};

export default bniFollowupApi;
