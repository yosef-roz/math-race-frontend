import Card from "../../components/ui/Card.jsx";
import Button from "../../components/ui/Button.jsx";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Input from "../../components/ui/Input.jsx";

import { register } from "../../services/authService.js";

import ErrorToast from "../../components/ui/ErrorToast.jsx";
import { getErrorMessage } from "../../utils/errorMapper.js";

import './Auth.css'
import logo from "../../../public/logo.png";

function RegisterPage() {
    const navigate = useNavigate();

    const [errorMessage, setErrorMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const [formData, setFormData] = useState({
        username: "",
        email: "",
        password: ""
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    const validateForm = () => {
        const { username, email, password } = formData;

        if (!username || username.trim() === "") {
            setErrorMessage("Username is required");
            return false;
        }
        if (username.length < 3 || username.length > 15) {
            setErrorMessage("Username must be between 3 and 15 characters");
            return false;
        }
        const usernameRegex = /^(?=.*[a-zA-Z])\S+$/;
        if (!usernameRegex.test(username)) {
            setErrorMessage("Username must contain at least one letter and no spaces");
            return false;
        }

        if (!email || email.trim() === "") {
            setErrorMessage("Email is required");
            return false;
        }
        if (email.length > 255) {
            setErrorMessage("Email cannot exceed 255 characters");
            return false;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setErrorMessage("Invalid email format");
            return false;
        }

        if (!password || password.trim() === "") {
            setErrorMessage("Password is required");
            return false;
        }
        if (password.length < 6 || password.length > 15) {
            setErrorMessage("Password must be between 6 and 15 characters long");
            return false;
        }
        const passwordRegex = /^(?=.*[0-9])(?=.*[a-zA-Z])\S+$/;
        if (!passwordRegex.test(password)) {
            setErrorMessage("Password must contain at least one digit, at least one letter, and no spaces");
            return false;
        }

        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (isLoading) return;

        if (!validateForm()) {
            return;
        }

        setIsLoading(true);
        setErrorMessage("");

        try {
            const response = await register(formData);

            if (response.success === true) {
                console.log("Registered successfully!");
                setFormData({ username: "", email: "", password: "" });
                navigate("/");
            } else {
                const code = response.errorCode;

                setErrorMessage(getErrorMessage(code));

                if (code === 1002 || code === 1004) {
                    setFormData(prev => ({ ...prev, email: "", password: "" }));
                } else if (code === 1003) {
                    setFormData(prev => ({ ...prev, username: "" }));
                }
            }
        } catch (err) {
            console.log("Registration failed:", err);

            if (err.response && err.response.status === 404) {
                setErrorMessage(getErrorMessage(9001));
            } else {
                setErrorMessage(getErrorMessage(9000));
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="page-wrapper">

            <ErrorToast
                message={errorMessage}
                onClose={() => setErrorMessage("")}
            />

            <Card className="theme-green" >
                <div>
                    <img
                        src={logo}
                        alt="Math Race Logo"
                        className="dashboard-logo"
                    />

                    <h2>Welcome!</h2>
                    <p>
                        Ready to start? Create your profile to play<br/>
                        If you already have an account, you can log in
                        <Link to={`/auth/login`}> here</Link>
                    </p>
                </div>

                <form onSubmit={handleSubmit}>
                    <Input
                        name={"username"}
                        placeholder={"Username"}
                        value={formData.username}
                        onChange={handleChange}
                        required
                        minLength={3}
                        maxLength={15}
                        pattern={"^(?=.*[a-zA-Z])\\S+$"}
                        title={"Username must contain at least one letter and no spaces"}
                        disabled={isLoading}
                    />
                    <Input
                        name={"email"}
                        type={"email"}
                        placeholder={"Email"}
                        value={formData.email}
                        onChange={handleChange}
                        required
                        maxLength={255}
                        disabled={isLoading}
                    />
                    <Input
                        name={"password"}
                        type={"password"}
                        placeholder={"Password"}
                        value={formData.password}
                        onChange={handleChange}
                        required
                        minLength={6}
                        maxLength={15}
                        pattern={"^(?=.*[0-9])(?=.*[a-zA-Z])\\S+$"}
                        title={"Password must contain at least one digit, at least one letter, and no spaces"}
                        disabled={isLoading}
                    />
                    <Button type="submit" disabled={isLoading}>
                        {isLoading ? "Creating Account..." : "Create Account"}
                    </Button>
                </form>
            </Card>
        </div>
    )
}

export default RegisterPage;