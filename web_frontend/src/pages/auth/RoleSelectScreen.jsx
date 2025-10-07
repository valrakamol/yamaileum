// src/pages/auth/RoleSelectScreen.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUserGraduate, FaUserNurse } from 'react-icons/fa';

function RoleSelectScreen() {
    const navigate = useNavigate();

    return (
        // ใช้ Flexbox จัดทุกอย่างให้อยู่ตรงกลางแนวตั้งและแนวนอน
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6">
            <div className="w-full max-w-xs text-center">

                {/* --- ส่วนหัว --- */}
                <h2 className="text-2xl font-semibold text-gray-700">ยินดีต้อนรับสู่</h2>
                <h1 className="text-3xl font-bold text-gray-800 mt-1">เว็บแอปพลิเคชัน </h1>
                <h1 className="text-3xl font-bold text-gray-800 mt-1">ยาไม่ลืม </h1>

                {/* --- รูปภาพไอคอน --- */}
                <div className="my-10">
                    <img 
                        src="/assets/med-icon.png" // Path ไปยังรูปภาพในโฟลเดอร์ public
                        alt="Medicine Icon" 
                        className="w-32 h-32 mx-auto" 
                    />
                </div>

                {/* --- ส่วนเลือกประเภทผู้ใช้ --- */}
                <div className="space-y-4">
                    <p className="text-gray-600">กรุณาเลือกประเภทผู้ใช้งาน</p>
                    
                    {/* ปุ่มสำหรับผู้สูงอายุ */}
                    <button
                        onClick={() => navigate('/elder/login')}
                        className="w-full text-white rounded-md shadow-md py-3 px-4 font-semibold transition-colors"
                        style={{ backgroundColor: '#1E5631' }} >
                        สำหรับผู้สูงอายุ
                    </button>

                    {/* ปุ่มสำหรับผู้ดูแล/อสม. */}
                    
                    <button
                        onClick={() => navigate('/login')}
                        className="w-full text-white rounded-md shadow-md py-3 px-4 font-semibold transition-colors"
                        style={{ backgroundColor: '#2E3B55' }} >
                        สำหรับผู้ดูแล / อสม.
                    </button>
                </div>
            </div>
        </div>
    );
}

export default RoleSelectScreen;