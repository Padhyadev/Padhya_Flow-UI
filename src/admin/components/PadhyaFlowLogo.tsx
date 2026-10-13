import React from 'react';
import '../styles/padhya-flow-logo.css';

interface PadhyaFlowLogoProps {
    size?: 'small' | 'medium' | 'large';
    className?: string;
}

export const PadhyaFlowLogo: React.FC<PadhyaFlowLogoProps> = ({ size = 'medium', className = '' }) => {
    return (
        <div className={`pf-logo-container ${size} ${className}`}>
            <div className="pf-orbit pf-orbit-1">
                <div className="pf-dot"></div>
            </div>
            <div className="pf-orbit pf-orbit-2"></div>
            <div className="pf-orbit pf-orbit-3"></div>
            <div className="pf-core"></div>
        </div>
    );
};
