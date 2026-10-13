import { ApiResponse, PaginatedResponse, LeadFilters, LeadTimelineEntry, FollowUpReminder, CreateReminderRequest } from '../types/apiTypes';
import { Lead } from '../../types';
import { mockLeads } from '../../data/mockData';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const API_DELAY = 800;

// In-memory storage
let leads: Lead[] = [...mockLeads];
let leadTimeline: LeadTimelineEntry[] = [];
let reminders: FollowUpReminder[] = [];

/**
 * Dummy Lead API
 * Mimics .NET Web API lead management endpoints
 * Includes complete status workflow and timeline tracking
 */
export const dummyLeadApi = {
    /**
     * Get all leads with pagination and filters
     * GET /api/leads
     */
    getAll: async (filters: LeadFilters = {}): Promise<PaginatedResponse<Lead>> => {
        await delay(API_DELAY);

        try {
            let filteredLeads = [...leads];

            // Apply filters
            if (filters.status) {
                filteredLeads = filteredLeads.filter(l => l.status === filters.status);
            }
            if (filters.stage) {
                filteredLeads = filteredLeads.filter(l => l.stage === filters.stage);
            }
            if (filters.assignedTo) {
                filteredLeads = filteredLeads.filter(l => l.assignedTo === filters.assignedTo);
            }
            if (filters.fromDate) {
                filteredLeads = filteredLeads.filter(l => new Date(l.createdAt) >= new Date(filters.fromDate!));
            }
            if (filters.toDate) {
                filteredLeads = filteredLeads.filter(l => new Date(l.createdAt) <= new Date(filters.toDate!));
            }

            // Apply sorting
            if (filters.sortBy) {
                filteredLeads.sort((a, b) => {
                    const aValue = a[filters.sortBy as keyof Lead];
                    const bValue = b[filters.sortBy as keyof Lead];
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
            const paginatedLeads = filteredLeads.slice(startIndex, endIndex);

            return {
                success: true,
                data: paginatedLeads,
                pagination: {
                    page,
                    pageSize,
                    totalPages: Math.ceil(filteredLeads.length / pageSize),
                    totalRecords: filteredLeads.length,
                },
                message: 'Leads retrieved successfully',
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            return {
                success: false,
                data: [],
                pagination: { page: 1, pageSize: 10, totalPages: 0, totalRecords: 0 },
                message: 'Failed to retrieve leads',
                timestamp: new Date().toISOString(),
            };
        }
    },

    /**
     * Get lead by ID
     * GET /api/leads/{id}
     */
    getById: async (id: string): Promise<ApiResponse<Lead>> => {
        await delay(API_DELAY);

        try {
            const lead = leads.find(l => l.id === id);

            if (!lead) {
                return {
                    success: false,
                    data: null as any,
                    message: 'Lead not found',
                    errors: [`Lead with ID ${id} does not exist`],
                    timestamp: new Date().toISOString(),
                };
            }

            return {
                success: true,
                data: lead,
                message: 'Lead retrieved successfully',
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            return {
                success: false,
                data: null as any,
                message: 'Failed to retrieve lead',
                errors: [error instanceof Error ? error.message : 'Unknown error'],
                timestamp: new Date().toISOString(),
            };
        }
    },

    /**
     * Create new lead
     * POST /api/leads
     */
    create: async (leadData: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Lead>> => {
        await delay(API_DELAY);

        try {
            const newLead: Lead = {
                ...leadData,
                id: `lead_${Date.now()}`,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            leads.push(newLead);

            // Add timeline entry
            leadTimeline.push({
                id: `timeline_${Date.now()}`,
                leadId: newLead.id,
                action: 'created',
                description: 'Lead created',
                performedBy: leadData.assignedTo || 'system',
                performedByName: 'System',
                timestamp: new Date().toISOString(),
            });

            return {
                success: true,
                data: newLead,
                message: 'Lead created successfully',
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            return {
                success: false,
                data: null as any,
                message: 'Lead creation failed',
                errors: [error instanceof Error ? error.message : 'Unknown error'],
                timestamp: new Date().toISOString(),
            };
        }
    },

    /**
     * Update lead
     * PUT /api/leads/{id}
     */
    update: async (id: string, leadData: Partial<Lead>): Promise<ApiResponse<Lead>> => {
        await delay(API_DELAY);

        try {
            const index = leads.findIndex(l => l.id === id);

            if (index === -1) {
                return {
                    success: false,
                    data: null as any,
                    message: 'Lead not found',
                    errors: [`Lead with ID ${id} does not exist`],
                    timestamp: new Date().toISOString(),
                };
            }

            const oldLead = { ...leads[index] };
            leads[index] = {
                ...leads[index],
                ...leadData,
                updatedAt: new Date().toISOString(),
            };

            // Add timeline entry for significant changes
            if (leadData.stage && leadData.stage !== oldLead.stage) {
                leadTimeline.push({
                    id: `timeline_${Date.now()}`,
                    leadId: id,
                    action: 'stage_changed',
                    description: `Stage changed from ${oldLead.stage} to ${leadData.stage}`,
                    performedBy: leadData.assignedTo || oldLead.assignedTo || 'system',
                    performedByName: 'User',
                    timestamp: new Date().toISOString(),
                });
            }

            if (leadData.assignedTo && leadData.assignedTo !== oldLead.assignedTo) {
                leadTimeline.push({
                    id: `timeline_${Date.now() + 1}`,
                    leadId: id,
                    action: 'assigned',
                    description: `Lead assigned to ${leadData.assignedTo}`,
                    performedBy: 'admin',
                    performedByName: 'Admin',
                    timestamp: new Date().toISOString(),
                });
            }

            return {
                success: true,
                data: leads[index],
                message: 'Lead updated successfully',
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            return {
                success: false,
                data: null as any,
                message: 'Lead update failed',
                errors: [error instanceof Error ? error.message : 'Unknown error'],
                timestamp: new Date().toISOString(),
            };
        }
    },

    /**
     * Delete lead
     * DELETE /api/leads/{id}
     */
    delete: async (id: string): Promise<ApiResponse<null>> => {
        await delay(API_DELAY);

        try {
            const index = leads.findIndex(l => l.id === id);

            if (index === -1) {
                return {
                    success: false,
                    data: null,
                    message: 'Lead not found',
                    errors: [`Lead with ID ${id} does not exist`],
                    timestamp: new Date().toISOString(),
                };
            }

            leads.splice(index, 1);

            // Remove related timeline entries
            leadTimeline = leadTimeline.filter(t => t.leadId !== id);

            // Remove related reminders
            reminders = reminders.filter(r => r.leadId !== id);

            return {
                success: true,
                data: null,
                message: 'Lead deleted successfully',
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            return {
                success: false,
                data: null,
                message: 'Lead deletion failed',
                errors: [error instanceof Error ? error.message : 'Unknown error'],
                timestamp: new Date().toISOString(),
            };
        }
    },

    /**
     * Update lead status/stage
     * PATCH /api/leads/{id}/status
     */
    updateStatus: async (
        id: string,
        stage: 'new' | 'contacted' | 'in_discussion' | 'site_visit_scheduled' | 'negotiation' | 'closed_won' | 'closed_lost',
        remarks?: string
    ): Promise<ApiResponse<Lead>> => {
        await delay(API_DELAY);

        try {
            const index = leads.findIndex(l => l.id === id);

            if (index === -1) {
                return {
                    success: false,
                    data: null as any,
                    message: 'Lead not found',
                    errors: [`Lead with ID ${id} does not exist`],
                    timestamp: new Date().toISOString(),
                };
            }

            const oldStage = leads[index].stage;
            leads[index].stage = stage;
            leads[index].updatedAt = new Date().toISOString();

            // Update status based on stage
            if (stage === 'closed_won' || stage === 'closed_lost') {
                leads[index].status = 'closed';
            } else {
                leads[index].status = 'active';
            }

            // Add timeline entry
            leadTimeline.push({
                id: `timeline_${Date.now()}`,
                leadId: id,
                action: 'status_updated',
                description: `Status changed from ${oldStage} to ${stage}${remarks ? `: ${remarks}` : ''}`,
                performedBy: leads[index].assignedTo || 'system',
                performedByName: 'User',
                timestamp: new Date().toISOString(),
                metadata: { remarks },
            });

            return {
                success: true,
                data: leads[index],
                message: 'Lead status updated successfully',
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
     * Assign lead to sales executive
     * PATCH /api/leads/{id}/assign
     */
    assignLead: async (id: string, assignedTo: string): Promise<ApiResponse<Lead>> => {
        await delay(API_DELAY);

        try {
            const index = leads.findIndex(l => l.id === id);

            if (index === -1) {
                return {
                    success: false,
                    data: null as any,
                    message: 'Lead not found',
                    errors: [`Lead with ID ${id} does not exist`],
                    timestamp: new Date().toISOString(),
                };
            }

            const oldAssignee = leads[index].assignedTo;
            leads[index].assignedTo = assignedTo;
            leads[index].updatedAt = new Date().toISOString();

            // Add timeline entry
            leadTimeline.push({
                id: `timeline_${Date.now()}`,
                leadId: id,
                action: 'reassigned',
                description: `Lead reassigned from ${oldAssignee || 'unassigned'} to ${assignedTo}`,
                performedBy: 'admin',
                performedByName: 'Admin',
                timestamp: new Date().toISOString(),
            });

            return {
                success: true,
                data: leads[index],
                message: 'Lead assigned successfully',
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            return {
                success: false,
                data: null as any,
                message: 'Lead assignment failed',
                errors: [error instanceof Error ? error.message : 'Unknown error'],
                timestamp: new Date().toISOString(),
            };
        }
    },

    /**
     * Get lead timeline
     * GET /api/leads/{id}/timeline
     */
    getTimeline: async (id: string): Promise<ApiResponse<LeadTimelineEntry[]>> => {
        await delay(API_DELAY);

        try {
            const timeline = leadTimeline.filter(t => t.leadId === id).sort((a, b) =>
                new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
            );

            return {
                success: true,
                data: timeline,
                message: 'Timeline retrieved successfully',
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            return {
                success: false,
                data: [],
                message: 'Failed to retrieve timeline',
                errors: [error instanceof Error ? error.message : 'Unknown error'],
                timestamp: new Date().toISOString(),
            };
        }
    },

    /**
     * Add remark to lead
     * POST /api/leads/{id}/remarks
     */
    addRemark: async (id: string, remark: string, performedBy: string): Promise<ApiResponse<null>> => {
        await delay(API_DELAY);

        try {
            const lead = leads.find(l => l.id === id);

            if (!lead) {
                return {
                    success: false,
                    data: null,
                    message: 'Lead not found',
                    errors: [`Lead with ID ${id} does not exist`],
                    timestamp: new Date().toISOString(),
                };
            }

            // Add timeline entry
            leadTimeline.push({
                id: `timeline_${Date.now()}`,
                leadId: id,
                action: 'remark_added',
                description: remark,
                performedBy,
                performedByName: 'User',
                timestamp: new Date().toISOString(),
            });

            return {
                success: true,
                data: null,
                message: 'Remark added successfully',
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            return {
                success: false,
                data: null,
                message: 'Failed to add remark',
                errors: [error instanceof Error ? error.message : 'Unknown error'],
                timestamp: new Date().toISOString(),
            };
        }
    },

    /**
     * Create follow-up reminder
     * POST /api/leads/{id}/reminders
     */
    createReminder: async (request: CreateReminderRequest): Promise<ApiResponse<FollowUpReminder>> => {
        await delay(API_DELAY);

        try {
            const lead = leads.find(l => l.id === request.leadId);

            if (!lead) {
                return {
                    success: false,
                    data: null as any,
                    message: 'Lead not found',
                    errors: [`Lead with ID ${request.leadId} does not exist`],
                    timestamp: new Date().toISOString(),
                };
            }

            const reminder: FollowUpReminder = {
                id: `reminder_${Date.now()}`,
                leadId: request.leadId,
                leadName: lead.name,
                assignedTo: request.assignedTo,
                assignedToName: 'User',
                reminderDate: request.reminderDate,
                notes: request.notes,
                status: 'pending',
                createdAt: new Date().toISOString(),
            };

            reminders.push(reminder);

            // Add timeline entry
            leadTimeline.push({
                id: `timeline_${Date.now()}`,
                leadId: request.leadId,
                action: 'reminder_created',
                description: `Follow-up reminder set for ${request.reminderDate}`,
                performedBy: request.assignedTo,
                performedByName: 'User',
                timestamp: new Date().toISOString(),
            });

            return {
                success: true,
                data: reminder,
                message: 'Reminder created successfully',
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            return {
                success: false,
                data: null as any,
                message: 'Reminder creation failed',
                errors: [error instanceof Error ? error.message : 'Unknown error'],
                timestamp: new Date().toISOString(),
            };
        }
    },

    /**
     * Get reminders for a user
     * GET /api/leads/reminders/{userId}
     */
    getReminders: async (userId: string): Promise<ApiResponse<FollowUpReminder[]>> => {
        await delay(API_DELAY);

        try {
            const userReminders = reminders.filter(r =>
                r.assignedTo === userId && r.status === 'pending'
            ).sort((a, b) =>
                new Date(a.reminderDate).getTime() - new Date(b.reminderDate).getTime()
            );

            return {
                success: true,
                data: userReminders,
                message: 'Reminders retrieved successfully',
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            return {
                success: false,
                data: [],
                message: 'Failed to retrieve reminders',
                errors: [error instanceof Error ? error.message : 'Unknown error'],
                timestamp: new Date().toISOString(),
            };
        }
    },
};

export default dummyLeadApi;
