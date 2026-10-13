import { ApiResponse } from '../types/apiTypes';
import { logError } from '../../utils/logError';

const API_BASE_URL = 'https://aj.padhyasoft.com/api';

export interface OfficeExpenseType {
    expenseTypeId: number;
    expenseTypeName: string;
    description: string;
    isRecurring: boolean;
    createdBy?: number;
    lastModifiedBy?: number;
    createdAt?: string;
    updatedAt?: string;
}

export const officeExpenseTypeApi = {
    /**
     * Get all office expense types with pagination
     * GET /api/OfficeExpenseType/GetAllPage?start=...
     */
    getAllOfficeExpenseTypesPage: async (start: number = 0, length: number = 100, sortColumnDir: string = 'asc'): Promise<ApiResponse<OfficeExpenseType[]>> => {
        try {
            const token = localStorage.getItem('admin_token');
            if (!token) throw new Error('No authentication token found');

            const response = await fetch(
                `${API_BASE_URL}/OfficeExpenseType/GetAllPage?start=${start}&length=${length}&sortColumnDir=${sortColumnDir}`,
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

            // Map data structure
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
                message: data.message || 'Office Expense Types retrieved successfully',
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('Get Office Expense Types API Error:', error);
            await logError({
                controllerName: 'OfficeExpenseTypeApi',
                methodName: 'GetAllPage',
                requestUrl: `${API_BASE_URL}/OfficeExpenseType/GetAllPage`,
                requestPayload: { start, length, sortColumnDir },
                error
            });
            return {
                success: false,
                data: [],
                message: error instanceof Error ? error.message : 'Failed to fetch office expense types',
                timestamp: new Date().toISOString()
            };
        }
    },

    /**
     * Add/Update Office Expense Type
     * POST /api/OfficeExpenseType/Add
     */
    addOfficeExpenseType: async (expenseTypeData: Partial<OfficeExpenseType>): Promise<ApiResponse<OfficeExpenseType>> => {
        try {
            const token = localStorage.getItem('admin_token');
            if (!token) throw new Error('No authentication token found');

            const response = await fetch(
                `${API_BASE_URL}/OfficeExpenseType/Add`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(expenseTypeData),
                }
            );

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error('❌ OfficeExpenseType Add Error:', errorData);
                throw new Error(errorData.message || `Failed to save office expense type (Status: ${response.status})`);
            }

            const data = await response.json();
            return {
                success: true,
                data: data.data || data,
                message: data.message || 'Office Expense Type saved successfully',
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('Add Office Expense Type API Error:', error);
            await logError({
                controllerName: 'OfficeExpenseTypeApi',
                methodName: 'Add',
                requestUrl: `${API_BASE_URL}/OfficeExpenseType/Add`,
                requestPayload: expenseTypeData,
                error
            });
            return {
                success: false,
                data: null as any,
                message: error instanceof Error ? error.message : 'Failed to save office expense type',
                timestamp: new Date().toISOString()
            };
        }
    },

    updateOfficeExpenseType: async (expenseTypeData: Partial<OfficeExpenseType>): Promise<ApiResponse<OfficeExpenseType>> => {
        return officeExpenseTypeApi.addOfficeExpenseType(expenseTypeData);
    },

    /**
     * Get Office Expense Type By ID
     * GET /api/OfficeExpenseType/GetById?id={id}
     */
    getOfficeExpenseTypeById: async (id: number): Promise<ApiResponse<OfficeExpenseType>> => {
        try {
            const token = localStorage.getItem('admin_token');
            if (!token) throw new Error('No authentication token found');

            const response = await fetch(
                `${API_BASE_URL}/OfficeExpenseType/GetById?id=${id}`,
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
                message: 'Office Expense Type retrieved successfully',
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('Get Office Expense Type By ID API Error:', error);
            return {
                success: false,
                data: null as any,
                message: error instanceof Error ? error.message : 'Failed to retrieve office expense type',
                timestamp: new Date().toISOString()
            };
        }
    },

    /**
     * Delete Office Expense Type
     * DELETE /api/OfficeExpenseType/Delete?id={id}&operatedBy={userId}
     */
    deleteOfficeExpenseType: async (id: number, operatedBy: number): Promise<ApiResponse<null>> => {
        try {
            const token = localStorage.getItem('admin_token');
            if (!token) throw new Error('No authentication token found');

            const queryParams = new URLSearchParams({
                id: id.toString(),
                operatedBy: operatedBy.toString()
            });

            const response = await fetch(
                `${API_BASE_URL}/OfficeExpenseType/Delete?${queryParams.toString()}`,
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
                message: 'Office Expense Type deleted successfully',
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('Delete Office Expense Type API Error:', error);
            return {
                success: false,
                data: null,
                message: error instanceof Error ? error.message : 'Failed to delete office expense type',
                timestamp: new Date().toISOString()
            };
        }
    },

    /**
     * Get Office Expense Type Dropdown
     * GET /api/Dropdown/OfficeExpenseTypeName
     */
    getOfficeExpenseTypeDropdown: async (): Promise<ApiResponse<{ id: number; name: string }[]>> => {
        try {
            const token = localStorage.getItem('admin_token');
            if (!token) throw new Error('No authentication token found');

            const response = await fetch(
                `${API_BASE_URL}/Dropdown/OfficeExpenseTypeName`,
                {
                    method: 'GET',
                    headers: { 'Accept': 'application/json', 'Authorization': `Bearer ${token}` }
                }
            );

            const data = await response.json();
            if (!response.ok) throw new Error(data.message || `HTTP ${response.status}`);

            let items: any[] = [];
            if (Array.isArray(data)) items = data;
            else if (data && Array.isArray(data.data)) items = data.data;

            const dropdownItems = items.map((item: any) => ({
                id: item.id || item.Id || item.expenseTypeId || item.ExpenseTypeId || 0,
                name: item.name || item.Name || item.expenseTypeName || item.ExpenseTypeName || ''
            }));

            return {
                success: true,
                data: dropdownItems,
                message: 'Dropdown retrieved',
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('Get Expense Type Dropdown Error:', error);
            return { success: false, data: [], message: 'Failed to fetch dropdown', timestamp: new Date().toISOString() };
        }
    }
};
