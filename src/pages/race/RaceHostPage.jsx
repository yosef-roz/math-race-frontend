import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useWebSocket } from "../../services/webSocket/WebSocketContext.js";
import RaceLobby from "../../components/race/RaceLobby";
import RaceResults from "../../components/race/RaceResults";
import RaceActiveHost from "../../components/race/RaceActiveHost.jsx";
import { ClipLoader } from "react-spinners";

function RaceHostPage({ roomCode, joinToken }) {
    const navigate = useNavigate();
    const { isConnected, lastMessage, clearLastMessage, sendMessage, subscribe } = useWebSocket();
    const [raceState, setRaceState] = useState(null);
    const hasSynced = useRef(false);

    const formatPlayer = (player) => ({
        id: player.id,
        nickname: player.nickname,
        currentScore: player.currentScore,
        online: player.online,
        userName: player.userName,
        carColor: player.carColor,
        trackState: player.trackState,

        currentQuestion: player.currentQuestion ? {
            expression: player.currentQuestion.expression,
            options: player.currentQuestion.options,
            timeLimitMillis: player.currentQuestion.timeLimitMillis,
            questionRemainingTimeMillis: player.currentQuestion.questionRemainingTimeMillis,
            score: player.currentQuestion.score
        } : null,

        currentJunction: player.currentJunction ? {
            expression: player.currentJunction.expression,
            offer1: player.currentJunction.offer1,
            offer2: player.currentJunction.offer2,
            timeLimitMillis: player.currentJunction.timeLimitMillis,
            questionRemainingTimeMillis: player.currentJunction.questionRemainingTimeMillis
        } : null
    });



    useEffect(() => {
        if (!isConnected) return;

        const queue = `/user/queue/race/host`;
        const topic = `/topic/race/${roomCode}/updates`;

        const unsubscribeTopic = subscribe(topic, (data) => {
            console.log("קיבלנו הודעת Topic (באבא):", data);

            if (data.type === 'PLAYER_JOINED') {
                setRaceState(prevState => {
                    if (!prevState) return null;
                    const isPlayerExists = prevState.players.some(p => p.id === data.data.player.id);
                    if (isPlayerExists) return prevState;

                    return {
                        ...prevState,
                        players: [...prevState.players, formatPlayer(data.data.player)]
                    };
                });

            } else if (data.type === 'PLAYER_CONNECTION' || data.type === 'HOST_CONNECTION') {
                setRaceState(prevState => {
                    if (!prevState) return null;

                    // תיקון חריגה 2: טיפול מלא במנהל כולל שינוי שם אם קרה
                    if (data.type === 'HOST_CONNECTION' && prevState.host.id === data.data.id) {
                        return {
                            ...prevState,
                            host: {
                                ...prevState.host,
                                online: data.data.online,
                                nickname: data.data.nickname || prevState.host.nickname
                            }
                        };
                    }

                    // טיפול בשחקנים
                    return {
                        ...prevState,
                        players: prevState.players.map(p =>
                            p.id === data.data.id ? {
                                ...p,
                                online: data.data.online,
                                nickname: data.data.nickname || p.nickname
                            } : p
                        )
                    };
                });

            } else if (data.type === 'PLAYER_KICKED') {
                setRaceState(prevState => {
                    if (!prevState) return null;
                    return {
                        ...prevState,
                        players: prevState.players.filter(p => p.id !== data.data.playerId)
                    };
                });
            } else if (['RACE_START', 'RACE_PAUSED', 'RACE_RESUMED', 'RACE_CANCELLED'].includes(data.type)) {
                setRaceState(prevState => {
                    if (!prevState) return null;
                    return {
                        ...prevState,
                        status: data.data.status, // ENUM
                        remainingTimeMs: data.data.remainingTimeMs, // עודכן: מסנכרן את הזמן שנותר מהשרת
                        receivedAt: Date.now()

                    };
                });

                if (data.type === 'RACE_RESUMED') {
                    console.log("מבקש סנכרון נתונים פרטי מהשרת...");
                    sendMessage(`/app/race/${roomCode}/host/sync`, {});
                }

            } else if (data.type === 'RACE_COMPLETED') {
                setRaceState(prevState => {
                    if (!prevState) return null;
                    return {
                        ...prevState,
                        status: data.data.status, // ENUM: 'FINISHED'

                        // מיפוי רשימת השחקנים (PlayerProgressDTO)
                        players: data.data.players ? data.data.players.map(player => ({
                            id: player.id,
                            userName: player.userName,
                            nickname: player.nickname,
                            carColor: player.carColor,
                            currentScore: player.currentScore,
                            online: player.isOnline !== undefined ? player.isOnline : player.online, // Jackson serializes 'isOnline' usually as 'online'
                            trackState: player.trackState,

                            currentQuestion: player.currentQuestion ? {
                                expression: player.currentQuestion.expression,
                                options: player.currentQuestion.options,
                                timeLimitMillis: player.currentQuestion.timeLimitMillis,
                                questionRemainingTimeMillis: player.currentQuestion.questionRemainingTimeMillis,
                                score: player.currentQuestion.score,
                                receivedAt: Date.now()
                            } : null,

                            currentJunction: player.currentJunction ? {
                                expression: player.currentJunction.expression,
                                offer1: player.currentJunction.offer1,
                                offer2: player.currentJunction.offer2,
                                timeLimitMillis: player.currentJunction.timeLimitMillis,
                                questionRemainingTimeMillis: player.currentJunction.questionRemainingTimeMillis,
                                receivedAt: Date.now()
                            } : null
                        })) : prevState.players,

                        // מיפוי הסטטיסטיקות (RaceStatisticsDTO)
                        statistics: data.data.statistics ? {
                            accuracyPercentage: data.data.statistics.accuracyPercentage,
                            autostradaPercentage: data.data.statistics.autostradaPercentage,
                            dirtRoadPercentage: data.data.statistics.dirtRoadPercentage,
                            averageResponseTimeMs: data.data.statistics.averageResponseTimeMs,
                            totalJunctionsOffered: data.data.statistics.totalJunctionsOffered,

                            streakMasterId: data.data.statistics.streakMasterId,
                            streakMasterAmount: data.data.statistics.streakMasterAmount,

                            accuracyKingId: data.data.statistics.accuracyKingId,
                            accuracyKingPercentage: data.data.statistics.accuracyKingPercentage,

                            speedDemonId: data.data.statistics.speedDemonId,
                            speedDemonTimeMs: data.data.statistics.speedDemonTimeMs
                        } : null
                    };
                });
            }
        }, joinToken);

        // האזנה לערוץ הפרטי - רק עבור הסנכרון ההתחלתי של המנהל
        const unsubscribeQueue = subscribe(queue, (data) => {
            if (data.type === 'RACE_FULL_STATE') {
                console.log("סנכרון מלא מהשרת:", data.data);

                setRaceState({
                    // שדות מתוך RaceStateDTO
                    name: data.data.name,
                    roomCode: data.data.roomCode,
                    targetScore: data.data.targetScore,
                    status: data.data.status, // ENUM: 'PENDING', 'IN_PROGRESS', 'PAUSED', 'FINISHED', 'CANCELLED'
                    totalDurationMillis: data.data.totalDurationMillis,
                    remainingTimeMs: data.data.remainingTimeMs,
                    receivedAt: Date.now(),

                    // מיפוי אובייקט ה-HostDetailsDTO
                    host: {
                        id: data.data.host.id,
                        userName : data.data.host.userName,
                        nickname: data.data.host.nickname,
                        online: data.data.host.online // BOL: true / false
                    },

                    // מיפוי רשימת ה-PlayerProgressDTO
                    players: data.data.players.map(player => ({
                        id: player.id,
                        userName: player.userName,
                        nickname: player.nickname,
                        carColor: player.carColor,
                        currentScore: player.currentScore,
                        online: player.online, // BOL: true / false
                        trackState: player.trackState, // ENUM: 'REGULAR', 'WAITING_FOR_CHOICE', 'AUTOSTRADA', 'DIRT_ROAD'

                        currentQuestion: player.currentQuestion ? {
                            expression: player.currentQuestion.expression,
                            options: player.currentQuestion.options, // Array of Strings
                            timeLimitMillis: player.currentQuestion.timeLimitMillis,
                            questionRemainingTimeMillis: player.currentQuestion.questionRemainingTimeMillis,
                            score: player.currentQuestion.score,
                            receivedAt: Date.now()
                        } : null,

                        currentJunction: player.currentJunction ? {
                            expression: player.currentJunction.expression,
                            offer1: player.currentJunction.offer1,
                            offer2: player.currentJunction.offer2,
                            timeLimitMillis: player.currentJunction.timeLimitMillis,
                            questionRemainingTimeMillis: player.currentJunction.questionRemainingTimeMillis,
                            receivedAt: Date.now()
                        } : null
                    }))
                });
            }
        }, joinToken);

        if (!hasSynced.current) {
            sendMessage(`/app/race/${roomCode}/host/sync`, {});
            hasSynced.current = true;
        }

        return () => {
            if (unsubscribeTopic) unsubscribeTopic();
            if (unsubscribeQueue) unsubscribeQueue();
        };
    }, [isConnected, roomCode, sendMessage, subscribe, joinToken]);

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

    const handleStartRace = () => {
        sendMessage(`/app/race/${roomCode}/host/start`, {});
    };

    const handleKickPlayer = (playerId) => {
        sendMessage(`/app/race/${roomCode}/host/kick`, {playerId: playerId});
    };

    const handleSendMessageToPlayer = (playerId,messageInput) => {
        sendMessage(`/app/race/${roomCode}/host/message-to-player`,
            {playerId: playerId, message: messageInput});
    };

    const handlePauseRace = () => {
        sendMessage(`/app/race/${roomCode}/host/pause`, {});
    };

    const handleResumeRace = () => {
        sendMessage(`/app/race/${roomCode}/host/resume`, {});
    };

    const handleCancelRace = () => {
        sendMessage(`/app/race/${roomCode}/host/cancel`, {});
    };

    if (!raceState) {
        return (
            <div>
                <ClipLoader />
                <p>Loading race data...</p>
            </div>
        );
    }

    switch (raceState.status) {
        case 'PENDING':
            return <RaceLobby raceState={raceState} onStartRace={handleStartRace} isHost={true} />;
        case 'PAUSED':
        case 'IN_PROGRESS':
            return (
                <RaceActiveHost
                    raceState={raceState}
                    setRaceState={setRaceState}
                    roomCode={roomCode}
                    joinToken={joinToken}
                    onKickPlayer={handleKickPlayer}
                    onSendMessageToPlayer={handleSendMessageToPlayer}
                    onPauseRace={handlePauseRace}
                    onResumeRace={handleResumeRace}
                    onCancelRace={handleCancelRace}
                />
            );
        case 'FINISHED':
            return <RaceResults raceState={raceState} />;
        default:
            return <div>Invalid race status: {raceState.status}</div>;
    }
}

export default RaceHostPage;