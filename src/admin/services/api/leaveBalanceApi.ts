import { ApiResponse } from '../types/apiTypes';
import { logError } from '../../utils/logError';

const API_BASE_URL = 'https://aj.padhyasoft.com/api';

export interface LeaveBalance {
    id: string;
    employeeId?: number;
    employeeName?: string;
    leaveYear: number;
    cl: number;
    sl: number;
    totalLeaves: number;
    usedLeaves: number;
    balanceLeaves: number;
    createdBy?: number;
    lastModifiedBy?: number;
    createdAt?: string;
    updatedAt?: string;
}

export interface AllocateLeaveBalanceRequest {
    leaveYear: number;
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
 * Leave Balance API Service
 */
export const leaveBalanceApi = {
    /**
     * Get Leave Balance by Year
     * GET /api/LeaveBalance/GetByYear?leaveYear={year}
     */
    getByYear: async (leaveYear: number): Promise<ApiResponse<LeaveBalance[]>> => {
        try {
            const token = getAuthToken();
            if (!token) {
                throw new Error('No authentication token found');
            }

            const userId = getUserId();
            console.log('🔥 LeaveBalanceApi: Fetching leave balances for year:', leaveYear, 'Userid:', userId);

            const response = await fetch(
                `${API_BASE_URL}/LeaveBalance/GetByYear?leaveYear=${leaveYear}&Userid=${userId}`,
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
            let balancesArray: any[] = [];

            if (Array.isArray(data)) {
                balancesArray = data;
            } else if (data && Array.isArray(data.data)) {
                balancesArray = data.data;
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
                balancesArray = findArray(data);
            }

            // Map API response to our LeaveBalance format
            const leaveBalances: LeaveBalance[] = balancesArray.map((apiBalance: any, index: number) => ({
                id: String(apiBalance.id || apiBalance.Id || index),
                employeeId: apiBalance.employeeId || apiBalance.EmployeeId,
                employeeName: apiBalance.employeeName || apiBalance.EmployeeName || '',
                leaveYear: apiBalance.leaveYear || apiBalance.LeaveYear || 0,
                cl: apiBalance.cl || apiBalance.CL || apiBalance.Cl || 0,
                sl: apiBalance.sl || apiBalance.SL || apiBalance.Sl || 0,
                totalLeaves: apiBalance.totalLeaves || apiBalance.TotalLeaves || 0,
                usedLeaves: apiBalance.usedLeaves || apiBalance.UsedLeaves || 0,
                balanceLeaves: apiBalance.balanceLeaves || apiBalance.BalanceLeaves || 0,
                createdBy: apiBalance.createdBy || apiBalance.CreatedBy || 0,
                lastModifiedBy: apiBalance.lastModifiedBy || apiBalance.LastModifiedBy || 0,
                createdAt: apiBalance.createdDate || apiBalance.CreatedDate || apiBalance.createdAt || apiBalance.CreatedAt || new Date().toISOString(),
                updatedAt: apiBalance.updatedDate || apiBalance.UpdatedDate || apiBalance.updatedAt || apiBalance.UpdatedAt || new Date().toISOString(),
            }));

            console.log('✅ LeaveBalanceApi: Successfully retrieved', leaveBalances.length, 'leave balances');

            return {
                success: true,
                data: leaveBalances,
                message: `Successfully retrieved ${leaveBalances.length} leave balances`,
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            console.error('Get Leave Balance API Error:', error);

            await logError({
                controllerName: 'LeaveBalanceApi',
                methodName: 'GetByYear',
                requestUrl: `${API_BASE_URL}/LeaveBalance/GetByYear?leaveYear=${leaveYear}`,
                requestPayload: { leaveYear },
                error
            });

            return {
                success: false,
                data: [],
                message: error instanceof Error ? error.message : 'Failed to fetch leave balances',
                timestamp: new Date().toISOString(),
            };
        }
    },

    /**
     * Allocate Leave Balance
     * POST /api/LeaveBalance/Allocate?leaveYear={year}
     */
    allocate: async (leaveYear: number): Promise<ApiResponse<null>> => {
        try {
            const token = getAuthToken();
            if (!token) {
                throw new Error('No authentication token found');
            }

            console.log('🔥 LeaveBalanceApi: Allocating leave balance for year:', leaveYear);

            const response = await fetch(
                `${API_BASE_URL}/LeaveBalance/Allocate?leaveYear=${leaveYear}`,
                {
                    method: 'POST',
                    headers: createAuthHeaders(),
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
                throw new Error(data.message || `Failed to allocate leave balance (Status: ${response.status})`);
            }

            console.log('✅ LeaveBalanceApi: Successfully allocated leave balance');

            return {
                success: true,
                data: null,
                message: 'Leave balance allocated successfully',
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            console.error('Allocate Leave Balance API Error:', error);

            await logError({
                controllerName: 'LeaveBalanceApi',
                methodName: 'Allocate',
                requestUrl: `${API_BASE_URL}/LeaveBalance/Allocate?leaveYear=${leaveYear}`,
                requestPayload: { leaveYear },
                error
            });

            return {
                success: false,
                data: null,
                message: error instanceof Error ? error.message : 'Failed to allocate leave balance',
                timestamp: new Date().toISOString(),
            };
        }
    },
};

export default leaveBalanceApi;
