// src/pages/auth/RegisterPage.jsx
import React, { useState } from 'react';
import apiClient from '../../api/apiClient';
import { useNavigate, Link } from 'react-router-dom';

function RegisterPage() {
    // State สำหรับเก็บข้อมูลในฟอร์ม
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState(''); // <-- State สำหรับอีเมล
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('caregiver');
    
    // State สำหรับจัดการไฟล์รูปภาพ
    const [avatarFile, setAvatarFile] = useState(null);
    const [preview, setPreview] = useState(null);

    // State สำหรับแสดงข้อความสถานะและสถานะการโหลด
    const [message, setMessage] = useState('');
    const [isError, setIsError] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    
    const navigate = useNavigate();

    // ฟังก์ชันนี้จะทำงานเมื่อผู้ใช้เลือกไฟล์
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setAvatarFile(file);
            setPreview(URL.createObjectURL(file));
        }
    };

    // ฟังก์ชันนี้จะทำงานเมื่อผู้ใช้กดปุ่ม "สมัครสมาชิก"
    const handleRegister = async (e) => {
        e.preventDefault();
        setMessage('');
        setIsError(false);
        setIsLoading(true);

        let uploadedAvatarUrl = null;

        try {
            // 1. อัปโหลดรูปภาพก่อน (ถ้ามี)
            if (avatarFile) {
                const formData = new FormData();
                formData.append('file', avatarFile);

                const uploadResponse = await apiClient.post('/users/upload_public_avatar', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
                uploadedAvatarUrl = uploadResponse.data.avatar_url;
            }

            // 2. ส่งข้อมูลทั้งหมดไปสมัครสมาชิก
            const response = await apiClient.post('/auth/register', {
                username: username,
                email: email, // <-- ส่งอีเมลไปด้วย
                first_name: firstName,
                last_name: lastName,
                password: password,
                role: role,
                avatar_url: uploadedAvatarUrl,
            });

            if (response.status === 201) {
                setMessage(response.data.msg || 'ลงทะเบียนสำเร็จ!');
                setTimeout(() => navigate('/login'), 3000);
            }
        } catch (err) {
            setMessage(err.response?.data?.msg || 'การลงทะเบียนล้มเหลว');
            setIsError(true);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 py-12 px-4">
            <div className="p-8 bg-white rounded-lg shadow-md w-full max-w-md">
                <h2 className="text-2xl font-bold text-center mb-6">สมัครสมาชิก</h2>
                
                <form onSubmit={handleRegister} className="space-y-4">
                    
                    {message && (
                        <p className={`text-sm text-center p-3 rounded-md ${isError ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                            {message}
                        </p>
                    )}
                    
                    <div className="flex flex-col items-center space-y-2">
                        <label className="font-medium text-gray-700">รูปโปรไฟล์ (ถ้ามี)</label>
                        {preview ? (
                            <img src={preview} alt="Avatar Preview" className="w-24 h-24 rounded-full object-cover border-2" />
                        ) : (
                            <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center text-gray-400">
                                รูปภาพ
                            </div>
                        )}
                        <input type="file" onChange={handleFileChange} accept="image/*" className="text-sm" />
                    </div>

                    <div>
                        <label className="block text-gray-700 mb-1 text-sm font-medium">ชื่อผู้ใช้ (Username)</label>
                        <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required className="w-full p-2 border rounded-md"/>
                    </div>

                    {/* --- *** เพิ่มช่องกรอก Email *** --- */}
                    <div>
                        <label className="block text-gray-700 mb-1 text-sm font-medium">อีเมล</label>
                        <input 
                            type="email" 
                            value={email} 
                            onChange={(e) => setEmail(e.target.value)} 
                            required 
                            className="w-full p-2 border rounded-md"
                        />
                    </div>
                    
                    <div>
                        <label className="block text-gray-700 mb-1 text-sm font-medium">ชื่อจริง</label>
                        <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} required className="w-full p-2 border rounded-md"/>
                    </div>
                     <div>
                        <label className="block text-gray-700 mb-1 text-sm font-medium">นามสกุล</label>
                        <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} required className="w-full p-2 border rounded-md"/>
                    </div>
                    <div>
                        <label className="block text-gray-700 mb-1 text-sm font-medium">รหัสผ่าน</label>
                        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full p-2 border rounded-md"/>
                    </div>
                    <div>
                        <label className="block text-gray-700 mb-1 text-sm font-medium">บทบาท</label>
                        <select
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            className="w-full p-2 border rounded-md bg-white"
                        >
                            <option value="caregiver">ผู้ดูแล</option>
                            <option value="osm">อสม.</option>
                        </select>
                    </div>
                    
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-green-500 text-white p-3 rounded-md hover:bg-green-600 font-semibold disabled:bg-gray-400"
                    >
                        {isLoading ? 'กำลังสมัคร...' : 'สมัครสมาชิก'}
                    </button>

                    <div className="text-center">
                        <Link to="/login" className="text-sm text-blue-500 hover:underline">
                            มีบัญชีอยู่แล้ว? เข้าสู่ระบบที่นี่
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default RegisterPage;