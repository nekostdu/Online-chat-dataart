import axios, { AxiosError } from 'axios';
export const api = axios.create({
    baseURL: '/api',
    withCredentials: true,
    headers: { 'Content-Type': 'application/json' },
});
export function errorMessage(e, fallback = 'Something went wrong') {
    if (e instanceof AxiosError) {
        const data = e.response?.data;
        if (data?.error)
            return data.error;
        if (e.message)
            return e.message;
    }
    if (e instanceof Error)
        return e.message;
    return fallback;
}
