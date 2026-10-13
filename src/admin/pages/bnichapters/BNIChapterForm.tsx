import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BNIChapter, bniChapterApi, DropdownItem, LovDropdownItem } from '../../services/api/bniChapterApi';
import FormField from '../../components/FormField';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import '../../styles/admin.css';
import '../../styles/admin-components.css';

export default function BNIChapterForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user: currentUser } = useAuth();
    const { showSuccess, showError } = useToast();
    const isEditMode = Boolean(id);

    const [formData, setFormData] = useState<{
        chapterId: number;
        countryId: number;
        regionId: number;
        cityId: number;
        chapterName: string;
        meetingDay: string;
        meetingTime: string;
        meetingTimeZone: string;
        language: string;
        chapterType: string;
    }>({
        chapterId: 0,
        countryId: 0,
        regionId: 0,
        cityId: 0,
        chapterName: '',
        meetingDay: '',
        meetingTime: '',
        meetingTimeZone: '',
        language: '',
        chapterType: ''
    });

    // Dropdown states
    const [countries, setCountries] = useState<DropdownItem[]>([]);
    const [regions, setRegions] = useState<DropdownItem[]>([]);
    const [cities, setCities] = useState<DropdownItem[]>([]);
    const [meetingDays, setMeetingDays] = useState<LovDropdownItem[]>([]);
    const [timeZones, setTimeZones] = useState<LovDropdownItem[]>([]);
    const [languages, setLanguages] = useState<LovDropdownItem[]>([]);
    const [chapterTypes, setChapterTypes] = useState<LovDropdownItem[]>([]);

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [checkingDuplicate, setCheckingDuplicate] = useState(false);

    // State for Time Picker Modal
    const [activeTimeField, setActiveTimeField] = useState<'meetingTime' | null>(null);
    const [tempTime, setTempTime] = useState({ hour: '12', minute: '00', period: 'AM' });

    // Load dropdowns on mount
    useEffect(() => {
        loadDropdowns();
        if (isEditMode && id) {
            loadChapterData(parseInt(id));
        }
    }, [isEditMode, id]);

    // Load regions when country changes
    useEffect(() => {
        if (formData.countryId > 0) {
            loadRegions(formData.countryId);
        } else {
            setRegions([]);
            setFormData(prev => ({ ...prev, regionId: 0, cityId: 0 }));
        }
    }, [formData.countryId]);

    // Load cities when region changes
    useEffect(() => {
        if (formData.regionId > 0) {
            loadCities(formData.regionId);
        } else {
            setCities([]);
            setFormData(prev => ({ ...prev, cityId: 0 }));
        }
    }, [formData.regionId]);

    // Real-time duplicate check for chapter name
    useEffect(() => {
        const checkDuplicate = async () => {
            if (!formData.chapterName?.trim()) {
                // Clear error if field is empty
                if (errors.chapterName === 'A chapter with this name already exists') {
                    setErrors(prev => ({ ...prev, chapterName: '' }));
                }
                return;
            }

            setCheckingDuplicate(true);
            const isDuplicate = await checkDuplicateChapterName(formData.chapterName);
            setCheckingDuplicate(false);

            if (isDuplicate) {
                setErrors(prev => ({ ...prev, chapterName: 'A chapter with this name already exists' }));
            } else {
                // Clear the duplicate error if it was set
                if (errors.chapterName === 'A chapter with this name already exists') {
                    setErrors(prev => ({ ...prev, chapterName: '' }));
                }
            }
        };

        // Debounce the check - wait 500ms after user stops typing
        const timeoutId = setTimeout(checkDuplicate, 500);
        return () => clearTimeout(timeoutId);
    }, [formData.chapterName]);

    const loadDropdowns = async () => {
        try {
            console.log('🚀 Loading all dropdowns...');

            // Load all dropdown data in parallel
            const [countriesRes, meetingDaysRes, timeZonesRes, languagesRes, chapterTypesRes] = await Promise.all([
                bniChapterApi.getCountryDropdown(),
                bniChapterApi.getLovDropdown('meetingDay'),
                bniChapterApi.getLovDropdown('TimeZone'),
                bniChapterApi.getLovDropdown('language'),
                bniChapterApi.getLovDropdown('ChapterType')
            ]);

            console.log('📋 Countries Response:', countriesRes);
            console.log('📋 Meeting Days Response:', meetingDaysRes);
            console.log('📋 Time Zones Response:', timeZonesRes);
            console.log('📋 Languages Response:', languagesRes);
            console.log('📋 Chapter Types Response:', chapterTypesRes);

            if (countriesRes.success) {
                console.log('✅ Countries loaded:', countriesRes.data.length, 'items');
                setCountries(countriesRes.data);
            } else {
                console.error('❌ Countries failed:', countriesRes.message);
            }

            if (meetingDaysRes.success) {
                console.log('✅ Meeting Days loaded:', meetingDaysRes.data.length, 'items', meetingDaysRes.data);
                setMeetingDays(meetingDaysRes.data);
            } else {
                console.error('❌ Meeting Days failed:', meetingDaysRes.message);
            }

            if (timeZonesRes.success) {
                console.log('✅ Time Zones loaded:', timeZonesRes.data.length, 'items', timeZonesRes.data);
                setTimeZones(timeZonesRes.data);
            } else {
                console.error('❌ Time Zones failed:', timeZonesRes.message);
            }

            if (languagesRes.success) {
                console.log('✅ Languages loaded:', languagesRes.data.length, 'items', languagesRes.data);
                setLanguages(languagesRes.data);
            } else {
                console.error('❌ Languages failed:', languagesRes.message);
            }

            if (chapterTypesRes.success) {
                console.log('✅ Chapter Types loaded:', chapterTypesRes.data.length, 'items', chapterTypesRes.data);
                setChapterTypes(chapterTypesRes.data);
            } else {
                console.error('❌ Chapter Types failed:', chapterTypesRes.message);
            }
        } catch (error) {
            console.error('❌ Error loading dropdowns:', error);
            showError('Failed to load form data');
        }
    };

    const loadRegions = async (countryId: number) => {
        try {
            console.log('🚀 Loading regions for country:', countryId);
            const response = await bniChapterApi.getRegionDropdown(countryId);
            console.log('📋 Regions Response:', response);
            if (response.success) {
                console.log('✅ Regions loaded:', response.data.length, 'items', response.data);
                setRegions(response.data);
            } else {
                console.error('❌ Regions failed:', response.message);
            }
        } catch (error) {
            console.error('❌ Error loading regions:', error);
        }
    };

    const loadCities = async (regionId: number) => {
        try {
            console.log('🚀 Loading cities for region:', regionId);
            const response = await bniChapterApi.getCityDropdown(regionId);
            console.log('📋 Cities Response:', response);
            if (response.success) {
                console.log('✅ Cities loaded:', response.data.length, 'items', response.data);
                setCities(response.data);
            } else {
                console.error('❌ Cities failed:', response.message);
            }
        } catch (error) {
            console.error('❌ Error loading cities:', error);
        }
    };

    const loadChapterData = async (chapterId: number) => {
        try {
            setLoading(true);
            const response = await bniChapterApi.getChapterById(chapterId);

            if (response.success && response.data) {
                const chapter = response.data;
                setFormData({
                    chapterId: chapter.chapterId || 0,
                    countryId: chapter.countryId || 0,
                    regionId: chapter.regionId || 0,
                    cityId: chapter.cityId || 0,
                    chapterName: chapter.chapterName || '',
                    meetingDay: chapter.meetingDay || '',
                    meetingTime: chapter.meetingTime || '',
                    meetingTimeZone: chapter.meetingTimeZone || '',
                    language: chapter.language || '',
                    chapterType: chapter.chapterType || ''
                });

                // Load dependent dropdowns
                if (chapter.countryId) {
                    await loadRegions(chapter.countryId);
                }
                if (chapter.regionId) {
                    await loadCities(chapter.regionId);
                }
            } else {
                setErrors({ general: response.message || 'Failed to load chapter data' });
            }
        } catch (error) {
            console.error('Error loading chapter:', error);
            setErrors({ general: 'Network error occurred while loading chapter data' });
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;

        setFormData(prev => ({
            ...prev,
            [name]: ['countryId', 'regionId', 'cityId'].includes(name) ? parseInt(value) || 0 : value
        }));

        // Clear error when field is edited
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.chapterName?.trim()) {
            newErrors.chapterName = 'Chapter name is required';
        }

        if (!formData.countryId || formData.countryId === 0) {
            newErrors.countryId = 'Country is required';
        }

        if (!formData.regionId || formData.regionId === 0) {
            newErrors.regionId = 'Region is required';
        }

        if (!formData.cityId || formData.cityId === 0) {
            newErrors.cityId = 'City is required';
        }

        if (!formData.meetingDay?.trim()) {
            newErrors.meetingDay = 'Meeting day is required';
        }

        if (!formData.meetingTime?.trim()) {
            newErrors.meetingTime = 'Meeting time is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const checkDuplicateChapterName = async (chapterName: string): Promise<boolean> => {
        try {
            // Fetch all chapters to check for duplicates
            const response = await bniChapterApi.getAllChapters(0, 1000);

            if (response.success && response.data) {
                const normalizedName = chapterName.trim().toLowerCase();
                const duplicate = response.data.find((chapter: BNIChapter) => {
                    // Skip the current chapter when editing
                    if (isEditMode && chapter.chapterId === formData.chapterId) {
                        return false;
                    }
                    return chapter.chapterName?.trim().toLowerCase() === normalizedName;
                });

                return !!duplicate;
            }
            return false;
        } catch (error) {
            console.error('Error checking duplicate chapter name:', error);
            return false;
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validate()) {
            return;
        }

        // Check for duplicate chapter name
        const isDuplicate = await checkDuplicateChapterName(formData.chapterName);
        if (isDuplicate) {
            setErrors({ chapterName: 'A chapter with this name already exists' });
            return;
        }

        try {
            setSubmitting(true);
            setErrors({});

            const payload = {
                ...formData,
                createdBy: currentUser?.id ? parseInt(currentUser.id) : 0,
                lastModifiedBy: currentUser?.id ? parseInt(currentUser.id) : 0,
            };

            let response;
            if (isEditMode) {
                response = await bniChapterApi.updateChapter(payload);
            } else {
                response = await bniChapterApi.addChapter(payload);
            }

            if (response.success) {
                showSuccess(`BNI Chapter ${isEditMode ? 'updated' : 'created'} successfully`);
                navigate('/admin/bni-chapters');
            } else {
                setErrors({ general: response.message || `Failed to ${isEditMode ? 'update' : 'create'} BNI chapter` });
            }
        } catch (error) {
            console.error('Submit error:', error);
            setErrors({ general: 'Network error occurred. Please try again.' });
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="admin-page">
                <div style={{ padding: '40px', textAlign: 'center' }}>
                    <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '24px', color: 'var(--admin-primary)' }}></i>
                    <p style={{ marginTop: '16px', color: 'var(--admin-gray-600)' }}>Loading chapter data...</p>
                </div>
            </div>
        );
    }

    // Convert dropdowns to options format - ensure values are strings for select comparison
    const countryOptions = countries.map(c => ({ value: String(c.id), label: c.name }));
    const regionOptions = regions.map(r => ({ value: String(r.id), label: r.name }));
    const cityOptions = cities.map(c => ({ value: String(c.id), label: c.name }));
    const meetingDayOptions = meetingDays.map(m => ({ value: m.lovCode ?? m.lovValue, label: m.lovValue }));
    const timeZoneOptions = timeZones.map(t => ({ value: t.lovCode ?? t.lovValue, label: t.lovValue }));
    const languageOptions = languages.map(l => ({ value: l.lovCode ?? l.lovValue, label: l.lovValue }));
    const chapterTypeOptions = chapterTypes.map(c => ({ value: c.lovCode ?? c.lovValue, label: c.lovValue }));

    // Debug: Log all options
    console.log('🎯 Dropdown Options Debug:');
    console.log('  - Countries:', countryOptions.length, 'options', countryOptions);
    console.log('  - Regions:', regionOptions.length, 'options', regionOptions);
    console.log('  - Cities:', cityOptions.length, 'options', cityOptions);
    console.log('  - Meeting Days:', meetingDayOptions.length, 'options', meetingDayOptions);
    console.log('  - Time Zones:', timeZoneOptions.length, 'options', timeZoneOptions);
    console.log('  - Languages:', languageOptions.length, 'options', languageOptions);
    console.log('  - Chapter Types:', chapterTypeOptions.length, 'options', chapterTypeOptions);

    // --- TIME PICKER MODAL LOGIC COMMAND START ---

    // Open Picker
    const openTimePicker = (field: 'meetingTime', currentValue24h: string) => {
        setActiveTimeField(field);
        if (currentValue24h) {
            // Check if format is already 12h (e.g. 07:00 AM) or 24h
            if (currentValue24h.includes('M')) {
                // Parse 12h format "07:00 AM"
                const [time, period] = currentValue24h.split(' ');
                const [h, m] = time.split(':');
                setTempTime({ hour: h, minute: m, period: period });
            } else {
                // Parse 24h format
                const [h, m] = currentValue24h.split(':').map(Number);
                const period = h >= 12 ? 'PM' : 'AM';
                const hour = (h % 12 || 12).toString().padStart(2, '0');
                const minute = m.toString().padStart(2, '0');
                setTempTime({ hour, minute, period });
            }
        } else {
            setTempTime({ hour: '12', minute: '00', period: 'AM' });
        }
    };

    // Close Picker
    const closeTimePicker = () => {
        setActiveTimeField(null);
    };

    // Save Time
    const handleTimeSave = () => {
        if (!activeTimeField) return;

        const timeStr = `${tempTime.hour}:${tempTime.minute} ${tempTime.period}`;

        handleInputChange({
            target: {
                name: activeTimeField,
                value: timeStr
            }
        } as any);

        closeTimePicker();
    };

    // Render Trigger Input
    const renderTimePickerTrigger = (field: 'meetingTime', value: string) => {
        return (
            <div
                className={`admin-form-control ${errors[field] ? 'admin-form-control-error' : ''}`}
                style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                onClick={() => openTimePicker(field, value)}
            >
                <span>{value || '-- : -- --'}</span>
                <i className="fa-regular fa-clock" style={{ color: 'var(--admin-gray-500)' }}></i>
            </div>
        );
    };

    // Generate Arrays
    const hoursArr = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'));
    const minutesArr = Array.from({ length: 12 }, (_, i) => (i * 5).toString().padStart(2, '0'));
    // --- TIME PICKER MODAL LOGIC COMMAND END ---

    return (
        <div className="admin-page">
            {/* Custom Styles for Time Picker Modal */}
            <style>{`
                .tp-overlay {
                    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
                    background: rgba(0,0,0,0.5); z-index: 1000;
                    display: flex; align-items: center; justify-content: center;
                }
                .tp-modal {
                    background: white; padding: 20px; borderRadius: 12px; width: 320px;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.2);
                }
                .tp-columns { display: flex; justify-content: center; gap: 20px; margin: 20px 0; }
                .tp-column { height: 150px; overflow-y: auto; text-align: center; width: 60px; scrollbar-width: none; }
                .tp-column::-webkit-scrollbar { display: none; }
                .tp-item { 
                    padding: 8px 0; cursor: pointer; color: #aaa; font-size: 18px; 
                    transition: all 0.2s;
                }
                .tp-item:hover { color: #666; }
                .tp-item.active { 
                    color: var(--admin-primary); font-size: 24px; font-weight: bold; 
                    border-top: 1px solid #eee; border-bottom: 1px solid #eee;
                    background: #f8f9fa;
                }
                .tp-actions { display: flex; justify-content: flex-end; gap: 15px; margin-top: 10px; }
                .tp-btn { border: none; background: none; color: var(--admin-primary); font-weight: 600; cursor: pointer; padding: 5px 10px; }
                .tp-btn:hover { background: #f0f0f0; border-radius: 4px; }
                .tp-header { display: flex; justify-content: center; gap: 5px; font-size: 32px; font-weight: bold; color: var(--admin-gray-800); }
                .tp-ampm-switch { display: flex; flex-direction: column; gap: 5px; justify-content: center; }
                .tp-ampm-item { font-size: 16px; color: #aaa; cursor: pointer; padding: 2px 5px; }
                .tp-ampm-item.active { color: var(--admin-primary); font-weight: bold; background: #e0e7ff; border-radius: 4px; }
            `}</style>

            {/* Time Picker Modal */}
            {activeTimeField && (
                <div className="tp-overlay" onClick={closeTimePicker}>
                    <div className="tp-modal" onClick={e => e.stopPropagation()}>
                        <div className="tp-header">
                            <span>{tempTime.hour}:{tempTime.minute}</span>
                            <span style={{ fontSize: '18px', alignSelf: 'center', marginLeft: '5px' }}>{tempTime.period}</span>
                        </div>

                        <div className="tp-columns">
                            {/* Hours */}
                            <div className="tp-column">
                                {hoursArr.map(h => (
                                    <div
                                        key={h}
                                        className={`tp-item ${tempTime.hour === h ? 'active' : ''}`}
                                        onClick={() => setTempTime(prev => ({ ...prev, hour: h }))}
                                    >
                                        {h}
                                    </div>
                                ))}
                            </div>

                            {/* Minutes */}
                            <div className="tp-column">
                                {minutesArr.map(m => (
                                    <div
                                        key={m}
                                        className={`tp-item ${tempTime.minute === m ? 'active' : ''}`}
                                        onClick={() => setTempTime(prev => ({ ...prev, minute: m }))}
                                    >
                                        {m}
                                    </div>
                                ))}
                            </div>

                            {/* AM/PM */}
                            <div className="tp-ampm-switch">
                                <div
                                    className={`tp-ampm-item ${tempTime.period === 'AM' ? 'active' : ''}`}
                                    onClick={() => setTempTime(prev => ({ ...prev, period: 'AM' }))}
                                >
                                    AM
                                </div>
                                <div
                                    className={`tp-ampm-item ${tempTime.period === 'PM' ? 'active' : ''}`}
                                    onClick={() => setTempTime(prev => ({ ...prev, period: 'PM' }))}
                                >
                                    PM
                                </div>
                            </div>
                        </div>

                        <div className="tp-actions">
                            <button type="button" className="tp-btn" onClick={closeTimePicker}>CANCEL</button>
                            <button type="button" className="tp-btn" onClick={handleTimeSave}>OK</button>
                        </div>
                    </div>
                </div>
            )}

            <div className="admin-page-header">
                <div>
                    <h1 className="admin-page-title">
                        {isEditMode ? 'Edit BNI Chapter' : 'Add New BNI Chapter'}
                    </h1>
                    <p className="admin-page-subtitle">
                        {isEditMode ? 'Update BNI Chapter Iformation' : 'Create a New BNI Chapter'}
                    </p>
                </div>
                <div className="admin-page-actions">
                    <button
                        type="button"
                        onClick={() => navigate('/admin/bni-chapters')}
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
                    <h2>BNI Chapter Information</h2>
                </div>
                <div className="admin-card-body">
                    <form onSubmit={handleSubmit} className="admin-form" noValidate>
                        {/* Row 1: Chapter Name and Chapter Type */}
                        <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
                            <div style={{ flex: 1 }}>
                                <FormField
                                    label="Chapter Name"
                                    name="chapterName"
                                    type="text"
                                    value={formData.chapterName}
                                    onChange={handleInputChange}
                                    error={errors.chapterName}
                                    placeholder="Enter Chapter Name"
                                    required={true}
                                />
                            </div>
                            <div style={{ flex: 1 }}>
                                <FormField
                                    label="Chapter Type"
                                    name="chapterType"
                                    type="select"
                                    value={formData.chapterType}
                                    onChange={handleInputChange}
                                    error={errors.chapterType}
                                    options={chapterTypeOptions}
                                />
                            </div>
                        </div>

                        {/* Row 2: Country and Region */}
                        <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
                            <div style={{ flex: 1 }}>
                                <FormField
                                    label="Country"
                                    name="countryId"
                                    type="select"
                                    value={formData.countryId}
                                    onChange={handleInputChange}
                                    error={errors.countryId}
                                    options={countryOptions}
                                    required={true}
                                />
                            </div>
                            <div style={{ flex: 1 }}>
                                <FormField
                                    label="Region/State"
                                    name="regionId"
                                    type="select"
                                    value={formData.regionId}
                                    onChange={handleInputChange}
                                    error={errors.regionId}
                                    options={regionOptions}
                                    required={true}
                                />
                            </div>
                        </div>

                        {/* Row 3: City and Language */}
                        <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
                            <div style={{ flex: 1 }}>
                                <FormField
                                    label="City"
                                    name="cityId"
                                    type="select"
                                    value={formData.cityId}
                                    onChange={handleInputChange}
                                    error={errors.cityId}
                                    options={cityOptions}
                                    required={true}
                                />
                            </div>
                            <div style={{ flex: 1 }}>
                                <FormField
                                    label="Language"
                                    name="language"
                                    type="select"
                                    value={formData.language}
                                    onChange={handleInputChange}
                                    error={errors.language}
                                    options={languageOptions}
                                />
                            </div>
                        </div>

                        {/* Row 4: Meeting Day and Meeting Time */}
                        <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
                            <div style={{ flex: 1 }}>
                                <FormField
                                    label="Meeting Day"
                                    name="meetingDay"
                                    type="select"
                                    value={formData.meetingDay}
                                    onChange={handleInputChange}
                                    error={errors.meetingDay}
                                    options={meetingDayOptions}
                                    required={true}
                                />
                            </div>
                            <div style={{ flex: 1 }}>
                                <label className="admin-form-label">
                                    Meeting Time <span className="admin-form-required">*</span>
                                </label>
                                {renderTimePickerTrigger('meetingTime', formData.meetingTime)}
                                {errors.meetingTime && <span className="admin-form-error">{errors.meetingTime}</span>}
                            </div>
                        </div>

                        {/* Row 5: Meeting Time Zone */}
                        <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
                            <div style={{ flex: 1 }}>
                                <FormField
                                    label="Meeting Time Zone"
                                    name="meetingTimeZone"
                                    type="select"
                                    value={formData.meetingTimeZone}
                                    onChange={handleInputChange}
                                    error={errors.meetingTimeZone}
                                    options={timeZoneOptions}
                                />
                            </div>
                            <div style={{ flex: 1 }}></div>
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
                                onClick={() => navigate('/admin/bni-chapters')}
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
