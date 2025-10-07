// src/pages/caregiver/medicines/MedicineListPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../../../api/apiClient';
import { FaArrowLeft } from 'react-icons/fa';

// ดึง Base URL ของ Backend ออกมาไว้นอก Component เพื่อให้แน่ใจว่าค่าถูกต้อง
const BACKEND_URL = apiClient.defaults.baseURL.replace('/api', '');

function MedicineListPage() {
    const { elderId, elderName } = useParams();
    const navigate = useNavigate();
    const [medicines, setMedicines] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchMedicines = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const response = await apiClient.get(`/medicines/elder/${elderId}`);
            setMedicines(response.data.medicines || []);
        } catch (err) {
            console.error("Failed to fetch medicines", err);
            setError('ไม่สามารถโหลดรายการยาได้');
        } finally {
            setLoading(false);
        }
    }, [elderId]);

    useEffect(() => {
        // ใช้ setInterval เพื่อดึงข้อมูลใหม่ทุกๆ 1 นาที (60000 ms)
        // เพื่อให้สถานะอัปเดตใกล้เคียง Real-time
        fetchMedicines();
        const interval = setInterval(fetchMedicines, 60000);
        
        // Cleanup function: หยุด interval เมื่อ component unmount
        return () => clearInterval(interval);
    }, [fetchMedicines]);

    const handleDelete = async (medId, medName) => {
        if (window.confirm(`คุณต้องการลบยา "${medName}" ใช่หรือไม่?`)) {
            try {
                await apiClient.delete(`/medicines/delete/${medId}`);
                alert('ลบยาสำเร็จ');
                fetchMedicines(); // โหลดข้อมูลใหม่ทันทีหลังลบ
            } catch (error) {
                alert('ไม่สามารถลบยาได้');
            }
        }
    };
    
    return (
        <div className="flex flex-col h-screen bg-gray-100">
            <header className="bg-green-500 text-white p-4 shadow-md flex items-center sticky top-0 z-10">
                <button 
                    onClick={() => navigate(`/caregiver/elder/${elderId}/${encodeURIComponent(elderName)}`)} 
                    className="mr-4 p-2 rounded-full hover:bg-green-600 transition-colors"
                >
                    <FaArrowLeft size={20} />
                </button>
                <h1 className="text-xl font-bold">รายการยา: {decodeURIComponent(elderName)}</h1>
            </header>

            <main className="flex-1 p-4 overflow-y-auto">
                <div className="space-y-4">
                    {loading && medicines.length === 0 && <p className="text-center text-gray-500">กำลังโหลดรายการยา...</p>}
                    {error && <p className="text-center text-red-500">{error}</p>}
                    
                    {!loading && !error && (
                        medicines.length === 0 ? (
                            <p className="text-center text-gray-500 mt-8">ยังไม่มีรายการยาสำหรับผู้สูงอายุท่านนี้</p>
                        ) : (
                            medicines.map((med) => {
                                const imageUrl = med.image_url
                                    ? `${BACKEND_URL}${med.image_url}`
                                    : 'https://via.placeholder.com/150?text=No+Image';

                                return (
                                    <div key={med.id} className="relative bg-white p-4 rounded-lg shadow-md flex space-x-4 items-center">
                                        
                                        {/* ป้ายสถานะ (Status Badge) */}
                                        <div className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-xs font-semibold text-white ${
                                            med.is_taken_today ? 'bg-green-500' : 'bg-red-500'
                                        }`}>
                                            {med.is_taken_today ? 'กินแล้ว' : 'ยังไม่กิน'}
                                        </div>

                                        <img 
                                            src={imageUrl} 
                                            alt={med.name}
                                            className="w-24 h-24 object-contain rounded-md bg-gray-100 border"
                                            onError={(e) => { e.target.onerror = null; e.target.src='https://via.placeholder.com/150?text=Error'; }}
                                        />

                                        <div className="flex-1 flex flex-col justify-between self-stretch">
                                            <div>
                                                <p className="text-lg font-bold text-gray-800 pr-16">{med.name}</p>
                                                <p className="text-sm text-gray-600">เวลา: {med.time_to_take}</p>
                                                <p className="text-sm text-gray-600">ปริมาณ: {med.dosage || '-'}</p>
                                                <p className="text-sm text-gray-600">คำแนะนำ: {med.meal_instruction || '-'}</p>
                                            </div>
                                            <div className="flex justify-end mt-2">
                                                <button 
                                                    onClick={() => handleDelete(med.id, med.name)}
                                                    className="bg-gray-200 text-gray-700 px-3 py-1 rounded-md text-xs font-semibold hover:bg-gray-300"
                                                >
                                                    ลบ
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )
                    )}
                </div>
            </main>

            <footer className="p-4 bg-white border-t">
                <button 
                    onClick={() => navigate(`/caregiver/elder/${elderId}/${encodeURIComponent(elderName)}/medicines/add`)}
                    className="w-full bg-green-600 text-white py-3 rounded-md text-lg font-semibold hover:bg-green-700"
                >
                    + เพิ่มยา
                </button>
            </footer>
        </div>
    );
}

export default MedicineListPage;