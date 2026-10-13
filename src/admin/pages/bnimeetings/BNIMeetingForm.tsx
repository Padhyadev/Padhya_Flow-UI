import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BNIMeeting, bniMeetingApi, DropdownItem } from '../../services/api/bniMeetingApi';
import FormField from '../../components/FormField';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { logError } from '../../utils/logError';
import '../../styles/admin.css';
import '../../styles/admin-components.css';

export default function BNIMeetingForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user: currentUser } = useAuth();
    const { showSuccess, showError } = useToast();
    const isEditMode = Boolean(id);

    const [formData, setFormData] = useState<{
        memberId: number;
        meetingType: string;
        meetingMode: string;
        meetingDateUTC: string;
        localTimeZone: string;
        meetingLocation: string;
        agenda: string;
        remarks: string;
        meetingOutcome: string;
    }>({
        memberId: 0,
        meetingType: '',
        meetingMode: '',
        meetingDateUTC: '',
        localTimeZone: '',
        meetingLocation: '',
        agenda: '',
        remarks: '',
        meetingOutcome: ''
    });

    const [members, setMembers] = useState<DropdownItem[]>([]);
    const [meetingTypes, setMeetingTypes] = useState<DropdownItem[]>([]);
    const [meetingModes, setMeetingModes] = useState<DropdownItem[]>([]);
    const [timezones, setTimezones] = useState<DropdownItem[]>([]);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        loadDropdowns();

        if (isEditMode && id) {
            loadMeetingData(parseInt(id));
        }
    }, [isEditMode, id]);

    const loadDropdowns = async () => {
        try {
            const [membersRes, typesRes, modesRes, timezonesRes] = await Promise.all([
                bniMeetingApi.getBNIMemberDropdown(),
                bniMeetingApi.getLovMasterDropdown('BNImeetingType'),
                bniMeetingApi.getLovMasterDropdown('BNImeetingMode'),
                bniMeetingApi.getLovMasterDropdown('TimeZone')
            ]);

            if (membersRes.success) {
                setMembers(membersRes.data || []);
            }
            if (typesRes.success) {
                setMeetingTypes(typesRes.data || []);
            }
            if (modesRes.success) {
                setMeetingModes(modesRes.data || []);
            }
            if (timezonesRes.success) {
                setTimezones(timezonesRes.data || []);
            }
        } catch (error) {
            console.error('Error loading dropdowns:', error);
            setErrors({ general: 'Failed to load form data. Please refresh the page.' });
        }
    };

    const loadMeetingData = async (meetingId: number) => {
        try {
            setLoading(true);
            setErrors({});

            const response = await bniMeetingApi.getMeetingById(meetingId);

            if (response.success && response.data) {
                setFormData({
                    memberId: response.data.memberId || 0,
                    meetingType: response.data.meetingType || '',
                    meetingMode: response.data.meetingMode || '',
                    meetingDateUTC: response.data.meetingDateUTC ? response.data.meetingDateUTC.split('T')[0] : '',
                    localTimeZone: response.data.localTimeZone || '',
                    meetingLocation: response.data.meetingLocation || '',
                    agenda: response.data.agenda || '',
                    remarks: response.data.remarks || '',
                    meetingOutcome: response.data.meetingOutcome || ''
                });
            } else {
                setErrors({ general: response.message || 'Failed to load meeting data' });
            }
        } catch (error) {
            console.error('Error loading meeting:', error);
            await logError({
                controllerName: 'BNIMeetingForm',
                methodName: 'LoadMeetingData',
                requestUrl: `bniMeetingApi.getMeetingById/${meetingId}`,
                requestPayload: { meetingId },
                error
            });
            setErrors({ general: 'Network error occurred while loading meeting data' });
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

        if (!formData.memberId || formData.memberId === 0) {
            newErrors.memberId = 'Member is required';
        }

        if (!formData.meetingType?.trim()) {
            newErrors.meetingType = 'Meeting type is required';
        }

        if (!formData.meetingMode?.trim()) {
            newErrors.meetingMode = 'Meeting mode is required';
        }

        if (!formData.meetingDateUTC?.trim()) {
            newErrors.meetingDateUTC = 'Meeting date is required';
        }

        if (!formData.localTimeZone?.trim()) {
            newErrors.localTimeZone = 'Timezone is required';
        }

        if (!formData.meetingLocation?.trim()) {
            newErrors.meetingLocation = 'Meeting location is required';
        }

        if (!formData.agenda?.trim()) {
            newErrors.agenda = 'Agenda is required';
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

            const userId = currentUser?.id ? parseInt(currentUser.id) : 0;

            // Ensure date has time component for API
            const meetingDateWithTime = formData.meetingDateUTC.includes('T')
                ? formData.meetingDateUTC
                : `${formData.meetingDateUTC}T00:00:00`;

            let response;
            if (isEditMode && id) {
                response = await bniMeetingApi.addMeeting({
                    meetingId: parseInt(id),
                    memberId: formData.memberId,
                    meetingType: formData.meetingType,
                    meetingMode: formData.meetingMode,
                    meetingDateUTC: meetingDateWithTime,
                    localTimeZone: formData.localTimeZone,
                    meetingLocation: formData.meetingLocation,
                    agenda: formData.agenda,
                    remarks: formData.remarks,
                    meetingOutcome: formData.meetingOutcome,
                    createdBy: userId,
                    lastModifiedBy: userId
                });
            } else {
                response = await bniMeetingApi.addMeeting({
                    memberId: formData.memberId,
                    meetingType: formData.meetingType,
                    meetingMode: formData.meetingMode,
                    meetingDateUTC: meetingDateWithTime,
                    localTimeZone: formData.localTimeZone,
                    meetingLocation: formData.meetingLocation,
                    agenda: formData.agenda,
                    remarks: formData.remarks,
                    meetingOutcome: formData.meetingOutcome,
                    createdBy: userId
                });
            }

            if (response.success) {
                showSuccess(`BNI meeting ${isEditMode ? 'updated' : 'created'} successfully`);
                navigate('/admin/bni-meetings');
            } else {
                setErrors({ general: response.message || `Failed to ${isEditMode ? 'update' : 'create'} meeting` });
            }
        } catch (error) {
            console.error('Submit error:', error);
            await logError({
                controllerName: 'BNIMeetingForm',
                methodName: isEditMode ? 'UpdateMeeting' : 'CreateMeeting',
                requestUrl: isEditMode ? `bniMeetingApi.addMeeting/${id}` : 'bniMeetingApi.addMeeting',
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
                    <p style={{ marginTop: '16px', color: 'var(--admin-gray-600)' }}>Loading meeting data...</p>
                </div>
            </div>
        );
    }

    // Convert dropdowns to options format
    const memberOptions = members.map(member => ({
        value: member.id,
        label: member.name
    }));

    const meetingTypeOptions = meetingTypes.map(type => ({
        value: type.code || type.name,
        label: type.name
    }));

    const meetingModeOptions = meetingModes.map(mode => ({
        value: mode.code || mode.name,
        label: mode.name
    }));

    const timezoneOptions = timezones.map(tz => ({
        value: tz.code || tz.name,
        label: tz.name
    }));

    return (
        <div className="admin-page">
            <div className="admin-page-header">
                <div>
                    <h1 className="admin-page-title">
                        {isEditMode ? 'Edit BNI Meeting' : 'Add New BNI Meeting'}
                    </h1>
                    <p className="admin-page-subtitle">
                        {isEditMode ? 'Update Meeting Information' : 'Create a New BNI Meeting Record'}
                    </p>
                </div>
                <div className="admin-page-actions">
                    <button
                        type="button"
                        onClick={() => navigate('/admin/bni-meetings')}
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
                    <h2>Meeting Information</h2>
                </div>
                <div className="admin-card-body">
                    <form onSubmit={handleSubmit} className="admin-form" noValidate>
                        {!isEditMode && (
                            <>
                                {/* Row 1: Member and Meeting Type */}
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
                                        label="Meeting Type"
                                        name="meetingType"
                                        type="select"
                                        value={formData.meetingType}
                                        onChange={handleInputChange}
                                        error={errors.meetingType}
                                        options={meetingTypeOptions}
                                        required={true}
                                    />
                                </div>

                                {/* Row 2: Meeting Mode and Meeting Location */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                                    <FormField
                                        label="Meeting Mode"
                                        name="meetingMode"
                                        type="select"
                                        value={formData.meetingMode}
                                        onChange={handleInputChange}
                                        error={errors.meetingMode}
                                        options={meetingModeOptions}
                                        required={true}
                                    />

                                    <FormField
                                        label="Meeting Location"
                                        name="meetingLocation"
                                        type="text"
                                        value={formData.meetingLocation}
                                        onChange={handleInputChange}
                                        error={errors.meetingLocation}
                                        placeholder="Enter Meeting Location"
                                        required={true}
                                    />
                                </div>

                                {/* Row 3: Timezone (Full Width) */}
                                <div style={{ marginBottom: '20px' }}>
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

                                {/* Row 4: Agenda (Full Width) */}
                                <div style={{ marginBottom: '20px' }}>
                                    <FormField
                                        label="Agenda"
                                        name="agenda"
                                        type="textarea"
                                        value={formData.agenda}
                                        onChange={handleInputChange}
                                        error={errors.agenda}
                                        placeholder="Enter Meeting Agenda"
                                        required={true}
                                        rows={3}
                                    />
                                </div>

                                {/* Row 5: Meeting Outcome (Full Width) */}
                                <div style={{ marginBottom: '20px' }}>
                                    <FormField
                                        label="Meeting Outcome"
                                        name="meetingOutcome"
                                        type="textarea"
                                        value={formData.meetingOutcome}
                                        onChange={handleInputChange}
                                        error={errors.meetingOutcome}
                                        placeholder="Enter Meeting Outcome (Optional)"
                                        rows={3}
                                    />
                                </div>
                            </>
                        )}

                        {/* Meeting Date - Always visible */}
                        <div style={{ marginBottom: '20px' }}>
                            <FormField
                                label="Meeting Date"
                                name="meetingDateUTC"
                                type="date"
                                value={formData.meetingDateUTC}
                                onChange={handleInputChange}
                                error={errors.meetingDateUTC}
                                required={true}
                                min={(() => {
                                    const tomorrow = new Date();
                                    tomorrow.setDate(tomorrow.getDate() + 1);
                                    return tomorrow.toISOString().split('T')[0];
                                })()}
                            />
                        </div>

                        {/* Remarks - Always visible */}
                        <div style={{ marginBottom: '30px' }}>
                            <FormField
                                label="Remarks"
                                name="remarks"
                                type="textarea"
                                value={formData.remarks}
                                onChange={handleInputChange}
                                error={errors.remarks}
                                placeholder="Enter Remarks (Optional)"
                                rows={3}
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
                                onClick={() => navigate('/admin/bni-meetings')}
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
