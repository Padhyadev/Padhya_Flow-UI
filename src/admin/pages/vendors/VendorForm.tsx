import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { vendorApi, Vendor } from '../../services/api/vendorApi';
import FormField from '../../components/FormField';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import '../../styles/admin.css';
import '../../styles/admin-components.css';

export default function VendorForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { showSuccess, showError } = useToast();
    const { user: currentUser } = useAuth();
    const isEditMode = Boolean(id);

    // Get passed data if available
    const passedData = location.state?.vendorData as Vendor | undefined;

    const [formData, setFormData] = useState<Partial<Vendor>>({
        vendorId: 0,
        vendorName: '',
        createdBy: 0,
        lastModifiedBy: 0
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [existingVendors, setExistingVendors] = useState<Vendor[]>([]);

    const loadVendorData = async (vendorId: number) => {
        try {
            setLoading(true);
            const response = await vendorApi.getVendorById(vendorId);
            if (response.success && response.data) {
                setFormData(response.data);
            } else {
                showError('Failed to load vendor data');
            }
        } catch (error) {
            showError('Network error loading vendor');
        } finally {
            setLoading(false);
        }
    };

    const loadExistingVendors = async () => {
        try {
            // Limit to 1000 for client-side dup check. If typical dataset > 1000, need backend check.
            const response = await vendorApi.getAllVendorsPage(0, 1000, 'asc');
            if (response.success && response.data) {
                setExistingVendors(response.data);
            }
        } catch (error) {
            console.error('Error loading existing vendors:', error);
        }
    };

    useEffect(() => {
        loadExistingVendors();
        if (isEditMode && id) {
            if (passedData) {
                setFormData(passedData);
            } else {
                loadVendorData(parseInt(id));
            }
        }
    }, [isEditMode, id, passedData]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Real-time duplicate check
        if (name === 'vendorName') {
            const normalizedName = value.trim().toLowerCase();
            const currentId = isEditMode && id ? parseInt(id) : 0;

            const isDuplicate = existingVendors.some(v =>
                v.vendorName.trim().toLowerCase() === normalizedName &&
                v.vendorId !== currentId
            );

            if (isDuplicate) {
                setErrors(prev => ({ ...prev, vendorName: 'Vendor Name already exists' }));
            } else {
                setErrors(prev => ({ ...prev, vendorName: '' }));
            }
        } else {
            if (errors[name]) {
                setErrors(prev => ({ ...prev, [name]: '' }));
            }
        }
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.vendorName?.trim()) {
            newErrors.vendorName = 'Vendor Name is required';
        } else {
            // Duplicate check on submit as well
            const normalizedName = formData.vendorName.trim().toLowerCase();
            const currentId = isEditMode && id ? parseInt(id) : 0;

            const isDuplicate = existingVendors.some(v =>
                v.vendorName.trim().toLowerCase() === normalizedName &&
                v.vendorId !== currentId
            );

            if (isDuplicate) {
                newErrors.vendorName = 'Vendor Name already exists';
            }
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
                vendorId: isEditMode && id ? parseInt(id) : 0,
                createdBy: isEditMode ? (formData.createdBy || userId) : userId,
                lastModifiedBy: userId
            };

            const response = await vendorApi.addVendor(payload);

            if (response.success) {
                showSuccess(`Vendor ${isEditMode ? 'updated' : 'created'} successfully`);
                navigate('/admin/vendors');
            } else {
                showError(response.message || 'Failed to save vendor');
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
                    <h1 className="admin-page-title">{isEditMode ? 'Edit Vendor' : 'Add New Vendor'}</h1>
                </div>
                <div className="admin-page-actions">
                    <button type="button" onClick={() => navigate('/admin/vendors')} className="admin-btn admin-btn-secondary">
                        <i className="fa-solid fa-arrow-left"></i> Back to List
                    </button>
                </div>
            </div>

            <div className="admin-card">
                <div className="admin-card-header">
                    <h2>Vendor Details</h2>
                </div>
                <div className="admin-card-body">
                    <form onSubmit={handleSubmit} className="admin-form" noValidate>
                        <div style={{ marginBottom: '20px' }}>
                            <FormField
                                label="Vendor Name"
                                name="vendorName"
                                value={formData.vendorName}
                                onChange={handleInputChange}
                                required
                                error={errors.vendorName}
                                placeholder="Enter Vendor Name"
                            />
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
                                onClick={() => navigate('/admin/vendors')}
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
