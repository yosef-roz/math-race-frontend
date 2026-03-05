import Card from "../ui/Card.jsx";
import {Link} from "react-router-dom";

import './HistoryItem.css'

function HistoryItem({data}) {

    const {id, name, date, rank, playerCount} = data;

    return (
        <Card className="history-item">
            <h3>{name}</h3>
            <span>{date}</span>
            <span>Rank: {rank} out of {playerCount}</span>
            <Link to={`/games/${id}`}>View Details</Link>
        </Card>
    )
}

export default HistoryItem;