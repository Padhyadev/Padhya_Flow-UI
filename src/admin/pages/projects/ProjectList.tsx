import React, { useState, useEffect } from 'react';
import { formatDate } from '../../utils/dateUtils';
import { useNavigate } from 'react-router-dom';
import { projectApi, Project } from '../../services/api/projectApi';
import { dropdownApi, DropdownItem } from '../../services/api/dropdownApi';
import DataTable from '../../components/DataTable';
import ConfirmDialog from '../../components/ConfirmDialog';
import { useToast } from '../../context/ToastContext';
import '../../styles/admin.css';
import '../../styles/admin-components.css';

export default function ProjectList() {
    const navigate = useNavigate();
    const { showSuccess, showError } = useToast();

    const [items, setItems] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [entriesPerPage, setEntriesPerPage] = useState(10);
    const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; item: Project | null }>({
        isOpen: false,
        item: null
    });

    // Lookups
    const [projectStatusOptions, setProjectStatusOptions] = useState<DropdownItem[]>([]);
    const [projectTypeOptions, setProjectTypeOptions] = useState<DropdownItem[]>([]);

    // LOV Maps
    const [lovMaps, setLovMaps] = useState<{
        projectType: Record<string, string>;
        projectStatus: Record<string, string>;
    }>({ projectType: {}, projectStatus: {} });

    useEffect(() => {
        loadData();
        loadLookups();
    }, []);

    const loadLookups = async () => {
        try {
            const [statusRes, typeRes] = await Promise.all([
                dropdownApi.getLovMaster('ProjectStatus'),
                dropdownApi.getLovMaster('ProjectType')
            ]);

            const newLovMaps = {
                projectType: {} as Record<string, string>,
                projectStatus: {} as Record<string, string>
            };

            if (statusRes.success) {
                setProjectStatusOptions(statusRes.data || []);
                (statusRes.data || []).forEach(item => {
                    const key = item.code || item.name;
                    newLovMaps.projectStatus[key] = item.name;
                    if (item.name) newLovMaps.projectStatus[item.name] = item.name;
                });
            }

            if (typeRes.success) {
                setProjectTypeOptions(typeRes.data || []);
                (typeRes.data || []).forEach(item => {
                    const key = item.code || item.name;
                    newLovMaps.projectType[key] = item.name;
                    if (item.name) newLovMaps.projectType[item.name] = item.name;
                });
            }

            setLovMaps(newLovMaps);
        } catch (error) {
            console.error('Failed to load lookups', error);
        }
    };

    const loadData = async () => {
        setLoading(true);
        try {
            const response = await projectApi.getAllProjectsPage(0, 100);
            if (response.success && response.data) {
                setItems(response.data);
                setCurrentPage(1);
            } else {
                showError(response.message || 'Failed to load projects');
            }
        } catch (error) {
            console.error('Load projects error:', error);
            showError('An unexpected error occurred while loading projects');
        } finally {
            setLoading(false);
        }
    };

    const filteredItems = items.filter(item =>
        item.projectName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(item.projectType).toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(item.projectStatus).toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Calculate Pagination
    const totalRecords = filteredItems.length;
    const totalPages = Math.ceil(totalRecords / entriesPerPage);
    const startIndex = (currentPage - 1) * entriesPerPage;
    const paginatedData = filteredItems.slice(startIndex, startIndex + entriesPerPage);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const handleEntriesPerPageChange = (value: number) => {
        setEntriesPerPage(value);
        setCurrentPage(1);
    };

    const handleDelete = async () => {
        if (!deleteDialog.item || !deleteDialog.item.projectId) return;
        try {
            const response = await projectApi.deleteProject(deleteDialog.item.projectId);
            if (response.success) {
                showSuccess('Project deleted successfully');
                loadData();
                setDeleteDialog({ isOpen: false, item: null });
            } else {
                showError(response.message || 'Failed to delete project');
            }
        } catch (error) {
            showError('Network error');
        }
    };



    const getLookupName = (options: DropdownItem[], value: any) => {
        if (!value) return '-';
        const found = options.find(opt => String(opt.id) === String(value) || String(opt.value) === String(value));
        return found ? (found.name || found.text || value) : value;
    };

    const columns = [
        {
            key: 'id',
            label: 'Sr No.',
            width: '80px',
            render: (_: any, __: any, index: number) => startIndex + index + 1
        },
        {
            key: 'projectName',
            label: 'Project Name',
            width: '200px',
            sortable: true,
            render: (val: string) => val || '-'
        },
        {
            key: 'clientName',
            label: 'Client Name',
            width: '180px',
            sortable: true,
            render: (val: string) => val || '-'
        },
        {
            key: 'projectType',
            label: 'Project Type',
            width: '150px',
            sortable: true,
            render: (val: string) => lovMaps.projectType[val] || getLookupName(projectTypeOptions, val)
        },
        {
            key: 'startDate',
            label: 'Start Date',
            width: '120px',
            sortable: true,
            render: (val: string) => formatDate(val)
        },
        {
            key: 'expectedEndDate',
            label: 'Expected End Date',
            width: '150px',
            sortable: true,
            render: (val: string) => formatDate(val)
        },
        {
            key: 'projectStatus',
            label: 'Status',
            width: '120px',
            sortable: true,
            render: (val: string) => {
                let statusName = lovMaps.projectStatus[val] || getLookupName(projectStatusOptions, val);

                // Fallback: If value is '1' and lookup failed (returned '1'), map to 'Draft'
                if (String(val) === '1' && String(statusName) === '1') {
                    statusName = 'Draft';
                }

                const statusLower = String(statusName).toLowerCase();

                return (
                    <span style={{
                        padding: '4px 12px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '600',
                        backgroundColor: statusLower === 'active' || statusLower === 'completed' ? 'var(--admin-success-bg)' :
                            statusLower === 'hold' || statusLower === 'pending' || statusLower === 'draft' ? 'var(--admin-warning-bg)' :
                                'var(--admin-gray-200)',
                        color: statusLower === 'active' || statusLower === 'completed' ? 'var(--admin-success)' :
                            statusLower === 'hold' || statusLower === 'pending' || statusLower === 'draft' ? 'var(--admin-warning)' :
                                'var(--admin-gray-700)'
                    }}>
                        {statusName}
                    </span>
                );
            }
        }
    ];

    return (
        <div className="admin-page">
            <div className="admin-page-header">
                <div>
                    <h1 className="admin-page-title">Project Management</h1>
                    <p className="admin-page-subtitle">Manage Project</p>
                </div>
                <div className="admin-page-actions">
                    <button
                        onClick={() => navigate('/admin/projects/new')}
                        className="admin-btn admin-btn-primary"
                    >
                        <i className="fa-solid fa-plus"></i> Add Project
                    </button>
                </div>
            </div>

            <div className="admin-card">
                <div className="admin-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <h2 style={{ margin: 0 }}>{loading ? 'Loading...' : `${totalRecords} Project`}</h2>

                        {/* Search Input */}
                        <div className="admin-search-wrapper">
                            <i className="fa-solid fa-search admin-search-icon"></i>
                            <input
                                type="text"
                                placeholder="Search Project..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="admin-search-input"
                            />
                        </div>
                    </div>

                    {/* Entries Per Page Dropdown */}
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
                    <DataTable
                        columns={columns}
                        data={paginatedData}
                        loading={loading}
                        emptyMessage="No projects found"
                        onEdit={(row: Project) => navigate(`/admin/projects/${row.projectId}/edit`)}
                        onDelete={(row: Project) => setDeleteDialog({ isOpen: true, item: row })}
                    />

                    {/* Pagination Controls */}
                    {totalRecords > 0 && (
                        <div className="admin-pagination">
                            <div className="admin-pagination-info">
                                Showing {startIndex + 1} to {Math.min(startIndex + entriesPerPage, totalRecords)} of {totalRecords} entries
                            </div>
                            <div className="admin-pagination-controls">
                                <button
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className="admin-pagination-btn"
                                >
                                    <i className="fa-solid fa-chevron-left" style={{ fontSize: '11px' }}></i> Previous
                                </button>

                                <div className="admin-pagination-pages">
                                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                                        let pageNum = i + 1;
                                        if (totalPages > 5) {
                                            if (currentPage > 3) {
                                                pageNum = currentPage - 2 + i;
                                            }
                                            if (pageNum > totalPages) pageNum = totalPages - (4 - i);
                                        }
                                        if (pageNum > 0 && pageNum <= totalPages) {
                                            return (
                                                <button
                                                    key={pageNum}
                                                    onClick={() => handlePageChange(pageNum)}
                                                    className={`admin-pagination-btn ${pageNum === currentPage ? 'active' : ''}`}
                                                >
                                                    {pageNum}
                                                </button>
                                            );
                                        }
                                        return null;
                                    })}
                                </div>

                                <button
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    className="admin-pagination-btn"
                                >
                                    Next <i className="fa-solid fa-chevron-right" style={{ fontSize: '11px' }}></i>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <ConfirmDialog
                isOpen={deleteDialog.isOpen}
                title="Delete Project"
                message={`Are you sure you want to delete project "${deleteDialog.item?.projectName}"?`}
                onConfirm={handleDelete}
                onCancel={() => setDeleteDialog({ isOpen: false, item: null })}
                type="danger"
            />
        </div>
    );
}
