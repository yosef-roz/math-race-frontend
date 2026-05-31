import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button.jsx';
import Input from '../../components/ui/Input.jsx';
import { ClipLoader } from "react-spinners";
import { getErrorMessage } from "../../utils/errorMapper.js";

import { myProfile, requestAccountDeletion, updateUsername } from "../../services/userProfileService.js";

import './ProfilePage.css';
import ErrorToast from "../../components/ui/ErrorToast.jsx";
import ConfirmModal from "../../components/ui/ConfirmModal.jsx";

function ProfilePage() {
    const navigate = useNavigate();

    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const [newUsername, setNewUsername] = useState("");
    const [isUpdatingName, setIsUpdatingName] = useState(false);

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isRequestingDelete, setIsRequestingDelete] = useState(false);

    const [errorMessage, setErrorMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const response = await myProfile();

                if (response && response.success && response.data) {
                    setUser(response.data);
                    setNewUsername(response.data.username);
                } else if (response && response.username) {
                    setUser(response);
                    setNewUsername(response.username);
                } else {
                    navigate('/auth/login');
                }
            } catch (error) {
                console.error("Failed to fetch user profile:", error);
                navigate('/auth/login');
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, [navigate]);

    const validateUsername = (name) => {
        if (!name || name.trim() === "") {
            return "Username is required";
        }
        if (name.length < 3 || name.length > 15) {
            return "Username must be between 3 and 15 characters";
        }
        const usernameRegex = /^(?=.*[a-zA-Z])\S+$/;
        if (!usernameRegex.test(name)) {
            return "Username must contain at least one letter and no spaces";
        }
        return null;
    };

    const handleSaveUsername = async (e) => {
        if (e) e.preventDefault();

        setErrorMessage("");
        setSuccessMessage("");

        const validationError = validateUsername(newUsername);
        if (validationError) {
            setErrorMessage(validationError);
            return;
        }

        if (newUsername === user.username) return;

        setIsUpdatingName(true);

        try {
            const response = await updateUsername({ username: newUsername });

            if (response.success === true) {
                setUser({ ...user, username: newUsername });
                setSuccessMessage("Username updated successfully!");

                setTimeout(() => setSuccessMessage(""), 5000);
            } else {
                setErrorMessage(getErrorMessage(response.errorCode));
            }
        } catch (error) {
            console.error("Error updating username:", error);

            if (error.response && error.response.data && error.response.data.errorCode) {
                setErrorMessage(getErrorMessage(error.response.data.errorCode));
            } else {
                setErrorMessage(getErrorMessage(9000));
            }
        } finally {
            setIsUpdatingName(false);
        }
    };

    const handleConfirmDeleteRequest = async () => {
        setIsDeleteModalOpen(false);
        setIsRequestingDelete(true);
        setErrorMessage("");
        setSuccessMessage("");

        try {
            const response = await requestAccountDeletion();

            if (response.success === true) {
                setSuccessMessage("A verification email has been sent. Please check your inbox.");
            } else {
                setErrorMessage(getErrorMessage(response.errorCode));
            }
        } catch (error) {
            console.error("Error requesting deletion:", error);
            setErrorMessage(getErrorMessage(9000));
        } finally {
            setIsRequestingDelete(false);
        }
    };

    if (loading) {
        return <div className="loading-container"><ClipLoader color="#36d7b7" /></div>;
    }

    if (!user) return null;

    const hasNameChanged = newUsername !== user.username;

    return (
        <>
            <ErrorToast
                message={errorMessage}
                onClose={() => setErrorMessage("")}
            />

            <div className="profile-card-design">
                <div className="profile-avatar-large">
                    {user.username ? user.username.substring(0, 1).toUpperCase() : '👤'}
                </div>

                <form className="profile-edit-section" onSubmit={handleSaveUsername}>
                    <Input
                        name="username"
                        type="text"
                        value={newUsername}
                        onChange={(e) => setNewUsername(e.target.value)}
                        disabled={isUpdatingName || isRequestingDelete}
                        placeholder="Enter new username"
                        style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '18px' }}
                        required
                        minLength={3}
                        maxLength={15}
                        pattern={"^(?=.*[a-zA-Z])\\S+$"}
                        title={"Username must contain at least one letter and no spaces"}
                    />

                    {hasNameChanged && (
                        <Button
                            type="submit"
                            className="btn-save-username"
                            disabled={isUpdatingName}
                        >
                            {isUpdatingName ? "Saving..." : "Save Changes"}
                        </Button>
                    )}
                </form>

                <p className="profile-display-email">{user.email}</p>

                {successMessage && (
                    <div className="profile-feedback-message success">
                        {successMessage}
                    </div>
                )}

                <div className="management-actions">
                    <Button
                        className="btn-change-password"
                        onClick={() => navigate('/manage-profile/change-password')}
                        disabled={isUpdatingName || isRequestingDelete}
                    >
                        Change Password
                    </Button>

                    <Button
                        className="btn-delete-account"
                        onClick={() => setIsDeleteModalOpen(true)}
                        disabled={isUpdatingName || isRequestingDelete}
                    >
                        {isRequestingDelete ? "Processing..." : "Delete Account"}
                    </Button>
                </div>

                <ConfirmModal
                    isOpen={isDeleteModalOpen}
                    title="Warning: Account Deletion"
                    message="Are you sure you want to request account deletion? An email will be sent to you to confirm this action."
                    confirmText="Yes, Send Email"
                    cancelText="Cancel"
                    onConfirm={handleConfirmDeleteRequest}
                    onCancel={() => setIsDeleteModalOpen(false)}
                />
            </div>
        </>
    );
}

export default ProfilePage;