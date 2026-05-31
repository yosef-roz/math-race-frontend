import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import { WebSocketContext } from './WebSocketContext.js';
import { cookieService } from '../cookieService.js';
import {createGuestToken} from "../authService.js";
import {IP_SERVER} from "../../api/axios.js"


function WebSocketProvider({ children }) {
    const [isConnected, setIsConnected] = useState(false);
    const [lastMessage, setLastMessage] = useState(null);
    const [error, setError] = useState(null);
    const [authToken, setAuthToken] = useState(cookieService.getAuthToken());
    const [guestToken, setGuestToken] = useState(cookieService.getGuestToken());

    const clientRef = useRef(null);
    const hasRecovered = useRef(false);
    const watchdogTimerRef = useRef(null);


    const resetWatchdog = useCallback(() => {
        if (watchdogTimerRef.current) {
            clearTimeout(watchdogTimerRef.current);
        }

        watchdogTimerRef.current = setTimeout(() => {

            if (clientRef.current && clientRef.current.active) {
                const ws = clientRef.current.webSocket;
                if (ws) {
                    const stompOnClose = ws.onclose;

                    ws.onclose = null;
                    ws.close();

                    if (typeof stompOnClose === 'function') {
                        stompOnClose({ code: 1006, reason: 'Watchdog Timeout', wasClean: false });
                    }
                }
            }

        }, 10000);
    }, []);

    const updateAuthToken = useCallback((newToken, dayToSave) => {
        if (newToken) {
            cookieService.setAuthToken(newToken, dayToSave);
        } else {
            cookieService.removeAuthToken();
        }

        setAuthToken(newToken);
    }, []);

    const clearError = useCallback(() => {
        setError(null);
    }, []);
    const clearLastMessage = useCallback(() => {
        setLastMessage(null);
    }, []);

    const updateGuestToken = useCallback((newGuestToken,dayToSave) => {
        if (newGuestToken) {
            cookieService.setGuestToken(newGuestToken, dayToSave);
        } else {
            cookieService.removeGuestToken();
        }
        setGuestToken(newGuestToken);
    }, []);



    useEffect(() => {

        const client = new Client({
            brokerURL: `ws://${IP_SERVER}/api/ws-race`,
            connectHeaders: {
                Authorization: authToken ? `Bearer ${authToken}` : '',
                GuestToken: guestToken || '',
                'Is-Recovery': 'false'
            },
            reconnectDelay: 5000,
            heartbeatIncoming: 5000,
            heartbeatOutgoing: 5000,

            webSocketFactory: () => {
                const ws = new WebSocket(`ws://${IP_SERVER}/api/ws-race`);

                ws.addEventListener('message', () => {
                    resetWatchdog();
                });

                ws.addEventListener('close', () => {
                    if (watchdogTimerRef.current) clearTimeout(watchdogTimerRef.current);
                });

                return ws;
            },

            onConnect: () => {
                console.log("WS Connected!");
                setIsConnected(true);
                clearLastMessage();
                clearError();
                hasRecovered.current = false;
                client.connectHeaders['Is-Recovery'] = 'false';

                resetWatchdog();

                client.subscribe('/user/queue/notifications', (message) => {
                    const data = JSON.parse(message.body);
                    console.log("הגיע הודעה ל /user/queue/notifications'",data);

                    if (data.type === 'ERROR') {
                        console.log(data.content + " -1-");
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
                    try {
                        const response = await createGuestToken();

                        if (response.success) {
                            updateGuestToken(response.data.guestToken,response.data.dayToSave);
                            updateAuthToken(null,null);
                            setError(null);
                            console.log("Recovered successfully with Guest ID:", response.data.guestToken);
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
                console.log("WS WebSocket Closed!", event.code, event.reason);
                setIsConnected(false);

                if (event.reason && event.reason.startsWith("DUPLICATE_RACE_CONNECTION") || event.reason === "PLAYER_KICKED"
                    || event.reason === "PLAYER_LEFT") {
                    setError(event.reason);
                } else {
                    console.log("Network dropped or server unreachable. Code:", event.code);
                    setError("Session closed.");
                }
            },
            onWebSocketError: (event) => {
                console.log("WebSocket Network Error!", event);
                setIsConnected(false);
                setError("Session closed.");
            },
        });

        client.activate();
        clientRef.current = client;

        const handleOffline = () => {
            console.log("Browser detected network offline!");
            if (clientRef.current) {
                clientRef.current.deactivate();
                clientRef.current.connectHeaders['Is-Recovery'] = 'true';
            }
            setIsConnected(false);
            setError("Session closed.");
        };

        const handleOnline = () => {
            console.log("Browser detected network online! Reconnecting...");
            if (clientRef.current && !clientRef.current.active) {
                clientRef.current.activate();
            }
        };

        window.addEventListener('offline', handleOffline);
        window.addEventListener('online', handleOnline);

        return () => {
            window.removeEventListener('offline', handleOffline);
            window.removeEventListener('online', handleOnline);

            if (clientRef.current) {
                clientRef.current.deactivate();
                setIsConnected(false);
            }
        };
    }, [authToken, guestToken]);

    const reactivateConnection = useCallback(() => {
        if (clientRef.current && (!clientRef.current.active || !isConnected)) {
            console.log("Forcing Reactivation of STOMP client...");
            clientRef.current.activate();
        }
    }, [isConnected]);

    const sendMessage = useCallback((destination, body) => {
        if (clientRef.current && isConnected) {
            clientRef.current.publish({
                destination,
                body: JSON.stringify(body)
            });

        }else {
            console.warn("Attempted to send message while STOMP is not connected. Ignoring.");
        }
    }, [isConnected])

    const subscribe = useCallback((destination, callback, joinToken = null, onSubscribeReady = null) => {
        if (clientRef.current && isConnected) {

            const receiptId = `sub-receipt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

            const headers = {
                'receipt': receiptId
            };

            if (joinToken) {
                headers['Join-Token'] = joinToken;
            }

            if (typeof clientRef.current.watchForReceipt === 'function') {
                clientRef.current.watchForReceipt(receiptId, () => {
                    if (onSubscribeReady) {
                        onSubscribeReady();
                    }
                });
            }

            const subscription = clientRef.current.subscribe(destination, (message) => {
                callback(JSON.parse(message.body));
            }, headers);

            return () => {
                if (clientRef.current && clientRef.current.connected) {
                    try {
                        subscription.unsubscribe();
                    } catch (err) {
                        console.error(err);
                        if (clientRef.current._subscriptions && subscription.id) {
                            delete clientRef.current._subscriptions[subscription.id];
                        }
                    }
                }
            }
        }
        return () => {};
    }, [isConnected]);

    return (
        <WebSocketContext.Provider value={{
            isConnected,
            reactivateConnection,
            lastMessage,
            clearLastMessage,
            error,
            clearError,
            sendMessage,
            subscribe,
            updateAuthToken
        }}>
            {children}
        </WebSocketContext.Provider>
    );
}

export default WebSocketProvider;