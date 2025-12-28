import React from 'react';
import { Outlet } from 'react-router-dom';
import { ScanLine, Wifi, WifiOff } from 'lucide-react';

const ScannerLayout: React.FC = () => {
    // TODO: Connect to detailed offline status context
    const isOnline = navigator.onLine;

    return (
        <div className="min-h-screen bg-black text-white font-sans">
            <header className="p-4 flex justify-between items-center bg-slate-900 border-b border-slate-800">
                <div className="flex items-center gap-2 font-bold text-yellow-500">
                    <ScanLine size={24} />
                    <span>SCANNER APP</span>
                </div>
                <div className={`flex items-center gap-2 text-xs font-bold px-2 py-1 rounded ${isOnline ? 'bg-green-900 text-green-400' : 'bg-red-900 text-red-400'}`}>
                    {isOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
                    {isOnline ? 'ONLINE' : 'OFFLINE'}
                </div>
            </header>
            <main className="p-4 max-w-md mx-auto">
                <Outlet />
            </main>
        </div>
    );
};

export default ScannerLayout;
