import { ApiResponse } from '../types/apiTypes';
import { logError } from '../../utils/logError';

// const API_BASE_URL = 'https://localhost:7087/api';
const API_BASE_URL = 'https://aj.padhyasoft.com/api';

export interface Vendor {
    vendorId: number;
    vendorName: string;
    createdBy?: number;
    lastModifiedBy?: number;
}

export const vendorApi = {
    /**
     * Get all vendors with pagination
     * GET /api/VendorMaster/GetAllPage?start=...
     */
    getAllVendorsPage: async (start: number = 0, length: number = 100, sortColumnDir: string = 'asc'): Promise<ApiResponse<Vendor[]>> => {
        try {
            const token = localStorage.getItem('admin_token');
            if (!token) throw new Error('No authentication token found');

            const response = await fetch(
                `${API_BASE_URL}/VendorMaster/GetAllPage?start=${start}&length=${length}&sortColumnDir=${sortColumnDir}`,
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
                message: 'Vendors retrieved successfully',
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('Get Vendors API Error:', error);
            await logError({
                controllerName: 'VendorApi',
                methodName: 'GetAll',
                requestUrl: `${API_BASE_URL}/VendorMaster/GetAllPage`,
                requestPayload: { start, length, sortColumnDir },
                error
            });
            return {
                success: false,
                data: [],
                message: error instanceof Error ? error.message : 'Failed to fetch vendors',
                timestamp: new Date().toISOString()
            };
        }
    },

    /**
     * Add/Update Vendor
     * POST /api/VendorMaster/Add
     */
    addVendor: async (vendorData: Partial<Vendor>): Promise<ApiResponse<Vendor>> => {
        try {
            const token = localStorage.getItem('admin_token');
            if (!token) throw new Error('No authentication token found');

            const response = await fetch(
                `${API_BASE_URL}/VendorMaster/Add`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(vendorData),
                }
            );

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Failed to save vendor (Status: ${response.status})`);
            }

            const data = await response.json();
            const resultData = data.data || data;

            return {
                success: true,
                data: resultData,
                message: 'Vendor saved successfully',
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('Add Vendor API Error:', error);
            await logError({
                controllerName: 'VendorApi',
                methodName: 'Add',
                requestUrl: `${API_BASE_URL}/VendorMaster/Add`,
                requestPayload: vendorData,
                error
            });
            return {
                success: false,
                data: null as any,
                message: error instanceof Error ? error.message : 'Failed to save vendor',
                timestamp: new Date().toISOString()
            };
        }
    },

    /**
     * Get Vendor By ID
     * GET /api/VendorMaster/GetById?id={id}
     */
    getVendorById: async (id: number): Promise<ApiResponse<Vendor>> => {
        try {
            const token = localStorage.getItem('admin_token');
            if (!token) throw new Error('No authentication token found');

            const response = await fetch(
                `${API_BASE_URL}/VendorMaster/GetById?id=${id}`,
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
                message: 'Vendor retrieved successfully',
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('Get Vendor By ID API Error:', error);
            return {
                success: false,
                data: null as any,
                message: error instanceof Error ? error.message : 'Failed to retrieve vendor',
                timestamp: new Date().toISOString()
            };
        }
    },

    /**
     * Delete Vendor
     * DELETE /api/VendorMaster/Delete?id={id}&operatedBy={userId}
     */
    deleteVendor: async (id: number, operatedBy?: number): Promise<ApiResponse<null>> => {
        try {
            const token = localStorage.getItem('admin_token');
            if (!token) throw new Error('No authentication token found');

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
                `${API_BASE_URL}/VendorMaster/Delete?${queryParams.toString()}`,
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
                message: 'Vendor deleted successfully',
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('Delete Vendor API Error:', error);
            return {
                success: false,
                data: null,
                message: error instanceof Error ? error.message : 'Failed to delete vendor',
                timestamp: new Date().toISOString()
            };
        }
    }
};
