import { ApiResponse } from '../types/apiTypes';
import { logError } from '../../utils/logError';

const API_BASE_URL = 'https://aj.padhyasoft.com/api';

export interface Client {
    clientId: number;
    clientName: string;
    createdBy?: number;
    lastModifiedBy?: number;
    createdDate?: string;
    updatedDate?: string;
}

export interface SaveClientRequest {
    clientId: number;
    clientName: string;
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

export const clientApi = {
    /**
     * Get All Clients
     * GET /api/ClientMaster/GetAllpage?start=0&length=100&sortColumnDir=asc
     */
    getAllClientsPage: async (start: number = 0, length: number = 100, sortColumnDir: string = 'asc'): Promise<ApiResponse<Client[]>> => {
        try {
            const token = getAuthToken();
            if (!token) throw new Error('No authentication token found');

            const response = await fetch(
                `${API_BASE_URL}/ClientMaster/GetAllpage?start=${start}&length=${length}&sortColumnDir=${sortColumnDir}`,
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

            console.log('Client API Response for GetAllPage:', data);

            // Handle different possible response formats
            let items: Client[] = [];

            if (Array.isArray(data)) {
                items = data;
            } else if (data && Array.isArray(data.data)) {
                items = data.data;
            } else if (data && data.data && Array.isArray(data.data.data)) {
                items = data.data.data;
            } else {
                // Recursive find function just in case
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
                message: 'Clients retrieved successfully',
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('getAllClientsPage Error:', error);
            return {
                success: false,
                data: [],
                message: error instanceof Error ? error.message : 'Failed to retrieve clients',
                timestamp: new Date().toISOString()
            };
        }
    },

    /**
     * Save Client (Add/Update)
     * POST /api/ClientMaster/Add
     */
    saveClient: async (clientData: { clientId: number; clientName: string }): Promise<ApiResponse<Client>> => {
        try {
            const userId = getUserId();
            const payload: SaveClientRequest = {
                clientId: clientData.clientId,
                clientName: clientData.clientName,
                createdBy: clientData.clientId === 0 ? 0 : 0, // Request says explicit 0? "createdBy": 0. But for real app usually userId. User said: '"createdBy": 0, "lastModifiedBy": 0'. I will follow that.
                lastModifiedBy: 0
            };

            const response = await fetch(`${API_BASE_URL}/ClientMaster/Add`, {
                method: 'POST',
                headers: createAuthHeaders(),
                body: JSON.stringify(payload)
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Failed to save client');

            return {
                success: true,
                data: data.data || data,
                message: 'Client saved successfully',
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('saveClient Error:', error);
            return {
                success: false,
                data: null as any,
                message: error instanceof Error ? error.message : 'Failed to save client',
                timestamp: new Date().toISOString()
            };
        }
    },

    /**
     * Get Client By ID
     * GET /api/ClientMaster/GetById?id={id}
     */
    getClientById: async (id: number): Promise<ApiResponse<Client>> => {
        try {
            const response = await fetch(`${API_BASE_URL}/ClientMaster/GetById?id=${id}`, {
                method: 'GET',
                headers: createAuthHeaders()
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Failed to get client');

            return {
                success: true,
                data: data.data || data,
                message: 'Retrieved successfully',
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('getClientById Error:', error);
            return {
                success: false,
                data: null as any,
                message: error instanceof Error ? error.message : 'Failed to get client',
                timestamp: new Date().toISOString()
            };
        }
    },

    /**
     * Delete Client
     * DELETE /api/ClientMaster/Delete?id={id}&operatedBy={userId}
     */
    deleteClient: async (id: number): Promise<ApiResponse<null>> => {
        try {
            const userId = getUserId(); // or 0 if user wants 0? User example: operatedBy=1. So use userId.
            const response = await fetch(`${API_BASE_URL}/ClientMaster/Delete?id=${id}&operatedBy=${userId}`, {
                method: 'DELETE',
                headers: createAuthHeaders()
            });

            if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                throw new Error(data.message || 'Failed to delete client');
            }

            return {
                success: true,
                data: null,
                message: 'Client deleted successfully',
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('deleteClient Error:', error);
            return {
                success: false,
                data: null,
                message: error instanceof Error ? error.message : 'Failed to delete client',
                timestamp: new Date().toISOString()
            };
        }
    }
};
