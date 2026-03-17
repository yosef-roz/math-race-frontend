import {useState} from "react";
import {useNavigate} from "react-router-dom";
import Button from "../../components/ui/Button.jsx";
import Input from "../../components/ui/Input.jsx";
import Card from "../../components/ui/Card.jsx";

import './JoinRacePage.css';
import {joinRace} from "../../services/authService.js";

const initialFormState = {
    nickname: "",
    roomCode: ""
};

function JoinRacePage() {
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState(initialFormState);


    const handleChange = (e) => {
        const {name, value} = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));
    };


    const handleSubmit = async (e) => {
        e.preventDefault();

        if (isSubmitting) return;
        setIsSubmitting(true);

        try {
            const response = await joinRace(formData);
            if (response.success) {
                navigate("/race/" + response.data.code);
                console.log("הצטרפת לחדר בהצלחה, " + response.data.nickName + " : " + response.data.type);
            } else {
                if (response.errorCode === 1007) {
                    alert("ACCOUNT_NOT_FOUND");
                    navigate("/login");
                }else if (response.errorCode === 1400 || response.errorCode === 1401 ||
                    response.errorCode === 1403|| response.errorCode === 1404) {
                    alert(response.message);
                    setFormData(initialFormState)
                }else{
                    alert(response.message);
                }
            }
        } catch (err) {
            alert(err.data.message);
            setFormData(initialFormState)
            console.log("Join failed:", err);
        }finally {
            setIsSubmitting(false);
        }
    };

    const handleExit = () => {
        navigate("/");
    }

    return (
        <>
            <Card className={"form-race"}>
                <h2>Join the Race</h2>
                <p>Got a room code? Enter it below and start playing!</p>

                <form onSubmit={handleSubmit}>
                    <Input
                        name={"roomCode"}
                        type={"text"}
                        placeholder={"Room Code"}
                        value={formData.roomCode}
                        onChange={handleChange}
                        required
                    />

                    <Input
                        name={"nickname"}
                        type={"text"}
                        placeholder={"Nickname"}
                        value={formData.nickname}
                        onChange={handleChange}
                    />

                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? "שולח נתונים..." : "כנס לחדר"}
                    </Button>

                    <Button onClick={handleExit}>
                        חזור לדף הבית
                    </Button>
                </form>
            </Card>
        </>
    );
}

export default JoinRacePage;