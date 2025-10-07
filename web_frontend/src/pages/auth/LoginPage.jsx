// src/pages/auth/LoginPage.jsx
import React, { useState } from 'react';
import apiClient from '../../api/apiClient';
import { useNavigate, Link } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode'; // ต้องติดตั้ง: npm install jwt-decode

function LoginPage() {
    // State สำหรับเก็บข้อมูลในฟอร์ม
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    
    // State สำหรับแสดงข้อความ error และสถานะ loading
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault(); // ป้องกันไม่ให้ฟอร์มรีเฟรชหน้า
        setError('');
        setIsLoading(true);

        try {
            const response = await apiClient.post('/auth/login', {
                username: username,
                password: password,
            });

            if (response.status === 200) {
                const { access_token } = response.data;
                
                // 1. บันทึก Token ไว้ใน Local Storage ของเบราว์เซอร์
                localStorage.setItem('authToken', access_token);
                
                // 2. ถอดรหัส Token เพื่อดูข้อมูลข้างใน (เช่น role)
                const decodedToken = jwtDecode(access_token);
                
                // 3. นำทางไปยังหน้าจอที่ถูกต้องตาม role
                const role = decodedToken.role;
                if (role === 'caregiver') {
                    navigate('/caregiver/home');
                } else if (role === 'osm') {
                    // (เพิ่ม Logic สำหรับ อสม. ที่นี่ในอนาคต)
                    navigate('/osm/home'); // ตัวอย่าง
                } else {
                    // กรณีเป็น role อื่นๆ หรือไม่มี role
                    setError('บทบาทผู้ใช้นี้ไม่รองรับการล็อกอินผ่านหน้านี้');
                }
            }
        } catch (err) {
            // แสดงข้อความ Error ที่ได้รับจาก Backend
            setError(err.response?.data?.msg || 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
        } finally {
            setIsLoading(false); // สิ้นสุดการโหลด
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="p-8 bg-white rounded-lg shadow-md w-full max-w-sm">
                <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">เข้าสู่ระบบ</h2>
                
                <form onSubmit={handleLogin} className="space-y-4">
                    {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700">ชื่อผู้ใช้ (Username)</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="mt-1 w-full p-2 border border-gray-300 rounded-md"
                            required
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700">รหัสผ่าน</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="mt-1 w-full p-2 border border-gray-300 rounded-md"
                            required
                        />
                    </div>
                    
                    <div className="text-right text-sm">
                        <Link to="/forgot-password" className="text-blue-500 hover:underline">
                            ลืมรหัสผ่าน?
                        </Link>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600 font-semibold disabled:bg-gray-400"
                    >
                        {isLoading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
                    </button>
                    
                    <div className="text-center text-sm">
                        <Link to="/register" className="text-gray-600 hover:text-blue-500">
                            ยังไม่มีบัญชี? สมัครสมาชิกที่นี่
                        </Link>
                    </div>
                    <div className="text-center text-sm">
                        <Link to="/" className="text-gray-600 hover:text-blue-500">
                            &larr; กลับไปหน้าเลือกประเภทผู้ใช้
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default LoginPage;