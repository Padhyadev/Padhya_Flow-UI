import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { regionApi, Region } from '../../services/api/regionApi';
import { Country, countryApi } from '../../services/api/countryApi';
import FormField from '../../components/FormField';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import '../../styles/admin.css';
import '../../styles/admin-components.css';

export default function StateForm() {
    const { countryId, stateId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { showSuccess, showError } = useToast();
    const { user: currentUser } = useAuth();
    const isEditMode = Boolean(stateId);

    const passedData = location.state?.stateData as Region | undefined;
    const passedCountry = location.state?.country as Country | undefined;

    const [country, setCountry] = useState<Country | undefined>(passedCountry);
    const [formData, setFormData] = useState<Partial<Region>>({
        regionId: 0,
        countryId: countryId ? parseInt(countryId) : 0,
        regionName: '',
        regionCode: '',
        createdBy: 0,
        lastModifiedBy: 0
    });

    const [existingStates, setExistingStates] = useState<Region[]>([]);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const loadCountryData = async (id: number) => {
        try {
            const response = await countryApi.getCountryById(id);
            if (response.success && response.data) {
                setCountry(response.data);
            }
        } catch (error) {
            console.error('Error loading country:', error);
        }
    };

    const loadStateData = async (regionId: number) => {
        try {
            setLoading(true);
            const response = await regionApi.getRegionById(regionId);
            if (response.success && response.data) {
                setFormData(response.data);
            } else {
                showError('Failed to load state data');
            }
        } catch (error) {
            showError('Network error loading state');
        } finally {
            setLoading(false);
        }
    };

    const loadExistingStates = async () => {
        try {
            const response = await regionApi.getAllRegionsPage(0, 1000, 'asc');
            if (response.success && response.data) {
                const data = Array.isArray(response.data) ? response.data :
                    (response.data as any).data ? (response.data as any).data : [];
                setExistingStates(data);
            }
        } catch (error) {
            console.error('Error loading existing states:', error);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        // Real-time duplicate check
        if (name === 'regionName') {
            const normalizedName = value.trim().toLowerCase();
            const isDuplicate = existingStates.some(s =>
                s.regionName.trim().toLowerCase() === normalizedName &&
                s.regionId !== formData.regionId &&
                s.countryId === formData.countryId // Check duplicates ONLY within the same country
            );
            if (isDuplicate) {
                setErrors(prev => ({ ...prev, regionName: 'State Name already exists in this Country' }));
            } else {
                setErrors(prev => ({ ...prev, regionName: '' }));
            }
        } else if (name === 'regionCode') {
            const normalizedCode = value.trim().toLowerCase();
            const isDuplicateCode = existingStates.some(s =>
                s.regionCode.trim().toLowerCase() === normalizedCode &&
                s.regionId !== formData.regionId &&
                s.countryId === formData.countryId
            );
            if (isDuplicateCode) {
                setErrors(prev => ({ ...prev, regionCode: 'State Code already exists in this Country' }));
            } else {
                setErrors(prev => ({ ...prev, regionCode: '' }));
            }
        } else {
            if (errors[name]) {
                setErrors(prev => ({ ...prev, [name]: '' }));
            }
        }
    };

    useEffect(() => {
        loadExistingStates();
        // Load country data if not passed via state
        if (countryId && !country) {
            loadCountryData(parseInt(countryId));
        }

        if (isEditMode && stateId) {
            if (passedData) {
                setFormData(passedData);
            } else {
                loadStateData(parseInt(stateId));
            }
        }
    }, [isEditMode, stateId, passedData, countryId, country]); // Added country to dependencies

    const validate = () => {
        const newErrors: Record<string, string> = {};

        // State/Region Name validation
        if (!formData.regionName?.trim()) {
            newErrors.regionName = 'State Name is required';
        } else if (formData.regionName.trim().length < 2) {
            newErrors.regionName = 'State Name must be at least 2 characters';
        } else if (formData.regionName.trim().length > 100) {
            newErrors.regionName = 'State Name must not exceed 100 characters';
        } else {
            const normalizedName = formData.regionName.trim().toLowerCase();
            const isDuplicate = existingStates.some(s =>
                s.regionName.trim().toLowerCase() === normalizedName &&
                s.regionId !== formData.regionId &&
                s.countryId === formData.countryId
            );
            if (isDuplicate) {
                newErrors.regionName = 'State Name already exists in this Country';
            }
        }

        // State/Region Code validation
        if (!formData.regionCode?.trim()) {
            newErrors.regionCode = 'State Code is required';
        } else if (formData.regionCode.trim().length < 2) {
            newErrors.regionCode = 'State Code must be at least 2 characters';
        } else if (formData.regionCode.trim().length > 10) {
            newErrors.regionCode = 'State Code must not exceed 10 characters';
        } else if (!/^[A-Za-z0-9\s-]+$/.test(formData.regionCode.trim())) {
            newErrors.regionCode = 'State Code can only contain letters, numbers, spaces, and hyphens';
        } else {
            const normalizedCode = formData.regionCode.trim().toLowerCase();
            const isDuplicateCode = existingStates.some(s =>
                s.regionCode.trim().toLowerCase() === normalizedCode &&
                s.regionId !== formData.regionId &&
                s.countryId === formData.countryId
            );
            if (isDuplicateCode) {
                newErrors.regionCode = 'State Code already exists in this Country';
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

            const userId = currentUser?.id ? Number(currentUser.id) : 0;
            const payload = {
                ...formData,
                regionId: isEditMode && stateId ? parseInt(stateId) : 0,
                countryId: countryId ? parseInt(countryId) : formData.countryId,
                countryName: country?.countryName || '', // Required by backend
                createdBy: isEditMode ? (formData.createdBy || userId) : userId,
                lastModifiedBy: userId
            };

            console.log('=== State Form Submit ===');
            console.log('Is Edit Mode:', isEditMode);
            console.log('Country ID:', countryId);
            console.log('Country Name:', country?.countryName);
            console.log('Payload being sent:', payload);

            const response = await regionApi.addRegion(payload);

            console.log('API Response:', response);
            console.log('Response success:', response.success);
            console.log('Response message:', response.message);
            console.log('Response data:', response.data);

            if (response.success) {
                showSuccess(`State ${isEditMode ? 'updated' : 'created'} successfully`);
                console.log(`Navigating to /admin/countries/${countryId}/states`);
                navigate(`/admin/countries/${countryId}/states`, { state: { country } });
            } else {
                console.error('API returned success=false:', response.message);
                showError(response.message || 'Failed to save state');
            }

        } catch (error) {
            console.error('Exception during submit:', error);
            showError('An unexpected error occurred');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="admin-page">
            <div className="admin-page-header">
                <div>
                    <h1 className="admin-page-title">{isEditMode ? 'Edit State' : 'Add State'}</h1>
                    <p className="admin-page-subtitle">{country?.countryName || 'Country'}</p>
                </div>
                <div className="admin-page-actions">
                    <button
                        type="button"
                        onClick={() => navigate(`/admin/countries/${countryId}/states`, { state: { country } })}
                        className="admin-btn admin-btn-secondary"
                    >
                        <i className="fa-solid fa-arrow-left"></i> Back to States
                    </button>
                </div>
            </div>

            <div className="admin-card">
                <div className="admin-card-header">
                    <h2>State Details</h2>
                </div>
                <div className="admin-card-body">
                    <form onSubmit={handleSubmit} className="admin-form">

                        {/* Row 1: State Name & Code */}
                        <div className="admin-form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                            <FormField
                                label="State Name"
                                name="regionName"
                                value={formData.regionName}
                                onChange={handleInputChange}
                                required
                                error={errors.regionName}
                                placeholder="Ex. Maharashtra"
                            />
                            <FormField
                                label="State Code"
                                name="regionCode"
                                value={formData.regionCode}
                                onChange={handleInputChange}
                                required
                                error={errors.regionCode}
                                placeholder="Ex. MH"
                            />
                        </div>

                        <div className="admin-form-actions">
                            <button type="submit" className="admin-btn admin-btn-primary" disabled={submitting}>
                                {submitting ? 'Saving...' : 'Save'}
                            </button>
                            <button
                                type="button"
                                onClick={() => navigate(`/admin/countries/${countryId}/states`, { state: { country } })}
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
