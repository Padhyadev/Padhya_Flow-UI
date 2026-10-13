import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { cityApi, City } from '../../services/api/cityApi';
import { Region } from '../../services/api/regionApi';
import { Country } from '../../services/api/countryApi';
import FormField from '../../components/FormField';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import '../../styles/admin.css';
import '../../styles/admin-components.css';

export default function CityForm() {
    const { countryId, stateId, cityId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { showSuccess, showError } = useToast();
    const { user: currentUser } = useAuth();
    const isEditMode = Boolean(cityId);

    const passedData = location.state?.cityData as City | undefined;
    const state = location.state?.state as Region | undefined;
    const country = location.state?.country as Country | undefined;

    const [formData, setFormData] = useState<Partial<City>>({
        cityId: 0,
        countryId: countryId ? parseInt(countryId) : 0,
        regionId: stateId ? parseInt(stateId) : 0,
        cityName: '',
        createdBy: 0,
        lastModifiedBy: 0
    });

    const [existingCities, setExistingCities] = useState<City[]>([]);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const loadCityData = async (id: number) => {
        try {
            setLoading(true);
            const response = await cityApi.getCityById(id);
            if (response.success && response.data) {
                setFormData(response.data);
            } else {
                showError('Failed to load city data');
            }
        } catch (error) {
            showError('Network error loading city');
        } finally {
            setLoading(false);
        }
    };

    const loadExistingCities = async () => {
        try {
            // Fetch all cities to check for duplicates
            // Assuming the API supports pagination, we fetch a large page to get all
            const response = await cityApi.getAllCitiesPage(0, 1000, 'asc');
            if (response.success && response.data) {
                const data = Array.isArray(response.data) ? response.data :
                    (response.data as any).data ? (response.data as any).data : [];
                setExistingCities(data);
            }
        } catch (error) {
            console.error('Error loading existing cities:', error);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        // Real-time duplicate check for City Name
        if (name === 'cityName') {
            const normalizedName = value.trim().toLowerCase();
            const isDuplicate = existingCities.some(c =>
                c.cityName.trim().toLowerCase() === normalizedName &&
                c.cityId !== formData.cityId &&
                c.regionId === formData.regionId // Check duplicates ONLY within the same region/state
            );

            if (isDuplicate) {
                setErrors(prev => ({ ...prev, cityName: 'City Name already exists in this State' }));
            } else {
                setErrors(prev => ({ ...prev, cityName: '' }));
            }
        } else {
            if (errors[name]) {
                setErrors(prev => ({ ...prev, [name]: '' }));
            }
        }
    };

    useEffect(() => {
        loadExistingCities();
        if (isEditMode && cityId) {
            if (passedData) {
                setFormData(passedData);
            } else {
                loadCityData(parseInt(cityId));
            }
        }
    }, [isEditMode, cityId, passedData]);

    const validate = () => {
        const newErrors: Record<string, string> = {};

        // City Name validation
        if (!formData.cityName?.trim()) {
            newErrors.cityName = 'City Name is required';
        } else if (formData.cityName.trim().length < 2) {
            newErrors.cityName = 'City Name must be at least 2 characters';
        } else if (formData.cityName.trim().length > 100) {
            newErrors.cityName = 'City Name must not exceed 100 characters';
        } else {
            const normalizedName = formData.cityName.trim().toLowerCase();
            const isDuplicate = existingCities.some(c =>
                c.cityName.trim().toLowerCase() === normalizedName &&
                c.cityId !== formData.cityId &&
                c.regionId === formData.regionId
            );
            if (isDuplicate) {
                newErrors.cityName = 'City Name already exists in this State';
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
                cityId: isEditMode && cityId ? parseInt(cityId) : 0,
                countryId: countryId ? parseInt(countryId) : formData.countryId,
                regionId: stateId ? parseInt(stateId) : formData.regionId,
                createdBy: isEditMode ? (formData.createdBy || userId) : userId,
                lastModifiedBy: userId
            };

            const response = await cityApi.addCity(payload);

            if (response.success) {
                showSuccess(`City ${isEditMode ? 'updated' : 'created'} successfully`);
                navigate(`/admin/countries/${countryId}/states/${stateId}/cities`, { state: { state, country } });
            } else {
                showError(response.message || 'Failed to save city');
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
                    <h1 className="admin-page-title">{isEditMode ? 'Edit City' : 'Add City'}</h1>
                    <p className="admin-page-subtitle">{state?.regionName || 'State'}, {country?.countryName || 'Country'}</p>
                </div>
                <div className="admin-page-actions">
                    <button
                        type="button"
                        onClick={() => navigate(`/admin/countries/${countryId}/states/${stateId}/cities`, { state: { state, country } })}
                        className="admin-btn admin-btn-secondary"
                    >
                        <i className="fa-solid fa-arrow-left"></i> Back to Cities
                    </button>
                </div>
            </div>

            <div className="admin-card">
                <div className="admin-card-header">
                    <h2>City Details</h2>
                </div>
                <div className="admin-card-body">
                    <form onSubmit={handleSubmit} className="admin-form">

                        {/* City Name */}
                        <div className="admin-form-grid" style={{ gridTemplateColumns: '1fr' }}>
                            <FormField
                                label="City Name"
                                name="cityName"
                                value={formData.cityName}
                                onChange={handleInputChange}
                                required
                                error={errors.cityName}
                                placeholder="Ex. Mumbai"
                            />
                        </div>

                        <div className="admin-form-actions">
                            <button type="submit" className="admin-btn admin-btn-primary" disabled={submitting}>
                                {submitting ? 'Saving...' : 'Save'}
                            </button>
                            <button
                                type="button"
                                onClick={() => navigate(`/admin/countries/${countryId}/states/${stateId}/cities`, { state: { state, country } })}
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
