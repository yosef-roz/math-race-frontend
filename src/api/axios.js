import axios from "axios";
import {cookieService} from "../services/cookieService.js";

const BASE_URL = 'http://localhost:8085/api';

const apiWithOutToken = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    }
})

const apiWithToken = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

apiWithToken.interceptors.request.use((config) => {
    const token = cookieService.getToken();
    const guest_id = cookieService.getGuestID();


    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    if (guest_id){
        config.headers.GuestID = guest_id;
    }

    return config;
}, (error) => {
    console.log("Something went wrong");
    return Promise.reject(error);
});

export {
    apiWithOutToken,
    apiWithToken,
};