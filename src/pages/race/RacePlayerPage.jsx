import {useNavigate} from "react-router-dom";
import {useEffect, useState} from "react";
import {useWebSocket} from "../../services/webSocket/WebSocketContext.js";
import RaceLobby from "../../components/race/RaceLobby.jsx";
import RaceActiveHost from "../../components/race/RaceActiveHost.jsx";
import RaceResults from "../../components/race/RaceResults.jsx";

function RacePlayerPage({ roomCode, joinToken }) {
    const navigate = useNavigate();
    const { isConnected, lastMessage,clearLastMessage, error,clearError, sendMessage, subscribe} = useWebSocket();
    //const [raceState, setRaceState] = useState();
    const [raceState, setRaceState] = useState(null);


    useEffect(() => {
        // צריך בקשה לשלוח את כל הנתונים כל המירוץ קודם כל
        const queue = `/user/queue/race/feedback`;

        const unsubscribeQueue = subscribe(queue, (data) => {
            console.log("קיבלנו הודעה חדשה מהסוקט:", data);

            }
        );

        const topic = `/topic/race/${roomCode}/updates`;

        const unsubscribeTopic = subscribe(topic, (data) => {
                console.log("קיבלנו הודעה חדשה מהסוקט:", data);

            },joinToken
        );

        sendMessage(`/app/race/${roomCode}/player/sync`, {});

        return () => {
            if (unsubscribeQueue){
                unsubscribeQueue();
            }
            if (unsubscribeTopic){
                unsubscribeTopic();
            }
        };

    }, [isConnected, roomCode, sendMessage, subscribe,joinToken]);

    useEffect(() => {
        if (lastMessage) {
            alert(lastMessage.type);
            clearLastMessage();
            navigate("/")
        }

    },[lastMessage,navigate,clearLastMessage]);

    if (!raceState) return <div>טוען נתוני מרוץ...</div>;

    switch (raceState.status) {
        case 'PENDING':
            return <RaceLobby raceState={raceState}  isHost={false} />;
        case 'IN_PROGRESS':
            return <RaceActiveHost raceState={raceState} />;
        case 'FINISHED': // או COMPLETED
            return <RaceResults players={raceState.players} />;
        default:
            return <div>סטטוס מירוץ לא חוקי: {raceState.status}</div>;
    }
}

export default RacePlayerPage;