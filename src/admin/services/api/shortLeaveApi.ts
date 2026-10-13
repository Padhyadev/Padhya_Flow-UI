import { ApiResponse } from '../types/apiTypes';
import { logError } from '../../utils/logError';

const API_BASE_URL = 'https://aj.padhyasoft.com/api';

export interface ShortLeave {
    id: string;
    shortLeaveId?: number;
    employeeId: number;
    employeeName?: string;
    leaveDate: string;
    fromTime: string;
    toTime: string;
    totalMinutes: number;
    reason: string;
    status: string;
    approvedBy?: number;
    approvedDate?: string;
    approvedFrom?: string;
    approvalRemarks?: string;
    createdBy: number;
    lastModifiedBy: number;
    createdAt?: string;
    updatedAt?: string;
}

export interface CreateShortLeaveRequest {
    employeeId: number;
    employeeName?: string;
    leaveDate: string;
    fromTime: string;
    toTime: string;
    totalMinutes: number;
    reason: string;
    status: string;
    leaveStatus?: string;
    approvalRemarks?: string;
    createdBy?: number;
    lastModifiedBy?: number;
}

export interface UpdateShortLeaveRequest {
    shortLeaveId: number;
    employeeId: number;
    employeeName?: string;
    leaveDate: string;
    fromTime: string;
    toTime: string;
    totalMinutes: number;
    reason: string;
    status: string;
    leaveStatus?: string;
    approvalRemarks?: string;
    lastModifiedBy: number;
}

export interface EmployeeDropdownItem {
    id: number;
    name: string;
}

export interface StatusDropdownItem {
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
 * Short Leave API Service
 */
export const shortLeaveApi = {
    /**
     * Get all short leaves with pagination
     * GET /api/ShortLeave/GetAllPage?start=0&length=100&sortColumnDir=asc
     */
    getAllShortLeavesPage: async (start: number = 0, length: number = 100, sortColumnDir: string = 'asc'): Promise<ApiResponse<ShortLeave[]>> => {
        try {
            const token = getAuthToken();
            if (!token) {
                throw new Error('No authentication token found');
            }

            const userId = getUserId();
            const response = await fetch(
                `${API_BASE_URL}/ShortLeave/GetAllPage?start=${start}&length=${length}&sortColumnDir=${sortColumnDir}&userid=${userId}`,
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
            let shortLeavesArray: any[] = [];

            if (Array.isArray(data)) {
                shortLeavesArray = data;
            } else if (data && Array.isArray(data.data)) {
                shortLeavesArray = data.data;
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
                shortLeavesArray = findArray(data);
            }
            const shortLeaves: ShortLeave[] = shortLeavesArray.map((apiLeave: any, index: number) => ({
                id: String(apiLeave.id || apiLeave.Id || apiLeave.shortLeaveId || apiLeave.ShortLeaveId || index),
                shortLeaveId: apiLeave.shortLeaveId || apiLeave.ShortLeaveId || 0,
                employeeId: apiLeave.employeeId || apiLeave.EmployeeId || 0,
                employeeName: apiLeave.employeeName || apiLeave.EmployeeName || '',
                leaveDate: apiLeave.leaveDate || apiLeave.LeaveDate || '',
                fromTime: apiLeave.fromTime || apiLeave.FromTime || '',
                toTime: apiLeave.toTime || apiLeave.ToTime || '',
                totalMinutes: apiLeave.totalMinutes || apiLeave.TotalMinutes || 0,
                reason: apiLeave.reason || apiLeave.Reason || '',
                status: apiLeave.status || apiLeave.Status || '',
                approvedBy: apiLeave.approvedBy || apiLeave.ApprovedBy,
                approvedDate: apiLeave.approvedDate || apiLeave.ApprovedDate,
                approvedFrom: apiLeave.approvedFrom || apiLeave.ApprovedFrom || 'Admin',
                approvalRemarks: apiLeave.approvalRemarks || apiLeave.ApprovalRemarks || '',
                createdBy: apiLeave.createdBy || apiLeave.CreatedBy || 0,
                lastModifiedBy: apiLeave.lastModifiedBy || apiLeave.LastModifiedBy || 0,
                createdAt: apiLeave.createdDate || apiLeave.CreatedDate || apiLeave.createdAt || apiLeave.CreatedAt || new Date().toISOString(),
                updatedAt: apiLeave.updatedDate || apiLeave.UpdatedDate || apiLeave.updatedAt || apiLeave.UpdatedAt || new Date().toISOString(),
            }));

            return {
                success: true,
                data: shortLeaves,
                message: `Successfully retrieved ${shortLeaves.length} short leaves`,
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            console.error('Get Short Leaves API Error:', error);

            await logError({
                controllerName: 'ShortLeaveApi',
                methodName: 'GetAllPage',
                requestUrl: `${API_BASE_URL}/ShortLeave/GetAllPage?start=${start}&length=${length}&sortColumnDir=${sortColumnDir}`,
                requestPayload: { start, length, sortColumnDir },
                error
            });

            return {
                success: false,
                data: [],
                message: error instanceof Error ? error.message : 'Failed to fetch short leaves',
                timestamp: new Date().toISOString(),
            };
        }
    },

    /**
     * Add New Short Leave
     * POST /api/ShortLeave/Add
     */
    addShortLeave: async (leaveData: CreateShortLeaveRequest): Promise<ApiResponse<ShortLeave>> => {
        try {
            const token = getAuthToken();
            if (!token) {
                throw new Error('No authentication token found');
            }

            const userId = getUserId();
            const requestBody = {
                employeeId: leaveData.employeeId,
                EmployeeName: leaveData.employeeName || '',
                leaveDate: leaveData.leaveDate,
                fromTime: leaveData.fromTime,
                toTime: leaveData.toTime,
                totalMinutes: leaveData.totalMinutes,
                reason: leaveData.reason,
                status: leaveData.status,
                LeaveStatus: leaveData.leaveStatus || leaveData.status,
                approvedBy: userId, // From token
                approvalRemarks: leaveData.approvalRemarks || '',
                createdBy: leaveData.createdBy || userId,
                lastModifiedBy: leaveData.lastModifiedBy || userId,
            };

            const response = await fetch(
                `${API_BASE_URL}/ShortLeave/Add`,
                {
                    method: 'POST',
                    headers: createAuthHeaders(),
                    body: JSON.stringify(requestBody),
                }
            );

            let data;
            if (response.status === 204 || !response.headers.get('content-type')?.includes('application/json')) {
                data = {};
            } else {
                const responseText = await response.text();
                try {
                    data = responseText ? JSON.parse(responseText) : {};
                } catch (e) {
                    data = {};
                }
            }

            if (!response.ok) {
                throw new Error(data.message || `Failed to add short leave (Status: ${response.status})`);
            }

            const actualData = data.data || data;
            const shortLeave: ShortLeave = {
                id: String(actualData.id || actualData.Id || actualData.shortLeaveId || actualData.ShortLeaveId || Date.now()),
                shortLeaveId: actualData.shortLeaveId || actualData.ShortLeaveId || 0,
                employeeId: actualData.employeeId || actualData.EmployeeId || leaveData.employeeId,
                leaveDate: actualData.leaveDate || actualData.LeaveDate || leaveData.leaveDate,
                fromTime: actualData.fromTime || actualData.FromTime || leaveData.fromTime,
                toTime: actualData.toTime || actualData.ToTime || leaveData.toTime,
                totalMinutes: actualData.totalMinutes || actualData.TotalMinutes || leaveData.totalMinutes,
                reason: actualData.reason || actualData.Reason || leaveData.reason,
                status: actualData.status || actualData.Status || leaveData.status,
                approvedBy: userId,
                approvalRemarks: actualData.approvalRemarks || actualData.ApprovalRemarks || leaveData.approvalRemarks || '',
                createdBy: userId,
                lastModifiedBy: userId,
                createdAt: actualData.createdDate || actualData.CreatedDate || new Date().toISOString(),
                updatedAt: actualData.updatedDate || actualData.UpdatedDate || new Date().toISOString(),
            };

            return {
                success: true,
                data: shortLeave,
                message: 'Short leave created successfully',
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            console.error('Add Short Leave API Error:', error);

            await logError({
                controllerName: 'ShortLeaveApi',
                methodName: 'Add',
                requestUrl: `${API_BASE_URL}/ShortLeave/Add`,
                requestPayload: leaveData,
                error
            });

            return {
                success: false,
                data: null as any,
                message: error instanceof Error ? error.message : 'Failed to create short leave',
                timestamp: new Date().toISOString(),
            };
        }
    },

    /**
     * Get Short Leave By ID
     * GET /api/ShortLeave/GetById?id={id}
     */
    getShortLeaveById: async (id: string): Promise<ApiResponse<ShortLeave>> => {
        try {
            const token = getAuthToken();
            if (!token) {
                throw new Error('No authentication token found');
            }

            const response = await fetch(
                `${API_BASE_URL}/ShortLeave/GetById?id=${id}`,
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

            const shortLeave: ShortLeave = {
                id: String(actualData.id || actualData.Id || actualData.shortLeaveId || actualData.ShortLeaveId || id),
                shortLeaveId: actualData.shortLeaveId || actualData.ShortLeaveId || 0,
                employeeId: actualData.employeeId || actualData.EmployeeId || 0,
                employeeName: actualData.employeeName || actualData.EmployeeName || '',
                leaveDate: actualData.leaveDate || actualData.LeaveDate || '',
                fromTime: actualData.fromTime || actualData.FromTime || '',
                toTime: actualData.toTime || actualData.ToTime || '',
                totalMinutes: actualData.totalMinutes || actualData.TotalMinutes || 0,
                reason: actualData.reason || actualData.Reason || '',
                status: actualData.status || actualData.Status || '',
                approvedBy: actualData.approvedBy || actualData.ApprovedBy,
                approvedDate: actualData.approvedDate || actualData.ApprovedDate,
                approvalRemarks: actualData.approvalRemarks || actualData.ApprovalRemarks || '',
                createdBy: actualData.createdBy || actualData.CreatedBy || 0,
                lastModifiedBy: actualData.lastModifiedBy || actualData.LastModifiedBy || 0,
                createdAt: actualData.createdDate || actualData.CreatedDate || new Date().toISOString(),
                updatedAt: actualData.updatedDate || actualData.UpdatedDate || new Date().toISOString(),
            };

            return {
                success: true,
                data: shortLeave,
                message: 'Short leave retrieved successfully',
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            console.error('Get Short Leave By ID API Error:', error);

            await logError({
                controllerName: 'ShortLeaveApi',
                methodName: 'GetById',
                requestUrl: `${API_BASE_URL}/ShortLeave/GetById?id=${id}`,
                requestPayload: { id },
                error
            });

            return {
                success: false,
                data: null as any,
                message: error instanceof Error ? error.message : 'Failed to retrieve short leave',
                timestamp: new Date().toISOString(),
            };
        }
    },

    /**
     * Update Short Leave
     * POST /api/ShortLeave/Add (with shortLeaveId for update)
     */
    updateShortLeave: async (id: string, leaveData: UpdateShortLeaveRequest): Promise<ApiResponse<ShortLeave>> => {
        try {
            const token = getAuthToken();
            if (!token) {
                throw new Error('No authentication token found');
            }

            const userId = getUserId();
            const requestBody = {
                shortLeaveId: leaveData.shortLeaveId || parseInt(id),
                employeeId: leaveData.employeeId,
                EmployeeName: leaveData.employeeName || '',
                leaveDate: leaveData.leaveDate,
                fromTime: leaveData.fromTime,
                toTime: leaveData.toTime,
                totalMinutes: leaveData.totalMinutes,
                reason: leaveData.reason,
                status: leaveData.status,
                LeaveStatus: leaveData.leaveStatus || leaveData.status,
                approvedBy: userId, // From token
                approvalRemarks: leaveData.approvalRemarks || '',
                lastModifiedBy: leaveData.lastModifiedBy || userId,
            };

            const response = await fetch(
                `${API_BASE_URL}/ShortLeave/Add`,
                {
                    method: 'POST',
                    headers: createAuthHeaders(),
                    body: JSON.stringify(requestBody),
                }
            );

            let data;
            if (response.status === 204) {
                data = {};
            } else {
                data = await response.json();
            }

            if (!response.ok) {
                throw new Error(data.message || `HTTP ${response.status}: ${response.statusText}`);
            }

            const actualData = data.data || data;
            const shortLeave: ShortLeave = {
                id: String(actualData.id || actualData.Id || actualData.shortLeaveId || actualData.ShortLeaveId || id),
                shortLeaveId: actualData.shortLeaveId || actualData.ShortLeaveId || leaveData.shortLeaveId,
                employeeId: actualData.employeeId || actualData.EmployeeId || leaveData.employeeId,
                leaveDate: actualData.leaveDate || actualData.LeaveDate || leaveData.leaveDate,
                fromTime: actualData.fromTime || actualData.FromTime || leaveData.fromTime,
                toTime: actualData.toTime || actualData.ToTime || leaveData.toTime,
                totalMinutes: actualData.totalMinutes || actualData.TotalMinutes || leaveData.totalMinutes,
                reason: actualData.reason || actualData.Reason || leaveData.reason,
                status: actualData.status || actualData.Status || leaveData.status,
                approvedBy: userId,
                approvalRemarks: actualData.approvalRemarks || actualData.ApprovalRemarks || leaveData.approvalRemarks || '',
                createdBy: actualData.createdBy || actualData.CreatedBy || 0,
                lastModifiedBy: userId,
                createdAt: actualData.createdDate || actualData.CreatedDate || new Date().toISOString(),
                updatedAt: actualData.updatedDate || actualData.UpdatedDate || new Date().toISOString(),
            };

            return {
                success: true,
                data: shortLeave,
                message: 'Short leave updated successfully',
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            console.error('Update Short Leave API Error:', error);

            await logError({
                controllerName: 'ShortLeaveApi',
                methodName: 'Update',
                requestUrl: `${API_BASE_URL}/ShortLeave/Add`,
                requestPayload: { id, ...leaveData },
                error
            });

            return {
                success: false,
                data: null as any,
                message: error instanceof Error ? error.message : 'Failed to update short leave',
                timestamp: new Date().toISOString(),
            };
        }
    },

    /**
     * Delete Short Leave
     * DELETE /api/ShortLeave/Delete?id={id}&operatedBy={operatedBy}
     */
    deleteShortLeave: async (id: string): Promise<ApiResponse<null>> => {
        try {
            const token = getAuthToken();
            if (!token) {
                throw new Error('No authentication token found');
            }

            const userId = getUserId();
            const response = await fetch(
                `${API_BASE_URL}/ShortLeave/Delete?id=${id}&operatedBy=${userId}`,
                {
                    method: 'DELETE',
                    headers: createAuthHeaders(),
                }
            );

            if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                throw new Error(data.message || `HTTP ${response.status}: ${response.statusText}`);
            }

            return {
                success: true,
                data: null,
                message: 'Short leave deleted successfully',
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            console.error('Delete Short Leave API Error:', error);

            await logError({
                controllerName: 'ShortLeaveApi',
                methodName: 'Delete',
                requestUrl: `${API_BASE_URL}/ShortLeave/Delete?id=${id}`,
                requestPayload: { id },
                error
            });

            return {
                success: false,
                data: null,
                message: error instanceof Error ? error.message : 'Failed to delete short leave',
                timestamp: new Date().toISOString(),
            };
        }
    },

    /**
     * Get Employee Dropdown List
     * GET /api/Dropdown/EmployeesName
     */
    getEmployeeDropdown: async (): Promise<ApiResponse<EmployeeDropdownItem[]>> => {
        try {
            const token = getAuthToken();
            if (!token) {
                throw new Error('No authentication token found');
            }

            const response = await fetch(
                `${API_BASE_URL}/Dropdown/EmployeesName`,
                {
                    method: 'GET',
                    headers: createAuthHeaders(),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || `HTTP ${response.status}: ${response.statusText}`);
            }

            let employeesArray: any[] = [];

            if (Array.isArray(data)) {
                employeesArray = data;
            } else if (data && Array.isArray(data.data)) {
                employeesArray = data.data;
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
                employeesArray = findArray(data);
            }

            const employees: EmployeeDropdownItem[] = employeesArray.map((apiEmployee: any) => ({
                id: apiEmployee.id || apiEmployee.Id || apiEmployee.employeeId || apiEmployee.EmployeeId || 0,
                name: apiEmployee.name || apiEmployee.Name || apiEmployee.employeeName || apiEmployee.EmployeeName || 'Unknown Employee',
            }));

            return {
                success: true,
                data: employees,
                message: `Successfully retrieved ${employees.length} employees`,
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            console.error('Get Employee Dropdown API Error:', error);

            await logError({
                controllerName: 'ShortLeaveApi',
                methodName: 'GetEmployeeDropdown',
                requestUrl: `${API_BASE_URL}/Dropdown/EmployeesName`,
                requestPayload: null,
                error
            });

            return {
                success: false,
                data: [],
                message: error instanceof Error ? error.message : 'Failed to fetch employees',
                timestamp: new Date().toISOString(),
            };
        }
    },

    /**
     * Get Status Dropdown List
     * GET /api/Dropdown/LovMaster?Lov_column=LeaveApplications
     */
    getStatusDropdown: async (): Promise<ApiResponse<StatusDropdownItem[]>> => {
        try {
            const token = getAuthToken();
            if (!token) {
                throw new Error('No authentication token found');
            }

            const response = await fetch(
                `${API_BASE_URL}/Dropdown/LovMaster?Lov_column=LeaveApplications`,
                {
                    method: 'GET',
                    headers: createAuthHeaders(),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || `HTTP ${response.status}: ${response.statusText}`);
            }

            let statusArray: any[] = [];

            if (Array.isArray(data)) {
                statusArray = data;
            } else if (data && Array.isArray(data.data)) {
                statusArray = data.data;
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
                statusArray = findArray(data);
            }

            const statuses: StatusDropdownItem[] = statusArray.map((apiStatus: any) => ({
                id: apiStatus.id || apiStatus.Id || 0,
                name: apiStatus.name || apiStatus.Name || apiStatus.value || apiStatus.Value || 'Unknown Status',
                code: apiStatus.code || apiStatus.Code || apiStatus.lovCode || apiStatus.LovCode || undefined
            }));

            return {
                success: true,
                data: statuses,
                message: `Successfully retrieved ${statuses.length} statuses`,
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            console.error('Get Status Dropdown API Error:', error);

            await logError({
                controllerName: 'ShortLeaveApi',
                methodName: 'GetStatusDropdown',
                requestUrl: `${API_BASE_URL}/Dropdown/LovMaster?Lov_column=LeaveApplications`,
                requestPayload: null,
                error
            });

            return {
                success: false,
                data: [],
                message: error instanceof Error ? error.message : 'Failed to fetch statuses',
                timestamp: new Date().toISOString(),
            };
        }
    },
};

export default shortLeaveApi;
