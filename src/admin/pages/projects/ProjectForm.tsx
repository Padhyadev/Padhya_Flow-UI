import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { projectApi, Project } from '../../services/api/projectApi';
import { dropdownApi, DropdownItem } from '../../services/api/dropdownApi';
import FormField from '../../components/FormField';
import { useToast } from '../../context/ToastContext';
import { logError } from '../../utils/logError';
import '../../styles/admin.css';
import '../../styles/admin-components.css';

export default function ProjectForm() {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const { showSuccess, showError } = useToast();
    const isEditMode = !!id && id !== 'new';

    const [formData, setFormData] = useState<Partial<Project>>({
        projectId: 0,
        clientId: 0,
        projectName: '',
        projectType: '',
        startDate: '',
        expectedEndDate: '',
        projectStatus: 'Draft'
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [submitting, setSubmitting] = useState(false);
    const [loading, setLoading] = useState(false);

    // Dropdown states
    const [clients, setClients] = useState<DropdownItem[]>([]);
    const [projectTypes, setProjectTypes] = useState<DropdownItem[]>([]);
    const [projectStatuses, setProjectStatuses] = useState<DropdownItem[]>([]);
    const [existingProjects, setExistingProjects] = useState<DropdownItem[]>([]);

    useEffect(() => {
        loadDropdowns();
        if (isEditMode) {
            loadProjectData();
        }
    }, [id]);

    const loadDropdowns = async () => {
        try {
            // Load Clients
            const clientsResponse = await dropdownApi.getClientMaster();
            if (clientsResponse.success) {
                setClients(clientsResponse.data);
            }

            // Load Project Types
            const typesResponse = await dropdownApi.getLovMaster('ProjectType');
            if (typesResponse.success) {
                setProjectTypes(typesResponse.data);
            }

            // Load Project Statuses
            const statusesResponse = await dropdownApi.getLovMaster('ProjectStatus');
            if (statusesResponse.success) {
                setProjectStatuses(statusesResponse.data);
            }

            // Load Existing Projects for validation
            const projectsResponse = await dropdownApi.getProjectName();
            if (projectsResponse.success) {
                setExistingProjects(projectsResponse.data);
            }
        } catch (error) {
            console.error('Error loading dropdowns:', error);
            showError('Failed to load dropdown data');
        }
    };

    const loadProjectData = async () => {
        setLoading(true);
        try {
            const response = await projectApi.getProjectById(parseInt(id!));
            if (response.success && response.data) {
                // Format dates for input fields
                const project = response.data;
                setFormData({
                    ...project,
                    startDate: project.startDate ? project.startDate.split('T')[0] : '',
                    expectedEndDate: project.expectedEndDate ? project.expectedEndDate.split('T')[0] : ''
                });
            } else {
                showError(response.message || 'Failed to load project');
                navigate('/admin/projects');
            }
        } catch (error) {
            console.error('Error loading project:', error);
            showError('Failed to load project data');
            navigate('/admin/projects');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;

        setFormData(prev => ({
            ...prev,
            [name]: name === 'clientId' ? parseInt(value) || 0 : value
        }));

        if (name === 'projectName') {
            const normalizedName = value.trim().toLowerCase();
            const isDuplicate = existingProjects.some(p =>
                p.name.trim().toLowerCase() === normalizedName &&
                (!isEditMode || String(p.id) !== String(id))
            );

            if (isDuplicate) {
                setErrors(prev => ({ ...prev, projectName: 'Project Name already exists!' }));
            } else if (errors.projectName) {
                setErrors(prev => ({ ...prev, projectName: '' }));
            }
        } else if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.clientId || formData.clientId === 0) {
            newErrors.clientId = 'Client is required';
        }

        if (!formData.projectName?.trim()) {
            newErrors.projectName = 'Project name is required';
        } else {
            // Check for duplicate project name
            // Perform final validation check (reusing the logic is safer)
            const normalizedName = formData.projectName.trim().toLowerCase();
            const isDuplicate = existingProjects.some(p =>
                p.name.trim().toLowerCase() === normalizedName &&
                (!isEditMode || String(p.id) !== String(id))
            );

            if (isDuplicate) {
                newErrors.projectName = 'Project Name already exists!';
            }
        }

        if (!formData.projectType?.trim()) {
            newErrors.projectType = 'Project type is required';
        }

        if (!formData.startDate) {
            newErrors.startDate = 'Start date is required';
        }

        if (!formData.expectedEndDate) {
            newErrors.expectedEndDate = 'Expected end date is required';
        }

        if (formData.startDate && formData.expectedEndDate) {
            const start = new Date(formData.startDate);
            const end = new Date(formData.expectedEndDate);
            if (end < start) {
                newErrors.expectedEndDate = 'Expected end date must be after start date';
            }
        }

        // if (!formData.projectStatus?.trim()) {
        //     newErrors.projectStatus = 'Project status is required';
        // }

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

            const response = await projectApi.saveProject(formData);

            if (response.success) {
                showSuccess(isEditMode ? 'Project updated successfully' : 'Project created successfully');
                navigate('/admin/projects');
            } else {
                setErrors({ general: response.message || 'Failed to save project' });
            }
        } catch (error) {
            console.error('Submit error:', error);
            await logError({
                controllerName: 'ProjectForm',
                methodName: 'handleSubmit',
                requestUrl: 'projectApi.saveProject',
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
                <div className="admin-table-loading">
                    <i className="fa-solid fa-spinner fa-spin"></i>
                    <p>Loading Project...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-page">
            <div className="admin-page-header">
                <div>
                    <h1 className="admin-page-title">{isEditMode ? 'Edit Project' : 'Add Project'}</h1>
                    <p className="admin-page-subtitle">{isEditMode ? 'Update project details' : 'Create a New Project'}</p>
                </div>
                <div className="admin-page-actions">
                    <button
                        type="button"
                        onClick={() => navigate('/admin/projects')}
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
                    <h2>Project Information</h2>
                </div>
                <div className="admin-card-body">
                    <form onSubmit={handleSubmit} className="admin-form" noValidate>
                        <div className="admin-form-grid">
                            {/* Client Dropdown */}
                            <div className="admin-form-field">
                                <label className="admin-form-label">
                                    Client <span className="admin-form-required">*</span>
                                </label>
                                <select
                                    name="clientId"
                                    value={formData.clientId || ''}
                                    onChange={handleInputChange}
                                    className={`admin-form-control ${errors.clientId ? 'admin-form-control-error' : ''}`}
                                >
                                    <option value="">Select Client</option>
                                    {clients.map((client) => (
                                        <option key={client.id} value={client.id}>
                                            {client.name}
                                        </option>
                                    ))}
                                </select>
                                {errors.clientId && <span className="admin-form-error">{errors.clientId}</span>}
                            </div>

                            {/* Project Name */}
                            <FormField
                                label="Project Name"
                                name="projectName"
                                type="text"
                                value={formData.projectName || ''}
                                onChange={handleInputChange}
                                error={errors.projectName}
                                placeholder="Enter Project Name"
                                required={true}
                            />

                            {/* Project Type Dropdown */}
                            <div className="admin-form-field">
                                <label className="admin-form-label">
                                    Project Type <span className="admin-form-required">*</span>
                                </label>
                                <select
                                    name="projectType"
                                    value={formData.projectType || ''}
                                    onChange={handleInputChange}
                                    className={`admin-form-control ${errors.projectType ? 'admin-form-control-error' : ''}`}
                                >
                                    <option value="">Select Project Type</option>
                                    {projectTypes.map((type) => (
                                        <option key={type.id} value={type.code || type.name}>
                                            {type.name}
                                        </option>
                                    ))}
                                </select>
                                {errors.projectType && <span className="admin-form-error">{errors.projectType}</span>}
                            </div>

                            {/* Start Date */}
                            <FormField
                                label="Start Date"
                                name="startDate"
                                type="date"
                                value={formData.startDate || ''}
                                onChange={handleInputChange}
                                error={errors.startDate}
                                required={true}
                            />

                            {/* Expected End Date */}
                            <FormField
                                label="Expected End Date"
                                name="expectedEndDate"
                                type="date"
                                value={formData.expectedEndDate || ''}
                                onChange={handleInputChange}
                                error={errors.expectedEndDate}
                                required={true}
                                min={formData.startDate || undefined}
                            />

                            {/* Project Status Dropdown */}
                            <div className="admin-form-field">
                                <label className="admin-form-label">
                                    Project Status
                                </label>
                                <select
                                    name="projectStatus"
                                    value={formData.projectStatus || 'Draft'}
                                    onChange={handleInputChange}
                                    className={`admin-form-control ${errors.projectStatus ? 'admin-form-control-error' : ''}`}
                                    disabled={!isEditMode}
                                >
                                    {!isEditMode ? (
                                        // Add mode: Only Draft option
                                        <option value="Draft">Draft</option>
                                    ) : (
                                        // Edit mode: Show all statuses
                                        <>
                                            {projectStatuses.map((status) => (
                                                <option key={status.id} value={status.code || status.name}>
                                                    {status.name}
                                                </option>
                                            ))}
                                        </>
                                    )}
                                </select>
                                {errors.projectStatus && <span className="admin-form-error">{errors.projectStatus}</span>}
                            </div>
                        </div>

                        <div className="admin-form-actions">
                            <button
                                type="submit"
                                className="admin-btn admin-btn-primary"
                                disabled={submitting}
                            >
                                {submitting ? (
                                    <>
                                        <i className="fa-solid fa-spinner fa-spin"></i>
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        {/* <i className="fa-solid fa-save"></i> */}
                                        {isEditMode ? 'Update Project' : 'Save'}
                                    </>
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={() => navigate('/admin/projects')}
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
