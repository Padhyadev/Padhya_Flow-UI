import { ApiResponse } from '../types/apiTypes';
import { logError } from '../../utils/logError';

const API_BASE_URL = 'https://aj.padhyasoft.com/api';

export interface PropertyAmenity {
    id: string;
    amenityName: string;
    createdBy: number;
    lastModifiedBy: number;
    createdAt?: string;
    updatedAt?: string;
}

export interface CreatePropertyAmenityRequest {
    amenityName: string;
    createdBy: number;
    lastModifiedBy: number;
}

export interface UpdatePropertyAmenityRequest {
    amenityId: number;
    amenityName: string;
    lastModifiedBy: number;
}

/**
 * Get auth token from localStorage
 */
const getAuthToken = (): string | null => {
    return localStorage.getItem('admin_token');
};

/**
 * Get user ID from localStorage admin_user for createdBy/lastModifiedBy
 */
const getUserId = (): number => {
    const adminUser = localStorage.getItem('admin_user');
    if (adminUser) {
        try {
            const user = JSON.parse(adminUser);
            return parseInt(user.id || user.userId || '0');
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
 * Handle API response and check for authentication errors
 */
const handleApiResponse = async (response: Response) => {
    if (response.status === 401) {
        // Token expired or invalid - redirect to login
        localStorage.removeItem('admin_user');
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_refresh_token');
        window.location.href = '/admin/login';
        throw new Error('Authentication required');
    }

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}`);
    }

    return response.json();
};

/**
 * Property Amenities API Service
 */
export const propertyAmenitiesApi = {
    /**
     * Get all property amenities with pagination
     * GET /api/PropertyAmenities/GetAllpage?start=0&length=100&sortColumnDir=asc
     */
    getAllPropertyAmenitiesPage: async (start: number = 0, length: number = 100, sortColumnDir: string = 'asc'): Promise<ApiResponse<PropertyAmenity[]>> => {
        try {
            const token = getAuthToken();
            if (!token) {
                console.error('🔥 AMENITY API: No authentication token found');
                throw new Error('No authentication token found');
            }

            console.log('🔥 AMENITY API: Fetching amenities with pagination');
            console.log('🔥 AMENITY API: Parameters:', { start, length, sortColumnDir });

            const response = await fetch(
                `${API_BASE_URL}/PropertyAmenities/GetAllpage?start=${start}&length=${length}&sortColumnDir=${sortColumnDir}`,
                {
                    method: 'GET',
                    headers: createAuthHeaders(),
                }
            );

            console.log('🔥 AMENITY API: Response status:', response.status);

            const responseText = await response.text();
            console.log('🔥 AMENITY API: Raw response:', responseText);

            let data;
            try {
                data = responseText ? JSON.parse(responseText) : {};
            } catch (parseError) {
                console.error('🔥 AMENITY API: Failed to parse JSON:', parseError);
                throw new Error('Invalid JSON response from server');
            }

            if (response.status === 401) {
                localStorage.removeItem('admin_user');
                localStorage.removeItem('admin_token');
                localStorage.removeItem('admin_refresh_token');
                window.location.href = '/admin/login';
                throw new Error('Authentication required');
            }

            if (!response.ok) {
                throw new Error(data?.message || data?.Message || `HTTP ${response.status}`);
            }

            // Handle different response formats
            let amenitiesArray: any[] = [];

            if (Array.isArray(data)) {
                amenitiesArray = data;
            } else if (data && Array.isArray(data.data)) {
                amenitiesArray = data.data;
            } else if (data && data.data && Array.isArray(data.data.data)) {
                amenitiesArray = data.data.data;
            } else {
                // Try to find any array in the response
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
                amenitiesArray = findArray(data);
            }

            console.log('🔥 AMENITY API: Extracted amenities count:', amenitiesArray.length);

            // Map API response to our PropertyAmenity format
            const amenities: PropertyAmenity[] = amenitiesArray.map((item: any) => ({
                id: String(item.id || item.Id || item.amenityId || item.AmenityId),
                amenityName: item.amenityName || item.AmenityName || item.name || item.Name || '',
                createdBy: item.createdBy || item.CreatedBy || 0,
                lastModifiedBy: item.lastModifiedBy || item.LastModifiedBy || 0,
                createdAt: item.createdDate || item.CreatedDate || item.createdAt || item.CreatedAt,
                updatedAt: item.updatedDate || item.UpdatedDate || item.updatedAt || item.UpdatedAt,
            }));

            console.log('🔥 AMENITY API: Final amenities:', amenities);

            return {
                success: true,
                data: amenities,
                message: `Successfully retrieved ${amenities.length} amenities`,
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            console.error('🔥 AMENITY API: Error:', error);

            await logError({
                controllerName: 'PropertyAmenitiesApi',
                methodName: 'Get',
                requestUrl: `${API_BASE_URL}/PropertyAmenities/GetAllpage?start=${start}&length=${length}&sortColumnDir=${sortColumnDir}`,
                requestPayload: { start, length, sortColumnDir },
                error
            });

            return {
                success: false,
                data: [],
                message: error instanceof Error ? error.message : 'Failed to fetch amenities',
                timestamp: new Date().toISOString(),
            };
        }
    },

    /**
     * Add New Property Amenity
     * POST /api/PropertyAmenities/Add
     */
    addPropertyAmenity: async (amenityData: { amenityName: string }): Promise<ApiResponse<PropertyAmenity>> => {
        try {
            const token = getAuthToken();
            if (!token) {
                throw new Error('No authentication token found');
            }

            const userId = getUserId();

            const requestBody: CreatePropertyAmenityRequest = {
                amenityName: amenityData.amenityName,
                createdBy: userId,
                lastModifiedBy: userId,
            };

            console.log('🔥 AMENITY API: Adding amenity:', requestBody);

            const response = await fetch(
                `${API_BASE_URL}/PropertyAmenities/Add`,
                {
                    method: 'POST',
                    headers: createAuthHeaders(),
                    body: JSON.stringify(requestBody),
                }
            );

            console.log('🔥 AMENITY API: Add response status:', response.status);

            const contentType = response.headers.get('content-type');
            let data;
            if (response.status === 204 || !contentType || !contentType.includes('application/json')) {
                data = {};
            } else {
                const responseText = await response.text();
                console.log('🔥 AMENITY API: Add response:', responseText);
                data = responseText ? JSON.parse(responseText) : {};
            }

            if (response.status === 401) {
                localStorage.removeItem('admin_user');
                localStorage.removeItem('admin_token');
                window.location.href = '/admin/login';
                throw new Error('Authentication required');
            }

            const isSuccess = response.ok && (response.status === 200 || response.status === 201 || response.status === 204);

            if (!isSuccess) {
                throw new Error(data.message || `Failed to add amenity (Status: ${response.status})`);
            }

            const actualData = data.data || data;
            const amenity: PropertyAmenity = {
                id: String(actualData.id || actualData.Id || Date.now()),
                amenityName: actualData.amenityName || actualData.AmenityName || amenityData.amenityName,
                createdBy: actualData.createdBy || actualData.CreatedBy || userId,
                lastModifiedBy: actualData.lastModifiedBy || actualData.LastModifiedBy || userId,
                createdAt: actualData.createdDate || actualData.CreatedDate || new Date().toISOString(),
                updatedAt: actualData.updatedDate || actualData.UpdatedDate || new Date().toISOString(),
            };

            return {
                success: true,
                data: amenity,
                message: 'Amenity created successfully',
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            console.error('Add Amenity API Error:', error);

            await logError({
                controllerName: 'PropertyAmenitiesApi',
                methodName: 'Add',
                requestUrl: `${API_BASE_URL}/PropertyAmenities/Add`,
                requestPayload: amenityData,
                error
            });

            return {
                success: false,
                data: null as any,
                message: error instanceof Error ? error.message : 'Failed to create amenity',
                timestamp: new Date().toISOString(),
            };
        }
    },

    /**
     * Get Property Amenity By ID
     * GET /api/PropertyAmenities/GetById?id={id}
     */
    getPropertyAmenityById: async (id: string): Promise<ApiResponse<PropertyAmenity>> => {
        try {
            const token = getAuthToken();
            if (!token) {
                throw new Error('No authentication token found');
            }

            console.log('🔥 AMENITY API: Getting amenity by ID:', id);

            const response = await fetch(
                `${API_BASE_URL}/PropertyAmenities/GetById?id=${id}`,
                {
                    method: 'GET',
                    headers: createAuthHeaders(),
                }
            );

            const responseText = await response.text();
            console.log('🔥 AMENITY API: GetById response:', responseText);

            let data = responseText ? JSON.parse(responseText) : {};

            if (response.status === 401) {
                localStorage.removeItem('admin_user');
                localStorage.removeItem('admin_token');
                window.location.href = '/admin/login';
                throw new Error('Authentication required');
            }

            if (!response.ok) {
                throw new Error(data?.message || data?.Message || `HTTP ${response.status}`);
            }

            const actualData = data.data || data;

            const amenity: PropertyAmenity = {
                id: String(actualData.id || actualData.Id || id),
                amenityName: actualData.amenityName || actualData.AmenityName || '',
                createdBy: actualData.createdBy || actualData.CreatedBy || 0,
                lastModifiedBy: actualData.lastModifiedBy || actualData.LastModifiedBy || 0,
                createdAt: actualData.createdDate || actualData.CreatedDate,
                updatedAt: actualData.updatedDate || actualData.UpdatedDate,
            };

            return {
                success: true,
                data: amenity,
                message: 'Amenity retrieved successfully',
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            console.error('Get Amenity By ID API Error:', error);

            await logError({
                controllerName: 'PropertyAmenitiesApi',
                methodName: 'GetById',
                requestUrl: `${API_BASE_URL}/PropertyAmenities/GetById?id=${id}`,
                requestPayload: { id },
                error
            });

            return {
                success: false,
                data: null as any,
                message: error instanceof Error ? error.message : 'Failed to retrieve amenity',
                timestamp: new Date().toISOString(),
            };
        }
    },

    /**
     * Update Property Amenity
     * POST /api/PropertyAmenities/Add (with amenityId for update)
     */
    updatePropertyAmenity: async (id: string, amenityData: { amenityName: string }): Promise<ApiResponse<PropertyAmenity>> => {
        try {
            const token = getAuthToken();
            if (!token) {
                throw new Error('No authentication token found');
            }

            const userId = getUserId();

            const requestBody: UpdatePropertyAmenityRequest = {
                amenityId: parseInt(id),
                amenityName: amenityData.amenityName,
                lastModifiedBy: userId,
            };

            console.log('🔥 AMENITY API: Updating amenity:', requestBody);

            const response = await fetch(
                `${API_BASE_URL}/PropertyAmenities/Add`,
                {
                    method: 'POST',
                    headers: createAuthHeaders(),
                    body: JSON.stringify(requestBody),
                }
            );

            console.log('🔥 AMENITY API: Update response status:', response.status);

            const responseText = await response.text();
            let data = responseText && response.status !== 204 ? JSON.parse(responseText) : {};

            if (response.status === 401) {
                localStorage.removeItem('admin_user');
                localStorage.removeItem('admin_token');
                window.location.href = '/admin/login';
                throw new Error('Authentication required');
            }

            if (!response.ok) {
                throw new Error(data?.message || data?.Message || `HTTP ${response.status}`);
            }

            const actualData = data.data || data;

            const amenity: PropertyAmenity = {
                id: String(actualData.id || actualData.Id || id),
                amenityName: actualData.amenityName || actualData.AmenityName || amenityData.amenityName,
                createdBy: actualData.createdBy || actualData.CreatedBy || 0,
                lastModifiedBy: actualData.lastModifiedBy || actualData.LastModifiedBy || userId,
                createdAt: actualData.createdDate || actualData.CreatedDate || new Date().toISOString(),
                updatedAt: actualData.updatedDate || actualData.UpdatedDate || new Date().toISOString(),
            };

            return {
                success: true,
                data: amenity,
                message: 'Amenity updated successfully',
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            console.error('Update Amenity API Error:', error);

            await logError({
                controllerName: 'PropertyAmenitiesApi',
                methodName: 'Update',
                requestUrl: `${API_BASE_URL}/PropertyAmenities/Add`,
                requestPayload: { id, ...amenityData },
                error
            });

            return {
                success: false,
                data: null as any,
                message: error instanceof Error ? error.message : 'Failed to update amenity',
                timestamp: new Date().toISOString(),
            };
        }
    },

    /**
     * Delete Property Amenity
     * DELETE /api/PropertyAmenities/Delete?id={id}
     */
    deletePropertyAmenity: async (id: string): Promise<ApiResponse<null>> => {
        try {
            const token = getAuthToken();
            if (!token) {
                throw new Error('No authentication token found');
            }

            console.log('🔥 AMENITY API: Deleting amenity ID:', id);

            const response = await fetch(
                `${API_BASE_URL}/PropertyAmenities/Delete?id=${id}`,
                {
                    method: 'DELETE',
                    headers: createAuthHeaders(),
                }
            );

            await handleApiResponse(response);

            return {
                success: true,
                data: null,
                message: 'Amenity deleted successfully',
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            console.error('Delete Amenity API Error:', error);

            await logError({
                controllerName: 'PropertyAmenitiesApi',
                methodName: 'Delete',
                requestUrl: `${API_BASE_URL}/PropertyAmenities/Delete?id=${id}`,
                requestPayload: { id },
                error
            });

            return {
                success: false,
                data: null,
                message: error instanceof Error ? error.message : 'Failed to delete amenity',
                timestamp: new Date().toISOString(),
            };
        }
    },
};

export default propertyAmenitiesApi;
