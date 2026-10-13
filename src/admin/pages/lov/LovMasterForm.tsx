import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { lovApi } from '../../services/api/lovApi';
import FormField from '../../components/FormField';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import '../../styles/admin.css';
import '../../styles/admin-components.css';

export default function LovMasterForm() {
    const { lovColumn } = useParams();
    const navigate = useNavigate();
    const { showSuccess, showError } = useToast();
    const { user: currentUser } = useAuth();

    const isEditMode = !!lovColumn;

    const [formData, setFormData] = useState({
        lov_Column: lovColumn || '',
        display_Text: ''
    });

    const [submitting, setSubmitting] = useState(false);
    const [loading, setLoading] = useState(isEditMode);
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (isEditMode && lovColumn) {
            loadData();
        }
    }, [isEditMode, lovColumn]);

    const loadData = async () => {
        if (!lovColumn) return;
        setLoading(true);
        try {
            const response = await lovApi.getLovMasterEdit(lovColumn);
            if (response.success && response.data) {
                const data = Array.isArray(response.data) ? response.data[0] : response.data;
                if (data) {
                    setFormData(prev => ({
                        ...prev,
                        lov_Column: data.lov_Column || lovColumn,
                        display_Text: data.display_Text || data.description || ''
                    }));
                }
            } else {
                console.warn('Failed to fetch LOV details for master edit');
                showError(response.message || 'Failed to load LOV Master details');
            }
        } catch (error) {
            showError('Network error while loading LOV Master details');
        } finally {
            setLoading(false);
        }
    };

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
        if (!formData.lov_Column.trim()) {
            newErrors.lov_Column = 'Lov Name is required';
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

            const payload = {
                createdBy: 0,
                lastModifiedBy: 0,
                lov_Column: formData.lov_Column,
                display_Text: formData.display_Text || formData.lov_Column,
                action: isEditMode ? "UPDATE" : "INSERT"
            };

            const response = await lovApi.saveLovMaster(payload);

            if (response.success) {
                showSuccess(`LOV Master ${isEditMode ? 'updated' : 'created'} successfully`);
                navigate('/admin/lov');
            } else {
                showError(response.message || `Failed to ${isEditMode ? 'update' : 'create'} LOV Master`);
            }
        } catch (error) {
            showError('Network error');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="admin-page">
                <div className="admin-card">
                    <div className="admin-card-body">Loading LOV Master details...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-page">
            <div className="admin-page-header">
                <div>
                    <h1 className="admin-page-title">{isEditMode ? 'Edit' : 'Add'} LOV Master</h1>
                    <p className="admin-page-subtitle">{isEditMode ? 'Update existing' : 'Create new'} List of Value category</p>
                </div>
                <div className="admin-page-actions">
                    <button
                        type="button"
                        onClick={() => navigate('/admin/lov')}
                        className="admin-btn admin-btn-secondary"
                    >
                        <i className="fa-solid fa-arrow-left"></i> Back to List
                    </button>
                </div>
            </div>

            <div className="admin-card">
                <div className="admin-card-body">
                    <form onSubmit={handleSubmit} className="admin-form" noValidate>
                        <FormField
                            label="LOV Name"
                            name="lov_Column"
                            value={formData.lov_Column}
                            onChange={handleInputChange}
                            required
                            error={errors.lov_Column}
                            placeholder="Ex. PaymentMethod"
                            readOnly={isEditMode}
                        />
                        <FormField
                            label="Display Text"
                            name="display_Text"
                            value={formData.display_Text}
                            onChange={handleInputChange}
                            placeholder="Ex. Payment Method"
                        />

                        <div className="admin-form-actions">
                            <button type="submit" className="admin-btn admin-btn-primary" disabled={submitting}>
                                {submitting ? 'Saving...' : 'Save'}
                            </button>
                            <button
                                type="button"
                                onClick={() => navigate('/admin/lov')}
                                className="admin-btn admin-btn-secondary"
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
