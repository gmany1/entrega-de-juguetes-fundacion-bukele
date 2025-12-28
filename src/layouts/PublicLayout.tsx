import React from 'react';
import { Outlet } from 'react-router-dom';

const PublicLayout: React.FC = () => {
    return (
        <div className="min-h-screen bg-[#fcfbf9] font-serif text-slate-800">
            {/* Wedding Header / Branding could go here */}
            <main>
                <Outlet />
            </main>
            {/* Footer */}
            <footer className="py-8 text-center text-slate-400 text-sm">
                <p>&copy; {new Date().getFullYear()} Wedding Planner System</p>
            </footer>
        </div>
    );
};

export default PublicLayout;
