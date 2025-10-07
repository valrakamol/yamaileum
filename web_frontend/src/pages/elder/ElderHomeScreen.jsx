// src/pages/elder/ElderHomeScreen.jsx
import React, { useState } from 'react';
import MedicinesTab from './MedicinesTab';
import AppointmentsTab from './AppointmentsTab';
import HealthRecordsTab from './HealthRecordsTab';
import ProfileTab from './ProfileTab';

// Import ไอคอน
import { FaCapsules, FaCalendarAlt, FaHeartbeat, FaUserCircle } from 'react-icons/fa';


function ElderHomeScreen() {
    const [activeTab, setActiveTab] = useState('medicines');

    const renderContent = () => {
        switch (activeTab) {
            case 'appointments':
                return <AppointmentsTab />;
            case 'health':
                return <HealthRecordsTab />;
            case 'profile':
                return <ProfileTab />;
            case 'medicines':
            default:
                return <MedicinesTab />;
        }
    };

    const TabButton = ({ tabName, icon, label }) => (
        <button
            onClick={() => setActiveTab(tabName)}
            className={`flex-1 flex flex-col items-center justify-center p-2 ${
                activeTab === tabName ? 'text-green-600' : 'text-gray-500'
            }`}
        >
            {icon}
            <span className="text-xs mt-1">{label}</span>
        </button>
    );

    return (
        <div className="flex flex-col h-screen">
            <header className="bg-green-500 text-white text-center p-4 shadow-md">
                <h1 className="text-xl font-bold">ยาไม่ลืม</h1>
            </header>

            <main className="flex-1 overflow-y-auto bg-gray-100">
                {renderContent()}
            </main>

            <footer className="flex border-t bg-white shadow-lg">
                <TabButton tabName="medicines" icon={<FaCapsules size={24} />} label="รายการยา" />
                <TabButton tabName="appointments" icon={<FaCalendarAlt size={24} />} label="หมอนัด" />
                <TabButton tabName="health" icon={<FaHeartbeat size={24} />} label="บันทึกสุขภาพ" />
                <TabButton tabName="profile" icon={<FaUserCircle size={24} />} label="โปรไฟล์" />
            </footer>
        </div>
    );
}

export default ElderHomeScreen;