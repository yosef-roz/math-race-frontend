import React, { memo } from 'react';

// 1. קומפוננטת בן שעטופה ב-memo
// היא תרונדר מחדש *רק* אם ה-props שלה (השחקן הספציפי או יעד הניקוד) השתנו
const PlayerRow = memo(({ player, targetScore }) => {

    // חישוב אחוזי ההתקדמות של השחקן
    const progress = Math.min((player.currentScore / targetScore) * 100, 100);

    return (
        <div style={{ border: '1px solid gray', padding: '10px', borderRadius: '5px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <strong>{player.nickname}</strong>
                <span>{player.currentScore} נקודות</span>
            </div>

            <div style={{ width: '100%', backgroundColor: '#eee', height: '10px', marginTop: '5px' }}>
                <div style={{
                    width: `${progress}%`,
                    backgroundColor: 'green',
                    height: '100%',
                    transition: 'width 0.3s ease-in-out' // בונוס: אנימציה חלקה כשמד ההתקדמות עולה
                }}></div>
            </div>
        </div>
    );
});

// 2. קומפוננטת האב
function RaceActiveHost({ raceState }) {
    return (
        <div>
            <header>
                <h1>{raceState.name} - המרוץ החל!</h1>
                <h3>יעד ניקוד לניצחון: {raceState.targetScore}</h3>
            </header>

            <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {raceState.players.map(player => (
                    <PlayerRow
                        key={player.id} // ה-KEY הקריטי שציינת
                        player={player}
                        targetScore={raceState.targetScore}
                    />
                ))}
            </div>
        </div>
    );
}

export default RaceActiveHost;