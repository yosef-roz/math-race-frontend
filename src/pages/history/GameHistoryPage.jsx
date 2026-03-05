import HistoryList from "../../components/history/HistoryList.jsx";

import './GameHistory.css'

function GameHistoryPage() {

    const fakeGames = [
        {id: 1, name: "Math Speed Race", date: "2026-03-05", rank: 1, playerCount: 30},
        {id: 2, name: "Logic Champions", date: "2026-03-02", rank: 17, playerCount: 30},
        {id: 3, name: "Final Boss Battle", date: "2026-02-28", rank: 28, playerCount: 30}
    ];

    return (
        <>
            <div>
                <h2>Your Race History</h2>
            </div>

            <HistoryList games={fakeGames}/>
        </>
    )
}

export default GameHistoryPage;