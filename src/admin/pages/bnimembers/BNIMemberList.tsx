import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BNIMember, bniMemberApi } from '../../services/api/bniMemberApi';
import DataTable, { Column } from '../../components/DataTable';
import ConfirmDialog from '../../components/ConfirmDialog';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import '../../styles/admin.css';
import '../../styles/admin-components.css';

export default function BNIMemberList() {
    const { user: currentUser } = useAuth();
    const { showSuccess, showError } = useToast();
    const navigate = useNavigate();

    const [members, setMembers] = useState<BNIMember[]>([]);
    const [allMembers, setAllMembers] = useState<BNIMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; member: BNIMember | null }>({
        isOpen: false,
        member: null
    });

    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [entriesPerPage, setEntriesPerPage] = useState(10);
    const [totalRecords, setTotalRecords] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    const [chapterMap, setChapterMap] = useState<Record<string, string>>({});

    useEffect(() => {
        loadChapterMap();
    }, []);

    const loadChapterMap = async () => {
        try {
            const response = await bniMemberApi.getBNIChapterDropdown();
            if (response.success) {
                const mapping: Record<string, string> = {};
                response.data.forEach(item => {
                    // Map both ID and Code (if exists) to Name
                    mapping[item.id] = item.name;
                    if (item.code) mapping[item.code] = item.name;
                    mapping[item.name] = item.name; // Self-map for safety
                });
                setChapterMap(mapping);
            }
        } catch (error) {
            console.error('Error loading chapter map:', error);
        }
    };

    const loadMembers = async (page: number = currentPage, pageSize: number = entriesPerPage, search: string = searchTerm) => {
        try {
            setLoading(true);
            setError(null);

            const response = await bniMemberApi.getAllMembers(0, 1000, 'asc');

            if (response.success) {
                const fetchedMembers = response.data || [];
                setAllMembers(fetchedMembers);

                // Global Filter
                const filteredMembers = fetchedMembers.filter(member => {
                    const searchStr = search.toLowerCase();
                    return Object.values(member).some(value =>
                        value !== null &&
                        value !== undefined &&
                        String(value).toLowerCase().includes(searchStr)
                    );
                });

                const totalCount = filteredMembers.length;
                setTotalRecords(totalCount);
                setTotalPages(Math.ceil(totalCount / pageSize));

                // Paginate
                const startIndex = (page - 1) * pageSize;
                const endIndex = startIndex + pageSize;
                const pageData = filteredMembers.slice(startIndex, endIndex);

                setMembers(pageData);
            } else {
                setError(response.message || 'Failed to fetch BNI members');
                setMembers([]);
                setAllMembers([]);
                setTotalRecords(0);
                setTotalPages(0);
            }
        } catch (err) {
            setError('Network error occurred while fetching BNI members');
            console.error('Error fetching BNI members:', err);
            setMembers([]);
            setAllMembers([]);
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
        loadMembers(1, entriesPerPage, value);
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        loadMembers(page, entriesPerPage, searchTerm);
    };

    const handleEntriesPerPageChange = (newEntriesPerPage: number) => {
        setEntriesPerPage(newEntriesPerPage);
        setCurrentPage(1);
        loadMembers(1, newEntriesPerPage, searchTerm);
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
        loadMembers();
    }, [currentUser]);

    const columns: Column<BNIMember>[] = [
        {
            key: 'memberId',
            label: 'Sr No.',
            width: '80px',
            render: (_: any, __: BNIMember, index: number) => ((currentPage - 1) * entriesPerPage) + index + 1
        },
        {
            key: 'memberName',
            label: 'Member Name',
            width: '200px',
            sortable: true,
            render: (value: string) => <span style={{ fontWeight: 500 }}>{value || '-'}</span>
        },
        {
            key: 'companyName',
            label: 'Company Name',
            width: '200px',
            sortable: true,
            render: (value: string) => value || '-'
        },
        {
            key: 'chapterName',
            label: 'Chapter Name',
            width: '180px',
            sortable: true,
            render: (value: string, row: BNIMember) => {
                // Try to resolve name using map via ID, or use value if present
                return chapterMap[row.chapterId] || chapterMap[value] || value || '-';
            }
        },
        {
            key: 'mobile',
            label: 'Mobile',
            width: '120px',
            sortable: true,
            render: (value: string) => value || '-'
        },
        {
            key: 'email',
            label: 'Email',
            width: '200px',
            sortable: true,
            render: (value: string) => value || '-'
        }
    ];

    const handleDeleteMember = async () => {
        if (!deleteDialog.member) return;
        if (!deleteDialog.member.memberId) {
            setError('Cannot delete member: Invalid member ID');
            return;
        }

        try {
            const operatedBy = currentUser?.id ? parseInt(currentUser.id) : 1;
            const response = await bniMemberApi.deleteMember(deleteDialog.member.memberId, operatedBy);
            if (response.success) {
                await loadMembers();
                setDeleteDialog({ isOpen: false, member: null });
                showSuccess('BNI Member deleted successfully!');
            } else {
                setError(response.message || 'Failed to delete BNI member');
            }
        } catch (err) {
            setError('Network error occurred while deleting BNI member');
            console.error('Error deleting BNI member:', err);
        }
    };

    return (
        <div className="admin-page">
            <div className="admin-page-header">
                <div>
                    <h1 className="admin-page-title">BNI Member</h1>
                    <p className="admin-page-subtitle">Manage BNI Member Information</p>
                </div>
                <div className="admin-page-actions">
                    <Link to="/admin/bni-members/new" className="admin-btn admin-btn-primary">
                        <i className="fa-solid fa-plus"></i>
                        Add BNI Member
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
                        <h2 style={{ margin: 0 }}>{loading ? 'Loading...' : `${totalRecords} BNI Member`}</h2>

                        <div className="admin-search-wrapper">
                            <i className="fa-solid fa-search admin-search-icon"></i>
                            <input
                                type="text"
                                placeholder="Search BNI Member..."
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
                            <p>Loading BNI Members...</p>
                        </div>
                    ) : members.length === 0 ? (
                        <div className="admin-table-empty">
                            <i className="fa-solid fa-users"></i>
                            <h3>No BNI Members Found</h3>
                            <p>No BNI members are available in the system.</p>
                        </div>
                    ) : (
                        <>
                            <DataTable
                                columns={columns}
                                data={members}
                                keyField="memberId"
                                onEdit={(member: BNIMember) => navigate(`/admin/bni-members/${member.memberId}/edit`)}
                                onDelete={(member: BNIMember) => setDeleteDialog({ isOpen: true, member })}
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
                title="Delete BNI Member"
                message={`Are you sure you want to delete member "${deleteDialog.member?.memberName}"?`}
                confirmText="Delete"
                type="danger"
                onConfirm={handleDeleteMember}
                onCancel={() => setDeleteDialog({ isOpen: false, member: null })}
            />
        </div>
    );
}
