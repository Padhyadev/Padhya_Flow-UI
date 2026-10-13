import React, { useState, useEffect } from 'react';
import { dropdownApi, DropdownItem } from '../../services/api/dropdownApi';
import { useToast } from '../../context/ToastContext';
import { logError } from '../../utils/logError';
import FormField from '../../components/FormField';
import '../../styles/admin.css';
import '../../styles/admin-components.css';

interface EmployeeProjectModalProps {
    isOpen: boolean;
    onClose: () => void;
    employee: {
        id: number;
        name: string;
    } | null;
}

const API_BASE_URL = 'https://aj.padhyasoft.com/api';

export default function EmployeeProjectModal({ isOpen, onClose, employee }: EmployeeProjectModalProps) {
    const { showSuccess, showError } = useToast();
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [projects, setProjects] = useState<DropdownItem[]>([]);
    const [selectedProjectId, setSelectedProjectId] = useState<string | number>('');
    const [error, setError] = useState<string>('');

    useEffect(() => {
        if (isOpen) {
            loadProjects();
            setSelectedProjectId('');
            setError('');
        }
    }, [isOpen]);

    const loadProjects = async () => {
        try {
            setLoading(true);
            const response = await dropdownApi.getProjectName();
            if (response.success && response.data) {
                setProjects(response.data);
            } else {
                setError('Failed to load projects');
            }
        } catch (err) {
            console.error('Error loading projects:', err);
            setError('Network error loading projects');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedProjectId) {
            setError('Please select a project');
            return;
        }

        if (!employee) return;

        try {
            setSubmitting(true);
            setError('');

            const payload = {
                employeeId: employee.id,
                projectIds: String(selectedProjectId) // Sending as string as per request "projectIds" but usually singular selection.
                // If the API expects an array of IDs in string format "1,2,3", this handles single.
                // If it expects array [1,2], we'd need multiple select. 
                // User said "drop down" (singular implied) but "projectIds" (plural key).
                // I will send as string for now.
            };

            const response = await fetch(`${API_BASE_URL}/EmployeeProjectMapping/Add`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('admin_token') || localStorage.getItem('token') || ''}`
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Failed to map project');
            }

            const data = await response.json();

            // Accommodate inconsistent API success flags
            if (data.success || data.status === 200 || data.message === 'Success') {
                showSuccess('Project mapped successfully');
                onClose();
            } else {
                throw new Error(data.message || 'Failed to map project');
            }

        } catch (err: any) {
            console.error('Error mapping project:', err);
            setError(err.message || 'An error occurred while mapping the project');

            await logError({
                controllerName: 'EmployeeProjectModal',
                methodName: 'handleSubmit',
                requestUrl: '/EmployeeProjectMapping/Add',
                requestPayload: { employeeId: employee.id, projectId: selectedProjectId },
                error: err
            });
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen || !employee) return null;

    return (
        <div className="admin-modal-overlay" onClick={onClose}>
            <div className="admin-modal" style={{ maxWidth: '500px' }} onClick={e => e.stopPropagation()}>
                <div className="admin-modal-header">
                    <h2>Assign Project</h2>
                    <button className="admin-modal-close" onClick={onClose}>
                        <i className="fa-solid fa-times"></i>
                    </button>
                </div>

                <div className="admin-modal-body">
                    {error && (
                        <div className="admin-alert admin-alert-error" style={{ marginBottom: '16px' }}>
                            <i className="fa-solid fa-circle-exclamation"></i>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="admin-form">
                        <div className="admin-form-group">
                            <label className="admin-label">Employee</label>
                            <input
                                type="text"
                                className="admin-form-control"
                                value={employee.name}
                                disabled
                                style={{ backgroundColor: '#f8fafc', cursor: 'not-allowed' }}
                            />
                        </div>

                        <div className="admin-form-group">
                            <label className="admin-label required">Project</label>
                            {loading ? (
                                <div style={{ padding: '10px', color: 'var(--admin-gray-500)' }}>Loading projects...</div>
                            ) : (
                                <select
                                    className="admin-form-control"
                                    value={selectedProjectId}
                                    onChange={(e) => setSelectedProjectId(e.target.value)}
                                    required
                                >
                                    <option value="">Select Project</option>
                                    {projects.map(project => (
                                        <option key={project.id} value={project.id}>
                                            {project.name || project.text || project.value}
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>

                        <div className="admin-form-actions" style={{ marginTop: '24px' }}>
                            <button type="button" className="admin-btn admin-btn-secondary" onClick={onClose}>
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="admin-btn admin-btn-primary"
                                disabled={submitting || loading || !selectedProjectId}
                            >
                                {submitting ? 'Saving...' : 'Assign Project'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
