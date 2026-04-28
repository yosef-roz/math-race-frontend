import React, { useState, useEffect, useRef, memo } from 'react';
import './RaceActivePlayer.css';
import {useWebSocket} from "../../services/webSocket/WebSocketContext.js";

const BUTTON_COLORS = ['bg-red', 'bg-blue', 'bg-green', 'bg-yellow'];

const TRACK_INFO = {
    REGULAR: { text: "Regular Track", color: "var(--blue)" },
    WAITING_FOR_CHOICE: { text: "Crossroads", color: "var(--yellow)" },
    AUTOSTRADA: { text: "Autostrada", color: "var(--red)" },
    DIRT_ROAD: { text: "Dirt Road", color: "var(--green)" }
};

const TrackBadge = ({ trackState, currentQ, totalQ }) => {
    const info = TRACK_INFO[trackState] || TRACK_INFO.REGULAR;
    return (
        <div className="track-state-badge" style={{ backgroundColor: info.color }}>
            {info.text}
            {currentQ && totalQ ? ` (${currentQ}/${totalQ})` : ''}
        </div>
    );
};

function RaceActivePlayer({ raceState, joinToken, onAnswerQuestion, onChooseJunction }) {
    const { isConnected, subscribe } = useWebSocket();

    // יצירת סטייט מקומי עבור השחקן כדי להגיב מהר לאירועי ה-Queue האישיים שלו
    const [localPlayer, setLocalPlayer] = useState(raceState.myAccount);

    // סנכרון במקרה של עדכון מצב מלא מהשרת (שהאב מעביר)
    useEffect(() => {
        if (raceState.myAccount) {
            setLocalPlayer(raceState.myAccount);
        }
    }, [raceState.myAccount, raceState.receivedAt]);

    const activeEvent = localPlayer?.currentQuestion || localPlayer?.currentJunction;

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [timeLeft, setTimeLeft] = useState(0);

    const [isJustReturned, setIsJustReturned] = useState(false);
    const [scoreDiff, setScoreDiff] = useState(0);
    const [feedbackType, setFeedbackType] = useState('neutral');

    const prevEventRef = useRef(activeEvent);
    const prevTrackRef = useRef(localPlayer?.trackState);
    const prevScoreRef = useRef(localPlayer?.currentScore || 0);

    // האזנה לתורים האישיים של השחקן (שאלות, צמתים, פידבק)
    useEffect(() => {
        if (!isConnected) return;
        const queue = `/user/queue/race/feedback`;

        const unsubscribe = subscribe(queue, (data) => {
            setLocalPlayer(prevPlayer => {
                if (!prevPlayer) return null;
                const updatedPlayer = { ...prevPlayer };

                if (data.type === 'JUNCTION_OFFERED') {
                    updatedPlayer.currentQuestion = null;
                    updatedPlayer.currentJunction = data.data;
                    updatedPlayer.trackState = data.data.state;

                } else if (data.type === 'JUNCTION_CHOOSE' || data.type === 'JUNCTION_TIMEOUT') {
                    updatedPlayer.currentJunction = null;
                    updatedPlayer.trackState = data.data.state;
                    updatedPlayer.totalTrackQuestions = data.data.totalTrackQuestions;

                } else if (data.type === 'TRACK_STATE_CHANGED') {
                    updatedPlayer.trackState = data.data.state;
                    updatedPlayer.totalTrackQuestions = data.data.totalTrackQuestions;

                } else if (data.type === 'NEW_QUESTION') {
                    updatedPlayer.currentQuestion = data.data;

                } else if (data.type === 'CORRECT_ANSWER' || data.type === 'WRONG_ANSWER' || data.type === 'TIMEOUT') {
                    updatedPlayer.currentQuestion = null;
                    updatedPlayer.currentScore = prevPlayer.currentScore + (data.data.score || 0);
                }

                return updatedPlayer;
            });
        }, joinToken);

        return () => { if (unsubscribe) unsubscribe(); };
    }, [isConnected, subscribe, joinToken]);

    // ניהול פידבקים, ניקוד וחזרות ממסלול מיוחד
    useEffect(() => {
        if (prevEventRef.current && !activeEvent) {
            const diff = (localPlayer?.currentScore || 0) - prevScoreRef.current;
            setScoreDiff(diff);
            if (prevEventRef.current.offer1) setFeedbackType('junction-chosen');
            else if (diff > 0) setFeedbackType('positive');
            else if (isSubmitting) setFeedbackType('negative');
            else setFeedbackType('neutral');
        }
        prevEventRef.current = activeEvent;
        prevScoreRef.current = localPlayer?.currentScore || 0;
    }, [activeEvent, localPlayer?.currentScore, isSubmitting]);

    useEffect(() => {
        if (localPlayer?.trackState === 'REGULAR' && prevTrackRef.current && prevTrackRef.current !== 'REGULAR' && prevTrackRef.current !== 'WAITING_FOR_CHOICE') {
            setIsJustReturned(true);
        }
        prevTrackRef.current = localPlayer?.trackState;
    }, [localPlayer?.trackState]);

    useEffect(() => {
        if (activeEvent) {
            setIsJustReturned(false);
            setIsSubmitting(false);
        }
    }, [activeEvent]);

    // ניהול טיימר השאלה
    useEffect(() => {
        if (!activeEvent || activeEvent.questionRemainingTimeMillis == null) return;

        // משתמשים בזמן שרת, אין טעם לסמוך רק על הזמן המקומי מרגע הקבלה כי זה מתאפס ברינדור
        const endTime = Date.now() + activeEvent.questionRemainingTimeMillis;

        const intervalId = setInterval(() => {
            const remaining = Math.max(0, endTime - Date.now());
            setTimeLeft(remaining);
            if (remaining <= 0) clearInterval(intervalId);
        }, 100);
        return () => clearInterval(intervalId);
    }, [activeEvent]);

    const [flipCount, setFlipCount] = useState(0);
    const [faces, setFaces] = useState({
        face0: { type: 'QUESTION', data: activeEvent, track: localPlayer?.trackState },
        face1: null
    });

    let targetType = 'FEEDBACK';
    if (activeEvent) targetType = 'QUESTION';
    else if (isJustReturned) targetType = 'RETURN_TRACK';

    const targetStateId = activeEvent ? `Q-${activeEvent.expression}` : (isJustReturned ? 'RETURN' : 'FEEDBACK');
    const [currentFaceId, setCurrentFaceId] = useState(targetStateId);

    useEffect(() => {
        if (targetStateId !== currentFaceId) {
            const nextFaceContent = {
                type: targetType,
                data: activeEvent,
                track: localPlayer?.trackState,
                totalQ: localPlayer?.totalTrackQuestions,
                currentQ: localPlayer?.totalTrackQuestions && localPlayer?.specialQuestionsRemaining ? (localPlayer.totalTrackQuestions - localPlayer.specialQuestionsRemaining + 1) : null
            };

            setFlipCount(c => c + 1);
            setFaces(prev => {
                if (flipCount % 2 === 0) return { ...prev, face1: nextFaceContent };
                else return { ...prev, face0: nextFaceContent };
            });
            setCurrentFaceId(targetStateId);
        }
    }, [targetStateId, targetType, activeEvent, localPlayer?.trackState, localPlayer?.totalTrackQuestions, localPlayer?.specialQuestionsRemaining, flipCount, currentFaceId]);

    if (!localPlayer) return <div>Loading player data...</div>;

    const remainingSeconds = Math.ceil(timeLeft / 1000);
    const formattedMinutes = String(Math.floor(remainingSeconds / 60)).padStart(2, '0');
    const formattedSeconds = String(remainingSeconds % 60).padStart(2, '0');
    const totalTime = activeEvent?.timeLimitMillis || 1;
    const progressWidth = (timeLeft / totalTime) * 100;
    const isCriticalTime = progressWidth < 25;
    const isQuestionActive = targetType === 'QUESTION';
    const isJunctionView = !!activeEvent?.offer1;

    const renderFace = (content) => {
        if (!content) return null;

        if (content.type === 'QUESTION') {
            const isJunc = !!content.data?.offer1;
            return (
                <>
                    <TrackBadge trackState={content.track} currentQ={content.currentQ} totalQ={content.totalQ} />
                    {!isJunc && content.data?.score && (
                        <div className="points-tag">{content.data.score} pts</div>
                    )}
                    <div className="question-text">{content.data?.expression}</div>
                </>
            );
        }

        if (content.type === 'RETURN_TRACK') {
            return (
                <>
                    <TrackBadge trackState="REGULAR" />
                    <div className="returned-track-msg">
                        The special track has ended.<br/>You returned to the main track!
                    </div>
                </>
            );
        }

        return (
            <>
                <TrackBadge trackState={content.track} currentQ={content.currentQ} totalQ={content.totalQ} />
                <div className="feedback-content">
                    {feedbackType === 'junction-chosen' ? (
                        <div className="feedback-status text-neutral">Preparing for track...</div>
                    ) : (
                        <>
                            <div className={`feedback-status text-${feedbackType}`}>
                                {feedbackType === 'positive' ? 'Correct!' : feedbackType === 'negative' ? 'Wrong' : "Time's up"}
                            </div>
                            <div className={`feedback-score-anim text-${feedbackType}`}>
                                {scoreDiff > 0 ? `+${scoreDiff}` : scoreDiff}
                            </div>
                        </>
                    )}
                </div>
            </>
        );
    };

    return (
        <div className="race-layout-container">
            <header className="race-header">
                <div>{localPlayer.nickname}</div>
                <div>Score: <strong>{localPlayer.currentScore} / {raceState.targetScore}</strong></div>
            </header>

            <div style={{ visibility: isQuestionActive ? 'visible' : 'hidden' }}>
                <div className="timer-wrapper">
                    <div className="timer-labels">
                        <span className="timer-title">Time Left:</span>
                        <span className={`timer-clock ${isCriticalTime ? 'text-critical' : ''}`}>
                            {formattedMinutes}:{formattedSeconds}
                        </span>
                    </div>
                    <div className="timer-container">
                        <div className={`timer-bar ${isCriticalTime ? 'critical' : ''}`} style={{ width: `${progressWidth}%` }} />
                    </div>
                </div>
            </div>

            <div className="flip-card-container">
                <div className="flip-card-inner" style={{ transform: `rotateY(${flipCount * 180}deg)` }}>
                    <div className="flip-card-face face-0">
                        {renderFace(faces.face0)}
                    </div>
                    <div className="flip-card-face face-1">
                        {renderFace(faces.face1)}
                    </div>
                </div>
            </div>

            <div className="options-wrapper">
                {isQuestionActive && (
                    <div className="options-grid">
                        {isJunctionView ? (
                            <>
                                <button className="option-btn bg-red" disabled={isSubmitting || timeLeft <= 0} onClick={() => { setIsSubmitting(true); onChooseJunction(activeEvent.offer1); }}>
                                    Highway
                                    <span className="btn-desc">High risk, fast progress</span>
                                </button>
                                <button className="option-btn bg-green" disabled={isSubmitting || timeLeft <= 0} onClick={() => { setIsSubmitting(true); onChooseJunction(activeEvent.offer2); }}>
                                    Dirt Road
                                    <span className="btn-desc">Safe and steady</span>
                                </button>
                            </>
                        ) : (
                            activeEvent.options.map((opt, i) => (
                                <button
                                    key={i}
                                    className={`option-btn ${BUTTON_COLORS[i % 4]}`}
                                    onClick={() => { setIsSubmitting(true); onAnswerQuestion(opt); }}
                                    disabled={isSubmitting || timeLeft <= 0}
                                >
                                    {opt}
                                </button>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default memo(RaceActivePlayer);