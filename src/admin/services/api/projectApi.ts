import { ApiResponse } from '../types/apiTypes';
import { logError } from '../../utils/logError';

const API_BASE_URL = 'https://aj.padhyasoft.com/api';

export interface Project {
    projectId: number;
    clientId: number;
    clientName?: string;
    projectName: string;
    projectType: string;
    startDate: string;
    expectedEndDate: string;
    projectStatus: string;
    createdBy?: number;
    lastModifiedBy?: number;
    createdDate?: string;
    updatedDate?: string;
}

export interface SaveProjectRequest {
    projectId: number;
    clientId: number;
    projectName: string;
    projectType: string;
    startDate: string;
    expectedEndDate: string;
    projectStatus: string;
    createdBy: number;
    lastModifiedBy: number;
}

const getAuthToken = (): string | null => {
    return localStorage.getItem('admin_token');
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

export const projectApi = {
    /**
     * Get All Projects
     * GET /api/ProjectMaster/GetAllpage?start=0&length=100&sortColumnDir=asc
     */
    getAllProjectsPage: async (start: number = 0, length: number = 100, sortColumnDir: string = 'asc'): Promise<ApiResponse<Project[]>> => {
        try {
            const token = getAuthToken();
            if (!token) throw new Error('No authentication token found');

            const response = await fetch(
                `${API_BASE_URL}/ProjectMaster/GetAllpage?start=${start}&length=${length}&sortColumnDir=${sortColumnDir}`,
                {
                    method: 'GET',
                    headers: createAuthHeaders(),
                }
            );

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
            }

            const responseText = await response.text();
            let data;
            try {
                data = responseText ? JSON.parse(responseText) : {};
            } catch (parseError) {
                console.error('JSON Parse Error:', parseError);
                throw new Error('Invalid JSON response from server');
            }

            console.log('Project API Response for GetAllPage:', data);

            // Handle different possible response formats
            let items: Project[] = [];

            if (Array.isArray(data)) {
                items = data;
            } else if (data && Array.isArray(data.data)) {
                items = data.data;
            } else if (data && data.data && Array.isArray(data.data.data)) {
                items = data.data.data;
            } else {
                // Recursive find function
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

            return {
                success: true,
                data: items,
                message: 'Projects retrieved successfully',
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('getAllProjectsPage Error:', error);
            await logError({
                controllerName: 'ProjectApi',
                methodName: 'getAllProjectsPage',
                requestUrl: `${API_BASE_URL}/ProjectMaster/GetAllpage`,
                requestPayload: { start, length, sortColumnDir },
                error: error
            });
            return {
                success: false,
                data: [],
                message: error instanceof Error ? error.message : 'Failed to retrieve projects',
                timestamp: new Date().toISOString()
            };
        }
    },

    /**
     * Save Project (Add/Update)
     * POST /api/ProjectMaster/Add
     */
    saveProject: async (projectData: Partial<Project>): Promise<ApiResponse<Project>> => {
        try {
            const userId = getUserId();
            const payload: SaveProjectRequest = {
                projectId: projectData.projectId || 0,
                clientId: projectData.clientId || 0,
                projectName: projectData.projectName || '',
                projectType: projectData.projectType || '',
                startDate: projectData.startDate || '',
                expectedEndDate: projectData.expectedEndDate || '',
                projectStatus: projectData.projectStatus || '',
                createdBy: 0,
                lastModifiedBy: 0
            };

            const response = await fetch(`${API_BASE_URL}/ProjectMaster/Add`, {
                method: 'POST',
                headers: createAuthHeaders(),
                body: JSON.stringify(payload)
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Failed to save project');

            return {
                success: true,
                data: data.data || data,
                message: 'Project saved successfully',
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('saveProject Error:', error);
            await logError({
                controllerName: 'ProjectApi',
                methodName: 'saveProject',
                requestUrl: `${API_BASE_URL}/ProjectMaster/Add`,
                requestPayload: projectData,
                error: error
            });
            return {
                success: false,
                data: null as any,
                message: error instanceof Error ? error.message : 'Failed to save project',
                timestamp: new Date().toISOString()
            };
        }
    },

    /**
     * Get Project By ID
     * GET /api/ProjectMaster/GetById?id={id}
     */
    getProjectById: async (id: number): Promise<ApiResponse<Project>> => {
        try {
            const response = await fetch(`${API_BASE_URL}/ProjectMaster/GetById?id=${id}`, {
                method: 'GET',
                headers: createAuthHeaders()
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Failed to get project');

            return {
                success: true,
                data: data.data || data,
                message: 'Retrieved successfully',
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('getProjectById Error:', error);
            await logError({
                controllerName: 'ProjectApi',
                methodName: 'getProjectById',
                requestUrl: `${API_BASE_URL}/ProjectMaster/GetById`,
                requestPayload: { id },
                error: error
            });
            return {
                success: false,
                data: null as any,
                message: error instanceof Error ? error.message : 'Failed to get project',
                timestamp: new Date().toISOString()
            };
        }
    },

    /**
     * Delete Project
     * DELETE /api/ProjectMaster/Delete?id={id}&operatedBy={userId}
     */
    deleteProject: async (id: number): Promise<ApiResponse<null>> => {
        try {
            const userId = getUserId();
            const response = await fetch(`${API_BASE_URL}/ProjectMaster/Delete?id=${id}&operatedBy=${userId}`, {
                method: 'DELETE',
                headers: createAuthHeaders()
            });

            if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                throw new Error(data.message || 'Failed to delete project');
            }

            return {
                success: true,
                data: null,
                message: 'Project deleted successfully',
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('deleteProject Error:', error);
            await logError({
                controllerName: 'ProjectApi',
                methodName: 'deleteProject',
                requestUrl: `${API_BASE_URL}/ProjectMaster/Delete`,
                requestPayload: { id },
                error: error
            });
            return {
                success: false,
                data: null,
                message: error instanceof Error ? error.message : 'Failed to delete project',
                timestamp: new Date().toISOString()
            };
        }
    }
};
