// src/pages/caregiver/CaregiverHomeScreen.jsx
import React, { useState } from 'react';
import EldersListTab from './EldersListTab';
import AddElderTab from './AddElderTab';
import ProfileTab from './ProfileTab';

// (ตัวอย่างไอคอน - ติดตั้ง `react-icons` ด้วย: npm install react-icons)
import { FaUserFriends, FaPlus, FaUserCircle } from 'react-icons/fa'; 

function CaregiverHomeScreen() {
    const [activeTab, setActiveTab] = useState('elders'); // 'elders', 'add', 'profile'

    const renderContent = () => {
        switch (activeTab) {
            case 'add':
                return <AddElderTab />;
            case 'profile':
                return <ProfileTab />;
            case 'elders':
            default:
                return <EldersListTab />;
        }
    };

    const TabButton = ({ tabName, icon, label }) => (
        <button
            onClick={() => setActiveTab(tabName)}
            className={`flex-1 flex flex-col items-center justify-center p-2 ${
                activeTab === tabName ? 'text-blue-600' : 'text-gray-500'
            }`}
        >
            {icon}
            <span className="text-xs mt-1">{label}</span>
        </button>
    );

    return (
        <div className="flex flex-col h-screen">
            {/* Header */}
            <header className="bg-green-500 text-white text-center p-4 shadow-md">
                <h1 className="text-xl font-bold">หน้าจอผู้ดูแล</h1>
            </header>

            {/* Content Area */}
            <main className="flex-1 overflow-y-auto bg-gray-100">
                {renderContent()}
            </main>

            {/* Bottom Navigation Bar */}
            <footer className="flex border-t bg-white shadow-lg">
                <TabButton tabName="elders" icon={<FaUserFriends size={24} />} label="รายชื่อ" />
                <TabButton tabName="add" icon={<FaPlus size={24} />} label="เพิ่มผู้สูงอายุ" />
                <TabButton tabName="profile" icon={<FaUserCircle size={24} />} label="โปรไฟล์" />
            </footer>
        </div>
    );
}

export default CaregiverHomeScreen;