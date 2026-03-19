import React, { memo } from 'react';

// --- 1. קומפוננטת כותרת החדר ---
const RaceHeader = memo(({ name, roomCode }) => {
    return (
        <header style={styles.headerContainer}>
            <h1 style={styles.title}>{name}</h1>
            <p style={styles.subtitle}>הזמן שחקנים להצטרף עם הקוד:</p>
            <div style={styles.roomCodeBox}>
                {roomCode}
            </div>
        </header>
    );
});

// --- 2. קומפוננטת כרטיס שחקן ---
const PlayerCard = memo(({ player }) => {
    const isOnline = player.online;

    return (
        <div style={styles.playerCard(isOnline)}>
            <div style={styles.playerInfo}>
                <span style={styles.playerName}>{player.nickname}</span>
                <span style={styles.playerId}>ID: {player.id.substring(0, 15)}...</span>
            </div>

            <div style={styles.statusContainer}>
                <span style={styles.statusText(isOnline)}>
                    {isOnline ? 'מחובר' : 'מנותק'}
                </span>
                <div style={styles.statusDot(isOnline)}></div>
            </div>
        </div>
    );
});

// --- 3. הקומפוננטה הראשית (חדר ההמתנה) ---
function RaceLobby({ raceState, onStartRace, isHost }) {
    return (
        <div style={styles.mainContainer}>
            <div style={styles.contentWrapper}>

                <RaceHeader name={raceState.name} roomCode={raceState.roomCode} />

                <div style={styles.playersSection}>
                    <h3 style={styles.playersTitle}>
                        שחקנים בחדר ({raceState.players.length})
                    </h3>

                    {raceState.players.length === 0 ? (
                        <p style={styles.emptyState}>עדיין אין שחקנים בחדר. מחכים למצטרפים הראשונים...</p>
                    ) : (
                        <div style={styles.playersGrid}>
                            {raceState.players.map(player => (
                                <PlayerCard key={player.id} player={player} />
                            ))}
                        </div>
                    )}
                </div>

                {/* אזור פעולות למנהל */}
                {isHost ? (
                    <footer style={styles.hostFooter}>
                        <h4 style={styles.hostTitle}>פאנל ניהול</h4>
                        <div style={styles.hostActions}>
                            <button
                                onClick={onStartRace}
                                disabled={raceState.players.length === 0}
                                style={raceState.players.length === 0 ? styles.btnDisabled : styles.btnStart}
                            >
                                התחל את המרוץ עכשיו!
                            </button>
                            <button style={styles.btnSettings}>
                                ⚙️ הגדרות חדר
                            </button>
                        </div>
                    </footer>
                ) : (
                    /* אזור המתנה לשחקן רגיל */
                    <footer style={styles.playerFooter}>
                        <div style={styles.spinner}></div>
                        <p style={styles.waitingText}>ממתין שהמנהל יתחיל את המשחק...</p>
                    </footer>
                )}

            </div>
        </div>
    );
}

// --- אובייקט העיצוב (Inline Styles) ---
const styles = {
    mainContainer: {
        minHeight: '100vh',
        backgroundColor: '#f0f2f5',
        display: 'flex',
        justifyContent: 'center',
        padding: '40px 20px',
        direction: 'rtl',
        fontFamily: 'system-ui, -apple-system, sans-serif'
    },
    contentWrapper: {
        backgroundColor: 'white',
        borderRadius: '16px',
        boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
        width: '100%',
        maxWidth: '800px',
        padding: '40px',
        display: 'flex',
        flexDirection: 'column',
        gap: '30px'
    },
    headerContainer: {
        textAlign: 'center',
        borderBottom: '2px solid #f0f2f5',
        paddingBottom: '30px'
    },
    title: {
        fontSize: '2.5rem',
        color: '#1a1a1a',
        margin: '0 0 10px 0',
        fontWeight: '800'
    },
    subtitle: {
        color: '#666',
        fontSize: '1.1rem',
        marginBottom: '15px'
    },
    roomCodeBox: {
        display: 'inline-block',
        backgroundColor: '#e8f0fe',
        color: '#1a73e8',
        fontSize: '2.5rem',
        fontWeight: 'bold',
        letterSpacing: '8px',
        padding: '15px 40px',
        borderRadius: '12px',
        border: '2px dashed #1a73e8'
    },
    playersSection: {
        flex: 1
    },
    playersTitle: {
        fontSize: '1.2rem',
        color: '#333',
        marginBottom: '20px',
        borderBottom: '3px solid #1a73e8',
        display: 'inline-block',
        paddingBottom: '5px'
    },
    emptyState: {
        textAlign: 'center',
        color: '#888',
        fontStyle: 'italic',
        padding: '40px 0'
    },
    playersGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
        gap: '15px'
    },
    playerCard: (isOnline) => ({
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px',
        backgroundColor: isOnline ? '#ffffff' : '#fafafa',
        border: `2px solid ${isOnline ? '#e0e0e0' : '#ffebee'}`,
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        transition: 'transform 0.2s',
        opacity: isOnline ? 1 : 0.7
    }),
    playerInfo: {
        display: 'flex',
        flexDirection: 'column',
        gap: '4px'
    },
    playerName: {
        fontWeight: '700',
        fontSize: '1.1rem',
        color: '#2d3748'
    },
    playerId: {
        fontSize: '0.75rem',
        color: '#a0aec0'
    },
    statusContainer: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
    },
    statusText: (isOnline) => ({
        fontSize: '0.85rem',
        fontWeight: '600',
        color: isOnline ? '#48bb78' : '#f56565'
    }),
    statusDot: (isOnline) => ({
        width: '12px',
        height: '12px',
        borderRadius: '50%',
        backgroundColor: isOnline ? '#48bb78' : '#f56565',
        boxShadow: isOnline ? '0 0 8px rgba(72, 187, 120, 0.4)' : 'none'
    }),
    hostFooter: {
        backgroundColor: '#fff8f1',
        padding: '24px',
        borderRadius: '12px',
        border: '1px solid #feebc8'
    },
    hostTitle: {
        margin: '0 0 15px 0',
        color: '#dd6b20'
    },
    hostActions: {
        display: 'flex',
        gap: '15px'
    },
    btnStart: {
        flex: 2,
        backgroundColor: '#48bb78',
        color: 'white',
        border: 'none',
        padding: '16px',
        borderRadius: '8px',
        fontSize: '1.2rem',
        fontWeight: 'bold',
        cursor: 'pointer',
        boxShadow: '0 4px 12px rgba(72, 187, 120, 0.3)',
        transition: 'background-color 0.2s'
    },
    btnDisabled: {
        flex: 2,
        backgroundColor: '#cbd5e0',
        color: '#718096',
        border: 'none',
        padding: '16px',
        borderRadius: '8px',
        fontSize: '1.2rem',
        fontWeight: 'bold',
        cursor: 'not-allowed'
    },
    btnSettings: {
        flex: 1,
        backgroundColor: 'transparent',
        color: '#dd6b20',
        border: '2px solid #dd6b20',
        padding: '16px',
        borderRadius: '8px',
        fontSize: '1rem',
        fontWeight: 'bold',
        cursor: 'pointer'
    },
    playerFooter: {
        textAlign: 'center',
        padding: '30px',
        backgroundColor: '#f7fafc',
        borderRadius: '12px',
        border: '1px dashed #cbd5e0'
    },
    waitingText: {
        fontSize: '1.2rem',
        color: '#4a5568',
        fontWeight: '500',
        margin: '10px 0 0 0'
    }
};

export default RaceLobby;