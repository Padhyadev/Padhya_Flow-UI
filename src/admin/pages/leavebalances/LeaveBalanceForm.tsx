import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { leaveBalanceApi } from '../../services/api/leaveBalanceApi';
import FormField from '../../components/FormField';
import { useToast } from '../../context/ToastContext';
import { logError } from '../../utils/logError';
import '../../styles/admin.css';
import '../../styles/admin-components.css';

export default function LeaveBalanceForm() {
    const navigate = useNavigate();
    const { showSuccess, showError } = useToast();

    const [formData, setFormData] = useState<{
        leaveYear: number;
    }>({
        leaveYear: new Date().getFullYear()
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [submitting, setSubmitting] = useState(false);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;

        setFormData(prev => ({
            ...prev,
            [name]: name === 'leaveYear' ? parseInt(value) : value
        }));

        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.leaveYear) {
            newErrors.leaveYear = 'Leave year is required';
        } else if (formData.leaveYear < 2000 || formData.leaveYear > 2100) {
            newErrors.leaveYear = 'Please enter a valid year between 2000 and 2100';
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

            console.log('🔥 LeaveBalanceForm: Allocating leave balance for year:', formData.leaveYear);

            const response = await leaveBalanceApi.allocate(formData.leaveYear);

            console.log('🔥 LeaveBalanceForm: API Response:', response);

            if (response.success) {
                console.log('✅ LeaveBalanceForm: Success! Navigating back...');
                showSuccess('Leave balance allocated successfully');
                navigate('/admin/leave-balances');
            } else {
                setErrors({ general: response.message || 'Failed to allocate leave balance' });
            }
        } catch (error) {
            console.error('🔥 LeaveBalanceForm: Submit error:', error);

            await logError({
                controllerName: 'LeaveBalanceForm',
                methodName: 'AllocateLeaveBalance',
                requestUrl: 'leaveBalanceApi.allocate',
                requestPayload: formData,
                error
            });

            setErrors({ general: 'Network error occurred. Please try again.' });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="admin-page">
            <div className="admin-page-header">
                <div>
                    <h1 className="admin-page-title">Add Leave Balance</h1>
                    <p className="admin-page-subtitle">Allocate Leave Balance For All Employees For a Specific Year</p>
                </div>
                <div className="admin-page-actions">
                    <button
                        type="button"
                        onClick={() => navigate('/admin/leave-balances')}
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
                    <h2>Leave Balance Allocation</h2>
                </div>
                <div className="admin-card-body">
                    <form onSubmit={handleSubmit} className="admin-form" noValidate>
                        {/* Leave Year Field */}
                        <div style={{ marginBottom: '30px' }}>
                            <FormField
                                label="Leave Year"
                                name="leaveYear"
                                type="number"
                                value={formData.leaveYear}
                                onChange={handleInputChange}
                                error={errors.leaveYear}
                                placeholder="Enter Leave Year (e.g., 2026)"
                                required={true}
                            />
                            <p style={{
                                fontSize: '13px',
                                color: 'var(--admin-gray-500)',
                                marginTop: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                            }}>
                                <i className="fa-solid fa-info-circle"></i>
                                This Will Allocate Leave Balance For All Employees For The Year {formData.leaveYear}
                            </p>
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
                                        Allocating...
                                    </>
                                ) : (
                                    <>
                                        {/* <i className=""></i> */}
                                        Save
                                    </>
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={() => navigate('/admin/leave-balances')}
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
