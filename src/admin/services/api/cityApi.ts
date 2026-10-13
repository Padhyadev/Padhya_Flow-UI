const BASE_URL = 'https://aj.padhyasoft.com/api';

export interface City {
    cityId: number;
    countryId: number;
    regionId: number;
    cityName: string;
    createdBy: number;
    lastModifiedBy: number;
}

export interface ApiResponse<T = any> {
    success: boolean;
    message?: string;
    data?: T;
}

export const cityApi = {
    // Get all cities with pagination
    getAllCitiesPage: async (start: number, length: number, sortColumnDir: string): Promise<ApiResponse<City[]>> => {
        try {
            const response = await fetch(
                `${BASE_URL}/CityMaster/GetAllPage?start=${start}&length=${length}&sortColumnDir=${sortColumnDir}`,
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
                    }
                }
            );

            if (!response.ok) {
                return { success: false, message: 'Failed to fetch cities' };
            }

            const result = await response.json();
            return {
                success: true,
                data: result.data || result,
                message: result.message
            };
        } catch (error) {
            console.error('Error fetching cities:', error);
            return { success: false, message: 'Network error occurred' };
        }
    },

    // Get city by ID
    getCityById: async (id: number): Promise<ApiResponse<City>> => {
        try {
            const response = await fetch(
                `${BASE_URL}/CityMaster/GetById?id=${id}`,
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
                    }
                }
            );

            if (!response.ok) {
                return { success: false, message: 'Failed to fetch city' };
            }

            const result = await response.json();
            return {
                success: true,
                data: result.data || result,
                message: result.message
            };
        } catch (error) {
            console.error('Error fetching city:', error);
            return { success: false, message: 'Network error occurred' };
        }
    },

    // Add or update city
    addCity: async (city: Partial<City>): Promise<ApiResponse> => {
        try {
            const response = await fetch(
                `${BASE_URL}/CityMaster/Add`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
                    },
                    body: JSON.stringify(city)
                }
            );

            const result = await response.json();

            if (!response.ok) {
                // Extract validation errors from 400 response
                let errorMessage = result.message || `HTTP ${response.status}: ${response.statusText}`;

                if (result.errors) {
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
                const status = parts[0];
                const message = parts[1] || '';
                const id = parts[2] || '0';

                if (status === 'E') {
                    return {
                        success: false,
                        message: message || 'Failed to save city'
                    };
                } else if (status === 'S') {
                    return {
                        success: true,
                        data: { cityId: parseInt(id) },
                        message: message || 'City saved successfully'
                    };
                }
            }

            // Handle standard JSON response
            return {
                success: true,
                data: result.data,
                message: result.message || 'City saved successfully'
            };
        } catch (error) {
            console.error('Error saving city:', error);
            return { success: false, message: 'Network error occurred' };
        }
    },

    // Delete city
    deleteCity: async (id: number, operatedBy: number): Promise<ApiResponse> => {
        try {
            const response = await fetch(
                `${BASE_URL}/CityMaster/Delete?id=${id}&operatedBy=${operatedBy}`,
                {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
                    }
                }
            );

            if (!response.ok) {
                return { success: false, message: 'Failed to delete city' };
            }

            const result = await response.json();
            return {
                success: true,
                message: result.message || 'City deleted successfully'
            };
        } catch (error) {
            console.error('Error deleting city:', error);
            return { success: false, message: 'Network error occurred' };
        }
    }
};
