import React from "react";
import { ClipLoader } from "react-spinners";

function TopAlertBanner({ alertConfig }) {
    if (!alertConfig) return null;

    const isError = alertConfig.type === 'error';
    const mainColor = isError ? '#dc3545' : '#28a745';

    const bannerStyle = {
        position: 'fixed',
        top: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: '#ffffff',
        border: `2px solid ${mainColor}`,
        color: mainColor,
        padding: '12px 24px',
        borderRadius: '50px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
        zIndex: 10000,
        fontWeight: 'bold',
        fontFamily: "'Rubik', 'Heebo', 'Assistant', 'Segoe UI', Tahoma, sans-serif",
        animation: 'slideDownAlert 0.3s ease-out'
    };

    return (
        <>
            <style>
                {`
                    @keyframes slideDownAlert {
                        from { top: -50px; opacity: 0; }
                        to { top: 20px; opacity: 1; }
                    }
                `}
            </style>

            <div style={bannerStyle}>
                {alertConfig.isLoading && <ClipLoader size={20} color={mainColor} />}
                <span>{alertConfig.message}</span>
            </div>
        </>
    );
}

export default TopAlertBanner;