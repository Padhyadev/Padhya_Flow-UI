import { User, UserRole, Property, Lead, Area, DashboardStats, Notification } from '../types';

// Mock Users Data
export const mockUsers: User[] = [
    {
        id: '1',
        name: 'Admin User',
        email: 'admin@resido.com',
        role: 'admin',
        status: 'active',
        createdAt: '2024-01-01T00:00:00Z',
    },
    {
        id: '2',
        name: 'Rajesh Kumar',
        email: 'rajesh@resido.com',
        role: 'sales_executive',
        status: 'active',
        createdAt: '2024-01-15T00:00:00Z',
    },
    {
        id: '3',
        name: 'Priya Sharma',
        email: 'priya@resido.com',
        role: 'data_entry',
        status: 'active',
        createdAt: '2024-02-01T00:00:00Z',
    },
    {
        id: '4',
        name: 'Viewer User',
        email: 'viewer@resido.com',
        role: 'viewer',
        status: 'active',
        createdAt: '2024-02-15T00:00:00Z',
    },
];

// Mock Areas Data
export const mockAreas: Area[] = [
    { id: '1', name: 'Bandra West', city: 'Mumbai', status: 'active', propertyCount: 45, createdAt: '2024-01-01T00:00:00Z' },
    { id: '2', name: 'Andheri East', city: 'Mumbai', status: 'active', propertyCount: 67, createdAt: '2024-01-01T00:00:00Z' },
    { id: '3', name: 'Powai', city: 'Mumbai', status: 'active', propertyCount: 34, createdAt: '2024-01-01T00:00:00Z' },
    { id: '4', name: 'Koramangala', city: 'Bangalore', status: 'active', propertyCount: 52, createdAt: '2024-01-01T00:00:00Z' },
    { id: '5', name: 'Whitefield', city: 'Bangalore', status: 'active', propertyCount: 41, createdAt: '2024-01-01T00:00:00Z' },
];

// Mock Properties Data
export const mockProperties: Property[] = [];

// Mock Leads Data
export const mockLeads: Lead[] = [
    {
        id: '1',
        name: 'Amit Verma',
        mobile: '9876543210',
        email: 'amit@example.com',
        requirement: 'Looking for 2-3 BHK apartment',
        budget: { min: 8000000, max: 12000000 },
        preferredAreas: ['1', '3'],
        propertyCategory: ['residential'],
        source: 'Website',
        notes: 'Interested in properties near metro station',
        stage: 'new',
        status: 'active',
        createdAt: '2024-03-15T00:00:00Z',
        updatedAt: '2024-03-15T00:00:00Z',
        remarks: [],
        timeline: [
            {
                id: 't1',
                leadId: '1',
                event: 'Lead Created',
                description: 'New lead submitted from website',
                createdBy: 'system',
                createdByName: 'System',
                createdAt: '2024-03-15T00:00:00Z',
            },
        ],
    },
    {
        id: '2',
        name: 'Sneha Reddy',
        mobile: '9876543211',
        email: 'sneha@example.com',
        requirement: 'Office space for startup',
        budget: { min: 100000, max: 200000 },
        preferredAreas: ['2', '4'],
        propertyCategory: ['office'],
        source: 'Referral',
        stage: 'contacted',
        status: 'active',
        assignedTo: '2',
        assignedToName: 'Rajesh Kumar',
        createdAt: '2024-03-10T00:00:00Z',
        updatedAt: '2024-03-12T00:00:00Z',
        followUpDate: '2024-03-20T00:00:00Z',
        remarks: [
            {
                id: 'r1',
                leadId: '2',
                text: 'Called and discussed requirements. Will send property options.',
                createdBy: '2',
                createdByName: 'Rajesh Kumar',
                createdAt: '2024-03-12T10:30:00Z',
            },
        ],
        timeline: [
            {
                id: 't2',
                leadId: '2',
                event: 'Lead Created',
                description: 'Lead received from referral',
                createdBy: 'system',
                createdByName: 'System',
                createdAt: '2024-03-10T00:00:00Z',
            },
            {
                id: 't3',
                leadId: '2',
                event: 'Assigned',
                description: 'Lead assigned to Rajesh Kumar',
                createdBy: '1',
                createdByName: 'Admin User',
                createdAt: '2024-03-11T00:00:00Z',
            },
            {
                id: 't4',
                leadId: '2',
                event: 'Stage Changed',
                description: 'Stage changed from New to Contacted',
                createdBy: '2',
                createdByName: 'Rajesh Kumar',
                createdAt: '2024-03-12T00:00:00Z',
            },
        ],
    },
];

// Mock Dashboard Stats
export const mockDashboardStats: DashboardStats = {
    totalProperties: 245,
    activeProperties: 189,
    inactiveProperties: 23,
    soldProperties: 21,
    rentedProperties: 12,
    totalLeads: 156,
    newLeads: 34,
    inProgressLeads: 67,
    closedWonLeads: 42,
    closedLostLeads: 13,
    totalAreas: 25,
    totalUsers: 12,
    activeUsers: 10,
    inactiveUsers: 2,
};

// Mock Notifications
export const mockNotifications: Notification[] = [
    {
        id: '1',
        userId: '1',
        type: 'lead',
        title: 'New Lead',
        message: 'New lead from Amit Verma for 2-3 BHK apartment',
        read: false,
        createdAt: '2024-03-15T10:30:00Z',
        link: '/admin/leads/1',
    },
    {
        id: '2',
        userId: '2',
        type: 'reminder',
        title: 'Follow-up Reminder',
        message: 'Follow-up with Sneha Reddy scheduled for today',
        read: false,
        createdAt: '2024-03-15T09:00:00Z',
        link: '/admin/leads/2',
    },
    {
        id: '3',
        userId: '1',
        type: 'property',
        title: 'Property Status Changed',
        message: 'Residential Plot in Powai marked as Sold',
        read: true,
        createdAt: '2024-03-14T15:20:00Z',
        link: '/admin/properties/3',
    },
];

// Helper function to get user by email (for login)
export const getUserByEmail = (email: string): User | undefined => {
    return mockUsers.find(user => user.email === email);
};

// Helper function to get area name by ID
export const getAreaName = (areaId: string): string => {
    const area = mockAreas.find(a => a.id === areaId);
    return area ? area.name : 'Unknown Area';
};

// Helper function to get user name by ID
export const getUserName = (userId: string): string => {
    const user = mockUsers.find(u => u.id === userId);
    return user ? user.name : 'Unknown User';
};
