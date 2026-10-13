import React from 'react';
import '../styles/admin-components.css';

interface LeadFollowup {
    followupId: number;
    leadId: number;
    leadName?: string;
    remark: string;
    nextFollowupDate: string;
    reminderDatetime: string;
    createdDate?: string;
}

interface LeadFollowupsModalProps {
    isOpen: boolean;
    leadName: string;
    followups: LeadFollowup[];
    loading: boolean;
    onClose: () => void;
}

export default function LeadFollowupsModal({ isOpen, leadName, followups, loading, onClose }: LeadFollowupsModalProps) {
    if (!isOpen) return null;

    const formatDateTime = (dateString: string) => {
        if (!dateString) return '-';
        try {
            const date = new Date(dateString);
            return date.toLocaleString('en-IN', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return dateString;
        }
    };

    return (
        <>
            {/* Backdrop */}
            <div
                onClick={onClose}
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    zIndex: 9998,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}
            >
                {/* Modal */}
                <div
                    onClick={(e) => e.stopPropagation()}
                    style={{
                        backgroundColor: 'white',
                        borderRadius: '12px',
                        width: '90%',
                        maxWidth: '900px',
                        maxHeight: '80vh',
                        overflow: 'hidden',
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                        zIndex: 9999,
                        display: 'flex',
                        flexDirection: 'column'
                    }}
                >
                    {/* Header */}
                    <div style={{
                        padding: '24px',
                        borderBottom: '1px solid var(--admin-gray-200)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <div>
                            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600', color: 'var(--admin-gray-900)' }}>
                                Lead Follow-ups
                            </h2>
                            <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: 'var(--admin-gray-600)' }}>
                                Follow-ups for: <strong>{leadName}</strong>
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            style={{
                                background: 'none',
                                border: 'none',
                                fontSize: '24px',
                                color: 'var(--admin-gray-400)',
                                cursor: 'pointer',
                                padding: '4px',
                                lineHeight: 1
                            }}
                        >
                            <i className="fa-solid fa-times"></i>
                        </button>
                    </div>

                    {/* Body */}
                    <div style={{
                        padding: '0',
                        overflowY: 'auto',
                        flex: 1
                    }}>
                        {loading ? (
                            <div style={{ textAlign: 'center', padding: '40px' }}>
                                <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '24px', color: 'var(--admin-primary)' }}></i>
                                <p style={{ marginTop: '16px', color: 'var(--admin-gray-600)' }}>Loading follow-ups...</p>
                            </div>
                        ) : followups.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '40px' }}>
                                <i className="fa-solid fa-calendar-xmark" style={{ fontSize: '48px', color: 'var(--admin-gray-400)' }}></i>
                                <h3 style={{ marginTop: '16px', color: 'var(--admin-gray-700)' }}>No Follow-ups Found</h3>
                                <p style={{ color: 'var(--admin-gray-500)' }}>This lead has no follow-ups yet.</p>
                            </div>
                        ) : (
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{
                                    width: '100%',
                                    borderCollapse: 'collapse',
                                    fontSize: '14px'
                                }}>
                                    <thead>
                                        <tr style={{
                                            backgroundColor: 'var(--admin-gray-50)',
                                            borderBottom: '2px solid var(--admin-gray-200)'
                                        }}>
                                            <th style={{
                                                padding: '12px 16px',
                                                textAlign: 'left',
                                                fontWeight: '600',
                                                color: 'var(--admin-gray-700)',
                                                fontSize: '13px',
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.5px',
                                                width: '80px'
                                            }}>
                                                #
                                            </th>
                                            <th style={{
                                                padding: '12px 16px',
                                                textAlign: 'left',
                                                fontWeight: '600',
                                                color: 'var(--admin-gray-700)',
                                                fontSize: '13px',
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.5px'
                                            }}>
                                                Remark
                                            </th>
                                            <th style={{
                                                padding: '12px 16px',
                                                textAlign: 'left',
                                                fontWeight: '600',
                                                color: 'var(--admin-gray-700)',
                                                fontSize: '13px',
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.5px',
                                                width: '180px'
                                            }}>
                                                <i className="fa-solid fa-calendar-days" style={{ marginRight: '6px' }}></i>
                                                Next Follow-up
                                            </th>
                                            <th style={{
                                                padding: '12px 16px',
                                                textAlign: 'left',
                                                fontWeight: '600',
                                                color: 'var(--admin-gray-700)',
                                                fontSize: '13px',
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.5px',
                                                width: '180px'
                                            }}>
                                                <i className="fa-solid fa-bell" style={{ marginRight: '6px' }}></i>
                                                Reminder
                                            </th>
                                            <th style={{
                                                padding: '12px 16px',
                                                textAlign: 'left',
                                                fontWeight: '600',
                                                color: 'var(--admin-gray-700)',
                                                fontSize: '13px',
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.5px',
                                                width: '180px'
                                            }}>
                                                Created
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {followups.map((followup, index) => (
                                            <tr
                                                key={followup.followupId}
                                                style={{
                                                    borderBottom: '1px solid var(--admin-gray-200)',
                                                    transition: 'background-color 0.2s',
                                                    backgroundColor: index % 2 === 0 ? 'white' : 'var(--admin-gray-50)'
                                                }}
                                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f0f9ff'}
                                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = index % 2 === 0 ? 'white' : 'var(--admin-gray-50)'}
                                            >
                                                <td style={{
                                                    padding: '16px',
                                                    color: 'var(--admin-gray-900)',
                                                    fontWeight: '600'
                                                }}>
                                                    <div style={{
                                                        display: 'inline-block',
                                                        backgroundColor: 'var(--admin-primary-light)',
                                                        color: 'var(--admin-primary)',
                                                        padding: '4px 10px',
                                                        borderRadius: '6px',
                                                        fontSize: '12px',
                                                        fontWeight: '600'
                                                    }}>
                                                        {index + 1}
                                                    </div>
                                                </td>
                                                <td style={{
                                                    padding: '16px',
                                                    color: 'var(--admin-gray-900)',
                                                    lineHeight: '1.5'
                                                }}>
                                                    {followup.remark}
                                                </td>
                                                <td style={{
                                                    padding: '16px'
                                                }}>
                                                    <div style={{
                                                        fontSize: '13px',
                                                        color: 'var(--admin-gray-700)',
                                                        fontFamily: 'monospace',
                                                        backgroundColor: 'var(--admin-gray-100)',
                                                        padding: '6px 10px',
                                                        borderRadius: '6px',
                                                        display: 'inline-block'
                                                    }}>
                                                        {formatDateTime(followup.nextFollowupDate)}
                                                    </div>
                                                </td>
                                                <td style={{
                                                    padding: '16px'
                                                }}>
                                                    <div style={{
                                                        fontSize: '13px',
                                                        color: '#92400e',
                                                        fontFamily: 'monospace',
                                                        backgroundColor: '#fef3c7',
                                                        padding: '6px 10px',
                                                        borderRadius: '6px',
                                                        display: 'inline-block'
                                                    }}>
                                                        {formatDateTime(followup.reminderDatetime)}
                                                    </div>
                                                </td>
                                                <td style={{
                                                    padding: '16px',
                                                    color: 'var(--admin-gray-600)',
                                                    fontSize: '13px'
                                                }}>
                                                    {followup.createdDate ? formatDateTime(followup.createdDate) : '-'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div style={{
                        padding: '16px 24px',
                        borderTop: '1px solid var(--admin-gray-200)',
                        display: 'flex',
                        justifyContent: 'flex-end'
                    }}>
                        <button
                            onClick={onClose}
                            className="admin-btn admin-btn-secondary"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
