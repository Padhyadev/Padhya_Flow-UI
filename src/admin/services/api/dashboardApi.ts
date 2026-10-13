import { ApiResponse } from '../types/apiTypes';
import { logError } from '../../utils/logError';

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

export interface PendingFollowup {
    id: number;
    followupId: number;
    projectId: number;
    projectName: string;
    clientId: number;
    clientName: string;
    nextFollowupDate: string;
    remarks: string;
    clientFollowupStatus: string;
    followupByName: string;
}

export interface PendingLeaveApplication {
    leaveId: number;
    employeeId: number;
    employeeName: string;
    leaveType: string;
    fromDate: string;
    toDate: string;
    reason: string;
    status: string;
    appliedDate: string;
    totalDays: number;
}

export const dashboardApi = {
    /**
     * Get pending client followups with pagination
     * GET /api/Dashboard/PendingClientFollowup?start=0&length=100&sortColumnDir=asc
     */
    getPendingClientFollowups: async (start: number = 0, length: number = 100, sortColumnDir: string = 'asc'): Promise<ApiResponse<PendingFollowup[]>> => {
        try {
            const token = getAuthToken();
            if (!token) throw new Error('No authentication token found');

            const url = `${API_BASE_URL}/Dashboard/PendingClientFollowup?start=${start}&length=${length}&sortColumnDir=${sortColumnDir}`;
            console.log('🚀 Fetching Pending Followups:', url);

            const response = await fetch(url, {
                method: 'GET',
                headers: createAuthHeaders(),
            });

            const responseText = await response.text();
            console.log('📦 Raw Response (Followups):', responseText.substring(0, 200) + '...');

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
                const possibleKeys = ['items', 'list', 'PendingFollowups', 'pendingFollowups'];
                for (const key of possibleKeys) {
                    if (Array.isArray(data[key])) {
                        itemsArray = data[key];
                        break;
                    }
                }
            }

            console.log('✅ Found items count:', itemsArray.length);

            const followups: PendingFollowup[] = itemsArray.map((item: any) => ({
                id: item.id || item.Id || item.followupId || item.FollowupId || 0,
                followupId: item.followupId || item.FollowupId || 0,
                projectId: item.projectId || item.ProjectId || 0,
                projectName: item.projectName || item.ProjectName || '',
                clientId: item.clientId || item.ClientId || 0,
                clientName: item.clientName || item.ClientName || '',
                nextFollowupDate: item.nextFollowupDate || item.NextFollowupDate || '',
                remarks: item.remarks || item.Remarks || '',
                clientFollowupStatus: item.clientFollowupStatus || item.ClientFollowupStatus || '',
                followupByName: item.followupByName || item.FollowupByName || '',
            }));

            return {
                success: true,
                data: followups,
                message: `Successfully retrieved ${followups.length} pending followups`,
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            console.error('❌ Get Pending Followups Error:', error);
            return {
                success: false,
                data: [],
                message: error instanceof Error ? error.message : 'Failed to fetch pending followups',
                timestamp: new Date().toISOString(),
            };
        }
    },

    /**
     * Get employee approved leave history
     * GET /api/Dashboard/EmployeeApprovedLeaveHistory?year={year}&employeeId={employeeId}&leaveTypeId={leaveTypeId}
     */
    getEmployeeApprovedLeaveHistory: async (year: number, employeeId: number = 0, leaveTypeId: number = 0): Promise<ApiResponse<any[]>> => {
        try {
            const token = getAuthToken();
            if (!token) throw new Error('No authentication token found');

            const url = `${API_BASE_URL}/Dashboard/EmployeeApprovedLeaveHistory?Year=${year}&EmployeeId=${employeeId}&LeaveTypeId=${leaveTypeId}`;
            console.log('🚀 Fetching Leave History:', url);

            const response = await fetch(url, {
                method: 'GET',
                headers: createAuthHeaders(),
            });

            const responseText = await response.text();
            console.log('📦 Raw Response (Leaves):', responseText.substring(0, 200) + '...');

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

            let itemsArray: any[] = [];
            if (Array.isArray(data)) {
                itemsArray = data;
            } else if (data && Array.isArray(data.data)) {
                itemsArray = data.data;
            } else if (data && data.data && Array.isArray(data.data.data)) {
                itemsArray = data.data.data;
            } else if (data && typeof data === 'object') {
                const possibleKeys = [
                    'items', 'list',
                    'LeaveHistory', 'leaveHistory',
                    'ApprovedLeaveHistory', 'approvedLeaveHistory',
                    'History', 'history',
                    'ApprovedLeaves', 'approvedLeaves',
                    'data'
                ];
                for (const key of possibleKeys) {
                    if (Array.isArray(data[key])) {
                        itemsArray = data[key];
                        break;
                    }
                }

                // If still empty, look for ANY array property
                if (itemsArray.length === 0) {
                    const keys = Object.keys(data);
                    for (const key of keys) {
                        if (Array.isArray(data[key]) && data[key].length > 0) {
                            itemsArray = data[key];
                            break;
                        }
                    }
                }
            }

            console.log('✅ Found leaves count:', itemsArray.length);

            return {
                success: true,
                data: itemsArray,
                message: 'Successfully retrieved leave history',
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            console.error('❌ Get Leave History Error:', error);
            return {
                success: false,
                data: [],
                message: error instanceof Error ? error.message : 'Failed to fetch leave history',
                timestamp: new Date().toISOString(),
            };
        }
    },

    /**
     * Get pending leave applications
     * GET /api/Dashboard/PendingLeaveApplications?start=0&length=100&sortColumnDir=asc
     */
    getPendingLeaveApplications: async (start: number = 0, length: number = 100, sortColumnDir: string = 'asc'): Promise<ApiResponse<PendingLeaveApplication[]>> => {
        try {
            const token = getAuthToken();
            if (!token) throw new Error('No authentication token found');

            const url = `${API_BASE_URL}/Dashboard/PendingLeaveApplications?start=${start}&length=${length}&sortColumnDir=${sortColumnDir}`;
            console.log('🚀 Fetching Pending Leaves:', url);

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

            let itemsArray: any[] = [];
            if (Array.isArray(data)) {
                itemsArray = data;
            } else if (data && Array.isArray(data.data)) {
                itemsArray = data.data;
            } else if (data && data.data && Array.isArray(data.data.data)) {
                itemsArray = data.data.data;
            } else if (data && typeof data === 'object') {
                // Try to find any array property that might contain our data
                const possibleKeys = [
                    'items', 'list', 'data',
                    'PendingLeaveApplications', 'pendingLeaveApplications',
                    'leaves', 'Leaves',
                    'PendingLeaves', 'pendingLeaves'
                ];

                for (const key of possibleKeys) {
                    if (data[key] && Array.isArray(data[key])) {
                        itemsArray = data[key];
                        break;
                    }
                }

                // If still empty, look for ANY array property
                if (itemsArray.length === 0) {
                    const keys = Object.keys(data);
                    for (const key of keys) {
                        if (Array.isArray(data[key]) && data[key].length > 0) {
                            itemsArray = data[key];
                            break;
                        }
                    }
                }
            }


            const leaves: PendingLeaveApplication[] = itemsArray.map((item: any) => ({
                leaveId: item.leaveApplicationId || item.LeaveApplicationId || item.leaveId || item.LeaveId || item.id || 0,
                employeeId: item.employeeId || item.EmployeeId || 0,
                employeeName: item.employeeName || item.EmployeeName || '',
                leaveType: item.leaveName || item.LeaveName || item.leaveType || item.LeaveType || '',
                fromDate: item.fromDate || item.FromDate || '',
                toDate: item.toDate || item.ToDate || '',
                reason: item.reason || item.Reason || '',
                status: item.status || item.Status || 'Pending',
                appliedDate: item.appliedDate || item.AppliedDate || '',
                totalDays: item.totalDays || item.TotalDays || 0
            }));

            // Debug: Log full data array being returned
            console.log('🎯 FULL LEAVES DATA ARRAY:', JSON.stringify(leaves, null, 2));
            if (leaves.length > 0) {
                console.log('🎯 First leave totalDays value:', leaves[0].totalDays, 'Type:', typeof leaves[0].totalDays);
            }

            return {
                success: true,
                data: leaves,
                message: `Successfully retrieved ${leaves.length} pending leave applications`,
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            console.error('❌ Get Pending Leaves Error:', error);
            return {
                success: false,
                data: [],
                message: error instanceof Error ? error.message : 'Failed to fetch pending leave applications',
                timestamp: new Date().toISOString(),
            };
        }
    },

    /**
     * Get pending BNI followups
     * GET /api/Dashboard/PendingBNIFollowups?start=0&length=100&sortColumnDir=asc
     */
    getPendingBNIFollowups: async (start: number = 0, length: number = 100, sortColumnDir: string = 'asc'): Promise<ApiResponse<any[]>> => {
        try {
            const token = getAuthToken();
            if (!token) throw new Error('No authentication token found');

            const url = `${API_BASE_URL}/Dashboard/PendingBNIFollowups?start=${start}&length=${length}&sortColumnDir=${sortColumnDir}`;
            console.log('🚀 Fetching Pending BNI Followups:', url);

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

            let itemsArray: any[] = [];
            if (Array.isArray(data)) {
                itemsArray = data;
            } else if (data && Array.isArray(data.data)) {
                itemsArray = data.data;
            } else if (data && data.data && Array.isArray(data.data.data)) {
                itemsArray = data.data.data;
            } else if (data && typeof data === 'object') {
                const possibleKeys = ['items', 'list', 'data'];
                for (const key of possibleKeys) {
                    if (Array.isArray(data[key])) {
                        itemsArray = data[key];
                        break;
                    }
                }
            }

            return {
                success: true,
                data: itemsArray,
                message: `Successfully retrieved ${itemsArray.length} pending BNI followups`,
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            console.error('❌ Get Pending BNI Followups Error:', error);
            return {
                success: false,
                data: [],
                message: error instanceof Error ? error.message : 'Failed to fetch pending BNI followups',
                timestamp: new Date().toISOString(),
            };
        }
    },

    /**
     * Get next 5 days BNI meetings
     * GET /api/Dashboard/Next5daysBNIMeeting?start=0&length=100&sortColumnDir=asc
     */
    getNext5DaysBNIMeetings: async (start: number = 0, length: number = 100, sortColumnDir: string = 'asc'): Promise<ApiResponse<any[]>> => {
        try {
            const token = getAuthToken();
            if (!token) throw new Error('No authentication token found');

            const url = `${API_BASE_URL}/Dashboard/Next5daysBNIMeeting?start=${start}&length=${length}&sortColumnDir=${sortColumnDir}`;
            console.log('🚀 Fetching Next 5 Days BNI Meetings:', url);

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

            let itemsArray: any[] = [];
            if (Array.isArray(data)) {
                itemsArray = data;
            } else if (data && Array.isArray(data.data)) {
                itemsArray = data.data;
            } else if (data && data.data && Array.isArray(data.data.data)) {
                itemsArray = data.data.data;
            } else if (data && typeof data === 'object') {
                const possibleKeys = ['items', 'list', 'data'];
                for (const key of possibleKeys) {
                    if (Array.isArray(data[key])) {
                        itemsArray = data[key];
                        break;
                    }
                }
            }

            return {
                success: true,
                data: itemsArray,
                message: `Successfully retrieved ${itemsArray.length} next 5 days BNI meetings`,
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            console.error('❌ Get Next 5 Days BNI Meetings Error:', error);
            return {
                success: false,
                data: [],
                message: error instanceof Error ? error.message : 'Failed to fetch next 5 days BNI meetings',
                timestamp: new Date().toISOString(),
            };
        }
    }
};
