import Card from "../../components/ui/Card.jsx";
import Button from "../../components/ui/Button.jsx";

import './Dashboard.css'

function DashboardPage() {
    return (
        <>
            <div>
                <h1>Mate Race</h1>
            </div>

            <div className={"dashboard-items"}>
                <Card>
                    <h2>Create a Race</h2>
                    <p>
                        Create a new room and select your preferred difficulty level. Share the unique code with others so they can join, and watch the race unfold in real time
                    </p>
                    <Button>Create Race</Button>
                </Card>

                <Card>
                    <h2>Join the Race</h2>
                    <p>Got a room code? Then what are you waiting for! Click the button below, follow the instructions, and start playing!</p>
                    <Button>Join Race</Button>
                </Card>
            </div>
        </>
    )
}

export default DashboardPage;