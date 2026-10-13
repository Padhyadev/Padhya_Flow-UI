import { Property } from '../types';
import { PaginatedResponse } from './types/apiTypes';

/**
 * Dummy Property API Service
 * This is a mock implementation for development/testing
 */

// In-memory storage for properties
let properties: Property[] = [];

export interface PropertyFilters {
    page?: number;
    pageSize?: number;
    status?: string;
    category?: string;
    city?: string;
    areaId?: string;
    search?: string;
}

export const dummyPropertyApi = {
    /**
     * Get all properties with pagination and filters
     */
    getAll: async (filters: PropertyFilters = {}): Promise<PaginatedResponse<Property>> => {
        const { page = 1, pageSize = 10, status, category, city, areaId, search } = filters;

        // Filter properties
        let filtered = [...properties];

        if (status) {
            filtered = filtered.filter(p => p.status === status);
        }
        if (category) {
            filtered = filtered.filter(p => p.category === category);
        }
        if (city) {
            filtered = filtered.filter(p => p.city === city);
        }
        if (areaId) {
            filtered = filtered.filter(p => p.areaId === areaId);
        }
        if (search) {
            const searchLower = search.toLowerCase();
            filtered = filtered.filter(p =>
                p.title.toLowerCase().includes(searchLower) ||
                p.location.toLowerCase().includes(searchLower) ||
                p.description.toLowerCase().includes(searchLower)
            );
        }

        // Pagination
        const totalRecords = filtered.length;
        const totalPages = Math.ceil(totalRecords / pageSize);
        const start = (page - 1) * pageSize;
        const end = start + pageSize;
        const paginatedData = filtered.slice(start, end);

        return {
            success: true,
            data: paginatedData,
            pagination: {
                page,
                pageSize,
                totalPages,
                totalRecords,
            },
            message: 'Properties retrieved successfully',
            timestamp: new Date().toISOString(),
        };
    },

    /**
     * Get property by ID
     */
    getById: async (id: string): Promise<{ success: boolean; data: Property | null; message?: string }> => {
        const property = properties.find(p => p.id === id);

        if (!property) {
            return {
                success: false,
                data: null,
                message: 'Property not found',
            };
        }

        return {
            success: true,
            data: property,
            message: 'Property retrieved successfully',
        };
    },

    /**
     * Create new property
     */
    create: async (propertyData: Omit<Property, 'id' | 'createdAt' | 'updatedAt'>): Promise<{ success: boolean; data: Property; message?: string }> => {
        const newProperty: Property = {
            ...propertyData,
            id: Date.now().toString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        properties.push(newProperty);

        return {
            success: true,
            data: newProperty,
            message: 'Property created successfully',
        };
    },

    /**
     * Update property
     */
    update: async (id: string, propertyData: Partial<Property>): Promise<{ success: boolean; data: Property | null; message?: string }> => {
        const index = properties.findIndex(p => p.id === id);

        if (index === -1) {
            return {
                success: false,
                data: null,
                message: 'Property not found',
            };
        }

        const updatedProperty: Property = {
            ...properties[index],
            ...propertyData,
            id, // Ensure ID doesn't change
            updatedAt: new Date().toISOString(),
        };

        properties[index] = updatedProperty;

        return {
            success: true,
            data: updatedProperty,
            message: 'Property updated successfully',
        };
    },

    /**
     * Delete property
     */
    delete: async (id: string): Promise<{ success: boolean; message?: string }> => {
        const index = properties.findIndex(p => p.id === id);

        if (index === -1) {
            return {
                success: false,
                message: 'Property not found',
            };
        }

        properties.splice(index, 1);

        return {
            success: true,
            message: 'Property deleted successfully',
        };
    },

    /**
     * Toggle featured status
     */
    toggleFeatured: async (id: string): Promise<{ success: boolean; data: Property | null; message?: string }> => {
        const property = properties.find(p => p.id === id);

        if (!property) {
            return {
                success: false,
                data: null,
                message: 'Property not found',
            };
        }

        property.featured = !property.featured;
        property.updatedAt = new Date().toISOString();

        return {
            success: true,
            data: property,
            message: `Property ${property.featured ? 'featured' : 'unfeatured'} successfully`,
        };
    },

    /**
     * Update property status
     */
    updateStatus: async (id: string, status: 'active' | 'inactive' | 'sold' | 'rented' | 'under_process'): Promise<{ success: boolean; data: Property | null; message?: string }> => {
        const property = properties.find(p => p.id === id);

        if (!property) {
            return {
                success: false,
                data: null,
                message: 'Property not found',
            };
        }

        property.status = status;
        property.updatedAt = new Date().toISOString();

        return {
            success: true,
            data: property,
            message: 'Property status updated successfully',
        };
    },
};

export default dummyPropertyApi;
