// API Base Configuration
const API_BASE_URL = 'http://localhost:5000/api'; // Change this to your actual API URL
import { logError } from '../utils/logError';

// Simulated delay for API calls
const SIMULATE_DELAY = 800;

// Helper function to simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Generic API call wrapper
async function apiCall<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    await delay(SIMULATE_DELAY); // Simulate network delay

    const token = localStorage.getItem('admin_token');

    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
    };

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers,
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error('API Call Error:', error);

        await logError({
            controllerName: 'ApiService',
            methodName: 'apiCall',
            requestUrl: `${API_BASE_URL}${endpoint}`,
            requestPayload: options.body || null,
            error
        });

        throw error;
    }
}

// API Service
export const apiService = {
    // GET request
    get: <T>(endpoint: string): Promise<T> => {
        return apiCall<T>(endpoint, { method: 'GET' });
    },

    // POST request
    post: <T>(endpoint: string, data: any): Promise<T> => {
        return apiCall<T>(endpoint, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    // PUT request
    put: <T>(endpoint: string, data: any): Promise<T> => {
        return apiCall<T>(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    // DELETE request
    delete: <T>(endpoint: string): Promise<T> => {
        return apiCall<T>(endpoint, { method: 'DELETE' });
    },

    // PATCH request
    patch: <T>(endpoint: string, data: any): Promise<T> => {
        return apiCall<T>(endpoint, {
            method: 'PATCH',
            body: JSON.stringify(data),
        });
    },
};

export default apiService;
