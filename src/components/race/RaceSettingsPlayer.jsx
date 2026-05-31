import React, {useState, useRef, useEffect, memo} from 'react';
import { FaGear, FaRightFromBracket, FaCheck } from "react-icons/fa6";
import './RaceSettingsPlayer.css';

const RaceSettingsPlayer = ({ currentNickname, onChangeNickname, onLeaveRace }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [nicknameInput, setNicknameInput] = useState("");
    const [localError, setLocalError] = useState("");
    const wrapperRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(event) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
                setLocalError("");
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleOpenToggle = () => {
        if (!isOpen) {
            setNicknameInput(currentNickname || "");
            setLocalError("");
        }
        setIsOpen(!isOpen);
    };

    const validateName = (name) => {
        if (!name || name.trim() === "") return "Nickname is required";
        if (name.length > 15) return "Nickname cannot exceed 15 characters";
        if (!/^(?:.*\S){3}.*$/.test(name)) return "Nickname must contain at least 3 actual characters";
        if (!/^\S.*\S$/.test(name)) return "Nickname must not start or end with a space";
        return null;
    };

    const handleUpdate = (e) => {
        e.preventDefault();
        setLocalError("");

        const error = validateName(nicknameInput);
        if (error) {
            setLocalError(error);
            return;
        }

        if (nicknameInput !== currentNickname) {
            onChangeNickname(nicknameInput);
            setIsOpen(false);
        } else {
            setIsOpen(false);
        }
    };

    return (
        <div className="race-settings-wrapper" ref={wrapperRef}>
            <button className={`settings-tab-btn ${isOpen ? 'active' : ''}`} onClick={handleOpenToggle} title="Settings">
                <FaGear className="gear-icon" />
            </button>

            {isOpen && (
                <div className="settings-dropdown-panel game-card">
                    <h3 className="settings-title">Settings</h3>

                    {localError && <div style={{ color: 'red', fontSize: '12px', marginBottom: '10px', textAlign: 'center' }}>{localError}</div>}

                    <div className="settings-section">
                        <label className="settings-label">Change Nickname:</label>
                        <form className="nickname-input-group" onSubmit={handleUpdate}>
                            <input
                                type="text"
                                className="nickname-input"
                                value={nicknameInput}
                                onChange={(e) => setNicknameInput(e.target.value)}
                                placeholder="New nickname..."
                                required
                                minLength={3}
                                maxLength={15}
                                pattern={"^\\S.*\\S$"}
                                title="Nickname must be 3-15 characters and cannot start or end with a space"
                            />
                            <button type="submit" className="nickname-update-btn" title="Update">
                                <FaCheck />
                            </button>
                        </form>
                    </div>

                    <div className="settings-divider"></div>

                    <div className="settings-section">
                        <button className="settings-leave-btn" onClick={onLeaveRace}>
                            <FaRightFromBracket style={{ marginRight: '8px' }}/>
                            Leave Race
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default memo(RaceSettingsPlayer);