import React, { useState, useEffect, useRef, memo } from 'react';
import './RaceActivePlayer.css';

const BUTTON_COLORS = ['bg-red', 'bg-blue', 'bg-green', 'bg-yellow'];

const TRACK_INFO = {
    REGULAR: { text: "מסלול רגיל", icon: "🛣️", color: "var(--blue)" },
    WAITING_FOR_CHOICE: { text: "צומת דרכים", icon: "🔀", color: "var(--yellow)" },
    AUTOSTRADA: { text: "אוטוסטרדה", icon: "🏎️", color: "var(--red)" },
    DIRT_ROAD: { text: "דרך עפר", icon: "🚜", color: "var(--green)" }
};

// תגית המסלול שמודפסת על הכרטיס ומסתובבת איתו
const TrackBadge = ({ trackState, currentQ, totalQ }) => {
    const info = TRACK_INFO[trackState] || TRACK_INFO.REGULAR;
    return (
        <div className="track-state-badge" style={{ backgroundColor: info.color }}>
            {info.icon} {info.text}
            {currentQ && totalQ ? ` (${currentQ}/${totalQ})` : ''}
        </div>
    );
};

function RaceActivePlayer({ raceState, accountId, onAnswerQuestion, onChooseJunction }) {
    const player = raceState.players.find(p => p.id === accountId);
    const activeEvent = player?.currentQuestion || player?.currentJunctionOffer;

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [timeLeft, setTimeLeft] = useState(0);

    // --- מעקב אחרי סטייט כדי לייצר אירועים ---
    const [isJustReturned, setIsJustReturned] = useState(false);
    const [scoreDiff, setScoreDiff] = useState(0);
    const [feedbackType, setFeedbackType] = useState('neutral');

    const prevEventRef = useRef(activeEvent);
    const prevTrackRef = useRef(player?.trackState);
    const prevScoreRef = useRef(player?.currentScore || 0);

    // חישוב פידבק ברגע שהשאלה נעלמת
    useEffect(() => {
        if (prevEventRef.current && !activeEvent) {
            const diff = (player?.currentScore || 0) - prevScoreRef.current;
            setScoreDiff(diff);
            if (prevEventRef.current.offer1) setFeedbackType('junction-chosen');
            else if (diff > 0) setFeedbackType('positive');
            else if (isSubmitting) setFeedbackType('negative');
            else setFeedbackType('neutral');
        }
        prevEventRef.current = activeEvent;
        prevScoreRef.current = player?.currentScore || 0;
    }, [activeEvent, player?.currentScore, isSubmitting]);

    // זיהוי חזרה למסלול הרגיל
    useEffect(() => {
        if (player?.trackState === 'REGULAR' && prevTrackRef.current && prevTrackRef.current !== 'REGULAR' && prevTrackRef.current !== 'WAITING_FOR_CHOICE') {
            setIsJustReturned(true);
        }
        prevTrackRef.current = player?.trackState;
    }, [player?.trackState]);

    // איפוס מצבים כשיש אירוע חדש
    useEffect(() => {
        if (activeEvent) {
            setIsJustReturned(false);
            setIsSubmitting(false);
        }
    }, [activeEvent]);

    // טיימר ויזואלי
    useEffect(() => {
        if (!activeEvent || activeEvent.questionRemainingTimeMillis == null) return;
        const endTime = Date.now() + activeEvent.questionRemainingTimeMillis;
        const intervalId = setInterval(() => {
            const remaining = Math.max(0, endTime - Date.now());
            setTimeLeft(remaining);
            if (remaining <= 0) clearInterval(intervalId);
        }, 100);
        return () => clearInterval(intervalId);
    }, [activeEvent]);

    // --- לוגיקת סיבוב רציף לפי אירועים בלבד ---
    const [flipCount, setFlipCount] = useState(0);
    const [faces, setFaces] = useState({
        face0: { type: 'QUESTION', data: activeEvent, track: player?.trackState },
        face1: null
    });

    // קובע מה סוג התצוגה שצריכה להיות עכשיו
    let targetType = 'FEEDBACK';
    if (activeEvent) targetType = 'QUESTION';
    else if (isJustReturned) targetType = 'RETURN_TRACK';

    // מייצר ID ייחודי לסטייט הנוכחי. ברגע שה-ID משתנה -> מסתובב!
    const targetStateId = activeEvent ? `Q-${activeEvent.expression}` : (isJustReturned ? 'RETURN' : 'FEEDBACK');
    const [currentFaceId, setCurrentFaceId] = useState(targetStateId);

    useEffect(() => {
        if (targetStateId !== currentFaceId) {
            const nextFaceContent = {
                type: targetType,
                data: activeEvent,
                track: player?.trackState,
                totalQ: player?.totalTrackQuestions,
                currentQ: player?.totalTrackQuestions && player?.specialQuestionsRemaining ? (player.totalTrackQuestions - player.specialQuestionsRemaining + 1) : null
            };

            setFlipCount(c => c + 1);
            setFaces(prev => {
                if (flipCount % 2 === 0) return { ...prev, face1: nextFaceContent };
                else return { ...prev, face0: nextFaceContent };
            });
            setCurrentFaceId(targetStateId);
        }
    }, [targetStateId, targetType, activeEvent, player?.trackState, player?.totalTrackQuestions, player?.specialQuestionsRemaining, flipCount, currentFaceId]);

    if (!player) return <div>טוען נתונים...</div>;

    // עזרים לתצוגה
    const remainingSeconds = Math.ceil(timeLeft / 1000);
    const formattedMinutes = String(Math.floor(remainingSeconds / 60)).padStart(2, '0');
    const formattedSeconds = String(remainingSeconds % 60).padStart(2, '0');
    const totalTime = activeEvent?.timeLimitMillis || 1;
    const progressWidth = (timeLeft / totalTime) * 100;
    const isCriticalTime = progressWidth < 25;
    const isQuestionActive = targetType === 'QUESTION';
    const isJunctionView = !!activeEvent?.offer1;

    // פונקציה שמרנדרת את התוכן של הכרטיס לפי המצב שלו
    const renderFace = (content) => {
        if (!content) return null;

        if (content.type === 'QUESTION') {
            const isJunc = !!content.data?.offer1;
            return (
                <>
                    <TrackBadge trackState={content.track} currentQ={content.currentQ} totalQ={content.totalQ} />
                    {!isJunc && content.data?.score && (
                        <div className="points-tag">{content.data.score} נק'</div>
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
                        הדרך המיוחדת הסתיימה.<br/>חזרת למסלול הראשי! 🛣️
                    </div>
                </>
            );
        }

        return (
            <>
                <TrackBadge trackState={content.track} currentQ={content.currentQ} totalQ={content.totalQ} />
                <div className="feedback-content">
                    {feedbackType === 'junction-chosen' ? (
                        <div className="feedback-status text-neutral">🚗 מתכונן למסלול...</div>
                    ) : (
                        <>
                            <div className={`feedback-status text-${feedbackType}`}>
                                {feedbackType === 'positive' ? 'נכון מאוד!' : feedbackType === 'negative' ? 'טעות' : 'נגמר הזמן'}
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
                <div>יעד: <strong>{raceState.targetScore}</strong></div>
                <div>{player.nickname} | ניקוד: <strong style={{color: 'var(--blue)'}}>{player.currentScore}</strong></div>
            </header>

            <div style={{ visibility: isQuestionActive ? 'visible' : 'hidden' }}>
                <div className="timer-wrapper">
                    <div className="timer-labels">
                        <span className="timer-title">זמן נותר:</span>
                        <span className={`timer-clock ${isCriticalTime ? 'text-critical' : ''}`}>
                            {formattedMinutes}:{formattedSeconds}
                        </span>
                    </div>
                    <div className="timer-container">
                        <div className={`timer-bar ${isCriticalTime ? 'critical' : ''}`} style={{ width: `${progressWidth}%` }} />
                    </div>
                </div>
            </div>

            {/* כרטיס שמסתובב ברציפות לצד אחד לפי מספר הסיבובים */}
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
                                <button className="option-btn bg-autostrada" disabled={isSubmitting || timeLeft <= 0} onClick={() => { setIsSubmitting(true); onChooseJunction(activeEvent.offer1); }}>
                                    אוטוסטרדה
                                    <span className="btn-desc">סיכון גבוה, התקדמות מהירה</span>
                                </button>
                                <button className="option-btn bg-dirtroad" disabled={isSubmitting || timeLeft <= 0} onClick={() => { setIsSubmitting(true); onChooseJunction(activeEvent.offer2); }}>
                                    דרך עפר
                                    <span className="btn-desc">בטוח ויציב</span>
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