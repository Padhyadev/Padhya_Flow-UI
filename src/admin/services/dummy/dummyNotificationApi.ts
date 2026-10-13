import { ApiResponse, PaginatedResponse, PaginationRequest, NotificationRequest } from '../types/apiTypes';
import { Notification } from '../../types';
import { mockNotifications } from '../../data/mockData';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const API_DELAY = 800;

// In-memory storage
let notifications: Notification[] = [...mockNotifications];

/**
 * Dummy Notification API
 * Mimics .NET Web API notification management endpoints
 * Ready for email and WhatsApp integration
 */
export const dummyNotificationApi = {
    /**
     * Get all notifications for a user
     * GET /api/notifications
     */
    getAll: async (userId: string, filters: PaginationRequest = {}): Promise<PaginatedResponse<Notification>> => {
        await delay(API_DELAY);

        try {
            let userNotifications = notifications.filter(n => n.userId === userId);

            // Apply sorting (newest first by default)
            userNotifications.sort((a, b) =>
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );

            // Apply pagination
            const page = filters.page || 1;
            const pageSize = filters.pageSize || 10;
            const startIndex = (page - 1) * pageSize;
            const endIndex = startIndex + pageSize;
            const paginatedNotifications = userNotifications.slice(startIndex, endIndex);

            return {
                success: true,
                data: paginatedNotifications,
                pagination: {
                    page,
                    pageSize,
                    totalPages: Math.ceil(userNotifications.length / pageSize),
                    totalRecords: userNotifications.length,
                },
                message: 'Notifications retrieved successfully',
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            return {
                success: false,
                data: [],
                pagination: { page: 1, pageSize: 10, totalPages: 0, totalRecords: 0 },
                message: 'Failed to retrieve notifications',
                timestamp: new Date().toISOString(),
            };
        }
    },

    /**
     * Get unread notification count
     * GET /api/notifications/unread-count
     */
    getUnreadCount: async (userId: string): Promise<ApiResponse<{ count: number }>> => {
        await delay(API_DELAY);

        try {
            const count = notifications.filter(n => n.userId === userId && !n.read).length;

            return {
                success: true,
                data: { count },
                message: 'Unread count retrieved successfully',
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            return {
                success: false,
                data: { count: 0 },
                message: 'Failed to retrieve unread count',
                errors: [error instanceof Error ? error.message : 'Unknown error'],
                timestamp: new Date().toISOString(),
            };
        }
    },

    /**
     * Create notification
     * POST /api/notifications
     */
    create: async (request: NotificationRequest): Promise<ApiResponse<Notification>> => {
        await delay(API_DELAY);

        try {
            const newNotification: Notification = {
                id: `notif_${Date.now()}`,
                userId: request.userId,
                title: request.title,
                message: request.message,
                type: request.type,
                read: false,
                link: request.link,
                createdAt: new Date().toISOString(),
            };

            notifications.push(newNotification);

            return {
                success: true,
                data: newNotification,
                message: 'Notification created successfully',
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            return {
                success: false,
                data: null as any,
                message: 'Notification creation failed',
                errors: [error instanceof Error ? error.message : 'Unknown error'],
                timestamp: new Date().toISOString(),
            };
        }
    },

    /**
     * Mark notification as read
     * PATCH /api/notifications/{id}/read
     */
    markAsRead: async (id: string): Promise<ApiResponse<Notification>> => {
        await delay(API_DELAY);

        try {
            const index = notifications.findIndex(n => n.id === id);

            if (index === -1) {
                return {
                    success: false,
                    data: null as any,
                    message: 'Notification not found',
                    errors: [`Notification with ID ${id} does not exist`],
                    timestamp: new Date().toISOString(),
                };
            }

            notifications[index].read = true;

            return {
                success: true,
                data: notifications[index],
                message: 'Notification marked as read',
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            return {
                success: false,
                data: null as any,
                message: 'Failed to mark notification as read',
                errors: [error instanceof Error ? error.message : 'Unknown error'],
                timestamp: new Date().toISOString(),
            };
        }
    },

    /**
     * Mark all notifications as read
     * PATCH /api/notifications/read-all
     */
    markAllAsRead: async (userId: string): Promise<ApiResponse<null>> => {
        await delay(API_DELAY);

        try {
            notifications.forEach(n => {
                if (n.userId === userId) {
                    n.read = true;
                }
            });

            return {
                success: true,
                data: null,
                message: 'All notifications marked as read',
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            return {
                success: false,
                data: null,
                message: 'Failed to mark all as read',
                errors: [error instanceof Error ? error.message : 'Unknown error'],
                timestamp: new Date().toISOString(),
            };
        }
    },

    /**
     * Delete notification
     * DELETE /api/notifications/{id}
     */
    delete: async (id: string): Promise<ApiResponse<null>> => {
        await delay(API_DELAY);

        try {
            const index = notifications.findIndex(n => n.id === id);

            if (index === -1) {
                return {
                    success: false,
                    data: null,
                    message: 'Notification not found',
                    errors: [`Notification with ID ${id} does not exist`],
                    timestamp: new Date().toISOString(),
                };
            }

            notifications.splice(index, 1);

            return {
                success: true,
                data: null,
                message: 'Notification deleted successfully',
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            return {
                success: false,
                data: null,
                message: 'Notification deletion failed',
                errors: [error instanceof Error ? error.message : 'Unknown error'],
                timestamp: new Date().toISOString(),
            };
        }
    },

    /**
     * Send email notification (API ready placeholder)
     * POST /api/notifications/send-email
     */
    sendEmail: async (to: string, subject: string, body: string): Promise<ApiResponse<null>> => {
        await delay(API_DELAY);

        try {
            // Placeholder for email sending
            // In real API, this would integrate with email service
            console.log(`Email sent to ${to}: ${subject}`);

            return {
                success: true,
                data: null,
                message: 'Email sent successfully',
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            return {
                success: false,
                data: null,
                message: 'Email sending failed',
                errors: [error instanceof Error ? error.message : 'Unknown error'],
                timestamp: new Date().toISOString(),
            };
        }
    },

    /**
     * Send WhatsApp notification (API ready placeholder)
     * POST /api/notifications/send-whatsapp
     */
    sendWhatsApp: async (to: string, message: string): Promise<ApiResponse<null>> => {
        await delay(API_DELAY);

        try {
            // Placeholder for WhatsApp integration
            // In real API, this would integrate with WhatsApp Business API
            console.log(`WhatsApp sent to ${to}: ${message}`);

            return {
                success: true,
                data: null,
                message: 'WhatsApp message sent successfully (placeholder)',
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            return {
                success: false,
                data: null,
                message: 'WhatsApp sending failed',
                errors: [error instanceof Error ? error.message : 'Unknown error'],
                timestamp: new Date().toISOString(),
            };
        }
    },
};

export default dummyNotificationApi;
