import {useNavigate} from "react-router-dom";
import {useState} from "react";
import Card from "../../components/ui/Card.jsx";
import Input from "../../components/ui/Input.jsx";
import Button from "../../components/ui/Button.jsx";
import {createRace} from "../../services/authService.js";
import './CreatRacePage.css';

const initialFormState = {
    name: "",
    targetScore: ""
};

function CreatRacePage() {
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

    const handleExit = () => {
        navigate("/");
    }

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (isSubmitting) return;
        setIsSubmitting(true);

        try {
            const response = await createRace(formData);
            if (response.success) {
                navigate("/race/" + response.data.code);
                console.log("החדר נוצר בהצלחה, " + response.data.name + " : " + response.data.code);
            } else {
                if (response.errorCode === 1007) {
                    alert("ACCOUNT_NOT_FOUND");
                    navigate("/login");
                    return;
                }else if (response.errorCode === 1403) {
                    alert("USER_ALREADY_IN_RACE");
                    navigate("/race/join");
                    return;
                }else if (response.errorCode === 1400 || response.errorCode === 14001) {
                    alert(response.message);
                    setFormData(initialFormState)
                }else{
                    alert(response.message);
                }
            }
        } catch (err) {
            alert(err.data.message);
            setFormData(initialFormState)
            console.log("Create failed:", err);
        }finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <Card className={"form-race"}>
                <h2>Create Race</h2>
                <p>Fill in the details to create a race!</p>

                <form onSubmit={handleSubmit}>
                    <Input
                        name={"name"}
                        type={"text"}
                        placeholder={"name for race"}
                        value={formData.name}
                        onChange={handleChange}
                    />
                    <Input
                        name={"targetScore"}
                        type={"number"}
                        min="0"
                        step="1"
                        onKeyDown={(e) => ["e", "E", "-", "+"].includes(e.key) && e.preventDefault()}
                        placeholder={"target score"}
                        value={formData.targetScore}
                        onChange={handleChange}
                        required
                    />

                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? "שולח נתונים..." : "צור מירוץ"}
                    </Button>

                    <Button onClick={handleExit}>
                        חזור לדף הבית
                    </Button>
                </form>
            </Card>
        </>
    )
}

export default CreatRacePage;