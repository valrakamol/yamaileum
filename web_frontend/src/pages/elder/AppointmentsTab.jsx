// src/pages/elder/AppointmentsTab.jsx
import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '../../api/apiClient';
import { FaCalendarAlt, FaClock, FaHospital, FaUserMd } from 'react-icons/fa';

function AppointmentsTab() {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchAppointments = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            // ใช้ Endpoint สำหรับดึงนัดหมายของตัวเอง
            const response = await apiClient.get('/appointments/my_appointments');
            setAppointments(response.data.appointments || []);
        } catch (err) {
            console.error("Failed to fetch appointments:", err);
            setError('ไม่สามารถโหลดข้อมูลนัดหมายได้');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAppointments();
    }, [fetchAppointments]);

    const InfoRow = ({ icon, text }) => (
        <div className="flex items-center space-x-3 text-gray-600">
            {icon}
            <span>{text}</span>
        </div>
    );

    return (
        <div className="p-4 space-y-4">
            <h2 className="text-xl font-bold text-center text-gray-800 mb-4">รายการนัดหมายแพทย์</h2>
            {loading && <p className="text-center">กำลังโหลด...</p>}
            {error && <p className="text-center text-red-500">{error}</p>}

            {!loading && !error && (
                appointments.length === 0 ? (
                    <p className="text-center text-gray-500">ไม่มีนัดหมายเร็วๆ นี้</p>
                ) : (
                    appointments.map((app) => (
                        <div key={app.id} className="bg-white p-5 rounded-lg shadow-md space-y-3">
                            <h3 className="text-lg font-bold text-gray-900">{app.title}</h3>
                            <div className="border-t pt-3 space-y-2 text-sm">
                                <InfoRow icon={<FaCalendarAlt />} text={`วันที่: ${app.datetime.split(' ')[0]}`} />
                                <InfoRow icon={<FaClock />} text={`เวลา: ${app.datetime.split(' ')[1]} น.`} />
                                <InfoRow icon={<FaHospital />} text={`สถานที่: ${app.location}`} />
                                <InfoRow icon={<FaUserMd />} text={`แพทย์: ${app.doctor || 'ไม่ได้ระบุ'}`} />
                            </div>
                        </div>
                    ))
                )
            )}
        </div>
    );
}

export default AppointmentsTab;