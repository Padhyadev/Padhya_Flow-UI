import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { bniMemberApi, BNIMember, DropdownItem } from '../../services/api/bniMemberApi';
import FormField from '../../components/FormField';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import '../../styles/admin.css';
import '../../styles/admin-components.css';

export default function BNIMemberForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user: currentUser } = useAuth();
    const { showSuccess, showError } = useToast();
    const isEditMode = Boolean(id);

    const [formData, setFormData] = useState<{
        memberId: number;
        chapterId: number;
        memberName: string;
        companyName: string;
        category: string;
        mobile: string;
        email: string;
        website: string;
        countryId: number;
        regionId: number;
        cityId: number;
        linkedInProfile: string;
        other_Vertical: string;
        notes: string;
    }>({
        memberId: 0,
        chapterId: 0,
        memberName: '',
        companyName: '',
        category: '',
        mobile: '',
        email: '',
        website: '',
        countryId: 0,
        regionId: 0,
        cityId: 0,
        linkedInProfile: '',
        other_Vertical: '',
        notes: ''
    });

    // Dropdown states
    const [chapters, setChapters] = useState<DropdownItem[]>([]);
    const [countries, setCountries] = useState<DropdownItem[]>([]);
    const [regions, setRegions] = useState<DropdownItem[]>([]);
    const [cities, setCities] = useState<DropdownItem[]>([]);

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [checkingDuplicate, setCheckingDuplicate] = useState<Record<string, boolean>>({});

    // Load dropdowns on mount
    useEffect(() => {
        loadDropdowns();
        if (isEditMode && id) {
            loadMemberData(parseInt(id));
        }
    }, [isEditMode, id]);

    // Load regions when country changes (only fetches data, does not reset state)
    useEffect(() => {
        if (formData.countryId > 0) {
            loadRegions(formData.countryId);
        } else {
            setRegions([]);
        }
    }, [formData.countryId]);

    // Load cities when region changes (only fetches data, does not reset state)
    useEffect(() => {
        if (formData.regionId > 0) {
            loadCities(formData.regionId);
        } else {
            setCities([]);
        }
    }, [formData.regionId]);

    // Real-time duplicate check for member name
    useEffect(() => {
        const checkDuplicate = async () => {
            if (!formData.memberName?.trim()) {
                if (errors.memberName === 'A member with this name already exists') {
                    setErrors(prev => ({ ...prev, memberName: '' }));
                }
                return;
            }

            setCheckingDuplicate(prev => ({ ...prev, memberName: true }));
            const response = await bniMemberApi.getAllMembers(0, 1000);

            if (response.success && response.data) {
                const normalizedName = formData.memberName.trim().toLowerCase();
                const duplicate = response.data.find((member: BNIMember) => {
                    if (isEditMode && member.memberId === formData.memberId) return false;
                    return member.memberName?.trim().toLowerCase() === normalizedName;
                });

                if (duplicate) {
                    setErrors(prev => ({ ...prev, memberName: 'A member with this name already exists' }));
                } else if (errors.memberName === 'A member with this name already exists') {
                    setErrors(prev => ({ ...prev, memberName: '' }));
                }
            }
            setCheckingDuplicate(prev => ({ ...prev, memberName: false }));
        };

        const timeoutId = setTimeout(checkDuplicate, 500);
        return () => clearTimeout(timeoutId);
    }, [formData.memberName]);

    // Real-time duplicate check for company name
    useEffect(() => {
        const checkDuplicate = async () => {
            if (!formData.companyName?.trim()) {
                if (errors.companyName === 'A member with this company name already exists') {
                    setErrors(prev => ({ ...prev, companyName: '' }));
                }
                return;
            }

            setCheckingDuplicate(prev => ({ ...prev, companyName: true }));
            const response = await bniMemberApi.getAllMembers(0, 1000);

            if (response.success && response.data) {
                const normalizedName = formData.companyName.trim().toLowerCase();
                const duplicate = response.data.find((member: BNIMember) => {
                    if (isEditMode && member.memberId === formData.memberId) return false;
                    return member.companyName?.trim().toLowerCase() === normalizedName;
                });

                if (duplicate) {
                    setErrors(prev => ({ ...prev, companyName: 'A member with this company name already exists' }));
                } else if (errors.companyName === 'A member with this company name already exists') {
                    setErrors(prev => ({ ...prev, companyName: '' }));
                }
            }
            setCheckingDuplicate(prev => ({ ...prev, companyName: false }));
        };

        const timeoutId = setTimeout(checkDuplicate, 500);
        return () => clearTimeout(timeoutId);
    }, [formData.companyName]);

    // Real-time duplicate check for email
    useEffect(() => {
        const checkDuplicate = async () => {
            if (!formData.email?.trim()) {
                if (errors.email === 'A member with this email already exists') {
                    setErrors(prev => ({ ...prev, email: '' }));
                }
                return;
            }

            setCheckingDuplicate(prev => ({ ...prev, email: true }));
            const response = await bniMemberApi.getAllMembers(0, 1000);

            if (response.success && response.data) {
                const normalizedEmail = formData.email.trim().toLowerCase();
                const duplicate = response.data.find((member: BNIMember) => {
                    if (isEditMode && member.memberId === formData.memberId) return false;
                    return member.email?.trim().toLowerCase() === normalizedEmail;
                });

                if (duplicate) {
                    setErrors(prev => ({ ...prev, email: 'A member with this email already exists' }));
                } else if (errors.email === 'A member with this email already exists') {
                    setErrors(prev => ({ ...prev, email: '' }));
                }
            }
            setCheckingDuplicate(prev => ({ ...prev, email: false }));
        };

        const timeoutId = setTimeout(checkDuplicate, 500);
        return () => clearTimeout(timeoutId);
    }, [formData.email]);

    // Real-time duplicate check for mobile
    useEffect(() => {
        const checkDuplicate = async () => {
            if (!formData.mobile?.trim() || formData.mobile.length !== 10) {
                if (errors.mobile === 'A member with this mobile number already exists') {
                    setErrors(prev => ({ ...prev, mobile: '' }));
                }
                return;
            }

            setCheckingDuplicate(prev => ({ ...prev, mobile: true }));
            const response = await bniMemberApi.getAllMembers(0, 1000);

            if (response.success && response.data) {
                const duplicate = response.data.find((member: BNIMember) => {
                    if (isEditMode && member.memberId === formData.memberId) return false;
                    return member.mobile?.trim() === formData.mobile.trim();
                });

                if (duplicate) {
                    setErrors(prev => ({ ...prev, mobile: 'A member with this mobile number already exists' }));
                } else if (errors.mobile === 'A member with this mobile number already exists') {
                    setErrors(prev => ({ ...prev, mobile: '' }));
                }
            }
            setCheckingDuplicate(prev => ({ ...prev, mobile: false }));
        };

        const timeoutId = setTimeout(checkDuplicate, 500);
        return () => clearTimeout(timeoutId);
    }, [formData.mobile]);

    const loadDropdowns = async () => {
        try {
            console.log('🚀 Loading dropdowns for Member Form...');

            const [countriesRes, chaptersRes] = await Promise.all([
                bniMemberApi.getCountryDropdown(),
                bniMemberApi.getBNIChapterDropdown()
            ]);

            if (countriesRes.success) {
                setCountries(countriesRes.data);
            } else {
                console.error('❌ Countries failed:', countriesRes.message);
            }

            if (chaptersRes.success) {
                setChapters(chaptersRes.data);
            } else {
                console.error('❌ Chapters failed:', chaptersRes.message);
            }

        } catch (error) {
            console.error('❌ Error loading dropdowns:', error);
            showError('Failed to load form data');
        }
    };

    const loadRegions = async (countryId: number) => {
        try {
            const response = await bniMemberApi.getRegionDropdown(countryId);
            if (response.success) {
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
            const response = await bniMemberApi.getCityDropdown(regionId);
            if (response.success) {
                setCities(response.data);
            } else {
                console.error('❌ Cities failed:', response.message);
            }
        } catch (error) {
            console.error('❌ Error loading cities:', error);
        }
    };

    const loadMemberData = async (memberId: number) => {
        try {
            setLoading(true);
            const response = await bniMemberApi.getMemberById(memberId);

            if (response.success && response.data) {
                const member = response.data as any; // Cast to any to handle loose typing of API response
                console.log('📋 Raw Member Data:', member);
                console.log('📋 Raw Member Keys:', Object.keys(member));

                // Helper to get ID case-insensitively and handle nested objects
                const getVal = (keys: string[]) => {
                    for (const k of keys) {
                        if (member[k] !== undefined && member[k] !== null) {
                            const val = member[k];
                            // Check if it's an object with an ID
                            if (typeof val === 'object' && val.id) return val.id;
                            if (typeof val === 'object' && val.Id) return val.Id;
                            return val;
                        }
                    }
                    // Try case-insensitive search if direct match fails
                    const lowerKeys = keys.map(k => k.toLowerCase());
                    const memberKeys = Object.keys(member);
                    for (const mk of memberKeys) {
                        if (lowerKeys.includes(mk.toLowerCase())) {
                            const val = member[mk];
                            if (val !== undefined && val !== null) {
                                if (typeof val === 'object' && val.id) return val.id;
                                if (typeof val === 'object' && val.Id) return val.Id;
                                return val;
                            }
                        }
                    }
                    return '';
                };

                const getId = (keys: string[]) => {
                    const val = getVal(keys);
                    return val ? parseInt(val) : 0;
                };

                const newData = {
                    memberId: getId(['memberId', 'MemberId', 'id', 'Id']),
                    chapterId: getId(['chapterId', 'ChapterId', 'chapter_id']),
                    memberName: getVal(['memberName', 'MemberName', 'member_name']),
                    companyName: getVal(['companyName', 'CompanyName', 'company_name']),
                    category: getVal(['category', 'Category']),
                    mobile: getVal(['mobile', 'Mobile']),
                    email: getVal(['email', 'Email']),
                    website: getVal(['website', 'Website']),
                    countryId: getId(['countryId', 'CountryId', 'country_id']),
                    regionId: getId(['regionId', 'RegionId', 'stateId', 'StateId', 'region_id', 'state_id', 'Region', 'region', 'State', 'state']),
                    cityId: getId(['cityId', 'CityId', 'districtId', 'DistrictId', 'city_id', 'district_id', 'City', 'city', 'District', 'district']),
                    linkedInProfile: getVal(['linkedInProfile', 'LinkedInProfile']),
                    other_Vertical: getVal(['other_Vertical', 'Other_Vertical', 'otherVertical']),
                    notes: getVal(['notes', 'Notes'])
                };

                console.log('✅ Normalized Form Data:', newData);
                console.log('🔍 IDs extracted -> Country:', newData.countryId, 'Region:', newData.regionId, 'City:', newData.cityId);

                // Pre-fetch dependent dropdowns before setting state to avoid race conditions
                // or rendering the form with values but no options.
                let preloadedRegions: any[] = [];
                let preloadedCities: any[] = [];

                // Extract names for fallback matching
                const memberRegionName = getVal(['regionName', 'RegionName', 'stateName', 'StateName']);
                const memberCityName = getVal(['cityName', 'CityName', 'districtName', 'DistrictName']);

                if (newData.countryId > 0) {
                    try {
                        console.log('🌐 Pre-loading Regions for Country ID:', newData.countryId);
                        const rRes = await bniMemberApi.getRegionDropdown(newData.countryId);
                        if (rRes.success) {
                            preloadedRegions = rRes.data || [];
                            console.log('📦 Pre-loaded Regions Count:', preloadedRegions.length);

                            // FALLBACK: If Region ID is 0 but we have a Name, try to find ID by Name
                            if ((!newData.regionId || newData.regionId === 0) && memberRegionName) {
                                console.log('⚠️ Region ID is missing. Attempting to match by Name:', memberRegionName);
                                const matchedRegion = preloadedRegions.find(r =>
                                    r.name?.toLowerCase() === String(memberRegionName).toLowerCase()
                                );
                                if (matchedRegion) {
                                    console.log('✅ Found Region by Name! ID:', matchedRegion.id);
                                    newData.regionId = matchedRegion.id || matchedRegion.Id; // Update ID
                                }
                            }

                            if (preloadedRegions.length > 0) {
                                console.log('🔍 First Region:', preloadedRegions[0]);
                                console.log('🔍 Matching Region found?', preloadedRegions.some(r => r.id == newData.regionId || r.RegionId == newData.regionId));
                            }
                        }
                    } catch (e) { console.error('Error pre-loading regions', e); }
                }

                if (newData.regionId > 0) {
                    try {
                        console.log('🌐 Pre-loading Cities for Region ID:', newData.regionId);
                        const cRes = await bniMemberApi.getCityDropdown(newData.regionId);
                        if (cRes.success) {
                            preloadedCities = cRes.data || [];
                            console.log('📦 Pre-loaded Cities Count:', preloadedCities.length);

                            // FALLBACK: If City ID is 0 (or mismatch) but we have a Name
                            if ((!newData.cityId || newData.cityId === 0) && memberCityName) {
                                console.log('⚠️ City ID is missing. Attempting to match by Name:', memberCityName);
                                const matchedCity = preloadedCities.find(c =>
                                    c.name?.toLowerCase() === String(memberCityName).toLowerCase()
                                );
                                if (matchedCity) {
                                    console.log('✅ Found City by Name! ID:', matchedCity.id);
                                    newData.cityId = matchedCity.id || matchedCity.Id;
                                }
                            }

                            if (preloadedCities.length > 0) {
                                console.log('🔍 First City:', preloadedCities[0]);
                            }
                        }
                    } catch (e) { console.error('Error pre-loading cities', e); }
                }

                // Batch updates
                if (preloadedRegions.length > 0) {
                    console.log('💾 Setting Regions State with', preloadedRegions.length, 'items');
                    setRegions(preloadedRegions);
                }
                if (preloadedCities.length > 0) {
                    console.log('💾 Setting Cities State with', preloadedCities.length, 'items');
                    setCities(preloadedCities);
                }

                console.log('💾 Setting Final Form Data');
                setFormData(newData);
            } else {
                setErrors({ general: response.message || 'Failed to load member data' });
            }
        } catch (error) {
            console.error('Error loading member:', error);
            setErrors({ general: 'Network error occurred while loading member data' });
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;

        let processedValue: any = value;

        if (name === 'mobile') {
            // Remove non-digit characters
            processedValue = value.replace(/\D/g, '');
            // Limit to 10 digits
            if (processedValue.length > 10) {
                processedValue = processedValue.slice(0, 10);
            }
        }

        // Parse numbers for ID fields
        if (['chapterId', 'countryId', 'regionId', 'cityId'].includes(name)) {
            processedValue = parseInt(value) || 0;
        }

        setFormData(prev => {
            const newData = { ...prev, [name]: processedValue };

            // Explicitly handle cascading resets on user input
            if (name === 'countryId') {
                newData.regionId = 0;
                newData.cityId = 0;
                // Clear options immediately to give visual feedback
                setRegions([]);
                setCities([]);
            }
            if (name === 'regionId') {
                newData.cityId = 0;
                setCities([]);
            }

            return newData;
        });

        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.memberName?.trim()) {
            newErrors.memberName = 'Member name is required';
        }

        if (!formData.chapterId || formData.chapterId === 0) {
            newErrors.chapterId = 'Chapter is required';
        }

        if (!formData.companyName?.trim()) {
            newErrors.companyName = 'Company name is required';
        }

        if (!formData.category?.trim()) {
            newErrors.category = 'Category is required';
        }

        if (!formData.mobile?.trim()) {
            newErrors.mobile = 'Mobile is required';
        } else if (formData.mobile.length !== 10) {
            newErrors.mobile = 'Mobile must be 10 digits';
        }

        // Email Validation
        if (formData.email?.trim()) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(formData.email.trim())) {
                newErrors.email = 'Invalid email format';
            }
        }

        if (!formData.countryId || formData.countryId === 0) {
            newErrors.countryId = 'Country is required';
        }

        // Mandatory Region/State
        if (!formData.regionId || formData.regionId === 0) {
            newErrors.regionId = 'Region/State is required';
        }

        // Mandatory City
        if (!formData.cityId || formData.cityId === 0) {
            newErrors.cityId = 'City is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const checkDuplicateMember = async (): Promise<{ isDuplicate: boolean; field: string; message: string }> => {
        try {
            // Fetch all members to check for duplicates
            const response = await bniMemberApi.getAllMembers(0, 1000);

            if (response.success && response.data) {
                for (const member of response.data) {
                    // Skip the current member when editing
                    if (isEditMode && member.memberId === formData.memberId) {
                        continue;
                    }

                    // Check for duplicate member name
                    if (formData.memberName?.trim() &&
                        member.memberName?.trim().toLowerCase() === formData.memberName.trim().toLowerCase()) {
                        return {
                            isDuplicate: true,
                            field: 'memberName',
                            message: 'A member with this name already exists'
                        };
                    }

                    // Check for duplicate company name
                    if (formData.companyName?.trim() &&
                        member.companyName?.trim().toLowerCase() === formData.companyName.trim().toLowerCase()) {
                        return {
                            isDuplicate: true,
                            field: 'companyName',
                            message: 'A member with this company name already exists'
                        };
                    }

                    // Check for duplicate email (if provided)
                    if (formData.email?.trim() &&
                        member.email?.trim().toLowerCase() === formData.email.trim().toLowerCase()) {
                        return {
                            isDuplicate: true,
                            field: 'email',
                            message: 'A member with this email already exists'
                        };
                    }

                    // Check for duplicate mobile
                    if (formData.mobile?.trim() &&
                        member.mobile?.trim() === formData.mobile.trim()) {
                        return {
                            isDuplicate: true,
                            field: 'mobile',
                            message: 'A member with this mobile number already exists'
                        };
                    }
                }
            }

            return { isDuplicate: false, field: '', message: '' };
        } catch (error) {
            console.error('Error checking duplicate member:', error);
            return { isDuplicate: false, field: '', message: '' };
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validate()) {
            return;
        }

        // Check for duplicate member data
        const duplicateCheck = await checkDuplicateMember();
        if (duplicateCheck.isDuplicate) {
            setErrors({ [duplicateCheck.field]: duplicateCheck.message });
            return;
        }

        try {
            setSubmitting(true);
            setErrors({});

            const payload = {
                ...formData,
                // Add any audit fields if necessary, though API might handle it or use token user
            };

            const response = await bniMemberApi.addMember(payload);

            if (response.success) {
                showSuccess(`BNI Member ${isEditMode ? 'updated' : 'created'} successfully`);
                navigate('/admin/bni-members');
            } else {
                setErrors({ general: response.message || `Failed to ${isEditMode ? 'update' : 'create'} BNI member` });
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
                    <p style={{ marginTop: '16px', color: 'var(--admin-gray-600)' }}>Loading member data...</p>
                </div>
            </div>
        );
    }

    // Convert dropdowns to options with robust mapping
    // We check generic keys (id, value, code) and specific keys (regionId, cityId, etc)
    // to ensure we capture the identifier regardless of the API response format.
    // Convert dropdowns to options with robust mapping
    // We check generic keys (id, value, code) and specific keys (regionId, cityId, etc)
    // to ensure we capture the identifier regardless of the API response format.
    const mapOptions = (items: any[], label: string) => {
        if (items.length > 0) {
            console.log(`🗺️ Mapping ${label} options. Sample item:`, items[0]);
        }
        return items.map(i => {
            const value = i.id || i.Id || i.value || i.Value || i.code || i.Code ||
                i.chapterId || i.ChapterId ||
                i.countryId || i.CountryId ||
                i.regionId || i.RegionId ||
                i.cityId || i.CityId ||
                i.stateId || i.StateId || i.districtId || i.DistrictId || '';

            const labelText = i.name || i.Name || i.text || i.Text || i.label || i.Label ||
                i.memberName || i.MemberName ||
                i.companyName || i.CompanyName ||
                i.stateName || i.StateName || i.districtName || i.DistrictName || '';

            return {
                value: String(value),
                label: String(labelText)
            };
        });
    };

    const chapterOptions = mapOptions(chapters, 'Chapters');
    const countryOptions = mapOptions(countries, 'Countries');
    const regionOptions = mapOptions(regions, 'Regions');
    const cityOptions = mapOptions(cities, 'Cities');

    return (
        <div className="admin-page">
            <div className="admin-page-header">
                <div>
                    <h1 className="admin-page-title">
                        {isEditMode ? 'Edit BNI Member' : 'Add New BNI Member'}
                    </h1>
                    <p className="admin-page-subtitle">
                        {isEditMode ? 'Update BNI member information' : 'Create a New BNI Member'}
                    </p>
                </div>
                <div className="admin-page-actions">
                    <button
                        type="button"
                        onClick={() => navigate('/admin/bni-members')}
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
                    <h2>BNI Member Information</h2>
                </div>
                <div className="admin-card-body">
                    <form onSubmit={handleSubmit} className="admin-form" noValidate>
                        {/* Member Name and Chapter */}
                        <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
                            <div style={{ flex: 1 }}>
                                <FormField
                                    label="Member Name"
                                    name="memberName"
                                    type="text"
                                    value={formData.memberName}
                                    onChange={handleInputChange}
                                    error={errors.memberName}
                                    placeholder="Enter Member Name"
                                    required={true}
                                />
                            </div>
                            <div style={{ flex: 1 }}>
                                <FormField
                                    label="Chapter"
                                    name="chapterId"
                                    type="select"
                                    value={formData.chapterId}
                                    onChange={handleInputChange}
                                    error={errors.chapterId}
                                    options={chapterOptions}
                                    required={true}
                                />
                            </div>
                        </div>

                        {/* Company Name and Category */}
                        <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
                            <div style={{ flex: 1 }}>
                                <FormField
                                    label="Company Name"
                                    name="companyName"
                                    type="text"
                                    value={formData.companyName}
                                    onChange={handleInputChange}
                                    error={errors.companyName}
                                    placeholder="Enter Company Name"
                                    required={true}
                                />
                            </div>
                            <div style={{ flex: 1 }}>
                                <FormField
                                    label="Category"
                                    name="category"
                                    type="text"
                                    value={formData.category}
                                    onChange={handleInputChange}
                                    error={errors.category}
                                    placeholder="Enter Category"
                                    required={true}
                                />
                            </div>
                        </div>

                        {/* Contact Info: Mobile and Email */}
                        <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
                            <div style={{ flex: 1 }}>
                                <FormField
                                    label="Mobile"
                                    name="mobile"
                                    type="text"
                                    value={formData.mobile}
                                    onChange={handleInputChange}
                                    error={errors.mobile}
                                    placeholder="Enter Mobile Number"
                                    required={true}
                                />
                            </div>
                            <div style={{ flex: 1 }}>
                                <FormField
                                    label="Email"
                                    name="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    error={errors.email}
                                    placeholder="Enter Email Address"
                                />
                            </div>
                        </div>

                        {/* Website and LinkedIn */}
                        <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
                            <div style={{ flex: 1 }}>
                                <FormField
                                    label="Website"
                                    name="website"
                                    type="text"
                                    value={formData.website}
                                    onChange={handleInputChange}
                                    placeholder="https://example.com"
                                />
                            </div>
                            <div style={{ flex: 1 }}>
                                <FormField
                                    label="LinkedIn Profile"
                                    name="linkedInProfile"
                                    type="text"
                                    value={formData.linkedInProfile}
                                    onChange={handleInputChange}
                                    placeholder="Enter LinkedIn Profile URL"
                                />
                            </div>
                        </div>

                        {/* Location: Country and Region */}
                        <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
                            <div style={{ flex: 1 }}>
                                <FormField
                                    label="Country"
                                    name="countryId"
                                    type="select"
                                    value={String(formData.countryId)}
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
                                    value={String(formData.regionId)}
                                    onChange={handleInputChange}
                                    error={errors.regionId}
                                    options={regionOptions}
                                    required={true}
                                />
                            </div>
                        </div>

                        {/* Location: City and Other Vertical */}
                        <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
                            <div style={{ flex: 1 }}>
                                <FormField
                                    label="City"
                                    name="cityId"
                                    type="select"
                                    value={String(formData.cityId)}
                                    onChange={handleInputChange}
                                    error={errors.cityId}
                                    options={cityOptions}
                                    required={true}
                                />
                            </div>
                            <div style={{ flex: 1 }}>
                                <FormField
                                    label="Other Vertical"
                                    name="other_Vertical"
                                    type="text"
                                    value={formData.other_Vertical}
                                    onChange={handleInputChange}
                                    placeholder="Enter Other Vertical"
                                />
                            </div>
                        </div>

                        {/* Notes */}
                        <div style={{ marginBottom: '20px' }}>
                            <FormField
                                label="Notes"
                                name="notes"
                                type="textarea"
                                value={formData.notes}
                                onChange={handleInputChange}
                                placeholder="Enter Any Notes..."
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
                                onClick={() => navigate('/admin/bni-members')}
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
