import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { leaveApplicationApi, LeaveApplication } from '../../services/api/leaveApplicationApi';
import { dropdownApi, DropdownItem } from '../../services/api/dropdownApi';
// import { leaveTypesApi } from '../../services/api/leaveTypesApi';
import FormField from '../../components/FormField';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import '../../styles/admin.css';
import '../../styles/admin-components.css';

export default function LeaveApplicationForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { showSuccess, showError } = useToast();
    const { user: currentUser } = useAuth();
    const isEditMode = Boolean(id);

    // Get passed data if available
    const passedData = location.state?.leaveData as LeaveApplication | undefined;

    const [formData, setFormData] = useState<Partial<LeaveApplication>>({
        leaveApplicationId: 0,
        employeeId: 0,
        leaveTypeId: 0,
        fromDate: '',
        toDate: '',
        totalDays: 0,
        reason: '',
        status: 'Pending',
        approvedBy: 0,
        approvalRemarks: '',
        createdBy: 0,
        lastModifiedBy: 0
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const isSubmittingRef = useRef(false);

    // Dropdowns
    const [employees, setEmployees] = useState<DropdownItem[]>([]);
    const [leaveTypes, setLeaveTypes] = useState<DropdownItem[]>([]);
    const [statusOptions, setStatusOptions] = useState<DropdownItem[]>([]);

    // Static Total Days options
    const totalDaysOptions = ["Half Day", 1, 2, 3, 4, 5, 6, 7];

    useEffect(() => {
        loadDropdowns();
        if (isEditMode && id) {
            if (passedData) {
                // Formatting dates for input[type="date"]
                const d = { ...passedData };
                if (d.fromDate) d.fromDate = d.fromDate.split('T')[0];
                if (d.toDate) d.toDate = d.toDate.split('T')[0];
                setFormData(d);
            } else {
                loadRecord(parseInt(id));
            }
        }
    }, [isEditMode, id, passedData]);

    useEffect(() => {
        if (!isEditMode && currentUser?.id && formData.employeeId === 0) {
            setFormData(prev => ({ ...prev, employeeId: Number(currentUser.id) }));
        }
    }, [currentUser, isEditMode]);

    // Auto-calculate Total Days when dates change
    useEffect(() => {
        if (formData.fromDate && formData.toDate) {
            const start = new Date(formData.fromDate);
            const end = new Date(formData.toDate);

            // Validate dates
            if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && start <= end) {
                // Determine difference in milliseconds
                const diffTime = Math.abs(end.getTime() - start.getTime());
                // Convert to days (inclusive, so +1)
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

                setFormData(prev => ({
                    ...prev,
                    totalDays: diffDays
                }));
            }
        }
    }, [formData.fromDate, formData.toDate]);

    const loadDropdowns = async () => {
        try {
            // 1. Employees
            const empRes = await dropdownApi.getEmployeesName();
            if (empRes.success) {
                const data = Array.isArray(empRes.data) ? empRes.data : [];
                setEmployees(data);
            }

            // 2. Leave Types
            const ltRes = await dropdownApi.getLeaveName();
            if (ltRes.success) {
                const data = Array.isArray(ltRes.data) ? ltRes.data : [];
                setLeaveTypes(data);
            }

            // 3. Status LOV
            const lovRes = await dropdownApi.getLovMaster('LeaveApplications');
            if (lovRes.success) {
                const data = Array.isArray(lovRes.data) ? lovRes.data : [];
                setStatusOptions(data);

                // Match current status with Lov data to ensure correct value is selected
                // This handles cases where backend returns 'Pending' name but we need 'P' code, or vice versa
                const textToMatch = isEditMode ? (formData.status || '') : 'Pending';

                const matchedStatus = data.find((s: any) => {
                    const code = s.code?.toString().toLowerCase();
                    const value = s.value?.toString().toLowerCase();
                    const id = s.id?.toString().toLowerCase();
                    const name = s.name?.toString().toLowerCase();
                    const target = textToMatch.toString().toLowerCase();

                    return code === target || value === target || id === target || name === target;
                });

                if (matchedStatus) {
                    const val = matchedStatus.code || matchedStatus.value || matchedStatus.id || matchedStatus.name;
                    // Only update if we found a better/canonical value, or if we are setting default in Add Mode
                    if (!isEditMode || val) {
                        setFormData(prev => ({ ...prev, status: String(val) }));
                    }
                }
            }

        } catch (e) {
            console.error('Error loading dropdowns', e);
        }
    };

    const loadRecord = async (recId: number) => {
        try {
            setLoading(true);
            const response = await leaveApplicationApi.getLeaveApplicationById(recId);
            if (response.success && response.data) {
                const d = response.data;
                if (d.fromDate) d.fromDate = d.fromDate.split('T')[0];
                if (d.toDate) d.toDate = d.toDate.split('T')[0];
                setFormData(d);
            } else {
                showError('Failed to load data');
            }
        } catch (error) {
            showError('Network error');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;

        let finalValue: any = value;

        // Handle number fields
        if (name === 'employeeId' || name === 'leaveTypeId' || name === 'totalDays') {
            finalValue = Number(value);
        }

        setFormData(prev => ({
            ...prev,
            [name]: finalValue
        }));

        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};
        // Removed mandatory validation for employeeId and status as per user request "condition nahi rakhni hai"
        if (!formData.leaveTypeId) newErrors.leaveTypeId = 'Leave Type is required';
        if (!formData.fromDate) newErrors.fromDate = 'From Date is required';
        if (!formData.toDate) newErrors.toDate = 'To Date is required';
        if (!formData.totalDays) newErrors.totalDays = 'Total Days is required';
        if (!formData.reason?.trim()) newErrors.reason = 'Reason is required';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        if (isSubmittingRef.current) return;
        isSubmittingRef.current = true;

        try {
            setSubmitting(true);

            // Find names for redundant backend validation requirements
            const selectedEmp = employees.find(e => Number(e.id || e.value) === Number(formData.employeeId));
            const selectedLT = leaveTypes.find(l => Number(l.id || l.value) === Number(formData.leaveTypeId));
            const currentUserObj = JSON.parse(localStorage.getItem('admin_user') || '{}');

            // Prepare sanitized payload
            const payload: any = {
                leaveApplicationId: isEditMode && id ? parseInt(id) : 0,
                id: isEditMode && id ? parseInt(id) : 0,
                employeeId: Number(formData.employeeId),
                leaveTypeId: Number(formData.leaveTypeId),
                fromDate: formData.fromDate ? new Date(formData.fromDate).toISOString() : '',
                toDate: formData.toDate ? new Date(formData.toDate).toISOString() : '',
                totalDays: Number(formData.totalDays),
                reason: formData.reason,
                status: formData.status,
                approvedBy: Number(currentUser?.id || 0),
                approvalRemarks: formData.approvalRemarks || '',
                createdBy: isEditMode ? formData.createdBy : Number(currentUser?.id || 0),
                lastModifiedBy: Number(currentUser?.id || 0),

                // Mapping and Redundant fields required by backend validation
                EmployeeName: selectedEmp ? (selectedEmp.name || selectedEmp.text) : (currentUser?.name || ''),
                LeaveName: selectedLT ? (selectedLT.name || selectedLT.text) : '',
                LeaveStatus: formData.status || 'Pending',
                ApproveBy: currentUserObj.name || ''
            };

            const response = isEditMode
                ? await leaveApplicationApi.updateLeaveApplication(payload)
                : await leaveApplicationApi.addLeaveApplication(payload);

            if (response.success) {
                showSuccess(`Application ${isEditMode ? 'updated' : 'created'} successfully`);
                navigate('/admin/leaveapplications');
            } else {
                showError(response.message || 'Failed to save');
            }

        } catch (error) {
            console.error(error);
            showError('An unexpected error occurred');
        } finally {
            setSubmitting(false);
            isSubmittingRef.current = false;
        }
    };

    const employeeOptions = employees.map(emp => ({
        value: emp.id || emp.value || '',
        label: emp.name || emp.text || ''
    }));

    const leaveTypeOptions = leaveTypes.map(lt => ({
        value: lt.id || lt.value || '',
        label: lt.name || lt.text || ''
    }));

    const statusSelectOptions = statusOptions.map(st => ({
        value: st.code || st.value || st.id || st.name,
        label: String(st.name || st.text || st.value || 'Unknown')
    }));

    const daysOptions = totalDaysOptions.map(day => ({
        value: day === "Half Day" ? 0.5 : day,
        label: day.toString()
    }));

    return (
        <div className="admin-page">
            <div className="admin-page-header">
                <div>
                    <h1 className="admin-page-title">{isEditMode ? 'Edit Leave Application' : 'Add Leave Application'}</h1>
                </div>
                <div className="admin-page-actions">
                    <button type="button" onClick={() => navigate('/admin/leaveapplications')} className="admin-btn admin-btn-secondary">
                        <i className="fa-solid fa-arrow-left"></i> Back to List
                    </button>
                </div>
            </div>

            <div className="admin-card">
                <div className="admin-card-header">
                    <h2>Application Details</h2>
                </div>
                <div className="admin-card-body">
                    <form onSubmit={handleSubmit} className="admin-form" noValidate>


                        {/* Row 1: Leave Type */}
                        <div className="admin-form-grid" style={{ gridTemplateColumns: '1fr' }}>
                            <FormField
                                label="Leave Type"
                                name="leaveTypeId"
                                type="select"
                                value={formData.leaveTypeId}
                                onChange={handleInputChange}
                                error={errors.leaveTypeId}
                                options={leaveTypeOptions}
                                required
                                placeholder="Select Leave Type"
                            />
                        </div>

                        {/* Row 2: Dates */}
                        <div className="admin-form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                            <FormField
                                label="From Date"
                                name="fromDate"
                                type="date"
                                value={formData.fromDate}
                                onChange={handleInputChange}
                                required
                                error={errors.fromDate}
                                min={new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                            />
                            <FormField
                                label="To Date"
                                name="toDate"
                                type="date"
                                value={formData.toDate}
                                onChange={handleInputChange}
                                required
                                error={errors.toDate}
                                min={formData.fromDate || new Date().toISOString().split('T')[0]}
                            />
                        </div>

                        {/* Row 3: Total Days & Status */}
                        <div className="admin-form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                            <FormField
                                label="Total Days"
                                name="totalDays"
                                type="select"
                                value={formData.totalDays}
                                onChange={handleInputChange}
                                error={errors.totalDays}
                                options={daysOptions}
                                required
                                placeholder="Select Days"
                            />

                            <FormField
                                label="Status"
                                name="status"
                                type="select"
                                value={formData.status}
                                onChange={handleInputChange}
                                error={errors.status}
                                options={statusSelectOptions}
                                readOnly={!isEditMode}
                                disabled={!isEditMode}
                                placeholder="Select Status"
                            />
                        </div>

                        {/* Row 4: Reason */}
                        <FormField
                            label="Reason"
                            name="reason"
                            type="textarea"
                            value={formData.reason}
                            onChange={handleInputChange}
                            error={errors.reason}
                            required
                            rows={3}
                            placeholder="Enter Reason For Leave..."
                        />

                        {/* Row 5: Remarks (Optional/Admin) */}
                        <FormField
                            label="Approval Remarks"
                            name="approvalRemarks"
                            type="textarea"
                            value={formData.approvalRemarks}
                            onChange={handleInputChange}
                            rows={2}
                            placeholder="Remarks..."
                        />


                        <div className="admin-form-actions">
                            <button type="submit" className="admin-btn admin-btn-primary" disabled={submitting}>
                                {submitting ? 'Saving...' : 'Save'}
                            </button>
                            <button type="button" onClick={() => navigate('/admin/leaveapplications')} className="admin-btn admin-btn-secondary">
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
