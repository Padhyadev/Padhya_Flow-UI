import { ApiResponse } from '../types/apiTypes';
import { logError } from '../../utils/logError';

const API_BASE_URL = 'https://aj.padhyasoft.com/api';

export interface ForgotPasswordRequest {
    username: string;
}

export interface ForgotPasswordResponse {
    message: string;
    password?: string; // For the case where password is returned
}

/**
 * Forgot Password API Service
 * Connects to .NET Web API
 */
export const forgotPasswordApi = {
    /**
     * Forgot Password - Real API
     * POST: https://aj.padhyasoft.com/api/User/forgotpassword?username={username}
     */
    forgotPassword: async (username: string): Promise<ApiResponse<ForgotPasswordResponse>> => {
        try {
            const apiUrl = `${API_BASE_URL}/User/forgotpassword?username=${encodeURIComponent(username)}`;
            console.log('🔑 Forgot Password API URL:', apiUrl);

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });

            // Handle non-JSON responses (text/plain)
            const contentType = response.headers.get('content-type');
            let data: any;

            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
            } else {
                // Determine if it's text
                const text = await response.text();
                // Try to parse as JSON just in case
                try {
                    data = JSON.parse(text);
                } catch {
                    data = text; // Keep as string
                }
            }

            console.log('🔑 Forgot Password API Response:', data);

            if (response.ok) {
                let successMessage = 'Password reset successfully';
                let newPassword = '';

                // Handle string response "S|Message|Password"
                if (typeof data === 'string') {
                    if (data.includes('|')) {
                        const parts = data.split('|');
                        if (parts.length >= 3 && parts[0] === 'S') {
                            successMessage = parts[1];
                            newPassword = parts[2];
                        } else {
                            successMessage = data;
                        }
                    } else {
                        successMessage = data;
                    }
                } else if (data && data.isSuccess) {
                    // Handle JSON object response
                    newPassword = data.data?.password || data.password || '';
                    successMessage = data.message || 'Password reset successfully';
                }

                return {
                    success: true,
                    data: {
                        message: successMessage,
                        password: newPassword
                    },
                    message: successMessage,
                    timestamp: new Date().toISOString()
                };
            } else {
                let errorMessage = 'Failed to reset password';
                if (typeof data === 'string') {
                    errorMessage = data;
                } else if (data && data.message) {
                    errorMessage = data.message;
                }

                return {
                    success: false,
                    message: errorMessage,
                    data: { message: errorMessage },
                    timestamp: new Date().toISOString()
                };
            }
        } catch (error) {
            console.error('Forgot Password API Error:', error);
            await logError({
                controllerName: 'ForgotPasswordApi',
                methodName: 'forgotPassword',
                requestUrl: `${API_BASE_URL}/User/forgotpassword`,
                requestPayload: { username },
                error
            });

            return {
                success: false,
                message: 'Network error occurred',
                data: { message: 'Network error' },
                timestamp: new Date().toISOString()
            };
        }
    }
};
