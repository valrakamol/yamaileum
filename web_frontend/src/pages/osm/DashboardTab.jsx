// src/pages/osm/DashboardTab.jsx
import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '../../api/apiClient';
import { FaUserPlus } from 'react-icons/fa'; // ไอคอนสำหรับปุ่มนำทาง

function DashboardTab() {
    const [summary, setSummary] = useState({ normal: 0, at_risk: 0, follow_up: 0 });
    const [riskyElders, setRiskyElders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchDashboardData = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const response = await apiClient.get('/stats/osm_monthly_summary');
            setSummary(response.data.summary || { normal: 0, at_risk: 0, follow_up: 0 });
            
            // รวมรายชื่อจากทั้งสองกลุ่ม
            const followUp = response.data.follow_up_elders || [];
            const atRisk = response.data.at_risk_elders || [];
            setRiskyElders([...followUp, ...atRisk]);

        } catch (err) {
            console.error("Failed to fetch dashboard data:", err);
            setError('ไม่สามารถโหลดข้อมูลแดชบอร์ดได้');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    const StatCard = ({ title, value, bgColor, textColor = 'text-white' }) => (
        <div className={`p-4 rounded-lg shadow-md text-center ${bgColor}`}>
            <p className={`text-4xl font-bold ${textColor}`}>{value}</p>
            <p className={`mt-1 text-sm font-semibold ${textColor}`}>{title}</p>
        </div>
    );

    if (loading) return <p className="text-center p-4">กำลังโหลดข้อมูล...</p>;
    if (error) return <p className="text-center text-red-500 p-4">{error}</p>;

    return (
        <div className="p-4 space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-4">
                <StatCard title="ปกติ" value={summary.normal} bgColor="bg-green-500" />
                <StatCard title="กลุ่มเสี่ยง" value={summary.at_risk} bgColor="bg-yellow-500" />
                <StatCard title="ต้องติดตาม" value={summary.follow_up} bgColor="bg-red-500" />
            </div>

            {/* Risky Elders List */}
            <div className="bg-white p-4 rounded-lg shadow-md">
                <h3 className="text-lg font-bold mb-3">รายชื่อกลุ่มเสี่ยงและกลุ่มที่ต้องติดตาม</h3>
                {riskyElders.length === 0 ? (
                    <p className="text-gray-500">ไม่มีผู้สูงอายุในกลุ่มที่ต้องติดตาม</p>
                ) : (
                    <ul className="space-y-2">
                        {riskyElders.map(elder => (
                            <li 
                                key={elder.id} 
                                className={`p-2 rounded flex justify-between items-center ${
                                    elder.risk_count >= 2 ? 'bg-red-100' : 'bg-yellow-100'
                                }`}
                            >
                                <span className={elder.risk_count >= 2 ? 'text-red-800 font-semibold' : 'text-yellow-800'}>
                                    {elder.full_name}
                                </span>
                                <span className="text-xs text-gray-600">
                                    พบค่าผิดปกติ {elder.risk_count} ครั้ง
                                </span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}

export default DashboardTab;