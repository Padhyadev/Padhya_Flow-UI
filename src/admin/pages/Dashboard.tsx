import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { dashboardApi } from '../services/api/dashboardApi';
import '../styles/admin-dashboard.css';

export default function AdminDashboard() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [pendingCount, setPendingCount] = useState<number | null>(null);
    const [pendingLoading, setPendingLoading] = useState(false);
    const [pendingLeavesCount, setPendingLeavesCount] = useState<number | null>(null);
    const [pendingLeavesLoading, setPendingLeavesLoading] = useState(false);
    const [pendingBNICount, setPendingBNICount] = useState<number | null>(null);
    const [pendingBNILoading, setPendingBNILoading] = useState(false);
    const [upcomingMeetingsCount, setUpcomingMeetingsCount] = useState<number | null>(null);
    const [upcomingMeetingsLoading, setUpcomingMeetingsLoading] = useState(false);

    useEffect(() => {
        const fetchPendingTotal = async () => {
            try {
                setPendingLoading(true);
                const res = await dashboardApi.getPendingClientFollowups(0, 500, 'asc');
                if (res.success && res.data) {
                    setPendingCount(res.data.length);
                } else {
                    setPendingCount(0);
                }
            } catch (err) {
                console.error('Pending Followups Fetch Error:', err);
                setPendingCount(0);
            } finally {

                setPendingLoading(false);
            }
        };

        const fetchPendingLeaves = async () => {
            try {
                setPendingLeavesLoading(true);
                const res = await dashboardApi.getPendingLeaveApplications(0, 500, 'asc');
                if (res.success && res.data) {
                    setPendingLeavesCount(res.data.length);
                } else {
                    setPendingLeavesCount(0);
                }
            } catch (err) {
                console.error('Pending Leaves Fetch Error:', err);
                setPendingLeavesCount(0);
            } finally {
                setPendingLeavesLoading(false);
            }
        };

        const fetchPendingBNIFollowups = async () => {
            try {
                setPendingBNILoading(true);
                const res = await dashboardApi.getPendingBNIFollowups(0, 500, 'asc');
                if (res.success && res.data) {
                    setPendingBNICount(res.data.length);
                } else {
                    setPendingBNICount(0);
                }
            } catch (err) {
                console.error('Pending BNI Followups Fetch Error:', err);
                setPendingBNICount(0);
            } finally {
                setPendingBNILoading(false);
            }
        };

        const fetchUpcomingMeetings = async () => {
            try {
                setUpcomingMeetingsLoading(true);
                const res = await dashboardApi.getNext5DaysBNIMeetings(0, 500, 'asc');
                if (res.success && res.data) {
                    setUpcomingMeetingsCount(res.data.length);
                } else {
                    setUpcomingMeetingsCount(0);
                }
            } catch (err) {
                console.error('Upcoming Meetings Fetch Error:', err);
                setUpcomingMeetingsCount(0);
            } finally {
                setUpcomingMeetingsLoading(false);
            }
        };

        fetchPendingTotal();
        fetchPendingLeaves();
        fetchPendingBNIFollowups();
        fetchUpcomingMeetings();
    }, [user]);

    return (
        <div className="admin-dashboard">
            {/* Page Header */}
            <div className="admin-page-header">
                <div>
                    <h1 className="admin-page-title">Welcome Back, {user?.name || 'Admin'}!</h1>
                    <p className="admin-page-subtitle">
                        Role: <strong>{user?.role || 'N/A'}</strong> • Control Panel
                    </p>
                </div>
            </div>

            {/* Dashboard Stats - Row 1 */}
            {/* Dashboard Stats - Unified Grid Layout (2-2-1 Sequence) */}
            <div className="admin-stats-grid">
                {/* 1. Pending Followups */}
                <div
                    className="admin-stat-card bg-c-blue"
                    onClick={() => navigate('/admin/pending-followups')}
                >
                    <div className="admin-stat-icon-wrapper">
                        <i className="fa-solid fa-clipboard-check"></i>
                    </div>

                    <div className="admin-stat-info">
                        <p className="admin-stat-label">Next 5 Day Pending Followup</p>
                        <h3 className="admin-stat-value">
                            {pendingLoading ? '...' : (pendingCount ?? 0)}
                        </h3>
                        <div className="admin-stat-action">
                            <span>View Details</span>
                            <i className="fa-solid fa-arrow-right"></i>
                        </div>
                    </div>
                </div>

                {/* 2. Pending BNI Followups */}
                <div
                    className="admin-stat-card bg-c-pink"
                    onClick={() => navigate('/admin/pending-bni-followups')}
                >
                    <div className="admin-stat-icon-wrapper">
                        <i className="fa-solid fa-handshake"></i>
                    </div>

                    <div className="admin-stat-info">
                        <p className="admin-stat-label">Next 5 Day Pending BNI Followup</p>
                        <h3 className="admin-stat-value">
                            {pendingBNILoading ? '...' : (pendingBNICount ?? 0)}
                        </h3>
                        <div className="admin-stat-action">
                            <span>View Followups</span>
                            <i className="fa-solid fa-arrow-right"></i>
                        </div>
                    </div>
                </div>

                {/* 3. Pending Leaves */}
                <div
                    className="admin-stat-card bg-c-yellow"
                    onClick={() => navigate('/admin/pending-leave-applications')}
                >
                    <div className="admin-stat-icon-wrapper">
                        <i className="fa-solid fa-calendar-days"></i>
                    </div>

                    <div className="admin-stat-info">
                        <p className="admin-stat-label">Upcoming 60 Day Pending Leave</p>
                        <h3 className="admin-stat-value">
                            {pendingLeavesLoading ? '...' : (pendingLeavesCount ?? 0)}
                        </h3>
                        <div className="admin-stat-action">
                            <span>View Applications</span>
                            <i className="fa-solid fa-arrow-right"></i>
                        </div>
                    </div>
                </div>

                {/* 4. Upcoming BNI Meetings */}
                <div
                    className="admin-stat-card bg-c-green"
                    onClick={() => navigate('/admin/upcoming-bni-meetings')}
                >
                    <div className="admin-stat-icon-wrapper">
                        <i className="fa-solid fa-users"></i>
                    </div>

                    <div className="admin-stat-info">
                        <p className="admin-stat-label">Upcoming 5 Day BNI Meetings</p>
                        <h3 className="admin-stat-value">
                            {upcomingMeetingsLoading ? '...' : (upcomingMeetingsCount ?? 0)}
                        </h3>
                        <div className="admin-stat-action">
                            <span>View Meetings</span>
                            <i className="fa-solid fa-arrow-right"></i>
                        </div>
                    </div>
                </div>

                {/* 5. Approved Leave History */}
                <div
                    className="admin-stat-card bg-c-violet"
                    onClick={() => navigate('/admin/approved-leaves')}
                >
                    <div className="admin-stat-icon-wrapper">
                        <i className="fa-solid fa-calendar-check"></i>
                    </div>

                    <div className="admin-stat-info">
                        <p className="admin-stat-label">Approved Leaves</p>
                        <h3 className="admin-stat-value">History</h3>
                        <div className="admin-stat-action">
                            <span>View History</span>
                            <i className="fa-solid fa-arrow-right"></i>
                        </div>
                    </div>
                </div>
            </div>

            {/* Empty Dashboard Content */}
            <div className="admin-dashboard-empty">
                {/* Content has been removed as per user request */}
            </div>
        </div>
    );
}
