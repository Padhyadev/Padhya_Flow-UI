import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/admin-sidebar.css'; // Updated import to correct global styles
import { PadhyaFlowLogo } from '../components/PadhyaFlowLogo';

interface MenuItem {
    path?: string;
    icon: string;
    label: string;
    roles?: string[];
    submenu?: MenuItem[];
    group?: string; // Added to match logic
}

interface AdminSidebarProps {
    mobileOpen?: boolean;
    closeMobileMenu?: () => void;
}

export default function AdminSidebar({ mobileOpen, closeMobileMenu }: AdminSidebarProps) {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation(); // To check active state for submenus
    const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set());
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    // Mappings for Controllers to Icons/Labels/Groups
    const controllerMap: Record<string, { icon: string, label: string, path: string, group?: string }> = {
        // User Management
        'User': { icon: 'user-gear', label: 'User', path: '/admin/users', group: 'User Management' },
        'Role': { icon: 'user-shield', label: 'Role', path: '/admin/roles', group: 'User Management' },
        'Menu': { icon: 'bars', label: 'Menu', path: '/admin/menus', group: 'User Management' },
        'Lov': { icon: 'list-check', label: 'LOV Master', path: '/admin/lov', group: 'User Management' },

        // Employee Management
        'Employee': { icon: 'users', label: 'Employee', path: '/admin/employees', group: 'Employee Management' },

        // Holiday Management
        'Holiday': { icon: 'calendar-days', label: 'Holiday', path: '/admin/holidays', group: 'Holiday Management' },
        'Holidays': { icon: 'calendar-days', label: 'Holiday', path: '/admin/holidays', group: 'Holiday Management' },
        'HolidayMaster': { icon: 'calendar-days', label: 'Holiday', path: '/admin/holidays', group: 'Holiday Management' },

        // Leave Management
        'LeaveTypes': { icon: 'file-invoice', label: 'Leave Type', path: '/admin/leavetypes', group: 'Leave Management' },
        'LeaveType': { icon: 'file-invoice', label: 'Leave Type', path: '/admin/leavetypes', group: 'Leave Management' },
        'LeaveApplications': { icon: 'file-signature', label: 'Leave Application', path: '/admin/leaveapplications', group: 'Leave Management' },
        'LeaveBalance': { icon: 'calendar-check', label: 'Leave Balance', path: '/admin/leave-balances', group: 'Leave Management' },
        'ShortLeave': { icon: 'clock', label: 'Short Leave', path: '/admin/short-leaves', group: 'Leave Management' },

        // Office Management
        'OfficeExpenseType': { icon: 'money-bill-transfer', label: 'Office Expense Type', path: '/admin/office-expense-types', group: 'Office Management' },
        'OfficeExpense': { icon: 'file-invoice-dollar', label: 'Office Expense', path: '/admin/expenses', group: 'Office Management' },
        'OfficeExpenses': { icon: 'file-invoice-dollar', label: 'Office Expense', path: '/admin/expenses', group: 'Office Management' },

        // Vendor Management
        'Vendor': { icon: 'truck-field', label: 'Vendor', path: '/admin/vendors', group: 'Vendor Management' },
        'VendorMaster': { icon: 'truck-field', label: 'Vendor', path: '/admin/vendors', group: 'Vendor Management' },

        // Country Management
        'Country': { icon: 'globe', label: 'Country', path: '/admin/countries', group: 'Country Management' },
        'CountryMaster': { icon: 'globe', label: 'Country', path: '/admin/countries', group: 'Country Management' },

        // Client Management
        'Client': { icon: 'user-tie', label: 'Client', path: '/admin/clients', group: 'Client Management' },
        'ClientMaster': { icon: 'user-tie', label: 'Client', path: '/admin/clients', group: 'Client Management' },
        'ClientFollowup': { icon: 'clipboard-list', label: 'Client Followup', path: '/admin/client-followups', group: 'Client Management' },
        'Project': { icon: 'diagram-project', label: 'Project', path: '/admin/projects', group: 'Client Management' },
        'ProjectMaster': { icon: 'diagram-project', label: 'Project', path: '/admin/projects', group: 'Client Management' },

        // Task Management
        'DailyTask': { icon: 'list-check', label: 'Daily Task', path: '/admin/daily-tasks', group: 'Task Management' },

        // BNI Management
        'BNIChapter': { icon: 'building-columns', label: 'BNI Chapter', path: '/admin/bni-chapters', group: 'BNI Management' },
        'BNIMember': { icon: 'users', label: 'BNI Member', path: '/admin/bni-members', group: 'BNI Management' },
        'BNIFollowup': { icon: 'clipboard-list', label: 'BNI Followup', path: '/admin/bni-followups', group: 'BNI Management' },
        'BNIMeeting': { icon: 'handshake', label: 'BNI Meeting', path: '/admin/bni-meetings', group: 'BNI Management' },

        // Dashboard (Standalone)
        'Dashboard': { icon: 'chart-line', label: 'Dashboard', path: '/admin/dashboard' },
    };

    // Group Definitions
    const groupDefinitions: Record<string, { icon: string, order: number }> = {
        'User Management': { icon: 'users-gear', order: 1 },
        'Task Management': { icon: 'list-check', order: 2 }, // High priority
        'Client Management': { icon: 'suitcase', order: 3 },
        'Employee Management': { icon: 'id-card', order: 4 },
        'Holiday Management': { icon: 'calendar-check', order: 5 },
        'Leave Management': { icon: 'calendar-minus', order: 6 },
        'BNI Management': { icon: 'building-columns', order: 7 },
        'Property Master': { icon: 'building', order: 8 },
        'Lead Master': { icon: 'funnel-dollar', order: 9 },
        'Service Master': { icon: 'bell-concierge', order: 10 },
        'Cities Master': { icon: 'map-location-dot', order: 11 },
        'Country Management': { icon: 'globe', order: 12 },
        'Office Management': { icon: 'building-user', order: 13 },
        'Vendor Management': { icon: 'truck-field', order: 14 },
    };

    const [dynamicMenuItems, setDynamicMenuItems] = useState<MenuItem[]>([]);

    React.useEffect(() => {
        // Load permissions from localStorage
        const menuPermissionsStr = localStorage.getItem('admin_menu_permissions');

        // Static Dashboard Logic
        const dashboardPath = (() => {
            const r = user?.role?.toLowerCase();
            if (r === 'sales') return '/admin/sales-dashboard';
            if (r === 'data_entry') return '/admin/data-entry-dashboard';
            if (r === 'viewer') return '/admin/viewer-dashboard';
            return '/admin/dashboard';
        })();

        const dashboardItem: MenuItem = {
            path: dashboardPath,
            icon: 'chart-line',
            label: 'Dashboard'
        };

        if (menuPermissionsStr) {
            try {
                const permissions = JSON.parse(menuPermissionsStr);
                const groupedItems: Record<string, MenuItem[]> = {};
                const standaloneItems: MenuItem[] = [];

                if (Array.isArray(permissions)) {
                    permissions.forEach((perm: any) => {
                        const incomingController = (perm.controller || '').toLowerCase();
                        const controllerKey = Object.keys(controllerMap).find(k => k.toLowerCase() === incomingController);
                        const groupKey = Object.keys(groupDefinitions).find(g => g.toLowerCase() === incomingController);

                        if (controllerKey) {
                            const config = controllerMap[controllerKey];
                            if (config.label.toLowerCase() === 'dashboard') return;
                            const menuItem: MenuItem = {
                                path: config.path,
                                icon: config.icon,
                                label: config.label
                            };
                            addItemToMenu(menuItem, config.group);
                        }
                        else if (groupKey) {
                            Object.values(controllerMap).forEach(config => {
                                if (config.group && config.group.toLowerCase() === groupKey.toLowerCase()) {
                                    const menuItem: MenuItem = {
                                        path: config.path,
                                        icon: config.icon,
                                        label: config.label
                                    };
                                    addItemToMenu(menuItem, config.group);
                                }
                            });
                        }
                    });
                }

                function addItemToMenu(item: MenuItem, group?: string) {
                    if (group) {
                        if (!groupedItems[group]) {
                            groupedItems[group] = [];
                        }
                        if (!groupedItems[group].find(i => i.path === item.path)) {
                            groupedItems[group].push(item);
                        }
                    } else {
                        if (!standaloneItems.find(i => i.path === item.path)) {
                            standaloneItems.push(item);
                        }
                    }
                }

                // Fallback for Admin / SA Admin to ensure Leave Management (and others) are visible if permissions are missing (e.g. dev environment)
                const userRole = user?.role?.toLowerCase();
                if (userRole === 'sa admin' || userRole === 'admin') {
                    // Check if Task Management is missing
                    if (!groupedItems['Task Management']) {
                        groupedItems['Task Management'] = [];
                        groupedItems['Task Management'].push({
                            path: '/admin/daily-tasks',
                            icon: 'list-check',
                            label: 'Daily Task'
                        });
                    }

                    // Check if Leave Management is missing
                    if (!groupedItems['Leave Management']) {
                        groupedItems['Leave Management'] = [];
                        groupedItems['Leave Management'].push({
                            path: '/admin/leavetypes',
                            icon: 'file-invoice',
                            label: 'Leave Types'
                        });
                        groupedItems['Leave Management'].push({
                            path: '/admin/leaveapplications',
                            icon: 'file-signature',
                            label: 'Leave Applications'
                        });
                        groupedItems['Leave Management'].push({
                            path: '/admin/leave-balances',
                            icon: 'calendar-check',
                            label: 'Leave Balance'
                        });
                        groupedItems['Leave Management'].push({
                            path: '/admin/short-leaves',
                            icon: 'clock',
                            label: 'Short Leaves'
                        });
                    }

                    // Check if Office Management is missing or incomplete
                    if (!groupedItems['Office Management']) {
                        groupedItems['Office Management'] = [];
                    }

                    const officeManagementGroup = groupedItems['Office Management'];

                    // Add Office Expense Type if missing
                    if (!officeManagementGroup.find(i => i.path === '/admin/office-expense-types')) {
                        officeManagementGroup.push({
                            path: '/admin/office-expense-types',
                            icon: 'money-bill-transfer',
                            label: 'Office Expense Type'
                        });
                    }

                    // Add Office Expenses if missing
                    if (!officeManagementGroup.find(i => i.path === '/admin/expenses')) {
                        officeManagementGroup.push({
                            path: '/admin/expenses',
                            icon: 'file-invoice-dollar',
                            label: 'Office Expense'
                        });
                    }

                    // Add Office Expense Category Summary if missing
                    if (!officeManagementGroup.find(i => i.path === '/admin/expenses/category-summary')) {
                        officeManagementGroup.push({
                            path: '/admin/expenses/category-summary',
                            icon: 'chart-pie',
                            label: 'Expense Category Summary'
                        });
                    }

                    // Check if Vendor Management is missing
                    if (!groupedItems['Vendor Management']) {
                        groupedItems['Vendor Management'] = [];
                        groupedItems['Vendor Management'].push({
                            path: '/admin/vendors',
                            icon: 'truck-field',
                            label: 'Vendor'
                        });
                    }

                    // Check if User Management needs LOV
                    if (!groupedItems['User Management']) {
                        groupedItems['User Management'] = [];
                    }
                    const userManagementGroup = groupedItems['User Management'];
                    if (!userManagementGroup.find(i => i.path === '/admin/lov')) {
                        userManagementGroup.push({
                            path: '/admin/lov',
                            icon: 'list-check',
                            label: 'LOV Master'
                        });
                    }

                    // Check if Client Management is missing
                    if (!groupedItems['Client Management']) {
                        groupedItems['Client Management'] = [];
                        groupedItems['Client Management'].push({
                            path: '/admin/clients',
                            icon: 'user-tie',
                            label: 'Client'
                        });
                    }

                    // Add Client Followups to Client Management if missing
                    const clientManagementGroup = groupedItems['Client Management'];
                    if (!clientManagementGroup.find(i => i.path === '/admin/client-followups')) {
                        clientManagementGroup.push({
                            path: '/admin/client-followups',
                            icon: 'clipboard-list',
                            label: 'Client Followup'
                        });
                    }

                    // Add Projects to Client Management if missing
                    if (!clientManagementGroup.find(i => i.path === '/admin/projects')) {
                        clientManagementGroup.push({
                            path: '/admin/projects',
                            icon: 'diagram-project',
                            label: 'Project'
                        });
                    }

                    // Check if Country Management is missing
                    if (!groupedItems['Country Management']) {
                        groupedItems['Country Management'] = [];
                        groupedItems['Country Management'].push({
                            path: '/admin/countries',
                            icon: 'globe',
                            label: 'Countrie'
                        });
                    }

                    // Check if BNI Management is missing
                    if (!groupedItems['BNI Management']) {
                        groupedItems['BNI Management'] = [];
                        groupedItems['BNI Management'].push({
                            path: '/admin/bni-chapters',
                            icon: 'building-columns',
                            label: 'BNI Chapter'
                        });
                    }

                    const bniManagementGroup = groupedItems['BNI Management'];
                    // Ensure BNI Members is present
                    if (!bniManagementGroup.find(i => i.path === '/admin/bni-members')) {
                        bniManagementGroup.push({
                            path: '/admin/bni-members',
                            icon: 'users',
                            label: 'BNI Member'
                        });
                    }

                    // Ensure BNI Followups is present
                    if (!bniManagementGroup.find(i => i.path === '/admin/bni-followups')) {
                        bniManagementGroup.push({
                            path: '/admin/bni-followups',
                            icon: 'clipboard-list',
                            label: 'BNI Followup'
                        });
                    }

                    // Ensure BNI Meetings is present
                    if (!bniManagementGroup.find(i => i.path === '/admin/bni-meetings')) {
                        bniManagementGroup.push({
                            path: '/admin/bni-meetings',
                            icon: 'handshake',
                            label: 'BNI Meeting'
                        });
                    }

                }

                const finalMenu: MenuItem[] = [dashboardItem];
                Object.keys(groupedItems)
                    .sort((a, b) => (groupDefinitions[a]?.order || 99) - (groupDefinitions[b]?.order || 99))
                    .forEach(groupName => {
                        finalMenu.push({
                            label: groupName,
                            icon: groupDefinitions[groupName]?.icon || 'folder',
                            submenu: groupedItems[groupName]
                        });
                    });
                finalMenu.push(...standaloneItems);
                setDynamicMenuItems(finalMenu);
            } catch (e) {
                console.error('Error parsing menu permissions', e);
                setDynamicMenuItems([dashboardItem]);
            }
        } else {
            setDynamicMenuItems([dashboardItem]);
        }
    }, [user]);

    const menuItems = dynamicMenuItems;

    const toggleMenu = (label: string) => {
        setExpandedMenus((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(label)) {
                newSet.delete(label);
            } else {
                newSet.add(label);
            }
            return newSet;
        });
    };

    const toggleSidebar = () => {
        setIsSidebarCollapsed(!isSidebarCollapsed);
    };

    const handleLogout = async () => {
        await logout();
        navigate('/admin/login');
    };

    const hasAccess = (roles?: string[]): boolean => {
        if (!roles || roles.length === 0) return true;
        if (!user) return false;
        const userRole = user.role?.toLowerCase();
        if (userRole === 'sa admin' || userRole === 'sa_admin') return true;
        return roles.some(role => role.toLowerCase() === userRole);
    };

    // Helper to check if any child of a group is active
    const isGroupActive = (submenu: MenuItem[]) => {
        return submenu.some(item => location.pathname === item.path || location.pathname.startsWith(item.path + '/'));
    };

    const renderMenuItem = (item: MenuItem, index: number) => {
        if (!hasAccess(item.roles)) return null;

        const hasChildren = item.submenu && item.submenu.length > 0;

        // Auto-expand if active child
        // React.useEffect(() => {
        //    if (hasChildren && isGroupActive(item.submenu!) && !expandedMenus.has(item.label)) {
        //        toggleMenu(item.label);
        //    }
        // }, [location.pathname]); 
        // Note: Side-effects in render is bad, handle state init normally or just use className. 
        // For now, let's just style it active.

        const isExpanded = expandedMenus.has(item.label);
        const hasActiveChild = hasChildren && isGroupActive(item.submenu!);

        if (hasChildren) {
            const visibleSubmenu = item.submenu!.filter(sub => hasAccess(sub.roles));
            if (visibleSubmenu.length === 0) return null;

            return (
                <li key={index}>
                    <div
                        className={`admin-menu-master ${isExpanded ? 'expanded' : ''} ${hasActiveChild ? 'has-active' : ''}`}
                        onClick={() => toggleMenu(item.label)}
                    >
                        <i className={`fas fa-${item.icon}`}></i>
                        <span>{item.label}</span>
                        <i className="fas fa-chevron-right admin-submenu-toggle-icon"></i>
                    </div>
                    {isExpanded && (
                        <ul className="admin-submenu">
                            {visibleSubmenu.map((child, childIndex) => (
                                <li key={childIndex}>
                                    <NavLink
                                        to={child.path!}
                                        onClick={closeMobileMenu}
                                        className={({ isActive }) => isActive ? 'active' : ''}
                                    >
                                        <i className={`fas fa-${child.icon}`}></i>
                                        <span>{child.label}</span>
                                    </NavLink>
                                </li>
                            ))}
                        </ul>
                    )}
                </li>
            );
        }

        return (
            <li key={index}>
                <NavLink
                    to={item.path!}
                    onClick={closeMobileMenu}
                >
                    <i className={`fas fa-${item.icon}`}></i>
                    <span>{item.label}</span>
                </NavLink>
            </li>
        );
    };

    return (
        <aside className={`admin-sidebar ${isSidebarCollapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
            {/* Sidebar Header */}
            <div className="admin-sidebar-header">
                <div className="admin-sidebar-logo">
                    <PadhyaFlowLogo size="small" />
                    <span>Padhya Flow</span>
                </div>
                <button className="admin-sidebar-toggle" onClick={toggleSidebar} title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}>
                    <i className={`fas fa-angles-${isSidebarCollapsed ? 'right' : 'left'}`}></i>
                </button>
            </div>

            {/* Sidebar Menu */}
            <div className="admin-sidebar-nav">
                <ul className="admin-sidebar-menu">
                    {menuItems.map((item, index) => renderMenuItem(item, index))}
                </ul>
            </div>

            {/* Sidebar Footer */}
            <div className="admin-sidebar-footer">
                <div className="admin-sidebar-user">
                    <div className="admin-user-avatar">
                        <i className="fas fa-user"></i>
                    </div>
                    <div className="admin-user-info">
                        <span className="admin-user-name">{user?.name || 'Admin'}</span>
                        <span className="admin-user-role">{user?.role || 'Admin'}</span>
                    </div>
                </div>
            </div>
        </aside>
    );
}
