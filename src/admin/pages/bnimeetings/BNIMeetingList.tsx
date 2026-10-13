import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BNIMeeting, bniMeetingApi } from '../../services/api/bniMeetingApi';
import DataTable, { Column } from '../../components/DataTable';
import ConfirmDialog from '../../components/ConfirmDialog';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { formatDate, formatDateTime } from '../../utils/dateUtils';
import '../../styles/admin.css';
import '../../styles/admin-components.css';

export default function BNIMeetingList() {
    const { user: currentUser } = useAuth();
    const { showSuccess, showError } = useToast();
    const navigate = useNavigate();

    const [meetings, setMeetings] = useState<BNIMeeting[]>([]);
    const [allMeetings, setAllMeetings] = useState<BNIMeeting[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; meeting: BNIMeeting | null }>({
        isOpen: false,
        meeting: null
    });

    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [entriesPerPage, setEntriesPerPage] = useState(10);
    const [totalRecords, setTotalRecords] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

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

            // Create ID-to-Name mappings
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

    const loadMeetings = async (page: number = currentPage, pageSize: number = entriesPerPage, search: string = searchTerm) => {
        try {
            setLoading(true);
            setError(null);

            const response = await bniMeetingApi.getAllMeetings(0, 1000, 'asc');

            if (response.success) {
                const fetchedMeetings = response.data || [];
                setAllMeetings(fetchedMeetings);

                // Global Filter
                const filteredMeetings = fetchedMeetings.filter(meeting => {
                    const searchStr = search.toLowerCase();
                    return Object.values(meeting).some(value =>
                        value !== null &&
                        value !== undefined &&
                        String(value).toLowerCase().includes(searchStr)
                    );
                });

                const totalCount = filteredMeetings.length;
                setTotalRecords(totalCount);
                setTotalPages(Math.ceil(totalCount / pageSize));

                // Paginate
                const startIndex = (page - 1) * pageSize;
                const endIndex = startIndex + pageSize;
                const pageData = filteredMeetings.slice(startIndex, endIndex);

                setMeetings(pageData);
            } else {
                setError(response.message || 'Failed to fetch BNI meetings');
                setMeetings([]);
                setAllMeetings([]);
                setTotalRecords(0);
                setTotalPages(0);
            }
        } catch (err) {
            setError('Network error occurred while fetching BNI meetings');
            console.error('Error fetching BNI meetings:', err);
            setMeetings([]);
            setAllMeetings([]);
            setTotalRecords(0);
            setTotalPages(0);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchTerm(value);
        setCurrentPage(1);
        loadMeetings(1, entriesPerPage, value);
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        loadMeetings(page, entriesPerPage, searchTerm);
    };

    const handleEntriesPerPageChange = (newEntriesPerPage: number) => {
        setEntriesPerPage(newEntriesPerPage);
        setCurrentPage(1);
        loadMeetings(1, newEntriesPerPage, searchTerm);
    };

    const handlePrevious = () => {
        if (currentPage > 1) {
            handlePageChange(currentPage - 1);
        }
    };

    const handleNext = () => {
        if (currentPage < totalPages) {
            handlePageChange(currentPage + 1);
        }
    };

    useEffect(() => {
        loadMeetings();
    }, [currentUser]);

    // Helper function to map meeting type values to display names
    const getMeetingTypeDisplay = (value: string): string => {
        if (!value) return '-';

        // First try the dynamic mapping from API
        if (meetingTypeMap[value]) {
            return meetingTypeMap[value];
        }

        // Return original value if not found in mapping
        return value;
    };

    // Helper function to map meeting mode values to display names
    const getMeetingModeDisplay = (value: string): string => {
        if (!value) return '-';

        // First try the dynamic mapping from API
        if (meetingModeMap[value]) {
            return meetingModeMap[value];
        }

        // Return original value if not found in mapping
        return value;
    };

    const columns: Column<BNIMeeting>[] = [
        {
            key: 'meetingId',
            label: 'Sr No.',
            width: '80px',
            render: (_: any, __: BNIMeeting, index: number) => ((currentPage - 1) * entriesPerPage) + index + 1
        },
        {
            key: 'memberName',
            label: 'Member Name',
            width: '180px',
            sortable: true,
            render: (value: string) => <span style={{ fontWeight: 500 }}>{value || '-'}</span>
        },
        {
            key: 'meetingType',
            label: 'Meeting Type',
            width: '140px',
            sortable: true,
            render: (value: string) => getMeetingTypeDisplay(value)
        },
        {
            key: 'meetingMode',
            label: 'Mode',
            width: '120px',
            sortable: true,
            render: (value: string) => getMeetingModeDisplay(value)
        },
        {
            key: 'meetingDateUTC',
            label: 'Meeting Date',
            width: '180px',
            sortable: true,
            render: (value: string) => formatDateTime(value)
        },
        {
            key: 'meetingLocation',
            label: 'Location',
            width: '150px',
            sortable: true,
            render: (value: string) => value || '-'
        },
        {
            key: 'agenda',
            label: 'Agenda',
            width: '200px',
            align: 'left',
            sortable: true,
            render: (value: string) => (
                <span style={{ fontSize: '13px', color: 'var(--admin-gray-700)' }}>
                    {value || '-'}
                </span>
            )
        },
        {
            key: 'meetingOutcome',
            label: 'Outcome',
            width: '200px',
            align: 'left',
            sortable: true,
            render: (value: string) => (
                <span style={{ fontSize: '13px', color: 'var(--admin-gray-700)' }}>
                    {value || '-'}
                </span>
            )
        }
    ];

    const handleDeleteMeeting = async () => {
        if (!deleteDialog.meeting) return;
        if (!deleteDialog.meeting.meetingId) {
            setError('Cannot delete meeting: Invalid meeting ID');
            return;
        }

        try {
            const operatedBy = currentUser?.id ? parseInt(currentUser.id) : 1;
            const response = await bniMeetingApi.deleteMeeting(deleteDialog.meeting.meetingId, operatedBy);
            if (response.success) {
                await loadMeetings();
                setDeleteDialog({ isOpen: false, meeting: null });
                showSuccess('BNI Meeting deleted successfully!');
            } else {
                setError(response.message || 'Failed to delete BNI meeting');
            }
        } catch (err) {
            setError('Network error occurred while deleting BNI meeting');
            console.error('Error deleting BNI meeting:', err);
        }
    };

    return (
        <div className="admin-page">
            <div className="admin-page-header">
                <div>
                    <h1 className="admin-page-title">BNI Meeting</h1>
                    <p className="admin-page-subtitle">Manage BNI Meeting Information</p>
                </div>
                <div className="admin-page-actions">
                    <Link to="/admin/bni-meetings/new" className="admin-btn admin-btn-primary">
                        <i className="fa-solid fa-plus"></i>
                        Add BNI Meeting
                    </Link>
                </div>
            </div>

            {error && (
                <div className="admin-alert admin-alert-error">
                    <i className="fa-solid fa-circle-exclamation"></i>
                    {error}
                    <button
                        onClick={() => setError(null)}
                        style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'inherit' }}
                    >
                        <i className="fa-solid fa-times"></i>
                    </button>
                </div>
            )}

            <div className="admin-card">
                <div className="admin-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <h2 style={{ margin: 0 }}>{loading ? 'Loading...' : `${totalRecords} BNI Meeting`}</h2>

                        <div className="admin-search-wrapper">
                            <i className="fa-solid fa-search admin-search-icon"></i>
                            <input
                                type="text"
                                placeholder="Search BNI Meeting..."
                                value={searchTerm}
                                onChange={handleSearch}
                                className="admin-search-input"
                            />
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '14px', color: 'var(--admin-gray-600)' }}>Show</span>
                        <select
                            value={entriesPerPage}
                            onChange={(e) => handleEntriesPerPageChange(parseInt(e.target.value))}
                            className="admin-form-control"
                            style={{ width: 'auto', padding: '6px 12px' }}
                        >
                            <option value={5}>5</option>
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                        </select>
                        <span style={{ fontSize: '14px', color: 'var(--admin-gray-600)' }}>Entries</span>
                    </div>
                </div>

                <div className="admin-card-body" style={{ padding: 0 }}>
                    {loading ? (
                        <div className="admin-table-loading">
                            <i className="fa-solid fa-spinner fa-spin"></i>
                            <p>Loading BNI Meetings...</p>
                        </div>
                    ) : meetings.length === 0 ? (
                        <div className="admin-table-empty">
                            <i className="fa-solid fa-handshake"></i>
                            <h3>No BNI Meetings Found</h3>
                            <p>No BNI meetings are available in the system.</p>
                        </div>
                    ) : (
                        <>
                            <DataTable
                                columns={columns}
                                data={meetings}
                                loading={loading}
                                onEdit={(meeting: BNIMeeting) => navigate(`/admin/bni-meetings/${meeting.meetingId}/edit`)}
                                onDelete={(meeting: BNIMeeting) => setDeleteDialog({ isOpen: true, meeting })}
                            />

                            {/* Pagination Controls */}
                            <div className="admin-pagination">
                                <div className="admin-pagination-info">
                                    Showing {((currentPage - 1) * entriesPerPage) + 1} To {Math.min(currentPage * entriesPerPage, totalRecords)} Of {totalRecords} Entries
                                </div>

                                <div className="admin-pagination-controls">
                                    <button
                                        onClick={handlePrevious}
                                        disabled={currentPage <= 1}
                                        className="admin-pagination-btn"
                                    >
                                        <i className="fa-solid fa-chevron-left" style={{ fontSize: '11px' }}></i> Previous
                                    </button>

                                    <div className="admin-pagination-pages">
                                        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                                            let pageNum;
                                            if (totalPages <= 5) {
                                                pageNum = i + 1;
                                            } else if (currentPage <= 3) {
                                                pageNum = i + 1;
                                            } else if (currentPage >= totalPages - 2) {
                                                pageNum = totalPages - 4 + i;
                                            } else {
                                                pageNum = currentPage - 2 + i;
                                            }

                                            return (
                                                <button
                                                    key={pageNum}
                                                    onClick={() => handlePageChange(pageNum)}
                                                    className={`admin-pagination-btn ${pageNum === currentPage ? 'active' : ''}`}
                                                >
                                                    {pageNum}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    <button
                                        onClick={handleNext}
                                        disabled={currentPage >= totalPages}
                                        className="admin-pagination-btn"
                                    >
                                        Next <i className="fa-solid fa-chevron-right" style={{ fontSize: '11px' }}></i>
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>

            <ConfirmDialog
                isOpen={deleteDialog.isOpen}
                title="Delete BNI Meeting"
                message={`Are you sure you want to delete this meeting for "${deleteDialog.meeting?.memberName}"?`}
                confirmText="Delete"
                type="danger"
                onConfirm={handleDeleteMeeting}
                onCancel={() => setDeleteDialog({ isOpen: false, meeting: null })}
            />
        </div>
    );
}
