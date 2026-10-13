import { useCallback } from 'react';
import { logError, LogErrorParams } from '../utils/logError';

/**
 * React Hook for Error Logging
 * 
 * This hook provides a convenient way to log errors in React components.
 * It wraps the logError utility function and returns a memoized callback.
 * 
 * @example
 * ```typescript
 * const MyComponent = () => {
 *   const logErrorCallback = useErrorLogger();
 * 
 *   const handleSubmit = async (data) => {
 *     try {
 *       const response = await fetch('/api/City/Add', {
 *         method: 'POST',
 *         body: JSON.stringify(data)
 *       });
 *     } catch (error) {
 *       await logErrorCallback({
 *         controllerName: 'CityPage',
 *         methodName: 'Add',
 *         requestUrl: '/api/City/Add',
 *         requestPayload: data,
 *         error
 *       });
 *     }
 *   };
 * 
 *   return <button onClick={handleSubmit}>Submit</button>;
 * };
 * ```
 * 
 * @returns A memoized error logging function
 */
export const useErrorLogger = () => {
    const logErrorCallback = useCallback(async (params: LogErrorParams) => {
        await logError(params);
    }, []);

    return logErrorCallback;
};

export default useErrorLogger;
