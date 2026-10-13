import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { officeExpenseTypeApi, OfficeExpenseType } from '../../services/api/officeExpenseTypeApi';
import FormField from '../../components/FormField';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import '../../styles/admin.css';
import '../../styles/admin-components.css';

export default function OfficeExpenseTypeForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { showSuccess, showError } = useToast();
    const { user: currentUser } = useAuth();
    const isEditMode = Boolean(id);

    // Get passed data if available
    const passedData = location.state?.expenseData as OfficeExpenseType | undefined;

    const [formData, setFormData] = useState<Partial<OfficeExpenseType>>({
        expenseTypeId: 0,
        expenseTypeName: '',
        description: '',
        isRecurring: false,
        createdBy: 0,
        lastModifiedBy: 0
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [existingTypes, setExistingTypes] = useState<{ id: number; name: string }[]>([]);

    const loadExpenseTypeData = async (expenseId: number) => {
        try {
            setLoading(true);
            const response = await officeExpenseTypeApi.getOfficeExpenseTypeById(expenseId);
            if (response.success && response.data) {
                setFormData(response.data);
            } else {
                showError('Failed to load expense type data');
            }
        } catch (error) {
            showError('Network error loading expense type');
        } finally {
            setLoading(false);
        }
    };

    const loadExistingTypes = async () => {
        try {
            const response = await officeExpenseTypeApi.getOfficeExpenseTypeDropdown();
            if (response.success) {
                setExistingTypes(response.data || []);
            }
        } catch (error) {
            console.error('Error loading existing types', error);
        }
    };

    useEffect(() => {
        loadExistingTypes();
        if (isEditMode && id) {
            if (passedData) {
                setFormData(passedData);
            } else {
                loadExpenseTypeData(parseInt(id));
            }
        }
    }, [isEditMode, id, passedData]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;

        let finalValue: any = value;
        if (type === 'checkbox') {
            finalValue = (e.target as HTMLInputElement).checked;
        }

        setFormData(prev => ({
            ...prev,
            [name]: finalValue
        }));

        // Real-time Duplicate Check
        if (name === 'expenseTypeName') {
            const normalizedName = finalValue.trim().toLowerCase();
            if (normalizedName) {
                const isDuplicate = existingTypes.some(type =>
                    type.name.trim().toLowerCase() === normalizedName &&
                    type.id !== (isEditMode ? parseInt(id!) : 0)
                );
                if (isDuplicate) {
                    setErrors(prev => ({ ...prev, expenseTypeName: 'Expense Type Name already exists' }));
                } else {
                    setErrors(prev => ({ ...prev, expenseTypeName: '' }));
                }
            } else {
                setErrors(prev => ({ ...prev, expenseTypeName: '' }));
            }
        } else if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.expenseTypeName?.trim()) newErrors.expenseTypeName = 'Expense Type Name is required';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        // Duplicate Check
        const normalizedName = formData.expenseTypeName?.trim().toLowerCase();
        const isDuplicate = existingTypes.some(type =>
            type.name.trim().toLowerCase() === normalizedName &&
            type.id !== (isEditMode ? parseInt(id!) : 0)
        );

        if (isDuplicate) {
            setErrors(prev => ({ ...prev, expenseTypeName: 'Expense Type Name already exists' }));
            showError('Record already exists');
            return;
        }

        try {
            setSubmitting(true);

            // Prepare payload
            const userId = currentUser?.id ? Number(currentUser.id) : 0;
            const payload = {
                ...formData,
                expenseTypeId: isEditMode && id ? parseInt(id) : 0,
                createdBy: isEditMode ? (formData.createdBy || userId) : userId,
                lastModifiedBy: userId
            };

            const response = await officeExpenseTypeApi.addOfficeExpenseType(payload);

            if (response.success) {
                showSuccess(`Expense Type ${isEditMode ? 'updated' : 'created'} successfully`);
                navigate('/admin/office-expense-types');
            } else {
                showError(response.message || 'Failed to save expense type');
            }

        } catch (error) {
            console.error(error);
            showError('An unexpected error occurred');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="admin-page">
                <div className="admin-table-loading">
                    <i className="fa-solid fa-spinner fa-spin"></i>
                    <p>Loading Details...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-page">
            <div className="admin-page-header">
                <div>
                    <h1 className="admin-page-title">{isEditMode ? 'Edit Office Expense Type' : 'Add Office Expense Type'}</h1>
                </div>
                <div className="admin-page-actions">
                    <button type="button" onClick={() => navigate('/admin/office-expense-types')} className="admin-btn admin-btn-secondary">
                        <i className="fa-solid fa-arrow-left"></i> Back to List
                    </button>
                </div>
            </div>

            <div className="admin-card">
                <div className="admin-card-header">
                    <h2>Expense Type Details</h2>
                </div>
                <div className="admin-card-body">
                    <form onSubmit={handleSubmit} className="admin-form" noValidate>
                        {/* Row 1: Name */}
                        <div style={{ marginBottom: '20px' }}>
                            <FormField
                                label="Expense Type Name"
                                name="expenseTypeName"
                                value={formData.expenseTypeName}
                                onChange={handleInputChange}
                                required
                                error={errors.expenseTypeName}
                                placeholder="Ex. Electricity Bill, Internet"
                            />
                        </div>

                        {/* Row 2: Description */}
                        <div style={{ marginBottom: '20px' }}>
                            <FormField
                                label="Description"
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                type="textarea"
                                placeholder="Details About This Expense Type..."
                                rows={3}
                            />
                        </div>

                        {/* Row 3: Recurring Checkbox */}
                        <div style={{ marginBottom: '30px' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', width: 'fit-content' }}>
                                <input
                                    type="checkbox"
                                    name="isRecurring"
                                    checked={formData.isRecurring}
                                    onChange={handleInputChange}
                                    style={{ width: '20px', height: '20px' }}
                                />
                                <span style={{ fontSize: '15px', fontWeight: '500' }}>Is Recurring?</span>
                            </label>
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
                                onClick={() => navigate('/admin/office-expense-types')}
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
