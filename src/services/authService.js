import {apiWithOutToken, apiWithToken} from "../api/axios";

const login = async (credentials) => {
    const response = await apiWithOutToken.post('/auth/login', credentials);
    return response.data;
}

const register = async (userData) => {
    const response = await apiWithOutToken.post('/auth/register', userData);
    return response.data;
};

const forgotPassword = async (email) => {
    const response = await apiWithOutToken.post('/auth/forgot-password', {email});
    return response.data;
};

const verifyAccount = async (token) => {
    const response = await apiWithOutToken.post('/auth/verify-account', {token});
    // לשקול לוותר על .DATA ולהחזיר במקום הכל
    return response.data;
};


const resetPassword = async (newPassword,token) => {
    const response = await apiWithOutToken.post('/auth/reset-password', {
        token: token,
        newPassword: newPassword
    });
    return response.data;
};

const changePassword = async (newPassword) => {
    const response = await apiWithToken.post('/auth/change-password', {
        newPassword: newPassword
    });
    return response.data;
};

const createRace = async (userData) => {
    const response = await apiWithToken.post('/race/create', userData);
    return response.data;
};

const joinRace = async (userData) => {
    const response = await apiWithToken.post('/race/join', userData);
    return response.data;
};

const createGuestId = async () => {
    const response = await apiWithOutToken.get('/auth/create-guestId');
    return response.data;
};

const raceInfo = async (roomCode) => {
    const response = await apiWithToken.post('/race/info', roomCode);
    return response.data;
};

export {
    login,
    register,
    forgotPassword,
    resetPassword,
    verifyAccount,
    changePassword,
    createRace,
    joinRace,
    createGuestId,
    raceInfo
};