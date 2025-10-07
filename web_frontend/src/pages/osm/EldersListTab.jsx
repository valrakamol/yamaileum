// src/pages/osm/EldersListTab.jsx
import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '../../api/apiClient';
import { useNavigate } from 'react-router-dom';

function EldersListTab() {
    const [elders, setElders] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const fetchManagedElders = useCallback(async () => {
        setLoading(true);
        try {
            const response = await apiClient.get('/users/my_managed_elders');
            setElders(response.data.elders || []);
        } catch (error) {
            console.error("Failed to fetch elders", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchManagedElders();
    }, [fetchManagedElders]);

    const handleUnlink = async (elderId, elderName) => {
        if (window.confirm(`ต้องการยกเลิกการดูแล ${elderName} ใช่หรือไม่?`)) {
            try {
                await apiClient.post('/users/unlink_elder', { elder_id: elderId });
                fetchManagedElders(); // Reload list
            } catch (err) {
                alert('เกิดข้อผิดพลาด');
            }
        }
    };

    // เมื่อกดที่ชื่อผู้สูงอายุ จะไปหน้า Detail ของ อสม.
    const handleViewDetails = (elderId, elderName) => {
        navigate(`/osm/elder/${elderId}/${encodeURIComponent(elderName)}`);
    };

    return (
        <div className="p-4">
            <div className="space-y-4">
                {loading ? <p>กำลังโหลด...</p> : 
                 elders.length === 0 ? <p className="text-center text-gray-500">ยังไม่มีผู้สูงอายุในความดูแล</p> :
                 elders.map((elder) => (
                    <div key={elder.id} className="bg-white p-4 rounded-lg shadow-md flex items-center justify-between">
                        <button onClick={() => handleViewDetails(elder.id, elder.full_name)} className="text-left font-semibold hover:text-blue-600">
                            {elder.full_name}
                        </button>
                        <button onClick={() => handleUnlink(elder.id, elder.full_name)} className="bg-red-500 text-white px-3 py-1 rounded text-sm">
                            ยกเลิก
                        </button>
                    </div>
                ))}
            </div>
            <div className="mt-6">
                <button onClick={() => navigate('/osm/add-elder')} className="w-full bg-blue-600 text-white py-3 rounded-md text-lg">
                    + เพิ่มผู้สูงอายุในความดูแล
                </button>
            </div>
        </div>
    );
}

export default EldersListTab;