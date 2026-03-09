import {useState} from "react";
import {useNavigate} from "react-router-dom";
import Button from "../../components/ui/Button.jsx";
import Input from "../../components/ui/Input.jsx";
import Card from "../../components/ui/Card.jsx";

import './JoinRacePage.css';

function JoinRacePage() {
    const navigate = useNavigate();
    const [roomCode, setRoomCode] = useState("");


    const handleEnter = (e) => {
        e.preventDefault();
    }

    const handleExit = () => {
        navigate("/");
    }

    return (
        <>
            <Card className={"form-race"}>
                <h2>Join the Race</h2>
                <p>Got a room code? Enter it below and start playing!</p>

                <Input
                    type={"text"}
                    placeholder={"Example: ABC-123"}
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                    required
                />

                <Button
                    onClick={handleEnter}
                >
                    Enter Room
                </Button>
                <Button
                    onClick={handleExit}
                >
                    Back to Dashboard
                </Button>
            </Card>
        </>
    );
}

export default JoinRacePage;