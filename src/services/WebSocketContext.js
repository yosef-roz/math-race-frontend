import {createContext, useContext} from 'react';

// כאן אנחנו מייצאים רק את האובייקט. זה לא קומפוננטה.
export const WebSocketContext = createContext(null);

export function useWebSocket() {
    return useContext(WebSocketContext);
}