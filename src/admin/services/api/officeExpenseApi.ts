import { ApiResponse } from '../types/apiTypes';
import { logError } from '../../utils/logError';

const API_BASE_URL = 'https://aj.padhyasoft.com/api';

export interface OfficeExpense {
    id: string;
    officeExpenseId?: number;
    expenseDate: string;
    amount: number;
    vendorId: number;
    vendorName?: string;
    paymentMethod: string;
    referenceNo: string;
    expenseTypeId?: number;
    description: string;
    attachmentDocument?: string; // Base64 or URL
    createdBy: number;
    lastModifiedBy: number;
    createdAt?: string;
    updatedAt?: string;
}

export interface CreateOfficeExpenseRequest {
    id?: number;
    officeExpenseId?: number;
    expenseTypeId?: number;
    expenseDate: string;
    amount: number;
    vendorId: number;
    paymentMethod: string;
    referenceNo: string;
    description: string;
    attachmentDocument?: string;
    createdBy?: number;
    lastModifiedBy?: number;
}

export interface VendorDropdownItem {
    id: number;
    name: string;
}

export interface PaymentMethodDropdownItem {
    id: number;
    name: string;
    value?: string;
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
 * Office Expense API Service
 */
export const officeExpenseApi = {
    /**
     * Get all office expenses with pagination
     * GET /api/OfficeExpense/GetAllPage?start=0&length=100&sortColumnDir=asc
     */
    getAllOfficeExpensesPage: async (start: number = 0, length: number = 100, sortColumnDir: string = 'asc'): Promise<ApiResponse<OfficeExpense[]>> => {
        try {
            const token = getAuthToken();
            if (!token) throw new Error('No authentication token found');

            const response = await fetch(
                `${API_BASE_URL}/OfficeExpense/GetAllPage?start=${start}&length=${length}&sortColumnDir=${sortColumnDir}`,
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

            let itemsArray: any[] = [];
            if (Array.isArray(data)) {
                itemsArray = data;
            } else if (data && Array.isArray(data.data)) {
                itemsArray = data.data;
            } else {
                // Recursive find array
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
                itemsArray = findArray(data);
            }

            const expenses: OfficeExpense[] = itemsArray.map((item: any, index: number) => ({
                id: String(item.id || item.Id || item.officeExpenseId || item.OfficeExpenseId || index),
                officeExpenseId: item.officeExpenseId || item.OfficeExpenseId || 0,
                expenseDate: item.expenseDate || item.ExpenseDate || '',
                amount: item.amount || item.Amount || 0,
                vendorId: item.vendorId || item.VendorId || 0,
                expenseTypeId: item.expenseTypeId || item.ExpenseTypeId || 0,
                vendorName: item.vendorName || item.VendorName || '',
                paymentMethod: item.paymentMethod || item.PaymentMethod || '',
                referenceNo: item.referenceNo || item.ReferenceNo || '',
                description: item.description || item.Description || '',
                attachmentDocument: item.attachmentDocument || item.AttachmentDocument || '',
                createdBy: item.createdBy || item.CreatedBy || 0,
                lastModifiedBy: item.lastModifiedBy || item.LastModifiedBy || 0,
                createdAt: item.createdDate || item.CreatedDate || new Date().toISOString(),
                updatedAt: item.updatedDate || item.UpdatedDate || new Date().toISOString(),
            }));

            return {
                success: true,
                data: expenses,
                message: `Successfully retrieved ${expenses.length} expenses`,
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            console.error('Get Office Expenses API Error:', error);
            await logError({
                controllerName: 'OfficeExpenseApi',
                methodName: 'GetAllPage',
                requestUrl: `${API_BASE_URL}/OfficeExpense/GetAllPage`,
                requestPayload: { start, length, sortColumnDir },
                error
            });
            return {
                success: false,
                data: [],
                message: error instanceof Error ? error.message : 'Failed to fetch expenses',
                timestamp: new Date().toISOString(),
            };
        }
    },

    /**
     * Add/Update Office Expense
     * POST /api/OfficeExpense/Add
     */
    /**
     * Add/Update Office Expense
     * POST /api/OfficeExpense/Add
     */
    addOfficeExpense: async (expenseData: CreateOfficeExpenseRequest & { attachmentFile?: File | null }): Promise<ApiResponse<OfficeExpense>> => {
        try {
            const token = getAuthToken();
            if (!token) throw new Error('No authentication token found');

            const userId = getUserId();
            const formData = new FormData();

            // Append fields in PascalCase as requested/implied by backend conventions
            if (Number(expenseData.officeExpenseId) > 0) {
                formData.append('OfficeExpenseId', String(expenseData.officeExpenseId));
            }
            formData.append('ExpenseTypeId', String(expenseData.expenseTypeId || 0));
            formData.append('ExpenseDate', expenseData.expenseDate);
            formData.append('Amount', String(expenseData.amount));
            formData.append('VendorId', String(expenseData.vendorId));
            formData.append('PaymentMethod', expenseData.paymentMethod);
            formData.append('ReferenceNo', expenseData.referenceNo || '');
            formData.append('Description', expenseData.description || '');
            formData.append('CreatedBy', String(expenseData.createdBy || userId));
            formData.append('LastModifiedBy', String(userId));

            // Handle File
            if (expenseData.attachmentFile) {
                // If it's a File object
                formData.append('attachment', expenseData.attachmentFile);
            }

            // Log the FormData for debugging
            console.log('--- FormData Payload ---');
            for (const pair of formData.entries()) {
                console.log(pair[0] + ': ' + pair[1]);
            }
            console.log('------------------------');

            const response = await fetch(
                `${API_BASE_URL}/OfficeExpense/Add`,
                {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: formData,
                }
            );

            console.log('Add Response Status:', response.status);
            const responseText = await response.text();
            console.log('Add Response Body:', responseText);
            console.log('Add Response Headers:', response.headers);
            let data;
            if (response.status === 204) {
                data = {};
            } else {
                try {
                    data = responseText ? JSON.parse(responseText) : {};
                } catch {
                    data = {};
                    console.error('Failed to parse response JSON');
                }
            }

            if (!response.ok) {
                throw new Error(data.message || `Failed to save expense (Status: ${response.status})`);
            }

            const actualData = data.data || data;
            console.log('Parsed Response Data:', actualData);

            return {
                success: true,
                data: {
                    ...actualData,
                    id: String(actualData.id || actualData.Id || 0)
                },
                message: 'Office expense saved successfully',
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            console.error('Add Office Expense API Error:', error);
            await logError({
                controllerName: 'OfficeExpenseApi',
                methodName: 'Add',
                requestUrl: `${API_BASE_URL}/OfficeExpense/Add`,
                requestPayload: expenseData, // Note: logging payload might not log file content
                error
            });
            return {
                success: false,
                data: null as any,
                message: error instanceof Error ? error.message : 'Failed to save expense',
                timestamp: new Date().toISOString(),
            };
        }
    },

    /**
     * Get Office Expense By ID
     * GET /api/OfficeExpense/GetById?id={id}
     */
    getOfficeExpenseById: async (id: string | number): Promise<ApiResponse<OfficeExpense>> => {
        try {
            const token = getAuthToken();
            if (!token) throw new Error('No authentication token found');

            const response = await fetch(
                `${API_BASE_URL}/OfficeExpense/GetById?id=${id}`,
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

            const expense: OfficeExpense = {
                id: String(actualData.id || actualData.Id || id),
                officeExpenseId: actualData.officeExpenseId || actualData.OfficeExpenseId || Number(id),
                expenseDate: actualData.expenseDate || actualData.ExpenseDate || '',
                amount: actualData.amount || actualData.Amount || 0,
                vendorId: actualData.vendorId || actualData.VendorId || 0,
                expenseTypeId: actualData.expenseTypeId || actualData.ExpenseTypeId || 0,
                vendorName: actualData.vendorName || actualData.VendorName || '',
                paymentMethod: actualData.paymentMethod || actualData.PaymentMethod || '',
                referenceNo: actualData.referenceNo || actualData.ReferenceNo || '',
                description: actualData.description || actualData.Description || '',
                attachmentDocument: actualData.attachmentDocument || actualData.AttachmentDocument || '',
                createdBy: actualData.createdBy || actualData.CreatedBy || 0,
                lastModifiedBy: actualData.lastModifiedBy || actualData.LastModifiedBy || 0,
                createdAt: actualData.createdDate || actualData.CreatedDate || '',
                updatedAt: actualData.updatedDate || actualData.UpdatedDate || '',
            };

            return {
                success: true,
                data: expense,
                message: 'Expense retrieved successfully',
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            console.error('Get Office Expense By ID API Error:', error);
            await logError({
                controllerName: 'OfficeExpenseApi',
                methodName: 'GetById',
                requestUrl: `${API_BASE_URL}/OfficeExpense/GetById`,
                requestPayload: { id },
                error
            });
            return {
                success: false,
                data: null as any,
                message: error instanceof Error ? error.message : 'Failed to retrieve expense',
                timestamp: new Date().toISOString(),
            };
        }
    },

    /**
     * Delete Office Expense
     * DELETE /api/OfficeExpense/Delete?id={id}&operatedBy={operatedBy}
     */
    deleteOfficeExpense: async (id: string | number): Promise<ApiResponse<null>> => {
        try {
            const token = getAuthToken();
            if (!token) throw new Error('No authentication token found');

            const userId = getUserId();
            const response = await fetch(
                `${API_BASE_URL}/OfficeExpense/Delete?id=${id}&operatedBy=${userId}`,
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
                message: 'Expense deleted successfully',
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            console.error('Delete Office Expense API Error:', error);
            await logError({
                controllerName: 'OfficeExpenseApi',
                methodName: 'Delete',
                requestUrl: `${API_BASE_URL}/OfficeExpense/Delete`,
                requestPayload: { id },
                error
            });
            return {
                success: false,
                data: null,
                message: error instanceof Error ? error.message : 'Failed to delete expense',
                timestamp: new Date().toISOString(),
            };
        }
    },

    /**
     * Get Vendor Dropdown
     * GET /api/Dropdown/VendorName
     */
    getVendorDropdown: async (): Promise<ApiResponse<VendorDropdownItem[]>> => {
        try {
            const token = getAuthToken();
            if (!token) throw new Error('No authentication token found');

            const response = await fetch(
                `${API_BASE_URL}/Dropdown/VendorName`,
                { method: 'GET', headers: createAuthHeaders() }
            );

            const data = await response.json();
            if (!response.ok) throw new Error(data.message || `HTTP ${response.status}`);

            let items: any[] = [];
            if (Array.isArray(data)) items = data;
            else if (data && Array.isArray(data.data)) items = data.data;

            const vendors: VendorDropdownItem[] = items.map((item: any) => ({
                id: item.id || item.Id || item.vendorId || item.VendorId || 0,
                name: item.name || item.Name || item.vendorName || item.VendorName || ''
            }));

            return {
                success: true,
                data: vendors,
                message: 'Vendors retrieved',
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            console.error('Get Vendor Dropdown Error:', error);
            return { success: false, data: [], message: 'Failed to fetch vendors', timestamp: new Date().toISOString() };
        }
    },

    /**
     * Get Payment Method Dropdown
     * GET /api/Dropdown/LovMaster?Lov_column=PaymentMethod
     */
    getPaymentMethodDropdown: async (): Promise<ApiResponse<PaymentMethodDropdownItem[]>> => {
        try {
            const token = getAuthToken();
            if (!token) throw new Error('No authentication token found');

            const response = await fetch(
                `${API_BASE_URL}/Dropdown/LovMaster?Lov_column=PaymentMethod`,
                { method: 'GET', headers: createAuthHeaders() }
            );

            const data = await response.json();
            if (!response.ok) throw new Error(data.message || `HTTP ${response.status}`);

            let items: any[] = [];
            if (Array.isArray(data)) items = data;
            else if (data && Array.isArray(data.data)) items = data.data;
            else {
                // Recursive find
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
                items = findArray(data);
            }

            const methods: PaymentMethodDropdownItem[] = items.map((item: any) => ({
                id: item.id || item.Id || 0,
                name: item.name || item.Name || item.value || item.Value || '',
                value: item.value || item.Value || item.name || item.Name || '',
                code: item.code || item.Code || item.value || item.Value || ''
            }));

            return {
                success: true,
                data: methods,
                message: 'Payment methods retrieved',
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            console.error('Get Payment Method Dropdown Error:', error);
            return { success: false, data: [], message: 'Failed to fetch payment methods', timestamp: new Date().toISOString() };
        }
    },

    /**
     * Get Office Expense Type Dropdown
     * GET /api/Dropdown/OfficeExpenseTypeName
     */
    getExpenseTypeDropdown: async (): Promise<ApiResponse<{ id: number; name: string }[]>> => {
        try {
            const token = getAuthToken();
            if (!token) throw new Error('No authentication token found');

            const response = await fetch(
                `${API_BASE_URL}/Dropdown/OfficeExpenseTypeName`,
                { method: 'GET', headers: createAuthHeaders() }
            );

            const data = await response.json();
            if (!response.ok) throw new Error(data.message || `HTTP ${response.status}`);

            let items: any[] = [];
            if (Array.isArray(data)) items = data;
            else if (data && Array.isArray(data.data)) items = data.data;

            const expenseTypes = items.map((item: any) => ({
                id: item.id || item.Id || 0,
                name: item.name || item.Name || ''
            }));

            return {
                success: true,
                data: expenseTypes,
                message: 'Expense types retrieved',
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            console.error('Get Expense Type Dropdown Error:', error);
            return { success: false, data: [], message: 'Failed to fetch expense types', timestamp: new Date().toISOString() };
        }
    },

    /**
     * Get Office Expense By Date Range and Type
     * GET /api/OfficeExpense/OfficeExpenseByDate?fromdate=01-01-2026&todate=01-31-2026&id=6
     */
    getOfficeExpenseByDate: async (fromDate: string, toDate: string, expenseTypeId: number): Promise<ApiResponse<OfficeExpense[]>> => {
        try {
            const token = getAuthToken();
            if (!token) throw new Error('No authentication token found');

            const response = await fetch(
                `${API_BASE_URL}/OfficeExpense/OfficeExpenseByDate?fromdate=${fromDate}&todate=${toDate}&id=${expenseTypeId}`,
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

            let itemsArray: any[] = [];
            if (Array.isArray(data)) {
                itemsArray = data;
            } else if (data && Array.isArray(data.data)) {
                itemsArray = data.data;
            } else {
                // Recursive find array
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
                itemsArray = findArray(data);
            }

            const expenses: OfficeExpense[] = itemsArray.map((item: any, index: number) => ({
                id: String(item.id || item.Id || item.officeExpenseId || item.OfficeExpenseId || index),
                officeExpenseId: item.officeExpenseId || item.OfficeExpenseId || 0,
                expenseDate: item.expenseDate || item.ExpenseDate || '',
                amount: item.amount || item.Amount || 0,
                vendorId: item.vendorId || item.VendorId || 0,
                expenseTypeId: item.expenseTypeId || item.ExpenseTypeId || 0,
                vendorName: item.vendorName || item.VendorName || '',
                paymentMethod: item.paymentMethod || item.PaymentMethod || '',
                referenceNo: item.referenceNo || item.ReferenceNo || '',
                description: item.description || item.Description || '',
                attachmentDocument: item.attachmentDocument || item.AttachmentDocument || '',
                createdBy: item.createdBy || item.CreatedBy || 0,
                lastModifiedBy: item.lastModifiedBy || item.LastModifiedBy || 0,
                createdAt: item.createdDate || item.CreatedDate || new Date().toISOString(),
                updatedAt: item.updatedDate || item.UpdatedDate || new Date().toISOString(),
            }));

            return {
                success: true,
                data: expenses,
                message: `Successfully retrieved ${expenses.length} expenses`,
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            console.error('Get Office Expense By Date API Error:', error);
            await logError({
                controllerName: 'OfficeExpenseApi',
                methodName: 'OfficeExpenseByDate',
                requestUrl: `${API_BASE_URL}/OfficeExpense/OfficeExpenseByDate`,
                requestPayload: { fromDate, toDate, expenseTypeId },
                error
            });
            return {
                success: false,
                data: [],
                message: error instanceof Error ? error.message : 'Failed to fetch expenses by date',
                timestamp: new Date().toISOString(),
            };
        }
    },

    /**
     * Get Office Expense Category Wise Summary
     * GET /api/OfficeExpenseCategorySummary/OfficeExpenseCategoryWiseSummary?fromdate=01-01-2026&todate=01-31-2026
     */
    getOfficeExpenseCategorySummary: async (fromDate: string, toDate: string): Promise<ApiResponse<any[]>> => {
        try {
            const token = getAuthToken();
            if (!token) throw new Error('No authentication token found');

            const response = await fetch(
                `${API_BASE_URL}/OfficeExpenseCategorySummary/OfficeExpenseCategoryWiseSummary?fromdate=${fromDate}&todate=${toDate}`,
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

            let itemsArray: any[] = [];
            if (Array.isArray(data)) {
                itemsArray = data;
            } else if (data && Array.isArray(data.data)) {
                itemsArray = data.data;
            } else {
                // Recursive find array
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
                itemsArray = findArray(data);
            }

            return {
                success: true,
                data: itemsArray,
                message: `Successfully retrieved ${itemsArray.length} category summaries`,
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            console.error('Get Office Expense Category Summary API Error:', error);
            await logError({
                controllerName: 'OfficeExpenseApi',
                methodName: 'OfficeExpenseCategorySummary',
                requestUrl: `${API_BASE_URL}/OfficeExpenseCategorySummary/OfficeExpenseCategoryWiseSummary`,
                requestPayload: { fromDate, toDate },
                error
            });
            return {
                success: false,
                data: [],
                message: error instanceof Error ? error.message : 'Failed to fetch category summary',
                timestamp: new Date().toISOString(),
            };
        }
    }
};
