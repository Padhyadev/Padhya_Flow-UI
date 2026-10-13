import { useState, useCallback } from 'react';
import { ApiResponse, PaginatedResponse } from '../types/apiTypes';
import { logError } from '../../utils/logError';

/**
 * Generic API Hook
 * Provides loading, error, and data states for API calls
 */
export function useApi<T>() {
    const [data, setData] = useState<T | T[] | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const execute = useCallback(async (apiCall: () => Promise<ApiResponse<T> | PaginatedResponse<T>>) => {
        setLoading(true);
        setError(null);

        try {
            const response = await apiCall();

            if (response.success) {
                if ('pagination' in response) {
                    // This is a PaginatedResponse, data is T[]
                    setData(response.data);
                } else {
                    // This is an ApiResponse, data is T
                    setData(response.data);
                }
                return response;
            } else {
                const errorMessage = ('errors' in response && Array.isArray(response.errors)) ? response.errors.join(', ') : response.message || 'An error occurred';
                setError(errorMessage);
                return response;
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
            setError(errorMessage);

            await logError({
                controllerName: 'useApi',
                methodName: 'execute',
                requestUrl: 'N/A',
                requestPayload: null,
                error: err
            });

            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const reset = useCallback(() => {
        setData(null);
        setError(null);
        setLoading(false);
    }, []);

    return {
        data,
        loading,
        error,
        execute,
        reset,
    };
}

/**
 * Paginated API Hook
 * Extends useApi with pagination support
 */
export function usePaginatedApi<T>() {
    const [data, setData] = useState<T[]>([]);
    const [pagination, setPagination] = useState({
        page: 1,
        pageSize: 10,
        totalPages: 0,
        totalRecords: 0,
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const execute = useCallback(async (apiCall: () => Promise<PaginatedResponse<T>>) => {
        setLoading(true);
        setError(null);

        try {
            const response = await apiCall();

            if (response.success) {
                setData(response.data);
                setPagination(response.pagination);
                return response;
            } else {
                const errorMessage = ('errors' in response && Array.isArray(response.errors)) ? response.errors.join(', ') : response.message || 'An error occurred';
                setError(errorMessage);
                return response;
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
            setError(errorMessage);

            await logError({
                controllerName: 'usePaginatedApi',
                methodName: 'execute',
                requestUrl: 'N/A',
                requestPayload: null,
                error: err
            });

            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const reset = useCallback(() => {
        setData([]);
        setPagination({ page: 1, pageSize: 10, totalPages: 0, totalRecords: 0 });
        setError(null);
        setLoading(false);
    }, []);

    return {
        data,
        pagination,
        loading,
        error,
        execute,
        reset,
    };
}

/**
 * Single API Response Hook
 * For APIs that return single objects (not arrays)
 */
export function useSingleApi<T>() {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const execute = useCallback(async (apiCall: () => Promise<ApiResponse<T>>) => {
        setLoading(true);
        setError(null);

        try {
            const response = await apiCall();

            if (response.success) {
                setData(response.data);
                return response;
            } else {
                const errorMessage = ('errors' in response && Array.isArray(response.errors)) ? response.errors.join(', ') : response.message || 'An error occurred';
                setError(errorMessage);
                return response;
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
            setError(errorMessage);

            await logError({
                controllerName: 'useSingleApi',
                methodName: 'execute',
                requestUrl: 'N/A',
                requestPayload: null,
                error: err
            });

            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const reset = useCallback(() => {
        setData(null);
        setError(null);
        setLoading(false);
    }, []);

    return {
        data,
        loading,
        error,
        execute,
        reset,
    };
}

export default useApi;
