import { ApiResponse } from '../types/apiTypes';
import { logError } from '../../utils/logError';

const API_BASE_URL = 'https://aj.padhyasoft.com/api';

export interface DailyTask {
    dailyTaskID: number;
    employeeID: number;
    employeeName?: string;
    projectID: number;
    projectName?: string;
    taskTitle: string;
    taskDescription: string;
    workDate: string;
    hoursSpent: number;
    taskStatus: string;
    isActive: boolean;
    isDeleted: boolean;
    createdBy?: number;
    lastModifiedBy?: number;
    createdDate?: string;
    status?: string;
    userId?: number;
}

export interface SaveDailyTaskRequest {
    createdBy: number;
    lastModifiedBy: number;
    dailyTaskID: number;
    employeeID: number;
    projectID: number;
    taskTitle: string;
    taskDescription: string;
    workDate: string;
    hoursSpent: number;
    taskStatus: string;
    isActive: boolean;
    isDeleted: boolean;
    projectName?: string;
    status?: string;
    employeeName?: string;
    userId: number;
}

const getAuthToken = (): string | null => {
    return localStorage.getItem('admin_token') || localStorage.getItem('token');
};

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

const createAuthHeaders = (): HeadersInit => {
    const token = getAuthToken();
    return {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
    };
};

export const dailyTaskApi = {
    /**
     * Get All Daily Tasks
     */
    getAllDailyTasksPage: async (start: number = 0, length: number = 100, sortColumnDir: string = 'asc', userId?: number, sortColumn: number = 100, employeeId?: number): Promise<ApiResponse<DailyTask[]>> => {
        try {
            const idParam = userId !== undefined ? userId : getUserId();
            const response = await fetch(
                `${API_BASE_URL}/DailyTask/GetAllpage?start=${start}&length=${length}&sortColumn=${sortColumn}&sortColumnDir=${sortColumnDir}&Id=${idParam}${employeeId ? `&employeeId=${employeeId}` : ''}`,
                {
                    method: 'GET',
                    headers: createAuthHeaders(),
                }
            );

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();

            // Handle various response structures
            let items: DailyTask[] = [];
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
                message: 'Daily Tasks retrieved successfully',
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('getAllDailyTasksPage Error:', error);
            await logError({
                controllerName: 'DailyTaskApi',
                methodName: 'getAllDailyTasksPage',
                requestUrl: `${API_BASE_URL}/DailyTask/GetAllpage`,
                requestPayload: { start, length, sortColumnDir, userId, sortColumn },
                error: error
            });
            return {
                success: false,
                data: [],
                message: error instanceof Error ? error.message : 'Failed to retrieve tasks',
                timestamp: new Date().toISOString()
            };
        }
    },

    /**
     * Save Daily Task (Add/Update)
     */
    saveDailyTask: async (taskData: Partial<DailyTask>): Promise<ApiResponse<DailyTask>> => {
        try {
            const userId = getUserId();

            // For edit mode, preserve existing createdBy, for new use userId
            const createdBy = taskData.createdBy || userId;
            // For both create and edit, use userId as lastModifiedBy
            const lastModifiedBy = userId;
            // For employeeID, use existing or userId
            const employeeID = taskData.employeeID || userId;

            // Default payload structure based on request
            const payload: SaveDailyTaskRequest = {
                createdBy: createdBy,
                lastModifiedBy: lastModifiedBy,
                dailyTaskID: taskData.dailyTaskID || 0, // Dynamic - comes from edit form
                employeeID: employeeID,
                projectID: taskData.projectID || 0,
                taskTitle: taskData.taskTitle || '',
                taskDescription: taskData.taskDescription || '',
                workDate: taskData.workDate || new Date().toISOString(),
                hoursSpent: taskData.hoursSpent || 0,
                taskStatus: taskData.taskStatus || '',
                isActive: taskData.isActive !== undefined ? taskData.isActive : true,
                isDeleted: taskData.isDeleted || false,
                projectName: taskData.projectName || '',
                status: taskData.status || taskData.taskStatus || '',
                employeeName: taskData.employeeName || '',
                userId: userId
            };

            console.log('💾 Saving Daily Task - dailyTaskID:', payload.dailyTaskID, '(0 = New, >0 = Update)');
            console.log('💾 Full Payload:', payload);

            const response = await fetch(`${API_BASE_URL}/DailyTask/AddOrUpdateTask`, {
                method: 'POST',
                headers: createAuthHeaders(),
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Failed to save daily task');
            }

            const data = await response.json();

            return {
                success: true,
                data: data.data || data,
                message: 'Daily Task saved successfully',
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('saveDailyTask Error:', error);
            await logError({
                controllerName: 'DailyTaskApi',
                methodName: 'saveDailyTask',
                requestUrl: `${API_BASE_URL}/DailyTask/AddOrUpdateTask`,
                requestPayload: taskData,
                error: error
            });
            return {
                success: false,
                data: null as any,
                message: error instanceof Error ? error.message : 'Failed to save daily task',
                timestamp: new Date().toISOString()
            };
        }
    },

    /**
     * Get Daily Task By ID
     */
    getDailyTaskById: async (id: number): Promise<ApiResponse<DailyTask>> => {
        try {
            const response = await fetch(`${API_BASE_URL}/DailyTask/GetTaskById?id=${id}`, {
                method: 'GET',
                headers: createAuthHeaders()
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Failed to get daily task');
            }

            const data = await response.json();
            return {
                success: true,
                data: data.data || data,
                message: 'Retrieved successfully',
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('getDailyTaskById Error:', error);
            return {
                success: false,
                data: null as any,
                message: error instanceof Error ? error.message : 'Failed to get daily task',
                timestamp: new Date().toISOString()
            };
        }
    },

    /**
     * Delete Daily Task
     */
    deleteDailyTask: async (id: number): Promise<ApiResponse<null>> => {
        try {
            const userId = getUserId();
            const response = await fetch(`${API_BASE_URL}/DailyTask/Delete?id=${id}&operatedBy=${userId}`, {
                method: 'DELETE',
                headers: createAuthHeaders()
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Failed to delete daily task');
            }

            return {
                success: true,
                data: null,
                message: 'Daily Task deleted successfully',
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('deleteDailyTask Error:', error);
            await logError({
                controllerName: 'DailyTaskApi',
                methodName: 'deleteDailyTask',
                requestUrl: `${API_BASE_URL}/DailyTask/Delete`,
                requestPayload: { id },
                error: error
            });
            return {
                success: false,
                data: null,
                message: error instanceof Error ? error.message : 'Failed to delete daily task',
                timestamp: new Date().toISOString()
            };
        }
    },

    /**
     * Get Projects by Employee ID Dropdown
     */
    getProjectsByEmployeeId: async (employeeId: number): Promise<ApiResponse<any[]>> => {
        try {
            const apiUrl = `${API_BASE_URL}/Dropdown/ProjectNamebyEmployeeId?UserId=${employeeId}`;
            console.log('🔵 dailyTaskApi: Calling getProjectsByEmployeeId');
            console.log('🔵 API URL:', apiUrl);
            console.log('🔵 EmployeeId (User ID from token):', employeeId);

            const response = await fetch(apiUrl, {
                method: 'GET',
                headers: createAuthHeaders()
            });

            console.log('🔵 Response Status:', response.status, response.statusText);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ API Error Response:', errorText);
                throw new Error('Failed to fetch projects: ' + response.status);
            }

            const data = await response.json();
            console.log('🔵 Raw API Response:', data);

            let items: any[] = [];
            if (Array.isArray(data)) {
                items = data;
                console.log('✅ Data is array, items count:', items.length);
            } else if (data && Array.isArray(data.data)) {
                items = data.data;
                console.log('✅ Data.data is array, items count:', items.length);
            } else {
                console.warn('⚠️ Unexpected data structure:', typeof data);
            }

            console.log('✅ Final items to return:', items);

            return {
                success: true,
                data: items,
                message: 'Projects retrieved successfully',
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('❌ getProjectsByEmployeeId Error:', error);
            return {
                success: false,
                data: [],
                message: error instanceof Error ? error.message : 'Failed to fetch projects',
                timestamp: new Date().toISOString()
            };
        }
    }
};
