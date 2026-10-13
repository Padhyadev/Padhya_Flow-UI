import React from 'react';

/**
 * Debug Component - Shows localStorage contents
 * Add this to any page to see what's stored
 */
export const DebugAuth: React.FC = () => {
    const storedUser = localStorage.getItem('admin_user');
    const token = localStorage.getItem('admin_token');
    const menuPermissions = localStorage.getItem('admin_menu_permissions');

    return (
        <div style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            background: '#1e293b',
            color: '#fff',
            padding: '15px',
            borderRadius: '8px',
            maxWidth: '400px',
            fontSize: '12px',
            zIndex: 9999,
            boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
        }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#60a5fa' }}>🔍 Auth Debug</h4>

            <div style={{ marginBottom: '10px' }}>
                <strong>User:</strong>
                <pre style={{
                    background: '#0f172a',
                    padding: '8px',
                    borderRadius: '4px',
                    overflow: 'auto',
                    maxHeight: '100px',
                    fontSize: '11px'
                }}>
                    {storedUser || 'Not found'}
                </pre>
            </div>

            <div style={{ marginBottom: '10px' }}>
                <strong>Token:</strong>
                <pre style={{
                    background: '#0f172a',
                    padding: '8px',
                    borderRadius: '4px',
                    overflow: 'auto',
                    maxHeight: '60px',
                    fontSize: '11px',
                    wordBreak: 'break-all'
                }}>
                    {token ? token.substring(0, 50) + '...' : 'Not found'}
                </pre>
            </div>

            <div>
                <strong>Menu Permissions:</strong>
                <pre style={{
                    background: '#0f172a',
                    padding: '8px',
                    borderRadius: '4px',
                    overflow: 'auto',
                    maxHeight: '100px',
                    fontSize: '11px'
                }}>
                    {menuPermissions || 'Not found'}
                </pre>
            </div>
        </div>
    );
};

export default DebugAuth;
