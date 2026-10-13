import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ClientFollowup, clientFollowupApi } from '../../services/api/clientFollowupApi';
import { dropdownApi, DropdownItem } from '../../services/api/dropdownApi';
import { projectApi, Project } from '../../services/api/projectApi';
import FormField from '../../components/FormField';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { logError } from '../../utils/logError';
import '../../styles/admin.css';
import '../../styles/admin-components.css';

export default function ClientFollowupForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { user: currentUser } = useAuth();
    const { showSuccess, showError } = useToast();
    const isEditMode = Boolean(id);

    const passedFollowupData = location.state?.followupData as ClientFollowup | undefined;

    const [formData, setFormData] = useState<{
        projectId: number;
        nextFollowupDate: string;
        clientFollowupStatus: string;
        remarks: string;
    }>({
        projectId: 0,
        nextFollowupDate: '',
        clientFollowupStatus: '',
        remarks: ''
    });

    const [projects, setProjects] = useState<Project[]>([]);
    const [statuses, setStatuses] = useState<any[]>([]);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        loadProjects();
        loadStatuses();

        if (isEditMode && id) {
            if (passedFollowupData) {
                console.log('✅ ClientFollowupForm: Using passed followup data:', passedFollowupData);
                setFormData({
                    projectId: passedFollowupData.projectId || 0,
                    nextFollowupDate: passedFollowupData.nextFollowupDate ? passedFollowupData.nextFollowupDate.split('T')[0] : '',
                    clientFollowupStatus: passedFollowupData.clientFollowupStatus || '',
                    remarks: passedFollowupData.remarks || ''
                });
            } else {
                loadFollowupData(parseInt(id));
            }
        }
    }, [isEditMode, id, passedFollowupData]);

    // Effect to map status text to ID once statuses are loaded
    useEffect(() => {
        if (statuses.length > 0 && formData.clientFollowupStatus && isEditMode) {
            const currentValue = String(formData.clientFollowupStatus);
            // If the value doesn't look like a numeric ID, try to find the matching status
            if (isNaN(Number(currentValue))) {
                const match = statuses.find(s =>
                    String(s.name || s.text || '').toLowerCase().trim() === currentValue.toLowerCase().trim()
                );
                if (match) {
                    const matchedId = String(match.code || match.id || match.value);
                    console.log('🔄 ClientFollowupForm: Mapping status text to ID:', currentValue, '->', matchedId);
                    setFormData(prev => ({
                        ...prev,
                        clientFollowupStatus: matchedId
                    }));
                }
            }
        }
    }, [statuses, isEditMode, formData.clientFollowupStatus]);

    const loadProjects = async () => {
        try {
            const response = await projectApi.getAllProjectsPage(0, 1000);
            if (response.success && response.data) {
                // Normalize project data to handle both camelCase and PascalCase from API
                const normalizedProjects = (response.data || []).map((p: any) => ({
                    projectId: p.projectId || p.ProjectId || 0,
                    clientId: p.clientId || p.ClientId || 0,
                    projectName: p.projectName || p.ProjectName || 'Unknown Project'
                } as Project));

                console.log('✅ ClientFollowupForm: Projects loaded and normalized:', normalizedProjects);
                setProjects(normalizedProjects);
            } else {
                setErrors({ general: 'Failed to load projects. Please refresh the page.' });
            }
        } catch (error) {
            console.error('Error loading projects:', error);
            setErrors({ general: 'Failed to load projects. Please refresh the page.' });
        }
    };

    const loadStatuses = async () => {
        try {
            const response = await dropdownApi.getLovMaster('ClientFollowupStatus');
            if (response.success) {
                setStatuses(response.data || []);
            } else {
                setErrors({ general: 'Failed to load statuses. Please refresh the page.' });
            }
        } catch (error) {
            console.error('Error loading statuses:', error);
            await logError({
                controllerName: 'ClientFollowupForm',
                methodName: 'LoadStatuses',
                requestUrl: 'dropdownApi.getLovMaster',
                requestPayload: { Lov_column: 'ClientFollowupStatus' },
                error
            });
            setErrors({ general: 'Failed to load statuses. Please refresh the page.' });
        }
    };

    const loadFollowupData = async (followupId: number) => {
        try {
            setLoading(true);
            setErrors({});

            const response = await clientFollowupApi.getClientFollowupById(followupId);

            if (response.success && response.data) {
                setFormData({
                    projectId: response.data.projectId || 0,
                    nextFollowupDate: response.data.nextFollowupDate ? response.data.nextFollowupDate.split('T')[0] : '',
                    clientFollowupStatus: response.data.clientFollowupStatus || '',
                    remarks: response.data.remarks || ''
                });
            } else {
                setErrors({ general: response.message || 'Failed to load followup data' });
            }
        } catch (error) {
            console.error('Error loading followup:', error);
            await logError({
                controllerName: 'ClientFollowupForm',
                methodName: 'LoadFollowupData',
                requestUrl: `clientFollowupApi.getClientFollowupById/${followupId}`,
                requestPayload: { followupId },
                error
            });
            setErrors({ general: 'Network error occurred while loading followup data' });
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;

        setFormData(prev => ({
            ...prev,
            [name]: name === 'projectId' ? parseInt(value) : value
        }));

        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};

        // Project is required only in Add mode
        if (!isEditMode && (!formData.projectId || formData.projectId === 0)) {
            newErrors.projectId = 'Project is required';
        }

        if (!formData.nextFollowupDate?.trim()) {
            newErrors.nextFollowupDate = 'Next followup date is required';
        }

        if (!formData.clientFollowupStatus?.trim()) {
            newErrors.clientFollowupStatus = 'Status is required';
        }

        if (!formData.remarks?.trim()) {
            newErrors.remarks = 'Remarks are required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validate()) {
            return;
        }

        try {
            setSubmitting(true);
            setErrors({});

            let response;
            if (isEditMode && id) {
                // Find selected status to get its name and code (ID)
                const selectedStatus = statuses.find(s => String(s.code || s.id || s.value) === String(formData.clientFollowupStatus));
                const statusText = selectedStatus?.name || selectedStatus?.text || '';
                const statusId = parseInt(String(selectedStatus?.code || selectedStatus?.id || selectedStatus?.value || '0'));

                // Edit mode - send all required fields for the Add API
                response = await clientFollowupApi.updateClientFollowup({
                    followupId: parseInt(id),
                    projectId: passedFollowupData?.projectId || 0,
                    projectName: passedFollowupData?.projectName || '',
                    clientId: passedFollowupData?.clientId || 0,
                    statusId: statusId,
                    nextFollowupDate: formData.nextFollowupDate,
                    clientFollowupStatus: statusText,
                    remarks: formData.remarks,
                    followupByName: currentUser?.name || ''
                });
            } else {
                // Add mode - send all fields
                const userId = currentUser?.id ? parseInt(currentUser.id) : 0;

                // Find selected project to get its name and clientId
                const selectedProject = projects.find(p => p.projectId === formData.projectId);
                const projectName = selectedProject?.projectName || '';
                const clientId = selectedProject?.clientId || 0;

                // Find selected status to get its name and code (ID)
                const selectedStatus = statuses.find(s => String(s.code || s.id || s.value) === String(formData.clientFollowupStatus));
                const statusText = selectedStatus?.name || selectedStatus?.text || '';
                const statusId = parseInt(String(selectedStatus?.code || selectedStatus?.id || selectedStatus?.value || '0'));

                response = await clientFollowupApi.addClientFollowup({
                    projectId: formData.projectId,
                    projectName: projectName,
                    clientId: clientId,
                    statusId: statusId,
                    nextFollowupDate: formData.nextFollowupDate,
                    clientFollowupStatus: statusText,
                    remarks: formData.remarks,
                    followupBy: userId,
                    followupByName: currentUser?.name || '',
                    createdBy: userId
                });
            }

            if (response.success) {
                showSuccess(`Client followup ${isEditMode ? 'updated' : 'created'} successfully`);
                navigate('/admin/client-followups');
            } else {
                setErrors({ general: response.message || `Failed to ${isEditMode ? 'update' : 'create'} followup` });
            }
        } catch (error) {
            console.error('Submit error:', error);
            await logError({
                controllerName: 'ClientFollowupForm',
                methodName: isEditMode ? 'UpdateFollowup' : 'CreateFollowup',
                requestUrl: isEditMode ? `clientFollowupApi.updateClientFollowup/${id}` : 'clientFollowupApi.addClientFollowup',
                requestPayload: formData,
                error
            });
            setErrors({ general: 'Network error occurred. Please try again.' });
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="admin-page">
                <div style={{ padding: '40px', textAlign: 'center' }}>
                    <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '24px', color: 'var(--admin-primary)' }}></i>
                    <p style={{ marginTop: '16px', color: 'var(--admin-gray-600)' }}>Loading followup data...</p>
                </div>
            </div>
        );
    }

    // Convert dropdowns to options format
    const projectOptions = projects.map(project => ({
        value: project.projectId,
        label: project.projectName
    }));

    const statusOptions = statuses.map(status => ({
        value: (status.code || status.id || status.value || '') as string | number,
        label: (status.name || status.text || '') as string
    }));

    return (
        <div className="admin-page">
            <div className="admin-page-header">
                <div>
                    <h1 className="admin-page-title">
                        {isEditMode ? 'Edit Client Followup' : 'Add New Client Followup'}
                    </h1>
                    <p className="admin-page-subtitle">
                        {isEditMode ? 'Update Followup Information' : 'Create a New Client Followup Record'}
                    </p>
                </div>
                <div className="admin-page-actions">
                    <button
                        type="button"
                        onClick={() => navigate('/admin/client-followups')}
                        className="admin-btn admin-btn-secondary"
                    >
                        <i className="fa-solid fa-arrow-left"></i>
                        Back to List
                    </button>
                </div>
            </div>

            {errors.general && (
                <div className="admin-alert admin-alert-error">
                    <i className="fa-solid fa-circle-exclamation"></i>
                    {errors.general}
                </div>
            )}

            <div className="admin-card">
                <div className="admin-card-header">
                    <h2>Followup Information</h2>
                </div>
                <div className="admin-card-body">
                    <form onSubmit={handleSubmit} className="admin-form" noValidate>
                        {/* Show Project Name as read-only in Edit Mode */}
                        {isEditMode && passedFollowupData && (
                            <div style={{ marginBottom: '25px', padding: '15px', background: 'var(--admin-gray-50)', borderRadius: '8px', borderLeft: '4px solid var(--admin-primary)' }}>
                                <label style={{ display: 'block', fontSize: '12px', color: 'var(--admin-gray-500)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Updating Followup For</label>
                                <span style={{ fontSize: '18px', fontWeight: '700', color: 'var(--admin-gray-800)' }}>{passedFollowupData.projectName || 'Project'}</span>
                            </div>
                        )}

                        {/* Row 1: Next Followup Date and Status */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                            {!isEditMode && (
                                <FormField
                                    label="Project"
                                    name="projectId"
                                    type="select"
                                    value={formData.projectId}
                                    onChange={handleInputChange}
                                    error={errors.projectId}
                                    options={projectOptions}
                                    required={true}
                                />
                            )}

                            <FormField
                                label="Status"
                                name="clientFollowupStatus"
                                type="select"
                                value={formData.clientFollowupStatus}
                                onChange={handleInputChange}
                                error={errors.clientFollowupStatus}
                                options={statusOptions}
                                required={true}
                            />

                            <FormField
                                label="Next Followup Date"
                                name="nextFollowupDate"
                                type="date"
                                value={formData.nextFollowupDate}
                                onChange={handleInputChange}
                                error={errors.nextFollowupDate}
                                required={true}
                                min={new Date().toISOString().split('T')[0]}
                            />
                        </div>

                        {/* Row 3: Remarks (Full Width) */}
                        <div style={{ marginBottom: '30px' }}>
                            <FormField
                                label="Remarks"
                                name="remarks"
                                type="textarea"
                                value={formData.remarks}
                                onChange={handleInputChange}
                                error={errors.remarks}
                                placeholder="Enter Remarks"
                                required={true}
                                rows={4}
                            />
                        </div>

                        <div className="admin-form-actions">
                            <button
                                type="submit"
                                className="admin-btn admin-btn-primary"
                                disabled={submitting}
                            >
                                {submitting ? 'Saving...' : 'Save'}
                            </button>
                            <button
                                type="button"
                                onClick={() => navigate('/admin/client-followups')}
                                className="admin-btn admin-btn-secondary"
                                disabled={submitting}
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
