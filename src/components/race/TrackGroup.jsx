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
        const tempAssignments = {};

        sortedPlayers.forEach(player => {
            const prev = previousAssignments.current[player.id];
            let assignedRoad = -1;
            let assignedLane = -1;

            if (prev && prev.roadIndex !== undefined && prev.laneIndex !== undefined) {
                const key = `${prev.roadIndex}-${prev.laneIndex}`;
                const occupantScore = laneOccupancy[key];

                if (occupantScore === undefined || (occupantScore - player.currentScore) >= overlapScoreBuffer) {
                    assignedRoad = prev.roadIndex;
                    assignedLane = prev.laneIndex;
                }
            }

            if (assignedRoad === -1) {
                for (let r = 0; r < 5; r++) {
                    const key0 = `${r}-0`;
                    const key1 = `${r}-1`;
                    const isLane0Free = laneOccupancy[key0] === undefined || (laneOccupancy[key0] - player.currentScore) >= overlapScoreBuffer;
                    const isLane1Free = laneOccupancy[key1] === undefined || (laneOccupancy[key1] - player.currentScore) >= overlapScoreBuffer;

                    if (isLane0Free || isLane1Free) {
                        assignedRoad = r;

                        if (prev && prev.laneIndex === 0 && isLane0Free) assignedLane = 0;
                        else if (prev && prev.laneIndex === 1 && isLane1Free) assignedLane = 1;
                        else assignedLane = isLane0Free ? 0 : 1;
                        break;
                    }
                }
            }

            if (assignedRoad === -1) { assignedRoad = 4; assignedLane = 1; }

            laneOccupancy[`${assignedRoad}-${assignedLane}`] = player.currentScore;
            tempAssignments[player.id] = { roadIndex: assignedRoad, laneIndex: assignedLane };
        });

        const usedRoads = new Set();
        Object.values(tempAssignments).forEach(assignment => usedRoads.add(assignment.roadIndex));

        const sortedUsedRoads = Array.from(usedRoads).sort((a, b) => a - b);
        const roadMapping = {};
        sortedUsedRoads.forEach((oldRoadIndex, newRoadIndex) => {
            roadMapping[oldRoadIndex] = newRoadIndex;
        });

        let finalMaxRoadUsed = 0;
        const newAssignments = {};


        const newPositionedPlayers = sortedPlayers.map(player => {
            const temp = tempAssignments[player.id];
            const compactedRoad = roadMapping[temp.roadIndex];

            finalMaxRoadUsed = Math.max(finalMaxRoadUsed, compactedRoad);
            newAssignments[player.id] = { roadIndex: compactedRoad, laneIndex: temp.laneIndex };

            return { ...player, roadIndex: compactedRoad, laneIndex: temp.laneIndex };
        });

        previousAssignments.current = newAssignments;
        setRenderData({ positionedPlayers: newPositionedPlayers, numRoads: Math.max(1, finalMaxRoadUsed + 1) });

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