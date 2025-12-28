import React, { useState } from 'react';
import { WifiOff, Search } from 'lucide-react';

const InventoryScreen: React.FC = () => {
    const items = [
        { id: 1, name: 'Sillas Tiffany Blancas', status: 'available', image: 'https://images.unsplash.com/photo-1519225421980-715cb0202128?auto=format&fit=crop&q=80&w=300' },
        { id: 2, name: 'Mesas Redondas 10pax', status: 'reserved', image: 'https://images.unsplash.com/photo-1530018607912-eff2daa1bac4?auto=format&fit=crop&q=80&w=300' },
        { id: 3, name: 'Mesas Rectangulares', status: 'maintenance', image: 'https://images.unsplash.com/photo-1533090481720-856c6e3c1fdc?auto=format&fit=crop&q=80&w=300' },
        { id: 4, name: 'Sillas Apilables Metal', status: 'available', image: 'https://plus.unsplash.com/premium_photo-1661774916826-68194a282fb8?auto=format&fit=crop&q=80&w=300' },
    ];

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'available': return 'bg-green-500';
            case 'reserved': return 'bg-yellow-400';
            case 'maintenance': return 'bg-red-500';
            default: return 'bg-slate-300';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'available': return 'Disponible';
            case 'reserved': return 'Reservado';
            case 'maintenance': return 'En Mantenimiento';
            default: return 'Desconocido';
        }
    };

    return (
        <div className="space-y-6">
            {/* Header / Offline Banner */}
            <div className="bg-amber-100 text-amber-800 px-4 py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-bold shadow-sm border border-amber-200">
                <WifiOff size={16} />
                Modo Sin Conexión
            </div>

            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Inventario de Equipos</h1>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-3 text-slate-400" size={20} />
                <input
                    type="text"
                    placeholder="Buscar equipo..."
                    className="w-full bg-white pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                />
            </div>

            {/* Grid */}
            <div className="grid grid-cols-2 gap-4">
                {items.map(item => (
                    <div key={item.id} className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden group active:scale-95 transition-transform">
                        <div className="h-32 bg-slate-200 overflow-hidden relative">
                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                            {/* Status Dot Overlay */}
                            <div className={`absolute top-2 right-2 w-3 h-3 rounded-full ${getStatusColor(item.status)} shadow-sm border border-white`}></div>
                        </div>
                        <div className="p-3">
                            <h3 className="font-bold text-slate-800 text-sm leading-tight mb-2 min-h-[2.5em]">{item.name}</h3>
                            <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${getStatusColor(item.status)}`}></div>
                                <span className="text-xs text-slate-500 font-medium">{getStatusText(item.status)}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default InventoryScreen;
