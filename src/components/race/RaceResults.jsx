import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './RaceResults.css';

// --- תת קומפוננטה: תצוגת שם משתמש ---
const UserNameDisplay = React.memo(({ userName }) => {
    if (userName && userName.trim() !== "") {
        return <span className="username-display username-blue">@{userName}</span>;
    }
    return <span className="username-display username-guest">-Guest-</span>;
});

// --- תת קומפוננטה: עיגול סטטיסטיקה ---
const StatItem = React.memo(({ title, value, winnerId, winnerNickname, winnerUserName, color, isRaceStat, isHighlighted, isDimmed, onHighlight, pieData }) => {
    return (
        <div
            className={`stat-wrapper ${isHighlighted ? 'highlighted' : ''} ${isDimmed ? 'dimmed' : ''}`}
            onClick={() => onHighlight(winnerId)}
            style={{ '--circle-color': color }}
        >
            {!isRaceStat && (
                <div className="stat-label-box placement-top title-box">{title}</div>
            )}

            <div
                className={`stat-circle ${pieData ? 'pie-chart' : ''}`}
                style={pieData ? {
                    '--pie-percent': `${pieData.percent}%`,
                    '--pie-color-1': pieData.color1,
                    '--pie-color-2': pieData.color2
                } : {}}
            >
                {pieData ? (
                    <div className="pie-inner-values">
                        <span style={{ color: pieData.color1 }}>{pieData.percent.toFixed(1)}%</span>
                        <div className="pie-divider"></div>
                        <span style={{ color: pieData.color2 }}>{(100 - pieData.percent).toFixed(1)}%</span>
                    </div>
                ) : (
                    <span style={{ zIndex: 2, position: 'relative' }}>{value}</span>
                )}
            </div>

            {isRaceStat ? (
                <div className="stat-label-box placement-bottom title-box">
                    {title}
                    {pieData && (
                        <div className="pie-legend">
                            <div className="legend-item">
                                <span className="legend-dot" style={{ backgroundColor: pieData.color1 }}></span>
                                {pieData.label1}
                            </div>
                            <div className="legend-item">
                                <span className="legend-dot" style={{ backgroundColor: pieData.color2 }}></span>
                                {pieData.label2}
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="stat-label-box placement-bottom winner-box">
                    <span className="winner-nickname">{winnerNickname || 'אין זוכה'}</span>
                    <UserNameDisplay userName={winnerUserName} />
                </div>
            )}
        </div>
    );
});

// --- תת קומפוננטה: שורה בטבלת המובילים ---
const LeaderboardRow = React.memo(({ player, rank, achievements, isHighlighted, isDimmed, isCurrentPlayer, onHighlight }) => {
    return (
        <div
            className={`leaderboard-row ${isHighlighted ? 'highlighted' : ''} ${isDimmed ? 'dimmed' : ''} ${isCurrentPlayer ? 'current-player' : ''}`}
            onClick={() => onHighlight(player.id)}
        >
            <div className="row-left-side">
                <div className={`rank-badge rank-${rank}`}>
                    {rank}
                </div>
                <div className="player-details">
                    <div className="name-and-badge">
                        <span className="winner-nickname">{player.nickname}</span>
                        {isCurrentPlayer && <span className="you-badge">(את/ה)</span>}
                    </div>
                    <UserNameDisplay userName={player.userName} />

                    {achievements.length > 0 && (
                        <div className="achievements-badges">
                            {achievements.map((ach, idx) => (
                                <span key={idx} className="achievement-badge" style={{ backgroundColor: ach.color }}>
                                    {ach.title}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            <div className="player-score">
                {player.currentScore}
            </div>
        </div>
    );
});

// --- קומפוננטה ראשית ---
function RaceResults({ raceState, currentPlayerId }) {
    const navigate = useNavigate();
    const [highlightedPlayerId, setHighlightedPlayerId] = useState(null);
    const timeoutRef = useRef(null);

    useEffect(() => {
        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, []);

    const players = raceState?.players || [];
    const stats = raceState?.statistics || {};

    const sortedPlayers = useMemo(() => {
        return [...players].sort((a, b) => b.currentScore - a.currentScore);
    }, [players]);

    const playerStats = useMemo(() => {
        const getPlayer = (id) => players.find(p => p.id === id) || {};
        return [
            {
                id: 'streak', title: 'מאסטר הרצף', value: stats.streakMasterAmount || 0,
                winnerId: stats.streakMasterId, winnerNickname: getPlayer(stats.streakMasterId).nickname,
                winnerUserName: getPlayer(stats.streakMasterId).userName, color: 'var(--yellow)'
            },
            {
                id: 'accuracyKing', title: 'מלך הדיוק', value: `${stats.accuracyKingPercentage?.toFixed(1) || 0}%`,
                winnerId: stats.accuracyKingId, winnerNickname: getPlayer(stats.accuracyKingId).nickname,
                winnerUserName: getPlayer(stats.accuracyKingId).userName, color: 'var(--green)'
            },
            {
                id: 'speedDemon', title: 'שד המהירות', value: `${((stats.speedDemonTimeMs || 0) / 1000).toFixed(2)}s`,
                winnerId: stats.speedDemonId, winnerNickname: getPlayer(stats.speedDemonId).nickname,
                winnerUserName: getPlayer(stats.speedDemonId).userName, color: 'var(--red)'
            }
        ];
    }, [stats, players]);

    const raceStats = useMemo(() => {
        const autostradaPct = stats.autostradaPercentage || 0;
        return [
            { id: 'totalAcc', title: 'דיוק כללי', value: `${stats.accuracyPercentage?.toFixed(1) || 0}%`, color: 'var(--blue)' },
            { id: 'avgTime', title: 'זמן תגובה ממוצע', value: `${((stats.averageResponseTimeMs || 0) / 1000).toFixed(2)}s`, color: 'var(--accent)' },
            {
                id: 'pathsDistribution',
                title: 'התפלגות נתיבים',
                value: null,
                color: '#ec4899',
                pieData: {
                    percent: autostradaPct,
                    color1: '#ec4899',
                    color2: 'var(--yellow)',
                    label1: 'אוטוסטרדה',
                    label2: 'דרך עפר'
                }
            },
        ];
    }, [stats]);

    const handleHighlight = (playerId) => {
        if (!playerId) return;
        if (timeoutRef.current) clearTimeout(timeoutRef.current);

        setHighlightedPlayerId(playerId);
        timeoutRef.current = setTimeout(() => setHighlightedPlayerId(null), 1500);
    };

    return (
        <div className="race-results-container">
            {raceState?.name && (
                <div className="room-name-tag">
                    {raceState.name}
                </div>
            )}

            <div className="main-layout">
                {/* צד ימין - סטטיסטיקות שחקנים */}
                <div className="side-group">
                    {playerStats.map(stat => (
                        <StatItem
                            key={stat.id}
                            {...stat}
                            isRaceStat={false}
                            isHighlighted={highlightedPlayerId === stat.winnerId && stat.winnerId !== undefined}
                            isDimmed={highlightedPlayerId !== null && highlightedPlayerId !== stat.winnerId}
                            onHighlight={handleHighlight}
                        />
                    ))}
                </div>

                {/* אמצע - עמודת הפאנל והכפתור */}
                <div className="center-column">
                    <div className="leaderboard-panel">
                        <h2 className="leaderboard-title">טבלת האלופים</h2>
                        <div className="leaderboard-list">
                            {sortedPlayers.map((player, index) => {
                                const achievements = playerStats
                                    .filter(stat => stat.winnerId === player.id)
                                    .map(stat => ({ title: stat.title, color: stat.color }));

                                return (
                                    <LeaderboardRow
                                        key={player.id}
                                        player={player}
                                        rank={index + 1}
                                        achievements={achievements}
                                        isHighlighted={highlightedPlayerId === player.id}
                                        isDimmed={highlightedPlayerId !== null && highlightedPlayerId !== player.id}
                                        isCurrentPlayer={player.id === currentPlayerId}
                                        onHighlight={handleHighlight}
                                    />
                                );
                            })}
                        </div>
                    </div>

                    {/* הכפתור בחוץ לגמרי */}
                    <button className="back-to-home-btn" onClick={() => navigate('/')}>
                        Back to Home
                    </button>
                </div>

                {/* צד שמאל - סטטיסטיקות המירוץ */}
                <div className="side-group">
                    {raceStats.map(stat => (
                        <StatItem
                            key={stat.id}
                            {...stat}
                            isRaceStat={true}
                            isHighlighted={false}
                            isDimmed={highlightedPlayerId !== null}
                            onHighlight={() => {}}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}

export default RaceResults;