import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { countryApi, Country } from '../../services/api/countryApi';
import { dropdownApi } from '../../services/api/dropdownApi';
import FormField from '../../components/FormField';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import '../../styles/admin.css';
import '../../styles/admin-components.css';

export default function CountryForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { showSuccess, showError } = useToast();
    const { user: currentUser } = useAuth();
    const isEditMode = Boolean(id);

    const passedData = location.state?.countryData as Country | undefined;

    const [formData, setFormData] = useState<Partial<Country>>({
        countryId: 0,
        countryName: '',
        countryCode: '',
        currencyCode: '',
        timeZone: '',
        createdBy: 0,
        lastModifiedBy: 0
    });

    const [existingCountries, setExistingCountries] = useState<Country[]>([]);
    const [timeZoneOptions, setTimeZoneOptions] = useState<{ value: string; label: string }[]>([]);
    const [timeZoneLoading, setTimeZoneLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const loadTimeZones = async () => {
        try {
            setTimeZoneLoading(true);
            const response = await dropdownApi.getLovMaster('timeZone');
            if (response.success && response.data) {
                const options = response.data.map((item: any) => {
                    const value = item.lov_Value || item.value || item.timeZone || item.name || item.text || '';
                    const label = item.lov_Value || item.label || item.timeZone || item.name || item.text || value;
                    return { value, label };
                });
                setTimeZoneOptions(options);
            } else {
                showError(response.message || 'Failed to load timezones');
            }
        } catch (error) {
            console.error('Error loading time zones:', error);
            showError('Network error while loading timezones');
        } finally {
            setTimeZoneLoading(false);
        }
    };

    const loadCountryData = async (countryId: number) => {
        try {
            setLoading(true);
            const response = await countryApi.getCountryById(countryId);
            if (response.success && response.data) {
                setFormData(response.data);
            } else {
                showError('Failed to load country data');
            }
        } catch (error) {
            showError('Network error loading country');
        } finally {
            setLoading(false);
        }
    };

    const loadExistingCountries = async () => {
        try {
            const response = await countryApi.getAllCountriesPage(0, 1000, 'asc');
            if (response.success && response.data) {
                const data = Array.isArray(response.data) ? response.data :
                    (response.data as any).data ? (response.data as any).data : [];
                setExistingCountries(data);
            }
        } catch (error) {
            console.error('Error loading existing countries:', error);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        // Real-time duplicate check
        if (name === 'countryName') {
            const normalizedName = value.trim().toLowerCase();
            const isDuplicate = existingCountries.some(c =>
                c.countryName.trim().toLowerCase() === normalizedName &&
                c.countryId !== formData.countryId
            );
            if (isDuplicate) {
                setErrors(prev => ({ ...prev, countryName: 'Country Name already exists' }));
            } else {
                setErrors(prev => ({ ...prev, countryName: '' }));
            }
        } else if (name === 'countryCode') {
            const normalizedCode = value.trim().toLowerCase();
            const isDuplicateCode = existingCountries.some(c =>
                c.countryCode.trim().toLowerCase() === normalizedCode &&
                c.countryId !== formData.countryId
            );
            if (isDuplicateCode) {
                setErrors(prev => ({ ...prev, countryCode: 'Country Code already exists' }));
            } else {
                setErrors(prev => ({ ...prev, countryCode: '' }));
            }
        } else {
            if (errors[name]) {
                setErrors(prev => ({ ...prev, [name]: '' }));
            }
        }
    };

    useEffect(() => {
        loadTimeZones();
        loadExistingCountries();
        if (isEditMode && id) {
            if (passedData) {
                setFormData(passedData);
            } else {
                loadCountryData(parseInt(id));
            }
        }
    }, [isEditMode, id, passedData]);

    const validate = () => {
        const newErrors: Record<string, string> = {};

        // Country Name validation
        if (!formData.countryName?.trim()) {
            newErrors.countryName = 'Country Name is required';
        } else if (formData.countryName.trim().length < 2) {
            newErrors.countryName = 'Country Name must be at least 2 characters';
        } else if (formData.countryName.trim().length > 100) {
            newErrors.countryName = 'Country Name must not exceed 100 characters';
        } else {
            const normalizedName = formData.countryName.trim().toLowerCase();
            const isDuplicate = existingCountries.some(c =>
                c.countryName.trim().toLowerCase() === normalizedName &&
                c.countryId !== formData.countryId
            );
            if (isDuplicate) {
                newErrors.countryName = 'Country Name already exists';
            }
        }

        // Country Code validation
        if (!formData.countryCode?.trim()) {
            newErrors.countryCode = 'Country Code is required';
        } else if (formData.countryCode.trim().length < 2) {
            newErrors.countryCode = 'Country Code must be at least 2 characters';
        } else if (formData.countryCode.trim().length > 10) {
            newErrors.countryCode = 'Country Code must not exceed 10 characters';
        } else if (!/^[A-Za-z0-9\s-]+$/.test(formData.countryCode.trim())) {
            newErrors.countryCode = 'Country Code can only contain letters, numbers, spaces, and hyphens';
        } else {
            const normalizedCode = formData.countryCode.trim().toLowerCase();
            const isDuplicateCode = existingCountries.some(c =>
                c.countryCode.trim().toLowerCase() === normalizedCode &&
                c.countryId !== formData.countryId
            );
            if (isDuplicateCode) {
                newErrors.countryCode = 'Country Code already exists';
            }
        }

        // Currency Code validation
        if (!formData.currencyCode?.trim()) {
            newErrors.currencyCode = 'Currency Code is required';
        } else if (formData.currencyCode.trim().length < 2) {
            newErrors.currencyCode = 'Currency Code must be at least 2 characters';
        } else if (formData.currencyCode.trim().length > 10) {
            newErrors.currencyCode = 'Currency Code must not exceed 10 characters';
        } else if (!/^[A-Z]{3}$/.test(formData.currencyCode.trim())) {
            newErrors.currencyCode = 'Currency Code must be 3 uppercase letters (Ex., USD, INR, EUR)';
        }

        // Time Zone validation
        if (!formData.timeZone?.trim()) {
            newErrors.timeZone = 'Time Zone is required';
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
                countryId: isEditMode && id ? parseInt(id) : 0,
                createdBy: isEditMode ? (formData.createdBy || userId) : userId,
                lastModifiedBy: userId
            };

            console.log('=== Country Form Submit ===');
            console.log('Is Edit Mode:', isEditMode);
            console.log('Payload being sent:', payload);

            const response = await countryApi.addCountry(payload);

            console.log('API Response:', response);
            console.log('Response success:', response.success);
            console.log('Response message:', response.message);
            console.log('Response data:', response.data);

            if (response.success) {
                showSuccess(`Country ${isEditMode ? 'updated' : 'created'} successfully`);
                console.log('Navigating to /admin/countries');
                navigate('/admin/countries');
            } else {
                console.error('API returned success=false:', response.message);
                showError(response.message || 'Failed to save country');
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
                    <h1 className="admin-page-title">{isEditMode ? 'Edit Country' : 'Add Country'}</h1>
                </div>
                <div className="admin-page-actions">
                    <button type="button" onClick={() => navigate('/admin/countries')} className="admin-btn admin-btn-secondary">
                        <i className="fa-solid fa-arrow-left"></i> Back to List
                    </button>
                </div>
            </div>

            <div className="admin-card">
                <div className="admin-card-header">
                    <h2>Country Details</h2>
                </div>
                <div className="admin-card-body">
                    <form onSubmit={handleSubmit} className="admin-form">

                        {/* Row 1: Country Name & Code */}
                        <div className="admin-form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                            <FormField
                                label="Country Name"
                                name="countryName"
                                value={formData.countryName}
                                onChange={handleInputChange}
                                required
                                error={errors.countryName}
                                placeholder="Ex. India"
                            />
                            <FormField
                                label="Country Code"
                                name="countryCode"
                                value={formData.countryCode}
                                onChange={handleInputChange}
                                required
                                error={errors.countryCode}
                                placeholder="Ex. IN"
                            />
                        </div>

                        {/* Row 2: Currency Code & Time Zone */}
                        <div className="admin-form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                            <FormField
                                label="Currency Code"
                                name="currencyCode"
                                value={formData.currencyCode}
                                onChange={handleInputChange}
                                required
                                error={errors.currencyCode}
                                placeholder="Ex. INR"
                            />
                            <div className="admin-form-group">
                                <label className="admin-form-label">
                                    Time Zone <span style={{ color: 'var(--admin-danger)' }}>*</span>
                                </label>
                                <select
                                    name="timeZone"
                                    value={formData.timeZone}
                                    onChange={handleInputChange}
                                    className="admin-form-control"
                                    disabled={timeZoneLoading}
                                >
                                    <option value="">
                                        {timeZoneLoading ? 'Loading timezones...' : 'Select Time Zone'}
                                    </option>
                                    {timeZoneOptions.map((option, index) => (
                                        <option key={index} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                                {errors.timeZone && (
                                    <span className="admin-form-error">{errors.timeZone}</span>
                                )}
                            </div>
                        </div>

                        <div className="admin-form-actions">
                            <button type="submit" className="admin-btn admin-btn-primary" disabled={submitting}>
                                {submitting ? 'Saving...' : 'Save'}
                            </button>
                            <button type="button" onClick={() => navigate('/admin/countries')} className="admin-btn admin-btn-secondary">
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
