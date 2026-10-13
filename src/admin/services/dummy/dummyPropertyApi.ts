import { ApiResponse, PaginatedResponse, PropertyFilters } from '../types/apiTypes';
import { Property } from '../../types';
import { mockProperties } from '../../data/mockData';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const API_DELAY = 800;

// In-memory storage
let properties: Property[] = [...mockProperties];

/**
 * Dummy Property API
 * Mimics .NET Web API property management endpoints
 */
export const dummyPropertyApi = {
    /**
     * Get all properties with pagination and filters
     * GET /api/properties
     */
    getAll: async (filters: PropertyFilters = {}): Promise<PaginatedResponse<Property>> => {
        await delay(API_DELAY);

        try {
            let filteredProperties = [...properties];

            // Apply filters
            // Type filter removed since property type field is removed
            if (filters.category) {
                filteredProperties = filteredProperties.filter(p => p.category === filters.category);
            }
            if (filters.status) {
                filteredProperties = filteredProperties.filter(p => p.status === filters.status);
            }
            if (filters.city) {
                filteredProperties = filteredProperties.filter(p =>
                    p.city.toLowerCase().includes(filters.city!.toLowerCase())
                );
            }
            if (filters.areaId) {
                filteredProperties = filteredProperties.filter(p => p.areaId === filters.areaId);
            }
            if (filters.minPrice !== undefined) {
                filteredProperties = filteredProperties.filter(p => p.price >= filters.minPrice!);
            }
            if (filters.maxPrice !== undefined) {
                filteredProperties = filteredProperties.filter(p => p.price <= filters.maxPrice!);
            }
            if (filters.featured !== undefined) {
                filteredProperties = filteredProperties.filter(p => p.featured === filters.featured);
            }

            // Apply sorting
            if (filters.sortBy) {
                filteredProperties.sort((a, b) => {
                    const aValue = a[filters.sortBy as keyof Property];
                    const bValue = b[filters.sortBy as keyof Property];
                    const order = filters.sortOrder === 'desc' ? -1 : 1;
                    
                    if (aValue === undefined && bValue === undefined) return 0;
                    if (aValue === undefined) return 1;
                    if (bValue === undefined) return -1;
                    
                    return aValue > bValue ? order : -order;
                });
            }

            // Apply pagination
            const page = filters.page || 1;
            const pageSize = filters.pageSize || 10;
            const startIndex = (page - 1) * pageSize;
            const endIndex = startIndex + pageSize;
            const paginatedProperties = filteredProperties.slice(startIndex, endIndex);

            return {
                success: true,
                data: paginatedProperties,
                pagination: {
                    page,
                    pageSize,
                    totalPages: Math.ceil(filteredProperties.length / pageSize),
                    totalRecords: filteredProperties.length,
                },
                message: 'Properties retrieved successfully',
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            return {
                success: false,
                data: [],
                pagination: { page: 1, pageSize: 10, totalPages: 0, totalRecords: 0 },
                message: 'Failed to retrieve properties',
                timestamp: new Date().toISOString(),
            };
        }
    },

    /**
     * Get property by ID
     * GET /api/properties/{id}
     */
    getById: async (id: string): Promise<ApiResponse<Property>> => {
        await delay(API_DELAY);

        try {
            const property = properties.find(p => p.id === id);

            if (!property) {
                return {
                    success: false,
                    data: null as any,
                    message: 'Property not found',
                    errors: [`Property with ID ${id} does not exist`],
                    timestamp: new Date().toISOString(),
                };
            }

            return {
                success: true,
                data: property,
                message: 'Property retrieved successfully',
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            return {
                success: false,
                data: null as any,
                message: 'Failed to retrieve property',
                errors: [error instanceof Error ? error.message : 'Unknown error'],
                timestamp: new Date().toISOString(),
            };
        }
    },

    /**
     * Create new property
     * POST /api/properties
     */
    create: async (propertyData: Omit<Property, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Property>> => {
        await delay(API_DELAY);

        try {
            const newProperty: Property = {
                ...propertyData,
                id: `prop_${Date.now()}`,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            properties.push(newProperty);

            return {
                success: true,
                data: newProperty,
                message: 'Property created successfully',
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            return {
                success: false,
                data: null as any,
                message: 'Property creation failed',
                errors: [error instanceof Error ? error.message : 'Unknown error'],
                timestamp: new Date().toISOString(),
            };
        }
    },

    /**
     * Update property
     * PUT /api/properties/{id}
     */
    update: async (id: string, propertyData: Partial<Property>): Promise<ApiResponse<Property>> => {
        await delay(API_DELAY);

        try {
            const index = properties.findIndex(p => p.id === id);

            if (index === -1) {
                return {
                    success: false,
                    data: null as any,
                    message: 'Property not found',
                    errors: [`Property with ID ${id} does not exist`],
                    timestamp: new Date().toISOString(),
                };
            }

            properties[index] = {
                ...properties[index],
                ...propertyData,
                updatedAt: new Date().toISOString(),
            };

            return {
                success: true,
                data: properties[index],
                message: 'Property updated successfully',
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            return {
                success: false,
                data: null as any,
                message: 'Property update failed',
                errors: [error instanceof Error ? error.message : 'Unknown error'],
                timestamp: new Date().toISOString(),
            };
        }
    },

    /**
     * Delete property
     * DELETE /api/properties/{id}
     */
    delete: async (id: string): Promise<ApiResponse<null>> => {
        await delay(API_DELAY);

        try {
            const index = properties.findIndex(p => p.id === id);

            if (index === -1) {
                return {
                    success: false,
                    data: null,
                    message: 'Property not found',
                    errors: [`Property with ID ${id} does not exist`],
                    timestamp: new Date().toISOString(),
                };
            }

            properties.splice(index, 1);

            return {
                success: true,
                data: null,
                message: 'Property deleted successfully',
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            return {
                success: false,
                data: null,
                message: 'Property deletion failed',
                errors: [error instanceof Error ? error.message : 'Unknown error'],
                timestamp: new Date().toISOString(),
            };
        }
    },

    /**
     * Update property status
     * PATCH /api/properties/{id}/status
     */
    updateStatus: async (
        id: string,
        status: 'active' | 'inactive' | 'sold' | 'rented' | 'under_process'
    ): Promise<ApiResponse<Property>> => {
        await delay(API_DELAY);

        try {
            const index = properties.findIndex(p => p.id === id);

            if (index === -1) {
                return {
                    success: false,
                    data: null as any,
                    message: 'Property not found',
                    errors: [`Property with ID ${id} does not exist`],
                    timestamp: new Date().toISOString(),
                };
            }

            properties[index].status = status;
            properties[index].updatedAt = new Date().toISOString();

            return {
                success: true,
                data: properties[index],
                message: 'Property status updated successfully',
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            return {
                success: false,
                data: null as any,
                message: 'Status update failed',
                errors: [error instanceof Error ? error.message : 'Unknown error'],
                timestamp: new Date().toISOString(),
            };
        }
    },

    /**
     * Toggle featured status
     * PATCH /api/properties/{id}/featured
     */
    toggleFeatured: async (id: string): Promise<ApiResponse<Property>> => {
        await delay(API_DELAY);

        try {
            const index = properties.findIndex(p => p.id === id);

            if (index === -1) {
                return {
                    success: false,
                    data: null as any,
                    message: 'Property not found',
                    errors: [`Property with ID ${id} does not exist`],
                    timestamp: new Date().toISOString(),
                };
            }

            properties[index].featured = !properties[index].featured;
            properties[index].updatedAt = new Date().toISOString();

            return {
                success: true,
                data: properties[index],
                message: 'Featured status updated successfully',
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            return {
                success: false,
                data: null as any,
                message: 'Featured status update failed',
                errors: [error instanceof Error ? error.message : 'Unknown error'],
                timestamp: new Date().toISOString(),
            };
        }
    },

    /**
     * Bulk delete properties
     * POST /api/properties/bulk-delete
     */
    bulkDelete: async (ids: string[]): Promise<ApiResponse<{ deletedCount: number }>> => {
        await delay(API_DELAY);

        try {
            const initialCount = properties.length;
            properties = properties.filter(p => !ids.includes(p.id));
            const deletedCount = initialCount - properties.length;

            return {
                success: true,
                data: { deletedCount },
                message: `${deletedCount} properties deleted successfully`,
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            return {
                success: false,
                data: { deletedCount: 0 },
                message: 'Bulk delete failed',
                errors: [error instanceof Error ? error.message : 'Unknown error'],
                timestamp: new Date().toISOString(),
            };
        }
    },
};

export default dummyPropertyApi;
