import {useNavigate} from "react-router-dom";
import {useWebSocket} from "../../services/WebSocketContext.js";
import {useEffect} from "react";

function RaceHostPage({ roomCode }) {
    const navigate = useNavigate();
    const { isConnected, lastMessage, error, sendMessage, subscribe,} = useWebSocket();

    useEffect(() => {
        // צריך בקשה לשלוח את כל הנתונים כל המירוץ קודם כל
        const queue = `/user/queue/race/host`;

        const unsubscribe = subscribe(queue, (data) => {
            console.log("קיבלנו הודעה חדשה מהסוקט:", data);

            if (data.type === 'PLAYER_JOINED') {
               // setPlayers(data.playersList);
            }
        });

        return () => {
            if (unsubscribe) unsubscribe();
        };

    }, [isConnected, roomCode, subscribe]);


    return (
        <>
           <div>
               עמוד מנהל ברוך הבא!
           </div>
        </>
    )
}

export default RaceHostPage;