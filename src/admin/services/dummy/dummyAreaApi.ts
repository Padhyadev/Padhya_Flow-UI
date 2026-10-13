import { ApiResponse, PaginatedResponse, PaginationRequest } from '../types/apiTypes';
import { Area } from '../../types';
import { mockAreas } from '../../data/mockData';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const API_DELAY = 800;

// In-memory storage
let areas: Area[] = [...mockAreas];

/**
 * Dummy Area API
 * Mimics .NET Web API area/locality management endpoints
 */
export const dummyAreaApi = {
    /**
     * Get all areas with pagination
     * GET /api/areas
     */
    getAll: async (filters: PaginationRequest & { city?: string; status?: string } = {}): Promise<PaginatedResponse<Area>> => {
        await delay(API_DELAY);

        try {
            let filteredAreas = [...areas];

            // Apply filters
            if (filters.city) {
                filteredAreas = filteredAreas.filter(a =>
                    a.city.toLowerCase().includes(filters.city!.toLowerCase())
                );
            }
            if (filters.status) {
                filteredAreas = filteredAreas.filter(a => a.status === filters.status);
            }

            // Apply sorting
            if (filters.sortBy) {
                filteredAreas.sort((a, b) => {
                    const aValue = a[filters.sortBy as keyof Area];
                    const bValue = b[filters.sortBy as keyof Area];
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
            const paginatedAreas = filteredAreas.slice(startIndex, endIndex);

            return {
                success: true,
                data: paginatedAreas,
                pagination: {
                    page,
                    pageSize,
                    totalPages: Math.ceil(filteredAreas.length / pageSize),
                    totalRecords: filteredAreas.length,
                },
                message: 'Areas retrieved successfully',
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            return {
                success: false,
                data: [],
                pagination: { page: 1, pageSize: 10, totalPages: 0, totalRecords: 0 },
                message: 'Failed to retrieve areas',
                timestamp: new Date().toISOString(),
            };
        }
    },

    /**
     * Get area by ID
     * GET /api/areas/{id}
     */
    getById: async (id: string): Promise<ApiResponse<Area>> => {
        await delay(API_DELAY);

        try {
            const area = areas.find(a => a.id === id);

            if (!area) {
                return {
                    success: false,
                    data: null as any,
                    message: 'Area not found',
                    errors: [`Area with ID ${id} does not exist`],
                    timestamp: new Date().toISOString(),
                };
            }

            return {
                success: true,
                data: area,
                message: 'Area retrieved successfully',
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            return {
                success: false,
                data: null as any,
                message: 'Failed to retrieve area',
                errors: [error instanceof Error ? error.message : 'Unknown error'],
                timestamp: new Date().toISOString(),
            };
        }
    },

    /**
     * Create new area
     * POST /api/areas
     */
    create: async (areaData: Omit<Area, 'id' | 'createdAt' | 'propertyCount'>): Promise<ApiResponse<Area>> => {
        await delay(API_DELAY);

        try {
            // Check if area name already exists in the same city
            const existingArea = areas.find(
                a => a.name.toLowerCase() === areaData.name.toLowerCase() &&
                    a.city.toLowerCase() === areaData.city.toLowerCase()
            );

            if (existingArea) {
                return {
                    success: false,
                    data: null as any,
                    message: 'Area creation failed',
                    errors: ['Area with this name already exists in this city'],
                    timestamp: new Date().toISOString(),
                };
            }

            const newArea: Area = {
                ...areaData,
                id: `area_${Date.now()}`,
                propertyCount: 0,
                createdAt: new Date().toISOString(),
            };

            areas.push(newArea);

            return {
                success: true,
                data: newArea,
                message: 'Area created successfully',
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            return {
                success: false,
                data: null as any,
                message: 'Area creation failed',
                errors: [error instanceof Error ? error.message : 'Unknown error'],
                timestamp: new Date().toISOString(),
            };
        }
    },

    /**
     * Update area
     * PUT /api/areas/{id}
     */
    update: async (id: string, areaData: Partial<Area>): Promise<ApiResponse<Area>> => {
        await delay(API_DELAY);

        try {
            const index = areas.findIndex(a => a.id === id);

            if (index === -1) {
                return {
                    success: false,
                    data: null as any,
                    message: 'Area not found',
                    errors: [`Area with ID ${id} does not exist`],
                    timestamp: new Date().toISOString(),
                };
            }

            // Check name uniqueness if name or city is being updated
            if (areaData.name || areaData.city) {
                const name = areaData.name || areas[index].name;
                const city = areaData.city || areas[index].city;
                const duplicate = areas.find(
                    a => a.id !== id &&
                        a.name.toLowerCase() === name.toLowerCase() &&
                        a.city.toLowerCase() === city.toLowerCase()
                );

                if (duplicate) {
                    return {
                        success: false,
                        data: null as any,
                        message: 'Area update failed',
                        errors: ['Area with this name already exists in this city'],
                        timestamp: new Date().toISOString(),
                    };
                }
            }

            areas[index] = { ...areas[index], ...areaData };

            return {
                success: true,
                data: areas[index],
                message: 'Area updated successfully',
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            return {
                success: false,
                data: null as any,
                message: 'Area update failed',
                errors: [error instanceof Error ? error.message : 'Unknown error'],
                timestamp: new Date().toISOString(),
            };
        }
    },

    /**
     * Delete area
     * DELETE /api/areas/{id}
     */
    delete: async (id: string): Promise<ApiResponse<null>> => {
        await delay(API_DELAY);

        try {
            const index = areas.findIndex(a => a.id === id);

            if (index === -1) {
                return {
                    success: false,
                    data: null,
                    message: 'Area not found',
                    errors: [`Area with ID ${id} does not exist`],
                    timestamp: new Date().toISOString(),
                };
            }

            // Check if area has properties
            if (areas[index].propertyCount > 0) {
                return {
                    success: false,
                    data: null,
                    message: 'Area deletion failed',
                    errors: ['Cannot delete area with existing properties'],
                    timestamp: new Date().toISOString(),
                };
            }

            areas.splice(index, 1);

            return {
                success: true,
                data: null,
                message: 'Area deleted successfully',
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            return {
                success: false,
                data: null,
                message: 'Area deletion failed',
                errors: [error instanceof Error ? error.message : 'Unknown error'],
                timestamp: new Date().toISOString(),
            };
        }
    },

    /**
     * Update area status
     * PATCH /api/areas/{id}/status
     */
    updateStatus: async (id: string, status: 'active' | 'inactive'): Promise<ApiResponse<Area>> => {
        await delay(API_DELAY);

        try {
            const index = areas.findIndex(a => a.id === id);

            if (index === -1) {
                return {
                    success: false,
                    data: null as any,
                    message: 'Area not found',
                    errors: [`Area with ID ${id} does not exist`],
                    timestamp: new Date().toISOString(),
                };
            }

            areas[index].status = status;

            return {
                success: true,
                data: areas[index],
                message: `Area ${status === 'active' ? 'activated' : 'deactivated'} successfully`,
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
     * Get areas by city
     * GET /api/areas/by-city/{city}
     */
    getByCity: async (city: string): Promise<ApiResponse<Area[]>> => {
        await delay(API_DELAY);

        try {
            const cityAreas = areas.filter(a =>
                a.city.toLowerCase() === city.toLowerCase() && a.status === 'active'
            );

            return {
                success: true,
                data: cityAreas,
                message: 'Areas retrieved successfully',
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            return {
                success: false,
                data: [],
                message: 'Failed to retrieve areas',
                errors: [error instanceof Error ? error.message : 'Unknown error'],
                timestamp: new Date().toISOString(),
            };
        }
    },
};

export default dummyAreaApi;
