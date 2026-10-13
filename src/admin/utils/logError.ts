/**
 * Global Error Logging Utility
 * 
 * This utility sends error logs to the LogEntry API whenever an API call fails.
 * It automatically collects user information, error details, and system information.
 * 
 * @example
 * ```typescript
 * try {
 *   const response = await fetch('/api/City/Add', { method: 'POST', body: JSON.stringify(data) });
 * } catch (error) {
 *   await logError({
 *     controllerName: 'CityPage',
 *     methodName: 'Add',
 *     requestUrl: '/api/City/Add',
 *     requestPayload: data,
 *     error
 *   });
 * }
 * ```
 */

const LOG_ENTRY_API_URL = 'https://aj.padhyasoft.com/api/LogEntry';
const IP_API_URL = 'https://api64.ipify.org?format=json';

export interface LogErrorParams {
    /** Name of the page/component where the error occurred (e.g., "CityPage", "LeadPage") */
    controllerName: string;
    /** Name of the method/action (e.g., "Add", "Update", "Delete", "Get") */
    methodName: string;
    /** The API URL that failed */
    requestUrl: string;
    /** The request payload (will be stringified) */
    requestPayload?: any;
    /** The error object */
    error: Error | any;
}

export interface LogEntryPayload {
    ApplicationName: string;
    ControllerName: string;
    MethodName: string;
    ErrorMessage: string;
    ErrorType: string;
    StackTrace: string;
    RequestUrl: string;
    RequestPayload: string;
    UserAgent: string;
    UserId: number;
    ClientIP: string;
}

/**
 * Extract User ID from JWT token stored in localStorage
 * Uses the same pattern as existing API files (getUserId)
 */
const getUserIdFromToken = (): number => {
    try {
        const token = localStorage.getItem('admin_token');
        if (!token) return 0;

        // JWT tokens have 3 parts separated by dots: header.payload.signature
        const parts = token.split('.');
        if (parts.length !== 3) return 0;

        // Decode the payload (second part)
        const payload = parts[1];
        const decodedPayload = atob(payload);
        const parsedPayload = JSON.parse(decodedPayload);

        // Extract user ID from common JWT claim names
        const userId = parsedPayload.userId ||
            parsedPayload.sub ||
            parsedPayload.id ||
            parsedPayload.user_id ||
            parsedPayload.nameid || // Common in .NET JWT tokens
            0;

        return parseInt(String(userId)) || 0;
    } catch (error) {
        console.warn('Failed to extract user ID from token:', error);
        return 0;
    }
};

/**
 * Fetch client IP address from ipify API
 */
const getClientIP = async (): Promise<string> => {
    try {
        const response = await fetch(IP_API_URL, {
            method: 'GET',
            headers: { 'Accept': 'application/json' },
            // Add a short timeout to avoid hanging if network is flaky
            signal: AbortSignal.timeout(2000)
        });

        if (!response.ok) {
            return 'Unknown';
        }

        const data = await response.json();
        return data.ip || 'Unknown';
    } catch (error) {
        // Silently fail for IP fetch
        return 'Unknown';
    }
};

/**
 * Send error log to LogEntry API
 * 
 * @param params - Error logging parameters
 * @returns Promise that resolves when the log is sent (or fails silently)
 */
export const logError = async (params: LogErrorParams): Promise<void> => {
    try {
        const {
            controllerName,
            methodName,
            requestUrl,
            requestPayload,
            error
        } = params;

        // Extract error details
        const errorMessage = error?.message || error?.toString() || 'Unknown error';
        const errorType = error?.code || error?.name || 'API Error';
        const stackTrace = error?.stack || new Error().stack || 'No stack trace available';

        // Collect system information - Fail quietly on IP fetch
        let clientIP = 'Unknown';
        try {
            clientIP = await getClientIP();
        } catch (e) {
            // Ignore IP fetch failure
        }

        const userId = getUserIdFromToken();
        const userAgent = navigator.userAgent;

        // Prepare payload for LogEntry API
        const logPayload: LogEntryPayload = {
            ApplicationName: 'Frontend',
            ControllerName: controllerName,
            MethodName: methodName,
            ErrorMessage: errorMessage,
            ErrorType: errorType,
            StackTrace: stackTrace,
            RequestUrl: requestUrl,
            RequestPayload: requestPayload ? JSON.stringify(requestPayload) : '',
            UserAgent: userAgent,
            UserId: userId,
            ClientIP: clientIP
        };

        // Get auth token for LogEntry API
        const token = localStorage.getItem('admin_token');
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        // Send log to LogEntry API
        const response = await fetch(LOG_ENTRY_API_URL, {
            method: 'POST',
            headers,
            body: JSON.stringify(logPayload)
        });

        if (!response.ok) {
            console.warn('Failed to send error log to LogEntry API:', response.status);
        } else {
            console.log('Error log sent successfully to LogEntry API');
        }
    } catch (loggingError) {
        // Fail silently - we don't want logging errors to break the application
        console.error('Error in logError utility:', loggingError);
    }
};

/**
 * Alternative export for backward compatibility
 */
export default logError;
