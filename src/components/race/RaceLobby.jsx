import Button from "../ui/Button.jsx";
import { FaGear, FaRightFromBracket, FaShareNodes, FaXmark } from "react-icons/fa6";
import { memo, useState } from "react";
import { FaCheck, FaCopy, FaUserClock } from "react-icons/fa";
import { AlertModal, ALERT_TYPES } from "../ui/AlertModal.jsx";
import myLogo from "../../../public/logo.png";

import './RaceLobby.css';
import { QRCode } from 'react-qrcode-logo';

const PlayerAvatar = memo(({ player, isHost }) => {
    const isOnline = player.online !== false;
    const initial = player.nickname ? player.nickname.charAt(0).toUpperCase() : '?';

    const avatarStyle = {
        border: `4px solid ${player.carColor || 'var(--blue)'}`,
        boxShadow: `0 6px 0 ${player.carColor || 'var(--blue)'}`,
        backgroundColor: 'var(--code-bg)',
    };

    const smallDotStyle = {
        width: '10px',
        height: '10px',
        borderRadius: '50%',
        backgroundColor: isOnline ? 'var(--green)' : '#94a3b8',
        display: 'inline-block',
        flexShrink: 0
    };

    return (
        <div className="player-avatar-wrapper">
            <div className="avatar-circle" style={avatarStyle}>
                {initial}
                {isHost && (
                    <button className="kick-badge-btn" title="Kick Player">
                        <FaXmark />
                    </button>
                )}
            </div>

            <div className="avatar-names">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                    <span className="avatar-nickname">{player.nickname}</span>
                    <div className="status-dot" style={smallDotStyle}></div>
                </div>

                {player.userName ? (
                    <span className="avatar-username username-blue">@{player.userName}</span>
                ) : (
                    <span className="avatar-username username-ghost">-Ghost-</span>
                )}
            </div>
        </div>
    );
});


function RaceLobby({ raceState, onStartRace, isHost }) {
    const inviteLink = `${window.location.origin}/race/join?code=${raceState.roomCode}`;

    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isPendingOpen, setIsPendingOpen] = useState(false);
    const [nicknameInput, setNicknameInput] = useState("");

    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [confirmActionType, setConfirmActionType] = useState(null); // 'close' | 'leave'

    // סטייטים נפרדים לחיווי העתקה
    const [copyCodeSuccess, setCopyCodeSuccess] = useState(false);
    const [shareCopySuccess, setShareCopySuccess] = useState(false);

    const isPrivateRoom = true;
    const mockPendingPlayers = [
        { id: '1', nickname: 'New Player 1' },
        { id: '2', nickname: 'Cool Guy 99' }
    ];

    const durationMinutes = Math.round(raceState.totalDurationMillis / 60000);

    const toggleSettings = () => {
        setIsSettingsOpen(!isSettingsOpen);
        setIsPendingOpen(false);
    };

    const togglePending = () => {
        setIsPendingOpen(!isPendingOpen);
        setIsSettingsOpen(false);
    };

    const handleNicknameChange = () => {
        if (!nicknameInput.trim()) return;
        console.log("Updating nickname...", nicknameInput);
        setNicknameInput("");
        setIsSettingsOpen(false);
    };

    // פונקציית בסיס שרק מעתיקה טקסט ללוח (עם Fallback לטלפונים/HTTP)
    const performCopy = async (textToCopy) => {
        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(textToCopy);
                return true;
            } else {
                const textArea = document.createElement("textarea");
                textArea.value = textToCopy;
                textArea.style.position = "fixed";
                textArea.style.opacity = "0";
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                try {
                    document.execCommand('copy');
                    document.body.removeChild(textArea);
                    return true;
                } catch (err) {
                    console.error('Fallback copy failed', err);
                    document.body.removeChild(textArea);
                    return false;
                }
            }
        } catch (err) {
            console.error('Failed to copy text: ', err);
            return false;
        }
    };

    const handleCopyCodeClick = async () => {
        const success = await performCopy(raceState.roomCode);
        if (success) {
            setCopyCodeSuccess(true);
            setTimeout(() => setCopyCodeSuccess(false), 2000);
        }
    };

    const handleShareClick = async () => {
        const shareData = {
            title: '🏎️ Join the Math Race!',
            text: `🏎️ *Join the Math Race!*\n\nA new room is open and waiting for players in the lobby! 🏆\nLet's see who wins.\nRoom Code: ${raceState.roomCode}`,
            url: inviteLink
        };

        const fallbackText = inviteLink;

        if (navigator.share && window.isSecureContext) {
            try {
                await navigator.share(shareData);
            } catch (error) {
                if (error.name !== 'AbortError') {
                    const success = await performCopy(fallbackText);
                    if (success) {
                        setShareCopySuccess(true);
                        setTimeout(() => setShareCopySuccess(false), 2000);
                    }
                }
            }
        } else {
            const success = await performCopy(fallbackText);
            if (success) {
                setShareCopySuccess(true);
                setTimeout(() => setShareCopySuccess(false), 2000);
            } else {
                alert("Could not share or copy link.");
            }
        }
    };

    const handleOpenConfirmModal = (type) => {
        setConfirmActionType(type);
        setIsConfirmModalOpen(true);
        setIsSettingsOpen(false);
    };

    const handleConfirmAction = () => {
        setIsConfirmModalOpen(false);
    };

    return (
        <div className="lobby-fullscreen-layout">
            <aside className="lobby-sidebar left-sidebar game-card theme-blue">
                <div className="sidebar-top-content">
                    <h1 className="room-title">{raceState.name}</h1>

                    <div className="room-stats-box">
                        <p><strong>Time:</strong> {durationMinutes} Minutes</p>
                        <p><strong>Target:</strong> {raceState.targetScore} Points</p>
                    </div>

                    <div className="host-box">
                        <h3>Host</h3>
                        <span className="host-name">{raceState.host.nickname}</span>
                        {raceState.host.userName ? (
                            <span className="host-username username-blue">@{raceState.host.userName}</span>
                        ) : (
                            <span className="host-username username-ghost">-Ghost-</span>
                        )}
                    </div>
                </div>

                {isHost && (
                    <div className="sidebar-bottom-content">
                        <Button className="start-massive-btn" onClick={onStartRace} disabled={raceState.players.length === -1}>
                            Start Race
                        </Button>
                    </div>
                )}
            </aside>

            <main className="lobby-center-arena">
                <div className="arena-header">
                    <h2>Players Joined <span className="player-count-badge">{raceState.players.length}</span></h2>
                </div>

                <div className="players-scroll-area">
                    {raceState.players.length === 0 ? (
                        <div className="empty-arena">
                            <p>No players yet. Waiting...</p>
                        </div>
                    ) : (
                        <div className="avatars-grid">
                            {raceState.players.map(player => (
                                <PlayerAvatar key={player.id} player={player} isHost={isHost} />
                            ))}
                        </div>
                    )}
                </div>

                {!isHost && (
                    <div className="waiting-footer">
                        <p>Waiting for the host to start the game...</p>
                    </div>
                )}
            </main>

            <aside className="lobby-sidebar right-sidebar">

                <header className="controls-header">
                    {isHost && isPrivateRoom && (
                        <div className="dropdown-wrapper">
                            <Button onClick={togglePending} title="Pending Players" className="icon-btn">
                                <FaUserClock />
                                {mockPendingPlayers.length > 0 && (
                                    <span className="notification-dot">{mockPendingPlayers.length}</span>
                                )}
                            </Button>

                            {isPendingOpen && (
                                <div className="dropdown-menu game-card theme-yellow">
                                    <h3>Pending Players</h3>
                                    {mockPendingPlayers.length === 0 ? (
                                        <p>No pending players</p>
                                    ) : (
                                        <div className="pending-list">
                                            {mockPendingPlayers.map((player) => (
                                                <div key={player.id} className="pending-item">
                                                    <span>{player.nickname}</span>
                                                    <div className="pending-actions">
                                                        <Button className="approve-btn"><FaCheck/></Button>
                                                        <Button className="reject-btn"><FaXmark/></Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    <div className="dropdown-wrapper">
                        <Button onClick={toggleSettings} className="icon-btn">
                            <FaGear />
                        </Button>

                        {isSettingsOpen && (
                            <div className="dropdown-menu game-card theme-blue">
                                <h3>Settings</h3>
                                {isHost ? (
                                    <Button className="danger-btn" onClick={() => handleOpenConfirmModal('close')}>
                                        Close Race
                                    </Button>
                                ) : (
                                    <div className="settings-form">
                                        <label>Change Nickname:</label>
                                        <input
                                            type="text"
                                            value={nicknameInput}
                                            onChange={(e) => setNicknameInput(e.target.value)}
                                            placeholder="New nickname..."
                                        />
                                        <Button onClick={handleNicknameChange}>Update</Button>
                                        <hr />
                                        <Button className="danger-btn" onClick={() => handleOpenConfirmModal('leave')}>
                                            <FaRightFromBracket style={{ marginRight: '8px' }}/> Leave Race
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </header>

                <div className="invite-dashed-box">
                    <p className="invite-title">Invite Players</p>
                    <h2 className="massive-code">{raceState.roomCode}</h2>

                    <div className="qr-wrapper">
                        <QRCode
                            value={inviteLink}
                            size={160}
                            logoImage={myLogo}
                            logoWidth={45}
                            logoHeight={22}
                            logoOpacity={1}
                            removeQrCodeBehindLogo={true}
                            logoPadding={4}
                            qrStyle="squares"
                            ecLevel="M"
                            eyeRadius={8}
                            quietZone={10}
                            bgColor="#FFFFFF"
                            fgColor="#1e293b"
                        />
                    </div>

                    <div className="invite-actions">
                        <Button
                            onClick={handleCopyCodeClick}
                            title="Copy Code"
                            className={copyCodeSuccess ? "success-btn" : ""}
                        >
                            {copyCodeSuccess ? (
                                <><FaCheck style={{ marginRight: '6px' }} /> Copied!</>
                            ) : (
                                <><FaCopy style={{ marginRight: '6px' }} /> Copy</>
                            )}
                        </Button>

                        <Button
                            onClick={handleShareClick}
                            title="Share Room"
                            className={shareCopySuccess ? "success-btn" : ""}
                        >
                            {shareCopySuccess ? (
                                <><FaCheck style={{ marginRight: '6px' }} /> Link Copied!</>
                            ) : (
                                <><FaShareNodes style={{ marginRight: '6px' }} /> Share</>
                            )}
                        </Button>
                    </div>
                </div>

            </aside>

            {isConfirmModalOpen && (
                <AlertModal
                    type={ALERT_TYPES.ERROR}
                    title={confirmActionType === 'close' ? "Close Race" : "Leave Race"}
                    onClose={() => setIsConfirmModalOpen(false)}
                >
                    <div style={{ marginBottom: '24px' }}>
                        <p style={{ fontWeight: '900', fontSize: '20px', margin: '0 0 12px 0', color: 'var(--text-h)' }}>
                            Are you sure?
                        </p>
                        <p style={{ margin: 0, fontSize: '16px', lineHeight: '1.4' }}>
                            {confirmActionType === 'close'
                                ? "This will close the room and disconnect all players immediately."
                                : "You will be removed from the lobby and will need the code to join again."}
                        </p>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <Button className="danger-btn" onClick={handleConfirmAction}>
                            {confirmActionType === 'close' ? "Yes, Close Race" : "Yes, Leave Race"}
                        </Button>
                        <Button onClick={() => setIsConfirmModalOpen(false)}>
                            Cancel
                        </Button>
                    </div>
                </AlertModal>
            )}

        </div>
    );
}

export default RaceLobby;