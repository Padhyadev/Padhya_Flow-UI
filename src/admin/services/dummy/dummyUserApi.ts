import { ApiResponse, PaginatedResponse, UserFilters } from '../types/apiTypes';
import { User } from '../../types';
import { mockUsers } from '../../data/mockData';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const API_DELAY = 800;

// In-memory storage (simulates database)
let users: User[] = [...mockUsers];

/**
 * Dummy User API
 * Mimics .NET Web API user management endpoints
 */
export const dummyUserApi = {
    /**
     * Get all users with pagination and filters
     * GET /api/users
     */
    getAll: async (filters: UserFilters = {}): Promise<PaginatedResponse<User>> => {
        await delay(API_DELAY);

        try {
            let filteredUsers = [...users];

            // Apply filters
            if (filters.role) {
                filteredUsers = filteredUsers.filter(u => u.role === filters.role);
            }
            if (filters.status) {
                filteredUsers = filteredUsers.filter(u => u.status === filters.status);
            }

            // Apply sorting
            if (filters.sortBy) {
                filteredUsers.sort((a, b) => {
                    const aValue = a[filters.sortBy as keyof User];
                    const bValue = b[filters.sortBy as keyof User];
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
            const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

            return {
                success: true,
                data: paginatedUsers,
                pagination: {
                    page,
                    pageSize,
                    totalPages: Math.ceil(filteredUsers.length / pageSize),
                    totalRecords: filteredUsers.length,
                },
                message: 'Users retrieved successfully',
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            return {
                success: false,
                data: [],
                pagination: { page: 1, pageSize: 10, totalPages: 0, totalRecords: 0 },
                message: 'Failed to retrieve users',
                timestamp: new Date().toISOString(),
            };
        }
    },

    /**
     * Get user by ID
     * GET /api/users/{id}
     */
    getById: async (id: string): Promise<ApiResponse<User>> => {
        await delay(API_DELAY);

        try {
            const user = users.find(u => u.id === id);

            if (!user) {
                return {
                    success: false,
                    data: null as any,
                    message: 'User not found',
                    errors: [`User with ID ${id} does not exist`],
                    timestamp: new Date().toISOString(),
                };
            }

            return {
                success: true,
                data: user,
                message: 'User retrieved successfully',
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            return {
                success: false,
                data: null as any,
                message: 'Failed to retrieve user',
                errors: [error instanceof Error ? error.message : 'Unknown error'],
                timestamp: new Date().toISOString(),
            };
        }
    },

    /**
     * Create new user
     * POST /api/users
     */
    create: async (userData: Omit<User, 'id' | 'createdAt'>): Promise<ApiResponse<User>> => {
        await delay(API_DELAY);

        try {
            // Check if email already exists
            const existingUser = users.find(u => u.email === userData.email);
            if (existingUser) {
                return {
                    success: false,
                    data: null as any,
                    message: 'User creation failed',
                    errors: ['Email already exists'],
                    timestamp: new Date().toISOString(),
                };
            }

            const newUser: User = {
                ...userData,
                id: `user_${Date.now()}`,
                createdAt: new Date().toISOString(),
            };

            users.push(newUser);

            return {
                success: true,
                data: newUser,
                message: 'User created successfully',
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            return {
                success: false,
                data: null as any,
                message: 'User creation failed',
                errors: [error instanceof Error ? error.message : 'Unknown error'],
                timestamp: new Date().toISOString(),
            };
        }
    },

    /**
     * Update user
     * PUT /api/users/{id}
     */
    update: async (id: string, userData: Partial<User>): Promise<ApiResponse<User>> => {
        await delay(API_DELAY);

        try {
            const index = users.findIndex(u => u.id === id);

            if (index === -1) {
                return {
                    success: false,
                    data: null as any,
                    message: 'User not found',
                    errors: [`User with ID ${id} does not exist`],
                    timestamp: new Date().toISOString(),
                };
            }

            // Check email uniqueness if email is being updated
            if (userData.email && userData.email !== users[index].email) {
                const emailExists = users.some(u => u.email === userData.email && u.id !== id);
                if (emailExists) {
                    return {
                        success: false,
                        data: null as any,
                        message: 'User update failed',
                        errors: ['Email already exists'],
                        timestamp: new Date().toISOString(),
                    };
                }
            }

            users[index] = { ...users[index], ...userData };

            return {
                success: true,
                data: users[index],
                message: 'User updated successfully',
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            return {
                success: false,
                data: null as any,
                message: 'User update failed',
                errors: [error instanceof Error ? error.message : 'Unknown error'],
                timestamp: new Date().toISOString(),
            };
        }
    },

    /**
     * Delete user
     * DELETE /api/users/{id}
     */
    delete: async (id: string): Promise<ApiResponse<null>> => {
        await delay(API_DELAY);

        try {
            const index = users.findIndex(u => u.id === id);

            if (index === -1) {
                return {
                    success: false,
                    data: null,
                    message: 'User not found',
                    errors: [`User with ID ${id} does not exist`],
                    timestamp: new Date().toISOString(),
                };
            }

            users.splice(index, 1);

            return {
                success: true,
                data: null,
                message: 'User deleted successfully',
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            return {
                success: false,
                data: null,
                message: 'User deletion failed',
                errors: [error instanceof Error ? error.message : 'Unknown error'],
                timestamp: new Date().toISOString(),
            };
        }
    },

    /**
     * Activate/Deactivate user
     * PATCH /api/users/{id}/status
     */
    updateStatus: async (id: string, status: 'active' | 'inactive'): Promise<ApiResponse<User>> => {
        await delay(API_DELAY);

        try {
            const index = users.findIndex(u => u.id === id);

            if (index === -1) {
                return {
                    success: false,
                    data: null as any,
                    message: 'User not found',
                    errors: [`User with ID ${id} does not exist`],
                    timestamp: new Date().toISOString(),
                };
            }

            users[index].status = status;

            return {
                success: true,
                data: users[index],
                message: `User ${status === 'active' ? 'activated' : 'deactivated'} successfully`,
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
};

export default dummyUserApi;
