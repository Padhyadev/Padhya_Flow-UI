import { ApiResponse } from '../types/apiTypes';
import { logError } from '../../utils/logError';

// const API_BASE_URL = 'https://localhost:7087/api';
const API_BASE_URL = 'https://aj.padhyasoft.com/api';

export interface DropdownItem {
    id: number | string;
    name: string;
    // Add other potential fields if backend returns them, usually id/name or id/value
    value?: string | number;
    text?: string;
    code?: string;
}

export const dropdownApi = {
    /**
     * Get Employees Name Dropdown
     * GET /Dropdown/EmployeesName
     */
    getEmployeesName: async (): Promise<ApiResponse<DropdownItem[]>> => {
        try {
            const response = await fetch(`${API_BASE_URL}/Dropdown/EmployeesName`, {
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
                message: 'Success',
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            await logError({
                controllerName: 'DropdownApi',
                methodName: 'getEmployeesName',
                requestUrl: `${API_BASE_URL}/Dropdown/EmployeesName`,
                requestPayload: {},
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

    /**
     * Get LOV Master Dropdown
     * GET /Dropdown/LovMaster?Lov_column={column}
     */
    getLovMaster: async (columnName: string): Promise<ApiResponse<DropdownItem[]>> => {
        try {
            const response = await fetch(`${API_BASE_URL}/Dropdown/LovMaster?Lov_column=${encodeURIComponent(columnName)}`, {
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
            if (Array.isArray(data)) {
                items = data;
            } else if (data && Array.isArray(data.data)) {
                items = data.data;
            } else if (data && data.data && Array.isArray(data.data.data)) {
                items = data.data.data;
            }

            // Map items to include code if available
            items = items.map((item: any) => ({
                id: item.id || item.Id || item.value || item.Value || 0,
                name: item.name || item.Name || item.text || item.Text || item.lov_Value || item.Lov_Value || '',
                code: item.code || item.Code || item.lovCode || item.LovCode || undefined
            }));

            return {
                success: true,
                data: items,
                message: 'Success',
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            await logError({
                controllerName: 'DropdownApi',
                methodName: 'getLovMaster',
                requestUrl: `${API_BASE_URL}/Dropdown/LovMaster`,
                requestPayload: { columnName },
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

    /**
     * Get Leave Names Dropdown
     * GET /Dropdown/Leavename
     */
    getLeaveName: async (): Promise<ApiResponse<DropdownItem[]>> => {
        try {
            const response = await fetch(`${API_BASE_URL}/Dropdown/Leavename`, {
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
            // Robust parsing logic
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
                message: 'Success',
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            await logError({
                controllerName: 'DropdownApi',
                methodName: 'getLeaveName',
                requestUrl: `${API_BASE_URL}/Dropdown/Leavename`,
                requestPayload: {},
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

    /**
     * Get Client Master Dropdown
     * GET /Dropdown/ClientMaster
     */
    getClientMaster: async (): Promise<ApiResponse<DropdownItem[]>> => {
        try {
            const response = await fetch(`${API_BASE_URL}/Dropdown/ClientMaster`, {
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
                message: 'Success',
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            await logError({
                controllerName: 'DropdownApi',
                methodName: 'getClientMaster',
                requestUrl: `${API_BASE_URL}/Dropdown/ClientMaster`,
                requestPayload: {},
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

    /**
     * Get Project Name Dropdown
         * GET /Dropdown/ProjectName
         */
    getProjectName: async (): Promise<ApiResponse<DropdownItem[]>> => {
        try {
            const response = await fetch(`${API_BASE_URL}/Dropdown/ProjectName`, {
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
                message: 'Success',
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            await logError({
                controllerName: 'DropdownApi',
                methodName: 'getProjectName',
                requestUrl: `${API_BASE_URL}/Dropdown/ProjectName`,
                requestPayload: {},
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

    /**
     * Get Role Name Dropdown
     * GET /Dropdown/RoleName
     */
    getRoleName: async (): Promise<ApiResponse<DropdownItem[]>> => {
        try {
            const response = await fetch(`${API_BASE_URL}/Dropdown/RoleName`, {
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
                message: 'Success',
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            await logError({
                controllerName: 'DropdownApi',
                methodName: 'getRoleName',
                requestUrl: `${API_BASE_URL}/Dropdown/RoleName`,
                requestPayload: {},
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

    /**
     * Get Project Name Dropdown for Employee Project Assignment
     * GET /Dropdown/ProjectNameForEmpProjectAssignment
     */
    getProjectNameForAssignment: async (): Promise<ApiResponse<DropdownItem[]>> => {
        try {
            const response = await fetch(`${API_BASE_URL}/Dropdown/ProjectNameForEmpProjectAssignment`, {
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
                message: 'Success',
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            await logError({
                controllerName: 'DropdownApi',
                methodName: 'getProjectNameForAssignment',
                requestUrl: `${API_BASE_URL}/Dropdown/ProjectNameForEmpProjectAssignment`,
                requestPayload: {},
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

    /**
     * Get Assigned Projects for Employee (Pre-selection)
     * GET /Dropdown/GETapiforprojectAssignment?EmployeeId={id}
     */
    getAssignedProjectsForEmployee: async (employeeId: number | string): Promise<ApiResponse<DropdownItem[]>> => {
        try {
            const response = await fetch(`${API_BASE_URL}/Dropdown/GETapiforprojectAssignment?EmployeeId=${employeeId}`, {
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
            // Handle various response structures
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
                message: 'Success',
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            await logError({
                controllerName: 'DropdownApi',
                methodName: 'getAssignedProjectsForEmployee',
                requestUrl: `${API_BASE_URL}/Dropdown/GETapiforprojectAssignment`,
                requestPayload: { employeeId },
                error: error
            });
            return {
                success: false,
                message: 'Network error occurred',
                data: [],
                timestamp: new Date().toISOString()
            };
        }
    }
};
