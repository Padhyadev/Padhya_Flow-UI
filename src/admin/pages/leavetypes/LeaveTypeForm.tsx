import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { leaveTypesApi, LeaveType } from '../../services/api/leaveTypesApi';
import FormField from '../../components/FormField';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import '../../styles/admin.css';
import '../../styles/admin-components.css';

export default function LeaveTypeForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { showSuccess, showError } = useToast();
    const { user: currentUser } = useAuth();
    const isEditMode = Boolean(id);

    // Get passed data if available
    const passedData = location.state?.leaveData as LeaveType | undefined;

    const [formData, setFormData] = useState<Partial<LeaveType>>({
        leaveTypeId: 0,
        leaveCode: '',
        leaveName: '',
        yearlyQuota: '' as any, // Allow string for input handling
        isCarryForward: false,
        isPaid: false,
        createdBy: 0,
        lastModifiedBy: 0
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const loadLeaveTypeData = async (leaveId: number) => {
        try {
            setLoading(true);
            const response = await leaveTypesApi.getLeaveTypeById(leaveId);
            if (response.success && response.data) {
                setFormData(response.data);
            } else {
                showError('Failed to load leave type data');
            }
        } catch (error) {
            showError('Network error loading leave type');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isEditMode && id) {
            if (passedData) {
                setFormData(passedData);
            } else {
                loadLeaveTypeData(parseInt(id));
            }
        }
    }, [isEditMode, id, passedData]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;

        let finalValue: any = value;
        if (type === 'checkbox') {
            finalValue = (e.target as HTMLInputElement).checked;
        } else if (name === 'yearlyQuota') {
            // Apply strict limit directly on input
            const numVal = parseFloat(value);
            if (!isNaN(numVal)) {
                if (numVal < 0) return; // Prevent negative inputs
                if (numVal > 99.99) return; // Prevent > 99.99
            }
            finalValue = value; // Keep as string for decimal handling
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
        if (!formData.leaveCode?.trim()) newErrors.leaveCode = 'Leave Code is required';
        if (!formData.leaveName?.trim()) newErrors.leaveName = 'Leave Name is required';

        const quotaVal = formData.yearlyQuota as any;
        const quota = Number(quotaVal);

        if (quotaVal === undefined || quotaVal === '' || isNaN(quota) || quota < 0) {
            newErrors.yearlyQuota = 'Valid Yearly Quota is required';
        } else if (quota > 99.99) {
            newErrors.yearlyQuota = 'Quota cannot exceed 99.99';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        try {
            setSubmitting(true);

            // Prepare payload
            const userId = currentUser?.id ? Number(currentUser.id) : 0;
            const payload = {
                ...formData,
                yearlyQuota: Number(formData.yearlyQuota), // Ensure number
                leaveTypeId: isEditMode && id ? parseInt(id) : 0,
                createdBy: isEditMode ? (formData.createdBy || userId) : userId,
                lastModifiedBy: userId
            };

            const response = await leaveTypesApi.addLeaveType(payload);

            if (response.success) {
                showSuccess(`Leave Type ${isEditMode ? 'updated' : 'created'} successfully`);
                navigate('/admin/leavetypes');
            } else {
                showError(response.message || 'Failed to save leave type');
            }

        } catch (error) {
            console.error(error);
            showError('An unexpected error occurred');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="admin-page">
            <div className="admin-page-header">
                <div>
                    <h1 className="admin-page-title">{isEditMode ? 'Edit Leave Type' : 'Add Leave Type'}</h1>
                </div>
                <div className="admin-page-actions">
                    <button type="button" onClick={() => navigate('/admin/leavetypes')} className="admin-btn admin-btn-secondary">
                        <i className="fa-solid fa-arrow-left"></i> Back to List
                    </button>
                </div>
            </div>

            <div className="admin-card">
                <div className="admin-card-header">
                    <h2>Leave Type Details</h2>
                </div>
                <div className="admin-card-body">
                    <form onSubmit={handleSubmit} className="admin-form">

                        {/* Row 1: Code & Name */}
                        <div className="admin-form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                            <FormField
                                label="Leave Code"
                                name="leaveCode"
                                value={formData.leaveCode}
                                onChange={handleInputChange}
                                required
                                error={errors.leaveCode}
                                placeholder="Ex. CL, SL"
                            />
                            <FormField
                                label="Leave Name"
                                name="leaveName"
                                value={formData.leaveName}
                                onChange={handleInputChange}
                                required
                                error={errors.leaveName}
                                placeholder="Ex. Casual Leave"
                            />
                        </div>

                        {/* Row 2: Queue & Checkboxes */}
                        <div className="admin-form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                            <FormField
                                label="Yearly Quota"
                                name="yearlyQuota"
                                value={formData.yearlyQuota}
                                onChange={handleInputChange}
                                required
                                error={errors.yearlyQuota}
                                type="number"
                                placeholder="Enter Year Quota"
                            />

                            <div style={{ display: 'flex', gap: '20px', alignItems: 'center', height: '100%', paddingTop: '10px' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        name="isPaid"
                                        checked={formData.isPaid}
                                        onChange={handleInputChange}
                                        style={{ width: '18px', height: '18px' }}
                                    />
                                    <span style={{ fontSize: '14px', fontWeight: '500' }}>Is Paid Leave</span>
                                </label>

                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        name="isCarryForward"
                                        checked={formData.isCarryForward}
                                        onChange={handleInputChange}
                                        style={{ width: '18px', height: '18px' }}
                                    />
                                    <span style={{ fontSize: '14px', fontWeight: '500' }}>Can Carry Forward</span>
                                </label>
                            </div>
                        </div>

                        <div className="admin-form-actions">
                            <button type="submit" className="admin-btn admin-btn-primary" disabled={submitting}>
                                {submitting ? 'Saving...' : 'Save'}
                            </button>
                            <button type="button" onClick={() => navigate('/admin/leavetypes')} className="admin-btn admin-btn-secondary">
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
