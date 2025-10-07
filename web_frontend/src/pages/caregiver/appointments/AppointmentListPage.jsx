// src/pages/caregiver/appointments/AppointmentListPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../../../api/apiClient';
import { FaArrowLeft } from 'react-icons/fa';

function AppointmentListPage() {
    const { elderId, elderName } = useParams();
    const navigate = useNavigate();
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchAppointments = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const response = await apiClient.get(`/appointments/elder/${elderId}`);
            setAppointments(response.data.appointments || []);
        } catch (err) {
            console.error("Failed to fetch appointments", err);
            setError('ไม่สามารถโหลดข้อมูลนัดหมายได้');
        } finally {
            setLoading(false);
        }
    }, [elderId]);

    useEffect(() => {
        fetchAppointments();
    }, [fetchAppointments]);

    const handleDelete = async (appId, appTitle) => {
        if (window.confirm(`คุณต้องการลบนัดหมาย "${appTitle}" ใช่หรือไม่?`)) {
            try {
                await apiClient.delete(`/appointments/delete/${appId}`);
                alert('ลบนัดหมายสำเร็จ');
                fetchAppointments(); // โหลดข้อมูลใหม่
            } catch (error) {
                alert('ไม่สามารถลบนัดหมายได้');
            }
        }
    };

    const handleUpdateStatus = async (appId, newStatus) => {
        try {
            await apiClient.post(`/appointments/update_status/${appId}`, { status: newStatus });
            
            // อัปเดตสถานะใน UI ทันทีเพื่อประสบการณ์ที่ดีขึ้น
            setAppointments(prevApps =>
                prevApps.map(app => 
                    app.id === appId ? { ...app, status: newStatus } : app
                )
            );
            alert('อัปเดตสถานะเรียบร้อย');
        } catch (error) {
            alert('ไม่สามารถอัปเดตสถานะได้');
        }
    };
    
    return (
        <div className="flex flex-col h-screen bg-gray-100">
            <header className="bg-green-500 text-white p-4 shadow-md flex items-center sticky top-0 z-10">
                <button 
                    onClick={() => navigate(`/caregiver/elder/${elderId}/${encodeURIComponent(elderName)}`)} 
                    className="mr-4 p-2 rounded-full hover:bg-green-600"
                >
                    <FaArrowLeft size={20} />
                </button>
                <h1 className="text-xl font-bold">นัดหมาย: {decodeURIComponent(elderName)}</h1>
            </header>

            <main className="flex-1 p-4 overflow-y-auto">
                <div className="space-y-4">
                    {loading && <p className="text-center">กำลังโหลด...</p>}
                    {error && <p className="text-center text-red-500">{error}</p>}
                    
                    {!loading && !error && (
                        appointments.length === 0 ? (
                            <p className="text-center text-gray-500">ยังไม่มีรายการนัดหมาย</p>
                        ) : (
                            appointments.map((app) => (
                                <div key={app.id} className="bg-white p-4 rounded-lg shadow-md">
                                    <div className="flex justify-between items-start mb-2">
                                        <p className="text-lg font-bold">{app.title}</p>
                                        <span className={`text-sm font-semibold px-2 py-1 rounded-full text-white ${
                                            app.status === 'confirmed' ? 'bg-green-500' : 'bg-red-500'
                                        }`}>
                                            {app.status === 'confirmed' ? 'ไปแล้ว' : 'ยังไม่ไป'}
                                        </span>
                                    </div>
                                    <div className="text-sm text-gray-700 space-y-1">
                                        <p><strong>วันที่:</strong> {app.datetime.split(' ')[0]}</p>
                                        <p><strong>เวลา:</strong> {app.datetime.split(' ')[1]} น.</p>
                                        <p><strong>สถานที่:</strong> {app.location}</p>
                                        <p><strong>แพทย์:</strong> {app.doctor || 'ไม่ได้ระบุ'}</p>
                                    </div>
                                    
                                    {/* แสดงปุ่มก็ต่อเมื่อสถานะยังเป็น 'pending' (ยังไม่ไป) */}
                                    {app.status === 'pending' && (
                                        <div className="flex justify-end space-x-2 mt-4 border-t pt-3">
                                            <button 
                                                onClick={() => handleUpdateStatus(app.id, 'confirmed')}
                                                className="bg-green-600 text-white px-3 py-1.5 rounded-md text-sm font-semibold hover:bg-green-700">
                                                ยืนยันไปพบแพทย์
                                            </button>
                                            <button 
                                                onClick={() => navigate(`/caregiver/elder/${elderId}/${encodeURIComponent(elderName)}/appointments/${app.id}/edit`)}
                                                className="bg-yellow-500 text-white px-3 py-1.5 rounded-md text-sm font-semibold hover:bg-yellow-600">
                                                แก้ไข
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(app.id, app.title)} 
                                                className="bg-red-500 text-white px-3 py-1.5 rounded-md text-sm font-semibold hover:bg-red-600">
                                                ลบ
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))
                        )
                    )}
                </div>
            </main>

            <footer className="p-4 bg-white border-t">
                <button 
                    onClick={() => navigate(`/caregiver/elder/${elderId}/${encodeURIComponent(elderName)}/appointments/add`)}
                    className="w-full bg-blue-600 text-white py-3 rounded-md text-lg font-semibold hover:bg-blue-700">
                    + เพิ่มนัดหมายใหม่
                </button>
            </footer>
        </div>
    );
}

export default AppointmentListPage;