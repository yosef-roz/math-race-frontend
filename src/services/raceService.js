import {apiWithToken} from "../api/axios";

const createRace = async (raceData) => {
    const response = await apiWithToken.post('/race/create', raceData);
    return response.data;
};

const joinRace = async (joinData) => {
    const response = await apiWithToken.post(`/race/${joinData.roomCode}/join`, {
        nickname: joinData.nickname,
    });
    return response.data;
};

const getRaceInfo = async (roomCode) => {
    const response =
        await apiWithToken.get(`/race/${roomCode}/info`);
    return response.data;
};

export {
    createRace,
    getRaceInfo,
    joinRace
};