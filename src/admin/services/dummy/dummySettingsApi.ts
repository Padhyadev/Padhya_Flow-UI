import { ApiResponse } from '../types/apiTypes';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const API_DELAY = 800;

// Settings storage
let settings = {
    company: {
        name: 'Resido Real Estate',
        email: 'info@resido.com',
        phone: '+91 98765 43210',
        address: 'Mumbai, Maharashtra, India',
        logo: '/logo.png',
    },
    email: {
        smtpHost: 'smtp.gmail.com',
        smtpPort: 587,
        smtpUser: 'noreply@resido.com',
        smtpPassword: '********',
        fromEmail: 'noreply@resido.com',
        fromName: 'Resido',
    },
    notifications: {
        emailEnabled: true,
        smsEnabled: false,
        whatsappEnabled: false,
        newLeadNotification: true,
        followUpReminder: true,
        propertyStatusChange: true,
    },
    general: {
        timezone: 'Asia/Kolkata',
        dateFormat: 'DD/MM/YYYY',
        currency: 'INR',
        language: 'en',
    },
};

/**
 * Dummy Settings API
 * Mimics .NET Web API settings management endpoints
 */
export const dummySettingsApi = {
    /**
     * Get all settings
     * GET /api/settings
     */
    getAll: async (): Promise<ApiResponse<typeof settings>> => {
        await delay(API_DELAY);

        try {
            return {
                success: true,
                data: settings,
                message: 'Settings retrieved successfully',
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            return {
                success: false,
                data: null as any,
                message: 'Failed to retrieve settings',
                errors: [error instanceof Error ? error.message : 'Unknown error'],
                timestamp: new Date().toISOString(),
            };
        }
    },

    /**
     * Update company settings
     * PUT /api/settings/company
     */
    updateCompany: async (companyData: Partial<typeof settings.company>): Promise<ApiResponse<typeof settings.company>> => {
        await delay(API_DELAY);

        try {
            settings.company = { ...settings.company, ...companyData };

            return {
                success: true,
                data: settings.company,
                message: 'Company settings updated successfully',
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            return {
                success: false,
                data: null as any,
                message: 'Failed to update company settings',
                errors: [error instanceof Error ? error.message : 'Unknown error'],
                timestamp: new Date().toISOString(),
            };
        }
    },

    /**
     * Update email settings
     * PUT /api/settings/email
     */
    updateEmail: async (emailData: Partial<typeof settings.email>): Promise<ApiResponse<typeof settings.email>> => {
        await delay(API_DELAY);

        try {
            settings.email = { ...settings.email, ...emailData };

            return {
                success: true,
                data: settings.email,
                message: 'Email settings updated successfully',
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            return {
                success: false,
                data: null as any,
                message: 'Failed to update email settings',
                errors: [error instanceof Error ? error.message : 'Unknown error'],
                timestamp: new Date().toISOString(),
            };
        }
    },

    /**
     * Update notification settings
     * PUT /api/settings/notifications
     */
    updateNotifications: async (notifData: Partial<typeof settings.notifications>): Promise<ApiResponse<typeof settings.notifications>> => {
        await delay(API_DELAY);

        try {
            settings.notifications = { ...settings.notifications, ...notifData };

            return {
                success: true,
                data: settings.notifications,
                message: 'Notification settings updated successfully',
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            return {
                success: false,
                data: null as any,
                message: 'Failed to update notification settings',
                errors: [error instanceof Error ? error.message : 'Unknown error'],
                timestamp: new Date().toISOString(),
            };
        }
    },

    /**
     * Update general settings
     * PUT /api/settings/general
     */
    updateGeneral: async (generalData: Partial<typeof settings.general>): Promise<ApiResponse<typeof settings.general>> => {
        await delay(API_DELAY);

        try {
            settings.general = { ...settings.general, ...generalData };

            return {
                success: true,
                data: settings.general,
                message: 'General settings updated successfully',
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            return {
                success: false,
                data: null as any,
                message: 'Failed to update general settings',
                errors: [error instanceof Error ? error.message : 'Unknown error'],
                timestamp: new Date().toISOString(),
            };
        }
    },

    /**
     * Test email configuration
     * POST /api/settings/test-email
     */
    testEmail: async (toEmail: string): Promise<ApiResponse<null>> => {
        await delay(API_DELAY);

        try {
            // Placeholder for email testing
            console.log(`Test email sent to ${toEmail}`);

            return {
                success: true,
                data: null,
                message: 'Test email sent successfully',
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            return {
                success: false,
                data: null,
                message: 'Failed to send test email',
                errors: [error instanceof Error ? error.message : 'Unknown error'],
                timestamp: new Date().toISOString(),
            };
        }
    },
};

export default dummySettingsApi;
