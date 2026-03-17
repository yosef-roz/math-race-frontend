import { useNavigate, useParams } from 'react-router-dom';
import { useWebSocket } from "../../services/WebSocketContext.js";
import { useCallback, useEffect, useState } from "react";
import RacePlayerPage from "./RacePlayerPage.jsx";
import RaceHostPage from "./RaceHostPage.jsx";
import { raceInfo } from "../../services/authService.js";

function RacePage() {
    const navigate = useNavigate();
    const { roomCode } = useParams();
    const [userRole, setUserRole] = useState('Waiting');

    const { isConnected } = useWebSocket();

    const checkInfo = useCallback(async () => {
        try {
            const response = await raceInfo(roomCode);
            if (response.success) {
                setUserRole(response.data.host ? "HOST" : "PLAYER");
            } else {
                if (response.errorCode === 1404 || response.errorCode === 1407) {
                    alert(response.message);
                    navigate('/race/join');
                } else {
                    alert(response.message);
                    navigate('/');
                }
            }
        } catch (error) {
            alert(error + "שגיאת תקשורת");
            navigate('/');
        }
    }, [roomCode, navigate]);

    useEffect(() => {
        if (isConnected && userRole === 'Waiting') {
            
            Promise.resolve().then(() => {
                checkInfo();
            });
        }
    }, [isConnected, userRole,checkInfo]);

    if (!isConnected) {
        return <div>מתחבר...</div>;
    }

    if (userRole === 'Waiting') {
        return <div>טוען נתונים...</div>;
    }

    return (
        <>
            {userRole === 'HOST' ? (
                <RaceHostPage roomCode={roomCode} />
            ) : (
                <RacePlayerPage roomCode={roomCode} />
            )}
        </>
    );
}

export default RacePage;