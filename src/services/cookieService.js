import Cookies from 'js-cookie';

const TOKEN_KEY = 'auth_token';
const GUEST_ID_KEY = 'guest_id';

export const cookieService = {

    setToken: (token, days) => {
        Cookies.set(TOKEN_KEY, token, {
            expires: days,
            secure: true,
            sameSite: 'strict',
            path: '/'
        });
    },

    getToken: () => {
        return Cookies.get(TOKEN_KEY);
    },

    removeToken: () => {
        Cookies.remove(TOKEN_KEY);
    },

    setGuestID: (guestID, days) => {
        Cookies.set(GUEST_ID_KEY, guestID, {
            expires: days,
            secure: true,
            sameSite: 'strict',
            path: '/'
        });
    },

    getGuestID: () => {
        return Cookies.get(GUEST_ID_KEY);
    },

    removeGuestID: () => {
        Cookies.remove(GUEST_ID_KEY);
    }
};