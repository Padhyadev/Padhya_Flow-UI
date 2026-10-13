import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { clientApi } from '../../services/api/clientApi';
import FormField from '../../components/FormField';
import { useToast } from '../../context/ToastContext';
import '../../styles/admin.css';
import '../../styles/admin-components.css';

export default function ClientForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { showSuccess, showError } = useToast();

    // Parse ID: if "new", id is undefined/null. If editing, id is string.
    const isEditMode = !!id;
    const numericId = isEditMode ? parseInt(id!) : 0;

    const [formData, setFormData] = useState({
        clientName: ''
    });

    const [loading, setLoading] = useState(isEditMode);
    const [submitting, setSubmitting] = useState(false);
    const [existingClients, setExistingClients] = useState<any[]>([]);
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        loadExistingClients();
        if (isEditMode && numericId) {
            loadData();
        }
    }, [isEditMode, numericId]);

    const loadExistingClients = async () => {
        try {
            const response = await clientApi.getAllClientsPage(0, 1000, 'asc');
            if (response.success && response.data) {
                setExistingClients(response.data);
            }
        } catch (error) {
            console.error('Error loading existing clients:', error);
        }
    };

    const loadData = async () => {
        setLoading(true);
        try {
            const response = await clientApi.getClientById(numericId);
            if (response.success && response.data) {
                setFormData({
                    clientName: response.data.clientName
                });
            } else {
                showError(response.message || 'Failed to load client details');
                navigate('/admin/clients');
            }
        } catch (error) {
            showError('Network error while loading client');
            navigate('/admin/clients');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Real-time duplicate check for clientName
        if (name === 'clientName' && value.trim()) {
            const duplicate = existingClients.find(client =>
                client.clientName.toLowerCase() === value.trim().toLowerCase() &&
                (!isEditMode || client.clientId !== numericId)
            );
            if (duplicate) {
                setErrors(prev => ({ ...prev, clientName: 'This client name already exists' }));
            } else {
                setErrors(prev => ({ ...prev, clientName: '' }));
            }
        } else if (name === 'clientName') {
            setErrors(prev => ({ ...prev, clientName: '' }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.clientName.trim()) {
            setErrors({ clientName: 'Client Name is required' });
            return;
        }

        // Check for duplicate before submitting
        const duplicate = existingClients.find(client =>
            client.clientName.toLowerCase() === formData.clientName.trim().toLowerCase() &&
            (!isEditMode || client.clientId !== numericId)
        );
        if (duplicate) {
            setErrors({ clientName: 'This client name already exists' });
            return;
        }

        try {
            setSubmitting(true);

            const payload = {
                clientId: numericId, // 0 if new, ID if edit
                clientName: formData.clientName
            };

            const response = await clientApi.saveClient(payload);

            if (response.success) {
                showSuccess(`Client ${isEditMode ? 'updated' : 'created'} successfully`);
                navigate('/admin/clients');
            } else {
                showError(response.message || `Failed to ${isEditMode ? 'update' : 'create'} client`);
            }
        } catch (error) {
            showError('Network error');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="admin-page">
                <div className="admin-card">
                    <div className="admin-card-body">Loading client details...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-page">
            <div className="admin-page-header">
                <div>
                    <h1 className="admin-page-title">{isEditMode ? 'Edit' : 'Add'} Client</h1>
                    <p className="admin-page-subtitle">{isEditMode ? 'Update existing' : 'Create new'} client</p>
                </div>
                <div className="admin-page-actions">
                    <button
                        type="button"
                        onClick={() => navigate('/admin/clients')}
                        className="admin-btn admin-btn-secondary"
                    >
                        <i className="fa-solid fa-arrow-left"></i> Back to List
                    </button>
                </div>
            </div>

            <div className="admin-card">
                <div className="admin-card-body">
                    <form onSubmit={handleSubmit} className="admin-form" noValidate>
                        <FormField
                            label="Client Name"
                            name="clientName"
                            value={formData.clientName}
                            onChange={handleInputChange}
                            error={errors.clientName}
                            required
                            placeholder="Enter Client Name"
                        />

                        <div className="admin-form-actions">
                            <button type="submit" className="admin-btn admin-btn-primary" disabled={submitting}>
                                {submitting ? 'Saving...' : 'Save'}
                            </button>
                            <button
                                type="button"
                                onClick={() => navigate('/admin/clients')}
                                className="admin-btn admin-btn-secondary"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
