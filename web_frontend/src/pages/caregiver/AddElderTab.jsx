// src/pages/caregiver/AddElderTab.jsx
import React, { useState } from 'react';
import apiClient from '../../api/apiClient';

function AddElderTab() {
    // State สำหรับเก็บข้อมูลในฟอร์ม
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [password, setPassword] = useState('');
    
    // State ใหม่สำหรับจัดการไฟล์รูปภาพ
    const [avatarFile, setAvatarFile] = useState(null);
    const [preview, setPreview] = useState(null);
    
    // State สำหรับแสดงข้อความสถานะ
    const [message, setMessage] = useState('');
    const [isError, setIsError] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // เก็บไฟล์ดิบไว้สำหรับอัปโหลด
            setAvatarFile(file);
            // สร้าง URL ชั่วคราวสำหรับแสดงรูปภาพ Preview
            setPreview(URL.createObjectURL(file));
        }
    };

    const resetForm = () => {
        setUsername('');
        setEmail('');
        setFirstName('');
        setLastName('');
        setPassword('');
        setAvatarFile(null);
        setPreview(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setIsError(false);
        setIsLoading(true); // เริ่ม Loading

        let uploadedAvatarUrl = null;

        try {
            // 1. ถ้ามีการเลือกไฟล์รูปภาพ ให้ทำการอัปโหลดก่อน
            if (avatarFile) {
                const formData = new FormData();
                formData.append('file', avatarFile);
                
                const uploadResponse = await apiClient.post('/users/upload_avatar', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
                uploadedAvatarUrl = uploadResponse.data.avatar_url;
            }

            // 2. ส่งข้อมูลทั้งหมด (รวม URL รูปภาพ ถ้ามี) ไปยัง Endpoint เพื่อสร้างผู้สูงอายุ
            await apiClient.post('/users/add_elder', {
                username,
                email,
                first_name: firstName,
                last_name: lastName,
                password,
                avatar_url: uploadedAvatarUrl, // ส่ง URL ที่ได้จากการอัปโหลด
            });

            setMessage('เพิ่มผู้สูงอายุสำเร็จ!');
            resetForm(); // เคลียร์ฟอร์มเมื่อสำเร็จ

        } catch (err) {
            setMessage(err.response?.data?.msg || 'เกิดข้อผิดพลาดในการเพิ่มผู้สูงอายุ');
            setIsError(true);
        } finally {
            setIsLoading(false); // สิ้นสุด Loading
        }
    };

    return (
        <div className="p-4">
            <h2 className="text-xl font-bold mb-4">เพิ่มผู้สูงอายุใหม่</h2>
            <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow-md">
                
                {/* --- ส่วนแสดงข้อความสถานะ --- */}
                {message && (
                    <p className={`text-center p-2 rounded-md ${isError ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                        {message}
                    </p>
                )}
                
                {/* --- ส่วนอัปโหลดรูปภาพ --- */}
                <div className="flex flex-col items-center space-y-3">
                    <label className="font-medium text-gray-700">รูปโปรไฟล์ (ถ้ามี)</label>
                    {preview ? (
                        <img src={preview} alt="Avatar Preview" className="w-28 h-28 rounded-full object-cover border-4 border-gray-200" />
                    ) : (
                        <div className="w-28 h-28 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                            <span className="text-4xl">+</span>
                        </div>
                    )}
                    <input 
                        type="file" 
                        onChange={handleFileChange} 
                        accept="image/png, image/jpeg, image/gif" 
                        className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100" 
                    />
                </div>
                
                {/* --- ส่วนกรอกข้อมูล --- */}
                 <div>
                    <label className="block text-sm font-medium text-gray-700">ชื่อผู้ใช้ (ภาษาอังกฤษ)</label>
                    <input type="text" value={username} onChange={e => setUsername(e.target.value)} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">อีเมล</label>
                    <input 
                        type="email" 
                        value={email} 
                        onChange={e => setEmail(e.target.value)} 
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 ..."
                    />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700">ชื่อจริง</label>
                    <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500" />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700">นามสกุล</label>
                    <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500" />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700">รหัสผ่านเริ่มต้น</label>
                    <input type="password" value={password} onChange={e => setPassword(e.target.value)} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500" />
                </div>

                <button 
                    type="submit" 
                    disabled={isLoading} // ปิดปุ่มตอนกำลังโหลด
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-400"
                >
                    {isLoading ? 'กำลังบันทึก...' : 'ยืนยันการเพิ่ม'}
                </button>
            </form>
        </div>
    );
}

export default AddElderTab;