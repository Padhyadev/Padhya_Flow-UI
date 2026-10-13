import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { holidayApi, Holiday } from '../../services/api/holidayApi';
import FormField from '../../components/FormField';
import { useToast } from '../../context/ToastContext';
import '../../styles/admin.css';
import '../../styles/admin-components.css';

export default function HolidayForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { showSuccess, showError } = useToast();
    const isEditMode = Boolean(id);

    // Get passed data if available
    const passedData = location.state?.holidayData as Holiday | undefined;

    const [formData, setFormData] = useState<Partial<Holiday>>({
        holiday_Name: '',
        holiday_Year: new Date().getFullYear().toString(),
        holiday_Date: new Date().toISOString().split('T')[0],
        createdBy: 0,
        lastModifiedBy: 0
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const loadHolidayData = async (holidayId: number) => {
        try {
            setLoading(true);
            const response = await holidayApi.getHolidayById(holidayId);
            if (response.success && response.data) {
                setFormData(response.data);
            } else {
                showError('Failed to load holiday data');
            }
        } catch (error) {
            showError('Network error loading holiday');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isEditMode && id) {
            if (passedData) {
                setFormData(passedData);
            } else {
                loadHolidayData(parseInt(id));
            }
        }
    }, [isEditMode, id, passedData]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.holiday_Name?.trim()) newErrors.holiday_Name = 'Holiday Name is required';
        if (!formData.holiday_Year?.trim()) newErrors.holiday_Year = 'Year is required';
        if (!formData.holiday_Date) newErrors.holiday_Date = 'Date is required';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        try {
            setSubmitting(true);

            // Prepare payload
            const payload = {
                ...formData,
                id: isEditMode && id ? parseInt(id) : 0,
                // Ensure date is ISO
                holiday_Date: new Date(formData.holiday_Date!).toISOString(),
            };

            const response = await holidayApi.addHoliday(payload);

            if (response.success) {
                showSuccess(`Holiday ${isEditMode ? 'updated' : 'created'} successfully`);
                navigate('/admin/holidays');
            } else {
                showError(response.message || 'Failed to save holiday');
            }

        } catch (error) {
            console.error(error);
            showError('An unexpected error occurred');
        } finally {
            setSubmitting(false);
        }
    };

    // Helper to format Date for Input
    const formatDateForInput = (isoString?: string) => {
        if (!isoString) return '';
        try {
            return isoString.split('T')[0];
        } catch {
            return '';
        }
    };

    return (
        <div className="admin-page">
            <div className="admin-page-header">
                <div>
                    <h1 className="admin-page-title">{isEditMode ? 'Edit Holiday' : 'Add Holiday'}</h1>
                </div>
                <div className="admin-page-actions">
                    <button type="button" onClick={() => navigate('/admin/holidays')} className="admin-btn admin-btn-secondary">
                        <i className="fa-solid fa-arrow-left"></i> Back to List
                    </button>
                </div>
            </div>

            <div className="admin-card">
                <div className="admin-card-header">
                    <h2>Holiday Details</h2>
                </div>
                <div className="admin-card-body">
                    <form onSubmit={handleSubmit} className="admin-form" noValidate>

                        <div className="admin-form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                            <FormField
                                label="Holiday Name"
                                name="holiday_Name"
                                value={formData.holiday_Name}
                                onChange={handleInputChange}
                                required
                                error={errors.holiday_Name}
                                placeholder="Enter Holiday Name"
                            />
                            <FormField
                                label="Year"
                                name="holiday_Year"
                                value={formData.holiday_Year}
                                onChange={handleInputChange}
                                required
                                error={errors.holiday_Year}
                                type="number"
                                placeholder="Enter Year"
                            />
                        </div>

                        <div className="admin-form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                            <FormField
                                label="Date"
                                name="holiday_Date"
                                type="date"
                                value={formatDateForInput(formData.holiday_Date)}
                                onChange={handleInputChange}
                                required
                                error={errors.holiday_Date}
                                min={new Date().toISOString().split('T')[0]}
                                placeholder="Select Holiday Date"
                            />
                        </div>

                        <div className="admin-form-actions">
                            <button type="submit" className="admin-btn admin-btn-primary" disabled={submitting}>
                                {submitting ? 'Saving...' : 'Save'}
                            </button>
                            <button type="button" onClick={() => navigate('/admin/holidays')} className="admin-btn admin-btn-secondary">
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
