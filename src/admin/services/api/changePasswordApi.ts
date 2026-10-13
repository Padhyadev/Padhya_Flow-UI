import { ApiResponse } from '../types/apiTypes';
import { logError } from '../../utils/logError';

const API_BASE_URL = 'https://aj.padhyasoft.com/api';
// const API_BASE_URL = 'https://localhost:7087/api';

export interface ChangePasswordRequest {
    userId: string;
    currentPassword: string;
    newPassword: string;
}

export interface ChangePasswordResponse {
    message: string;
}

/**
 * Change Password API Service
 * Connects to .NET Web API
 */
export const changePasswordApi = {
    /**
     * Change Password - Real API
     * POST: https://aj.padhyasoft.com/api/ChangePassword/Add?id={userId}&token={newPassword}
     * Note: Based on the screenshot, the API uses "id" for userId and "token" for the new password
     */
    changePassword: async (request: ChangePasswordRequest): Promise<ApiResponse<ChangePasswordResponse>> => {
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

            // Extract user ID from JWT token
            let userIdFromToken = '';
            try {
                const tokenParts = authToken.split('.');
                if (tokenParts.length === 3) {
                    const payload = JSON.parse(atob(tokenParts[1]));
                    // Extract user ID from .NET claim format
                    userIdFromToken = payload.userId ||
                        payload.sub ||
                        payload.id ||
                        payload.nameid ||
                        payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] ||
                        '';
                    console.log('🔑 User ID extracted from token:', userIdFromToken);
                }
            } catch (e) {
                console.error('Failed to decode token:', e);
                return {
                    success: false,
                    data: null as any,
                    message: 'Invalid authentication token. Please login again.',
                    timestamp: new Date().toISOString(),
                };
            }

            if (!userIdFromToken) {
                return {
                    success: false,
                    data: null as any,
                    message: 'Could not extract user ID from token. Please login again.',
                    timestamp: new Date().toISOString(),
                };
            }

            // Send request with current password, user ID from token, and new password
            const requestBody = {
                id: parseInt(userIdFromToken),  // Convert to number
                oldPassword: request.currentPassword,
                newPassword: request.newPassword,
                confirmPassword: request.newPassword  // Same as newPassword
            };

            console.log('🔑 Change Password Request Body:', {
                id: requestBody.id,
                oldPassword: '***',
                newPassword: '***',
                confirmPassword: '***'
            });

            const response = await fetch(`${API_BASE_URL}/ChangePassword/Add`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${authToken}`,
                },
                body: JSON.stringify(requestBody)
            });

            const data = await response.json();

            console.log('🔑 Change Password API Response:', data);
            console.log('🔑 HTTP Status:', response.status);

            // Check if HTTP request was successful (200-299 range)
            if (response.ok) {
                // Check for "E|" prefix in the response data or message, which indicates an error despite 200 OK
                let responseMessage = '';
                if (typeof data === 'string') {
                    responseMessage = data;
                } else if (data && data.message) {
                    responseMessage = data.message;
                }

                if (responseMessage && responseMessage.startsWith('E|')) {
                    // It's an error wrapped in 200 OK
                    const messageParts = responseMessage.split('|');
                    const errorMessage = messageParts.length >= 2 ? messageParts[1].trim() : responseMessage;
                    return {
                        success: false,
                        data: null as any,
                        message: errorMessage,
                        errors: [errorMessage],
                        timestamp: new Date().toISOString(),
                    };
                }

                // HTTP request successful - password changed
                let successMessage = 'Password changed successfully';

                if (responseMessage) {
                    // Parse message format: "S|Message|0"
                    if (responseMessage.includes('|')) {
                        const messageParts = responseMessage.split('|');
                        if (messageParts.length >= 2) {
                            successMessage = messageParts[1].trim();
                        }
                    } else {
                        successMessage = responseMessage;
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
                let errorMessage = 'Failed to change password';

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
            console.error('Change Password API Error:', error);

            await logError({
                controllerName: 'ChangePasswordApi',
                methodName: 'ChangePassword',
                requestUrl: `${API_BASE_URL}/ChangePassword/Add`,
                requestPayload: { userId: request.userId }, // Don't log passwords
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

export default changePasswordApi;
