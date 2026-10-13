import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { BNIFollowup, bniFollowupApi, DropdownItem } from '../../services/api/bniFollowupApi';
import FormField from '../../components/FormField';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { logError } from '../../utils/logError';
import '../../styles/admin.css';
import '../../styles/admin-components.css';

export default function BNIFollowupForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { user: currentUser } = useAuth();
    const { showSuccess, showError } = useToast();
    const isEditMode = Boolean(id);

    const passedFollowupData = location.state?.followupData as BNIFollowup | undefined;

    const [formData, setFormData] = useState<{
        memberId: number;
        localTimeZone: string;
        followupType: string;
        responseStatus: string;
        remarks: string;
        nextFollowupDateUTC: string;
    }>({
        memberId: 0,
        localTimeZone: '',
        followupType: '',
        responseStatus: '',
        remarks: '',
        nextFollowupDateUTC: ''
    });

    const [members, setMembers] = useState<DropdownItem[]>([]);
    const [timezones, setTimezones] = useState<DropdownItem[]>([]);
    const [followupTypes, setFollowupTypes] = useState<DropdownItem[]>([]);
    const [statuses, setStatuses] = useState<DropdownItem[]>([]);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        loadDropdowns();

        if (isEditMode && id) {
            if (passedFollowupData) {
                console.log('✅ BNIFollowupForm: Using passed followup data:', passedFollowupData);
                setFormData({
                    memberId: passedFollowupData.memberId || 0,
                    localTimeZone: passedFollowupData.localTimeZone || '',
                    followupType: passedFollowupData.followupType || '',
                    responseStatus: passedFollowupData.responseStatus || '',
                    remarks: passedFollowupData.remarks || '',
                    nextFollowupDateUTC: passedFollowupData.nextFollowupDateUTC ? passedFollowupData.nextFollowupDateUTC.split('T')[0] : ''
                });
            } else {
                loadFollowupData(parseInt(id));
            }
        }
    }, [isEditMode, id, passedFollowupData]);

    const loadDropdowns = async () => {
        try {
            const [membersRes, timezonesRes, typesRes, statusesRes] = await Promise.all([
                bniFollowupApi.getBNIMemberDropdown(),
                bniFollowupApi.getLovMasterDropdown('TimeZone'),
                bniFollowupApi.getLovMasterDropdown('BNIFollowupType'),
                bniFollowupApi.getLovMasterDropdown('BNIFollowupStatus')
            ]);

            if (membersRes.success) {
                setMembers(membersRes.data || []);
            }
            if (timezonesRes.success) {
                setTimezones(timezonesRes.data || []);
            }
            if (typesRes.success) {
                setFollowupTypes(typesRes.data || []);
            }
            if (statusesRes.success) {
                setStatuses(statusesRes.data || []);
            }
        } catch (error) {
            console.error('Error loading dropdowns:', error);
            setErrors({ general: 'Failed to load form data. Please refresh the page.' });
        }
    };

    const loadFollowupData = async (followupId: number) => {
        try {
            setLoading(true);
            setErrors({});

            const response = await bniFollowupApi.getFollowupById(followupId);

            if (response.success && response.data) {
                setFormData({
                    memberId: response.data.memberId || 0,
                    localTimeZone: response.data.localTimeZone || '',
                    followupType: response.data.followupType || '',
                    responseStatus: response.data.responseStatus || '',
                    remarks: response.data.remarks || '',
                    nextFollowupDateUTC: response.data.nextFollowupDateUTC ? response.data.nextFollowupDateUTC.split('T')[0] : ''
                });
            } else {
                setErrors({ general: response.message || 'Failed to load followup data' });
            }
        } catch (error) {
            console.error('Error loading followup:', error);
            await logError({
                controllerName: 'BNIFollowupForm',
                methodName: 'LoadFollowupData',
                requestUrl: `bniFollowupApi.getFollowupById/${followupId}`,
                requestPayload: { followupId },
                error
            });
            setErrors({ general: 'Network error occurred while loading followup data' });
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;

        setFormData(prev => ({
            ...prev,
            [name]: name === 'memberId' ? parseInt(value) : value
        }));

        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};

        // Member is required only in Add mode
        if (!isEditMode && (!formData.memberId || formData.memberId === 0)) {
            newErrors.memberId = 'Member is required';
        }

        // In Add mode, all fields are required
        if (!isEditMode) {
            if (!formData.localTimeZone?.trim()) {
                newErrors.localTimeZone = 'Timezone is required';
            }

            if (!formData.followupType?.trim()) {
                newErrors.followupType = 'Followup type is required';
            }
        }

        // These fields are always required (both Add and Edit modes)
        if (!formData.responseStatus?.trim()) {
            newErrors.responseStatus = 'Response status is required';
        }

        if (!formData.nextFollowupDateUTC?.trim()) {
            newErrors.nextFollowupDateUTC = 'Next followup date is required';
        }

        if (!formData.remarks?.trim()) {
            newErrors.remarks = 'Remarks are required';
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
            setErrors({});

            let response;
            if (isEditMode && id) {
                // Edit mode - only send the 3 fields
                response = await bniFollowupApi.addFollowup({
                    followupId: parseInt(id),
                    memberId: passedFollowupData?.memberId || 0,
                    followupDateUTC: passedFollowupData?.followupDateUTC || '',
                    localTimeZone: passedFollowupData?.localTimeZone || '',
                    followupType: passedFollowupData?.followupType || '',
                    responseStatus: formData.responseStatus,
                    remarks: formData.remarks,
                    nextFollowupDateUTC: formData.nextFollowupDateUTC
                });
            } else {
                // Add mode - send all fields
                const userId = currentUser?.id ? parseInt(currentUser.id) : 0;
                const currentDate = new Date().toISOString().split('T')[0];

                response = await bniFollowupApi.addFollowup({
                    memberId: formData.memberId,
                    followupDateUTC: currentDate, // Use current date
                    localTimeZone: formData.localTimeZone,
                    followupType: formData.followupType,
                    responseStatus: formData.responseStatus,
                    remarks: formData.remarks,
                    nextFollowupDateUTC: formData.nextFollowupDateUTC,
                    createdBy: userId
                });
            }

            if (response.success) {
                showSuccess(`BNI followup ${isEditMode ? 'updated' : 'created'} successfully`);
                navigate('/admin/bni-followups');
            } else {
                setErrors({ general: response.message || `Failed to ${isEditMode ? 'update' : 'create'} followup` });
            }
        } catch (error) {
            console.error('Submit error:', error);
            await logError({
                controllerName: 'BNIFollowupForm',
                methodName: isEditMode ? 'UpdateFollowup' : 'CreateFollowup',
                requestUrl: isEditMode ? `bniFollowupApi.addFollowup/${id}` : 'bniFollowupApi.addFollowup',
                requestPayload: formData,
                error
            });
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
                    <p style={{ marginTop: '16px', color: 'var(--admin-gray-600)' }}>Loading followup data...</p>
                </div>
            </div>
        );
    }

    // Convert dropdowns to options format
    const memberOptions = members.map(member => ({
        value: member.id,
        label: member.name
    }));

    const timezoneOptions = timezones.map(tz => ({
        value: tz.code || tz.name,
        label: tz.name
    }));

    const followupTypeOptions = followupTypes.map(type => ({
        value: type.code || type.name,
        label: type.name
    }));

    const statusOptions = statuses.map(status => ({
        value: status.code || status.name,
        label: status.name
    }));

    return (
        <div className="admin-page">
            <div className="admin-page-header">
                <div>
                    <h1 className="admin-page-title">
                        {isEditMode ? 'Edit BNI Followup' : 'Add New BNI Followup'}
                    </h1>
                    <p className="admin-page-subtitle">
                        {isEditMode ? 'Update Followup Information' : 'Create a New BNI Followup Record'}
                    </p>
                </div>
                <div className="admin-page-actions">
                    <button
                        type="button"
                        onClick={() => navigate('/admin/bni-followups')}
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
                    <h2>Followup Information</h2>
                </div>
                <div className="admin-card-body">
                    <form onSubmit={handleSubmit} className="admin-form" noValidate>
                        {/* Show Member Name as read-only in Edit Mode */}
                        {isEditMode && passedFollowupData && (
                            <div style={{ marginBottom: '25px', padding: '15px', background: 'var(--admin-gray-50)', borderRadius: '8px', borderLeft: '4px solid var(--admin-primary)' }}>
                                <label style={{ display: 'block', fontSize: '12px', color: 'var(--admin-gray-500)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Updating Followup For</label>
                                <span style={{ fontSize: '18px', fontWeight: '700', color: 'var(--admin-gray-800)' }}>{passedFollowupData.memberName || 'Member'}</span>
                            </div>
                        )}

                        {/* Row 1: Member and Timezone (Only in Add Mode) */}
                        {!isEditMode && (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                                <FormField
                                    label="BNI Member"
                                    name="memberId"
                                    type="select"
                                    value={formData.memberId}
                                    onChange={handleInputChange}
                                    error={errors.memberId}
                                    options={memberOptions}
                                    required={true}
                                />

                                <FormField
                                    label="Timezone"
                                    name="localTimeZone"
                                    type="select"
                                    value={formData.localTimeZone}
                                    onChange={handleInputChange}
                                    error={errors.localTimeZone}
                                    options={timezoneOptions}
                                    required={true}
                                />
                            </div>
                        )}

                        {/* Row 2: Followup Type and Next Followup Date (Only in Add Mode) */}
                        {!isEditMode && (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                                <FormField
                                    label="Followup Type"
                                    name="followupType"
                                    type="select"
                                    value={formData.followupType}
                                    onChange={handleInputChange}
                                    error={errors.followupType}
                                    options={followupTypeOptions}
                                    required={true}
                                />

                                <FormField
                                    label="Next Followup Date"
                                    name="nextFollowupDateUTC"
                                    type="date"
                                    value={formData.nextFollowupDateUTC}
                                    onChange={handleInputChange}
                                    error={errors.nextFollowupDateUTC}
                                    required={true}
                                    min={new Date().toISOString().split('T')[0]}
                                />
                            </div>
                        )}

                        {/* Row 3: Response Status (Always shown) */}
                        {!isEditMode && (
                            <div style={{ marginBottom: '20px' }}>
                                <FormField
                                    label="Response Status"
                                    name="responseStatus"
                                    type="select"
                                    value={formData.responseStatus}
                                    onChange={handleInputChange}
                                    error={errors.responseStatus}
                                    options={statusOptions}
                                    required={true}
                                />
                            </div>
                        )}

                        {/* In Edit Mode: Response Status and Next Followup Date in same row */}
                        {isEditMode && (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                                <FormField
                                    label="Response Status"
                                    name="responseStatus"
                                    type="select"
                                    value={formData.responseStatus}
                                    onChange={handleInputChange}
                                    error={errors.responseStatus}
                                    options={statusOptions}
                                    required={true}
                                />

                                <FormField
                                    label="Next Followup Date"
                                    name="nextFollowupDateUTC"
                                    type="date"
                                    value={formData.nextFollowupDateUTC}
                                    onChange={handleInputChange}
                                    error={errors.nextFollowupDateUTC}
                                    required={true}
                                    min={new Date().toISOString().split('T')[0]}
                                />
                            </div>
                        )}

                        {/* Row 4: Remarks (Full Width, Always shown) */}
                        <div style={{ marginBottom: '30px' }}>
                            <FormField
                                label="Remarks"
                                name="remarks"
                                type="textarea"
                                value={formData.remarks}
                                onChange={handleInputChange}
                                error={errors.remarks}
                                placeholder="Enter Remarks"
                                required={true}
                                rows={4}
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
                                onClick={() => navigate('/admin/bni-followups')}
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
