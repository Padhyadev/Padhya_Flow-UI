import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { DailyTask, dailyTaskApi } from '../../services/api/dailyTaskApi';
import { dropdownApi } from '../../services/api/dropdownApi';
import FormField from '../../components/FormField';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { logError } from '../../utils/logError';
import { toInputDate } from '../../utils/dateUtils';
import '../../styles/admin.css';
import '../../styles/admin-components.css';

export default function DailyTaskForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { user: currentUser } = useAuth();
    const { showSuccess } = useToast();
    const isEditMode = Boolean(id);

    const passedTaskData = location.state?.taskData as DailyTask | undefined;

    const [formData, setFormData] = useState<Partial<DailyTask>>({
        projectID: 0,
        taskTitle: '',
        taskDescription: '',
        workDate: new Date().toISOString().split('T')[0], // Default to today
        hoursSpent: 0,
        taskStatus: 'InProgress', // Default to InProgress for new tasks
        isActive: true,
        isDeleted: false
    });

    const [projects, setProjects] = useState<any[]>([]);
    const [statuses, setStatuses] = useState<any[]>([]);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        loadDropdowns();

        if (isEditMode && id) {
            if (passedTaskData) {
                setFormData({
                    ...passedTaskData,
                    workDate: toInputDate(passedTaskData.workDate)
                });
            } else {
                loadTaskData(Number(id));
            }
        }
    }, [isEditMode, id, passedTaskData]);

    const getUserId = (): number => {
        // Try admin_user first
        const adminUser = localStorage.getItem('admin_user');
        if (adminUser) {
            try {
                const user = JSON.parse(adminUser);
                console.log('🔍 DailyTaskForm: Found admin_user:', user);
                // Check if user has employeeId field (API expects Employee ID)
                if (user.employeeId) {
                    const employeeId = parseInt(user.employeeId);
                    console.log('✅ DailyTaskForm: Using Employee ID from user.employeeId:', employeeId);
                    return employeeId;
                } else {
                    // Fallback to user.id if employeeId not found
                    const userId = parseInt(user.id) || 0;
                    console.log('⚠️ DailyTaskForm: No employeeId found, using user.id:', userId);
                    return userId;
                }
            } catch {
                console.error('❌ DailyTaskForm: Failed to parse admin_user');
            }
        }

        // Try user as fallback
        const regularUser = localStorage.getItem('user');
        if (regularUser) {
            try {
                const user = JSON.parse(regularUser);
                console.log('🔍 DailyTaskForm: Found user:', user);
                // Check if user has employeeId field (API expects Employee ID)
                if (user.employeeId) {
                    const employeeId = parseInt(user.employeeId);
                    console.log('✅ DailyTaskForm: Using Employee ID from user.employeeId:', employeeId);
                    return employeeId;
                } else {
                    // Fallback to user.id if employeeId not found
                    const userId = parseInt(user.id) || 0;
                    console.log('⚠️ DailyTaskForm: No employeeId found, using user.id:', userId);
                    return userId;
                }
            } catch {
                console.error('❌ DailyTaskForm: Failed to parse user');
            }
        }

        console.warn('⚠️ DailyTaskForm: No user found in localStorage');
        return 0;
    };

    const loadDropdowns = async () => {
        try {
            // Get Employee ID from token (user.employeeId or fallback to user.id)
            const employeeId = getUserId();
            console.log('🔍 DailyTaskForm: Loading dropdowns for Employee ID:', employeeId);

            // Load Projects - API expects Employee ID
            if (employeeId) {
                console.log('📡 DailyTaskForm: Calling API with Employee ID:', employeeId);
                console.log('📡 API URL: /Dropdown/ProjectNamebyEmployeeId?EmployeeId=' + employeeId);
                const projectResponse = await dailyTaskApi.getProjectsByEmployeeId(employeeId);
                console.log('📦 DailyTaskForm: Project API Response:', projectResponse);

                if (projectResponse.success && projectResponse.data) {
                    console.log('✅ DailyTaskForm: Projects loaded:', projectResponse.data.length, 'projects');
                    console.log('📋 Projects:', projectResponse.data);
                    setProjects(projectResponse.data);
                } else {
                    console.error('❌ DailyTaskForm: Failed to load projects:', projectResponse.message);
                }
            } else {
                console.error('❌ DailyTaskForm: No employeeId found in token, cannot load projects');
            }

            // Load Task Statuses
            const statusResponse = await dropdownApi.getLovMaster('taskStatus');
            if (statusResponse.success && statusResponse.data) {
                console.log('✅ DailyTaskForm: Statuses loaded:', statusResponse.data.length, 'statuses');
                console.log('📋 All Statuses:', statusResponse.data);
                setStatuses(statusResponse.data);

                // Set default status to InProgress for new tasks (Add mode only)
                if (!isEditMode) {
                    console.log('🔍 Looking for InProgress status in Add mode...');

                    // Try multiple variations to find InProgress
                    const inProgressStatus = statusResponse.data.find(
                        (s: any) => {
                            const code = s.code?.toString().toLowerCase();
                            const value = s.value?.toString().toLowerCase();
                            const id = s.id?.toString().toLowerCase();
                            const name = s.name?.toString().toLowerCase();

                            console.log('Checking status:', { code, value, id, name });

                            return code === 'inprogress' ||
                                value === 'inprogress' ||
                                id === 'inprogress' ||
                                name === 'inprogress' ||
                                code === 'in progress' ||
                                name === 'in progress';
                        }
                    );

                    console.log('✨ Found InProgress Status:', inProgressStatus);

                    if (inProgressStatus) {
                        const statusValue = (inProgressStatus as any).code || inProgressStatus.value || inProgressStatus.id;
                        console.log('✅ Setting default status to:', statusValue);
                        setFormData(prev => ({
                            ...prev,
                            taskStatus: statusValue
                        }));
                    } else {
                        console.warn('⚠️ InProgress status not found in dropdown!');
                    }
                }
            }
        } catch (error) {
            console.error('❌ DailyTaskForm: Error loading dropdowns:', error);
        }
    };

    const loadTaskData = async (taskId: number) => {
        try {
            setLoading(true);
            const response = await dailyTaskApi.getDailyTaskById(taskId);
            if (response.success && response.data) {
                setFormData({
                    ...response.data,
                    workDate: toInputDate(response.data.workDate)
                });
            } else {
                setErrors({ general: 'Failed to load task data' });
            }
        } catch (error) {
            console.error('Error loading task:', error);
            setErrors({ general: 'Network error loading task data' });
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;

        // If projectID is being changed, also store the projectName
        if (name === 'projectID') {
            const selectedProject = projects.find(p =>
                (p.id || p.Id || p.projectId) === Number(value)
            );
            setFormData(prev => ({
                ...prev,
                projectID: Number(value),
                projectName: selectedProject ? (selectedProject.name || selectedProject.Name || selectedProject.projectName) : ''
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: name === 'hoursSpent' ? Number(value) : value
            }));
        }

        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.projectID) newErrors.projectID = 'Project is required';
        if (!formData.taskTitle?.trim()) newErrors.taskTitle = 'Task Title is required';
        if (!formData.workDate) newErrors.workDate = 'Work Date is required';
        if (!formData.hoursSpent || formData.hoursSpent <= 0) newErrors.hoursSpent = 'Hours Spent must be greater than 0';
        if (!formData.taskStatus) newErrors.taskStatus = 'Task Status is required';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        try {
            setSubmitting(true);

            // Get employee name from current user
            const adminUser = localStorage.getItem('admin_user');
            let employeeName = '';
            if (adminUser) {
                try {
                    const user = JSON.parse(adminUser);
                    employeeName = user.name || user.employeeName || user.username || '';
                } catch {
                    console.error('Failed to parse admin_user for employeeName');
                }
            }

            // Ensure ID is set for update
            const payload = {
                ...formData,
                dailyTaskID: isEditMode ? Number(id) : 0, // Dynamic from URL in edit mode
                employeeName: employeeName, // Add employee name to payload
            };

            console.log('📤 Form Submit - Edit Mode:', isEditMode);
            console.log('📤 Form Submit - ID from URL:', id);
            console.log('📤 Form Submit - dailyTaskID:', payload.dailyTaskID);
            console.log('📤 Form Submit - Full Payload:', payload);

            const response = await dailyTaskApi.saveDailyTask(payload);

            if (response.success) {
                showSuccess(`Daily Task ${isEditMode ? 'updated' : 'saved'} successfully`);
                navigate('/admin/daily-tasks');
            } else {
                setErrors({ general: response.message || 'Failed to save task' });
            }
        } catch (error) {
            console.error('Submit error:', error);
            await logError({
                controllerName: 'DailyTaskForm',
                methodName: 'Submit',
                requestUrl: 'dailyTaskApi.saveDailyTask',
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
                    <p style={{ marginTop: '16px', color: 'var(--admin-gray-600)' }}>Loading task data...</p>
                </div>
            </div>
        );
    }

    const projectOptions = projects.map(p => ({
        value: p.id || p.Id || p.projectId,
        label: p.name || p.Name || p.projectName
    }));

    const statusOptions = statuses.map(s => ({
        value: s.code || s.value || s.id, // Assuming 'code' is what API expects for status string
        label: s.name || s.text || s.value
    }));

    return (
        <div className="admin-page">
            <div className="admin-page-header">
                <div>
                    <h1 className="admin-page-title">
                        {isEditMode ? 'Edit Daily Task' : 'Add Daily Task'}
                    </h1>
                    <p className="admin-page-subtitle">
                        {isEditMode ? 'Update Task Details' : ''}
                    </p>
                </div>
                <div className="admin-page-actions">
                    <button
                        type="button"
                        onClick={() => navigate('/admin/daily-tasks')}
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
                    <h2>Task Details</h2>
                </div>
                <div className="admin-card-body">
                    <form onSubmit={handleSubmit} className="admin-form" noValidate>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px', marginBottom: '20px' }}>
                            <FormField
                                label="Project"
                                name="projectID"
                                type="select"
                                value={formData.projectID}
                                onChange={handleInputChange}
                                error={errors.projectID}
                                options={projectOptions}
                                required={true}
                                placeholder="Select Project"
                            />

                            <FormField
                                label="Work Date"
                                name="workDate"
                                type="date"
                                value={formData.workDate}
                                onChange={handleInputChange}
                                error={errors.workDate}
                                required={true}
                                max={new Date().toISOString().split('T')[0]}
                            />

                            <FormField
                                label="Hours Spent"
                                required={true}
                                error={errors.hoursSpent}
                            >
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type="time"
                                        name="hoursSpent"
                                        value={typeof formData.hoursSpent === 'number'
                                            ? `${Math.floor(formData.hoursSpent).toString().padStart(2, '0')}:${Math.round((formData.hoursSpent % 1) * 60).toString().padStart(2, '0')}`
                                            : formData.hoursSpent}
                                        onChange={(e) => {
                                            // Convert time string (HH:MM) to decimal hours (e.g., 01:30 -> 1.5)
                                            const timeValue = e.target.value;
                                            if (!timeValue) {
                                                setFormData(prev => ({ ...prev, hoursSpent: 0 }));
                                                return;
                                            }
                                            const [hours, minutes] = timeValue.split(':').map(Number);
                                            const decimalHours = hours + (minutes / 60);
                                            setFormData(prev => ({ ...prev, hoursSpent: decimalHours }));
                                        }}
                                        className={`admin-form-control ${errors.hoursSpent ? 'admin-form-control-error' : ''}`}
                                        style={{ width: '100%' }} // standard html time input has its own picker
                                    />
                                    {/* Native time input usually has its own clock icon, but let's keep a visual cue if needed,
                                        though usually type='time' is sufficient. The user asked for "click watch -> open".
                                        Native type='time' does exactly this in modern browsers.
                                    */}
                                </div>
                            </FormField>

                            <FormField
                                label="Status"
                                name="taskStatus"
                                type="select"
                                value={formData.taskStatus}
                                onChange={handleInputChange}
                                error={errors.taskStatus}
                                options={statusOptions}
                                required={true}
                                placeholder="Select Status"
                                readOnly={!isEditMode}
                                disabled={!isEditMode}
                            />
                        </div>

                        <div style={{ marginBottom: '20px' }}>
                            <FormField
                                label="Task Title"
                                name="taskTitle"
                                type="text"
                                value={formData.taskTitle}
                                onChange={handleInputChange}
                                error={errors.taskTitle}
                                placeholder="Enter Task Title"
                                required={true}
                            />
                        </div>

                        <div style={{ marginBottom: '30px' }}>
                            <FormField
                                label="Task Description"
                                name="taskDescription"
                                type="textarea"
                                value={formData.taskDescription}
                                onChange={handleInputChange}
                                placeholder="Describe The Work Done..."
                                rows={4}
                            />
                        </div>

                        <div className="admin-form-actions">
                            <button
                                type="submit"
                                className="admin-btn admin-btn-primary"
                                disabled={submitting}
                            >
                                {submitting ? 'Saving...' : 'Save Task'}
                            </button>
                            <button
                                type="button"
                                onClick={() => navigate('/admin/daily-tasks')}
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
