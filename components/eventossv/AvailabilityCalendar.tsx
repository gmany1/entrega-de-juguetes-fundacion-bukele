import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Package, AlertCircle } from 'lucide-react';

interface Resource {
    id: string;
    name: string;
    totalStock: number;
    category: string;
}

interface Event {
    id: string;
    resourceId: string;
    title: string;
    start: number; // Day of month (simple number for demo)
    duration: number; // Days
    status: 'reserved' | 'confirmed' | 'maintenance';
    quantity: number;
}

const AvailabilityCalendar: React.FC = () => {
    const [currentMonth, setCurrentMonth] = useState('Noviembre 2024');

    // Mock Resources
    const resources: Resource[] = [
        { id: 'r1', name: 'Sillas Tiffany Blancas', totalStock: 200, category: 'Mobiliario' },
        { id: 'r2', name: 'Mesas Redondas 10pax', totalStock: 20, category: 'Mobiliario' },
        { id: 'r3', name: 'Sistema Audio Bose', totalStock: 4, category: 'Equipo' },
        { id: 'r4', name: 'Carpa 10x10', totalStock: 2, category: 'Estructura' },
    ];

    // Mock Events (Allocations)
    const allocations: Event[] = [
        { id: 'e1', resourceId: 'r1', title: 'Boda Andrea & Jorge', start: 12, duration: 1, status: 'confirmed', quantity: 150 },
        { id: 'e2', resourceId: 'r1', title: 'Cena Corporativa', start: 15, duration: 2, status: 'reserved', quantity: 100 },
        { id: 'e3', resourceId: 'r2', title: 'Boda Andrea & Jorge', start: 12, duration: 1, status: 'confirmed', quantity: 15 },
        { id: 'e4', resourceId: 'r3', title: 'Mantenimiento Preventivo', start: 5, duration: 3, status: 'maintenance', quantity: 1 },
        { id: 'e5', resourceId: 'r4', title: 'Feria Navideña', start: 20, duration: 5, status: 'reserved', quantity: 2 },
    ];

    const daysInMonth = 30; // Simplified
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'confirmed': return 'bg-red-500 border-red-600 text-white';
            case 'reserved': return 'bg-amber-400 border-amber-500 text-amber-900';
            case 'maintenance': return 'bg-slate-400 border-slate-500 text-white';
            default: return 'bg-blue-500';
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col h-[600px] overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-4">
                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <CalendarIcon size={20} className="text-blue-600" />
                        Calendario de Disponibilidad
                    </h2>
                    <div className="flex bg-white rounded-lg border border-slate-200 p-1">
                        <button className="p-1 hover:bg-slate-100 rounded"><ChevronLeft size={16} /></button>
                        <span className="px-3 text-sm font-bold text-slate-700 select-none">{currentMonth}</span>
                        <button className="p-1 hover:bg-slate-100 rounded"><ChevronRight size={16} /></button>
                    </div>
                </div>

                <div className="flex items-center gap-3 text-xs font-medium">
                    <div className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-amber-400"></span> Reservado (Cot)</div>
                    <div className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-500"></span> Confirmado (Uso)</div>
                    <div className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-slate-400"></span> Mantenimiento</div>
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="flex-1 overflow-auto">
                <div className="min-w-[1000px]">
                    {/* Date Header */}
                    <div className="flex border-b border-slate-200 sticky top-0 bg-white z-20 shadow-sm">
                        <div className="w-48 p-3 shrink-0 font-bold text-slate-500 text-xs uppercase tracking-wider bg-slate-50 border-r border-slate-200 flex items-center">
                            Recurso
                        </div>
                        {days.map(day => (
                            <div key={day} className={`flex-1 min-w-[32px] text-center py-2 text-xs font-medium border-r border-slate-100 ${day === 12 ? 'bg-blue-50 text-blue-600 font-bold' : 'text-slate-400'}`}>
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Resources Rows */}
                    {resources.map(resource => (
                        <div key={resource.id} className="flex border-b border-slate-100 hover:bg-slate-50 transition-colors group">
                            {/* Resource Label */}
                            <div className="w-48 p-3 shrink-0 border-r border-slate-200 bg-white sticky left-0 z-10 group-hover:bg-slate-50">
                                <div className="font-bold text-slate-700 text-sm truncate">{resource.name}</div>
                                <div className="text-[10px] text-slate-400 flex items-center gap-1">
                                    <Package size={10} /> Stock Total: {resource.totalStock}
                                </div>
                            </div>

                            {/* Timeline Cells */}
                            <div className="flex-1 flex relative">
                                {/* Grid Lines */}
                                {days.map(day => (
                                    <div key={day} className="flex-1 min-w-[32px] border-r border-slate-100/50"></div>
                                ))}

                                {/* Allocation Bars */}
                                {allocations.filter(a => a.resourceId === resource.id).map(alloc => (
                                    <div
                                        key={alloc.id}
                                        className={`absolute h-8 top-2 rounded-md border text-[10px] font-bold flex items-center px-2 shadow-sm cursor-pointer hover:brightness-110 active:scale-95 transition-all z-10 whitespace-nowrap overflow-hidden ${getStatusColor(alloc.status)}`}
                                        style={{
                                            left: `${(alloc.start - 1) * (100 / daysInMonth)}%`,
                                            width: `${alloc.duration * (100 / daysInMonth)}%`
                                        }}
                                        title={`${alloc.title} - ${alloc.quantity} Unidades`}
                                    >
                                        <span className="truncate">{alloc.quantity} • {alloc.title}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}

                    {/* Empty State / Hint */}
                    <div className="p-8 text-center text-slate-400">
                        <p className="text-sm">Arrastra para crear nuevas reservas o bloqueos de mantenimiento.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AvailabilityCalendar;
