import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { DailyTask, dailyTaskApi } from '../../services/api/dailyTaskApi';
import { dropdownApi } from '../../services/api/dropdownApi';
import DataTable, { Column } from '../../components/DataTable';
import ConfirmDialog from '../../components/ConfirmDialog';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import PermissionGuard from '../../components/PermissionGuard';
import { usePermissions } from '../../hooks/usePermissions';
import { logError } from '../../utils/logError';
import { formatDate } from '../../utils/dateUtils';
import '../../styles/admin.css';
import '../../styles/admin-components.css';

export default function DailyTaskList() {
    const { user: currentUser } = useAuth();
    const { showSuccess, showError } = useToast();
    const navigate = useNavigate();
    const permissions = usePermissions('DailyTask'); // Assuming 'DailyTask' is the controller name for permissions
    const [tasks, setTasks] = useState<DailyTask[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [statuses, setStatuses] = useState<any[]>([]); // Add state for statuses


    const [searchTerm, setSearchTerm] = useState('');
    const [allTasks, setAllTasks] = useState<DailyTask[]>([]);
    const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; task: DailyTask | null }>({
        isOpen: false,
        task: null
    });

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [entriesPerPage, setEntriesPerPage] = useState(10);
    const [totalRecords, setTotalRecords] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    const [employees, setEmployees] = useState<any[]>([]);
    const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');

    const loadTasks = async (page: number = currentPage, pageSize: number = entriesPerPage, search: string = searchTerm, empId?: string) => {
        try {
            setLoading(true);
            setError(null);

            // Fetch larger batch similar to UserList pattern
            // Pass selectedEmployeeId if it exists (or the one passed in arguments)
            const employeeFilter = empId !== undefined ? empId : selectedEmployeeId;
            const employeeIdNum = employeeFilter ? Number(employeeFilter) : undefined;

            const totalResponse = await dailyTaskApi.getAllDailyTasksPage(0, 1000, 'asc', currentUser?.id ? Number(currentUser.id) : undefined, undefined, employeeIdNum);

            if (totalResponse.success) {
                const fetchedTasks = totalResponse.data || [];
                setAllTasks(fetchedTasks);

                // Global Filter
                const filteredTasks = fetchedTasks.filter(task => {
                    const searchStr = search.toLowerCase();
                    return Object.values(task).some(value =>
                        value !== null &&
                        value !== undefined &&
                        String(value).toLowerCase().includes(searchStr)
                    );
                });

                const totalCount = filteredTasks.length;
                setTotalRecords(totalCount);
                setTotalPages(Math.ceil(totalCount / pageSize));

                // Client-side pagination slice
                const startIndex = (page - 1) * pageSize;
                const endIndex = startIndex + pageSize;
                const pageData = filteredTasks.slice(startIndex, endIndex);

                setTasks(pageData);
            } else {
                setError(totalResponse.message || 'Failed to fetch daily tasks');
                setTasks([]);
                setAllTasks([]);
                setTotalRecords(0);
                setTotalPages(0);
            }
        } catch (err) {
            setError('Network error occurred while fetching daily tasks');
            console.error('Error fetching daily tasks:', err);

            await logError({
                controllerName: 'DailyTaskList',
                methodName: 'LoadTasks',
                requestUrl: 'dailyTaskApi.getAllDailyTasksPage',
                requestPayload: { page, pageSize, search },
                error: err
            });

            setTasks([]);
            setAllTasks([]);
            setTotalRecords(0);
            setTotalPages(0);
        } finally {
            setLoading(false);
        }
    };

    // Load status dropdown
    const loadStatuses = async () => {
        try {
            const statusResponse = await dropdownApi.getLovMaster('taskStatus');
            if (statusResponse.success && statusResponse.data) {
                console.log('✅ Status dropdown loaded:', statusResponse.data);
                setStatuses(statusResponse.data);
            }
        } catch (error) {
            console.error('❌ Error loading statuses:', error);
        }
    };

    // Load Employees for Dropdown
    const loadEmployees = async () => {
        try {
            const response = await dropdownApi.getEmployeesName();
            if (response.success && response.data) {
                setEmployees(response.data);
            }
        } catch (err) {
            console.error("Failed to load employees", err);
        }
    }

    // Handle Search
    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchTerm(value);
        setCurrentPage(1);
        loadTasks(1, entriesPerPage, value);
    };

    // Pagination handlers
    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        loadTasks(page, entriesPerPage, searchTerm);
    };

    const handleEntriesPerPageChange = (newEntriesPerPage: number) => {
        setEntriesPerPage(newEntriesPerPage);
        setCurrentPage(1);
        loadTasks(1, newEntriesPerPage, searchTerm);
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

    const handleViewClick = () => {
        loadTasks(1, entriesPerPage, searchTerm, selectedEmployeeId);
    };

    useEffect(() => {
        loadStatuses(); // Load statuses first
        loadEmployees();
        loadTasks();
    }, [currentUser]);

    const columns: Column<DailyTask>[] = [
        {
            key: 'dailyTaskID',
            label: 'Sr No.',
            width: '80px',
            render: (_: any, __: DailyTask, index: number) => ((currentPage - 1) * entriesPerPage) + index + 1
        },
        {
            key: 'taskTitle',
            label: 'Task Title',
            width: '200px',
            sortable: true
        },
        {
            key: 'projectName',
            label: 'Project Name',
            width: '180px',
            sortable: true
        },
        {
            key: 'workDate',
            label: 'Work Date',
            width: '120px',
            sortable: true,
            render: (value: string) => formatDate(value)
        },
        {
            key: 'hoursSpent',
            label: 'Hours',
            width: '100px',
            sortable: true
        },
        {
            key: 'status',
            label: 'Status',
            width: '120px',
            sortable: true,
            render: (value: any, row: DailyTask) => {
                // Get the status ID from the row
                const statusId = row.taskStatus || row.status || value;

                // Find the status name from the dropdown
                let statusText = 'Pending';
                if (statusId) {
                    const statusObj = statuses.find(s =>
                        String(s.id || s.code || s.value) === String(statusId)
                    );
                    statusText = statusObj ? (statusObj.name || statusObj.text || statusObj.value || statusId) : String(statusId);
                }

                // Define status colors
                const getStatusStyle = (status: string) => {
                    const statusLower = String(status).toLowerCase();

                    if (statusLower.includes('approved')) {
                        return {
                            backgroundColor: '#10b981',
                            color: '#ffffff'
                        };
                    } else if (statusLower.includes('complete')) {
                        return {
                            backgroundColor: '#3b82f6',
                            color: '#ffffff'
                        };
                    } else if (statusLower.includes('inprogress') || statusLower.includes('in progress') || statusLower.includes('in-progress')) {
                        return {
                            backgroundColor: '#10b981',
                            color: '#ffffff'
                        };
                    } else if (statusLower.includes('hold') || statusLower.includes('on hold')) {
                        return {
                            backgroundColor: '#f59e0b',
                            color: '#ffffff'
                        };
                    } else if (statusLower.includes('reject') || statusLower.includes('cancel')) {
                        return {
                            backgroundColor: '#ef4444',
                            color: '#ffffff'
                        };
                    } else {
                        return {
                            backgroundColor: '#6b7280',
                            color: '#ffffff'
                        };
                    }
                };

                const style = getStatusStyle(statusText);

                return (
                    <span style={{
                        display: 'inline-block',
                        padding: '6px 16px',
                        borderRadius: '20px',
                        fontSize: '13px',
                        fontWeight: '600',
                        textAlign: 'center',
                        minWidth: '90px',
                        ...style
                    }}>
                        {statusText}
                    </span>
                );
            }
        }
    ];

    const handleDeleteTask = async () => {
        if (!deleteDialog.task || !deleteDialog.task.dailyTaskID) {
            setError('Cannot delete task: Invalid task ID');
            return;
        }

        try {
            const response = await dailyTaskApi.deleteDailyTask(deleteDialog.task.dailyTaskID);
            if (response.success) {
                await loadTasks();
                setDeleteDialog({ isOpen: false, task: null });
                showSuccess('Daily Task deleted successfully!');
            } else {
                setError(response.message || 'Failed to delete daily task');
            }
        } catch (err) {
            setError('Network error occurred while deleting daily task');
            console.error('Error deleting task:', err);
            await logError({
                controllerName: 'DailyTaskList',
                methodName: 'DeleteTask',
                requestUrl: `dailyTaskApi.deleteDailyTask/${deleteDialog.task.dailyTaskID}`,
                requestPayload: { id: deleteDialog.task.dailyTaskID },
                error: err
            });
        }
    };

    return (
        <div className="admin-page">
            <div className="admin-page-header">
                <div>
                    <h1 className="admin-page-title">Daily Task</h1>
                    <p className="admin-page-subtitle">Manage Your Daily Task</p>
                </div>
                <div className="admin-page-actions">
                    <Link to="/admin/daily-tasks/new" className="admin-btn admin-btn-primary">
                        <i className="fa-solid fa-plus"></i>
                        Add Task
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap' }}>
                        <h2 style={{ margin: 0 }}>{loading ? 'Loading...' : `${totalRecords} Task`}</h2>

                        <div className="admin-search-wrapper">
                            <i className="fa-solid fa-search admin-search-icon"></i>
                            <input
                                type="text"
                                placeholder="Search Task..."
                                value={searchTerm}
                                onChange={handleSearch}
                                className="admin-search-input"
                                onFocus={(e) => e.target.style.borderColor = 'var(--admin-primary)'}
                                onBlur={(e) => e.target.style.borderColor = 'var(--admin-gray-300)'}
                            />
                        </div>

                        {/* Employee Filter - Only for Admins */}
                        {(currentUser?.role?.toLowerCase().includes('admin') || currentUser?.role === 'SA Admin') && (
                            <>
                                <div className="admin-form-group" style={{ margin: 0, minWidth: '200px' }}>
                                    <select
                                        className="admin-form-control"
                                        value={selectedEmployeeId}
                                        onChange={(e) => setSelectedEmployeeId(e.target.value)}
                                        style={{ height: '42px', padding: '6px 12px', lineHeight: '1.5' }}
                                    >
                                        <option value="">Select Employee</option>
                                        {employees.map((emp) => (
                                            <option key={emp.id} value={emp.id}>{emp.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <button
                                    className="admin-btn admin-btn-secondary"
                                    onClick={handleViewClick}
                                    style={{ height: '42px', display: 'flex', alignItems: 'center', gap: '5px' }}
                                >
                                    <i className="fa-solid fa-eye"></i> View
                                </button>
                            </>
                        )}
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
                            <p>Loading Tasks...</p>
                        </div>
                    ) : tasks.length === 0 ? (
                        <div className="admin-table-empty">
                            <i className="fa-solid fa-list-check"></i>
                            <h3>No Tasks Found</h3>
                            <p>You haven't added any daily tasks yet.</p>
                        </div>
                    ) : (
                        <>
                            <DataTable
                                columns={columns}
                                data={tasks}
                                onEdit={(task: DailyTask) => navigate(`/admin/daily-tasks/${task.dailyTaskID}/edit`, { state: { taskData: task } })}
                                onDelete={(task: DailyTask) => setDeleteDialog({ isOpen: true, task })}
                            />

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
                title="Delete Task"
                message={`Are you sure you want to delete task "${deleteDialog.task?.taskTitle}"?`}
                confirmText="Delete"
                type="danger"
                onConfirm={handleDeleteTask}
                onCancel={() => setDeleteDialog({ isOpen: false, task: null })}
            />
        </div>
    );
}
