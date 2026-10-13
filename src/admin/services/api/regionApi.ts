const BASE_URL = 'https://aj.padhyasoft.com/api';

export interface Region {
    regionId: number;
    countryId: number;
    countryName?: string; // Required by backend API
    regionName: string;
    regionCode: string;
    createdBy: number;
    lastModifiedBy: number;
}

export interface ApiResponse<T = any> {
    success: boolean;
    message?: string;
    data?: T;
}

export const regionApi = {
    // Get all regions with pagination
    getAllRegionsPage: async (start: number, length: number, sortColumnDir: string): Promise<ApiResponse<Region[]>> => {
        try {
            const response = await fetch(
                `${BASE_URL}/RegionMaster/GetAllPage?start=${start}&length=${length}&sortColumnDir=${sortColumnDir}`,
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
                    }
                }
            );

            if (!response.ok) {
                return { success: false, message: 'Failed to fetch regions' };
            }

            const result = await response.json();
            return {
                success: true,
                data: result.data || result,
                message: result.message
            };
        } catch (error) {
            console.error('Error fetching regions:', error);
            return { success: false, message: 'Network error occurred' };
        }
    },

    // Get region by ID
    getRegionById: async (id: number): Promise<ApiResponse<Region>> => {
        try {
            const response = await fetch(
                `${BASE_URL}/RegionMaster/GetById?id=${id}`,
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
                    }
                }
            );

            if (!response.ok) {
                return { success: false, message: 'Failed to fetch region' };
            }

            const result = await response.json();
            return {
                success: true,
                data: result.data || result,
                message: result.message
            };
        } catch (error) {
            console.error('Error fetching region:', error);
            return { success: false, message: 'Network error occurred' };
        }
    },

    // Add or update region
    addRegion: async (region: Partial<Region>): Promise<ApiResponse> => {
        try {
            console.log('=== Region API Call ===');
            console.log('Endpoint:', `${BASE_URL}/RegionMaster/Add`);
            console.log('Payload:', JSON.stringify(region, null, 2));

            const response = await fetch(
                `${BASE_URL}/RegionMaster/Add`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
                    },
                    body: JSON.stringify(region)
                }
            );

            console.log('HTTP Status:', response.status);
            console.log('HTTP Status Text:', response.statusText);

            const result = await response.json();
            console.log('Response Body:', result);
            console.log('Response Type:', typeof result);

            if (!response.ok) {
                console.error('HTTP request failed with status:', response.status);

                // Extract validation errors from 400 response
                let errorMessage = result.message || `HTTP ${response.status}: ${response.statusText}`;

                if (result.errors) {
                    // Extract first validation error
                    const firstErrorKey = Object.keys(result.errors)[0];
                    if (firstErrorKey && result.errors[firstErrorKey]) {
                        const firstError = result.errors[firstErrorKey];
                        errorMessage = Array.isArray(firstError) ? firstError[0] : firstError;
                    }
                } else if (result.title) {
                    errorMessage = result.title;
                }

                return {
                    success: false,
                    message: errorMessage
                };
            }

            // Handle pipe-delimited response format: "E|Error message|0" or "S|Success message|id"
            if (typeof result === 'string') {
                const parts = result.split('|');
                const status = parts[0]; // E for Error, S for Success
                const message = parts[1] || '';
                const id = parts[2] || '0';

                console.log('Parsed pipe-delimited response:', { status, message, id });

                if (status === 'E') {
                    return {
                        success: false,
                        message: message || 'Failed to save region'
                    };
                } else if (status === 'S') {
                    return {
                        success: true,
                        data: { regionId: parseInt(id) },
                        message: message || 'Region saved successfully'
                    };
                }
            }

            // Handle standard JSON response
            const isSuccess = result.success !== false && response.ok;
            console.log('Determined success:', isSuccess);

            return {
                success: isSuccess,
                data: result.data,
                message: result.message || 'Region saved successfully'
            };
        } catch (error) {
            console.error('Exception in addRegion API:', error);
            return { success: false, message: 'Network error occurred' };
        }
    },

    // Delete region
    deleteRegion: async (id: number, operatedBy: number): Promise<ApiResponse> => {
        try {
            const response = await fetch(
                `${BASE_URL}/RegionMaster/Delete?id=${id}&operatedBy=${operatedBy}`,
                {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
                    }
                }
            );

            if (!response.ok) {
                return { success: false, message: 'Failed to delete region' };
            }

            const result = await response.json();
            return {
                success: true,
                message: result.message || 'Region deleted successfully'
            };
        } catch (error) {
            console.error('Error deleting region:', error);
            return { success: false, message: 'Network error occurred' };
        }
    }
};
