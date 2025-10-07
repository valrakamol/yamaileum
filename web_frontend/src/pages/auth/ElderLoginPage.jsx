// src/pages/auth/ElderLoginPage.jsx
import React, { useState } from 'react';
import apiClient from '../../api/apiClient';
import { useNavigate, Link } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

function ElderLoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const response = await apiClient.post('/auth/login', {
                username: username,
                password: password,
            });

            if (response.status === 200) {
                const { access_token } = response.data;
                localStorage.setItem('authToken', access_token);
                
                const decodedToken = jwtDecode(access_token);
                const role = decodedToken.role;

                // --- *** ตรวจสอบว่า Role เป็น 'elder' เท่านั้น *** ---
                if (role === 'elder') {
                    navigate('/elder/home'); // ไปหน้า Home ของผู้สูงอายุ
                } else {
                    setError('บัญชีนี้ไม่ใช่บัญชีสำหรับผู้สูงอายุ');
                    localStorage.removeItem('authToken'); // ล้าง token ที่ผิด
                }
            }
        } catch (err) {
            setError(err.response?.data?.msg || 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="p-8 bg-white rounded-lg shadow-md w-full max-w-sm">
                <h2 className="text-2xl font-bold text-center mb-1 text-gray-800">สำหรับผู้สูงอายุ</h2>
                <p className="text-center text-gray-500 mb-6">กรุณาเข้าสู่ระบบ</p>
                
                <form onSubmit={handleLogin} className="space-y-4">
                    {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700">ชื่อผู้ใช้ (ที่ผู้ดูแลตั้งให้)</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="mt-1 w-full p-2 border rounded-md"
                            required
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700">รหัสผ่าน</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="mt-1 w-full p-2 border rounded-md"
                            required
                        />
                    </div>
                    
                    {/* (อาจจะมีลิงก์ "ลืมรหัสผ่าน?" สำหรับผู้สูงอายุในอนาคต) */}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600 font-semibold disabled:bg-gray-400"
                    >
                        {isLoading ? 'กำลังตรวจสอบ...' : 'เข้าสู่ระบบ'}
                    </button>
                    
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

export default ElderLoginPage;