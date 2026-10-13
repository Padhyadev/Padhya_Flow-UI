import React, { lazy, Suspense } from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';

// Admin Panel Imports
import { AuthProvider } from './admin/context/AuthContext';
import { PermissionProvider } from './admin/context/PermissionContext';
import { ToastProvider } from './admin/context/ToastContext';
import AdminLogin from './admin/pages/Login';
import ForgotPassword from './admin/pages/ForgotPassword';
import AdminLayout from './admin/layout/AdminLayout';
import AdminDashboard from './admin/pages/Dashboard';
import ProtectedRoute from './admin/components/ProtectedRoute';
import RoleGuard from './admin/components/RoleGuard';
import AccessDenied from './admin/pages/AccessDenied';
import LoadingSpinner from './admin/components/LoadingSpinner';

// User Management
import UserList from './admin/pages/users/UserList';
import UserForm from './admin/pages/users/UserForm';

// Role Management
import RoleList from './admin/pages/roles/RoleList';
import RoleForm from './admin/pages/roles/RoleForm';

// Menu Management
import MenuList from './admin/pages/menus/MenuList';
import MenuForm from './admin/pages/menus/MenuForm';

// Employee Management
import EmployeeList from './admin/pages/employees/EmployeeList';
import EmployeeForm from './admin/pages/employees/EmployeeForm';


// Holiday Management
import HolidayList from './admin/pages/holidays/HolidayList';
import HolidayForm from './admin/pages/holidays/HolidayForm';

// Leave Management
import LeaveTypeList from './admin/pages/leavetypes/LeaveTypeList';
import LeaveTypeForm from './admin/pages/leavetypes/LeaveTypeForm';
import LeaveApplicationList from './admin/pages/leaveapplications/LeaveApplicationList';
import LeaveApplicationForm from './admin/pages/leaveapplications/LeaveApplicationForm';
import LeaveBalanceList from './admin/pages/leavebalances/LeaveBalanceList';
import LeaveBalanceForm from './admin/pages/leavebalances/LeaveBalanceForm';
import ShortLeaveList from './admin/pages/shortleaves/ShortLeaveList';
import ShortLeaveForm from './admin/pages/shortleaves/ShortLeaveForm';

// Office Management
import OfficeExpenseTypeList from './admin/pages/officeexpensetypes/OfficeExpenseTypeList';
import OfficeExpenseTypeForm from './admin/pages/officeexpensetypes/OfficeExpenseTypeForm';

// Vendor Management
import VendorList from './admin/pages/vendors/VendorList';
import VendorForm from './admin/pages/vendors/VendorForm';

// Country Management
import CountryList from './admin/pages/countries/CountryList';
import CountryForm from './admin/pages/countries/CountryForm';
import StateList from './admin/pages/countries/StateList';
import StateForm from './admin/pages/countries/StateForm';
import CityList from './admin/pages/countries/CityList';
import CityForm from './admin/pages/countries/CityForm';

// Office Expenses
import OfficeExpenseList from './admin/pages/expenses/OfficeExpenseList';
import OfficeExpenseForm from './admin/pages/expenses/OfficeExpenseForm';
import OfficeExpenseSummary from './admin/pages/expenses/OfficeExpenseSummary';
import OfficeExpenseCategorySummary from './admin/pages/expenses/OfficeExpenseCategorySummary';

// Profile & Settings
import Profile from './admin/pages/Profile';
import Settings from './admin/pages/Settings';

const LovMasterList = lazy(() => import('./admin/pages/lov/LovMasterList'));
const LovMasterForm = lazy(() => import('./admin/pages/lov/LovMasterForm'));
const LovDetailList = lazy(() => import('./admin/pages/lov/LovDetailList'));
const LovDetailForm = lazy(() => import('./admin/pages/lov/LovDetailForm'));
const ClientList = lazy(() => import('./admin/pages/clients/ClientList'));
const ClientForm = lazy(() => import('./admin/pages/clients/ClientForm'));
const ClientFollowupList = lazy(() => import('./admin/pages/clientfollowups/ClientFollowupList'));
const ClientFollowupForm = lazy(() => import('./admin/pages/clientfollowups/ClientFollowupForm'));
const ClientFollowupStatusHistory = lazy(() => import('./admin/pages/clientfollowups/ClientFollowupStatusHistory'));
const ProjectList = lazy(() => import('./admin/pages/projects/ProjectList'));
const ProjectForm = lazy(() => import('./admin/pages/projects/ProjectForm'));
const PendingFollowupList = lazy(() => import('./admin/pages/dashboard/PendingFollowupList'));
const PendingBNIFollowupList = lazy(() => import('./admin/pages/dashboard/PendingBNIFollowupList'));
const Next5DaysBNIMeetingList = lazy(() => import('./admin/pages/dashboard/Next5DaysBNIMeetingList'));
const ApprovedLeaveHistoryList = lazy(() => import('./admin/pages/dashboard/ApprovedLeaveHistoryList'));
const PendingLeaveApplicationList = lazy(() => import('./admin/pages/dashboard/PendingLeaveApplicationList'));
const EmployeeProjectMapping = lazy(() => import('./admin/pages/employees/EmployeeProjectMapping'));
const DailyTaskList = lazy(() => import('./admin/pages/dailytasks/DailyTaskList'));
const DailyTaskForm = lazy(() => import('./admin/pages/dailytasks/DailyTaskForm'));

// BNI Management
const BNIChapterList = lazy(() => import('./admin/pages/bnichapters/BNIChapterList'));
const BNIChapterForm = lazy(() => import('./admin/pages/bnichapters/BNIChapterForm'));

// BNI Member Management
const BNIMemberList = lazy(() => import('./admin/pages/bnimembers/BNIMemberList'));
const BNIMemberForm = lazy(() => import('./admin/pages/bnimembers/BNIMemberForm'));

// BNI Followup Management
const BNIFollowupList = lazy(() => import('./admin/pages/bnifollowups/BNIFollowupList'));
const BNIFollowupForm = lazy(() => import('./admin/pages/bnifollowups/BNIFollowupForm'));
const BNIFollowupHistory = lazy(() => import('./admin/pages/bnifollowups/BNIFollowupHistory'));

// BNI Meeting Management
const BNIMeetingList = lazy(() => import('./admin/pages/bnimeetings/BNIMeetingList'));
const BNIMeetingForm = lazy(() => import('./admin/pages/bnimeetings/BNIMeetingForm'));

function App() {
  return (
    <AuthProvider>
      <PermissionProvider>
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            {/* Redirect root to admin login */}
            <Route path='/' element={<Navigate to="/admin/login" replace />} />

            {/* Admin Authentication Routes */}
            <Route path='/admin/login' element={<AdminLogin />} />
            <Route path='/admin/forgot-password' element={<ForgotPassword />} />
            <Route path='/admin/access-denied' element={<AccessDenied />} />

            {/* Protected Admin Routes */}
            <Route path='/admin' element={
              <ProtectedRoute>
                <ToastProvider>
                  <AdminLayout />
                </ToastProvider>
              </ProtectedRoute>
            }>
              {/* Redirect /admin to dashboard */}
              <Route index element={<Navigate to="/admin/dashboard" replace />} />

              {/* Dashboard */}
              <Route path='dashboard' element={<AdminDashboard />} />
              <Route path='pending-followups' element={<PendingFollowupList />} />
              <Route path='pending-bni-followups' element={<PendingBNIFollowupList />} />
              <Route path='upcoming-bni-meetings' element={<Next5DaysBNIMeetingList />} />
              <Route path='approved-leaves' element={<ApprovedLeaveHistoryList />} />
              <Route path='pending-leave-applications' element={<PendingLeaveApplicationList />} />

              {/* User Management Routes */}
              <Route path='users' element={<UserList />} />
              <Route path='users/new' element={<UserForm />} />
              <Route path='users/:id/edit' element={<UserForm />} />

              {/* Client Management Routes */}
              <Route path='clients' element={<ClientList />} />
              <Route path='clients/new' element={<ClientForm />} />
              <Route path='clients/:id/edit' element={<ClientForm />} />

              {/* Client Followup Management Routes */}
              <Route path='client-followups' element={<ClientFollowupList />} />
              <Route path='client-followups/new' element={<ClientFollowupForm />} />
              <Route path='client-followups/:id/edit' element={<ClientFollowupForm />} />
              <Route path='client-followups/:id/history' element={<ClientFollowupStatusHistory />} />

              {/* Project Management Routes */}
              <Route path='projects' element={<ProjectList />} />
              <Route path='projects/new' element={<ProjectForm />} />
              <Route path='projects/:id/edit' element={<ProjectForm />} />

              {/* Daily Task Management Routes */}
              <Route path='daily-tasks' element={<DailyTaskList />} />
              <Route path='daily-tasks/new' element={<DailyTaskForm />} />
              <Route path='daily-tasks/:id/edit' element={<DailyTaskForm />} />

              {/* BNI Chapter Management Routes */}
              <Route path='bni-chapters' element={<BNIChapterList />} />
              <Route path='bni-chapters/new' element={<BNIChapterForm />} />
              <Route path='bni-chapters/:id/edit' element={<BNIChapterForm />} />

              {/* BNI Member Management Routes */}
              <Route path='bni-members' element={<BNIMemberList />} />
              <Route path='bni-members/new' element={<BNIMemberForm />} />
              <Route path='bni-members/:id/edit' element={<BNIMemberForm />} />

              {/* BNI Followup Management Routes */}
              <Route path='bni-followups' element={<BNIFollowupList />} />
              <Route path='bni-followups/new' element={<BNIFollowupForm />} />
              <Route path='bni-followups/:id/edit' element={<BNIFollowupForm />} />
              <Route path='bni-followups/:id/history' element={<BNIFollowupHistory />} />

              {/* BNI Meeting Management Routes */}
              <Route path='bni-meetings' element={<BNIMeetingList />} />
              <Route path='bni-meetings/new' element={<BNIMeetingForm />} />
              <Route path='bni-meetings/:id/edit' element={<BNIMeetingForm />} />

              {/* LOV Master Routes */}
              <Route path='lov' element={<LovMasterList />} />
              <Route path='lov/new' element={<LovMasterForm />} />
              <Route path='lov/:lovColumn/edit-master' element={<LovMasterForm />} />
              <Route path='lov/:lovColumn' element={<LovDetailList />} />
              <Route path='lov/:lovColumn/new' element={<LovDetailForm />} />
              <Route path='lov/:lovColumn/edit' element={<LovDetailForm />} />

              {/* Role Management Routes */}
              <Route path='roles' element={<RoleList />} />
              <Route path='roles/new' element={<RoleForm />} />
              <Route path='roles/:id/edit' element={<RoleForm />} />

              {/* Menu Management Routes */}
              <Route path='menus' element={<MenuList />} />
              <Route path='menus/new' element={<MenuForm />} />
              <Route path='menus/:id/edit' element={<MenuForm />} />

              {/* Employee Management Routes */}
              <Route path='employees' element={<EmployeeList />} />
              <Route path='employees/new' element={<EmployeeForm />} />
              <Route path='employees/:id/edit' element={<EmployeeForm />} />
              <Route path='employees/:id/assign-project' element={<EmployeeProjectMapping />} />

              {/* Holiday Management Routes */}
              <Route path='holidays' element={<HolidayList />} />
              <Route path='holidays/add' element={<HolidayForm />} />
              <Route path='holidays/edit/:id' element={<HolidayForm />} />

              {/* Leave Management Routes */}
              <Route path='leavetypes' element={<LeaveTypeList />} />
              <Route path='leavetypes/add' element={<LeaveTypeForm />} />
              <Route path='leavetypes/edit/:id' element={<LeaveTypeForm />} />

              <Route path='leaveapplications' element={<LeaveApplicationList />} />
              <Route path='leaveapplications/add' element={<LeaveApplicationForm />} />
              <Route path='leaveapplications/edit/:id' element={<LeaveApplicationForm />} />

              {/* Leave Balance Routes */}
              <Route path='leave-balances' element={<LeaveBalanceList />} />
              <Route path='leave-balances/allocate' element={<LeaveBalanceForm />} />

              {/* Short Leave Routes */}
              <Route path='short-leaves' element={<ShortLeaveList />} />
              <Route path='short-leaves/new' element={<ShortLeaveForm />} />
              <Route path='short-leaves/:id/edit' element={<ShortLeaveForm />} />

              {/* Office Management Routes */}
              <Route path='office-expense-types' element={<OfficeExpenseTypeList />} />
              <Route path='office-expense-types/add' element={<OfficeExpenseTypeForm />} />
              <Route path='office-expense-types/edit/:id' element={<OfficeExpenseTypeForm />} />

              {/* Vendor Management Routes */}
              <Route path='vendors' element={<VendorList />} />
              <Route path='vendors/add' element={<VendorForm />} />
              <Route path='vendors/edit/:id' element={<VendorForm />} />

              {/* Country Management Routes */}
              <Route path='countries' element={<CountryList />} />
              <Route path='countries/add' element={<CountryForm />} />
              <Route path='countries/edit/:id' element={<CountryForm />} />

              {/* State Management Routes (nested under countries) */}
              <Route path='countries/:countryId/states' element={<StateList />} />
              <Route path='countries/:countryId/states/add' element={<StateForm />} />
              <Route path='countries/:countryId/states/edit/:stateId' element={<StateForm />} />

              {/* City Management Routes (nested under states) */}
              <Route path='countries/:countryId/states/:stateId/cities' element={<CityList />} />
              <Route path='countries/:countryId/states/:stateId/cities/add' element={<CityForm />} />
              <Route path='countries/:countryId/states/:stateId/cities/edit/:cityId' element={<CityForm />} />

              {/* Office Expenses Routes */}
              <Route path='expenses' element={<OfficeExpenseList />} />
              <Route path='expenses/summary' element={<OfficeExpenseSummary />} />
              <Route path='expenses/category-summary' element={<OfficeExpenseCategorySummary />} />
              <Route path='expenses/new' element={<OfficeExpenseForm />} />
              <Route path='expenses/:id/edit' element={<OfficeExpenseForm />} />

              {/* Profile & Settings */}
              <Route path='profile' element={<Profile />} />
              <Route path='settings' element={<Settings />} />
            </Route>

            {/* Catch all - redirect to admin login */}
            <Route path='*' element={<Navigate to="/admin/login" replace />} />
          </Routes>
        </Suspense>
      </PermissionProvider>
    </AuthProvider>
  );
}

export default App;
