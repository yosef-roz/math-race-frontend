import React, { useEffect, useRef, memo } from 'react';
import {useWebSocket} from "../../services/webSocket/WebSocketContext.js";

const PlayerRow = memo(({ player, targetScore }) => {
    const progress = Math.min((player.currentScore / targetScore) * 100, 100);

    return (
        <div>
            <div>
                <strong>{player.nickname}</strong>
                <span>{player.currentScore} points</span>
            </div>
            <div>
                <div style={{ width: `${progress}%`, backgroundColor: 'blue', height: '10px' }}></div>
            </div>
        </div>
    );
});

function RaceActiveHost({ raceState, setRaceState, roomCode, joinToken }) {
    const { isConnected, sendMessage, subscribe } = useWebSocket();
    const hasSynced = useRef(false);

    useEffect(() => {
        const queue = `/user/queue/race/host`;

        const unsubscribe = subscribe(queue, (data) => {
            console.log("קיבלנו הודעה חדשה מהסוקט ב-ActiveHost:", data);

            // ציינת שתטפל בשינויי סטטוס (RACE_START וכו') במקום אחר,
            // אבל השארתי כאן את העדכונים של הניקוד והשחקנים שרלוונטיים למירוץ עצמו:

            if (data.type === 'PLAYER_CONNECTION') {
                setRaceState(prevState => {
                    if (!prevState) return null;
                    return {
                        ...prevState,
                        players: prevState.players.map(p =>
                            p.id === data.data.id ? {
                                ...p,
                                online: data.data.online,
                                nickname: data.data.nickname
                            } : p
                        )
                    };
                });
            } else if (data.type === 'PLAYER_ANSWERED_CORRECTLY' || data.type === 'PLAYER_ANSWERED_INCORRECTLY' || data.type === 'PLAYER_TIMEOUT') {
                setRaceState(prevState => {
                    if (!prevState) return null;
                    return {
                        ...prevState,
                        players: prevState.players.map(p =>
                            p.id === data.data.playerId ? {
                                ...p,
                                currentScore: p.currentScore + data.data.score,
                            } : p)
                    };
                });
            } else if (data.type === 'RACE_COMPLETED') {
                // עדיין כדאי לעדכן פה כדי שהאבא ידע לעבור למסך התוצאות
                setRaceState(prevState => {
                    if (!prevState) return null;
                    return {
                        ...prevState,
                        status: data.data.status,
                        players: data.data.players
                    }
                });
            }
        }, joinToken);

        if (!hasSynced.current) {
            sendMessage(`/app/race/${roomCode}/host/sync`, {});
        }

        return () => {
            if (unsubscribe) unsubscribe();
            hasSynced.current = false;
        };
    }, [isConnected, roomCode, sendMessage, subscribe, joinToken, setRaceState]);

    return (
        <div>
            <header>
                <h1>{raceState.name} - The Race is On!</h1>
                <h3>Target Score to Win: {raceState.targetScore}</h3>
            </header>

            <div>
                {raceState.players.map(player => (
                    <PlayerRow
                        key={player.id}
                        player={player}
                        targetScore={raceState.targetScore}
                    />
                ))}
            </div>
        </div>
    );
}

export default RaceActiveHost;