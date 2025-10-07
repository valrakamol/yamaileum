// src/pages/elder/HealthRecordsTab.jsx
import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '../../api/apiClient';
import { jwtDecode } from 'jwt-decode';
import { FaHeart, FaWeight, FaStopwatch, FaStickyNote } from 'react-icons/fa';

function HealthRecordsTab() {
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [userId, setUserId] = useState(null);

    // ดึง User ID จาก Token
    useEffect(() => {
        const token = localStorage.getItem('authToken');
        if (token) {
            try {
                const decoded = jwtDecode(token);
                setUserId(decoded.sub); // 'sub' คือ User ID
            } catch (e) {
                setError('Token ไม่ถูกต้อง');
            }
        }
    }, []);

    const fetchHealthRecords = useCallback(async () => {
        if (!userId) return; // ถ้ายังไม่มี User ID ไม่ต้องทำอะไร
        setLoading(true);
        setError('');
        try {
            // ใช้ Endpoint สำหรับดึงข้อมูลสุขภาพของตัวเอง
            const response = await apiClient.get(`/health/records/elder/${userId}`);
            setRecords(response.data.records || []);
        } catch (err) {
            console.error("Failed to fetch health records:", err);
            setError('ไม่สามารถโหลดข้อมูลสุขภาพได้');
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        fetchHealthRecords();
    }, [fetchHealthRecords]);

    const InfoRow = ({ icon, text }) => (
        <div className="flex items-center space-x-2 text-gray-700">
            {icon}
            <span>{text}</span>
        </div>
    );

    return (
        <div className="p-4 space-y-4">
            <h2 className="text-xl font-bold text-center text-gray-800 mb-4">ประวัติข้อมูลสุขภาพ</h2>
            {loading && <p className="text-center">กำลังโหลด...</p>}
            {error && <p className="text-center text-red-500">{error}</p>}

            {!loading && !error && (
                records.length === 0 ? (
                    <p className="text-center text-gray-500">ยังไม่มีการบันทึกข้อมูลสุขภาพ</p>
                ) : (
                    records.map((rec) => (
                        <div key={rec.id} className="bg-white p-4 rounded-lg shadow-md">
                            <p className="text-sm text-gray-500 text-right mb-2">{rec.recorded_at}</p>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                                <InfoRow icon={<FaHeart className="text-red-500"/>} text={`ความดัน: ${rec.systolic_bp || '-'}/${rec.diastolic_bp || '-'} `} />
                                <InfoRow icon={<FaWeight className="text-blue-500"/>} text={`น้ำหนัก: ${rec.weight || '-'} กก.`} />
                                <InfoRow icon={<FaStopwatch className="text-purple-500"/>} text={`ชีพจร: ${rec.pulse || '-'} ครั้ง/นาที`} />
                            </div>
                            {rec.notes && (
                                <div className="mt-3 border-t pt-2">
                                    <InfoRow icon={<FaStickyNote className="text-yellow-500"/>} text={`หมายเหตุ: ${rec.notes}`} />
                                </div>
                            )}
                        </div>
                    ))
                )
            )}
        </div>
    );
}

export default HealthRecordsTab;