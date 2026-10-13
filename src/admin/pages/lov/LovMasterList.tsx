import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { lovApi, LovMasterItem } from '../../services/api/lovApi';
import DataTable from '../../components/DataTable';
import ConfirmDialog from '../../components/ConfirmDialog';
import { useToast } from '../../context/ToastContext';
import '../../styles/admin.css';
import '../../styles/admin-components.css';

export default function LovMasterList() {
    const navigate = useNavigate();
    const { showSuccess, showError } = useToast();

    const [items, setItems] = useState<LovMasterItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [entriesPerPage, setEntriesPerPage] = useState(10);
    const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; item: LovMasterItem | null }>({
        isOpen: false,
        item: null
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        const response = await lovApi.getLovMasterList();
        if (response.success && response.data) {
            setItems(response.data);
            setCurrentPage(1);
        } else {
            showError(response.message || 'Failed to load LOV list');
        }
        setLoading(false);
    };

    const filteredItems = items.filter(item =>
        item.lov_Column?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.display_Text?.toLowerCase().includes(searchTerm.toLowerCase())
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
        if (!deleteDialog.item || !deleteDialog.item.lov_Column) return;
        try {
            const response = await lovApi.deleteLovMaster(deleteDialog.item.lov_Column);
            if (response.success) {
                showSuccess('Deleted successfully');
                loadData();
                setDeleteDialog({ isOpen: false, item: null });
            } else {
                showError(response.message || 'Failed to delete');
            }
        } catch (error) {
            showError('Network error');
        }
    };

    const columns = [
        {
            key: 'id',
            label: 'Sr No.',
            width: '80px',
            render: (_: any, __: any, index: number) => startIndex + index + 1
        },
        {
            key: 'lov_Column',
            label: 'Lov Name',
            width: '250px',
            sortable: true,
            render: (val: string) => val || '-'
        },
        {
            key: 'display_Text',
            label: 'Display Text',
            width: '300px',
            sortable: true,
            render: (val: string) => val || '-'
        }
    ];

    return (
        <div className="admin-page">
            <div className="admin-page-header">
                <div>
                    <h1 className="admin-page-title">LOV Master</h1>
                    <p className="admin-page-subtitle">Manage List Of Value</p>
                </div>
                <div className="admin-page-actions">
                    <button
                        onClick={() => navigate('/admin/lov/new')}
                        className="admin-btn admin-btn-primary"
                    >
                        <i className="fa-solid fa-plus"></i> Add LOV Master
                    </button>
                </div>
            </div>

            <div className="admin-card">
                <div className="admin-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <h2 style={{ margin: 0 }}>{loading ? 'Loading...' : `${totalRecords} item`}</h2>

                        {/* Search Input - Matching UserList */}
                        <div className="admin-search-wrapper">
                            <i className="fa-solid fa-search admin-search-icon"></i>
                            <input
                                type="text"
                                placeholder="Search..."
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
                        </select>
                        <span style={{ fontSize: '14px', color: 'var(--admin-gray-600)' }}>Entries</span>
                    </div>
                </div>
                <div className="admin-card-body" style={{ padding: 0 }}>
                    <DataTable
                        columns={columns}
                        data={paginatedData}
                        loading={loading}
                        emptyMessage="No LOVs found"
                        onView={(row: LovMasterItem) => row.lov_Column && navigate(`/admin/lov/${encodeURIComponent(row.lov_Column)}`)}
                        onEdit={(row: LovMasterItem) => row.lov_Column && navigate(`/admin/lov/${encodeURIComponent(row.lov_Column)}/edit-master`)}
                        onDelete={(row: LovMasterItem) => setDeleteDialog({ isOpen: true, item: row })}
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
                title="Delete LOV Master"
                message={`Are you sure you want to delete LOV "${deleteDialog.item?.lov_Column}"? This will delete all its details.`}
                onConfirm={handleDelete}
                onCancel={() => setDeleteDialog({ isOpen: false, item: null })}
                type="danger"
            />
        </div>
    );
}
