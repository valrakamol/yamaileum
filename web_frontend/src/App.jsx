// src/App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// --- Import Pages ---
// Auth
import RoleSelectScreen from './pages/auth/RoleSelectScreen'; 
import LoginPage from './pages/auth/LoginPage';
import ElderLoginPage from './pages/auth/ElderLoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';

// Caregiver
import CaregiverHomeScreen from './pages/caregiver/CaregiverHomeScreen';
import ElderDetailScreen from './pages/caregiver/ElderDetailScreen';
import MedicineListPage from './pages/caregiver/medicines/MedicineListPage';
import AddMedicinePage from './pages/caregiver/medicines/AddMedicinePage';
import AppointmentListPage from './pages/caregiver/appointments/AppointmentListPage';
import AddAppointmentPage from './pages/caregiver/appointments/AddAppointmentPage';
import EditAppointmentPage from './pages/caregiver/appointments/EditAppointmentPage';
import HealthRecordListPage from './pages/caregiver/health/HealthRecordListPage';

// OSM
import OsmHomeScreen from './pages/osm/OsmHomeScreen';
import AddElderLinkPage from './pages/osm/AddElderLinkPage';
import OsmElderDetailPage from './pages/osm/OsmElderDetailPage';
import EditHealthScreen from './pages/osm/EditHealthScreen'; 
import OsmHealthRecordPage from './pages/osm/OsmHealthRecordPage';

// Elder
import ElderHomeScreen from './pages/elder/ElderHomeScreen';





function App() {
    // ฟังก์ชัน Helper สำหรับตรวจสอบว่าผู้ใช้ล็อกอินหรือยัง
    const isAuthenticated = () => !!localStorage.getItem('authToken');

    // Component สำหรับป้องกัน Route
    const PrivateRoute = ({ children }) => {
        return isAuthenticated() ? children : <Navigate to="/login" />;
    };

    return (
        <Router>
            <Routes>
                {/* --- Public Routes --- */}
                <Route path="/" element={<RoleSelectScreen />} />
                
                {/* --- Auth Routes (Public) --- */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/elder/login" element={<ElderLoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
                
                {/* --- Caregiver Routes (Protected) --- */}
                {/* จัดลำดับจาก Route ที่เจาะจงที่สุด (ยาวที่สุด) ไปยัง Route ที่กว้างที่สุด */}
                
                <Route 
                    path="/caregiver/elder/:elderId/:elderName/appointments/:appointmentId/edit" 
                    element={<PrivateRoute><EditAppointmentPage /></PrivateRoute>} 
                />
                <Route 
                    path="/caregiver/elder/:elderId/:elderName/appointments/add" 
                    element={<PrivateRoute><AddAppointmentPage /></PrivateRoute>} 
                />
                <Route 
                    path="/caregiver/elder/:elderId/:elderName/appointments" 
                    element={<PrivateRoute><AppointmentListPage /></PrivateRoute>} 
                />

                <Route 
                    path="/caregiver/elder/:elderId/:elderName/medicines/add" 
                    element={<PrivateRoute><AddMedicinePage /></PrivateRoute>} 
                />
                <Route 
                    path="/caregiver/elder/:elderId/:elderName/medicines" 
                    element={<PrivateRoute><MedicineListPage /></PrivateRoute>} 
                />

                <Route 
                    path="/caregiver/elder/:elderId/:elderName/health" 
                    element={<PrivateRoute><HealthRecordListPage /></PrivateRoute>} 
                />

                <Route 
                    path="/caregiver/elder/:elderId/:elderName" 
                    element={<PrivateRoute><ElderDetailScreen /></PrivateRoute>} 
                />

                <Route 
                    path="/caregiver/home" 
                    element={<PrivateRoute><CaregiverHomeScreen /></PrivateRoute>} 
                />

                {/* --- OSM Routes (Protected) --- */}
                <Route 
                    path="/osm/home" 
                    element={<PrivateRoute><OsmHomeScreen /></PrivateRoute>}
                />
                <Route 
                    path="/osm/add-elder" 
                    element={<PrivateRoute><AddElderLinkPage /></PrivateRoute>} 
                />
                <Route 
                    path="/osm/elder/:elderId/:elderName" 
                    element={<PrivateRoute><OsmElderDetailPage /></PrivateRoute>}
                />
                <Route 
                    path="/osm/elder/:elderId/:elderName/health" 
                    element={<PrivateRoute><OsmHealthRecordPage /></PrivateRoute>} 
                />
                <Route 
                    path="/osm/elder/:elderId/:elderName/health/add" 
                    element={<PrivateRoute><EditHealthScreen /></PrivateRoute>} 
                />
                
                {/* --- Elder Routes (Protected) --- */}
                <Route 
                    path="/elder/home" 
                    element={<PrivateRoute> <ElderHomeScreen /> </PrivateRoute>} 
                /> 

                {/* Redirect ถ้าเข้า Path ที่ไม่มีอยู่จริง */}
                <Route path="*" element={<Navigate to="/" />} />
            </Routes>
        </Router>
    );
}

export default App;