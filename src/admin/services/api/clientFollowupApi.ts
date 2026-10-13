import { ApiResponse } from '../types/apiTypes';
import { logError } from '../../utils/logError';

const API_BASE_URL = 'https://aj.padhyasoft.com/api';

export interface ClientFollowup {
    followupId: number;
    projectId: number;
    projectName?: string;
    nextFollowupDate: string;
    clientFollowupStatus: string;
    status?: string; // For listing display
    remarks: string;
    followupBy: number;
    followupByName?: string;
    createdBy: number;
    lastModifiedBy: number;
    clientId: number;
    createdAt?: string;
    updatedAt?: string;
}

export interface ClientFollowupStatusHistory {
    id: number;
    followupId: number;
    projectName?: string;
    followupDate: string;
    nextFollowupDate?: string;
    oldStatus?: string;
    newStatus?: string;
    status: string;
    remarks: string;
    followupByName?: string;
    createdAt?: string;
}

export interface CreateClientFollowupRequest {
    projectId: number;
    projectName: string;
    clientId: number;
    statusId: number;
    nextFollowupDate: string;
    clientFollowupStatus: string;
    remarks: string;
    followupBy: number;
    followupByName: string;
    createdBy: number;
}

export interface UpdateClientFollowupRequest {
    followupId: number;
    projectId: number;
    projectName: string;
    clientId: number;
    statusId: number;
    nextFollowupDate: string;
    clientFollowupStatus: string;
    remarks: string;
    followupByName: string;
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
 * Client Followup API Service
 */
export const clientFollowupApi = {
    /**
     * Get all client followups with pagination
     * GET /api/ClientFollowup/GetAllpage?start=0&length=100&sortColumnDir=asc
     */
    getAllClientFollowupsPage: async (start: number = 0, length: number = 100, sortColumnDir: string = 'asc'): Promise<ApiResponse<ClientFollowup[]>> => {
        try {
            const token = getAuthToken();
            if (!token) {
                throw new Error('No authentication token found');
            }

            const response = await fetch(
                `${API_BASE_URL}/ClientFollowup/GetAllpage?start=${start}&length=${length}&sortColumnDir=${sortColumnDir}`,
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

            console.log('🚀 Client Followup GetAll API Response:', data);

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

            // Map API response to our ClientFollowup format
            const followups: ClientFollowup[] = followupsArray.map((apiFollowup: any) => {
                // Prioritize 'status' or 'Status' for display
                const statusValue = apiFollowup.status || apiFollowup.Status || apiFollowup.clientFollowupStatus || apiFollowup.ClientFollowupStatus || '';

                return {
                    followupId: apiFollowup.followupId || apiFollowup.FollowupId || apiFollowup.id || apiFollowup.Id || 0,
                    projectId: apiFollowup.projectId || apiFollowup.ProjectId || 0,
                    projectName: apiFollowup.projectName || apiFollowup.ProjectName || '',
                    clientId: apiFollowup.clientId || apiFollowup.ClientId || 0,
                    nextFollowupDate: apiFollowup.nextFollowupDate || apiFollowup.NextFollowupDate || '',
                    clientFollowupStatus: statusValue,
                    status: statusValue,
                    remarks: apiFollowup.remarks || apiFollowup.Remarks || '',
                    followupBy: apiFollowup.followupBy || apiFollowup.FollowupBy || 0,
                    followupByName: apiFollowup.followupByName || apiFollowup.FollowupByName || '',
                    createdBy: apiFollowup.createdBy || apiFollowup.CreatedBy || 0,
                    lastModifiedBy: apiFollowup.lastModifiedBy || apiFollowup.LastModifiedBy || 0,
                    createdAt: apiFollowup.createdDate || apiFollowup.CreatedDate || apiFollowup.createdAt || '',
                    updatedAt: apiFollowup.updatedDate || apiFollowup.UpdatedDate || apiFollowup.updatedAt || '',
                };
            });

            return {
                success: true,
                data: followups,
                message: `Successfully retrieved ${followups.length} client followups`,
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            console.error('Get Client Followups API Error:', error);

            await logError({
                controllerName: 'ClientFollowupApi',
                methodName: 'GetAllpage',
                requestUrl: `${API_BASE_URL}/ClientFollowup/GetAllpage`,
                requestPayload: { start, length, sortColumnDir },
                error
            });

            return {
                success: false,
                data: [],
                message: error instanceof Error ? error.message : 'Failed to fetch client followups',
                timestamp: new Date().toISOString(),
            };
        }
    },

    /**
     * Add New Client Followup
     * POST /api/ClientFollowup/Add
     */
    addClientFollowup: async (followupData: CreateClientFollowupRequest): Promise<ApiResponse<ClientFollowup>> => {
        try {
            const token = getAuthToken();
            if (!token) {
                throw new Error('No authentication token found');
            }

            const userId = getUserId();

            // Helper to convert empty strings to null for the API
            const cleanValue = (val: any) => (val === '' || val === undefined) ? null : val;

            const requestBody = {
                FollowupId: 0,
                ProjectId: followupData.projectId,
                ProjectName: followupData.projectName || '',
                ClientId: followupData.clientId,
                NextFollowupDate: cleanValue(followupData.nextFollowupDate),
                Status: followupData.statusId.toString(),
                Followup: followupData.clientFollowupStatus || '', // Keep name here for display
                ClientFollowupStatus: followupData.statusId.toString(), // Send number (ID) as requested
                Remarks: followupData.remarks || '',
                FollowupBy: userId,
                FollowupName: followupData.followupByName || '',
                CreatedBy: userId
            };

            const bodyJson = JSON.stringify(requestBody);
            console.log('🚀 API REQUEST BODY (JSON):', bodyJson);

            const response = await fetch(
                `${API_BASE_URL}/ClientFollowup/Add?ClientId=${followupData.clientId}&ProjectId=${followupData.projectId}`,
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
                throw new Error(data.message || `Failed to add client followup (Status: ${response.status})`);
            }

            const actualData = data.data || data;
            const followup: ClientFollowup = {
                followupId: actualData.followupId || actualData.FollowupId || 0,
                projectId: actualData.projectId || actualData.ProjectId || followupData.projectId,
                projectName: actualData.projectName || actualData.ProjectName || '',
                clientId: actualData.clientId || actualData.ClientId || followupData.clientId,
                nextFollowupDate: actualData.nextFollowupDate || actualData.NextFollowupDate || followupData.nextFollowupDate,
                clientFollowupStatus: actualData.clientFollowupStatus || actualData.ClientFollowupStatus || followupData.clientFollowupStatus,
                remarks: actualData.remarks || actualData.Remarks || followupData.remarks,
                followupBy: actualData.followupBy || actualData.FollowupBy || userId,
                followupByName: actualData.followupByName || actualData.FollowupByName || '',
                createdBy: userId,
                lastModifiedBy: userId,
                createdAt: actualData.createdDate || actualData.CreatedDate || new Date().toISOString(),
                updatedAt: actualData.updatedDate || actualData.UpdatedDate || new Date().toISOString(),
            };

            return {
                success: true,
                data: followup,
                message: 'Client followup created successfully',
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            console.error('Add Client Followup API Error:', error);

            await logError({
                controllerName: 'ClientFollowupApi',
                methodName: 'Add',
                requestUrl: `${API_BASE_URL}/ClientFollowup/Add`,
                requestPayload: followupData,
                error
            });

            return {
                success: false,
                data: null as any,
                message: error instanceof Error ? error.message : 'Failed to create client followup',
                timestamp: new Date().toISOString(),
            };
        }
    },

    /**
     * Get Client Followup By ID
     * GET /api/ClientFollowup/GetById?id={id}
     */
    getClientFollowupById: async (id: number): Promise<ApiResponse<ClientFollowup>> => {
        try {
            const token = getAuthToken();
            if (!token) {
                throw new Error('No authentication token found');
            }

            const response = await fetch(
                `${API_BASE_URL}/ClientFollowup/GetById?id=${id}`,
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

            const followup: ClientFollowup = {
                followupId: actualData.followupId || actualData.FollowupId || id,
                projectId: actualData.projectId || actualData.ProjectId || 0,
                projectName: actualData.projectName || actualData.ProjectName || '',
                clientId: actualData.clientId || actualData.ClientId || 0,
                nextFollowupDate: actualData.nextFollowupDate || actualData.NextFollowupDate || '',
                clientFollowupStatus: actualData.clientFollowupStatus || actualData.ClientFollowupStatus || '',
                remarks: actualData.remarks || actualData.Remarks || '',
                followupBy: actualData.followupBy || actualData.FollowupBy || 0,
                followupByName: actualData.followupByName || actualData.FollowupByName || '',
                createdBy: actualData.createdBy || actualData.CreatedBy || 0,
                lastModifiedBy: actualData.lastModifiedBy || actualData.LastModifiedBy || 0,
                createdAt: actualData.createdDate || actualData.CreatedDate || '',
                updatedAt: actualData.updatedDate || actualData.UpdatedDate || '',
            };

            return {
                success: true,
                data: followup,
                message: 'Client followup retrieved successfully',
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            console.error('Get Client Followup By ID API Error:', error);

            await logError({
                controllerName: 'ClientFollowupApi',
                methodName: 'GetById',
                requestUrl: `${API_BASE_URL}/ClientFollowup/GetById?id=${id}`,
                requestPayload: { id },
                error
            });

            return {
                success: false,
                data: null as any,
                message: error instanceof Error ? error.message : 'Failed to retrieve client followup',
                timestamp: new Date().toISOString(),
            };
        }
    },

    /**
     * Update Client Followup (Edit mode - only specific fields)
     * POST /api/ClientFollowup/Add (with followupId for update)
     */
    updateClientFollowup: async (followupData: UpdateClientFollowupRequest): Promise<ApiResponse<ClientFollowup>> => {
        try {
            const token = getAuthToken();
            if (!token) {
                throw new Error('No authentication token found');
            }

            const userId = getUserId();
            const cleanValue = (val: any) => (val === '' || val === undefined) ? null : val;

            const requestBody = {
                FollowupId: followupData.followupId,
                ProjectId: followupData.projectId,
                ProjectName: followupData.projectName || '',
                ClientId: followupData.clientId,
                NextFollowupDate: cleanValue(followupData.nextFollowupDate),
                Status: followupData.statusId.toString(),
                Followup: followupData.clientFollowupStatus || '',
                ClientFollowupStatus: followupData.statusId.toString(),
                Remarks: followupData.remarks || '',
                FollowupBy: userId,
                FollowupName: followupData.followupByName || '',
                LastModifiedBy: userId
            };

            console.log('🚀 API REQUEST: Update Client Followup (using Add API)', {
                url: `${API_BASE_URL}/ClientFollowup/Add?ClientId=${followupData.clientId}&ProjectId=${followupData.projectId}`,
                body: requestBody
            });

            const response = await fetch(
                `${API_BASE_URL}/ClientFollowup/Add?ClientId=${followupData.clientId}&ProjectId=${followupData.projectId}`,
                {
                    method: 'POST',
                    headers: createAuthHeaders(),
                    body: JSON.stringify(requestBody),
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

            if (!response.ok) {
                throw new Error(data.message || `Failed to update client followup (Status: ${response.status})`);
            }

            const actualData = data.data || data;
            const followup: ClientFollowup = {
                followupId: actualData.followupId || actualData.FollowupId || followupData.followupId,
                projectId: actualData.projectId || actualData.ProjectId || 0,
                projectName: actualData.projectName || actualData.ProjectName || '',
                clientId: actualData.clientId || actualData.ClientId || 0,
                nextFollowupDate: actualData.nextFollowupDate || actualData.NextFollowupDate || followupData.nextFollowupDate,
                clientFollowupStatus: actualData.clientFollowupStatus || actualData.ClientFollowupStatus || followupData.clientFollowupStatus,
                remarks: actualData.remarks || actualData.Remarks || followupData.remarks,
                followupBy: actualData.followupBy || actualData.FollowupBy || userId,
                followupByName: actualData.followupByName || actualData.FollowupByName || '',
                createdBy: actualData.createdBy || actualData.CreatedBy || 0,
                lastModifiedBy: userId,
                createdAt: actualData.createdDate || actualData.CreatedDate || '',
                updatedAt: new Date().toISOString(),
            };

            return {
                success: true,
                data: followup,
                message: 'Client followup updated successfully',
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            console.error('Update Client Followup API Error:', error);

            await logError({
                controllerName: 'ClientFollowupApi',
                methodName: 'Update',
                requestUrl: `${API_BASE_URL}/ClientFollowup/Add`,
                requestPayload: followupData,
                error
            });

            return {
                success: false,
                data: null as any,
                message: error instanceof Error ? error.message : 'Failed to update client followup',
                timestamp: new Date().toISOString(),
            };
        }
    },

    /**
     * Get Client Followup Status History
     * GET /api/ClientFollowup/GetAllClientFollowupStatusHistory?id={id}
     */
    getClientFollowupStatusHistory: async (id: number): Promise<ApiResponse<ClientFollowupStatusHistory[]>> => {
        try {
            const token = getAuthToken();
            if (!token) {
                throw new Error('No authentication token found');
            }

            const response = await fetch(
                `${API_BASE_URL}/ClientFollowup/GetAllClientFollowupStatusHistory?id=${id}`,
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

            const history: ClientFollowupStatusHistory[] = historyArray.map((item: any) => ({
                id: item.id || item.Id || 0,
                followupId: item.followupId || item.FollowupId || id,
                projectName: item.projectName || item.ProjectName || '',
                followupDate: item.followupDate || item.FollowupDate || '',
                nextFollowupDate: item.nextFollowupDate || item.NextFollowupDate || '',
                oldStatus: item.oldStatus || item.OldStatus || '',
                newStatus: item.newStatus || item.NewStatus || '',
                status: item.status || item.Status || item.newStatus || item.NewStatus || item.clientFollowupStatus || item.ClientFollowupStatus || '',
                remarks: item.remarks || item.Remarks || '',
                followupByName: item.followupByName || item.FollowupByName || '',
                createdAt: item.createdDate || item.CreatedDate || item.createdAt || '',
            }));

            return {
                success: true,
                data: history,
                message: `Successfully retrieved ${history.length} status history records`,
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            console.error('Get Client Followup Status History API Error:', error);

            await logError({
                controllerName: 'ClientFollowupApi',
                methodName: 'GetStatusHistory',
                requestUrl: `${API_BASE_URL}/ClientFollowup/GetAllClientFollowupStatusHistory?id=${id}`,
                requestPayload: { id },
                error
            });

            return {
                success: false,
                data: [],
                message: error instanceof Error ? error.message : 'Failed to fetch status history',
                timestamp: new Date().toISOString(),
            };
        }
    },
};

export default clientFollowupApi;
