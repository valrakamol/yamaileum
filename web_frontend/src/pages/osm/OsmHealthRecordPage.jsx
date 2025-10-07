// src/pages/osm/OsmHealthRecordPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../../api/apiClient';
import { FaArrowLeft, FaHeart, FaWeight, FaStopwatch, FaStickyNote } from 'react-icons/fa';

// Component ย่อยสำหรับแสดงข้อมูลแต่ละแถว
const InfoRow = ({ icon, text }) => (
    <div className="flex items-center space-x-3 text-gray-700">
        {icon}
        <span>{text}</span>
    </div>
);

function OsmHealthRecordPage() {
    const { elderId, elderName } = useParams();
    const navigate = useNavigate();
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchHealthRecords = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const response = await apiClient.get(`/health/records/elder/${elderId}`);
            setRecords(response.data.records || []);
        } catch (err) {
            console.error("Failed to fetch health records:", err);
            setError('ไม่สามารถโหลดข้อมูลสุขภาพได้');
        } finally {
            setLoading(false);
        }
    }, [elderId]);

    useEffect(() => {
        fetchHealthRecords();
    }, [fetchHealthRecords]);

    return (
        <div className="flex flex-col h-screen bg-gray-100">
            <header className="bg-blue-500 text-white p-4 shadow-md flex items-center">
                <button 
                    onClick={() => navigate(`/osm/elder/${elderId}/${encodeURIComponent(elderName)}`)} 
                    className="mr-4 p-2 rounded-full hover:bg-blue-600"
                >
                    <FaArrowLeft size={20} />
                </button>
                <h1 className="text-xl font-bold">ประวัติสุขภาพ: {decodeURIComponent(elderName)}</h1>
            </header>

            <main className="flex-1 p-4 overflow-y-auto">
                <div className="space-y-4">
                    {loading && <p className="text-center text-gray-500">กำลังโหลด...</p>}
                    {error && <p className="text-center text-red-500">{error}</p>}
                    
                    {!loading && !error && (
                        records.length === 0 ? (
                            <p className="text-center text-gray-500 mt-8">ยังไม่มีการบันทึกข้อมูลสุขภาพ</p>
                        ) : (
                            records.map((rec) => (
                                <div key={rec.id} className="bg-white p-4 rounded-lg shadow-md">
                                    <p className="text-sm text-gray-500 text-right mb-2 font-medium">{rec.recorded_at}</p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                                        <InfoRow icon={<FaHeart className="text-red-500"/>} text={`ความดัน: ${rec.systolic_bp || '-'}/${rec.diastolic_bp || '-'} mmHg`} />
                                        <InfoRow icon={<FaStopwatch className="text-purple-500"/>} text={`ชีพจร: ${rec.pulse || '-'} ครั้ง/นาที`} />
                                        <InfoRow icon={<FaWeight className="text-blue-500"/>} text={`น้ำหนัก: ${rec.weight || '-'} กก.`} />
                                    </div>
                                    {rec.notes && (
                                        <div className="mt-3 border-t pt-3">
                                            <InfoRow icon={<FaStickyNote className="text-yellow-500"/>} text={`หมายเหตุ: ${rec.notes}`} />
                                        </div>
                                    )}
                                </div>
                            ))
                        )
                    )}
                </div>
            </main>
        </div>
    );
}

export default OsmHealthRecordPage;