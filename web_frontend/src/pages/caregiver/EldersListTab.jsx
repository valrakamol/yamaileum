// src/pages/caregiver/EldersListTab.jsx
import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '../../api/apiClient';
import { useNavigate } from 'react-router-dom';

function EldersListTab() {
    const [elders, setElders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    // --- ใช้ useCallback เพื่อประสิทธิภาพที่ดีขึ้น ---
    const fetchElders = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const response = await apiClient.get('/users/my_managed_elders');
            setElders(response.data.elders || []);
        } catch (err) {
            setError('ไม่สามารถโหลดข้อมูลผู้สูงอายุได้');
        } finally {
            setLoading(false);
        }
    }, []); // Dependency array ว่างเปล่า
    
    useEffect(() => {
        fetchElders();
    }, [fetchElders]);

    const handleViewDetails = (elderId, elderName) => {
        // Path สำหรับหน้า Detail ของ Caregiver
        navigate(`/caregiver/elder/${elderId}/${encodeURIComponent(elderName)}`);
    };

    const handleDelete = async (elderId, elderName) => {
        if (window.confirm(`คุณต้องการยกเลิกการดูแล ${elderName} ใช่หรือไม่?`)) {
            try {
                await apiClient.post('/users/unlink_elder', { elder_id: elderId });
                alert('ยกเลิกการดูแลสำเร็จ');
                fetchElders(); // โหลดข้อมูลใหม่
            } catch (err) {
                alert('เกิดข้อผิดพลาดในการยกเลิกการดูแล');
            }
        }
    };

    if (loading) return <p className="text-center p-4">กำลังโหลด...</p>;
    if (error) return <p className="text-center p-4 text-red-500">{error}</p>;

    return (
        <div className="p-4 space-y-4">
            {elders.length === 0 ? (
                <p className="text-center text-gray-500">ยังไม่มีผู้สูงอายุในความดูแล</p>
            ) : (
                elders.map((elder) => (
                    <div key={elder.id} className="bg-white p-4 rounded-lg shadow-md flex items-center justify-between">
                        
                        {/* --- *** จุดที่แก้ไข: เปลี่ยน span เป็น button *** --- */}
                        <button 
                            onClick={() => handleViewDetails(elder.id, elder.full_name)}
                            className="text-left font-semibold text-lg hover:text-blue-600 transition-colors flex-1"
                        >
                            {elder.full_name}
                        </button>

                        {/* ปุ่มลบยังคงอยู่เหมือนเดิม */}
                        <button 
                            onClick={() => handleDelete(elder.id, elder.full_name)}
                            className="bg-red-500 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-600"
                        >
                            ลบ
                        </button>
                    </div>
                ))
            )}
        </div>
    );
}

export default EldersListTab;