// src/pages/auth/ResetPasswordPage.jsx
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../../api/apiClient';

function ResetPasswordPage() {
    const { token } = useParams();
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [isError, setIsError] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setMessage('รหัสผ่านไม่ตรงกัน');
            setIsError(true);
            return;
        }

        try {
            const response = await apiClient.post(`/auth/reset_password/${token}`, { password });
            setMessage(response.data.msg);
            setIsError(false);
            setTimeout(() => navigate('/login'), 2000);
        } catch (error) {
            setMessage(error.response?.data?.msg || 'เกิดข้อผิดพลาด');
            setIsError(true);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="p-8 bg-white rounded-lg shadow-md w-96">
                <h2 className="text-2xl font-bold text-center mb-6">ตั้งรหัสผ่านใหม่</h2>
                {message && <p className={isError ? 'text-red-500' : 'text-green-500'}>{message}</p>}
                <form onSubmit={handleSubmit}>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        placeholder="รหัสผ่านใหม่"
                        className="w-full p-2 border rounded-md mb-4"
                    />
                     <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        placeholder="ยืนยันรหัสผ่านใหม่"
                        className="w-full p-2 border rounded-md mb-4"
                    />
                    <button type="submit" className="w-full bg-blue-500 text-white p-2 rounded-md">
                        ยืนยัน
                    </button>
                </form>
            </div>
        </div>
    );
}
export default ResetPasswordPage;