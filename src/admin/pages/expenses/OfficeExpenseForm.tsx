import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { officeExpenseApi, OfficeExpense, VendorDropdownItem, PaymentMethodDropdownItem } from '../../services/api/officeExpenseApi';
import FormField from '../../components/FormField';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import '../../styles/admin.css';
import '../../styles/admin-components.css';

import { officeExpenseTypeApi } from '../../services/api/officeExpenseTypeApi';

export default function OfficeExpenseForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { showSuccess, showError } = useToast();
    const { user: currentUser } = useAuth();
    const isEditMode = Boolean(id);

    const passedData = location.state?.expenseData as OfficeExpense | undefined;

    const [formData, setFormData] = useState<Partial<OfficeExpense & { expenseTypeId: number }>>({
        expenseDate: new Date().toISOString().split('T')[0],
        amount: undefined, // Default to undefined for blank input
        expenseTypeId: 0,
        vendorId: 0,
        paymentMethod: '',
        referenceNo: '',
        description: '',
        attachmentDocument: '',
        createdBy: 0,
        lastModifiedBy: 0
    });

    const [vendors, setVendors] = useState<VendorDropdownItem[]>([]);
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethodDropdownItem[]>([]);
    const [expenseTypes, setExpenseTypes] = useState<{ id: number; name: string }[]>([]);

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Initial Load
    useEffect(() => {
        const loadDropdowns = async () => {
            const [vRes, pRes, tRes] = await Promise.all([
                officeExpenseApi.getVendorDropdown(),
                officeExpenseApi.getPaymentMethodDropdown(),
                officeExpenseTypeApi.getOfficeExpenseTypeDropdown()
            ]);

            if (vRes.success) setVendors(vRes.data || []);
            if (pRes.success) setPaymentMethods(pRes.data || []);
            if (tRes.success) setExpenseTypes(tRes.data || []);
        };

        loadDropdowns();

        if (isEditMode && id) {
            if (passedData) {
                setFormData({
                    ...passedData,
                    expenseDate: passedData.expenseDate ? passedData.expenseDate.split('T')[0] : ''
                });
                // Assuming passedData or API response might not have expenseTypeId directly if not in model yet, 
                // but if it is, we use it. If not, user selects again or we need to map it.
                // For now, if editing, we might need to fetch it correctly. 
                // The current API response for GetById might not include it if I didn't add it to interface.
            } else {
                loadRecord(id);
            }
        }
    }, [isEditMode, id, passedData]);

    const loadRecord = async (recordId: string) => {
        try {
            setLoading(true);
            const response = await officeExpenseApi.getOfficeExpenseById(recordId);
            if (response.success && response.data) {
                const data = response.data;
                // Note: Ensure API returns expenseTypeId if we want to pre-fill it
                // Correctly map API response to Form State
                setFormData({
                    ...data,
                    expenseDate: data.expenseDate ? data.expenseDate.split('T')[0] : '',
                    expenseTypeId: data.expenseTypeId || (data as any).ExpenseTypeId || 0,
                    vendorId: data.vendorId || (data as any).VendorId || 0,
                    amount: data.amount || (data as any).Amount || 0,
                    paymentMethod: data.paymentMethod || (data as any).PaymentMethod || '',
                    description: data.description || (data as any).Description || ''
                } as any);
            } else {
                showError('Failed to load expense data');
            }
        } catch (error) {
            showError('Network error');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;

        let finalValue: any = value;
        if (name === 'amount') {
            // Allow empty string for blank input, otherwise convert to absolute number to prevent negatives
            finalValue = value === '' ? undefined : Math.abs(Number(value));
        } else if (name === 'vendorId' || name === 'expenseTypeId') {
            finalValue = Number(value);
        }

        setFormData(prev => ({
            ...prev,
            [name]: finalValue
        }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    };

    // State for the actual File object to convert to FormData
    const [attachmentFile, setAttachmentFile] = useState<File | null>(null);

    // File Upload Handler (Convert to Base64 for Preview + Store File for Upload)
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Validate size/type if needed
            if (file.size > 5 * 1024 * 1024) { // 5MB limit example
                setErrors(prev => ({ ...prev, attachmentDocument: 'File too large (Max 5MB)' }));
                return;
            }

            setAttachmentFile(file); // Store raw file

            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result as string;
                setFormData(prev => ({ ...prev, attachmentDocument: base64String }));
                if (errors.attachmentDocument) setErrors(prev => ({ ...prev, attachmentDocument: '' }));
            };
            reader.readAsDataURL(file);
        } else {
            setAttachmentFile(null);
            setFormData(prev => ({ ...prev, attachmentDocument: '' }));
        }
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.expenseDate) newErrors.expenseDate = 'Date is required';
        if (!formData.expenseTypeId) newErrors.expenseTypeId = 'Expense Type is required';
        if (!formData.amount || formData.amount <= 0) newErrors.amount = 'Valid amount is required';
        if (!formData.vendorId) newErrors.vendorId = 'Vendor is required';
        if (!formData.paymentMethod) newErrors.paymentMethod = 'Payment Method is required';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        try {
            setSubmitting(true);

            // Prepare payload
            const payload: any = {
                ...formData,
                id: isEditMode && id ? parseInt(id) : 0,
                // Do NOT send OfficeExpenseId for Add, sending 0 is handled in API service logic now
                createdBy: isEditMode ? formData.createdBy : (Number(currentUser?.id) || 0),
                lastModifiedBy: Number(currentUser?.id) || 0,
                attachmentFile: attachmentFile // Pass the raw file
            };

            const response = await officeExpenseApi.addOfficeExpense(payload);

            if (response.success) {
                showSuccess(`Expense ${isEditMode ? 'updated' : 'saved'} successfully`);
                navigate('/admin/expenses');
            } else {
                showError(response.message || 'Failed to save');
            }

        } catch (error) {
            console.error(error);
            showError('Unexpected error occurred');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="admin-page">
                <div className="admin-table-loading">
                    <i className="fa-solid fa-spinner fa-spin"></i>
                    <p>Loading...</p>
                </div>
            </div>
        );
    }

    const vendorOptions = vendors.map(v => ({ value: v.id, label: v.name }));
    const paymentOptions = paymentMethods.map(p => ({ value: p.code || p.value || p.name, label: p.name }));

    return (
        <div className="admin-page">
            <div className="admin-page-header">
                <div>
                    <h1 className="admin-page-title">{isEditMode ? 'Edit Expense' : 'Add New Expense'}</h1>
                </div>
                <div className="admin-page-actions">
                    <button type="button" onClick={() => navigate('/admin/expenses')} className="admin-btn admin-btn-secondary">
                        <i className="fa-solid fa-arrow-left"></i> Back to List
                    </button>
                </div>
            </div>

            <div className="admin-card">
                <div className="admin-card-header">
                    <h2>Expense Detail</h2>
                </div>
                <div className="admin-card-body">
                    <form onSubmit={handleSubmit} className="admin-form" noValidate>

                        {/* Row 1 */}
                        <div className="admin-form-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
                            <FormField
                                label="Expense Date"
                                name="expenseDate"
                                type="date"
                                value={formData.expenseDate}
                                onChange={handleInputChange}
                                required
                                error={errors.expenseDate}
                            />
                            <div className="admin-form-group">
                                <label className="admin-form-label">Expense Type <span className="admin-form-required">*</span></label>
                                <select
                                    name="expenseTypeId"
                                    value={formData.expenseTypeId}
                                    onChange={handleInputChange}
                                    className={`admin-form-control ${errors.expenseTypeId ? 'admin-form-control-error' : ''}`}
                                >
                                    <option value={0}>Select Type</option>
                                    {expenseTypes.map(opt => (
                                        <option key={opt.id} value={opt.id}>{opt.name}</option>
                                    ))}
                                </select>
                                {errors.expenseTypeId && <span className="admin-form-error">{errors.expenseTypeId}</span>}
                            </div>
                            <div className="admin-form-group">
                                <label className="admin-form-label">Vendor <span className="admin-form-required">*</span></label>
                                <select
                                    name="vendorId"
                                    value={formData.vendorId}
                                    onChange={handleInputChange}
                                    className={`admin-form-control ${errors.vendorId ? 'admin-form-control-error' : ''}`}
                                >
                                    <option value={0}>Select Vendor</option>
                                    {vendorOptions.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                                {errors.vendorId && <span className="admin-form-error">{errors.vendorId}</span>}
                            </div>
                        </div>

                        {/* Row 2 */}
                        <div className="admin-form-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
                            <FormField
                                label="Amount"
                                name="amount"
                                type="number"
                                value={formData.amount === undefined ? '' : formData.amount}
                                onChange={handleInputChange}
                                required
                                error={errors.amount}
                                placeholder="Enter Amount"
                                min="0" // Prevent typing negative numbers in some browsers
                            />
                            <div className="admin-form-group">
                                <label className="admin-form-label">Payment Method <span className="admin-form-required">*</span></label>
                                <select
                                    name="paymentMethod"
                                    value={formData.paymentMethod}
                                    onChange={handleInputChange}
                                    className={`admin-form-control ${errors.paymentMethod ? 'admin-form-control-error' : ''}`}
                                >
                                    <option value="">Select Method</option>
                                    {paymentOptions.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                                {errors.paymentMethod && <span className="admin-form-error">{errors.paymentMethod}</span>}
                            </div>
                            <FormField
                                label="Reference No"
                                name="referenceNo"
                                value={formData.referenceNo}
                                onChange={handleInputChange}
                                placeholder="Receipt / Ref No"
                            />
                        </div>

                        {/* Row 3 - File & Description */}
                        <div className="admin-form-group">
                            <label className="admin-form-label">Attachment (Image/PDF)</label>

                            <input
                                type="file"
                                id="custom-file-input"
                                onChange={handleFileChange}
                                accept="image/*,.pdf"
                                style={{ display: 'none' }}
                            />

                            <div className="admin-form-control" style={{ display: 'flex', alignItems: 'center', padding: '5px 10px' }}>
                                <label
                                    htmlFor="custom-file-input"
                                    style={{
                                        backgroundColor: '#EFEFEF',
                                        border: '1px solid #767676',
                                        borderRadius: '2px',
                                        padding: '2px 6px',
                                        marginRight: '10px',
                                        fontSize: '13px',
                                        color: '#000',
                                        cursor: 'pointer',
                                        marginBottom: 0,
                                        fontWeight: '400',
                                        fontFamily: 'Arial'
                                    }}
                                >
                                    Choose File
                                </label>
                                <span style={{ fontSize: '13px', color: '#000' }}>
                                    {attachmentFile ? attachmentFile.name : (
                                        formData.attachmentDocument && !formData.attachmentDocument.startsWith('data:')
                                            ? (formData.attachmentDocument.length > 50 ? "Existing Attachment" : (formData.attachmentDocument.split('/').pop() || formData.attachmentDocument))
                                            : "No file chosen"
                                    )}
                                </span>
                            </div>

                            {formData.attachmentDocument && (
                                <div style={{ marginTop: '8px' }}>
                                    {/* Helper to determine content source */}
                                    {(() => {
                                        const doc = formData.attachmentDocument || '';

                                        // Case 1: Newly selected file (already has data: prefix)
                                        if (doc.startsWith('data:')) {
                                            return (
                                                <>
                                                    <p style={{ fontSize: '12px', color: 'var(--admin-success)', marginBottom: '5px' }}>
                                                        <i className="fa-solid fa-check"></i> New file selected
                                                    </p>
                                                    {doc.startsWith('data:image') && (
                                                        <img
                                                            src={doc}
                                                            alt="Preview"
                                                            style={{ maxWidth: '150px', maxHeight: '150px', border: '1px solid #ddd', borderRadius: '4px' }}
                                                        />
                                                    )}
                                                    {doc.startsWith('data:application/pdf') && (
                                                        <span style={{ fontSize: '12px', color: 'var(--admin-gray-600)' }}>PDF Selected</span>
                                                    )}
                                                </>
                                            );
                                        }

                                        // Case 2: URL / File Path
                                        const isUrl = doc.startsWith('http') || doc.includes('/') || doc.includes('\\');
                                        if (isUrl && !doc.match(/^[a-zA-Z0-9+/=]+$/)) { // simple check if it likely is NOT a raw base64 block unless path has those chars
                                            const fullUrl = doc.startsWith('http') ? doc : `https://aj.padhyasoft.com/${doc}`;
                                            const isImg = ['.jpg', '.jpeg', '.png', '.gif', '.webp'].some(ext => doc.toLowerCase().endsWith(ext));

                                            return (
                                                <div style={{ marginTop: '5px' }}>
                                                    {isImg ? (
                                                        <img
                                                            src={fullUrl}
                                                            alt="Current Attachment"
                                                            style={{ maxWidth: '150px', maxHeight: '150px', border: '1px solid #ddd', borderRadius: '4px', display: 'block', marginBottom: '5px' }}
                                                        />
                                                    ) : (
                                                        <a
                                                            href={fullUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="admin-btn admin-btn-sm admin-btn-info"
                                                            style={{ textDecoration: 'none', padding: '4px 10px', fontSize: '12px' }}
                                                        >
                                                            <i className="fa-solid fa-external-link-alt" style={{ marginRight: '5px' }}></i>
                                                            View Document
                                                        </a>
                                                    )}
                                                </div>
                                            );
                                        }

                                        // Case 3: Raw Base64 from Backend (Assuming)
                                        // Detect signature
                                        let mimeType = '';
                                        if (doc.startsWith('/9j/')) mimeType = 'image/jpeg';
                                        else if (doc.startsWith('iVBORw0KGgo')) mimeType = 'image/png';
                                        else if (doc.startsWith('R0lGOD')) mimeType = 'image/gif';
                                        else if (doc.startsWith('UklGR')) mimeType = 'image/webp';
                                        else if (doc.startsWith('JVBERi0')) mimeType = 'application/pdf';

                                        if (mimeType) {
                                            const dataUri = `data:${mimeType};base64,${doc}`;
                                            if (mimeType.startsWith('image')) {
                                                return (
                                                    <img
                                                        src={dataUri}
                                                        alt="Current Attachment"
                                                        style={{ maxWidth: '150px', maxHeight: '150px', border: '1px solid #ddd', borderRadius: '4px' }}
                                                    />
                                                );
                                            } else {
                                                // PDF or other
                                                return (
                                                    <a
                                                        href={dataUri}
                                                        download={`attachment.${mimeType === 'application/pdf' ? 'pdf' : 'bin'}`}
                                                        className="admin-btn admin-btn-sm admin-btn-info"
                                                        style={{ textDecoration: 'none', padding: '4px 10px', fontSize: '12px' }}
                                                    >
                                                        <i className="fa-solid fa-download" style={{ marginRight: '5px' }}></i>
                                                        Download {mimeType === 'application/pdf' ? 'PDF' : 'File'}
                                                    </a>
                                                );
                                            }
                                        }

                                        return <span style={{ fontSize: '12px', color: 'var(--admin-gray-500)' }}>Attachment present (Unknown format)</span>;
                                    })()}
                                </div>
                            )}
                            {errors.attachmentDocument && <span className="admin-form-error">{errors.attachmentDocument}</span>}
                        </div>

                        <div className="admin-form-group">
                            <label className="admin-form-label">Description</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                className="admin-form-control"
                                rows={3}
                                placeholder="Enter Expense Detail..."
                            ></textarea>
                        </div>

                        <div className="admin-form-actions">
                            <button type="submit" className="admin-btn admin-btn-primary" disabled={submitting}>
                                {submitting ? 'Saving...' : 'Save Expense'}
                            </button>
                            <button type="button" onClick={() => navigate('/admin/expenses')} className="admin-btn admin-btn-secondary">
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
