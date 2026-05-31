import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import ProfileModal from "../pages/profile/ProfileModal.jsx";
import { myProfile } from "../services/userProfileService.js";
import { useWebSocket } from "../services/webSocket/WebSocketContext.js";
import logo from '../../public/logo.png';
import './MainLayout.css';
import {FaXmark} from "react-icons/fa6";

function MainLayout() {
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [user, setUser] = useState(null);

    const navigate = useNavigate();
    const location = useLocation();
    const { isConnected, sendMessage, lastMessage,clearLastMessage } = useWebSocket();
    const [activeRaceNotification, setActiveRaceNotification] = useState(null);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const response = await myProfile();
                if (response && response.success && response.data) {
                    setUser(response.data);
                } else if (response && response.username) {
                    setUser(response);
                }
            } catch (error) {
                console.log("User is acting as a guest or not logged in.",error);
            }
        };
        fetchUserData();
    }, []);

    useEffect(() => {
        if (isConnected) {
            clearLastMessage();
            sendMessage('/app/race.me', {});
        }
    }, [isConnected, location.pathname, sendMessage,clearLastMessage]);

    useEffect(() => {
        if (lastMessage) {
            if (lastMessage.type === 'JOINED_RACE_FOUND') {
                setActiveRaceNotification(lastMessage.data);
            } else if (lastMessage.type === 'NO_JOINED_RACE_FOUND') {
                setActiveRaceNotification(null);
            }
        }
        clearLastMessage();

    }, [lastMessage, clearLastMessage]);

    const handleJoinRace = () => {
        if (activeRaceNotification) {
            const { roomCode } = activeRaceNotification;
            setActiveRaceNotification(null);
            navigate(`/race/join?code=${roomCode}`);
        }
    };

    const handleLeaveRace = () => {
        if (activeRaceNotification) {
            const { roomCode, role } = activeRaceNotification;

            if (role === 'host') {
                sendMessage(`/app/race/${roomCode}/host/cancel`, {});
            } else {
                sendMessage(`/app/race/${roomCode}/player/left`, {});
            }

            setActiveRaceNotification(null);
        }
    };

    const formatTime = (timestamp) => {
        if (!timestamp) return "לא ידוע";
        return new Date(timestamp).toLocaleTimeString('he-IL', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="main-layout-wrapper">
            <header className="dashboard-header">
                <button
                    className="profile-btn"
                    onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                    onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    onClick={() => setIsProfileOpen(true)}
                    title="Profile"
                >
                    {user ? user.username.substring(0, 1).toUpperCase() : 'G'}
                </button>
                <img src={logo} alt="Math Race Logo" className="dashboard-logo" />
            </header>

            <nav className="main-nav">
                <NavLink to="/" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"} end>
                    Play
                </NavLink>

                <NavLink to="/public-races" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
                    Public Races
                </NavLink>
            </nav>

            <main className="main-content">
                <Outlet />
            </main>

            {activeRaceNotification && (
                <div className="active-race-toast">
                    <div className="toast-header">
                        <h3>Active Race Found</h3>
                        <button
                            className="close-toast-btn"
                            onClick={() => setActiveRaceNotification(null)}
                            title="Close"
                        >
                            <FaXmark size={22} />
                        </button>
                    </div>

                    <div className="toast-body">
                        <p><strong>Race Name:</strong> {activeRaceNotification.name}</p>
                        <p><strong>Host:</strong> {activeRaceNotification.hostNickname}</p>
                        <p><strong>Status:</strong> {activeRaceNotification.status}</p>
                        <p><strong>Start Time:</strong> {formatTime(activeRaceNotification.startTime)}</p>
                    </div>

                    <div className="toast-actions">
                        <button className="toast-btn red-btn" onClick={handleLeaveRace}>{
                            activeRaceNotification.role === 'host' ? "Cancel Race" : "Leave Race"}</button>
                        <button className="toast-btn green-btn" onClick={handleJoinRace}>Join Race</button>
                    </div>
                </div>
            )}

            {isProfileOpen && (
                <ProfileModal
                    onClose={() => setIsProfileOpen(false)}
                    user={user}
                    onLogout={() => setUser(null)}
                />
            )}
        </div>
    )
}

export default MainLayout;