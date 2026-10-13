import { ApiResponse, PaginatedResponse, PaginationRequest, ActivityLog } from '../types/apiTypes';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const API_DELAY = 800;

// In-memory storage
let auditLogs: ActivityLog[] = [];

/**
 * Dummy Audit Log API
 * Mimics .NET Web API audit/activity log endpoints
 * Tracks all user actions for compliance and monitoring
 */
export const dummyAuditApi = {
    /**
     * Get all audit logs with pagination and filters
     * GET /api/audit
     */
    getAll: async (filters: PaginationRequest & {
        userId?: string;
        module?: string;
        action?: string;
        fromDate?: string;
        toDate?: string;
    } = {}): Promise<PaginatedResponse<ActivityLog>> => {
        await delay(API_DELAY);

        try {
            let filteredLogs = [...auditLogs];

            // Apply filters
            if (filters.userId) {
                filteredLogs = filteredLogs.filter(log => log.userId === filters.userId);
            }
            if (filters.module) {
                filteredLogs = filteredLogs.filter(log => log.module === filters.module);
            }
            if (filters.action) {
                filteredLogs = filteredLogs.filter(log => log.action.toLowerCase().includes(filters.action!.toLowerCase()));
            }
            if (filters.fromDate) {
                filteredLogs = filteredLogs.filter(log => new Date(log.timestamp) >= new Date(filters.fromDate!));
            }
            if (filters.toDate) {
                filteredLogs = filteredLogs.filter(log => new Date(log.timestamp) <= new Date(filters.toDate!));
            }

            // Sort by timestamp (newest first)
            filteredLogs.sort((a, b) =>
                new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
            );

            // Apply pagination
            const page = filters.page || 1;
            const pageSize = filters.pageSize || 20;
            const startIndex = (page - 1) * pageSize;
            const endIndex = startIndex + pageSize;
            const paginatedLogs = filteredLogs.slice(startIndex, endIndex);

            return {
                success: true,
                data: paginatedLogs,
                pagination: {
                    page,
                    pageSize,
                    totalPages: Math.ceil(filteredLogs.length / pageSize),
                    totalRecords: filteredLogs.length,
                },
                message: 'Audit logs retrieved successfully',
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            return {
                success: false,
                data: [],
                pagination: { page: 1, pageSize: 20, totalPages: 0, totalRecords: 0 },
                message: 'Failed to retrieve audit logs',
                timestamp: new Date().toISOString(),
            };
        }
    },

    /**
     * Log an activity
     * POST /api/audit
     */
    log: async (activity: Omit<ActivityLog, 'id' | 'timestamp'>): Promise<ApiResponse<ActivityLog>> => {
        await delay(API_DELAY);

        try {
            const newLog: ActivityLog = {
                ...activity,
                id: `audit_${Date.now()}`,
                timestamp: new Date().toISOString(),
            };

            auditLogs.push(newLog);

            // Keep only last 1000 logs in memory
            if (auditLogs.length > 1000) {
                auditLogs = auditLogs.slice(-1000);
            }

            return {
                success: true,
                data: newLog,
                message: 'Activity logged successfully',
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            return {
                success: false,
                data: null as any,
                message: 'Failed to log activity',
                errors: [error instanceof Error ? error.message : 'Unknown error'],
                timestamp: new Date().toISOString(),
            };
        }
    },

    /**
     * Get user activity summary
     * GET /api/audit/user/{userId}/summary
     */
    getUserSummary: async (userId: string): Promise<ApiResponse<any>> => {
        await delay(API_DELAY);

        try {
            const userLogs = auditLogs.filter(log => log.userId === userId);

            const summary = {
                totalActions: userLogs.length,
                lastActivity: userLogs.length > 0 ? userLogs[userLogs.length - 1].timestamp : null,
                actionsByModule: {} as Record<string, number>,
                recentActions: userLogs.slice(-10).reverse(),
            };

            // Count actions by module
            userLogs.forEach(log => {
                summary.actionsByModule[log.module] = (summary.actionsByModule[log.module] || 0) + 1;
            });

            return {
                success: true,
                data: summary,
                message: 'User summary retrieved successfully',
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            return {
                success: false,
                data: null,
                message: 'Failed to retrieve user summary',
                errors: [error instanceof Error ? error.message : 'Unknown error'],
                timestamp: new Date().toISOString(),
            };
        }
    },

    /**
     * Get activity statistics
     * GET /api/audit/statistics
     */
    getStatistics: async (fromDate?: string, toDate?: string): Promise<ApiResponse<any>> => {
        await delay(API_DELAY);

        try {
            let filteredLogs = [...auditLogs];

            if (fromDate) {
                filteredLogs = filteredLogs.filter(log => new Date(log.timestamp) >= new Date(fromDate));
            }
            if (toDate) {
                filteredLogs = filteredLogs.filter(log => new Date(log.timestamp) <= new Date(toDate));
            }

            const stats = {
                totalActions: filteredLogs.length,
                actionsByModule: {} as Record<string, number>,
                actionsByUser: {} as Record<string, number>,
                topUsers: [] as Array<{ userId: string; userName: string; count: number }>,
            };

            // Count by module
            filteredLogs.forEach(log => {
                stats.actionsByModule[log.module] = (stats.actionsByModule[log.module] || 0) + 1;
                stats.actionsByUser[log.userId] = (stats.actionsByUser[log.userId] || 0) + 1;
            });

            // Get top users
            const userCounts = Object.entries(stats.actionsByUser).map(([userId, count]) => {
                const log = filteredLogs.find(l => l.userId === userId);
                return {
                    userId,
                    userName: log?.userName || 'Unknown',
                    count: count as number,
                };
            });
            stats.topUsers = userCounts.sort((a, b) => b.count - a.count).slice(0, 10);

            return {
                success: true,
                data: stats,
                message: 'Statistics retrieved successfully',
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            return {
                success: false,
                data: null,
                message: 'Failed to retrieve statistics',
                errors: [error instanceof Error ? error.message : 'Unknown error'],
                timestamp: new Date().toISOString(),
            };
        }
    },

    /**
     * Export audit logs
     * POST /api/audit/export
     */
    export: async (format: 'excel' | 'pdf', filters: any = {}): Promise<ApiResponse<{ downloadUrl: string }>> => {
        await delay(API_DELAY);

        try {
            // Placeholder for export functionality
            // In real API, this would generate file and return download URL
            const downloadUrl = `/downloads/audit-log-${Date.now()}.${format}`;

            return {
                success: true,
                data: { downloadUrl },
                message: `Audit log exported as ${format.toUpperCase()}`,
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            return {
                success: false,
                data: { downloadUrl: '' },
                message: 'Export failed',
                errors: [error instanceof Error ? error.message : 'Unknown error'],
                timestamp: new Date().toISOString(),
            };
        }
    },
};

export default dummyAuditApi;
