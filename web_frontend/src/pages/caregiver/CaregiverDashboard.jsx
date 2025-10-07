import React from 'react';

function CaregiverDashboard() {
    // TODO: Add logic to fetch and display elder list
    
    const handleLogout = () => {
        localStorage.removeItem('authToken');
        // Reload the page to go back to login
        window.location.href = '/login';
    };

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">Caregiver Dashboard</h1>
                <button 
                    onClick={handleLogout}
                    className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600"
                >
                    Logout
                </button>
            </div>
            
            <p>Welcome! Your list of elders will be displayed here.</p>
            {/* Elder list will go here */}
        </div>
    );
}

export default CaregiverDashboard;