import { UserRole } from '../../types';

// Standard API Response Format (.NET Compatible)
export interface ApiResponse<T> {
    success: boolean;
    data: T;
    message: string;
    errors?: string[];
    timestamp: string;
}

// Paginated Response
export interface PaginatedResponse<T> {
    success: boolean;
    data: T[];
    pagination: {
        page: number;
        pageSize: number;
        totalPages: number;
        totalRecords: number;
    };
    message: string;
    timestamp: string;
}

// API Error Response
export interface ApiError {
    success: false;
    message: string;
    errors: string[];
    timestamp: string;
}

// Authentication Types
export interface LoginRequest {
    email: string;
    password: string;
}

export interface LoginResponse {
    token: string;
    refreshToken: string;
    user: {
        id: string;
        name: string;
        email: string;
        role: UserRole;
    };
    expiresIn: number;
}

// Menu Access Types
export interface MenuAccessItem {
    id: number;
    parentId: number;
    parentMenuName: string | null;
    area: string;
    controller: string;
    url: string;
    name: string;
    icon: string | null;
    displayOrder: number;
    isSuperAdmin: boolean | null;
    isAdmin: boolean | null;
    isActive: boolean;
    isDeleted: boolean;
}

export interface MenuAccessResponse {
    userId: string;
    menus: MenuAccessItem[];
}

// Pagination Request
export interface PaginationRequest {
    page?: number;
    pageSize?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

// Filter Types
export interface PropertyFilters extends PaginationRequest {
    type?: string;
    category?: string;
    status?: string;
    city?: string;
    areaId?: string;
    minPrice?: number;
    maxPrice?: number;
    featured?: boolean;
}

export interface LeadFilters extends PaginationRequest {
    status?: string;
    assignedTo?: string;
    stage?: string;
    fromDate?: string;
    toDate?: string;
}

export interface UserFilters extends PaginationRequest {
    role?: string;
    status?: string;
}

// CRUD Operation Types
export interface CreateRequest<T> {
    data: T;
}

export interface UpdateRequest<T> {
    id: string;
    data: Partial<T>;
}

export interface DeleteRequest {
    id: string;
}

export interface BulkDeleteRequest {
    ids: string[];
}

// Activity Log Types
export interface ActivityLog {
    id: string;
    userId: string;
    userName: string;
    action: string;
    module: string;
    details: string;
    ipAddress?: string;
    timestamp: string;
}

// Notification Types
export interface NotificationRequest {
    userId: string;
    title: string;
    message: string;
    type: 'lead' | 'property' | 'reminder' | 'system';
    link?: string;
}

// Dashboard Stats Types
export interface DashboardStatsResponse {
    properties: {
        total: number;
        active: number;
        sold: number;
        rented: number;
        inactive: number;
    };
    leads: {
        total: number;
        new: number;
        inProgress: number;
        closedWon: number;
        closedLost: number;
    };
    users: {
        total: number;
        active: number;
        inactive: number;
    };
    areas: {
        total: number;
    };
    recentActivities: ActivityLog[];
}

// Export Types
export interface ExportRequest {
    format: 'excel' | 'pdf';
    filters?: any;
    columns?: string[];
}

// Image Upload Types
export interface ImageUploadResponse {
    success: boolean;
    url: string;
    filename: string;
    size: number;
}

// Lead Timeline Types
export interface LeadTimelineEntry {
    id: string;
    leadId: string;
    action: string;
    description: string;
    performedBy: string;
    performedByName: string;
    timestamp: string;
    metadata?: Record<string, any>;
}

// Follow-up Reminder Types
export interface FollowUpReminder {
    id: string;
    leadId: string;
    leadName: string;
    assignedTo: string;
    assignedToName: string;
    reminderDate: string;
    notes: string;
    status: 'pending' | 'completed' | 'cancelled';
    createdAt: string;
}

export interface CreateReminderRequest {
    leadId: string;
    assignedTo: string;
    reminderDate: string;
    notes: string;
}


