// src/pages/caregiver/ElderDetailScreen.jsx
import React, { useState, useEffect, useRef } from 'react'; // 1. เพิ่ม useRef
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../../api/apiClient';
import { FaArrowLeft, FaCapsules, FaCalendarCheck, FaChartBar, FaEdit } from 'react-icons/fa'; // 2. เพิ่ม FaEdit

// (MenuButton Component เหมือนเดิม)
const MenuButton = ({ path, icon, label }) => {
    const navigate = useNavigate();
    return (
        <button
            onClick={() => navigate(path)}
            className="w-full bg-white p-4 text-left text-lg font-medium rounded-lg shadow-md hover:bg-gray-50 transition-colors flex items-center"
        >
            {icon}
            <span>{label}</span>
        </button>
    );
};

function ElderDetailScreen() {
    const { elderId, elderName } = useParams();
    const navigate = useNavigate();
    const fileInputRef = useRef(null); // 3. สร้าง Ref สำหรับ input file

    const [elderData, setElderData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchElderDetails = async () => {
            setLoading(true);
            setError('');
            try {
                const response = await apiClient.get(`/users/elder_details/${elderId}`);
                setElderData(response.data);
            } catch (err) {
                console.error("Failed to fetch elder details:", err);
                setError('ไม่สามารถโหลดข้อมูลผู้สูงอายุได้');
            } finally {
                setLoading(false);
            }
        };

        fetchElderDetails();
    }, [elderId]);

    // --- 4. เพิ่มฟังก์ชันสำหรับจัดการการอัปโหลดรูปภาพ ---
    const handleAvatarUpload = async (e) => {
        const file = e.target.files[0];
        if (!file || !elderId) return;

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await apiClient.post(`/users/update_avatar/${elderId}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            // อัปเดต state เพื่อให้รูปภาพบนหน้าจอเปลี่ยนทันที
            setElderData(prev => ({ ...prev, avatar_url: response.data.avatar_url }));
            alert('อัปเดตรูปโปรไฟล์สำเร็จ!');
        } catch (error) {
            alert('ไม่สามารถอัปเดตรูปโปรไฟล์ได้');
        }
    };

    const menuItems = [
        { label: "จัดการรายการยา", path: `/caregiver/elder/${elderId}/${encodeURIComponent(elderName)}/medicines`, icon: <FaCapsules className="mr-4 text-blue-500" /> },
        { label: "จัดการนัดหมายแพทย์", path: `/caregiver/elder/${elderId}/${encodeURIComponent(elderName)}/appointments`, icon: <FaCalendarCheck className="mr-4 text-purple-500" /> },
        { label: "ดูข้อมูลสุขภาพ", path: `/caregiver/elder/${elderId}/${encodeURIComponent(elderName)}/health`, icon: <FaChartBar className="mr-4 text-red-500" /> },
    ];

    const avatarUrl = elderData?.avatar_url
        ? `${apiClient.defaults.baseURL.replace('/api', '')}${elderData.avatar_url}`
        : 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png';

    return (
        <div className="flex flex-col min-h-screen bg-gray-100">
            <header className="bg-green-500 text-white p-4 shadow-md flex items-center sticky top-0 z-10">
                <button onClick={() => navigate('/caregiver/home')} className="mr-4 p-2 rounded-full hover:bg-green-600">
                    <FaArrowLeft size={20} />
                </button>
                <h1 className="text-xl font-bold">จัดการผู้สูงอายุ</h1>
            </header>

            <main className="flex-1 p-4 overflow-y-auto">
                {loading && <p className="text-center">กำลังโหลดข้อมูล...</p>}
                {error && <p className="text-center text-red-500">{error}</p>}
                
                {!loading && !error && (
                    <>
                        {/* --- Profile Card --- */}
                        <div className="bg-white p-5 rounded-xl shadow-lg flex items-center space-x-6 mb-6">
                            {/* --- 5. เพิ่มโค้ดปุ่มแก้ไขรูปภาพ --- */}
                            <div className="relative">
                                <img 
                                    src={avatarUrl}
                                    alt={decodeURIComponent(elderName)}
                                    className="w-24 h-24 rounded-full object-cover border-4 border-gray-200"
                                />
                                <button
                                    onClick={() => fileInputRef.current.click()}
                                    className="absolute -bottom-2 -right-2 bg-blue-500 text-white p-2 rounded-full shadow-md hover:bg-blue-600 focus:outline-none"
                                    aria-label="เปลี่ยนรูปโปรไฟล์"
                                >
                                    <FaEdit size={14} />
                                </button>
                                <input 
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleAvatarUpload}
                                    accept="image/*"
                                    className="hidden" // ซ่อน input field จริง
                                />
                            </div>
                            
                            <div>
                                <h2 className="text-2xl font-bold text-gray-800">{decodeURIComponent(elderName)}</h2>
                                {elderData?.username && (
                                    <p className="text-gray-500">Username: {elderData.username}</p>
                                )}
                            </div>
                        </div>

                        {/* --- Menu --- */}
                        <div className="space-y-4">
                            {menuItems.map((item, index) => (
                                <MenuButton
                                    key={index}
                                    path={item.path}
                                    icon={item.icon}
                                    label={item.label}
                                />
                            ))}
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}

export default ElderDetailScreen;