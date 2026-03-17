import {useNavigate} from "react-router-dom";
import {useState} from "react";


function RacePlayerPage() {
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);

    return (
        <>
            <div>
                עמוד שחקן ברוך הבא!
            </div>
        </>
    )
}

export default RacePlayerPage;