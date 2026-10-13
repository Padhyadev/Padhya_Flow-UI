import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ShortLeave, shortLeaveApi, EmployeeDropdownItem, StatusDropdownItem } from '../../services/api/shortLeaveApi';
import FormField from '../../components/FormField';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { logError } from '../../utils/logError';
import '../../styles/admin.css';
import '../../styles/admin-components.css';

export default function ShortLeaveForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { user: currentUser } = useAuth();
    const { showSuccess, showError } = useToast();
    const isEditMode = Boolean(id);

    const passedShortLeaveData = location.state?.shortLeaveData as ShortLeave | undefined;

    const [formData, setFormData] = useState<{
        employeeId: number;
        leaveDate: string;
        fromTime: string;
        toTime: string;
        totalMinutes: number;
        reason: string;
        status: string;
        approvalRemarks: string;
    }>({
        employeeId: 0,
        leaveDate: '',
        fromTime: '',
        toTime: '',
        totalMinutes: 0,
        reason: '',
        status: 'Pending',
        approvalRemarks: ''
    });

    const [employees, setEmployees] = useState<EmployeeDropdownItem[]>([]);
    const [statuses, setStatuses] = useState<StatusDropdownItem[]>([]);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const isSubmittingRef = useRef(false);

    // Time Picker State (Moved to top level)
    const [activeTimeField, setActiveTimeField] = useState<'fromTime' | 'toTime' | null>(null);
    const [tempTime, setTempTime] = useState({ hour: '12', minute: '00', period: 'AM' });

    // Calculate minimum allowed date (3 days ago)
    const getMinDate = () => {
        const today = new Date();
        const minDate = new Date(today);
        minDate.setDate(today.getDate() - 3);
        const year = minDate.getFullYear();
        const month = String(minDate.getMonth() + 1).padStart(2, '0');
        const day = String(minDate.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    // Get today's date
    const getMaxDate = () => {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    // Calculate total minutes between two times
    const calculateTotalMinutes = (fromTime: string, toTime: string): number => {
        if (!fromTime || !toTime) return 0;

        const from = new Date(`2000-01-01T${fromTime}`);
        const to = new Date(`2000-01-01T${toTime}`);

        if (to <= from) return 0;

        const diffMs = to.getTime() - from.getTime();
        const diffMins = Math.floor(diffMs / 60000);

        return diffMins;
    };

    const loadEmployees = async () => {
        try {
            const response = await shortLeaveApi.getEmployeeDropdown();
            if (response.success) {
                setEmployees(response.data || []);
            } else {
                setErrors({ general: 'Failed to load employees. Please refresh the page.' });
            }
        } catch (error) {
            console.error('Error loading employees:', error);
            await logError({
                controllerName: 'ShortLeaveForm',
                methodName: 'LoadEmployees',
                requestUrl: 'shortLeaveApi.getEmployeeDropdown',
                requestPayload: null,
                error
            });
            setErrors({ general: 'Failed to load employees. Please refresh the page.' });
        }
    };

    const loadStatuses = async () => {
        try {
            const response = await shortLeaveApi.getStatusDropdown();
            if (response.success) {
                const statusList = response.data || [];
                setStatuses(statusList);

                // Match current status with Lov data to ensure correct value is selected
                // This handles cases where backend returns 'Pending' name but we need 'P' code, or vice versa
                const textToMatch = isEditMode ? (formData.status || '') : 'Pending';

                const matchedStatus = statusList.find((sItem) => {
                    const s = sItem as any;
                    const code = s.code?.toString().toLowerCase();
                    const value = s.value?.toString().toLowerCase();
                    const id = s.id?.toString().toLowerCase();
                    const name = s.name?.toString().toLowerCase();
                    const target = textToMatch.toString().toLowerCase();

                    return code === target || value === target || id === target || name === target;
                });

                if (matchedStatus) {
                    const s = matchedStatus as any;
                    const val = s.code || s.value || s.id || s.name;
                    // Only update if we found a better/canonical value, or if we are setting default in Add Mode
                    if (!isEditMode || val) {
                        setFormData(prev => ({ ...prev, status: String(val) }));
                    }
                }
            } else {
                setErrors({ general: 'Failed to load statuses. Please refresh the page.' });
            }
        } catch (error) {
            console.error('Error loading statuses:', error);
            await logError({
                controllerName: 'ShortLeaveForm',
                methodName: 'LoadStatuses',
                requestUrl: 'shortLeaveApi.getStatusDropdown',
                requestPayload: null,
                error
            });
            setErrors({ general: 'Failed to load statuses. Please refresh the page.' });
        }
    };

    const loadShortLeaveData = async (shortLeaveId: string) => {
        try {
            setLoading(true);
            setErrors({});

            const response = await shortLeaveApi.getShortLeaveById(shortLeaveId);

            if (response.success && response.data) {
                const leave = response.data;

                // Format date for input (YYYY-MM-DD) - Use Local Time to avoid timezone shifts
                let leaveDate = '';
                if (leave.leaveDate) {
                    const d = new Date(leave.leaveDate);
                    const year = d.getFullYear();
                    const month = String(d.getMonth() + 1).padStart(2, '0');
                    const day = String(d.getDate()).padStart(2, '0');
                    leaveDate = `${year}-${month}-${day}`;
                }

                // Format time for input (HH:MM) - Safely extract time part ignoring timezone
                const extractTime = (val: string) => {
                    if (!val) return '';
                    if (val.includes('T')) {
                        return val.split('T')[1].slice(0, 5);
                    }
                    if (val.includes(':')) {
                        return val.slice(0, 5);
                    }
                    return '';
                };

                const fromTime = extractTime(leave.fromTime);
                const toTime = extractTime(leave.toTime);

                setFormData({
                    employeeId: leave.employeeId || 0,
                    leaveDate: leaveDate,
                    fromTime: fromTime,
                    toTime: toTime,
                    totalMinutes: leave.totalMinutes || 0,
                    reason: leave.reason || '',
                    status: leave.status || '',
                    approvalRemarks: leave.approvalRemarks || ''
                });
            } else {
                setErrors({ general: response.message || 'Failed to load short leave data' });
            }
        } catch (error) {
            console.error('Error loading short leave:', error);
            await logError({
                controllerName: 'ShortLeaveForm',
                methodName: 'LoadShortLeaveData',
                requestUrl: `shortLeaveApi.getShortLeaveById/${shortLeaveId}`,
                requestPayload: { shortLeaveId },
                error
            });
            setErrors({ general: 'Network error occurred while loading short leave data' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadEmployees();
        loadStatuses();

        if (isEditMode && id) {
            if (passedShortLeaveData) {
                const leave = passedShortLeaveData;

                // Use Local Time to avoid timezone shifts
                let leaveDate = '';
                if (leave.leaveDate) {
                    const d = new Date(leave.leaveDate);
                    const year = d.getFullYear();
                    const month = String(d.getMonth() + 1).padStart(2, '0');
                    const day = String(d.getDate()).padStart(2, '0');
                    leaveDate = `${year}-${month}-${day}`;
                }

                const extractTime = (val: string) => {
                    if (!val) return '';
                    if (val.includes('T')) {
                        return val.split('T')[1].slice(0, 5);
                    }
                    if (val.includes(':')) {
                        return val.slice(0, 5);
                    }
                    return '';
                };

                const fromTime = extractTime(leave.fromTime);
                const toTime = extractTime(leave.toTime);

                setFormData({
                    employeeId: leave.employeeId || 0,
                    leaveDate: leaveDate,
                    fromTime: fromTime,
                    toTime: toTime,
                    totalMinutes: leave.totalMinutes || 0,
                    reason: leave.reason || '',
                    status: leave.status || '',
                    approvalRemarks: leave.approvalRemarks || ''
                });
            } else {
                loadShortLeaveData(id);
            }
        }
    }, [isEditMode, id, passedShortLeaveData]);

    useEffect(() => {
        if (!isEditMode && currentUser?.id && formData.employeeId === 0) {
            setFormData(prev => ({ ...prev, employeeId: Number(currentUser.id) }));
        }
    }, [currentUser, isEditMode]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;

        let updatedFormData = {
            ...formData,
            [name]: name === 'employeeId' ? parseInt(value) : value
        };

        // Auto-calculate totalMinutes when fromTime or toTime changes
        if (name === 'fromTime' || name === 'toTime') {
            const fromTime = name === 'fromTime' ? value : formData.fromTime;
            const toTime = name === 'toTime' ? value : formData.toTime;
            updatedFormData.totalMinutes = calculateTotalMinutes(fromTime, toTime);
        }

        setFormData(updatedFormData);

        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};

        // Removed mandatory validation for employeeId as per user request
        /*
        if (!formData.employeeId || formData.employeeId === 0) {
            newErrors.employeeId = 'Employee is required';
        }
        */

        if (!formData.leaveDate?.trim()) {
            newErrors.leaveDate = 'Leave date is required';
        } else {
            const selectedDate = new Date(formData.leaveDate);
            const minDate = new Date(getMinDate());
            const maxDate = new Date(getMaxDate());

            if (selectedDate < minDate || selectedDate > maxDate) {
                newErrors.leaveDate = 'Date must be within the last 3 days or today';
            }
        }

        if (!formData.fromTime?.trim()) {
            newErrors.fromTime = 'From time is required';
        }

        if (!formData.toTime?.trim()) {
            newErrors.toTime = 'To time is required';
        }

        if (formData.fromTime && formData.toTime) {
            if (formData.totalMinutes <= 0) {
                newErrors.toTime = 'To time must be after from time';
            }
        }

        if (!formData.reason?.trim()) {
            newErrors.reason = 'Reason is required';
        } else if (formData.reason.trim().length < 10) {
            newErrors.reason = 'Reason must be at least 10 characters';
        }

        // Removed mandatory validation for status as per user request
        /*
        if (!formData.status?.trim()) {
            newErrors.status = 'Status is required';
        }
        */

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validate()) {
            return;
        }

        if (isSubmittingRef.current) return;
        isSubmittingRef.current = true;

        try {
            setSubmitting(true);
            setErrors({});

            // Combine date and time for API - Send as Local ISO to avoid Timezone shifts
            const leaveDateObj = new Date(formData.leaveDate);

            // Construct Local ISO String manually to preserve the exact time selected by user
            const fromTimeISO = `${formData.leaveDate}T${formData.fromTime}:00`;
            const toTimeISO = `${formData.leaveDate}T${formData.toTime}:00`;

            const selectedEmp = employees.find(emp => Number(emp.id) === Number(formData.employeeId));

            const requestData = {
                employeeId: formData.employeeId,
                employeeName: selectedEmp ? selectedEmp.name : (currentUser?.name || ''),
                leaveDate: leaveDateObj.toISOString(), // Date part is fine as ISO
                fromTime: fromTimeISO,
                toTime: toTimeISO,
                totalMinutes: formData.totalMinutes,
                reason: formData.reason,
                status: formData.status,
                leaveStatus: formData.status || 'Pending',
                approvalRemarks: formData.approvalRemarks
            };

            let response;
            if (isEditMode && id) {
                response = await shortLeaveApi.updateShortLeave(id, {
                    shortLeaveId: parseInt(id),
                    ...requestData,
                    lastModifiedBy: 0 // Will be set from token in API
                });
            } else {
                response = await shortLeaveApi.addShortLeave({
                    ...requestData,
                    createdBy: 0, // Will be set from token in API
                    lastModifiedBy: 0
                });
            }

            if (response.success) {
                showSuccess(`Short leave ${isEditMode ? 'updated' : 'created'} successfully`);
                navigate('/admin/short-leaves');
            } else {
                setErrors({ general: response.message || `Failed to ${isEditMode ? 'update' : 'create'} short leave` });
            }
        } catch (error) {
            console.error('Submit error:', error);
            await logError({
                controllerName: 'ShortLeaveForm',
                methodName: isEditMode ? 'UpdateShortLeave' : 'CreateShortLeave',
                requestUrl: isEditMode ? `shortLeaveApi.updateShortLeave/${id}` : 'shortLeaveApi.addShortLeave',
                requestPayload: formData,
                error
            });
            setErrors({ general: 'Network error occurred. Please try again.' });
        } finally {
            setSubmitting(false);
            isSubmittingRef.current = false;
        }
    };

    if (loading) {
        return (
            <div className="admin-page">
                <div style={{ padding: '40px', textAlign: 'center' }}>
                    <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '24px', color: 'var(--admin-primary)' }}></i>
                    <p style={{ marginTop: '16px', color: 'var(--admin-gray-600)' }}>Loading short leave data...</p>
                </div>
            </div>
        );
    }

    const employeeOptions = employees.map(emp => ({
        value: emp.id,
        label: emp.name
    }));

    const statusOptions = statuses.map(status => {
        const s = status as any;
        return {
            value: s.code || s.value || s.id || s.name,
            label: s.name || s.text || s.value || 'Unknown'
        };
    });

    // --- TIME PICKER MODAL LOGIC COMMAND START ---



    // Open Picker
    const openTimePicker = (field: 'fromTime' | 'toTime', currentValue24h: string) => {
        setActiveTimeField(field);
        if (currentValue24h) {
            const [h, m] = currentValue24h.split(':').map(Number);
            const period = h >= 12 ? 'PM' : 'AM';
            const hour = (h % 12 || 12).toString(); // remove padStart so it matches option values '1', '2' etc
            const minute = m.toString().padStart(2, '0');
            setTempTime({ hour, minute, period });
        } else {
            setTempTime({ hour: '12', minute: '00', period: 'AM' });
        }
    };

    // Close Picker
    const closeTimePicker = () => {
        setActiveTimeField(null);
    };

    // Save Time
    const handleTimeSave = () => {
        if (!activeTimeField) return;

        let h = parseInt(tempTime.hour);
        const m = tempTime.minute;
        if (tempTime.period === 'PM' && h !== 12) h += 12;
        if (tempTime.period === 'AM' && h === 12) h = 0;

        const timeStr24h = `${h.toString().padStart(2, '0')}:${m}`;

        handleInputChange({
            target: {
                name: activeTimeField,
                value: timeStr24h
            }
        } as any);

        closeTimePicker();
    };

    // Helper to format 24h to 12h for Display
    const formatTimeDisplay = (time24h: string) => {
        if (!time24h) return '-- : -- --';
        const [h, m] = time24h.split(':').map(Number);
        const period = h >= 12 ? 'PM' : 'AM';
        const hour = h % 12 || 12;
        return `${hour}:${m.toString().padStart(2, '0')} ${period}`;
    };

    // Render Trigger Input
    const renderTimePickerTrigger = (field: 'fromTime' | 'toTime', value: string) => {
        return (
            <div
                className={`admin-form-control ${errors[field] ? 'admin-form-control-error' : ''}`}
                style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                onClick={() => openTimePicker(field, value)}
            >
                <span>{formatTimeDisplay(value)}</span>
                <i className="fa-regular fa-clock" style={{ color: 'var(--admin-gray-500)' }}></i>
            </div>
        );
    };

    // Generate Arrays
    const hoursArr = Array.from({ length: 12 }, (_, i) => (i + 1).toString());
    const minutesArr = Array.from({ length: 12 }, (_, i) => (i * 5).toString().padStart(2, '0'));
    // --- TIME PICKER MODAL LOGIC COMMAND END ---

    return (
        <div className="admin-page">
            {/* Custom Styles for Time Picker Modal */}
            <style>{`
                .tp-overlay {
                    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
                    background: rgba(0,0,0,0.5); z-index: 1000;
                    display: flex; align-items: center; justify-content: center;
                }
                .tp-modal {
                    background: white; padding: 20px; borderRadius: 12px; width: 320px;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.2);
                }
                .tp-columns { display: flex; justify-content: center; gap: 20px; margin: 20px 0; }
                .tp-column { height: 150px; overflow-y: auto; text-align: center; width: 60px; scrollbar-width: none; }
                .tp-column::-webkit-scrollbar { display: none; }
                .tp-item { 
                    padding: 8px 0; cursor: pointer; color: #aaa; font-size: 18px; 
                    transition: all 0.2s;
                }
                .tp-item:hover { color: #666; }
                .tp-item.active { 
                    color: var(--admin-primary); font-size: 24px; font-weight: bold; 
                    border-top: 1px solid #eee; border-bottom: 1px solid #eee;
                    background: #f8f9fa;
                }
                .tp-actions { display: flex; justify-content: flex-end; gap: 15px; margin-top: 10px; }
                .tp-btn { border: none; background: none; color: var(--admin-primary); font-weight: 600; cursor: pointer; padding: 5px 10px; }
                .tp-btn:hover { background: #f0f0f0; border-radius: 4px; }
                .tp-header { display: flex; justify-content: center; gap: 5px; font-size: 32px; font-weight: bold; color: var(--admin-gray-800); }
                .tp-ampm-switch { display: flex; flex-direction: column; gap: 5px; justify-content: center; }
                .tp-ampm-item { font-size: 16px; color: #aaa; cursor: pointer; padding: 2px 5px; }
                .tp-ampm-item.active { color: var(--admin-primary); font-weight: bold; background: #e0e7ff; border-radius: 4px; }
            `}</style>

            {/* Time Picker Modal */}
            {activeTimeField && (
                <div className="tp-overlay" onClick={closeTimePicker}>
                    <div className="tp-modal" onClick={e => e.stopPropagation()}>
                        <div className="tp-header">
                            <span>{tempTime.hour}:{tempTime.minute}</span>
                            <span style={{ fontSize: '18px', alignSelf: 'center', marginLeft: '5px' }}>{tempTime.period}</span>
                        </div>

                        <div className="tp-columns">
                            {/* Hours */}
                            <div className="tp-column">
                                {hoursArr.map(h => (
                                    <div
                                        key={h}
                                        className={`tp-item ${tempTime.hour === h ? 'active' : ''}`}
                                        onClick={() => setTempTime(prev => ({ ...prev, hour: h }))}
                                    >
                                        {h}
                                    </div>
                                ))}
                            </div>

                            {/* Minutes */}
                            <div className="tp-column">
                                {minutesArr.map(m => (
                                    <div
                                        key={m}
                                        className={`tp-item ${tempTime.minute === m ? 'active' : ''}`}
                                        onClick={() => setTempTime(prev => ({ ...prev, minute: m }))}
                                    >
                                        {m}
                                    </div>
                                ))}
                            </div>

                            {/* AM/PM */}
                            <div className="tp-ampm-switch">
                                <div
                                    className={`tp-ampm-item ${tempTime.period === 'AM' ? 'active' : ''}`}
                                    onClick={() => setTempTime(prev => ({ ...prev, period: 'AM' }))}
                                >
                                    AM
                                </div>
                                <div
                                    className={`tp-ampm-item ${tempTime.period === 'PM' ? 'active' : ''}`}
                                    onClick={() => setTempTime(prev => ({ ...prev, period: 'PM' }))}
                                >
                                    PM
                                </div>
                            </div>
                        </div>

                        <div className="tp-actions">
                            <button type="button" className="tp-btn" onClick={closeTimePicker}>CANCEL</button>
                            <button type="button" className="tp-btn" onClick={handleTimeSave}>OK</button>
                        </div>
                    </div>
                </div>
            )}
            <div className="admin-page-header">
                <div>
                    <h1 className="admin-page-title">
                        {isEditMode ? 'Edit Short Leave' : 'Add New Short Leave'}
                    </h1>
                    <p className="admin-page-subtitle">
                        {isEditMode ? 'Update Short Leave Information' : 'Create a New Short Leave Request'}
                    </p>
                </div>
                <div className="admin-page-actions">
                    <button
                        type="button"
                        onClick={() => navigate('/admin/short-leaves')}
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
                    <h2>Short Leave Information</h2>
                </div>
                <div className="admin-card-body">
                    <form onSubmit={handleSubmit} className="admin-form" noValidate>
                        {/* Row 1: Leave Date */}
                        <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
                            <div style={{ flex: 1 }}>
                                <FormField
                                    label="Leave Date"
                                    name="leaveDate"
                                    type="date"
                                    value={formData.leaveDate}
                                    onChange={handleInputChange}
                                    error={errors.leaveDate}
                                    required={true}
                                    min={getMinDate()}
                                    max={getMaxDate()}
                                />
                                <p style={{ fontSize: '12px', color: 'var(--admin-gray-500)', marginTop: '4px' }}>
                                    <i className="fa-solid fa-info-circle"></i> You can select dates from the last 3 days or today
                                </p>
                            </div>
                        </div>

                        {/* Row 2: From Time and To Time */}
                        <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
                            <div style={{ flex: 1 }}>
                                <label className="admin-form-label">
                                    From Time <span className="admin-form-required">*</span>
                                </label>
                                {renderTimePickerTrigger('fromTime', formData.fromTime)}
                                {errors.fromTime && <span className="admin-form-error">{errors.fromTime}</span>}
                            </div>
                            <div style={{ flex: 1 }}>
                                <label className="admin-form-label">
                                    To Time <span className="admin-form-required">*</span>
                                </label>
                                {renderTimePickerTrigger('toTime', formData.toTime)}
                                {errors.toTime && <span className="admin-form-error">{errors.toTime}</span>}
                            </div>
                        </div>

                        {/* Row 3: Total Minutes (Auto-calculated, Read-only) */}
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '14px' }}>
                                Duration (Minutes) <span style={{ color: 'var(--admin-success)' }}>*</span>
                            </label>
                            <div style={{
                                padding: '12px',
                                backgroundColor: 'var(--admin-gray-100)',
                                borderRadius: '8px',
                                border: '2px solid var(--admin-gray-200)',
                                fontSize: '16px',
                                fontWeight: '600',
                                color: 'var(--admin-primary)'
                            }}>
                                {formData.totalMinutes} Minutes
                                {formData.totalMinutes > 0 && (
                                    <span style={{ fontSize: '13px', fontWeight: '400', color: 'var(--admin-gray-600)', marginLeft: '10px' }}>
                                        ({Math.floor(formData.totalMinutes / 60)}h {formData.totalMinutes % 60}m)
                                    </span>
                                )}
                            </div>
                            <p style={{ fontSize: '12px', color: 'var(--admin-gray-500)', marginTop: '4px' }}>
                                <i className="fa-solid fa-calculator"></i> Auto-Calculated Based On From And To Time
                            </p>
                        </div>

                        {/* Row 4: Reason (Full Width) */}
                        <div style={{ marginBottom: '20px' }}>
                            <FormField
                                label="Reason"
                                name="reason"
                                type="textarea"
                                value={formData.reason}
                                onChange={handleInputChange}
                                error={errors.reason}
                                placeholder="Enter Reason For Short Leave (Minimum 10 Characters)"
                                required={true}
                                rows={3}
                            />
                        </div>

                        {/* Row 5: Status and Approval Remarks */}
                        <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
                            <div style={{ flex: 1 }}>
                                <FormField
                                    label="Status"
                                    name="status"
                                    type="select"
                                    value={formData.status}
                                    onChange={handleInputChange}
                                    error={errors.status}
                                    options={statusOptions}
                                    readOnly={!isEditMode}
                                    disabled={!isEditMode}
                                    required={false}
                                />
                            </div>
                            <div style={{ flex: 1 }}>
                                <FormField
                                    label="Approval Remarks"
                                    name="approvalRemarks"
                                    type="text"
                                    value={formData.approvalRemarks}
                                    onChange={handleInputChange}
                                    error={errors.approvalRemarks}
                                    placeholder="Enter Approval Remarks (Optional)"
                                />
                            </div>
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
                                onClick={() => navigate('/admin/short-leaves')}
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
