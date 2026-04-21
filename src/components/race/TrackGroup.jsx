import React, { memo, useEffect, useState, useRef } from 'react';
import CarPlayer from './CarPlayer';
import './TrackGroup.css';

const trackNamesHebrew = {
    AUTOSTRADA: 'אוטוסטרדה',
    REGULAR: 'כביש רגיל',
    DIRT_ROAD: 'דרך עפר',
    WAITING_FOR_CHOICE: 'כביש רגיל'
};

function TrackGroup({ trackType, players, targetScore, highlightedPlayerId, onSendMessageToPlayer, raceStatus }) {
    const isEmpty = !players || players.length === 0;
    const previousAssignments = useRef({});
    const [renderData, setRenderData] = useState({ positionedPlayers: [], numRoads: 1 });

    useEffect(() => {
        if (isEmpty) {
            setRenderData({ positionedPlayers: [], numRoads: 1 });
            return;
        }

        const OVERLAP_THRESHOLD_PERCENT = 4.5;
        const overlapScoreBuffer = (targetScore * OVERLAP_THRESHOLD_PERCENT) / 100;
        const sortedPlayers = [...players].sort((a, b) => b.currentScore - a.currentScore);
        const laneOccupancy = {};
        let maxRoadUsed = 0;
        const newAssignments = { ...previousAssignments.current };

        const newPositionedPlayers = sortedPlayers.map(player => {
            let assignedRoad = 0;
            let assignedLane = 0;
            let foundLane = false;
            const prev = newAssignments[player.id];

            // לוגיקת שיבוץ נתיבים כדי למנוע חפיפה של רכבים
            for (let r = 0; r < 5; r++) {
                const key0 = `${r}-0`, key1 = `${r}-1`;
                const isLane0Free = laneOccupancy[key0] === undefined || (laneOccupancy[key0] - player.currentScore) >= overlapScoreBuffer;
                const isLane1Free = laneOccupancy[key1] === undefined || (laneOccupancy[key1] - player.currentScore) >= overlapScoreBuffer;

                if (isLane0Free || isLane1Free) {
                    assignedRoad = r;
                    foundLane = true;

                    if (prev && prev.laneIndex === 0 && isLane0Free) assignedLane = 0;
                    else if (prev && prev.laneIndex === 1 && isLane1Free) assignedLane = 1;
                    else assignedLane = isLane0Free ? 0 : 1;

                    laneOccupancy[`${assignedRoad}-${assignedLane}`] = player.currentScore;
                    maxRoadUsed = Math.max(maxRoadUsed, assignedRoad);
                    break;
                }
            }

            if (!foundLane) { assignedRoad = 4; assignedLane = 1; }
            newAssignments[player.id] = { roadIndex: assignedRoad, laneIndex: assignedLane };
            return { ...player, roadIndex: assignedRoad, laneIndex: assignedLane };
        });

        previousAssignments.current = newAssignments;
        setRenderData({ positionedPlayers: newPositionedPlayers, numRoads: Math.max(1, maxRoadUsed + 1) });
    }, [players, targetScore, isEmpty]);

    return (
        <div className={`track-group track-${trackType}`}>
            <div className="track-side-label">{trackNamesHebrew[trackType] || trackType}</div>
            <div className="roads-container">
                {/* רינדור הכבישים לפי הכמות הנדרשת */}
                {Array.from({ length: renderData.numRoads }).map((_, idx) => (
                    <div key={`${trackType}-road-${idx}`} className="road"></div>
                ))}

                <div className="finish-line"></div>

                {/* רינדור הרכבים באמצעות הקומפוננטה החדשה */}
                {renderData.positionedPlayers.map(player => (
                    <CarPlayer
                        key={player.id}
                        player={player}
                        targetScore={targetScore}
                        roadIndex={player.roadIndex}
                        laneIndex={player.laneIndex}
                        isHighlighted={player.id === highlightedPlayerId}
                        onSendMessageToPlayer={onSendMessageToPlayer}
                        raceStatus={raceStatus}
                    />
                ))}
            </div>
        </div>
    );
}

export default memo(TrackGroup);