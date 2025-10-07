// src/pages/auth/ForgotPasswordPage.jsx
import React, { useState } from 'react';
import apiClient from '../../api/apiClient';
import { Link } from 'react-router-dom';

function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [isError, setIsError] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false); // <-- 1. เพิ่ม State ใหม่

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('กำลังส่งอีเมล...');
        setIsError(false);
        
        try {
            const response = await apiClient.post('/auth/request_reset_password', { email });
            setMessage(response.data.msg);
            setIsSubmitted(true); // <-- 2. ตั้งค่าว่าส่งสำเร็จแล้ว
        } catch (error) {
            setMessage('เกิดข้อผิดพลาด กรุณาตรวจสอบอีเมลแล้วลองใหม่อีกครั้ง');
            setIsError(true);
            setIsSubmitted(false); // ยังไม่สำเร็จ
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="p-8 bg-white rounded-lg shadow-md w-96">
                <h2 className="text-2xl font-bold text-center mb-6">ลืมรหัสผ่าน</h2>
                
                {/* --- *** 3. แก้ไข Logic การแสดงผลทั้งหมด *** --- */}
                
                {/* ถ้ายังไม่ได้ Submit หรือมี Error ให้แสดงฟอร์ม */}
                {!isSubmitted || isError ? (
                    <form onSubmit={handleSubmit}>
                        <p className="text-center text-gray-600 mb-4">
                            กรอกอีเมลของคุณเพื่อรับลิงก์สำหรับรีเซ็ตรหัสผ่าน
                        </p>
                        
                        {/* แสดงข้อความ Error ถ้ามี */}
                        {isError && <p className="text-red-500 text-center mb-4">{message}</p>}

                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            placeholder="your-email@example.com"
                            className="w-full p-2 border rounded-md mb-4"
                        />
                        <button type="submit" className="w-full bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600">
                            ส่งลิงก์รีเซ็ต
                        </button>
                    </form>
                ) : (
                    // ถ้า Submit สำเร็จแล้ว ให้แสดงข้อความ
                    <div className="text-center">
                        <p className="text-green-600 font-medium">{message}</p>
                        <p className="text-gray-500 mt-2">กรุณาตรวจสอบกล่องจดหมายของคุณ</p>
                    </div>
                )}

                <div className="text-center mt-6">
                    <Link to="/login" className="text-sm text-blue-500 hover:underline">
                        กลับไปหน้าล็อกอิน
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default ForgotPasswordPage;