// src/pages/caregiver/appointments/AddAppointmentPage.jsx
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../../../api/apiClient';
import { FaArrowLeft } from 'react-icons/fa';

function AddAppointmentPage() {
    const { elderId, elderName } = useParams();
    const navigate = useNavigate();
    
    const [title, setTitle] = useState('');
    const [doctorName, setDoctorName] = useState('');
    const [location, setLocation] = useState('');
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [notes, setNotes] = useState('');
    const [message, setMessage] = useState('');
    const [isError, setIsError] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setIsError(false);

        if (!title || !location || !date || !time) {
            setMessage('กรุณากรอกข้อมูลที่จำเป็นให้ครบ');
            setIsError(true);
            return;
        }

        const payload = {
            elder_id: elderId,
            title,
            doctor_name: doctorName,
            location,
            appointment_datetime: `${date} ${time}`,
            notes,
        };

        try {
            await apiClient.post('/appointments/add', payload);
            alert('เพิ่มนัดหมายสำเร็จ!');
            navigate(`/caregiver/elder/${elderId}/${encodeURIComponent(elderName)}/appointments`);
        } catch (error) {
            setMessage(error.response?.data?.msg || 'เกิดข้อผิดพลาด');
            setIsError(true);
        }
    };
    
    return (
        <div className="flex flex-col h-screen bg-gray-100">
            <header className="bg-green-500 text-white p-4 shadow-md flex items-center">
                <button onClick={() => navigate(-1)} className="mr-4 p-2 rounded-full hover:bg-green-600">
                    <FaArrowLeft size={20} />
                </button>
                <h1 className="text-xl font-bold">เพิ่มนัดหมาย</h1>
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

                    <button type="submit" className="w-full bg-blue-500 text-white p-3 rounded-md">บันทึก</button>
                </form>
            </main>
        </div>
    );
}

export default AddAppointmentPage;