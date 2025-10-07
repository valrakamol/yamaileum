// src/pages/caregiver/medicines/AddMedicinePage.jsx
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../../../api/apiClient';
import { FaArrowLeft } from 'react-icons/fa';

function AddMedicinePage() {
    const { elderId, elderName } = useParams();
    const navigate = useNavigate();
    
    // States for form fields
    const [medName, setMedName] = useState('');
    const [dosage, setDosage] = useState('');
    const [unit, setUnit] = useState('เม็ด'); // Default unit
    const [instruction, setInstruction] = useState('หลังอาหาร'); // Default instruction
    const [times, setTimes] = useState({ morning: false, noon: false, evening: false, bedtime: false });
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState('');

    // States for image upload
    const [medImageFile, setMedImageFile] = useState(null);
    const [preview, setPreview] = useState(null);

    const [message, setMessage] = useState('');
    const [isError, setIsError] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setMedImageFile(file);
            setPreview(URL.createObjectURL(file));
        }
    };

    const handleTimeChange = (time) => {
        setTimes(prev => ({ ...prev, [time]: !prev[time] }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setIsError(false);
        setIsLoading(true);
        let uploadedImageUrl = null;

        try {
            // 1. Upload image first (if selected)
            if (medImageFile) {
                const formData = new FormData();
                formData.append('file', medImageFile);
                const uploadResponse = await apiClient.post('/medicines/upload_image', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
                uploadedImageUrl = uploadResponse.data.image_url;
            }

            const selectedTimes = Object.keys(times).filter(t => times[t]).map(t => {
                if (t === 'morning') return '08:00';
                if (t === 'noon') return '12:00';
                if (t === 'evening') return '18:00';
                if (t === 'bedtime') return '21:00';
                return null;
            }).filter(Boolean);

            if (!medName || selectedTimes.length === 0) {
                throw new Error('กรุณากรอกชื่อยาและเลือกเวลาอย่างน้อย 1 เวลา');
            }

            const payload = {
                elder_id: elderId,
                name: medName,
                dosage: `${dosage} ${unit}`.trim(),
                meal_instruction: instruction,
                times_to_take: selectedTimes,
                start_date: startDate,
                end_date: endDate || null,
                image_url: uploadedImageUrl,
            };

            await apiClient.post('/medicines/add', payload);
            alert('เพิ่มยาสำเร็จ!');
            navigate(`/caregiver/elder/${elderId}/${encodeURIComponent(elderName)}/medicines`);

        } catch (error) {
            setMessage(error.response?.data?.msg || error.message || 'เกิดข้อผิดพลาด');
            setIsError(true);
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div className="flex flex-col min-h-screen bg-gray-100">
            <header className="bg-green-500 text-white p-4 shadow-md flex items-center">
                <button onClick={() => navigate(-1)} className="mr-4 p-2 rounded-full hover:bg-green-600">
                    <FaArrowLeft size={20} />
                </button>
                <h1 className="text-xl font-bold">เพิ่มยาสำหรับ {decodeURIComponent(elderName)}</h1>
            </header>
            <main className="flex-1 p-4 overflow-y-auto">
                <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow-md">
                    {message && <p className={`text-center p-2 rounded ${isError ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{message}</p>}
                    
                    {/* Image Upload */}
                    <div className="flex flex-col items-center space-y-2">
                        <label className="font-medium">รูปยา (ถ้ามี)</label>
                        {preview ? (
                            <img src={preview} alt="Preview" className="w-32 h-32 object-contain rounded-md border"/>
                        ) : (
                            <div className="w-32 h-32 bg-gray-200 rounded-md flex items-center justify-center text-gray-400">รูปภาพ</div>
                        )}
                        <input type="file" onChange={handleFileChange} accept="image/*" className="text-sm"/>
                    </div>

                    {/* Medicine Name */}
                    <div>
                        <label className="font-medium">ชื่อยา*</label>
                        <input type="text" value={medName} onChange={e => setMedName(e.target.value)} required className="w-full mt-1 p-2 border rounded-md"/>
                    </div>

                    {/* Dosage */}
                    <div className="flex space-x-2">
                        <div className="flex-1">
                            <label className="font-medium">ปริมาณ</label>
                            <input type="text" value={dosage} onChange={e => setDosage(e.target.value)} className="w-full mt-1 p-2 border rounded-md"/>
                        </div>
                        <div className="flex-1">
                            <label className="font-medium">หน่วย</label>
                            <select value={unit} onChange={e => setUnit(e.target.value)} className="w-full mt-1 p-2 border rounded-md bg-white">
                                <option>เม็ด</option>
                                <option>ช้อนชา</option>
                                <option>ช้อนโต๊ะ</option>
                                <option>cc</option>
                            </select>
                        </div>
                    </div>

                    {/* Meal Instruction */}
                    <div>
                        <label className="font-medium">คำแนะนำ</label>
                        <select value={instruction} onChange={e => setInstruction(e.target.value)} className="w-full mt-1 p-2 border rounded-md bg-white">
                            <option>หลังอาหาร</option>
                            <option>ก่อนอาหาร</option>
                            <option>พร้อมอาหาร</option>
                            <option>ก่อนนอน</option>
                        </select>
                    </div>
                    
                    {/* Time selection checkboxes */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">เลือกเวลา (เลือกได้หลายข้อ)</label>
                        <div className="grid grid-cols-2 gap-4 mt-2">
                            {/* เราจะ Hardcode รายการ Checkbox เพื่อให้แสดงผลภาษาไทยได้ */}
                            <label className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-100 cursor-pointer">
                                <input type="checkbox" checked={times.morning} onChange={() => handleTimeChange('morning')} className="h-5 w-5 rounded"/>
                                <span>08:00 (เช้า)</span>
                            </label>
                            <label className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-100 cursor-pointer">
                                <input type="checkbox" checked={times.noon} onChange={() => handleTimeChange('noon')} className="h-5 w-5 rounded"/>
                                <span>12:00 (กลางวัน)</span>
                            </label>
                            <label className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-100 cursor-pointer">
                                <input type="checkbox" checked={times.evening} onChange={() => handleTimeChange('evening')} className="h-5 w-5 rounded"/>
                                <span>18:00 (เย็น)</span>
                            </label>
                            <label className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-100 cursor-pointer">
                                <input type="checkbox" checked={times.bedtime} onChange={() => handleTimeChange('bedtime')} className="h-5 w-5 rounded"/>
                                <span>21:00 (ก่อนนอน)</span>
                            </label>
                        </div>
                    </div>

                    <div className="flex space-x-2">
                        <div className="flex-1">
                            <label>วันที่เริ่ม</label>
                            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full mt-1 p-2 border rounded-md"/>
                        </div>
                        <div className="flex-1">
                            <label>วันที่สิ้นสุด (ถ้ามี)</label>
                            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full mt-1 p-2 border rounded-md"/>
                        </div>
                    </div>

                    <button type="submit" disabled={isLoading} className="w-full bg-blue-600 text-white p-3 rounded-md font-semibold hover:bg-blue-700 disabled:bg-gray-400">
                        {isLoading ? 'กำลังบันทึก...' : 'บันทึกยา'}
                    </button>
                </form>
            </main>
        </div>
    );
}

export default AddMedicinePage;