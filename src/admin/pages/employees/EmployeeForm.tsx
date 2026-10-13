import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { employeeApi, Employee, EmployeeDropdownItem } from '../../services/api/employeeApi';
import { dropdownApi, DropdownItem } from '../../services/api/dropdownApi';
import { userApi, User } from '../../services/api/userApi';
import FormField from '../../components/FormField';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { logError } from '../../utils/logError';
import '../../styles/admin.css';
import '../../styles/admin-components.css';

export default function EmployeeForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { user: currentUser } = useAuth();
    const { showSuccess } = useToast();
    const isEditMode = Boolean(id);

    // Get passed data if available
    const passedData = location.state?.employeeData as Employee | undefined;

    const [formData, setFormData] = useState<Partial<Employee>>({
        employeeCode: '',
        firstName: '',
        lastName: '',
        email: '',
        mobile: '',
        department: '',
        designation: '',
        reportingManagerId: 0,
        joinDate: '',
        employmentType: '',
        workLocation: '',
        dateOfBirth: '',
        exitDate: '',
        createdBy: 0,
        lastModifiedBy: 0
    });

    const [userCredentials, setUserCredentials] = useState({
        userName: '',
        password: '',
        roleId: 0
    });

    const [showPassword, setShowPassword] = useState(false);

    const [roles, setRoles] = useState<DropdownItem[]>([]);

    const [employmentTypes, setEmploymentTypes] = useState<{ value: string; label: string }[]>([]);

    const loadEmploymentTypes = async () => {
        try {
            const response = await employeeApi.getEmploymentTypeDropdown();
            if (response.success && response.data) {
                setEmploymentTypes(response.data.map(item => ({ value: item.code || item.name, label: item.name })));
            }
        } catch (error) {
            console.error('Error loading employment types:', error);
        }
    };

    const loadRoles = async () => {
        try {
            const response = await dropdownApi.getRoleName();
            if (response.success && response.data) {
                setRoles(response.data);
            }
        } catch (error) {
            console.error('Error loading roles:', error);
        }
    };

    const [managers, setManagers] = useState<EmployeeDropdownItem[]>([]);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [existingEmployees, setExistingEmployees] = useState<Employee[]>([]);
    const [existingUsers, setExistingUsers] = useState<User[]>([]);

    // Helper to format Date for Input (YYYY-MM-DD)
    const formatDateForInput = (isoString?: string) => {
        if (!isoString) return '';
        try {
            return isoString.split('T')[0];
        } catch {
            return '';
        }
    };

    const loadManagers = async () => {
        try {
            const response = await employeeApi.getEmployeeDropdown();
            if (response.success) {
                setManagers(response.data || []);
            }
        } catch (error) {
            console.error('Error loading managers:', error);
        }
    };

    // Helper to normalize data keys (Handle PascalCase from API)
    const normalizeEmployeeData = (data: any): Partial<Employee> => {
        // Create a normalized object with camelCase keys
        const normalized: any = { ...data };

        // Explicitly map potential PascalCase keys to camelCase state keys
        if (data.ReportingManagerId !== undefined) normalized.reportingManagerId = data.ReportingManagerId;
        if (data.EmploymentType !== undefined) normalized.employmentType = data.EmploymentType;
        if (data.WorkLocation !== undefined) normalized.workLocation = data.WorkLocation;
        // Prioritize explicit casing, but allow fallback for Code/code
        if (data.EmployeeCode !== undefined) normalized.employeeCode = data.EmployeeCode;
        else if (data.Code !== undefined) normalized.employeeCode = data.Code;
        else if (data.code !== undefined) normalized.employeeCode = data.code;
        if (data.FirstName !== undefined) normalized.firstName = data.FirstName;
        if (data.LastName !== undefined) normalized.lastName = data.LastName;
        if (data.Email !== undefined) normalized.email = data.Email;
        if (data.Mobile !== undefined) normalized.mobile = data.Mobile;
        if (data.Department !== undefined) normalized.department = data.Department;
        if (data.Designation !== undefined) normalized.designation = data.Designation;
        if (data.JoinDate !== undefined) normalized.joinDate = data.JoinDate;
        if (data.ExitDate !== undefined) normalized.exitDate = data.ExitDate;
        if (data.DateOfBirth !== undefined) normalized.dateOfBirth = data.DateOfBirth;
        if (data.EmployeeId !== undefined) normalized.employeeId = data.EmployeeId;

        // Type conversion for numeric fields
        if (normalized.reportingManagerId) normalized.reportingManagerId = Number(normalized.reportingManagerId);

        return normalized;
    };

    useEffect(() => {
        loadManagers();
        loadEmploymentTypes();
        loadRoles();
        loadExistingEmployees();
        loadExistingUsers();

        if (isEditMode && id) {
            if (passedData) {
                console.log('📝 Setting form data from passed state:', passedData);
                setFormData(normalizeEmployeeData(passedData));
            } else {
                loadEmployeeData(parseInt(id));
            }
        }
    }, [isEditMode, id]); // Removing passedData from dependency aimed to fix infinite loops if passedData is unstable, but it is from location.state which is stable. Keep it safe.

    // Update loadEmployeeData to also use normalization
    const loadEmployeeData = async (empId: number) => {
        try {
            setLoading(true);
            const response = await employeeApi.getEmployeeById(empId);
            if (response.success && response.data) {
                console.log('📝 Setting form data from API:', response.data);
                setFormData(normalizeEmployeeData(response.data));
            } else {
                setErrors({ general: 'Failed to load employee data' });
            }
        } catch (error) {
            setErrors({ general: 'Network error loading employee' });
        } finally {
            setLoading(false);
        }
    };

    const loadExistingEmployees = async () => {
        try {
            const response = await employeeApi.getAllEmployeesPage(0, 2000, 'asc');
            if (response.success && response.data) {
                // Normalize data to ensure camelCase keys (specifically employeeCode) are available for validation
                const normalizedEmployees = response.data.map(emp => normalizeEmployeeData(emp) as Employee);
                setExistingEmployees(normalizedEmployees);
            }
        } catch (error) {
            console.error('Error loading existing employees:', error);
        }
    };

    // Fix Employment Type selection if value matches name instead of code
    useEffect(() => {
        if (formData.employmentType && employmentTypes.length > 0) {
            // Check if current value matches any code
            const contentMatch = employmentTypes.find(t => t.value === formData.employmentType);

            // If not found by code, try to find by label (case-insensitive)
            if (!contentMatch) {
                const labelMatch = employmentTypes.find(t =>
                    t.label.toLowerCase() === formData.employmentType?.toLowerCase() ||
                    t.label.replace(/\s+/g, '').toLowerCase() === formData.employmentType?.replace(/\s+/g, '').toLowerCase()
                );

                if (labelMatch) {
                    console.log(`🔧 Employment Type Fixed: "${formData.employmentType}" -> "${labelMatch.value}"`);
                    setFormData(prev => ({ ...prev, employmentType: labelMatch.value }));
                }
            }
        }
    }, [employmentTypes, formData.employmentType]);

    const loadExistingUsers = async () => {
        try {
            const response = await userApi.getAllUsersPage(0, 2000, 'asc');
            if (response.success && response.data) {
                setExistingUsers(response.data);
            }
        } catch (error) {
            console.error('Error loading existing users:', error);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;

        if (['userName', 'password', 'roleId'].includes(name)) {
            setUserCredentials(prev => ({
                ...prev,
                [name]: name === 'roleId' ? Number(value) : value
            }));

            // Real-time duplicate username check
            if (name === 'userName' && value.trim()) {
                const duplicate = existingUsers.find(user =>
                    user.userName.toLowerCase() === value.trim().toLowerCase()
                );
                if (duplicate) {
                    setErrors(prev => ({ ...prev, userName: 'This username already exists' }));
                } else {
                    setErrors(prev => ({ ...prev, userName: '' }));
                }
            } else if (errors[name]) {
                setErrors(prev => ({ ...prev, [name]: '' }));
            }
            return;
        }

        // Custom validation for Mobile: Block non-digits immediately
        if (name === 'mobile') {
            if (!/^\d*$/.test(value)) return; // Do not update state if non-digit
            if (value.length > 10) return; // Restrict to 10 digits max during input
        }

        // Custom validation for Employee Code: Restrict to 7 characters max
        if (name === 'employeeCode') {
            if (value.length > 7) return; // Restrict to 7 characters max during input
        }

        setFormData(prev => ({
            ...prev,
            [name]: name === 'reportingManagerId' ? Number(value) : value
        }));

        // Real-time Date Validation
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (name === 'joinDate') {
            if (value) {
                const date = new Date(value);
                // Removed Future Join Date Restriction
                setErrors(prev => ({ ...prev, joinDate: '' }));

                // Also re-validate exit date against this new join date if exit date exists
                if (formData.exitDate) {
                    const exit = new Date(formData.exitDate);
                    if (exit < date) {
                        setErrors(prev => ({ ...prev, exitDate: 'Exit Date must be on or after Join Date' }));
                    } else {
                        setErrors(prev => ({ ...prev, exitDate: '' }));
                    }
                }
            } else {
                setErrors(prev => ({ ...prev, joinDate: '' }));
            }
        }
        else if (name === 'dateOfBirth') {
            if (value) {
                const date = new Date(value);
                if (date > today) {
                    setErrors(prev => ({ ...prev, dateOfBirth: 'Date of Birth cannot be in the future' }));
                } else {
                    setErrors(prev => ({ ...prev, dateOfBirth: '' }));
                }
            } else {
                setErrors(prev => ({ ...prev, dateOfBirth: '' }));
            }
        }
        else if (name === 'exitDate') {
            if (value) {
                const exit = new Date(value);
                const joinDateVal = formData.joinDate ? new Date(formData.joinDate) : null;

                if (joinDateVal && exit < joinDateVal) {
                    setErrors(prev => ({ ...prev, exitDate: 'Exit Date must be on or after Join Date' }));
                } else {
                    setErrors(prev => ({ ...prev, exitDate: '' }));
                }
            } else {
                setErrors(prev => ({ ...prev, exitDate: '' }));
            }
        }

        // Real-time duplicate checks
        if (name === 'employeeCode' && value.trim()) {
            const inputCode = value.trim().toLowerCase();
            const duplicate = existingEmployees.find(emp => {
                const existingCode = (emp.employeeCode || (emp as any).EmployeeCode || (emp as any).Code || '').toString().trim().toLowerCase();
                const isSameId = isEditMode && String(emp.employeeId || (emp as any).EmployeeId) === String(id);

                return existingCode === inputCode && !isSameId;
            });

            if (duplicate) {
                console.warn(`Duplicate Employee Code found: ${inputCode}`);
                setErrors(prev => ({ ...prev, employeeCode: 'This employee code already exists' }));
            } else {
                setErrors(prev => ({ ...prev, employeeCode: '' }));
            }
        } else if (name === 'firstName' && value.trim()) {
            // Check for duplicate name combination
            const duplicate = existingEmployees.find(emp =>
                emp.firstName?.toLowerCase() === value.trim().toLowerCase() &&
                emp.lastName?.toLowerCase() === formData.lastName?.toLowerCase() &&
                (!isEditMode || String(emp.employeeId) !== String(id))
            );
            if (duplicate) {
                setErrors(prev => ({ ...prev, firstName: 'An employee with this name already exists' }));
            } else {
                setErrors(prev => ({ ...prev, firstName: '' }));
            }
        } else if (name === 'lastName' && value.trim()) {
            // Check for duplicate name combination
            const duplicate = existingEmployees.find(emp =>
                emp.firstName?.toLowerCase() === formData.firstName?.toLowerCase() &&
                emp.lastName?.toLowerCase() === value.trim().toLowerCase() &&
                (!isEditMode || emp.employeeId !== parseInt(id!))
            );
            if (duplicate) {
                setErrors(prev => ({ ...prev, lastName: 'An employee with this name already exists' }));
            } else {
                setErrors(prev => ({ ...prev, lastName: '' }));
            }
        } else if (name === 'email' && value.trim()) {
            const duplicate = existingEmployees.find(emp =>
                emp.email?.toLowerCase() === value.trim().toLowerCase() &&
                (!isEditMode || emp.employeeId !== parseInt(id!))
            );
            if (duplicate) {
                setErrors(prev => ({ ...prev, email: 'This email already exists' }));
            } else if (errors[name]) {
                setErrors(prev => ({ ...prev, [name]: '' }));
            }
        } else if (name === 'mobile' && value.trim()) {
            const duplicate = existingEmployees.find(emp =>
                emp.mobile === value.trim() &&
                (!isEditMode || emp.employeeId !== parseInt(id!))
            );
            if (duplicate) {
                setErrors(prev => ({ ...prev, mobile: 'This mobile number already exists' }));
            } else if (errors[name]) {
                setErrors(prev => ({ ...prev, [name]: '' }));
            }
        } else if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};
        console.log('🔍 Validating Employee Form...');
        console.log('📋 Form Data:', formData);
        console.log('👤 User Credentials:', userCredentials);
        console.log('🔧 Is Edit Mode:', isEditMode);

        // Employee Code is now required
        if (!formData.employeeCode?.trim()) {
            newErrors.employeeCode = 'Employee Code is required';
        } else if (formData.employeeCode.trim().length > 7) {
            newErrors.employeeCode = 'Employee Code must not exceed 7 characters';
        }

        if (!formData.firstName?.trim()) newErrors.firstName = 'First Name is required';
        if (!formData.lastName?.trim()) newErrors.lastName = 'Last Name is required';

        // Valid Email Check
        if (!formData.email?.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(formData.email)) {
            newErrors.email = 'Please enter a valid email address';
        }

        // Mobile Check: 10 Digits Only
        if (!formData.mobile?.trim()) {
            newErrors.mobile = 'Mobile is required';
        } else if (formData.mobile.length !== 10) {
            newErrors.mobile = 'Mobile number must be exactly 10 digits';
        }

        if (!isEditMode) {
            if (!userCredentials.userName.trim()) newErrors.userName = 'User Name is required';

            // Check for duplicate username - only if username is provided
            if (userCredentials.userName.trim()) {
                const duplicateUsername = existingUsers.find(user =>
                    user.userName.toLowerCase() === userCredentials.userName.trim().toLowerCase()
                );
                if (duplicateUsername) {
                    newErrors.userName = 'This username already exists';
                }
            }

            if (!userCredentials.password.trim()) newErrors.password = 'Password is required';
            if (!userCredentials.roleId) newErrors.roleId = 'Role is required';
        }

        // Logical Validation (DOB check)
        if (formData.dateOfBirth) {
            const dob = new Date(formData.dateOfBirth);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (dob > today) {
                newErrors.dateOfBirth = 'Date of Birth cannot be in the future';
            }
        }

        // Join Date validation - Removed future check to allow scheduled joining
        // if (formData.joinDate) { ... }

        // Exit Date validation - must be on or after Join Date
        if (formData.joinDate && formData.exitDate) {
            const joinDate = new Date(formData.joinDate);
            const exitDate = new Date(formData.exitDate);
            if (exitDate < joinDate) {
                newErrors.exitDate = 'Exit Date must be on or after Join Date';
            }
        }

        // Check for duplicate name (firstName + lastName combination) - only if both are provided
        if (formData.firstName?.trim() && formData.lastName?.trim()) {
            const duplicateName = existingEmployees.find(emp =>
                emp.firstName?.toLowerCase() === formData.firstName?.trim().toLowerCase() &&
                emp.lastName?.toLowerCase() === formData.lastName?.trim().toLowerCase() &&
                (!isEditMode || emp.employeeId !== parseInt(id!))
            );
            if (duplicateName) {
                newErrors.firstName = 'An employee with this name already exists';
                newErrors.lastName = 'An employee with this name already exists';
            }
        }

        // Check for duplicate employee code - now required field
        if (formData.employeeCode?.trim()) {
            const inputCode = formData.employeeCode.trim().toLowerCase();
            const duplicateCode = existingEmployees.find(emp => {
                const existingCode = (emp.employeeCode || (emp as any).EmployeeCode || (emp as any).Code || '').toString().trim().toLowerCase();
                const isSameId = isEditMode && String(emp.employeeId || (emp as any).EmployeeId) === String(id);
                return existingCode === inputCode && !isSameId;
            });

            if (duplicateCode) {
                newErrors.employeeCode = 'This employee code already exists';
            }
        }

        if (formData.email?.trim()) {
            const duplicateEmail = existingEmployees.find(emp =>
                emp.email?.toLowerCase() === formData.email?.trim().toLowerCase() &&
                (!isEditMode || emp.employeeId !== parseInt(id!))
            );
            if (duplicateEmail) {
                newErrors.email = 'This email already exists';
            }
        }

        if (formData.mobile?.trim()) {
            const duplicateMobile = existingEmployees.find(emp =>
                emp.mobile === formData.mobile?.trim() &&
                (!isEditMode || emp.employeeId !== parseInt(id!))
            );
            if (duplicateMobile) {
                newErrors.mobile = 'This mobile number already exists';
            }
        }

        console.log('❌ Validation Errors:', newErrors);
        console.log('✅ Validation Result:', Object.keys(newErrors).length === 0 ? 'PASS' : 'FAIL');

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        console.log('🚀 Form Submit Started');

        if (!validate()) {
            console.log('⛔ Validation Failed - Form not submitted');
            return;
        }

        console.log('✅ Validation Passed - Proceeding with submission');

        try {
            setSubmitting(true);

            // Prepare payload
            const toDateString = (dateStr?: string) => {
                if (!dateStr) return null;
                try {
                    return new Date(dateStr).toISOString().split('T')[0];
                } catch {
                    return null;
                }
            };

            const currentUserId = currentUser?.id ? Number(currentUser.id) : 1;

            const payload: any = {
                // Required Fields
                employeeCode: formData.employeeCode,
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email,
                mobile: formData.mobile,

                // Optional Fields - Send null if empty to be safe
                department: formData.department || null,
                designation: formData.designation || null,
                workLocation: formData.workLocation || null,
                employmentType: formData.employmentType || null,

                // Dates
                joinDate: toDateString(formData.joinDate) || new Date().toISOString().split('T')[0],
                dateOfBirth: toDateString(formData.dateOfBirth) || new Date().toISOString().split('T')[0],
                exitDate: toDateString(formData.exitDate) || null,

                // Keys
                // Send NULL for no manager (0 causes FK violation)
                reportingManagerId: Number(formData.reportingManagerId) > 0 ? Number(formData.reportingManagerId) : null,

                // Metadata
                // Only send createdBy on creation to ensure valid FK. 
                ...(!isEditMode && { createdBy: currentUserId }),
                lastModifiedBy: currentUserId,

                // User Credentials (only if adding new employee)
                // Use explicit logic to add these fields only if not editing
                ...(!isEditMode && {
                    userName: userCredentials.userName?.trim(),
                    password: userCredentials.password?.trim(),
                    roleId: Number(userCredentials.roleId) // Explicitly Number
                    // roleId: String(userCredentials.roleId) // Explicitly St
                })
            };

            // Include ID only for update
            if (isEditMode && id) {
                payload.employeeId = parseInt(id);
            }

            // Using Add for both Create and Update (Assuming Upsert based on ID)
            const response = await employeeApi.addEmployee(payload);

            if (response.success) {
                showSuccess(`Employee ${isEditMode ? 'updated' : 'created'} successfully`);
                navigate('/admin/employees');
            } else {
                setErrors({ general: response.message || 'Failed to save employee' });
            }

        } catch (error) {
            setErrors({ general: 'An unexpected error occurred' });
            console.error(error);
        } finally {
            setSubmitting(false);
        }
    };

    const managerOptions = managers.map(m => ({ value: m.id, label: m.name }));


    return (
        <div className="admin-page">
            <div className="admin-page-header">
                <div>
                    <h1 className="admin-page-title">{isEditMode ? 'Edit Employee' : 'Add Employee'}</h1>
                </div>
                <div className="admin-page-actions">
                    <button type="button" onClick={() => navigate('/admin/employees')} className="admin-btn admin-btn-secondary">
                        <i className="fa-solid fa-arrow-left"></i> Back to List
                    </button>
                </div>
            </div>

            {errors.general && (
                <div className="admin-alert admin-alert-error">
                    <i className="fa-solid fa-circle-exclamation"></i>
                    {errors.general}
                </div>
            )}

            <div className="admin-card">
                <form onSubmit={handleSubmit} className="admin-form" noValidate>
                    {!isEditMode && (
                        <>
                            <div className="admin-card-header">
                                <h2>User Account Information</h2>
                            </div>
                            <div className="admin-card-body" style={{ paddingBottom: '0' }}>
                                <div className="admin-form-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
                                    <FormField
                                        label="User Name"
                                        name="userName"
                                        value={userCredentials.userName}
                                        onChange={handleInputChange}
                                        required={!isEditMode}
                                        error={errors.userName}
                                        placeholder="Enter User Name"
                                    />
                                    <FormField
                                        label="Password"
                                        required={!isEditMode}
                                        error={errors.password}
                                    >
                                        <div style={{ position: 'relative' }}>
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                name="password"
                                                value={userCredentials.password}
                                                onChange={handleInputChange}
                                                placeholder="Enter Password"
                                                className={`admin-form-control ${errors.password ? 'admin-form-control-error' : ''}`}
                                                style={{ paddingRight: '40px' }}
                                                disabled={isEditMode} // Usually disabled in edit mode if required logic dictates, keeping consistent with prior code logic where it was hidden/not required if edit mode, wait, previous code had required={!isEditMode} but field was visible. The original code didn't disable it. But wait, previous code: required={!isEditMode}. It was visible in Add Mode. In Edit Mode the container is likely hidden? No.
                                            // Actually line 604: {!isEditMode && (...)}
                                            // This whole BLOCK is only visible if !isEditMode.
                                            // So I don't need to worry about disabled={isEditMode} because it won't be rendered.
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                style={{
                                                    position: 'absolute',
                                                    right: '10px',
                                                    top: '50%',
                                                    transform: 'translateY(-50%)',
                                                    background: 'none',
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                    color: '#6b7280',
                                                    padding: '5px',
                                                    display: 'flex',
                                                    alignItems: 'center'
                                                }}
                                                title={showPassword ? "Hide password" : "Show password"}
                                            >
                                                <i className={`fa-solid ${showPassword ? 'fa-eye' : 'fa-eye-slash'}`}></i>
                                            </button>
                                        </div>
                                    </FormField>
                                    <FormField
                                        label="Role"
                                        name="roleId"
                                        type="select"
                                        value={userCredentials.roleId}
                                        onChange={handleInputChange}
                                        required={!isEditMode}
                                        error={errors.roleId}
                                        options={roles.map(r => ({ value: r.id, label: r.name || r.text || '' }))}
                                        placeholder="Select Role"
                                    />
                                </div>
                                <hr style={{ margin: '20px 0', border: '0', borderTop: '1px solid var(--admin-gray-200)' }} />
                            </div>
                        </>
                    )}

                    <div className="admin-card-header">
                        <h2>Employee Information</h2>
                    </div>
                    <div className="admin-card-body">

                        {/* Row 1 */}
                        <div className="admin-form-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
                            <FormField label="Employee Code" name="employeeCode" value={formData.employeeCode} onChange={handleInputChange} placeholder="Enter Employee Code" error={errors.employeeCode} required maxLength={7} />
                            <FormField label="First Name" name="firstName" value={formData.firstName} onChange={handleInputChange} required error={errors.firstName} placeholder="Enter First Name" />
                            <FormField label="Last Name" name="lastName" value={formData.lastName} onChange={handleInputChange} required error={errors.lastName} placeholder="Enter Last Name" />
                        </div>

                        {/* Row 2 */}
                        <div className="admin-form-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
                            <FormField label="Email" name="email" value={formData.email} onChange={handleInputChange} required error={errors.email} placeholder="Enter Email" />
                            <FormField label="Mobile" name="mobile" value={formData.mobile} onChange={handleInputChange} required error={errors.mobile} placeholder="Enter Mobile Number" />
                            <FormField label="Date of Birth" name="dateOfBirth" type="date" value={formatDateForInput(formData.dateOfBirth)} onChange={handleInputChange} placeholder="Select Date of Birth" max={new Date().toISOString().split('T')[0]} />
                        </div>

                        {/* Row 3 */}
                        <div className="admin-form-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
                            <FormField label="Department" name="department" value={formData.department} onChange={handleInputChange} placeholder="Enter Department" />
                            <FormField label="Designation" name="designation" value={formData.designation} onChange={handleInputChange} placeholder="Enter Designation" />
                            <FormField label="Reporting Manager" name="reportingManagerId" type="select" value={formData.reportingManagerId} onChange={handleInputChange} options={managerOptions} placeholder="Select Reporting Manager" />
                        </div>

                        {/* Row 4 */}
                        <div className="admin-form-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr 1fr' }}>
                            <FormField
                                label="Employee Type"
                                name="employmentType"
                                type="select"
                                value={formData.employmentType}
                                onChange={handleInputChange}
                                options={employmentTypes}
                                placeholder="Select Employee Type"
                            />
                            <FormField label="Work Location" name="workLocation" value={formData.workLocation} onChange={handleInputChange} placeholder="Enter Work Location" />
                            <FormField
                                label="Join Date"
                                name="joinDate"
                                type="date"
                                value={formatDateForInput(formData.joinDate)}
                                onChange={handleInputChange}
                                placeholder="Select Join Date"
                            />
                            <FormField
                                label="Exit Date"
                                name="exitDate"
                                type="date"
                                value={formatDateForInput(formData.exitDate)}
                                onChange={handleInputChange}
                                placeholder="Select Exit Date"
                                min={formData.joinDate ? formatDateForInput(formData.joinDate) : undefined}
                            />
                        </div>

                        <div className="admin-form-actions">
                            <button type="submit" className="admin-btn admin-btn-primary" disabled={submitting}>
                                {submitting ? 'Saving...' : 'Save'}
                            </button>
                            <button type="button" onClick={() => navigate('/admin/employees')} className="admin-btn admin-btn-secondary">
                                Cancel
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
