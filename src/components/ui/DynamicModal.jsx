import React, { useEffect } from "react";
import { ClipLoader } from "react-spinners";

function DynamicModal({ config, isProcessing }) {
    useEffect(() => {
        if (!config?.autoAction) return;

        const timer = setTimeout(() => {
            config.autoAction.action();
        }, config.autoAction.delayMs);

        return () => clearTimeout(timer);
    }, [config]);

    if (!config) return null;

    return (
        <div style={overlayStyle}>
            <div style={modalStyle}>
                <h2 style={{ marginTop: 0, fontSize: '2rem', marginBottom: '10px' }}>
                    {config.title}
                </h2>
                <p style={{ fontSize: '1.2rem', marginBottom: '30px', opacity: 0.9, textAlign: 'center' }}>
                    {config.message}
                </p>

                {config.buttons && config.buttons.length > 0 && (
                    <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
                        {config.buttons.map((btn, index) => (
                            <button
                                key={index}
                                onClick={btn.onClick}
                                disabled={isProcessing}
                                style={{
                                    ...(buttonStyles[btn.styleType] || buttonStyles.primary),
                                    opacity: isProcessing ? 0.7 : 1
                                }}
                            >
                                {isProcessing && btn.styleType === "primary" ? "Loading..." : btn.label}
                            </button>
                        ))}
                    </div>
                )}

                {(!config.buttons || config.buttons.length === 0 || config.showLoading) && (
                    <div style={{ marginTop: '25px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <ClipLoader size={40} color="#ffffff" speedMultiplier={0.8} />
                        {config.showLoading && (
                            <span style={{ marginTop: '15px', fontSize: '1rem', opacity: 0.9, fontWeight: 'bold' }}>
                                Auto-reconnecting...
                            </span>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

const overlayStyle = {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999
};

const modalStyle = {
    backgroundColor: '#dc3545',
    color: '#ffffff',
    fontFamily: "'Rubik', 'Heebo', 'Assistant', 'Segoe UI', Tahoma, sans-serif",
    minHeight: '25vh',
    width: '50vw',
    minWidth: '320px',
    maxWidth: '800px',
    borderRadius: '24px',
    border: '4px solid #ffffff',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 30px',
    boxSizing: 'border-box',
    boxShadow: '0 20px 50px rgba(0,0,0,0.4)'
};

const baseButtonStyle = {
    padding: '12px 30px',
    borderRadius: '50px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '16px',
    border: 'none',
    fontFamily: "inherit",
    transition: 'all 0.3s ease'
};

const buttonStyles = {
    primary: {
        ...baseButtonStyle,
        backgroundColor: '#ffffff',
        color: '#dc3545',
        boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
    },
    outline: {
        ...baseButtonStyle,
        backgroundColor: 'transparent',
        color: '#ffffff',
        border: '2px solid #ffffff'
    }
};

export default DynamicModal;