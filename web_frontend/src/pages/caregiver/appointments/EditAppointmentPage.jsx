// src/pages/caregiver/appointments/EditAppointmentPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../../../api/apiClient';
import { FaArrowLeft } from 'react-icons/fa';

function EditAppointmentPage() {
    // ดึง Parameter จาก URL
    const { elderId, elderName, appointmentId } = useParams();
    const navigate = useNavigate();
    
    // State สำหรับเก็บข้อมูลในฟอร์ม
    const [title, setTitle] = useState('');
    const [doctorName, setDoctorName] = useState('');
    const [location, setLocation] = useState('');
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [notes, setNotes] = useState('');
    
    // State สำหรับข้อความสถานะ
    const [message, setMessage] = useState('');
    const [isError, setIsError] = useState(false);
    const [loading, setLoading] = useState(true);

    // --- 1. ดึงข้อมูลนัดหมายเดิมเมื่อ Component โหลด ---
    useEffect(() => {
        const fetchAppointmentDetails = async () => {
            setLoading(true);
            try {
                // สมมติว่าเรามี Endpoint นี้ (ต้องไปสร้างเพิ่มใน Backend)
                const response = await apiClient.get(`/appointments/details/${appointmentId}`);
                const appData = response.data;
                
                // เติมข้อมูลลงใน State ของฟอร์ม
                setTitle(appData.title || '');
                setDoctorName(appData.doctor_name || '');
                setLocation(appData.location || '');
                setNotes(appData.notes || '');
                
                // แยก datetime string เป็น date และ time
                if (appData.datetime) {
                    const [datePart, timePart] = appData.datetime.split(' ');
                    setDate(datePart || '');
                    setTime(timePart || '');
                }
            } catch (error) {
                console.error("Failed to fetch appointment details", error);
                setMessage('ไม่สามารถโหลดข้อมูลนัดหมายได้');
                setIsError(true);
            } finally {
                setLoading(false);
            }
        };

        fetchAppointmentDetails();
    }, [appointmentId]); // ให้ทำงานใหม่เมื่อ appointmentId เปลี่ยน

    // --- 2. ฟังก์ชันสำหรับบันทึกการแก้ไข ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setIsError(false);

        const payload = {
            title,
            doctor_name: doctorName,
            location,
            appointment_datetime: `${date} ${time}`,
            notes,
        };

        try {
            // เรียกใช้ Endpoint /update ที่เราสร้างไว้แล้ว
            await apiClient.post(`/appointments/update/${appointmentId}`, payload);
            alert('แก้ไขนัดหมายสำเร็จ!');
            // กลับไปหน้ารายการนัดหมาย
            navigate(`/caregiver/elder/${elderId}/${encodeURIComponent(elderName)}/appointments`);
        } catch (error) {
            setMessage(error.response?.data?.msg || 'เกิดข้อผิดพลาด');
            setIsError(true);
        }
    };
    
    if (loading) {
        return <div className="p-4 text-center">กำลังโหลดข้อมูล...</div>;
    }

    return (
        <div className="flex flex-col h-screen bg-gray-100">
            <header className="bg-green-500 text-white p-4 shadow-md flex items-center">
                <button onClick={() => navigate(-1)} className="mr-4 p-2 rounded-full hover:bg-green-600">
                    <FaArrowLeft size={20} />
                </button>
                <h1 className="text-xl font-bold">แก้ไขนัดหมาย</h1>
            </header>
            <main className="flex-1 p-4 overflow-y-auto">
                <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-lg shadow-md">
                    {message && <p className={isError ? 'text-red-500' : 'text-green-500'}>{message}</p>}
                    
                    <div>
                        <label>หัวข้อการนัด</label>
                        <input type="text" value={title} onChange={e => setTitle(e.target.value)} required className="w-full mt-1 p-2 border rounded-md"/>
                    </div>
                    <div>
                        <label>สถานที่</label>
                        <input type="text" value={location} onChange={e => setLocation(e.target.value)} required className="w-full mt-1 p-2 border rounded-md"/>
                    </div>
                     <div className="flex space-x-2">
                        <div className="flex-1">
                            <label>วันที่นัด</label>
                            <input type="date" value={date} onChange={e => setDate(e.target.value)} required className="w-full mt-1 p-2 border rounded-md"/>
                        </div>
                        <div className="flex-1">
                            <label>เวลา</label>
                            <input type="time" value={time} onChange={e => setTime(e.target.value)} required className="w-full mt-1 p-2 border rounded-md"/>
                        </div>
                    </div>
                    <div>
                        <label>ชื่อแพทย์</label>
                        <input type="text" value={doctorName} onChange={e => setDoctorName(e.target.value)} className="w-full mt-1 p-2 border rounded-md"/>
                    </div>
                    <div>
                        <label>หมายเหตุ</label>
                        <textarea value={notes} onChange={e => setNotes(e.target.value)} rows="3" className="w-full mt-1 p-2 border rounded-md"></textarea>
                    </div>

                    <button type="submit" className="w-full bg-blue-500 text-white p-3 rounded-md">บันทึกการแก้ไข</button>
                </form>
            </main>
        </div>
    );
}

export default EditAppointmentPage;