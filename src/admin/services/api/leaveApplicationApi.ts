import { ApiResponse } from '../types/apiTypes';
import { logError } from '../../utils/logError';

// const API_BASE_URL = 'https://localhost:7087/api';
const API_BASE_URL = 'https://aj.padhyasoft.com/api';

export interface LeaveApplication {
    leaveApplicationId: number;
    employeeId: number;
    leaveTypeId: number;
    fromDate: string;
    toDate: string;
    totalDays: number;
    reason: string;
    status: string;
    approvedBy: number;
    approvalRemarks: string;
    createdBy?: number;
    lastModifiedBy?: number;

    // UI Helpers (if returned by backend joins)
    employeeName?: string;
    leaveTypeName?: string;
    approvedByName?: string;
}

const getUserId = (): number => {
    try {
        const userStr = localStorage.getItem('admin_user');
        if (userStr) {
            const user = JSON.parse(userStr);
            return Number(user.id || 0);
        }
    } catch (e) {
        console.warn('Failed to parse admin_user', e);
    }
    return 0;
};

export const leaveApplicationApi = {
    /**
     * Get All Leave Applications (Paginated)
     * GET /LeaveApplications/GetAllPage?start={start}&length={length}&sortColumnDir={dir}...
     */
    getAllLeaveApplicationsPage: async (
        start: number = 0,
        length: number = 10,
        sortColumn: string = '',
        sortColumnDir: string = 'asc',
        searchValue: string = ''
    ): Promise<ApiResponse<LeaveApplication[]>> => {
        try {
            const userId = getUserId();
            const queryParams = new URLSearchParams({
                start: start.toString(),
                length: length.toString(),
                sortColumn: sortColumn,
                sortColumnDir: sortColumnDir,
                searchValue: searchValue,
                userid: userId.toString()
            });

            const response = await fetch(`${API_BASE_URL}/LeaveApplications/GetAllPage?${queryParams.toString()}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('admin_token') || localStorage.getItem('token') || ''}`
                }
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const errorMessage = errorData.message || `Error ${response.status}: ${response.statusText}`;
                return {
                    success: false,
                    message: errorMessage,
                    data: [],
                    timestamp: new Date().toISOString()
                };
            }

            const data = await response.json();

            let items: any[] = [];
            let totalRecords = 0;

            // Handle various data wrapper structures
            if (Array.isArray(data)) {
                items = data;
                totalRecords = data.length;
            } else if (data && Array.isArray(data.data)) {
                items = data.data;
                totalRecords = data.recordsTotal || data.data.length;
            } else if (data && data.data && Array.isArray(data.data.data)) {
                items = data.data.data;
                totalRecords = data.data.recordsTotal || items.length;
            }

            return {
                success: true,
                data: items,
                message: 'Success',
                timestamp: new Date().toISOString(),
                totalRecords: totalRecords
            } as any;

        } catch (error) {
            await logError({
                controllerName: 'LeaveApplicationApi',
                methodName: 'getAllLeaveApplicationsPage',
                requestUrl: `${API_BASE_URL}/LeaveApplications/GetAllPage`,
                requestPayload: { start, length, sortColumn },
                error: error
            });
            return {
                success: false,
                message: 'Network error occurred',
                data: [],
                timestamp: new Date().toISOString()
            };
        }
    },

    addLeaveApplication: async (payload: Partial<LeaveApplication>): Promise<ApiResponse<any>> => {
        try {
            // Clean payload: convert empty strings to null for nullable/DateTime fields
            const cleanedPayload = Object.fromEntries(
                Object.entries(payload).map(([key, value]) => [
                    key,
                    value === '' ? null : value
                ])
            );

            const response = await fetch(`${API_BASE_URL}/LeaveApplications/Add`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('admin_token') || localStorage.getItem('token') || ''}`
                },
                body: JSON.stringify(cleanedPayload)
            });

            const responseData = await response.json();

            if (!response.ok) {
                console.error('❌ API 400 ERROR RAW RESPONSE:', responseData);
                return {
                    success: false,
                    message: responseData.message || `Error ${response.status}`,
                    data: null,
                    timestamp: new Date().toISOString()
                };
            }

            return {
                success: true,
                data: responseData.data || responseData,
                message: responseData.message || 'Success',
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            await logError({
                controllerName: 'LeaveApplicationApi',
                methodName: 'addLeaveApplication',
                requestUrl: `${API_BASE_URL}/LeaveApplications/Add`,
                requestPayload: payload,
                error: error
            });
            return {
                success: false,
                message: 'Network error occurred',
                data: null,
                timestamp: new Date().toISOString()
            };
        }
    },

    /**
     * Update Leave Application (Alias for Add as per backend pattern)
     * POST /LeaveApplications/Add
     */
    updateLeaveApplication: async (payload: Partial<LeaveApplication>): Promise<ApiResponse<any>> => {
        return leaveApplicationApi.addLeaveApplication(payload);
    },

    getLeaveApplicationById: async (id: number): Promise<ApiResponse<LeaveApplication>> => {
        try {
            const response = await fetch(`${API_BASE_URL}/LeaveApplications/GetById?id=${id}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('admin_token') || localStorage.getItem('token') || ''}`
                }
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                return {
                    success: false,
                    message: errorData.message || `Error ${response.status}`,
                    data: {} as LeaveApplication,
                    timestamp: new Date().toISOString()
                };
            }

            const data = await response.json();
            return {
                success: true,
                data: data.data || data, // Extract nested data for edit form
                message: 'Success',
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            await logError({
                controllerName: 'LeaveApplicationApi',
                methodName: 'getLeaveApplicationById',
                requestUrl: `${API_BASE_URL}/LeaveApplications/GetById?id=${id}`,
                requestPayload: { id },
                error: error
            });
            return {
                success: false,
                message: 'Network error occurred',
                data: {} as LeaveApplication,
                timestamp: new Date().toISOString()
            };
        }
    },

    /**
    * Delete Leave Application
    * DELETE /LeaveApplications/Delete?id={id}&operatedBy={userId}
    */
    deleteLeaveApplication: async (id: number, operatedBy?: number): Promise<ApiResponse<null>> => {
        try {
            let userId = operatedBy;
            // If not provided, try to get from localStorage (fallback)
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

            const deleteUrl = `${API_BASE_URL}/LeaveApplications/Delete?${queryParams.toString()}`;
            console.log('🗑️ DELETING LEAVE APPLICATION AT:', deleteUrl);

            const response = await fetch(deleteUrl, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('admin_token') || localStorage.getItem('token') || ''}`
                }
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                return {
                    success: false,
                    message: errorData.message || `Error ${response.status}`,
                    data: null,
                    timestamp: new Date().toISOString()
                };
            }

            return {
                success: true,
                message: 'Deleted successfully',
                data: null,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            await logError({
                controllerName: 'LeaveApplicationApi',
                methodName: 'deleteLeaveApplication',
                requestUrl: `${API_BASE_URL}/LeaveApplications/Delete`,
                requestPayload: { id, operatedBy },
                error: error
            });
            return {
                success: false,
                message: 'Network error occurred',
                data: null,
                timestamp: new Date().toISOString()
            };
        }
    }
};
