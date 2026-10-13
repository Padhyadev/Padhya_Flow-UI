/**
 * Dummy API Services Index
 * Central export point for all dummy API services
 * These services mimic .NET Web API structure and can be easily replaced with real API calls
 */

export { default as dummyAuthApi } from './dummyAuthApi';
export { default as dummyUserApi } from './dummyUserApi';
export { default as dummyPropertyApi } from './dummyPropertyApi';
export { default as dummyAreaApi } from './dummyAreaApi';
export { default as dummyLeadApi } from './dummyLeadApi';
export { default as dummyDashboardApi } from './dummyDashboardApi';
export { default as dummyNotificationApi } from './dummyNotificationApi';
export { default as dummyAuditApi } from './dummyAuditApi';
export { default as dummySettingsApi } from './dummySettingsApi';

// Re-export types for convenience
export type * from '../types/apiTypes';
