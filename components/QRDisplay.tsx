
import React from 'react';
import { QRCodeCanvas } from 'qrcode.react';

const QRDisplay = () => {
    const params = new URLSearchParams(window.location.search);
    const parentId = params.get('p');
    const childId = params.get('c');
    const invite = params.get('i');
    const name = params.get('n');
    const age = params.get('a');
    const gender = params.get('g');

    if (!parentId || !childId) return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-xl shadow text-center text-slate-500">
                Datos de invitación incompletos.
            </div>
        </div>
    );

    const qrData = JSON.stringify({ parentId, childId, invite, name });

    return (
        <div className="min-h-screen bg-red-600 flex flex-col items-center justify-center p-4 font-sans relative overflow-hidden">
            {/* Christmas Decorations (CSS only) */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20" style={{
                backgroundImage: 'radial-gradient(circle, #ffffff 2px, transparent 2.5px)',
                backgroundSize: '30px 30px'
            }}></div>

            <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-sm w-full text-center border-4 border-yellow-400 relative overflow-hidden z-10">
                {/* Festive Header */}
                <div className="absolute top-0 left-0 w-full h-4 bg-gradient-to-r from-red-500 via-green-500 to-red-500"></div>
                <div className="absolute -top-6 -right-6 w-20 h-20 bg-green-500 transform rotate-45"></div>

                <div className="mb-6 mt-4">
                    <span className="text-3xl">🎄</span>
                    <h1 className="text-2xl font-black text-red-600 uppercase tracking-wide">Entrega de Juguetes</h1>
                    <h2 className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-1">Fundación Armando Bukele</h2>
                </div>

                <div className="bg-white p-3 rounded-xl border-2 border-dashed border-red-200 shadow-inner inline-block mb-6 relative">
                    <div className="absolute -top-3 -right-3 text-2xl transform rotate-12">🎁</div>
                    <QRCodeCanvas
                        value={qrData}
                        size={200}
                        level={"H"}
                        includeMargin={true}
                    />
                </div>

                <h3 className="text-2xl font-black text-slate-800 mb-1 leading-tight">{name}</h3>
                <p className="text-slate-600 mb-4 font-medium flex items-center justify-center gap-2">
                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-bold">{age} Años</span>
                    <span className="text-slate-400">•</span>
                    <span className="uppercase text-sm font-bold text-slate-500">{gender}</span>
                </p>

                <div className="bg-blue-50 text-blue-700 px-6 py-4 rounded-xl font-mono font-black text-3xl mb-4 border-2 border-blue-100 tracking-wider shadow-sm">
                    {invite}
                </div>

                <div className="mb-6">
                    <p className="text-xs font-bold text-red-500 uppercase tracking-widest border border-red-200 bg-red-50 py-1.5 px-3 rounded-md inline-block">
                        Invitación Única e Intransferible
                    </p>
                </div>

                <div className="space-y-3">
                    <p className="text-sm text-slate-500 font-medium leading-relaxed bg-slate-50 p-3 rounded-lg">
                        Presenta este código al equipo de entrega.
                    </p>

                    <div className="pt-4 border-t border-slate-100">
                        <p className="text-xs text-slate-400 italic mb-1">Gracias a la gestión de Verena Flores</p>
                        <p className="text-[10px] text-slate-300 font-medium uppercase tracking-widest">Desarrollado por el equipo de tecnología</p>
                    </div>
                </div>
            </div>

            <div className="mt-8 text-white/80 text-xs text-center font-medium max-w-xs z-10">
                ✨ Compartiendo Sonrisas 2025 ✨
            </div>
        </div>
    );
};

export default QRDisplay;
