import axios from 'axios';

const api = axios.create({
    // baseURL: 'https://cmsapi2.suvidhaen.com/',
    baseURL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/',
 });


api.interceptors.request.use((req) => {
    const cookies = document.cookie.split(';');
    let token = null;

    for (const cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === 'token') {
            token = value;
            break;
        }
    }
    if (token) {
        req.headers.authorization = `Bearer ${token}`
    }
    return req
})


// api.interceptors.response.use(
//     response => response,
//     error => {
//         if (error.response && error.response.status >= 500 && error.response.status < 600) {
//             window.location = '/error';
//         }
//         return Promise.reject(error);
//     }
// );

export default api
