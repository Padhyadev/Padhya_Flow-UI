import React, { useState, useEffect } from 'react';
import '../styles/admin.css';
import '../styles/admin-components.css';

export default function Settings() {
    const [settings, setSettings] = useState({
        emailNotifications: true,
        smsNotifications: false,
        leadAlerts: true,
        propertyUpdates: true,
        weeklyReports: false,
        theme: 'light',
        language: 'en',
        timezone: 'Asia/Kolkata'
    });

    const [showSuccess, setShowSuccess] = useState(false);
    const [saving, setSaving] = useState(false);

    // Apply theme to document
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', settings.theme);
    }, [settings.theme]);

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        // Save to localStorage
        localStorage.setItem('admin-theme', settings.theme);
        localStorage.setItem('admin-language', settings.language);
        localStorage.setItem('admin-settings', JSON.stringify(settings));

        // Simulate API call
        setTimeout(() => {
            setSaving(false);
            setShowSuccess(true);

            // Hide success message after 3 seconds
            setTimeout(() => {
                setShowSuccess(false);
            }, 3000);
        }, 500);
    };

    const handleToggle = (key: string) => {
        setSettings(prev => ({ ...prev, [key]: !prev[key as keyof typeof prev] }));
    };

    return (
        <div className="admin-page">
            <div className="admin-page-header">
                <div>
                    <h1 className="admin-page-title">Settings</h1>
                    <p className="admin-page-subtitle">Manage your application preferences</p>
                </div>
            </div>

            {showSuccess && (
                <div className="admin-alert" style={{
                    background: '#d1fae5',
                    color: '#065f46',
                    border: '2px solid #10b981',
                    marginBottom: '24px',
                    padding: '16px 20px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                }}>
                    <i className="fa-solid fa-check-circle" style={{ fontSize: '20px' }}></i>
                    <span style={{ fontWeight: 600 }}>Settings saved successfully!</span>
                </div>
            )}

            <form onSubmit={handleSave}>
                <div className="admin-card" style={{ marginBottom: '24px' }}>
                    <div className="admin-card-header">
                        <h2>Notification Preferences</h2>
                    </div>
                    <div className="admin-card-body">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: '#f9fafb', borderRadius: '8px' }}>
                                <div>
                                    <div style={{ fontWeight: 600, color: '#111827', marginBottom: '4px' }}>Email Notifications</div>
                                    <div style={{ fontSize: '14px', color: '#6b7280' }}>Receive email notifications for important updates</div>
                                </div>
                                <label style={{ position: 'relative', display: 'inline-block', width: '56px', height: '28px' }}>
                                    <input
                                        type="checkbox"
                                        checked={settings.emailNotifications}
                                        onChange={() => handleToggle('emailNotifications')}
                                        style={{ opacity: 0, width: 0, height: 0 }}
                                    />
                                    <span style={{
                                        position: 'absolute',
                                        cursor: 'pointer',
                                        top: 0,
                                        left: 0,
                                        right: 0,
                                        bottom: 0,
                                        backgroundColor: settings.emailNotifications ? '#3b82f6' : '#d1d5db',
                                        transition: '0.3s',
                                        borderRadius: '28px'
                                    }}>
                                        <span style={{
                                            position: 'absolute',
                                            content: '',
                                            height: '20px',
                                            width: '20px',
                                            left: settings.emailNotifications ? '32px' : '4px',
                                            bottom: '4px',
                                            backgroundColor: 'white',
                                            transition: '0.3s',
                                            borderRadius: '50%'
                                        }}></span>
                                    </span>
                                </label>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: '#f9fafb', borderRadius: '8px' }}>
                                <div>
                                    <div style={{ fontWeight: 600, color: '#111827', marginBottom: '4px' }}>SMS Notifications</div>
                                    <div style={{ fontSize: '14px', color: '#6b7280' }}>Receive SMS alerts for urgent matters</div>
                                </div>
                                <label style={{ position: 'relative', display: 'inline-block', width: '56px', height: '28px' }}>
                                    <input
                                        type="checkbox"
                                        checked={settings.smsNotifications}
                                        onChange={() => handleToggle('smsNotifications')}
                                        style={{ opacity: 0, width: 0, height: 0 }}
                                    />
                                    <span style={{
                                        position: 'absolute',
                                        cursor: 'pointer',
                                        top: 0,
                                        left: 0,
                                        right: 0,
                                        bottom: 0,
                                        backgroundColor: settings.smsNotifications ? '#3b82f6' : '#d1d5db',
                                        transition: '0.3s',
                                        borderRadius: '28px'
                                    }}>
                                        <span style={{
                                            position: 'absolute',
                                            content: '',
                                            height: '20px',
                                            width: '20px',
                                            left: settings.smsNotifications ? '32px' : '4px',
                                            bottom: '4px',
                                            backgroundColor: 'white',
                                            transition: '0.3s',
                                            borderRadius: '50%'
                                        }}></span>
                                    </span>
                                </label>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: '#f9fafb', borderRadius: '8px' }}>
                                <div>
                                    <div style={{ fontWeight: 600, color: '#111827', marginBottom: '4px' }}>New Lead Alerts</div>
                                    <div style={{ fontSize: '14px', color: '#6b7280' }}>Get notified when new leads are assigned</div>
                                </div>
                                <label style={{ position: 'relative', display: 'inline-block', width: '56px', height: '28px' }}>
                                    <input
                                        type="checkbox"
                                        checked={settings.leadAlerts}
                                        onChange={() => handleToggle('leadAlerts')}
                                        style={{ opacity: 0, width: 0, height: 0 }}
                                    />
                                    <span style={{
                                        position: 'absolute',
                                        cursor: 'pointer',
                                        top: 0,
                                        left: 0,
                                        right: 0,
                                        bottom: 0,
                                        backgroundColor: settings.leadAlerts ? '#3b82f6' : '#d1d5db',
                                        transition: '0.3s',
                                        borderRadius: '28px'
                                    }}>
                                        <span style={{
                                            position: 'absolute',
                                            content: '',
                                            height: '20px',
                                            width: '20px',
                                            left: settings.leadAlerts ? '32px' : '4px',
                                            bottom: '4px',
                                            backgroundColor: 'white',
                                            transition: '0.3s',
                                            borderRadius: '50%'
                                        }}></span>
                                    </span>
                                </label>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: '#f9fafb', borderRadius: '8px' }}>
                                <div>
                                    <div style={{ fontWeight: 600, color: '#111827', marginBottom: '4px' }}>Property Updates</div>
                                    <div style={{ fontSize: '14px', color: '#6b7280' }}>Receive updates on property status changes</div>
                                </div>
                                <label style={{ position: 'relative', display: 'inline-block', width: '56px', height: '28px' }}>
                                    <input
                                        type="checkbox"
                                        checked={settings.propertyUpdates}
                                        onChange={() => handleToggle('propertyUpdates')}
                                        style={{ opacity: 0, width: 0, height: 0 }}
                                    />
                                    <span style={{
                                        position: 'absolute',
                                        cursor: 'pointer',
                                        top: 0,
                                        left: 0,
                                        right: 0,
                                        bottom: 0,
                                        backgroundColor: settings.propertyUpdates ? '#3b82f6' : '#d1d5db',
                                        transition: '0.3s',
                                        borderRadius: '28px'
                                    }}>
                                        <span style={{
                                            position: 'absolute',
                                            content: '',
                                            height: '20px',
                                            width: '20px',
                                            left: settings.propertyUpdates ? '32px' : '4px',
                                            bottom: '4px',
                                            backgroundColor: 'white',
                                            transition: '0.3s',
                                            borderRadius: '50%'
                                        }}></span>
                                    </span>
                                </label>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: '#f9fafb', borderRadius: '8px' }}>
                                <div>
                                    <div style={{ fontWeight: 600, color: '#111827', marginBottom: '4px' }}>Weekly Reports</div>
                                    <div style={{ fontSize: '14px', color: '#6b7280' }}>Receive weekly performance reports via email</div>
                                </div>
                                <label style={{ position: 'relative', display: 'inline-block', width: '56px', height: '28px' }}>
                                    <input
                                        type="checkbox"
                                        checked={settings.weeklyReports}
                                        onChange={() => handleToggle('weeklyReports')}
                                        style={{ opacity: 0, width: 0, height: 0 }}
                                    />
                                    <span style={{
                                        position: 'absolute',
                                        cursor: 'pointer',
                                        top: 0,
                                        left: 0,
                                        right: 0,
                                        bottom: 0,
                                        backgroundColor: settings.weeklyReports ? '#3b82f6' : '#d1d5db',
                                        transition: '0.3s',
                                        borderRadius: '28px'
                                    }}>
                                        <span style={{
                                            position: 'absolute',
                                            content: '',
                                            height: '20px',
                                            width: '20px',
                                            left: settings.weeklyReports ? '32px' : '4px',
                                            bottom: '4px',
                                            backgroundColor: 'white',
                                            transition: '0.3s',
                                            borderRadius: '50%'
                                        }}></span>
                                    </span>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>

                {/* <div className="admin-card" style={{ marginBottom: '24px' }}>
                    <div className="admin-card-header">
                        <h2>General Settings</h2>
                    </div>
                    <div className="admin-card-body">
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
                                    Theme
                                </label>
                                <select
                                    value={settings.theme}
                                    onChange={(e) => setSettings({ ...settings, theme: e.target.value })}
                                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '2px solid #e5e7eb' }}
                                >
                                    <option value="light">Light</option>
                                    <option value="dark">Dark</option>
                                    <option value="auto">Auto</option>
                                </select>
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
                                    Language
                                </label>
                                <select
                                    value={settings.language}
                                    onChange={(e) => setSettings({ ...settings, language: e.target.value })}
                                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '2px solid #e5e7eb' }}
                                >
                                    <option value="en">English</option>
                                    <option value="hi">Hindi</option>
                                    <option value="gu">Gujarati</option>
                                </select>
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
                                    Timezone
                                </label>
                                <select
                                    value={settings.timezone}
                                    onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '2px solid #e5e7eb' }}
                                >
                                    <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                                    <option value="Asia/Dubai">Asia/Dubai (GST)</option>
                                    <option value="America/New_York">America/New_York (EST)</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div> */}

                {/* <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                        type="submit"
                        className="admin-btn admin-btn-primary"
                        disabled={saving}
                    >
                        {saving ? (
                            <>
                                <i className="fa-solid fa-spinner fa-spin"></i>
                                Saving...
                            </>
                        ) : (
                            <>
                                <i className="fa-solid fa-save"></i>
                                Save Settings
                            </>
                        )}
                    </button>
                </div> */}
            </form>
        </div>
    );
}
