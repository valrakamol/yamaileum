// src/pages/osm/OsmHomeScreen.jsx
import React, { useState } from 'react';
import EldersListTab from './EldersListTab'; // เราจะสร้างไฟล์นี้ต่อไป
import DashboardTab from './DashboardTab';   // เราจะสร้างไฟล์นี้ต่อไป
import ProfileTab from '../caregiver/ProfileTab'; // ใช้ ProfileTab ของ Caregiver ได้เลย
import { FaList, FaChartPie, FaUserCircle } from 'react-icons/fa';

function OsmHomeScreen() {
    const [activeTab, setActiveTab] = useState('elders');

    const renderContent = () => {
        switch (activeTab) {
            case 'dashboard':
                return <DashboardTab />;
            case 'profile':
                return <ProfileTab />; // ใช้ร่วมกับ Caregiver
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
            <header className="bg-blue-500 text-white text-center p-4 shadow-md">
                <h1 className="text-xl font-bold">หน้าจอ อสม.</h1>
            </header>
            <main className="flex-1 overflow-y-auto bg-gray-100">
                {renderContent()}
            </main>
            <footer className="flex border-t bg-white shadow-lg">
                <TabButton tabName="elders" icon={<FaList size={24} />} label="รายชื่อผู้สูงอายุ" />
                <TabButton tabName="dashboard" icon={<FaChartPie size={24} />} label="แดชบอร์ด" />
                <TabButton tabName="profile" icon={<FaUserCircle size={24} />} label="โปรไฟล์" />
            </footer>
        </div>
    );
}

export default OsmHomeScreen;