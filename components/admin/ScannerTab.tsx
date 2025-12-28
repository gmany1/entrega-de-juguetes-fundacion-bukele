import React from 'react';
import ScanInterface from '../ScanInterface';

const ScannerTab: React.FC = () => {
    return (
        <div className="space-y-6 animate-fade-in pb-20">
            <div>
                <h2 className="text-2xl font-bold text-slate-800">Escáner QR</h2>
                <p className="text-slate-500">Escanea invitaciones para marcar entregas.</p>
            </div>
            <div className="bg-white p-4 md:p-8 rounded-xl border border-slate-200 shadow-sm min-h-[400px]">
                <ScanInterface />
            </div>
        </div>
    );
};

export default ScannerTab;
