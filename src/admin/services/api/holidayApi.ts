import { ApiResponse } from '../types/apiTypes';
import { logError } from '../../utils/logError';

// const API_BASE_URL = 'https://localhost:7087/api';
const API_BASE_URL = 'https://aj.padhyasoft.com/api';

export interface Holiday {
    id: number;
    holiday_Year: string;
    holiday_Name: string;
    holiday_Date: string;
    createdBy?: number;
    lastModifiedBy?: number;
}

export const holidayApi = {
    /**
     * Get all holidays with pagination
     * GET /api/HolidayMaster/GetAllPage?start=...
     */
    getAllHolidaysPage: async (start: number = 0, length: number = 100, sortColumnDir: string = 'asc'): Promise<ApiResponse<Holiday[]>> => {
        try {
            const token = localStorage.getItem('admin_token');
            if (!token) throw new Error('No authentication token found');

            const response = await fetch(
                `${API_BASE_URL}/HolidayMaster/GetAllPage?start=${start}&length=${length}&sortColumnDir=${sortColumnDir}`,
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
                message: 'Holidays retrieved successfully',
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('Get Holidays API Error:', error);
            await logError({
                controllerName: 'HolidayApi',
                methodName: 'GetAll',
                requestUrl: `${API_BASE_URL}/HolidayMaster/GetAllPage`,
                requestPayload: { start, length, sortColumnDir },
                error
            });
            return {
                success: false,
                data: [],
                message: error instanceof Error ? error.message : 'Failed to fetch holidays',
                timestamp: new Date().toISOString()
            };
        }
    },

    /**
     * Add/Update Holiday
     * POST /api/HolidayMaster/Add
     */
    addHoliday: async (holidayData: Partial<Holiday>): Promise<ApiResponse<Holiday>> => {
        try {
            const token = localStorage.getItem('admin_token');
            if (!token) throw new Error('No authentication token found');

            const response = await fetch(
                `${API_BASE_URL}/HolidayMaster/Add`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(holidayData),
                }
            );

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Failed to save holiday (Status: ${response.status})`);
            }

            // Some APIs return the created object, some return a message
            const data = await response.json();
            const resultData = data.data || data;

            return {
                success: true,
                data: resultData,
                message: 'Holiday saved successfully',
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('Add Holiday API Error:', error);
            await logError({
                controllerName: 'HolidayApi',
                methodName: 'Add',
                requestUrl: `${API_BASE_URL}/HolidayMaster/Add`,
                requestPayload: holidayData,
                error
            });
            return {
                success: false,
                data: null as any,
                message: error instanceof Error ? error.message : 'Failed to save holiday',
                timestamp: new Date().toISOString()
            };
        }
    },

    /**
     * Get Holiday By ID
     * GET /api/HolidayMaster/GetById?id={id}
     */
    getHolidayById: async (id: number): Promise<ApiResponse<Holiday>> => {
        try {
            const token = localStorage.getItem('admin_token');
            if (!token) throw new Error('No authentication token found');

            const response = await fetch(
                `${API_BASE_URL}/HolidayMaster/GetById?id=${id}`,
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                }
            );

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            return {
                success: true,
                data: data.data || data,
                message: 'Holiday retrieved successfully',
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('Get Holiday By ID API Error:', error);
            return {
                success: false,
                data: null as any,
                message: error instanceof Error ? error.message : 'Failed to retrieve holiday',
                timestamp: new Date().toISOString()
            };
        }
    },

    /**
     * Delete Holiday
     * DELETE /api/HolidayMaster/Delete?id={id}
     */
    /**
     * Delete Holiday
     * DELETE /api/HolidayMaster/Delete?id={id}&operatedBy={userId}
     */
    deleteHoliday: async (id: number, operatedBy?: number): Promise<ApiResponse<null>> => {
        try {
            const token = localStorage.getItem('admin_token');
            if (!token) throw new Error('No authentication token found');

            // Resolve operatedBy from args or localStorage
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
                `${API_BASE_URL}/HolidayMaster/Delete?${queryParams.toString()}`,
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
                message: 'Holiday deleted successfully',
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('Delete Holiday API Error:', error);
            return {
                success: false,
                data: null,
                message: error instanceof Error ? error.message : 'Failed to delete holiday',
                timestamp: new Date().toISOString()
            };
        }
    }
};
