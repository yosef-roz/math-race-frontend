import React, { memo, useEffect, useState, useRef } from 'react';
import { FaLightbulb } from "react-icons/fa6";
import './CarPlayer.css';

const getBubbleIcon = (type) => {
    switch(type) {
        case 'CORRECT': return '✅';
        case 'INCORRECT': return '❌';
        case 'TIMEOUT': return '⏰';
        case 'QUESTION': return '❓';
        case 'JUNCTION': return '🔀';
        case 'MESSAGE': return '📩';
        case 'HINT': return '💡';
        default: return '💬';
    }
};

function CarPlayer({ player, targetScore, roadIndex, laneIndex, isHighlighted, onSendMessageToPlayer, raceStatus }) {
    const progressPercent = Math.max(0, Math.min(100, (player.currentScore / targetScore) * 100));
    const laneCenterY = (roadIndex * 80) + (laneIndex * 40) + 20;

    const [activeBubble, setActiveBubble] = useState(null);
    const [isHovered, setIsHovered] = useState(false);
    const [isInputFocused, setIsInputFocused] = useState(false);
    const [messageInput, setMessageInput] = useState('');

    const activeTask = player.currentQuestion || player.currentJunction;
    const carColor = player.carColor;

    const showInfoCard = isHovered || isInputFocused;

    const isAtStart = progressPercent < 15;
    const isAtEnd = progressPercent > 85;
    const isBottomRoad = roadIndex === 2;

    let verticalClass = "position-below";
    if (isBottomRoad) verticalClass = "position-above";

    let shiftClass = "";
    if (isAtStart) shiftClass = "shift-right";
    if (isAtEnd) shiftClass = "shift-left";

    useEffect(() => {
        if (player.bubbleEvent) {
            setActiveBubble(player.bubbleEvent);
            const timer = setTimeout(() => setActiveBubble(null), 1000);
            return () => clearTimeout(timer);
        }
    }, [player.bubbleEvent]);

    useEffect(() => {
        if (player.clearInputTrigger) {
            setMessageInput('');
            setIsInputFocused(false);
        }
    }, [player.clearInputTrigger]);

    const [localRemainingState, setLocalRemainingState] = useState(0);
    const localRemainingRef = useRef(0);

    const setLocalRemaining = (val) => {
        localRemainingRef.current = val;
        setLocalRemainingState(val);
    };

    const taskEndTimeRef = useRef(null);
    const currentTaskExpressionRef = useRef(null);
    const lastServerTimeRef = useRef(null);

    useEffect(() => {
        if (!activeTask) {
            taskEndTimeRef.current = null;
            currentTaskExpressionRef.current = null;
            lastServerTimeRef.current = null;
            return;
        }

        const serverRemaining = activeTask.questionRemainingTimeMillis;
        const isNewQuestion = currentTaskExpressionRef.current !== activeTask.expression;
        const isNewSyncTime = serverRemaining !== lastServerTimeRef.current;

        if (isNewQuestion || isNewSyncTime) {
            const remaining = serverRemaining !== undefined ? serverRemaining : (activeTask.timeLimitMillis || 10000);

            setLocalRemaining(remaining);
            lastServerTimeRef.current = serverRemaining;
            currentTaskExpressionRef.current = activeTask.expression;

            if (raceStatus === 'IN_PROGRESS') {
                taskEndTimeRef.current = Date.now() + remaining;
            } else {
                taskEndTimeRef.current = null;
            }
        }
        else if (raceStatus === 'PAUSED') {
            taskEndTimeRef.current = null;
        }
        else if (raceStatus === 'IN_PROGRESS' && !taskEndTimeRef.current) {
            taskEndTimeRef.current = Date.now() + localRemainingRef.current;
        }

    }, [activeTask?.expression, activeTask?.questionRemainingTimeMillis, raceStatus]);

    useEffect(() => {
        if (showInfoCard && activeTask && raceStatus === 'IN_PROGRESS') {
            if (!taskEndTimeRef.current) {
                taskEndTimeRef.current = Date.now() + localRemainingRef.current;
            }

            const interval = setInterval(() => {
                const now = Date.now();
                const remaining = Math.max(0, taskEndTimeRef.current - now);
                setLocalRemaining(remaining);

                if (remaining <= 0) clearInterval(interval);
            }, 30);

            return () => clearInterval(interval);
        }
    }, [showInfoCard, activeTask, raceStatus]);

    let expression = "";
    let options = [];
    let timeLimit = 1;
    let hint = null;

    if (activeTask) {
        expression = activeTask.expression;
        timeLimit = activeTask.timeLimitMillis || 1;
        if (player.currentQuestion) {
            options = activeTask.options || [];
            hint = player.currentQuestion.hint;
        } else if (player.currentJunction) {
            options = [activeTask.offer1, activeTask.offer2].filter(Boolean);
        }
    }

    const timerProgress = activeTask ? ((timeLimit - localRemainingState) / timeLimit) * 100 : 0;


    let dynamicZIndex = 5;
    if (showInfoCard) dynamicZIndex = 20000000;
    else if (isHighlighted) dynamicZIndex = 200;
    else if (activeBubble) dynamicZIndex = 50 + (activeBubble.id % 10000000);

    const isMessageValid = () => {
        const trimmedMessage = messageInput.trim();
        if (!trimmedMessage) return false;
        if (trimmedMessage.length > 500) return false;
        return true;
    };

    const handleSendMessage = (e) => {
        e.preventDefault();
        e.stopPropagation();

        const trimmedMessage = messageInput.trim();

        if (isMessageValid() && onSendMessageToPlayer) {
            onSendMessageToPlayer(player.id, trimmedMessage);
        }
    };

    return (
        <div
            className={`car-container ${!player.online ? 'car-offline' : ''} ${isHighlighted ? 'car-highlighted' : ''} ${showInfoCard ? 'car-super-top' : ''}`}
            style={{
                left: `calc(20px + (100% - 94px) * ${progressPercent / 100})`,
                top: `${laneCenterY}px`,
                zIndex: dynamicZIndex
            }}
            onPointerEnter={() => setIsHovered(true)}
            onPointerLeave={() => setIsHovered(false)}
            onPointerCancel={() => setIsHovered(false)}
        >
            {showInfoCard && (
                <div className={`player-info-card ${verticalClass} ${shiftClass}`}>
                    <div className="info-header" style={{ borderColor: carColor }}>
                        {player.nickname} - {player.currentScore} נק'
                    </div>

                    <div className="info-body-wrapper" style={{
                        border: `3px solid ${carColor}`,
                        '--progress': activeTask ? `${timerProgress}%` : '0%',
                        '--timer-color': carColor
                    }}>
                        <div className="info-content">
                            {activeTask && (
                                <>
                                    <div className="question-part">
                                        <div className="question-text" dir="rtl">{expression}</div>
                                    </div>

                                    {hint && (
                                        <div className="hint-part" dir="rtl">
                                            <FaLightbulb className="hint-icon" />
                                            <span className="hint-text">{hint}</span>
                                        </div>
                                    )}

                                    <div className="options-part">
                                        <div className="options-list">
                                            {options.map((opt, idx) => (
                                                <div key={idx} className="option-item">{opt}</div>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}

                            <form className="message-box-part" dir="rtl" onSubmit={handleSendMessage}>
                                <input
                                    type="text"
                                    className="message-input"
                                    placeholder="שלח הודעה לשחקן..."
                                    value={messageInput}
                                    onChange={(e) => setMessageInput(e.target.value)}
                                    onFocus={() => setIsInputFocused(true)}
                                    onBlur={() => setTimeout(() => setIsInputFocused(false), 150)}
                                    required
                                    maxLength={500}
                                    pattern=".*\S+.*"
                                    title="אנא הקלד הודעה חוקית (לא רק רווחים)"
                                />
                                <button
                                    type="submit"
                                    className="message-send-btn"
                                    style={{
                                        backgroundColor: isMessageValid() ? carColor : '#ccc',
                                        cursor: isMessageValid() ? 'pointer' : 'not-allowed'
                                    }}
                                    disabled={!isMessageValid()}
                                >
                                    שלח
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {activeBubble && !showInfoCard && (
                <div key={activeBubble.id} className={`car-bubble bubble-${activeBubble.type}`}>
                    {getBubbleIcon(activeBubble.type)}
                </div>
            )}

            <div className="car-body" style={{ backgroundColor: carColor }}>
                <div className="car-window"></div>
                <div className="car-wheel back"></div>
                <div className="car-wheel front"></div>
                <span>{player.currentScore ?? 0}</span>
            </div>
        </div>
    );
}

export default memo(CarPlayer);