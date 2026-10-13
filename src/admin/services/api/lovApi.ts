import { ApiResponse } from '../types/apiTypes';
import { logError } from '../../utils/logError';

const API_BASE_URL = 'https://aj.padhyasoft.com/api';
// const API_BASE_URL = 'https://localhost:7087/api';

export interface LovMasterItem {
    lov_Column: string;
    display_Text?: string;
    description?: string;
}

export interface LovDetailItem {
    id?: number; // Assuming ID exists for deletion
    lov_Column: string;
    lov_Code: string;
    lov_Desc: string;
    display_Text: string;
    displayOrder: number;
    isActive: boolean;
    isDeleted: boolean;
    createdBy?: number;
    lastModifiedBy?: number;
}

export const lovApi = {
    /**
     * Get Main LOV List (flag=li)
     */
    getLovMasterList: async (): Promise<ApiResponse<LovMasterItem[]>> => {
        try {
            const token = localStorage.getItem('admin_token');
            const response = await fetch(`${API_BASE_URL}/Lov/Get?flag=li`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Failed to fetch LOV master list');

            let items: LovMasterItem[] = [];
            if (Array.isArray(data)) items = data;
            else if (data && Array.isArray(data.data)) items = data.data;

            return { success: true, data: items, message: 'Retrieved successfully', timestamp: new Date().toISOString() };
        } catch (error) {
            console.error('getLovMasterList Error:', error);
            return { success: false, data: [], message: 'Failed to fetch LOV list', timestamp: new Date().toISOString() };
        }
    },

    /**
     * Get LOV Details (flag=ldi)
     */
    getLovDetailList: async (lovColumn: string): Promise<ApiResponse<LovDetailItem[]>> => {
        try {
            const token = localStorage.getItem('admin_token');
            const encodedColumn = encodeURIComponent(lovColumn);
            const response = await fetch(`${API_BASE_URL}/Lov/Get?flag=ldi&lovColumn=${encodedColumn}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Failed to fetch LOV details');

            let items: LovDetailItem[] = [];
            if (Array.isArray(data)) items = data;
            else if (data && Array.isArray(data.data)) items = data.data;

            return { success: true, data: items, message: 'Retrieved successfully', timestamp: new Date().toISOString() };
        } catch (error) {
            console.error('getLovDetailList Error:', error);
            return { success: false, data: [], message: 'Failed to fetch LOV details', timestamp: new Date().toISOString() };
        }
    },

    /**
     * Save LOV Detail (Add/Update)
     */
    saveLovDetail: async (payload: any): Promise<ApiResponse<any>> => {
        try {
            const token = localStorage.getItem('admin_token');
            const response = await fetch(`${API_BASE_URL}/Lov/SaveDetail`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Failed to save LOV detail');

            return { success: true, data: data.data || data, message: 'Saved successfully', timestamp: new Date().toISOString() };
        } catch (error) {
            console.error('saveLovDetail Error:', error);
            return { success: false, data: null, message: error instanceof Error ? error.message : 'Failed to save', timestamp: new Date().toISOString() };
        }
    },

    /**
     * Delete LOV Detail
     * Assuming standard Delete endpoint or Soft Delete via Save
     */
    /**
     * Delete LOV Detail
     * Endpoint: /Lov/DeleteDetail?lovColumn={lovColumn}&lovCode={lovCode}&operatedBy={userId}
     */
    deleteLovDetail: async (lovColumn: string, lovCode: string): Promise<ApiResponse<null>> => {
        try {
            const token = localStorage.getItem('admin_token');
            const userId = localStorage.getItem('admin_user') ? JSON.parse(localStorage.getItem('admin_user')!).id : 0;

            const response = await fetch(`${API_BASE_URL}/Lov/DeleteDetail?lovColumn=${encodeURIComponent(lovColumn)}&lovCode=${encodeURIComponent(lovCode)}&operatedBy=${userId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                throw new Error(data.message || 'Failed to delete');
            }

            return { success: true, data: null, message: 'Deleted successfully', timestamp: new Date().toISOString() };
        } catch (error) {
            console.error('deleteLovDetail Error:', error);
            return { success: false, data: null, message: 'Failed to delete', timestamp: new Date().toISOString() };
        }
    },

    /**
     * Save LOV Master (Add)
     * Endpoint: /Lov/SaveMaster
     */
    saveLovMaster: async (payload: any): Promise<ApiResponse<any>> => {
        try {
            const token = localStorage.getItem('admin_token');
            const response = await fetch(`${API_BASE_URL}/Lov/SaveMaster`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Failed to save LOV master');

            return { success: true, data: data.data || data, message: 'Saved successfully', timestamp: new Date().toISOString() };
        } catch (error) {
            console.error('saveLovMaster Error:', error);
            return { success: false, data: null, message: error instanceof Error ? error.message : 'Failed to save', timestamp: new Date().toISOString() };
        }
    },

    /**
     * Get LOV Master for Edit (flag=le)
     */
    getLovMasterEdit: async (lovColumn: string): Promise<ApiResponse<any>> => {
        try {
            const token = localStorage.getItem('admin_token');
            const encodedColumn = encodeURIComponent(lovColumn);
            const response = await fetch(`${API_BASE_URL}/Lov/Get?flag=le&lovColumn=${encodedColumn}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Failed to fetch LOV master details');

            // Data might be an array or object depending on API. Returning as is or normalizing.
            return { success: true, data: data.data || data, message: 'Retrieved successfully', timestamp: new Date().toISOString() };
        } catch (error) {
            console.error('getLovMasterEdit Error:', error);
            return { success: false, data: null, message: 'Failed to fetch LOV master details', timestamp: new Date().toISOString() };
        }
    },
    /**
     * Delete LOV Master
     * Endpoint: /Lov/DeleteDetail?lovColumn={lovColumn}
     * Note: Reuses DeleteDetail endpoint but without lovCode to delete the Master
     */
    deleteLovMaster: async (lovColumn: string): Promise<ApiResponse<null>> => {
        try {
            const token = localStorage.getItem('admin_token');
            const userId = localStorage.getItem('admin_user') ? JSON.parse(localStorage.getItem('admin_user')!).id : 0;

            const response = await fetch(`${API_BASE_URL}/Lov/DeleteDetail?lovColumn=${encodeURIComponent(lovColumn)}&operatedBy=${userId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                throw new Error(data.message || 'Failed to delete LOV master');
            }

            return { success: true, data: null, message: 'Deleted successfully', timestamp: new Date().toISOString() };
        } catch (error) {
            console.error('deleteLovMaster Error:', error);
            return { success: false, data: null, message: 'Failed to delete', timestamp: new Date().toISOString() };
        }
    }
};
