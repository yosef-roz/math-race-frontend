import React from 'react';

function RaceResults({ players }) {
    // מיון השחקנים מהמקום הראשון לאחרון לפי ניקוד
    const sortedPlayers = [...players].sort((a, b) => b.currentScore - a.currentScore);

    return (
        <div style={{ textAlign: 'center' }}>
            <h1>סיום המרוץ!</h1>
            <h2>דירוג סופי:</h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '400px', margin: '0 auto' }}>
                {sortedPlayers.map((player, index) => {
                    let positionStyle = {};
                    if (index === 0) positionStyle = { backgroundColor: 'gold', fontWeight: 'bold' };
                    else if (index === 1) positionStyle = { backgroundColor: 'silver' };
                    else if (index === 2) positionStyle = { backgroundColor: '#cd7f32' }; // ארד

                    return (
                        <div key={player.id} style={{ ...positionStyle, padding: '15px', border: '1px solid black', display: 'flex', justifyContent: 'space-between' }}>
                            <span>מקום {index + 1}: {player.nickname}</span>
                            <span>{player.currentScore} נקודות</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default RaceResults;