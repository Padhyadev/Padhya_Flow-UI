import React, { useState, useEffect } from 'react';
import { formatDate } from '../../utils/dateUtils';
import { useNavigate } from 'react-router-dom';
import { dashboardApi } from '../../services/api/dashboardApi';
import { employeeApi, EmployeeDropdownItem } from '../../services/api/employeeApi';
import { leaveTypesApi, LeaveType } from '../../services/api/leaveTypesApi';
import DataTable from '../../components/DataTable';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import '../../styles/admin.css';
import '../../styles/admin-components.css';

export default function ApprovedLeaveHistoryList() {
    const { showSuccess, showError } = useToast();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [leaves, setLeaves] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [allLeaves, setAllLeaves] = useState<any[]>([]);

    // Dynamic Filter States
    const [selectedYear, setSelectedYear] = useState<number | string>('');
    const [selectedEmployee, setSelectedEmployee] = useState<number>(0);
    const [selectedLeaveType, setSelectedLeaveType] = useState<number>(0);

    // Dropdown Data
    const [employees, setEmployees] = useState<EmployeeDropdownItem[]>([]);
    const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
    const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i);

    const loadDropdownData = async () => {
        try {
            const [empRes, leaveRes] = await Promise.all([
                employeeApi.getEmployeeDropdown(),
                leaveTypesApi.getAllLeaveTypesPage(0, 500)
            ]);

            if (empRes.success) setEmployees(empRes.data || []);
            if (leaveRes.success) setLeaveTypes(leaveRes.data || []);
        } catch (err) {
            console.error('Failed to load dropdowns:', err);
        }
    };

    const loadLeaves = async () => {
        // Validation: Must have Year OR (Employee AND Leave Type)
        const hasYear = selectedYear && String(selectedYear).trim().length === 4;
        const hasFilters = selectedEmployee !== 0 && selectedLeaveType !== 0;

        // If neither specific filters nor a valid year is present, do not load
        if (!hasYear && !hasFilters) {
            setLeaves([]);
            setAllLeaves([]);
            setTotalRecords(0);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            // Fallback: Use GetAllPage and filter manually since Dashboard API is returning empty
            // Get a large batch of leaves
            const response = await import('../../services/api/leaveApplicationApi').then(m => m.leaveApplicationApi.getAllLeaveApplicationsPage(0, 2000));

            if (response.success) {
                let rawData = response.data || [];

                // Map and Filter Logic
                let data = rawData.map((item: any) => ({
                    ...item,
                    // Ensure leaveType (string name) is populated for the UI
                    leaveType: item.leaveType || item.leaveTypeName || item.LeaveTypeName || item.leaveName || ''
                })).filter((item: any) => {
                    // Robust Status Check
                    const statusVal = String(item.status || '');
                    const leaveStatusVal = String(item.leaveStatus || '').toLowerCase();

                    // Check logic: Status '3' usually identifying approved, or text contains 'approv'
                    const isApproved =
                        statusVal === '3' ||
                        statusVal.toLowerCase() === 'approved' ||
                        leaveStatusVal === 'approved' ||
                        leaveStatusVal.includes('approv');

                    if (!isApproved) return false;

                    const leaveYear = new Date(item.fromDate).getFullYear();
                    const yearMatch = !selectedYear || leaveYear === Number(selectedYear);
                    const empMatch = selectedEmployee === 0 || item.employeeId === selectedEmployee;
                    const typeMatch = selectedLeaveType === 0 || item.leaveTypeId === selectedLeaveType;

                    return yearMatch && empMatch && typeMatch;
                });

                setAllLeaves(data);
                filterAndPaginate(data, searchTerm, currentPage, entriesPerPage);
            } else {
                setError(response.message || 'Failed to fetch leave history');
                setLeaves([]);
            }
        } catch (err) {
            setError('Network error occurred');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Pagination constants
    const [currentPage, setCurrentPage] = useState(1);
    const [entriesPerPage, setEntriesPerPage] = useState(10);
    const [totalRecords, setTotalRecords] = useState(0);

    const filterAndPaginate = (data: any[], search: string, page: number, size: number) => {
        let filtered = data;
        if (search) {
            const lowerSearch = search.toLowerCase();
            filtered = data.filter(item =>
                (item.employeeName || '').toLowerCase().includes(lowerSearch) ||
                (item.leaveType || '').toLowerCase().includes(lowerSearch) ||
                (item.reason || '').toLowerCase().includes(lowerSearch)
            );
        }

        setTotalRecords(filtered.length);
        const start = (page - 1) * size;
        setLeaves(filtered.slice(start, start + size));
    };

    useEffect(() => {
        loadDropdownData();
    }, []);

    useEffect(() => {
        loadLeaves();
    }, [selectedEmployee, selectedLeaveType]);

    useEffect(() => {
        filterAndPaginate(allLeaves, searchTerm, currentPage, entriesPerPage);
    }, [searchTerm, currentPage, entriesPerPage, allLeaves]);



    const columns = [
        {
            key: 'id',
            label: 'Sr No.',
            render: (_: any, __: any, index: number) => ((currentPage - 1) * entriesPerPage) + index + 1
        },
        {
            key: 'employeeName',
            label: 'Employee',
            sortable: true,
            render: (val: string) => val || '-'
        },
        {
            key: 'leaveType',
            label: 'Leave Type',
            sortable: true,
            render: (val: string) => val || '-'
        },
        {
            key: 'fromDate',
            label: 'From Date',
            sortable: true,
            render: (val: string) => formatDate(val)
        },
        {
            key: 'toDate',
            label: 'To Date',
            sortable: true,
            render: (val: string) => formatDate(val)
        },
        {
            key: 'totalDays',
            label: 'Days',
            render: (val: any) => val || '0'
        },
        {
            key: 'status',
            label: 'Status',
            render: () => <span style={{ color: 'var(--admin-success)', fontWeight: '600' }}>Approved</span>
        }
    ];

    return (
        <div className="admin-page">
            <div className="admin-page-header">
                <div>
                    <h1 className="admin-page-title">Approved Leave History</h1>
                    {/* <p className="admin-page-subtitle">Historical Record Of Approved Employee Leaves</p> */}
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
                <div className="admin-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '20px', padding: '20px', flexWrap: 'nowrap' }}>
                    <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flex: 1, flexWrap: 'nowrap' }}>
                        {/* Manual Year Input - Plain Text */}
                        {/* Manual Year Input - Plain Text */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div className="admin-form-group" style={{ margin: 0, minWidth: '100px' }}>
                                <input
                                    type="text"
                                    className="admin-form-control"
                                    placeholder="Year"
                                    value={selectedYear}
                                    onChange={(e) => setSelectedYear(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') loadLeaves();
                                    }}
                                    style={{ textAlign: 'center' }}
                                />
                            </div>
                            <button
                                className="admin-btn admin-btn-primary"
                                style={{ height: '42px', padding: '0 15px' }}
                                onClick={loadLeaves}
                            >
                                View
                            </button>
                        </div>

                        {/* Employee Filter */}
                        <div className="admin-form-group" style={{ margin: 0, minWidth: '200px' }}>
                            <select
                                className="admin-form-control"
                                value={selectedEmployee}
                                onChange={(e) => setSelectedEmployee(Number(e.target.value))}
                            >
                                <option value={0}>Select Employee</option>
                                {employees.map(emp => (
                                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Leave Type Filter */}
                        <div className="admin-form-group" style={{ margin: 0, minWidth: '180px' }}>
                            <select
                                className="admin-form-control"
                                value={selectedLeaveType}
                                onChange={(e) => setSelectedLeaveType(Number(e.target.value))}
                            >
                                <option value={0}>Select Leave Type</option>
                                {leaveTypes.map(lt => (
                                    <option key={lt.leaveTypeId} value={lt.leaveTypeId}>{lt.leaveName}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="admin-search-wrapper" style={{ minWidth: '250px' }}>
                        <i className="fa-solid fa-search admin-search-icon"></i>
                        <input
                            type="text"
                            placeholder="Search In Result..."
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                            className="admin-search-input"
                        />
                    </div>
                </div>

                <div className="admin-card-body" style={{ padding: 0 }}>
                    <DataTable
                        columns={columns}
                        data={leaves}
                        loading={loading}
                        emptyMessage="No Approved Leave History Found"
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
