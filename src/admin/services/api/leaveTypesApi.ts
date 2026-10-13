import { ApiResponse } from '../types/apiTypes';
import { logError } from '../../utils/logError';

const API_BASE_URL = 'https://aj.padhyasoft.com/api';

export interface LeaveType {
    leaveTypeId: number;
    leaveCode: string;
    leaveName: string;
    yearlyQuota: number;
    isCarryForward: boolean;
    isPaid: boolean;
    createdBy?: number;
    lastModifiedBy?: number;
}

export const leaveTypesApi = {
    /**
     * Get all leave types with page
     * GET /api/LeaveTypes/GetAllPage?start=...
     */
    getAllLeaveTypesPage: async (start: number = 0, length: number = 100, sortColumnDir: string = 'asc'): Promise<ApiResponse<LeaveType[]>> => {
        try {
            const token = localStorage.getItem('admin_token');
            if (!token) throw new Error('No authentication token found');

            const response = await fetch(
                `${API_BASE_URL}/LeaveTypes/GetAllPage?start=${start}&length=${length}&sortColumnDir=${sortColumnDir}`,
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                }
            );

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();

            let items: any[] = [];
            // Handle various data wrapper structures
            if (Array.isArray(data)) {
                items = data;
            } else if (data && Array.isArray(data.data)) {
                items = data.data;
            } else if (data && data.data && Array.isArray(data.data.data)) {
                items = data.data.data;
            }

            return {
                success: true,
                data: items,
                message: 'Leave Types retrieved successfully',
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('Get Leave Types API Error:', error);
            await logError({
                controllerName: 'LeaveTypesApi',
                methodName: 'GetAll',
                requestUrl: `${API_BASE_URL}/LeaveTypes/GetAllPage`,
                requestPayload: { start, length, sortColumnDir },
                error
            });
            return {
                success: false,
                data: [],
                message: error instanceof Error ? error.message : 'Failed to fetch leave types',
                timestamp: new Date().toISOString()
            };
        }
    },

    /**
     * Add/Update Leave Type
     * POST /api/LeaveTypes/Add
     */
    addLeaveType: async (leaveTypeData: Partial<LeaveType>): Promise<ApiResponse<LeaveType>> => {
        try {
            const token = localStorage.getItem('admin_token');
            if (!token) throw new Error('No authentication token found');

            const response = await fetch(
                `${API_BASE_URL}/LeaveTypes/Add`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(leaveTypeData),
                }
            );

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Failed to save leave type (Status: ${response.status})`);
            }

            const data = await response.json();
            const resultData = data.data || data;

            return {
                success: true,
                data: resultData,
                message: 'Leave Type saved successfully',
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('Add Leave Type API Error:', error);
            await logError({
                controllerName: 'LeaveTypesApi',
                methodName: 'Add',
                requestUrl: `${API_BASE_URL}/LeaveTypes/Add`,
                requestPayload: leaveTypeData,
                error
            });
            return {
                success: false,
                data: null as any,
                message: error instanceof Error ? error.message : 'Failed to save leave type',
                timestamp: new Date().toISOString()
            };
        }
    },

    /**
     * Get Leave Type By ID
     * GET /api/LeaveTypes/GetById?id={id}
     */
    getLeaveTypeById: async (id: number): Promise<ApiResponse<LeaveType>> => {
        try {
            const token = localStorage.getItem('admin_token');
            if (!token) throw new Error('No authentication token found');

            const response = await fetch(
                `${API_BASE_URL}/LeaveTypes/GetById?id=${id}`,
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                }
            );

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `HTTP ${response.status}`);
            }

            const data = await response.json();
            return {
                success: true,
                data: data.data || data,
                message: 'Leave Type retrieved successfully',
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('Get Leave Type By ID API Error:', error);
            return {
                success: false,
                data: null as any,
                message: error instanceof Error ? error.message : 'Failed to retrieve leave type',
                timestamp: new Date().toISOString()
            };
        }
    },

    /**
     * Delete Leave Type
     * DELETE /api/LeaveTypes/Delete?id={id}&operatedBy={userId}
     */
    deleteLeaveType: async (id: number, operatedBy?: number): Promise<ApiResponse<null>> => {
        try {
            const token = localStorage.getItem('admin_token');
            if (!token) throw new Error('No authentication token found');

            let userId = operatedBy;
            if (!userId) {
                try {
                    const userStr = localStorage.getItem('admin_user');
                    if (userStr) {
                        const user = JSON.parse(userStr);
                        userId = user.id;
                    }
                } catch (e) {
                    console.warn('Failed to parse admin_user from localStorage', e);
                }
            }

            const queryParams = new URLSearchParams({
                id: id.toString(),
                operatedBy: (userId || 0).toString()
            });

            const response = await fetch(
                `${API_BASE_URL}/LeaveTypes/Delete?${queryParams.toString()}`,
                {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                }
            );

            if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                throw new Error(data.message || `HTTP ${response.status}: ${response.statusText}`);
            }

            return {
                success: true,
                data: null,
                message: 'Leave Type deleted successfully',
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('Delete Leave Type API Error:', error);
            return {
                success: false,
                data: null,
                message: error instanceof Error ? error.message : 'Failed to delete leave type',
                timestamp: new Date().toISOString()
            };
        }
    }
};
