import React, { useState, useRef, useEffect, memo } from 'react';
import { FaGear, FaRightFromBracket, FaCheck } from "react-icons/fa6";
import './RaceSettingsPlayer.css';

const RaceSettingsPlayer = ({ currentNickname, onChangeNickname, onLeaveRace }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [nicknameInput, setNicknameInput] = useState("");

    const wrapperRef = useRef(null);
    const inputRef = useRef(null); // הוספנו רפרנס ש"יתפוס" את השדה שלנו

    useEffect(() => {
        function handleClickOutside(event) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleOpenToggle = () => {
        if (!isOpen) {
            setNicknameInput(currentNickname || "");
        }
        setIsOpen(!isOpen);
    };

    const handleUpdate = (e) => {
        if (e) e.preventDefault();

        // כאן הקסם: אנחנו אומרים לדפדפן לבדוק את השדה.
        // אם יש שגיאה (למשל קצר מדי), הדפדפן יקפיץ את המלבן האפור/לבן המוכר ויעצור.
        if (inputRef.current && !inputRef.current.reportValidity()) {
            return;
        }

        if (nicknameInput !== currentNickname) {
            if (onChangeNickname) onChangeNickname(nicknameInput);
        }

        setIsOpen(false);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleUpdate(e);
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

                    <div className="settings-section">
                        <label className="settings-label">Change Nickname:</label>
                        <div className="nickname-input-group">
                            <input
                                ref={inputRef} /* חיבור הרפרנס לשדה החיפוש */
                                type="text"
                                className="nickname-input"
                                value={nicknameInput}
                                onChange={(e) => setNicknameInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="New nickname..."
                                required
                                minLength={3}
                                maxLength={15}
                                pattern="^\S.*\S$"
                                title="Nickname must be 3-15 characters and cannot start or end with a space"
                            />
                            <button type="button" className="nickname-update-btn" onClick={handleUpdate} title="Update">
                                <FaCheck />
                            </button>
                        </div>
                    </div>

                    <div className="settings-divider"></div>

                    <div className="settings-section">
                        <button type="button" className="settings-leave-btn" onClick={onLeaveRace}>
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