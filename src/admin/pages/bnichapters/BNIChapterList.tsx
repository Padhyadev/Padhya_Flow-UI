import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BNIChapter, bniChapterApi } from '../../services/api/bniChapterApi';
import DataTable, { Column } from '../../components/DataTable';
import ConfirmDialog from '../../components/ConfirmDialog';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import '../../styles/admin.css';
import '../../styles/admin-components.css';

export default function BNIChapterList() {
    const { user: currentUser } = useAuth();
    const { showSuccess, showError } = useToast();
    const navigate = useNavigate();

    const [chapters, setChapters] = useState<BNIChapter[]>([]);
    const [allChapters, setAllChapters] = useState<BNIChapter[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; chapter: BNIChapter | null }>({
        isOpen: false,
        chapter: null
    });

    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [entriesPerPage, setEntriesPerPage] = useState(10);
    const [totalRecords, setTotalRecords] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    const [lovMaps, setLovMaps] = useState<{
        chapterType: Record<string, string>;
        meetingDay: Record<string, string>;
    }>({ chapterType: {}, meetingDay: {} });

    useEffect(() => {
        loadLovAssignments();
    }, []);

    const loadLovAssignments = async () => {
        try {
            const [meetingDayRes, chapterTypeRes] = await Promise.all([
                bniChapterApi.getLovDropdown('meetingDay'),
                bniChapterApi.getLovDropdown('ChapterType')
            ]);

            const newLovMaps = {
                meetingDay: {} as Record<string, string>,
                chapterType: {} as Record<string, string>
            };

            if (meetingDayRes.success) {
                meetingDayRes.data.forEach(item => {
                    const key = item.lovCode ?? item.lovValue;
                    newLovMaps.meetingDay[key] = item.lovValue;
                });
            }

            if (chapterTypeRes.success) {
                chapterTypeRes.data.forEach(item => {
                    const key = item.lovCode ?? item.lovValue;
                    newLovMaps.chapterType[key] = item.lovValue;
                });
            }

            setLovMaps(newLovMaps);
        } catch (error) {
            console.error('Error loading LOV data:', error);
        }
    };

    const loadChapters = async (page: number = currentPage, pageSize: number = entriesPerPage, search: string = searchTerm) => {
        try {
            setLoading(true);
            setError(null);

            const response = await bniChapterApi.getAllChapters(0, 1000, 'asc');

            if (response.success) {
                const fetchedChapters = response.data || [];
                setAllChapters(fetchedChapters);

                // Global Filter
                const filteredChapters = fetchedChapters.filter(chapter => {
                    const searchStr = search.toLowerCase();
                    return Object.values(chapter).some(value =>
                        value !== null &&
                        value !== undefined &&
                        String(value).toLowerCase().includes(searchStr)
                    );
                });

                const totalCount = filteredChapters.length;
                setTotalRecords(totalCount);
                setTotalPages(Math.ceil(totalCount / pageSize));

                // Paginate
                const startIndex = (page - 1) * pageSize;
                const endIndex = startIndex + pageSize;
                const pageData = filteredChapters.slice(startIndex, endIndex);

                setChapters(pageData);
            } else {
                setError(response.message || 'Failed to fetch BNI chapters');
                setChapters([]);
                setAllChapters([]);
                setTotalRecords(0);
                setTotalPages(0);
            }
        } catch (err) {
            setError('Network error occurred while fetching BNI chapters');
            console.error('Error fetching BNI chapters:', err);
            setChapters([]);
            setAllChapters([]);
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
        loadChapters(1, entriesPerPage, value);
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        loadChapters(page, entriesPerPage, searchTerm);
    };

    const handleEntriesPerPageChange = (newEntriesPerPage: number) => {
        setEntriesPerPage(newEntriesPerPage);
        setCurrentPage(1);
        loadChapters(1, newEntriesPerPage, searchTerm);
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
        loadChapters();
    }, [currentUser]);

    const columns: Column<BNIChapter>[] = [
        {
            key: 'chapterId',
            label: 'Sr No.',
            width: '80px',
            render: (_: any, __: BNIChapter, index: number) => ((currentPage - 1) * entriesPerPage) + index + 1
        },
        {
            key: 'chapterName',
            label: 'Chapter Name',
            width: '200px',
            sortable: true,
            render: (value: string) => <span style={{ fontWeight: 500 }}>{value || '-'}</span>
        },
        {
            key: 'countryName',
            label: 'Country',
            width: '150px',
            sortable: true,
            render: (value: string) => value || '-'
        },
        {
            key: 'regionName',
            label: 'Region',
            width: '150px',
            sortable: true,
            render: (value: string) => value || '-'
        },
        {
            key: 'cityName',
            label: 'City',
            width: '150px',
            sortable: true,
            render: (value: string) => value || '-'
        },
        {
            key: 'meetingDay',
            label: 'Meeting Day',
            width: '120px',
            sortable: true,
            render: (value: string) => lovMaps.meetingDay[value] || value || '-'
        },
        {
            key: 'meetingTime',
            label: 'Meeting Time',
            width: '120px',
            sortable: true,
            render: (value: string) => value || '-'
        },
        {
            key: 'chapterType',
            label: 'Chapter Type',
            width: '130px',
            sortable: true,
            render: (value: string) => {
                if (!value) return '-';
                return lovMaps.chapterType[value] || value;
            }
        }
    ];

    const handleDeleteChapter = async () => {
        if (!deleteDialog.chapter) return;
        if (!deleteDialog.chapter.chapterId) {
            setError('Cannot delete chapter: Invalid chapter ID');
            return;
        }

        try {
            const operatedBy = currentUser?.id ? parseInt(currentUser.id) : 1;
            const response = await bniChapterApi.deleteChapter(deleteDialog.chapter.chapterId, operatedBy);
            if (response.success) {
                await loadChapters();
                setDeleteDialog({ isOpen: false, chapter: null });
                showSuccess('BNI Chapter deleted successfully!');
            } else {
                setError(response.message || 'Failed to delete BNI chapter');
            }
        } catch (err) {
            setError('Network error occurred while deleting BNI chapter');
            console.error('Error deleting BNI chapter:', err);
        }
    };

    return (
        <div className="admin-page">
            <div className="admin-page-header">
                <div>
                    <h1 className="admin-page-title">BNI Chapter</h1>
                    <p className="admin-page-subtitle">Manage BNI Chapter Information</p>
                </div>
                <div className="admin-page-actions">
                    <Link to="/admin/bni-chapters/new" className="admin-btn admin-btn-primary">
                        <i className="fa-solid fa-plus"></i>
                        Add BNI Chapter
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
                        <h2 style={{ margin: 0 }}>{loading ? 'Loading...' : `${totalRecords} BNI Chapter`}</h2>

                        <div className="admin-search-wrapper">
                            <i className="fa-solid fa-search admin-search-icon"></i>
                            <input
                                type="text"
                                placeholder="Search BNI Chapter..."
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
                            <p>Loading BNI Chapters...</p>
                        </div>
                    ) : chapters.length === 0 ? (
                        <div className="admin-table-empty">
                            <i className="fa-solid fa-building-columns"></i>
                            <h3>No BNI Chapters Found</h3>
                            <p>No BNI chapters are available in the system.</p>
                        </div>
                    ) : (
                        <>
                            <DataTable
                                columns={columns}
                                data={chapters}
                                keyField="chapterId"
                                onEdit={(chapter: BNIChapter) => navigate(`/admin/bni-chapters/${chapter.chapterId}/edit`)}
                                onDelete={(chapter: BNIChapter) => setDeleteDialog({ isOpen: true, chapter })}
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
                title="Delete BNI Chapter"
                message={`Are you sure you want to delete chapter "${deleteDialog.chapter?.chapterName}"?`}
                confirmText="Delete"
                type="danger"
                onConfirm={handleDeleteChapter}
                onCancel={() => setDeleteDialog({ isOpen: false, chapter: null })}
            />
        </div>
    );
}
