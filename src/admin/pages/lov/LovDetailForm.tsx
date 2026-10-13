import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { lovApi, LovDetailItem } from '../../services/api/lovApi';
import FormField from '../../components/FormField';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import '../../styles/admin.css';
import '../../styles/admin-components.css';

export default function LovDetailForm() {
    const { lovColumn } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { showSuccess, showError } = useToast();
    const { user: currentUser } = useAuth();

    const passedData = location.state?.detailData as LovDetailItem | undefined;
    const isEditMode = !!passedData;

    const [formData, setFormData] = useState<Partial<LovDetailItem>>({
        lov_Column: lovColumn || '',
        lov_Desc: '',
        displayOrder: 0,
        isActive: true,
        isDeleted: false
    });

    const [masterDisplayText, setMasterDisplayText] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [loading, setLoading] = useState(true);
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        const initForm = async () => {
            setLoading(true);
            try {
                if (lovColumn) {
                    const masterRes = await lovApi.getLovMasterEdit(lovColumn);
                    if (masterRes.success && masterRes.data) {
                        const mData = Array.isArray(masterRes.data) ? masterRes.data[0] : masterRes.data;
                        setMasterDisplayText(mData?.display_Text || mData?.description || lovColumn);
                    }
                }

                if (isEditMode && passedData) {
                    setFormData({
                        ...passedData,
                        lov_Column: passedData.lov_Column || lovColumn || ''
                    });
                } else if (lovColumn) {
                    setFormData(prev => ({ ...prev, lov_Column: lovColumn }));
                }
            } catch (err) {
                console.error("Initialization error:", err);
            } finally {
                setLoading(false);
            }
        };

        initForm();
    }, [isEditMode, passedData, lovColumn]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'displayOrder' ? Math.max(0, Number(value)) : value
        }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.lov_Desc?.trim()) {
            newErrors.lov_Desc = 'Description is required';
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
            const userId = Number(currentUser?.id) || 0;

            // Build payload with ONLY detail-specific fields
            // Explicitly exclude master-level fields like display_Text
            let payload: any = {
                lov_Column: lovColumn,
                lov_Desc: formData.lov_Desc,
                displayOrder: Number(formData.displayOrder || 0),
                isActive: formData.isActive !== undefined ? formData.isActive : true,
                isDeleted: formData.isDeleted !== undefined ? formData.isDeleted : false,
                createdBy: isEditMode ? (formData.createdBy || userId) : userId,
                lastModifiedBy: userId
            };

            // If edit mode, include lov_Code and id
            if (isEditMode) {
                if (formData.lov_Code) {
                    payload.lov_Code = formData.lov_Code;
                }
                if (formData.id) {
                    payload.id = formData.id;
                }
            }

            console.log('Saving LOV Detail with payload:', payload);
            const response = await lovApi.saveLovDetail(payload);
            console.log('LOV Detail save response:', response);

            if (response.success) {
                // WORKAROUND: Backend clears master's display_Text when saving detail
                // So we need to restore it by updating the master record
                if (lovColumn && masterDisplayText) {
                    console.log('Restoring master display_Text:', masterDisplayText);
                    const masterPayload = {
                        createdBy: 0,
                        lastModifiedBy: userId,
                        lov_Column: lovColumn,
                        display_Text: masterDisplayText,
                        action: "UPDATE"
                    };

                    const masterResponse = await lovApi.saveLovMaster(masterPayload);
                    console.log('Master display_Text restore response:', masterResponse);

                    if (!masterResponse.success) {
                        console.warn('Failed to restore master display_Text:', masterResponse.message);
                    }
                }

                showSuccess('Saved successfully');
                navigate(`/admin/lov/${lovColumn}`);
            } else {
                showError(response.message || 'Failed to save');
            }
        } catch (error) {
            console.error('Error saving LOV Detail:', error);
            showError('Network error');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="admin-page">
                <div className="admin-table-loading">
                    <i className="fa-solid fa-spinner fa-spin"></i>
                    <p>Loading details...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-page">
            <div className="admin-page-header">
                <div>
                    <h1 className="admin-page-title">{isEditMode ? 'Edit' : 'Add'} LOV Detail</h1>
                    <p className="admin-page-subtitle">{masterDisplayText || lovColumn}</p>
                </div>
                <div className="admin-page-actions">
                    <button
                        type="button"
                        onClick={() => navigate(`/admin/lov/${lovColumn}`)}
                        className="admin-btn admin-btn-secondary"
                    >
                        <i className="fa-solid fa-arrow-left"></i> Back to List
                    </button>
                </div>
            </div>

            <div className="admin-card">
                <div className="admin-card-body">
                    <form onSubmit={handleSubmit} className="admin-form" noValidate>
                        <div className="admin-form-grid">
                            <FormField
                                label="Description"
                                name="lov_Desc"
                                value={formData.lov_Desc || ''}
                                onChange={handleInputChange}
                                required
                                error={errors.lov_Desc}
                                placeholder="Description"
                            />
                            <FormField
                                label="Display Order"
                                name="displayOrder"
                                type="number"
                                value={formData.displayOrder || 0}
                                onChange={handleInputChange}
                                min={0}
                            />
                        </div>

                        <div className="admin-form-actions">
                            <button type="submit" className="admin-btn admin-btn-primary" disabled={submitting}>
                                {submitting ? 'Saving...' : 'Save'}
                            </button>
                            <button
                                type="button"
                                onClick={() => navigate(`/admin/lov/${lovColumn}`)}
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
