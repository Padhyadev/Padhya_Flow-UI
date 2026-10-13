import { ApiResponse } from '../types/apiTypes';
import { logError } from '../../utils/logError';

// Using the specific base URL requested by the user for Employee APIs
// const API_BASE_URL = 'https://localhost:7087/api';
const API_BASE_URL = 'https://aj.padhyasoft.com/api';

export interface Employee {
    employeeId: number;
    employeeCode: string;
    firstName: string;
    lastName: string;
    email: string;
    mobile: string;
    department: string;
    designation: string;
    reportingManagerId: number;
    joinDate: string;
    employmentType: string;
    workLocation: string;
    dateOfBirth: string;
    exitDate: string;
    createdBy?: number;
    lastModifiedBy?: number;
    // For display/logic
    reportingManagerName?: string;
    userName?: string;
    roleName?: string;
    // roleId?: number | string;
    roleId?: number;
}

export interface EmployeeDropdownItem {
    id: number;
    name: string;
}

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

export const employeeApi = {
    /**
     * Get all employees with pagination
     * GET /api/Employee/GetAllpage?start=...
     */
    getAllEmployeesPage: async (start: number = 0, length: number = 100, sortColumnDir: string = 'asc'): Promise<ApiResponse<Employee[]>> => {
        try {
            const token = getAuthToken();
            if (!token) throw new Error('No authentication token found');

            const response = await fetch(
                `${API_BASE_URL}/Employee/GetAllpage?start=${start}&length=${length}&sortColumnDir=${sortColumnDir}`,
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

            // Handle response structure (similar to userApi)
            let employeesArray: any[] = [];
            if (Array.isArray(data)) {
                employeesArray = data;
            } else if (data && Array.isArray(data.data)) {
                employeesArray = data.data;
            } else if (data && data.data && Array.isArray(data.data.data)) {
                employeesArray = data.data.data;
            }

            return {
                success: true,
                data: employeesArray, // We assume the API returns keys matching our interface or close to it
                message: 'Employees retrieved successfully',
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('Get Employees API Error:', error);
            await logError({
                controllerName: 'EmployeeApi',
                methodName: 'GetAll',
                requestUrl: `${API_BASE_URL}/Employee/GetAllpage`,
                requestPayload: { start, length, sortColumnDir },
                error
            });
            return {
                success: false,
                data: [],
                message: error instanceof Error ? error.message : 'Failed to fetch employees',
                timestamp: new Date().toISOString()
            };
        }
    },

    /**
     * Add New Employee
     * POST /api/Employee/Add
     */
    addEmployee: async (employeeData: Partial<Employee>): Promise<ApiResponse<Employee>> => {
        try {
            const token = getAuthToken();
            if (!token) throw new Error('No authentication token found');

            // Ensure dates are ISO strings if they are Date objects (form handling might need this)
            // The user provided example JSON implies strings: "2026-01-05T..."

            const response = await fetch(
                `${API_BASE_URL}/Employee/Add`,
                {
                    method: 'POST',
                    headers: createAuthHeaders(),
                    body: JSON.stringify(employeeData),
                }
            );

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Failed to add employee (Status: ${response.status})`);
            }

            const data = await response.json();
            return {
                success: true,
                data: data.data || data,
                message: 'Employee created successfully',
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('Add Employee API Error:', error);
            await logError({
                controllerName: 'EmployeeApi',
                methodName: 'Add',
                requestUrl: `${API_BASE_URL}/Employee/Add`,
                requestPayload: employeeData,
                error
            });
            return {
                success: false,
                data: null as any,
                message: error instanceof Error ? error.message : 'Failed to create employee',
                timestamp: new Date().toISOString()
            };
        }
    },

    /**
     * Get Employee By ID
     * GET /api/Employee/GetById?id={id}
     */
    getEmployeeById: async (id: number): Promise<ApiResponse<Employee>> => {
        try {
            const token = getAuthToken();
            if (!token) throw new Error('No authentication token found');

            const response = await fetch(
                `${API_BASE_URL}/Employee/GetById?id=${id}`,
                {
                    method: 'GET',
                    headers: createAuthHeaders(),
                }
            );

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            return {
                success: true,
                data: data.data || data,
                message: 'Employee retrieved successfully',
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('Get Employee By ID API Error:', error);
            return {
                success: false,
                data: null as any,
                message: error instanceof Error ? error.message : 'Failed to retrieve employee',
                timestamp: new Date().toISOString()
            };
        }
    },

    /**
     * Delete Employee
     * DELETE /api/Employee/Delete?id={id}
     */
    deleteEmployee: async (id: number): Promise<ApiResponse<null>> => {
        try {
            const token = getAuthToken();
            if (!token) throw new Error('No authentication token found');

            const response = await fetch(
                `${API_BASE_URL}/Employee/Delete?id=${id}`,
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
                message: 'Employee deleted successfully',
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('Delete Employee API Error:', error);
            return {
                success: false,
                data: null,
                message: error instanceof Error ? error.message : 'Failed to delete employee',
                timestamp: new Date().toISOString()
            };
        }
    },

    /**
     * Get Employees Name Dropdown
     * GET /api/Dropdown/EmployeesName
     */
    getEmployeeDropdown: async (): Promise<ApiResponse<EmployeeDropdownItem[]>> => {
        try {
            const token = getAuthToken();
            if (!token) throw new Error('No authentication token found');

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

            let itemsArray: any[] = [];
            if (Array.isArray(data)) {
                itemsArray = data;
            } else if (data && Array.isArray(data.data)) {
                itemsArray = data.data;
            }

            // Map to standard dropdown format
            const dropdownItems: EmployeeDropdownItem[] = itemsArray.map((item: any) => ({
                id: item.id || item.Id || item.employeeId || 0,
                name: item.name || item.Name || item.firstName + ' ' + item.lastName || 'Unknown'
            }));

            return {
                success: true,
                data: dropdownItems,
                message: 'Dropdown retrieved successfully',
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('Get Employee Dropdown API Error:', error);
            return {
                success: false,
                data: [],
                message: error instanceof Error ? error.message : 'Failed to fetch dropdown',
                timestamp: new Date().toISOString()
            };
        }
    },

    /**
     * Get Employment Type Dropdown
     * GET /api/Dropdown/LovMaster?Lov_column=EmploymentType
     */
    getEmploymentTypeDropdown: async (): Promise<ApiResponse<{ code: string; name: string }[]>> => {
        try {
            const token = getAuthToken();
            if (!token) throw new Error('No authentication token found');

            const response = await fetch(
                `${API_BASE_URL}/Dropdown/LovMaster?Lov_column=EmploymentType`,
                {
                    method: 'GET',
                    headers: createAuthHeaders(),
                }
            );

            // Safe JSON parsing
            const responseText = await response.text();
            let data;
            try {
                data = responseText ? JSON.parse(responseText) : {};
            } catch (e) {
                console.error('JSON Parse Error for LovMaster:', e);
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
            }

            return {
                success: true,
                data: itemsArray.map((item: any) => ({
                    code: item.code || item.Code || item.lovCode || item.LovCode || item.name,
                    name: item.name || item.Name || item.text || item.Text
                })),
                message: 'Employment types retrieved successfully',
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('Get Employment Type API Error:', error);
            return {
                success: false,
                data: [],
                message: error instanceof Error ? error.message : 'Failed to fetch employment types',
                timestamp: new Date().toISOString()
            };
        }
    }
};
