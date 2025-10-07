// src/pages/elder/ProfileTab.jsx
import React, { useState, useEffect } from 'react';
import apiClient from '../../api/apiClient';
import { jwtDecode } from 'jwt-decode';

function ProfileTab() {
    const [userInfo, setUserInfo] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem('authToken');
        if (token) {
            try {
                const decoded = jwtDecode(token);
                setUserInfo(decoded);
            } catch (error) {
                console.error("Invalid token:", error);
            }
        }
    }, []);

    const handleLogout = () => {
        if (window.confirm("คุณต้องการออกจากระบบใช่หรือไม่?")) {
            localStorage.removeItem('authToken');
            window.location.href = '/'; // กลับไปหน้าเลือก Role
        }
    };

    const avatarUrl = userInfo?.avatar_url
        ? `${apiClient.defaults.baseURL.replace('/api', '')}${userInfo.avatar_url}`
        : 'https://via.placeholder.com/150';

    return (
        <div className="p-4 space-y-6">
            <div className="bg-white max-w-sm mx-auto rounded-xl shadow-lg overflow-hidden">
                <div className="flex flex-col items-center p-6">
                    <img 
                        className="w-32 h-32 rounded-full object-cover border-4 border-blue-400" 
                        src={avatarUrl} 
                        alt="Profile Avatar"
                    />
                    <h1 className="mt-4 text-2xl font-bold text-gray-800">
                        {userInfo ? userInfo.full_name : 'กำลังโหลด...'}
                    </h1>
                    <p className="text-gray-500">
                        @{userInfo ? userInfo.username : '...'}
                    </p>
                </div>
                
                <div className="border-t border-gray-200 px-6 py-4">
                    <div className="flex justify-between items-center text-gray-600">
                        <span className="font-medium">บทบาท:</span>
                        <span className="px-2 py-1 bg-blue-200 text-blue-800 text-sm rounded-full">
                            {userInfo ? userInfo.role : '...'}
                        </span>
                    </div>
                </div>
            </div>

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