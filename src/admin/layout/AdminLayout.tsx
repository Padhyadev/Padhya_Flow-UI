import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import AdminNavbar from './AdminNavbar';

export default function AdminLayout() {
    // Lifted state for mobile sidebar
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    const closeMobileMenu = () => {
        setIsMobileMenuOpen(false);
    };

    return (
        <div className="admin-layout">
            <div
                className={`admin-sidebar-backdrop ${isMobileMenuOpen ? 'active' : ''}`}
                onClick={closeMobileMenu}
            ></div>

            <AdminSidebar
                mobileOpen={isMobileMenuOpen}
                closeMobileMenu={closeMobileMenu}
            />

            <div className="admin-main">
                <AdminNavbar onToggleMobileMenu={toggleMobileMenu} />
                <main className="admin-content">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
