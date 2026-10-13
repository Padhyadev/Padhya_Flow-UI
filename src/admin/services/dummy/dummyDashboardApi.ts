import { ApiResponse, DashboardStatsResponse, ActivityLog } from '../types/apiTypes';
import { mockDashboardStats } from '../../data/mockData';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const API_DELAY = 800;

// In-memory activity log
let activityLogs: ActivityLog[] = [];

/**
 * Dummy Dashboard API
 * Mimics .NET Web API dashboard/analytics endpoints
 * Provides real-time stats and recent activities
 */
export const dummyDashboardApi = {
    /**
     * Get dashboard statistics
     * GET /api/dashboard/stats
     */
    getStats: async (): Promise<ApiResponse<DashboardStatsResponse>> => {
        await delay(API_DELAY);

        try {
            // Get recent activities (last 10)
            const recentActivities = activityLogs
                .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                .slice(0, 10);

            const stats: DashboardStatsResponse = {
                properties: {
                    total: mockDashboardStats.totalProperties,
                    active: mockDashboardStats.activeProperties,
                    sold: mockDashboardStats.soldProperties,
                    rented: mockDashboardStats.rentedProperties,
                    inactive: mockDashboardStats.inactiveProperties,
                },
                leads: {
                    total: mockDashboardStats.totalLeads,
                    new: mockDashboardStats.newLeads,
                    inProgress: mockDashboardStats.inProgressLeads,
                    closedWon: mockDashboardStats.closedWonLeads,
                    closedLost: mockDashboardStats.closedLostLeads,
                },
                users: {
                    total: mockDashboardStats.totalUsers,
                    active: mockDashboardStats.activeUsers,
                    inactive: mockDashboardStats.inactiveUsers,
                },
                areas: {
                    total: mockDashboardStats.totalAreas,
                },
                recentActivities,
            };

            return {
                success: true,
                data: stats,
                message: 'Dashboard stats retrieved successfully',
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            return {
                success: false,
                data: null as any,
                message: 'Failed to retrieve dashboard stats',
                errors: [error instanceof Error ? error.message : 'Unknown error'],
                timestamp: new Date().toISOString(),
            };
        }
    },

    /**
     * Get sales executive performance
     * GET /api/dashboard/performance
     */
    getPerformance: async (): Promise<ApiResponse<any>> => {
        await delay(API_DELAY);

        try {
            // Mock performance data
            const performance = [
                {
                    executiveId: '2',
                    executiveName: 'Rajesh Kumar',
                    leadsAssigned: 45,
                    leadsConverted: 12,
                    conversionRate: 26.7,
                    revenue: 5400000,
                },
                {
                    executiveId: '5',
                    executiveName: 'Amit Patel',
                    leadsAssigned: 38,
                    leadsConverted: 9,
                    conversionRate: 23.7,
                    revenue: 4200000,
                },
            ];

            return {
                success: true,
                data: performance,
                message: 'Performance data retrieved successfully',
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            return {
                success: false,
                data: [],
                message: 'Failed to retrieve performance data',
                errors: [error instanceof Error ? error.message : 'Unknown error'],
                timestamp: new Date().toISOString(),
            };
        }
    },

    /**
     * Get area-wise property distribution
     * GET /api/dashboard/area-distribution
     */
    getAreaDistribution: async (): Promise<ApiResponse<any>> => {
        await delay(API_DELAY);

        try {
            const distribution = [
                { areaName: 'Bandra West', propertyCount: 45, city: 'Mumbai' },
                { areaName: 'Andheri East', propertyCount: 67, city: 'Mumbai' },
                { areaName: 'Powai', propertyCount: 34, city: 'Mumbai' },
                { areaName: 'Koramangala', propertyCount: 52, city: 'Bangalore' },
                { areaName: 'Whitefield', propertyCount: 41, city: 'Bangalore' },
            ];

            return {
                success: true,
                data: distribution,
                message: 'Area distribution retrieved successfully',
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            return {
                success: false,
                data: [],
                message: 'Failed to retrieve area distribution',
                errors: [error instanceof Error ? error.message : 'Unknown error'],
                timestamp: new Date().toISOString(),
            };
        }
    },


    /**
     * Log activity
     * POST /api/dashboard/activity
     */
    logActivity: async (activity: Omit<ActivityLog, 'id' | 'timestamp'>): Promise<ApiResponse<null>> => {
        await delay(API_DELAY);

        try {
            const newActivity: ActivityLog = {
                ...activity,
                id: `activity_${Date.now()}`,
                timestamp: new Date().toISOString(),
            };

            activityLogs.push(newActivity);

            // Keep only last 100 activities
            if (activityLogs.length > 100) {
                activityLogs = activityLogs.slice(-100);
            }

            return {
                success: true,
                data: null,
                message: 'Activity logged successfully',
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            return {
                success: false,
                data: null,
                message: 'Failed to log activity',
                errors: [error instanceof Error ? error.message : 'Unknown error'],
                timestamp: new Date().toISOString(),
            };
        }
    },
};

export default dummyDashboardApi;
