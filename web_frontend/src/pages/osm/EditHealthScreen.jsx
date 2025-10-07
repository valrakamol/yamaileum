// src/pages/osm/EditHealthScreen.jsx
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../../api/apiClient';
import { FaArrowLeft } from 'react-icons/fa';

function EditHealthScreen() {
    const { elderId, elderName } = useParams();
    const navigate = useNavigate();
    
    // State สำหรับเก็บข้อมูลในฟอร์ม
    const [systolic, setSystolic] = useState('');
    const [diastolic, setDiastolic] = useState('');
    const [weight, setWeight] = useState('');
    const [pulse, setPulse] = useState('');
    const [notes, setNotes] = useState('');
    
    // State สำหรับข้อความสถานะ
    const [message, setMessage] = useState('');
    const [isError, setIsError] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setIsError(false);
        setIsLoading(true);

        // ตรวจสอบว่ามีการกรอกข้อมูลมาอย่างน้อย 1 อย่าง
        if (!systolic && !diastolic && !weight && !pulse && !notes) {
            setMessage('กรุณากรอกข้อมูลสุขภาพอย่างน้อย 1 อย่าง');
            setIsError(true);
            setIsLoading(false);
            return;
        }

        const payload = {
            elder_id: elderId,
            systolic_bp: systolic ? parseInt(systolic) : null,
            diastolic_bp: diastolic ? parseInt(diastolic) : null,
            weight: weight ? parseFloat(weight) : null,
            pulse: pulse ? parseInt(pulse) : null,
            notes: notes,
        };

        try {
            await apiClient.post('/health/record/add', payload);
            alert('บันทึกข้อมูลสุขภาพสำเร็จ!');
            // กลับไปหน้า Detail ของผู้สูงอายุ
            navigate(`/osm/elder/${elderId}/${encodeURIComponent(elderName)}`);
        } catch (error) {
            setMessage(error.response?.data?.msg || 'เกิดข้อผิดพลาดในการบันทึก');
            setIsError(true);
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div className="flex flex-col h-screen bg-gray-100">
            <header className="bg-blue-500 text-white p-4 shadow-md flex items-center">
                <button 
                    onClick={() => navigate(-1)} 
                    className="mr-4 p-2 rounded-full hover:bg-blue-600"
                >
                    <FaArrowLeft size={20} />
                </button>
                <h1 className="text-xl font-bold">บันทึกสุขภาพ: {decodeURIComponent(elderName)}</h1>
            </header>
            <main className="flex-1 p-4 overflow-y-auto">
                <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-lg shadow-md">
                    {message && <p className={`text-center p-2 rounded ${isError ? 'text-red-100 text-red-700' : 'text-green-100 text-green-700'}`}>{message}</p>}
                    
                    {/* Blood Pressure */}
                    <div className="flex space-x-4">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700">ความดัน (ตัวบน)</label>
                            <input 
                                type="number" 
                                value={systolic} 
                                onChange={e => setSystolic(e.target.value)} 
                                placeholder="เช่น 120"
                                className="w-full mt-1 p-2 border rounded-md"
                            />
                        </div>
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700">ความดัน (ตัวล่าง)</label>
                            <input 
                                type="number" 
                                value={diastolic} 
                                onChange={e => setDiastolic(e.target.value)} 
                                placeholder="เช่น 80"
                                className="w-full mt-1 p-2 border rounded-md"
                            />
                        </div>
                    </div>

                    {/* Weight & Pulse */}
                    <div className="flex space-x-4">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700">น้ำหนัก (กก.)</label>
                            <input 
                                type="number" 
                                step="0.1" // อนุญาตให้กรอกทศนิยม
                                value={weight} 
                                onChange={e => setWeight(e.target.value)} 
                                placeholder="เช่น 65.5"
                                className="w-full mt-1 p-2 border rounded-md"
                            />
                        </div>
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700">ชีพจร (ครั้ง/นาที)</label>
                            <input 
                                type="number" 
                                value={pulse} 
                                onChange={e => setPulse(e.target.value)} 
                                placeholder="เช่น 72"
                                className="w-full mt-1 p-2 border rounded-md"
                            />
                        </div>
                    </div>
                    
                    {/* Notes */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">หมายเหตุเพิ่มเติม</label>
                        <textarea 
                            value={notes} 
                            onChange={e => setNotes(e.target.value)} 
                            rows="4"
                            className="w-full mt-1 p-2 border rounded-md"
                        ></textarea>
                    </div>

                    <button 
                        type="submit" 
                        disabled={isLoading}
                        className="w-full bg-green-600 text-white p-3 rounded-md font-semibold hover:bg-green-700 disabled:bg-gray-400"
                    >
                        {isLoading ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
                    </button>
                </form>
            </main>
        </div>
    );
}

export default EditHealthScreen;