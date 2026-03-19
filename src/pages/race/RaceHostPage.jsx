import { useNavigate } from "react-router-dom";
import { useWebSocket } from "../../services/WebSocketContext.js";
import { useEffect, useState } from "react";
import RaceLobby from "../../components/race/RaceLobby";
import RaceResults from "../../components/race/RaceResults";
import RaceActiveHost from "../../components/race/RaceActiveHost.jsx";

function RaceHostPage({ roomCode , joinToken }) {
    const navigate = useNavigate();
    const { isConnected, lastMessage, clearLastMessage, error, clearError, sendMessage, subscribe } = useWebSocket();
    const [raceState, setRaceState] = useState(null);

    useEffect(() => {
        const queue = `/user/queue/race/host`;

        const unsubscribe = subscribe(queue, (data) => {
            console.log("קיבלנו הודעה חדשה מהסוקט:", data);

            if (data.type === 'RACE_FULL_STATE') {
                setRaceState(data.data);
            } else if (data.type === 'PLAYER_JOINED') {
                setRaceState(prevState => {
                    if (!prevState) return null;
                    const isAlreadyIn = prevState.players.some(p => p.id === data.data.player.id);
                    if (isAlreadyIn) return prevState;
                    return { ...prevState, players: [...prevState.players, data.data.player] };
                });
            } else if (data.type === 'PLAYER_CONNECTION') {
                setRaceState(prevState => {
                    if (!prevState) return null;
                    return {
                        ...prevState,
                        players: prevState.players.map(p =>
                            p.id === data.data.id ? { ...p, online: data.data.online } : p
                        )
                    };
                });
            }
        },joinToken);

        sendMessage(`/app/race/${roomCode}/host/sync`, {});

        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [isConnected, roomCode, sendMessage, subscribe,joinToken]);

    useEffect(() => {
        if (lastMessage) {
            setTimeout(() => {
                alert(lastMessage.type);
                console.log(lastMessage.type);
                clearLastMessage();
                navigate("/");
            }, 50);
        }
    }, [lastMessage, navigate, clearLastMessage]);

    // פונקציה להתחלת המירוץ שנעביר למסך ההמתנה
    const handleStartRace = () => {
        sendMessage(`/app/race/${roomCode}/start`, {});
    };

    if (!raceState) return <div>טוען נתוני מרוץ...</div>;

    // ניתוב התצוגה לפי סטטוס המירוץ
    switch (raceState.status) {
        case 'PENDING':
            return <RaceLobby raceState={raceState} onStartRace={handleStartRace} isHost={true} />;
        case 'IN_PROGRESS':
        case 'ACTIVE':
            return <RaceActiveHost raceState={raceState} />;
        case 'FINISHED': // או COMPLETED
            return <RaceResults players={raceState.players} />;
        default:
            return <div>סטטוס מירוץ לא חוקי: {raceState.status}</div>;
    }
}

export default RaceHostPage;