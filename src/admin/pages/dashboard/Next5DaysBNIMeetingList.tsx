import React, { useState, useEffect } from 'react';
import { formatDate, formatDateTime } from '../../utils/dateUtils';
import { useNavigate } from 'react-router-dom';
import { dashboardApi } from '../../services/api/dashboardApi';
import { bniMeetingApi } from '../../services/api/bniMeetingApi';
import DataTable from '../../components/DataTable';
import { useToast } from '../../context/ToastContext';
import '../../styles/admin.css';
import '../../styles/admin-components.css';

interface UpcomingBNIMeeting {
    meetingId: number;
    memberName: string;
    meetingType: string;
    meetingDate: string;
    meetingMode: string;
    meetingLocation: string;
    agenda: string;
    [key: string]: any;
}

export default function Next5DaysBNIMeetingList() {
    const { showSuccess, showError } = useToast();
    const navigate = useNavigate();

    const [meetings, setMeetings] = useState<UpcomingBNIMeeting[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [allMeetings, setAllMeetings] = useState<UpcomingBNIMeeting[]>([]);

    // Pagination constants
    const [currentPage, setCurrentPage] = useState(1);
    const [entriesPerPage, setEntriesPerPage] = useState(10);
    const [totalRecords, setTotalRecords] = useState(0);

    // State for LOV mappings
    const [meetingTypeMap, setMeetingTypeMap] = useState<Record<string, string>>({});
    const [meetingModeMap, setMeetingModeMap] = useState<Record<string, string>>({});

    // Load LOV mappings on component mount
    useEffect(() => {
        loadLovMappings();
    }, []);

    const loadLovMappings = async () => {
        try {
            const [typesRes, modesRes] = await Promise.all([
                bniMeetingApi.getLovMasterDropdown('BNImeetingType'),
                bniMeetingApi.getLovMasterDropdown('BNImeetingMode')
            ]);

            // Create ID/Code-to-Name mappings
            if (typesRes.success && typesRes.data) {
                const typeMapping: Record<string, string> = {};
                typesRes.data.forEach(item => {
                    const key = item.code || item.name;
                    typeMapping[key] = item.name;
                    if (item.name) typeMapping[item.name] = item.name;
                });
                setMeetingTypeMap(typeMapping);
            }

            if (modesRes.success && modesRes.data) {
                const modeMapping: Record<string, string> = {};
                modesRes.data.forEach(item => {
                    const key = item.code || item.name;
                    modeMapping[key] = item.name;
                    if (item.name) modeMapping[item.name] = item.name;
                });
                setMeetingModeMap(modeMapping);
            }
        } catch (error) {
            console.error('Error loading LOV mappings:', error);
        }
    };

    const loadMeetings = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await dashboardApi.getNext5DaysBNIMeetings(0, 1000, 'asc');

            if (response.success) {
                const data = response.data || [];
                // Map the data
                if (data.length > 0) {
                    console.log('🔍 First Meeting Item:', data[0]);
                    console.log('🔑 Keys:', Object.keys(data[0]));
                }

                const mappedData = data.map((item: any) => ({
                    meetingId: item.meetingId || item.MeetingId || item.id || item.Id || item.followupId || item.FollowupId,
                    memberName: item.memberName || item.MemberName || item.name || item.Name || '',

                    meetingType: item.meetingType || item.MeetingType || item.type || item.Type ||
                        item.typeName || item.TypeName || item.category || item.Category ||
                        item.meeting_type || item.followupTypeName || item.FollowupTypeName ||
                        item.followupType || item.FollowupType || '',

                    meetingDate: item.meetingDate || item.MeetingDate || item.meetingDateUTC || item.MeetingDateUTC ||
                        item.date || item.Date || item.followupDateUTC || item.FollowupDateUTC ||
                        item.startDate || item.StartDate || item.startDateTime || item.StartDateTime ||
                        item.eventDate || item.EventDate || item.meeting_date || '',

                    localTime: item.localTime || item.LocalTime || '', // Display string from API if available

                    // Prioritize likely correct keys from logs
                    nextFollowupDate: item.nextFollowupDateUTC || item.NextFollowupDateUTC ||
                        item.nextFollowUpdateUTC || item.NextFollowUpdateUTC ||
                        item.nextFollowupDate || item.NextFollowupDate ||
                        item.nextFollowUpDateUTC || item.NextFollowUpDateUTC || '',

                    // Prioritize Name property for display
                    status: item.responseStatusName || item.ResponseStatusName ||
                        item.responseStatus || item.ResponseStatus ||
                        item.status || item.Status ||
                        item.meetingOutcome || item.MeetingOutcome || 'Pending',

                    localTimeZone: item.localTimeZone || item.LocalTimeZone || '',

                    meetingMode: item.meetingMode || item.MeetingMode || item.mode || item.Mode ||
                        item.modeName || item.ModeName || '',

                    meetingLocation: item.meetingLocation || item.MeetingLocation || item.location || item.Location ||
                        item.venue || item.Venue || item.address || item.Address ||
                        item.place || item.Place || '',

                    agenda: item.agenda || item.Agenda || item.description || item.Description ||
                        item.topic || item.Topic || item.title || item.Title || '',

                    remarks: item.remarks || item.Remarks || item.agenda || item.Agenda || ''
                }));

                if (mappedData.length > 0) {
                    console.log('✨ Final Mapped Item:', mappedData[0]);
                }

                setAllMeetings(mappedData);
                filterAndPaginate(mappedData, searchTerm, currentPage, entriesPerPage);
            } else {
                setError(response.message || 'Failed to fetch upcoming BNI meetings');
                setMeetings([]);
            }
        } catch (err) {
            setError('Network error occurred');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const filterAndPaginate = (data: UpcomingBNIMeeting[], search: string, page: number, size: number) => {
        let filtered = data;
        if (search) {
            const lowerSearch = search.toLowerCase();
            filtered = data.filter(item =>
                String(item.memberName || '').toLowerCase().includes(lowerSearch) ||
                String(item.meetingType || '').toLowerCase().includes(lowerSearch) ||
                String(item.status || '').toLowerCase().includes(lowerSearch) ||
                String(item.remarks || '').toLowerCase().includes(lowerSearch)
            );
        }

        setTotalRecords(filtered.length);
        const start = (page - 1) * size;
        setMeetings(filtered.slice(start, start + size));
    };

    useEffect(() => {
        loadMeetings();
    }, []);

    useEffect(() => {
        filterAndPaginate(allMeetings, searchTerm, currentPage, entriesPerPage);
    }, [searchTerm, currentPage, entriesPerPage, allMeetings]);

    const columns = [
        {
            key: 'meetingId',
            label: 'Sr No.',
            width: '60px',
            render: (_: any, __: any, index: number) => ((currentPage - 1) * entriesPerPage) + index + 1
        },
        {
            key: 'memberName',
            label: 'Member Name',
            width: '150px',
            sortable: true,
            render: (value: string) => <span style={{ fontWeight: 500 }}>{value || '-'}</span>
        },
        {
            key: 'meetingType',
            label: 'Type',
            width: '100px',
            sortable: true,
            render: (value: string) => meetingTypeMap[value] || value || '-'
        },
        {
            key: 'meetingDate',
            label: 'Date & Time',
            width: '160px',
            sortable: true,
            // Prioritize LocalTime string from API, else format the UTC date
            render: (value: string, item: any) => item.localTime || formatDateTime(value)
        },

        {
            key: 'nextFollowupDate',
            label: 'Next Followup',
            width: '160px',
            sortable: true,
            render: (value: string) => formatDateTime(value)
        },
        {
            key: 'localTimeZone',
            label: 'Time Zone',
            width: '80px',
            sortable: true,
            render: (value: string) => value || '-'
        },
        {
            key: 'remarks',
            label: 'Remarks',
            width: '200px',
            render: (val: string) => (
                <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={val}>
                    {val || '-'}
                </div>
            )
        }
    ];

    return (
        <div className="admin-page">
            <div className="admin-page-header">
                <div>
                    <h1 className="admin-page-title">
                        Upcoming BNI Meeting
                        <span style={{
                            fontSize: '16px',
                            color: 'var(--admin-gray-500)',
                            marginLeft: '10px',
                            fontWeight: 'normal'
                        }}>
                            {/* ({totalRecords}) */}
                        </span>
                    </h1>
                    {/* <p className="admin-page-subtitle">BNI Meetings Scheduled For The Next 5 Days</p> */}
                </div>
                <div className="admin-page-actions">
                    <button onClick={() => navigate('/admin/dashboard')} className="admin-btn admin-btn-secondary">
                        <i className="fa-solid fa-arrow-left"></i> Back to Dashboard
                    </button>
                </div>
            </div>

            {error && (
                <div className="admin-alert admin-alert-error">
                    <i className="fa-solid fa-circle-exclamation"></i>
                    {error}
                </div>
            )}

            <div className="admin-card">
                <div className="admin-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <h2 style={{ margin: 0 }}>{loading ? 'Loading...' : `${totalRecords} Record`}</h2>
                        <div className="admin-search-wrapper">
                            <i className="fa-solid fa-search admin-search-icon"></i>
                            <input
                                type="text"
                                placeholder="Search Meeting..."
                                value={searchTerm}
                                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                className="admin-search-input"
                            />
                        </div>
                    </div>
                </div>

                <div className="admin-card-body" style={{ padding: 0 }}>
                    <DataTable
                        columns={columns}
                        data={meetings}
                        loading={loading}
                        emptyMessage="No Upcoming BNI Meetings Found"
                    />

                    {/* Pagination */}
                    {!loading && totalRecords > 0 && (
                        <div className="admin-pagination">
                            <div className="admin-pagination-info">
                                Showing {((currentPage - 1) * entriesPerPage) + 1} To {Math.min(currentPage * entriesPerPage, totalRecords)} Of {totalRecords} Entries
                            </div>
                            <div className="admin-pagination-controls">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="admin-pagination-btn"
                                >
                                    Previous
                                </button>
                                <span style={{ margin: '0 10px', fontSize: '14px' }}>Page {currentPage}</span>
                                <button
                                    onClick={() => setCurrentPage(p => (p * entriesPerPage < totalRecords ? p + 1 : p))}
                                    disabled={currentPage * entriesPerPage >= totalRecords}
                                    className="admin-pagination-btn"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
