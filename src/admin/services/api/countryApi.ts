const BASE_URL = 'https://aj.padhyasoft.com/api';

export interface Country {
    countryId: number;
    countryName: string;
    countryCode: string;
    currencyCode: string;
    timeZone: string;
    createdBy: number;
    lastModifiedBy: number;
}

export interface ApiResponse<T = any> {
    success: boolean;
    message?: string;
    data?: T;
}

export const countryApi = {
    // Get all countries with pagination
    getAllCountriesPage: async (start: number, length: number, sortColumnDir: string): Promise<ApiResponse<Country[]>> => {
        try {
            const response = await fetch(
                `${BASE_URL}/CountryMaster/GetAllPage?start=${start}&length=${length}&sortColumnDir=${sortColumnDir}`,
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
                    }
                }
            );

            if (!response.ok) {
                return { success: false, message: 'Failed to fetch countries' };
            }

            const result = await response.json();
            return {
                success: true,
                data: result.data || result,
                message: result.message
            };
        } catch (error) {
            console.error('Error fetching countries:', error);
            return { success: false, message: 'Network error occurred' };
        }
    },

    // Get country by ID
    getCountryById: async (id: number): Promise<ApiResponse<Country>> => {
        try {
            const response = await fetch(
                `${BASE_URL}/CountryMaster/GetById?id=${id}`,
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
                    }
                }
            );

            if (!response.ok) {
                return { success: false, message: 'Failed to fetch country' };
            }

            const result = await response.json();
            return {
                success: true,
                data: result.data || result,
                message: result.message
            };
        } catch (error) {
            console.error('Error fetching country:', error);
            return { success: false, message: 'Network error occurred' };
        }
    },

    // Add or update country
    addCountry: async (country: Partial<Country>): Promise<ApiResponse> => {
        try {
            console.log('=== Country API Call ===');
            console.log('Endpoint:', `${BASE_URL}/CountryMaster/Add`);
            console.log('Payload:', JSON.stringify(country, null, 2));

            const response = await fetch(
                `${BASE_URL}/CountryMaster/Add`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
                    },
                    body: JSON.stringify(country)
                }
            );

            console.log('HTTP Status:', response.status);
            console.log('HTTP Status Text:', response.statusText);

            const result = await response.json();
            console.log('Response Body:', result);
            console.log('Response Type:', typeof result);

            if (!response.ok) {
                console.error('HTTP request failed with status:', response.status);
                return {
                    success: false,
                    message: result.message || `HTTP ${response.status}: ${response.statusText}`
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
                        message: message || 'Failed to save country'
                    };
                } else if (status === 'S') {
                    return {
                        success: true,
                        data: { countryId: parseInt(id) },
                        message: message || 'Country saved successfully'
                    };
                }
            }

            // Handle standard JSON response
            const isSuccess = result.success !== false && response.ok;
            console.log('Determined success:', isSuccess);

            return {
                success: isSuccess,
                data: result.data,
                message: result.message || 'Country saved successfully'
            };
        } catch (error) {
            console.error('Exception in addCountry API:', error);
            return { success: false, message: 'Network error occurred' };
        }
    },

    // Delete country
    deleteCountry: async (id: number, operatedBy: number): Promise<ApiResponse> => {
        try {
            const response = await fetch(
                `${BASE_URL}/CountryMaster/Delete?id=${id}&operatedBy=${operatedBy}`,
                {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
                    }
                }
            );

            if (!response.ok) {
                return { success: false, message: 'Failed to delete country' };
            }

            const result = await response.json();
            return {
                success: true,
                message: result.message || 'Country deleted successfully'
            };
        } catch (error) {
            console.error('Error deleting country:', error);
            return { success: false, message: 'Network error occurred' };
        }
    }
};
