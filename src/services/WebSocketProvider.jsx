import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import { WebSocketContext } from './WebSocketContext';
import { cookieService } from './cookieService';
import {createGuestId} from "./authService.js";

function WebSocketProvider({ children }) {
    const [isConnected, setIsConnected] = useState(false);
    const [lastMessage, setLastMessage] = useState(null);
    const [error, setError] = useState(null);
    const [token, setToken] = useState(cookieService.getToken());
    const [guestID, setGuestID] = useState(cookieService.getGuestID());

    const clientRef = useRef(null);
    const hasRecovered = useRef(false);

    const updateToken = useCallback((newToken,dayToSave) => {
        if (newToken) {
            cookieService.setToken(newToken, dayToSave);
        } else {
            cookieService.removeToken();
        }
        setToken(newToken);
    }, []);

    const clearError = useCallback(() => {
        setError(null);
    }, []);
    const clearLastMessage = useCallback(() => {
        setLastMessage(null);
    }, []);

    const updateGuestID = useCallback((newGuestID,dayToSave) => {
        if (newGuestID) {
            cookieService.setGuestID(newGuestID, dayToSave);
        } else {
            cookieService.removeGuestID();
        }
        setGuestID(newGuestID);
    }, []);



    useEffect(() => {
        //if (!token && !guestID) return;

        const client = new Client({
            brokerURL: 'ws://localhost:8085/api/ws-race',
            connectHeaders: {
                Authorization: token ? `Bearer ${token}` : '',
                GuestID: guestID || ''
            },
            reconnectDelay: 5000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,

            onConnect: () => {
                console.log("WS Connected!");
                setIsConnected(true);
                clearLastMessage();
                clearError();
                hasRecovered.current = false;

                client.subscribe('/user/queue/notifications', (message) => {
                    const data = JSON.parse(message.body);

                    if (data.type === 'ERROR') {
                        setError(data.content);
                    } else {
                        setLastMessage(data);
                    }
                });
            },

            onDisconnect: () => {
                console.log("WS Disconnected");
                setIsConnected(false);
            },

            onStompError: async (frame) => {
                const errorMsg = frame.headers['message'];
                setIsConnected(false);

                if (!hasRecovered.current && (errorMsg === "MISSING_IDENTIFICATION" || errorMsg === "AUTH_FAILED")) {
                    console.log("Recovering directly from error event...");
                    try {
                        const response = await createGuestId();

                        if (response.success) {
                            updateGuestID(response.data.guestId,response.data.dayToSave);
                            updateToken(null,null);
                            setError(null);
                            console.log("Recovered successfully with Guest ID:", response.data.guestId);
                        } else {
                            setError(errorMsg);
                        }
                    } catch (err) {
                        console.error("Failed to fetch Guest ID:", err);
                        setError("SERVER_ERROR");
                    }
                } else {
                    setError(errorMsg);
                }
            },
            onWebSocketClose: (event) => {
                if (event.reason && event.reason.startsWith("DUPLICATE_RACE_CONNECTION")) {
                    setError(event.reason);
                }
                setIsConnected(false);
            },
        });

        client.activate();
        clientRef.current = client;

        return () => {
            if (clientRef.current) {
                clientRef.current.deactivate();
                setIsConnected(false);
            }
        };
    }, [token, guestID]);

    const sendMessage = useCallback((destination, body) => {
        if (clientRef.current && isConnected) {
            clientRef.current.publish({
                destination,
                body: JSON.stringify(body)
            });
        }
    }, [isConnected]);

    const subscribe = useCallback((destination, callback, joinToken = null) => {
        if (clientRef.current && isConnected) {

            const headers = {};
            if (joinToken) {
                headers['Join-Token'] = joinToken;
            }

            const subscription = clientRef.current.subscribe(destination, (message) => {
                callback(JSON.parse(message.body));
            }, headers);

            return () => subscription.unsubscribe();
        }
        return () => {};
    }, [isConnected]);

    return (
        <WebSocketContext.Provider value={{
            isConnected,
            lastMessage,
            clearLastMessage,
            error,
            clearError,
            sendMessage,
            subscribe,
            updateToken
        }}>
            {children}
        </WebSocketContext.Provider>
    );
}

export default WebSocketProvider;