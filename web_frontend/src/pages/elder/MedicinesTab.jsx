// src/pages/elder/MedicinesTab.jsx
import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '../../api/apiClient';

function MedicinesTab() {
    const [medicines, setMedicines] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [currentTime, setCurrentTime] = useState(new Date()); // State สำหรับเก็บเวลาปัจจุบัน

    // อัปเดตเวลาปัจจุบันทุกๆ 1 นาที เพื่อให้ปุ่มเปิด/ปิดการใช้งานอัตโนมัติ
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 60000); // 60000 ms = 1 minute
        return () => clearInterval(timer); // Clear interval on component unmount
    }, []);

    const fetchMyMedicines = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const response = await apiClient.get('/medicines/my_medications');
            setMedicines(response.data.medications || []);
        } catch (err) {
            console.error("Failed to fetch medicines", err);
            setError('ไม่สามารถโหลดรายการยาได้');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchMyMedicines();
    }, [fetchMyMedicines]);
    
    const handleConfirmTake = async (medId) => {
        try {
            await apiClient.post('/medicines/log/take', { medication_id: medId });
            setMedicines(prevMeds => 
                prevMeds.map(med => 
                    med.id === medId ? { ...med, is_taken_today: true } : med
                )
            );
        } catch (error) {
            alert('ไม่สามารถบันทึกการกินยาได้');
        }
    };

    if (loading) return <p className="text-center p-4">กำลังโหลด...</p>;
    if (error) return <p className="text-center p-4 text-red-500">{error}</p>;

    return (
        <div className="p-4 space-y-4">
            <h2 className="text-lg font-semibold text-center mb-2">รายการยาสำหรับวันนี้</h2>
            {medicines.length === 0 ? (
                <p className="text-center text-gray-500">วันนี้ไม่มีรายการยา</p>
            ) : (
                medicines.map((med) => {
                    const imageUrl = med.image_url
                        ? `${apiClient.defaults.baseURL.replace('/api', '')}${med.image_url}`
                        : 'https://via.placeholder.com/150?text=No+Image';

                    // --- *** 1. Logic การตรวจสอบเวลา *** ---
                    const [hour, minute] = med.time_to_take.split(':').map(Number);
                    const medTimeToday = new Date();
                    medTimeToday.setHours(hour, minute, 0, 0);

                    // ปุ่มจะกดได้ก็ต่อเมื่อ "เวลาปัจจุบัน" >= "เวลาทานยา"
                    const isButtonEnabled = currentTime >= medTimeToday;

                    return (
                        <div key={med.id} className={`p-4 rounded-lg shadow-md ${med.is_taken_today ? 'bg-green-50' : 'bg-white'}`}>
                            <div className="flex space-x-4">
                                <img 
                                    src={imageUrl} 
                                    alt={med.name}
                                    className="w-20 h-20 object-contain rounded-md bg-gray-100"
                                />
                                <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                        <p className="text-lg font-bold">{med.name}</p>
                                        <span className={`text-sm font-semibold ${med.is_taken_today ? 'text-green-600' : 'text-red-500'}`}>
                                            {med.is_taken_today ? 'กินแล้ว' : 'ยังไม่กิน'}
                                        </span>
                                    </div>
                                    <div className="text-sm text-gray-600 space-y-1 mt-1">
                                        <p><strong>เวลา:</strong> {med.time_to_take}</p>
                                        <p><strong>ปริมาณ:</strong> {med.dosage || '-'}</p>
                                        <p><strong>คำแนะนำ:</strong> {med.meal_instruction || '-'}</p>
                                    </div>
                                </div>
                            </div>
                            
                            {/* --- *** 2. Logic การแสดงผลปุ่ม *** --- */}
                            {/* แสดงปุ่มก็ต่อเมื่อ "ยังไม่ได้กินยา" */}
                            {!med.is_taken_today && (
                                <div className="mt-4">
                                    <button
                                        onClick={() => handleConfirmTake(med.id)}
                                        // ปิดการใช้งานปุ่ม ถ้ายังไม่ถึงเวลา
                                        disabled={!isButtonEnabled} 
                                        className={`w-full text-white py-2 rounded-md font-semibold transition-colors ${
                                            isButtonEnabled 
                                            ? 'bg-blue-500 hover:bg-blue-600' // สีปกติ
                                            : 'bg-gray-400 cursor-not-allowed' // สีตอนปิดใช้งาน
                                        }`}
                                    >
                                        {isButtonEnabled ? 'ยืนยันว่ากินยาแล้ว' : `สามารถกดยืนยันได้หลัง ${med.time_to_take} น.`}
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })
            )}
        </div>
    );
}

export default MedicinesTab;