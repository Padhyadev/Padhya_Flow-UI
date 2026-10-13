export interface User {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    status: 'active' | 'inactive';
    avatar?: string;
    createdAt: string;
}

export type UserRole = string;

export interface Property {
    id: string;
    title: string;
    description: string;
    category: 'residential' | 'commercial' | 'plot' | 'land' | 'office' | 'warehouse';
    price: number;
    area: number; // in sq.ft
    location: string;
    city: string;
    areaId: string;
    amenities: string[];
    ownerDetails: {
        name: string;
        contact: string;
        email?: string;
    };
    builderDetails?: {
        name: string;
        contact: string;
    };
    status: 'active' | 'inactive' | 'sold' | 'rented' | 'under_process';
    featured: boolean;
    images: string[];
    createdAt: string;
    updatedAt: string;
    createdBy: string;
}

export interface Area {
    id: string;
    name: string;
    city: string;
    description?: string;
    status: 'active' | 'inactive';
    propertyCount: number;
    createdAt: string;
}

export interface Lead {
    id: string;
    name: string;
    mobile: string;
    email?: string;
    requirement: string;
    budget: {
        min: number;
        max: number;
    };
    preferredAreas: string[];
    propertyCategory: string[];
    source: string;
    notes?: string;
    stage: LeadStage;
    status: 'active' | 'closed';
    assignedTo?: string;
    assignedToName?: string;
    createdAt: string;
    updatedAt: string;
    followUpDate?: string;
    remarks: LeadRemark[];
    timeline: LeadTimelineEvent[];
}

export type LeadStage =
    | 'new'
    | 'contacted'
    | 'in_discussion'
    | 'site_visit_scheduled'
    | 'negotiation'
    | 'closed_won'
    | 'closed_lost';

export interface LeadRemark {
    id: string;
    leadId: string;
    text: string;
    createdBy: string;
    createdByName: string;
    createdAt: string;
}

export interface LeadTimelineEvent {
    id: string;
    leadId: string;
    event: string;
    description: string;
    createdBy: string;
    createdByName: string;
    createdAt: string;
}

export interface DashboardStats {
    totalProperties: number;
    activeProperties: number;
    inactiveProperties: number;
    soldProperties: number;
    rentedProperties: number;
    totalLeads: number;
    newLeads: number;
    inProgressLeads: number;
    closedWonLeads: number;
    closedLostLeads: number;
    totalAreas: number;
    totalUsers: number;
    activeUsers: number;
    inactiveUsers: number;
}

export interface Notification {
    id: string;
    userId: string;
    type: 'lead' | 'property' | 'reminder' | 'system';
    title: string;
    message: string;
    read: boolean;
    createdAt: string;
    link?: string;
}

export interface ApiResponse<T> {
    success: boolean;
    data: T;
    message?: string;
    errors?: string[];
}

export interface PaginatedResponse<T> {
    success: boolean;
    data: T[];
    message?: string;
    errors?: string[];
    pagination: {
        page: number;
        pageSize: number;
        totalPages: number;
        totalRecords: number;
    };
}
