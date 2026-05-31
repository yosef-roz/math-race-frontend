import {useEffect, useState} from "react";
import Input from "../ui/Input";
import Button from "../ui/Button";
import {AlertModal, ALERT_TYPES} from "../ui/AlertModal";
import logo from "../../../public/logo.png";

function PasswordForm({header, onSubmit, buttonText = "Save Password"}) {
    const [formData, setFormData] = useState({password: "", confirmPassword: ""});

    const [errorMessage, setErrorMessage] = useState(null);

    useEffect(() => {
        if (!errorMessage) return;

        const timer = setTimeout(() => {
            setErrorMessage(null);
        }, 3000);

        return () => clearTimeout(timer);
    }, [errorMessage]);

    const handleChange = (e) => {
        const {name, value} = e.target;
        setFormData(prev => ({...prev, [name]: value}));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        const {password, confirmPassword} = formData;

        if (password.length < 8 || password.length > 14) {
            setErrorMessage("Password must be between 8 and 14 characters long.");
            return;
        }

        const hasLetter = /[a-zA-Z]/.test(password);
        const hasNumber = /[0-9]/.test(password);

        if (!hasLetter || !hasNumber) {
            setErrorMessage("Password must contain both letters and numbers.");
            return;
        }

        if (password !== confirmPassword) {
            setErrorMessage("The passwords you entered do not match!");
            return;
        }

        onSubmit(formData.password);
    };

    return (
        <div >
            <div >

                <img
                    src={logo}
                    alt="Math Race Logo"
                    className="dashboard-logo"
                />

                {header}
            </div>

            <form onSubmit={handleSubmit}>
                <Input name={"password"} type={"password"} placeholder={"New Password"} value={formData.password}
                       onChange={handleChange} required/>
                <Input name={"confirmPassword"} type={"password"} placeholder={"Confirm Password"}
                       value={formData.confirmPassword} onChange={handleChange} required/>
                <Button type={"submit"}>{buttonText}</Button>
            </form>

            {errorMessage && (
                <AlertModal
                    type={ALERT_TYPES.ERROR}
                    title="Input Error"
                    onClose={() => setErrorMessage(null)}
                >
                    <p>{errorMessage}</p>
                </AlertModal>
            )}
        </div>
    );
}

export default PasswordForm;