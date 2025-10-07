import axios from 'axios';

// *** สำคัญ: เปลี่ยน IP ให้ตรงกับ IP ของเครื่องที่รัน Backend ***
// หรือใช้ 'http://localhost:5000/api' ถ้าทดสอบบนเครื่องเดียวกัน
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// เพิ่ม Interceptor เพื่อแนบ Token ไปกับทุก Request โดยอัตโนมัติ
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('authToken');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default apiClient;