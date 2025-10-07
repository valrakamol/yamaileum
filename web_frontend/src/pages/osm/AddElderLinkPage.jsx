// src/pages/osm/AddElderLinkPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '../../api/apiClient';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';

function AddElderLinkPage() {
    const [allElders, setAllElders] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();

    const fetchAllElders = useCallback(async () => {
        try {
            const response = await apiClient.get('/users/all_elders');
            setAllElders(response.data.elders || []);
        } catch (error) {
            console.error("Failed to fetch all elders", error);
        }
    }, []);

    useEffect(() => {
        fetchAllElders();
    }, [fetchAllElders]);

    const handleLink = async (elderId, elderName) => {
        if (window.confirm(`ต้องการเพิ่ม ${elderName} เข้าสู่การดูแลใช่หรือไม่?`)) {
            try {
                await apiClient.post('/users/link_elder_by_id', { elder_id: elderId });
                alert('เชื่อมโยงสำเร็จ!');
                // (ทางเลือก) สามารถลบชื่อออกจาก List นี้ได้หลังเชื่อมโยงสำเร็จ
            } catch (err) {
                alert(err.response?.data?.msg || 'ไม่สามารถเชื่อมโยงได้');
            }
        }
    };

    const filteredElders = allElders.filter(e => e.full_name.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="flex flex-col h-screen bg-gray-100">
            <header className="bg-blue-500 text-white p-4 flex items-center">
                <button onClick={() => navigate(-1)} className="mr-4 p-2"><FaArrowLeft /></button>
                <h1 className="text-xl font-bold">เชื่อมโยงผู้สูงอายุ</h1>
            </header>
            <div className="p-4">
                <input 
                    type="text"
                    placeholder="ค้นหาจากรายชื่อผู้สูงอายุทั้งหมด..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full p-2 border rounded-md"
                />
            </div>
            <main className="flex-1 p-4 overflow-y-auto space-y-3">
                {filteredElders.map(elder => (
                    <div key={elder.id} className="bg-white p-3 rounded-lg shadow flex justify-between items-center">
                        <span>{elder.full_name}</span>
                        <button onClick={() => handleLink(elder.id, elder.full_name)} className="bg-green-500 text-white px-3 py-1 rounded text-sm">
                            เชื่อมโยง
                        </button>
                    </div>
                ))}
            </main>
        </div>
    );
}

export default AddElderLinkPage;