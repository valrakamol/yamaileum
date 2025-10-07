// src/pages/caregiver/ProfileTab.jsx
import React, { useState, useEffect, useRef } from 'react';
import apiClient from '../../api/apiClient';
import { jwtDecode } from 'jwt-decode';

function ProfileTab() {
    const [userInfo, setUserInfo] = useState(null);
    const fileInputRef = useRef(null); // Ref สำหรับอ้างอิงถึง input file ที่ซ่อนอยู่

    // ฟังก์ชันสำหรับดึงข้อมูล user จาก Token
    const fetchUserInfo = () => {
        const token = localStorage.getItem('authToken');
        if (token) {
            try {
                const decoded = jwtDecode(token);
                setUserInfo(decoded);
            } catch (error) {
                console.error("Invalid token:", error);
            }
        }
    };

    // เรียกใช้ fetchUserInfo ครั้งเดียวเมื่อ component โหลด
    useEffect(() => {
        fetchUserInfo();
    }, []);

    // --- *** 1. เพิ่มฟังก์ชันสำหรับจัดการการอัปโหลดรูปภาพ *** ---
    const handleAvatarUpload = async (e) => {
        const file = e.target.files[0];
        // ตรวจสอบว่ามีไฟล์และข้อมูลผู้ใช้พร้อมหรือไม่
        if (!file || !userInfo) return;

        const formData = new FormData();
        formData.append('file', file);

        try {
            // เรียกใช้ Endpoint ใหม่เพื่ออัปเดตรูปของ "ตัวเอง" (userInfo.sub คือ user id)
            await apiClient.post(`/users/update_avatar/${userInfo.sub}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            
            alert('อัปเดตรูปโปรไฟล์สำเร็จ! \nกรุณาออกจากระบบแล้วเข้าสู่ระบบใหม่อีกครั้งเพื่อดูการเปลี่ยนแปลง');
            
            // การ Logout และ Login ใหม่จะทำให้ได้รับ Token ใหม่ที่มี URL รูปภาพที่อัปเดตแล้ว
            localStorage.removeItem('authToken');
            window.location.href = '/login';

        } catch (error) {
            alert('ไม่สามารถอัปเดตรูปโปรไฟล์ได้ กรุณาลองใหม่อีกครั้ง');
        }
    };

    // ฟังก์ชันออกจากระบบ (เหมือนเดิม)
    const handleLogout = () => {
        if (window.confirm("คุณต้องการออกจากระบบใช่หรือไม่?")) {
            localStorage.removeItem('authToken');
            window.location.href = '/';
        }
    };

    // สร้าง URL เต็มสำหรับรูปภาพโปรไฟล์ (เหมือนเดิม)
    const avatarUrl = userInfo?.avatar_url
        ? `${apiClient.defaults.baseURL.replace('/api', '')}${userInfo.avatar_url}`
        : 'https://via.placeholder.com/150'; // รูปภาพสำรอง

    return (
        <div className="p-4 space-y-6">
            
            <div className="bg-white max-w-sm mx-auto rounded-xl shadow-lg overflow-hidden">
                <div className="relative flex flex-col items-center p-6">
                    
                    {/* --- *** 2. เพิ่ม UI สำหรับรูปโปรไฟล์และปุ่มแก้ไข *** --- */}
                    <div className="relative">
                        <img 
                            className="w-32 h-32 rounded-full object-cover border-4 border-green-400" 
                            src={avatarUrl} 
                            alt="Profile Avatar"
                        />
                        {/* ปุ่มแก้ไขรูปภาพ */}
                        <button
                            onClick={() => fileInputRef.current.click()} // เมื่อกดปุ่มนี้ ให้ไปคลิก input file ที่ซ่อนอยู่
                            className="absolute bottom-0 right-0 bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400"
                            aria-label="เปลี่ยนรูปโปรไฟล์"
                        >
                            {/* ไอคอนรูปดินสอ */}
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
                                <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
                            </svg>
                        </button>
                        {/* input file ที่ซ่อนไว้ */}
                        <input 
                            type="file"
                            ref={fileInputRef}
                            onChange={handleAvatarUpload}
                            accept="image/*"
                            className="hidden" 
                        />
                    </div>

                    {/* ชื่อ-นามสกุล */}
                    <h1 className="mt-4 text-2xl font-bold text-gray-800">
                        {userInfo ? userInfo.full_name : 'กำลังโหลด...'}
                    </h1>
                    
                    {/* ชื่อผู้ใช้ (Username) */}
                    <p className="text-gray-500">
                        @{userInfo ? userInfo.username : '...'}
                    </p>
                </div>
                
                {/* ข้อมูลเพิ่มเติม (เหมือนเดิม) */}
                <div className="border-t border-gray-200 px-6 py-4">
                    <div className="flex justify-between items-center text-gray-600">
                        <span className="font-medium">บทบาท:</span>
                        <span className="px-2 py-1 bg-green-200 text-green-800 text-sm rounded-full">
                            {userInfo ? userInfo.role : '...'}
                        </span>
                    </div>
                </div>
            </div>

            {/* ปุ่มออกจากระบบ (เหมือนเดิม) */}
            <div className="max-w-sm mx-auto">
                <button
                    onClick={handleLogout}
                    className="w-full bg-red-500 text-white py-3 px-4 rounded-md hover:bg-red-600 font-semibold"
                >
                    ออกจากระบบ
                </button>
            </div>
            
        </div>
    );
}

export default ProfileTab;