import Card from "../../components/ui/Card.jsx";
import {Link} from "react-router-dom";
import Input from "../../components/ui/Input.jsx";
import Button from "../../components/ui/Button.jsx";
import {useState} from "react";

import "./Auth.css";

function ForgotPasswordPage() {
    const [email, setEmail] = useState("");

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log("Password reset requested for email:", email);
    };

    return (
        <>
            <Card className="auth-card">
                <h2>Forgot your password?</h2>
                <p>
                    Don't worry, it happens! Enter your email address below and we'll send you a reset link<br/>
                    If you remember your password, you can return to the login page
                    <Link to={`/login`}> here</Link>
                </p>

                <form onSubmit={handleSubmit}>
                    <Input
                        name={"email"}
                        type={"email"}
                        placeholder={"Email"}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    <Button type="submit">Send Reset Link</Button>
                </form>
            </Card>
        </>
    )
}

export default ForgotPasswordPage;