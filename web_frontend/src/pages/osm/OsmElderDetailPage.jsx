// src/pages/osm/OsmElderDetailPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../../api/apiClient';
import { FaArrowLeft, FaHeartbeat, FaNotesMedical } from 'react-icons/fa';

const MenuButton = ({ path, icon, label }) => {
    const navigate = useNavigate();
    return (
        <button
            onClick={() => navigate(path)}
            className="w-full bg-white p-4 text-left text-lg font-medium rounded-lg shadow-md hover:bg-gray-50 flex items-center"
        >
            {icon}
            <span>{label}</span>
        </button>
    );
};

function OsmElderDetailPage() {
    const { elderId, elderName } = useParams();
    const navigate = useNavigate();

    const [elderData, setElderData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchElderDetails = async () => {
            setLoading(true);
            try {
                const response = await apiClient.get(`/users/elder_details/${elderId}`);
                setElderData(response.data);
            } catch (err) {
                console.error("Failed to fetch elder details:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchElderDetails();
    }, [elderId]);

    const avatarUrl = elderData?.avatar_url
        ? `${apiClient.defaults.baseURL.replace('/api', '')}${elderData.avatar_url}`
        : 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png';

    const menuItems = [
        // ตรวจสอบว่า Path นี้ถูกต้อง
        { label: "ดูประวัติข้อมูลสุขภาพ", path: `/osm/elder/${elderId}/${encodeURIComponent(elderName)}/health`, icon: <FaHeartbeat className="mr-4 text-red-500" /> },
        { label: "บันทึกข้อมูลสุขภาพใหม่", path: `/osm/elder/${elderId}/${encodeURIComponent(elderName)}/health/add`, icon: <FaNotesMedical className="mr-4 text-blue-500" /> },
    ];

    if (loading) return <div className="p-4 text-center">กำลังโหลด...</div>;

    return (
        <div className="flex flex-col min-h-screen bg-gray-100">
            <header className="bg-blue-500 text-white p-4 flex items-center">
                <button onClick={() => navigate('/osm/home')} className="mr-4 p-2 rounded-full hover:bg-blue-600">
                    <FaArrowLeft size={20} />
                </button>
                <h1 className="text-xl font-bold">จัดการผู้สูงอายุ</h1>
            </header>

            <main className="flex-1 p-4 overflow-y-auto">
                <div className="bg-white p-5 rounded-xl shadow-lg flex items-center space-x-6 mb-6">
                    <img 
                        src={avatarUrl}
                        alt={decodeURIComponent(elderName)}
                        className="w-24 h-24 rounded-full object-cover border-4 border-gray-200"
                    />
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">{decodeURIComponent(elderName)}</h2>
                        {elderData?.username && (
                            <p className="text-gray-500">Username: {elderData.username}</p>
                        )}
                    </div>
                </div>

                <div className="space-y-4">
                    {menuItems.map((item, index) => (
                        <MenuButton key={index} path={item.path} icon={item.icon} label={item.label} />
                    ))}
                </div>
            </main>
        </div>
    );
}

export default OsmElderDetailPage;