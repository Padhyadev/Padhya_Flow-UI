import { ApiResponse } from '../types/apiTypes';
import { logError } from '../../utils/logError';

const API_BASE_URL = 'https://aj.padhyasoft.com/api';

export interface BNIMeeting {
    meetingId: number;
    memberId: number;
    memberName?: string;
    meetingType: string;
    meetingMode: string;
    meetingDateUTC: string;
    localTimeZone: string;
    meetingLocation: string;
    agenda: string;
    remarks: string;
    meetingOutcome: string;
    createdBy: number;
    lastModifiedBy: number;
    createdAt?: string;
    updatedAt?: string;
}

export interface CreateBNIMeetingRequest {
    memberId: number;
    meetingType: string;
    meetingMode: string;
    meetingDateUTC: string;
    localTimeZone: string;
    meetingLocation: string;
    agenda: string;
    remarks: string;
    meetingOutcome: string;
    createdBy: number;
}

export interface UpdateBNIMeetingRequest {
    meetingId: number;
    memberId: number;
    meetingType: string;
    meetingMode: string;
    meetingDateUTC: string;
    localTimeZone: string;
    meetingLocation: string;
    agenda: string;
    remarks: string;
    meetingOutcome: string;
    lastModifiedBy: number;
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
 * BNI Meeting API Service
 */
export const bniMeetingApi = {
    /**
     * Get all BNI meetings with pagination
     * GET /api/BNIMeeting/GetAllPage?start=0&length=100&sortColumnDir=asc
     */
    getAllMeetings: async (start: number = 0, length: number = 100, sortColumnDir: string = 'asc'): Promise<ApiResponse<BNIMeeting[]>> => {
        try {
            const token = getAuthToken();
            if (!token) {
                throw new Error('No authentication token found');
            }

            const response = await fetch(
                `${API_BASE_URL}/BNIMeeting/GetAllPage?start=${start}&length=${length}&sortColumnDir=${sortColumnDir}`,
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

            console.log('🚀 BNI Meeting GetAll API Response:', data);

            // Handle different possible response formats
            let meetingsArray: any[] = [];

            if (data && Array.isArray(data.data)) {
                meetingsArray = data.data;
            } else if (data && data.data && Array.isArray(data.data.data)) {
                meetingsArray = data.data.data;
            } else if (Array.isArray(data)) {
                meetingsArray = data;
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
                meetingsArray = findArray(data);
            }

            console.log('📦 Processed Meetings Array:', meetingsArray);

            // Map API response to our BNIMeeting format
            const meetings: BNIMeeting[] = meetingsArray.map((apiMeeting: any) => ({
                meetingId: apiMeeting.meetingId || apiMeeting.MeetingId || apiMeeting.id || apiMeeting.Id || 0,
                memberId: apiMeeting.memberId || apiMeeting.MemberId || 0,
                memberName: apiMeeting.memberName || apiMeeting.MemberName || '',
                meetingType: apiMeeting.meetingType || apiMeeting.MeetingType || '',
                meetingMode: apiMeeting.meetingMode || apiMeeting.MeetingMode || '',
                meetingDateUTC: apiMeeting.meetingDateUTC || apiMeeting.MeetingDateUTC || '',
                localTimeZone: apiMeeting.localTimeZone || apiMeeting.LocalTimeZone || '',
                meetingLocation: apiMeeting.meetingLocation || apiMeeting.MeetingLocation || '',
                agenda: apiMeeting.agenda || apiMeeting.Agenda || '',
                remarks: apiMeeting.remarks || apiMeeting.Remarks || '',
                meetingOutcome: apiMeeting.meetingOutcome || apiMeeting.MeetingOutcome || '',
                createdBy: apiMeeting.createdBy || apiMeeting.CreatedBy || 0,
                lastModifiedBy: apiMeeting.lastModifiedBy || apiMeeting.LastModifiedBy || 0,
                createdAt: apiMeeting.createdDate || apiMeeting.CreatedDate || apiMeeting.createdAt || '',
                updatedAt: apiMeeting.updatedDate || apiMeeting.UpdatedDate || apiMeeting.updatedAt || '',
            }));

            return {
                success: true,
                data: meetings,
                message: `Successfully retrieved ${meetings.length} BNI meetings`,
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            console.error('Get BNI Meetings API Error:', error);

            await logError({
                controllerName: 'BNIMeetingApi',
                methodName: 'GetAllPage',
                requestUrl: `${API_BASE_URL}/BNIMeeting/GetAllPage`,
                requestPayload: { start, length, sortColumnDir },
                error
            });

            return {
                success: false,
                data: [],
                message: error instanceof Error ? error.message : 'Failed to fetch BNI meetings',
                timestamp: new Date().toISOString(),
            };
        }
    },

    /**
     * Add New BNI Meeting
     * POST /api/BNIMeeting/Add
     */
    addMeeting: async (meetingData: any): Promise<ApiResponse<BNIMeeting>> => {
        try {
            const token = getAuthToken();
            if (!token) {
                throw new Error('No authentication token found');
            }

            const userId = getUserId();

            const requestBody = {
                MeetingId: meetingData.meetingId || 0,
                MemberId: meetingData.memberId,
                MeetingType: meetingData.meetingType,
                MeetingMode: meetingData.meetingMode,
                MeetingDateUTC: meetingData.meetingDateUTC,
                LocalTimeZone: meetingData.localTimeZone,
                MeetingLocation: meetingData.meetingLocation || '',
                Agenda: meetingData.agenda || '',
                Remarks: meetingData.remarks || '',
                MeetingOutcome: meetingData.meetingOutcome || '',
                CreatedBy: meetingData.createdBy || userId,
                LastModifiedBy: meetingData.lastModifiedBy || userId
            };

            const bodyJson = JSON.stringify(requestBody);
            console.log('🚀 API REQUEST BODY (JSON):', bodyJson);

            const response = await fetch(
                `${API_BASE_URL}/BNIMeeting/Add`,
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
                throw new Error(data.message || `Failed to add BNI meeting (Status: ${response.status})`);
            }

            const actualData = data.data || data;
            const meeting: BNIMeeting = {
                meetingId: actualData.meetingId || actualData.MeetingId || 0,
                memberId: actualData.memberId || actualData.MemberId || meetingData.memberId,
                memberName: actualData.memberName || actualData.MemberName || '',
                meetingType: actualData.meetingType || actualData.MeetingType || meetingData.meetingType,
                meetingMode: actualData.meetingMode || actualData.MeetingMode || meetingData.meetingMode,
                meetingDateUTC: actualData.meetingDateUTC || actualData.MeetingDateUTC || meetingData.meetingDateUTC,
                localTimeZone: actualData.localTimeZone || actualData.LocalTimeZone || meetingData.localTimeZone,
                meetingLocation: actualData.meetingLocation || actualData.MeetingLocation || meetingData.meetingLocation,
                agenda: actualData.agenda || actualData.Agenda || meetingData.agenda,
                remarks: actualData.remarks || actualData.Remarks || meetingData.remarks,
                meetingOutcome: actualData.meetingOutcome || actualData.MeetingOutcome || meetingData.meetingOutcome,
                createdBy: userId,
                lastModifiedBy: userId,
                createdAt: actualData.createdDate || actualData.CreatedDate || new Date().toISOString(),
                updatedAt: actualData.updatedDate || actualData.UpdatedDate || new Date().toISOString(),
            };

            return {
                success: true,
                data: meeting,
                message: 'BNI meeting created successfully',
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            console.error('Add BNI Meeting API Error:', error);

            await logError({
                controllerName: 'BNIMeetingApi',
                methodName: 'Add',
                requestUrl: `${API_BASE_URL}/BNIMeeting/Add`,
                requestPayload: meetingData,
                error
            });

            return {
                success: false,
                data: null as any,
                message: error instanceof Error ? error.message : 'Failed to create BNI meeting',
                timestamp: new Date().toISOString(),
            };
        }
    },

    /**
     * Get BNI Meeting By ID
     * GET /api/BNIMeeting/GetById?id={id}
     */
    getMeetingById: async (id: number): Promise<ApiResponse<BNIMeeting>> => {
        try {
            const token = getAuthToken();
            if (!token) {
                throw new Error('No authentication token found');
            }

            const response = await fetch(
                `${API_BASE_URL}/BNIMeeting/GetById?id=${id}`,
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

            const meeting: BNIMeeting = {
                meetingId: actualData.meetingId || actualData.MeetingId || id,
                memberId: actualData.memberId || actualData.MemberId || 0,
                memberName: actualData.memberName || actualData.MemberName || '',
                meetingType: actualData.meetingType || actualData.MeetingType || '',
                meetingMode: actualData.meetingMode || actualData.MeetingMode || '',
                meetingDateUTC: actualData.meetingDateUTC || actualData.MeetingDateUTC || '',
                localTimeZone: actualData.localTimeZone || actualData.LocalTimeZone || '',
                meetingLocation: actualData.meetingLocation || actualData.MeetingLocation || '',
                agenda: actualData.agenda || actualData.Agenda || '',
                remarks: actualData.remarks || actualData.Remarks || '',
                meetingOutcome: actualData.meetingOutcome || actualData.MeetingOutcome || '',
                createdBy: actualData.createdBy || actualData.CreatedBy || 0,
                lastModifiedBy: actualData.lastModifiedBy || actualData.LastModifiedBy || 0,
                createdAt: actualData.createdDate || actualData.CreatedDate || '',
                updatedAt: actualData.updatedDate || actualData.UpdatedDate || '',
            };

            return {
                success: true,
                data: meeting,
                message: 'BNI meeting retrieved successfully',
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            console.error('Get BNI Meeting By ID API Error:', error);

            await logError({
                controllerName: 'BNIMeetingApi',
                methodName: 'GetById',
                requestUrl: `${API_BASE_URL}/BNIMeeting/GetById?id=${id}`,
                requestPayload: { id },
                error
            });

            return {
                success: false,
                data: null as any,
                message: error instanceof Error ? error.message : 'Failed to retrieve BNI meeting',
                timestamp: new Date().toISOString(),
            };
        }
    },

    /**
     * Delete BNI Meeting
     * DELETE /api/BNIMeeting/Delete?id={id}&operatedBy={operatedBy}
     */
    deleteMeeting: async (id: number, operatedBy: number): Promise<ApiResponse<void>> => {
        try {
            const token = getAuthToken();
            if (!token) {
                throw new Error('No authentication token found');
            }

            const response = await fetch(
                `${API_BASE_URL}/BNIMeeting/Delete?id=${id}&operatedBy=${operatedBy}`,
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
                message: 'BNI meeting deleted successfully',
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            console.error('Delete BNI Meeting API Error:', error);

            await logError({
                controllerName: 'BNIMeetingApi',
                methodName: 'Delete',
                requestUrl: `${API_BASE_URL}/BNIMeeting/Delete?id=${id}&operatedBy=${operatedBy}`,
                requestPayload: { id, operatedBy },
                error
            });

            return {
                success: false,
                data: undefined,
                message: error instanceof Error ? error.message : 'Failed to delete BNI meeting',
                timestamp: new Date().toISOString(),
            };
        }
    },

    /**
     * Get BNI Member Dropdown
     * GET /api/BNIMeeting/BNIMeetingMembername
     */
    getBNIMemberDropdown: async (): Promise<ApiResponse<DropdownItem[]>> => {
        try {
            const token = getAuthToken();
            if (!token) {
                throw new Error('No authentication token found');
            }

            const response = await fetch(
                `${API_BASE_URL}/BNIMeeting/BNIMeetingMembername`,
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

export default bniMeetingApi;
