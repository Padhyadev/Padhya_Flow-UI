import { ApiResponse } from '../types/apiTypes';
import { logError } from '../../utils/logError';

const API_BASE_URL = 'https://aj.padhyasoft.com/api';
// const API_BASE_URL = 'https://localhost:7087/api';

export interface ResetPasswordRequest {
    username: string;
}

export interface ResetPasswordResponse {
    message: string;
}

/**
 * Reset Password API Service
 * Connects to .NET Web API
 */
export const resetPasswordApi = {
    /**
     * Reset Password - Real API
     * POST: https://aj.padhyasoft.com/api/ResetPassword/ResetPassword
     */
    resetPassword: async (request: ResetPasswordRequest): Promise<ApiResponse<ResetPasswordResponse>> => {
        try {
            const authToken = localStorage.getItem('admin_token');

            if (!authToken) {
                return {
                    success: false,
                    data: null as any,
                    message: 'Authentication token not found. Please login again.',
                    timestamp: new Date().toISOString(),
                };
            }

            // API expects username as query parameter
            const apiUrl = `${API_BASE_URL}/User/ResetPassword?username=${encodeURIComponent(request.username)}`;

            console.log('🔄 Reset Password API URL:', apiUrl);

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${authToken}`,
                }
            });

            const data = await response.json();

            console.log('🔄 Reset Password API Response:', data);
            console.log('🔄 HTTP Status:', response.status);

            // Check if HTTP request was successful (200-299 range)
            if (response.ok) {
                // HTTP request successful - password reset
                let successMessage = 'Password reset successfully';

                if (data && data.message && typeof data.message === 'string') {
                    // Parse message format: "S|Message|0" or similar
                    if (data.message.includes('|')) {
                        const messageParts = data.message.split('|');
                        if (messageParts.length >= 2) {
                            const extractedMessage = messageParts[1].trim();
                            // Only use extracted message if it's not an error message
                            if (!extractedMessage.toLowerCase().includes('failed') &&
                                !extractedMessage.toLowerCase().includes('error')) {
                                successMessage = extractedMessage;
                            }
                        }
                    } else if (!data.message.toLowerCase().includes('failed') &&
                        !data.message.toLowerCase().includes('error')) {
                        successMessage = data.message;
                    }
                }

                return {
                    success: true,
                    data: { message: successMessage },
                    message: successMessage,
                    timestamp: new Date().toISOString(),
                };
            } else {
                // HTTP request failed
                let errorMessage = 'Failed to reset password';

                if (data && data.message) {
                    let rawMessage = data.message;

                    // Parse message format: "E|Error message|0"
                    if (typeof rawMessage === 'string' && rawMessage.includes('|')) {
                        const messageParts = rawMessage.split('|');
                        if (messageParts.length >= 2) {
                            errorMessage = messageParts[1].trim();
                        } else {
                            errorMessage = rawMessage;
                        }
                    } else {
                        errorMessage = rawMessage;
                    }
                } else if (response.status === 401) {
                    errorMessage = 'Unauthorized. Please login again.';
                } else if (response.status === 400) {
                    errorMessage = 'Invalid request. Please check your input.';
                } else if (response.status === 404) {
                    errorMessage = 'User not found.';
                }

                return {
                    success: false,
                    data: null as any,
                    message: errorMessage,
                    errors: [errorMessage],
                    timestamp: new Date().toISOString(),
                };
            }
        } catch (error) {
            console.error('Reset Password API Error:', error);

            await logError({
                controllerName: 'ResetPasswordApi',
                methodName: 'ResetPassword',
                requestUrl: `${API_BASE_URL}/User/ResetPassword`,
                requestPayload: { username: request.username },
                error
            });

            return {
                success: false,
                data: null as any,
                message: 'Network error occurred. Please try again.',
                errors: [error instanceof Error ? error.message : 'Unknown error'],
                timestamp: new Date().toISOString(),
            };
        }
    },
};

export default resetPasswordApi;
