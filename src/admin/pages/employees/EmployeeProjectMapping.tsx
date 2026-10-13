import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { dropdownApi, DropdownItem } from '../../services/api/dropdownApi';
import { useToast } from '../../context/ToastContext';
import { logError } from '../../utils/logError';
import FormField from '../../components/FormField';
import '../../styles/admin.css';
import '../../styles/admin-components.css';

const API_BASE_URL = 'https://aj.padhyasoft.com/api';

export default function EmployeeProjectMapping() {
    const { id } = useParams(); // Employee ID from URL
    const location = useLocation();
    const navigate = useNavigate();
    const { showSuccess } = useToast();

    // Retrieve employee data passed via state if available
    const passedEmployee = location.state?.employee as { employeeId: number; firstName: string; lastName: string } | undefined;

    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [projects, setProjects] = useState<DropdownItem[]>([]);
    const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [error, setError] = useState<string>('');

    // If we don't have employee name in state, we might display "Loading name..." or just ID.
    // For now, assume state is passed or we default to showing just ID if explicit fetch for name isn't implemented.
    // Ideally we would fetch employee details by ID if state is missing, but let's rely on standard pattern of this app (passing state).
    const employeeName = passedEmployee ? `${passedEmployee.firstName} ${passedEmployee.lastName}` : `Employee #${id}`;

    useEffect(() => {
        loadProjects();
        if (id) {
            loadAssignedProjects();
        }
    }, [id]);

    const loadProjects = async () => {
        try {
            setLoading(true);
            const response = await dropdownApi.getProjectNameForAssignment();
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

    const loadAssignedProjects = async () => {
        if (!id) return;

        try {
            console.log('🔍 Loading assigned projects for employee:', id);
            // Use the specific API for getting assigned projects for the dropdown pre-selection
            const response = await dropdownApi.getAssignedProjectsForEmployee(id);

            if (response.success) {
                const assignedProjects = response.data || [];
                console.log('📦 Assigned projects response:', assignedProjects);

                // Extract project IDs and set them as selected
                if (assignedProjects.length > 0) {
                    const projectIds = assignedProjects.map((p: any) => {
                        // Check various properties that might hold the Project ID in this specific API response
                        const pid = p.projectId || p.ProjectId || p.projectID || p.id || p.Id || p.value || p.Value;
                        return pid ? String(pid) : null;
                    }).filter(id => id !== null) as string[];

                    console.log('✅ Pre-selecting projects:', projectIds);
                    setSelectedProjectIds(projectIds);
                } else {
                    console.log('ℹ️ No projects assigned yet');
                    setSelectedProjectIds([]);
                }
            } else {
                console.warn('⚠️ Failed to load assigned projects:', response.message);
            }
        } catch (err) {
            console.error('❌ Error loading assigned projects:', err);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (selectedProjectIds.length === 0) {
            setError('Please select at least one project');
            return;
        }

        if (!id) return;

        try {
            // Converting strings to comma-separated string for the payload
            // Backend error "The JSON value could not be converted to System.String" confirms it expects a string.
            const projectIdsString = selectedProjectIds.join(',');

            const finalPayload = {
                employeeId: parseInt(id),
                projectIds: projectIdsString
            };

            console.log('Sending Payload (String):', finalPayload);

            const response = await fetch(`${API_BASE_URL}/EmployeeProjectMapping/Add`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('admin_token') || localStorage.getItem('token') || ''}`
                },
                body: JSON.stringify(finalPayload)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error('API Error Response:', errorData);

                // Construct a more useful error message if validation errors exist
                let errorMessage = errorData.message || 'Failed to map project';
                if (errorData.errors) {
                    const validationErrors = Object.values(errorData.errors).flat().join(', ');
                    if (validationErrors) {
                        errorMessage = `Validation Error: ${validationErrors}`;
                    }
                }

                throw new Error(errorMessage);
            }

            const data = await response.json();
            console.log('API Success Response:', data);

            // Updated success check to handle "{ Response: 'S|...' }" format
            if (
                data.success ||
                data.status === 200 ||
                data.message === 'Success' ||
                (data.Response && typeof data.Response === 'string' && (data.Response.startsWith('S|') || data.Response.includes('successfully')))
            ) {
                showSuccess('Projects mapped successfully');
                navigate('/admin/employees');
            } else {
                console.error('API Logic Error:', data);
                throw new Error(data.message || data.Response || 'Failed to map project');
            }

        } catch (err: any) {
            console.error('Error mapping project:', err);
            setError(err.message || 'An error occurred while mapping the projects');

            await logError({
                controllerName: 'EmployeeProjectMapping',
                methodName: 'handleSubmit',
                requestUrl: '/EmployeeProjectMapping/Add',
                requestPayload: {
                    employeeId: id,
                    projectIds: selectedProjectIds.join(','),
                    note: 'Mapping multiple projects via single request'
                },
                error: err
            });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="admin-page">
            <div className="admin-page-header">
                <div>
                    <h1 className="admin-page-title">Add Employee Project</h1>
                    <p className="admin-page-subtitle">Map Employee to Project</p>
                </div>
                <div className="admin-page-actions">
                    <button type="button" onClick={() => navigate('/admin/employees')} className="admin-btn admin-btn-secondary">
                        <i className="fa-solid fa-arrow-left"></i> Back to List
                    </button>
                </div>
            </div>

            {error && (
                <div className="admin-alert admin-alert-error">
                    <i className="fa-solid fa-circle-exclamation"></i>
                    {error}
                </div>
            )}

            <div className="admin-card" style={{ maxWidth: '800px', margin: '0 auto', overflow: 'visible' }}>
                <div className="admin-card-header">
                    <h2>Project Assignment</h2>
                </div>
                <div className="admin-card-body" style={{ overflow: 'visible' }}>
                    <form onSubmit={handleSubmit} className="admin-form">
                        <div className="admin-form-grid" style={{ gridTemplateColumns: '1fr' }}>
                            <div className="admin-form-group">
                                <label className="admin-label">Employee Name</label>
                                <input
                                    type="text"
                                    className="admin-form-control"
                                    value={employeeName}
                                    disabled
                                    style={{ backgroundColor: '#f8fafc', cursor: 'not-allowed', color: '#64748b' }}
                                />
                            </div>

                            <div className="admin-form-group custom-multi-select" style={{ position: 'relative' }}>
                                <label className="admin-label">Select Project</label>
                                <div
                                    className="admin-form-control"
                                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                    style={{
                                        cursor: 'pointer',
                                        minHeight: '42px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        paddingRight: '12px'
                                    }}
                                >
                                    <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1, minWidth: 0, paddingRight: '10px' }}>
                                        {selectedProjectIds.length > 0 ? (
                                            (() => {
                                                const selectedProjects = projects.filter(p => selectedProjectIds.includes(String(p.id)));
                                                const charLimit = 50;
                                                let currentChars = 0;
                                                let visibleCount = 0;

                                                // Calculate how many items fit
                                                for (const p of selectedProjects) {
                                                    const name = String(p.name || p.text || p.value || '');
                                                    if (currentChars + name.length > charLimit) break;
                                                    currentChars += name.length + 2; // +2 for comma space
                                                    visibleCount++;
                                                }

                                                // Always show at least one if selected
                                                if (visibleCount === 0 && selectedProjects.length > 0) visibleCount = 1;

                                                const visibleProjects = selectedProjects.slice(0, visibleCount);
                                                const remaining = selectedProjects.length - visibleCount;

                                                return (
                                                    <span style={{ color: '#334155' }}>
                                                        {visibleProjects.map(p => p.name || p.text || p.value).join(', ')}
                                                        {remaining > 0 && (
                                                            <span style={{ color: '#64748b', marginLeft: '6px', fontWeight: '500' }}>
                                                                (+{remaining} more)
                                                            </span>
                                                        )}
                                                    </span>
                                                );
                                            })()
                                        ) : (
                                            <span style={{ color: '#94a3b8' }}>Select Projects...</span>
                                        )}
                                    </div>
                                    <i className={`fa-solid fa-chevron-${isDropdownOpen ? 'up' : 'down'}`} style={{ fontSize: '12px', color: '#64748b' }}></i>
                                </div>

                                {isDropdownOpen && (
                                    <div style={{
                                        position: 'absolute',
                                        top: '100%',
                                        left: 0,
                                        right: 0,
                                        background: 'white',
                                        border: '1px solid #e2e8f0',
                                        borderRadius: '8px',
                                        marginTop: '4px',
                                        maxHeight: '250px',
                                        overflowY: 'auto',
                                        zIndex: 1000,
                                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                    }}>
                                        {projects.map(project => (
                                            <div
                                                key={project.id}
                                                onClick={() => {
                                                    const idStr = String(project.id);
                                                    setSelectedProjectIds(prev =>
                                                        prev.includes(idStr)
                                                            ? prev.filter(id => id !== idStr)
                                                            : [...prev, idStr]
                                                    );
                                                }}
                                                style={{
                                                    padding: '8px 12px',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '8px',
                                                    borderBottom: '1px solid #f8fafc',
                                                    background: selectedProjectIds.includes(String(project.id)) ? '#f0f9ff' : 'white'
                                                }}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={selectedProjectIds.includes(String(project.id))}
                                                    readOnly
                                                    style={{ cursor: 'pointer' }}
                                                />
                                                <span style={{ fontSize: '14px', color: '#334155' }}>
                                                    {project.name || project.text || project.value}
                                                </span>
                                            </div>
                                        ))}
                                        {projects.length === 0 && (
                                            <div style={{ padding: '12px', textAlign: 'center', color: '#64748b' }}>
                                                No projects available
                                            </div>
                                        )}
                                    </div>
                                )}
                                {/* Overlay to close dropdown when clicking outside */}
                                {isDropdownOpen && (
                                    <div
                                        style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999, cursor: 'default' }}
                                        onClick={() => setIsDropdownOpen(false)}
                                    />
                                )}
                            </div>
                        </div>

                        <div className="admin-form-actions" style={{ marginTop: '32px', borderTop: '1px solid #e2e8f0', paddingTop: '24px' }}>
                            <button
                                type="submit"
                                className="admin-btn admin-btn-primary"
                                disabled={submitting || loading || selectedProjectIds.length === 0}
                                style={{ minWidth: '150px' }}
                            >
                                {/* <i className="fa-solid fa-save"></i> */}
                                {submitting ? 'Saving...' : 'Save'}
                            </button>
                            <button type="button" onClick={() => navigate('/admin/employees')} className="admin-btn admin-btn-secondary">
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
