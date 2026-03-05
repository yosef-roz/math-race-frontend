import HistoryItem from "./HistoryItem.jsx";

import './HistoryList.css'

function HistoryList({games}) {
    return (
        <div className={"history-list"}>
            {games.map((game) => (
                <HistoryItem key={game.id} data={game}/>
            ))}
        </div>
    )
}

export default HistoryList;