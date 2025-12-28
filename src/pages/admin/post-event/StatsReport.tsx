import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Download, FileText } from 'lucide-react';

const StatsReport: React.FC = () => {
    // Mock Data
    const attendanceData = [
        { name: 'Confirmados', value: 156 },
        { name: 'Asistieron', value: 142 },
        { name: 'No Asistieron', value: 14 },
    ];

    const mealData = [
        { name: 'Pollo', value: 60 },
        { name: 'Res', value: 50 },
        { name: 'Pescado', value: 20 },
        { name: 'Veggie', value: 15 },
        { name: 'Infantil', value: 11 },
    ];

    const COLORS = ['#1e293b', '#c5a059', '#ef4444', '#3b82f6', '#10b981'];

    return (
        <div className="space-y-8 animate-fade-in pb-20">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Reporte Post-Evento</h2>
                    <p className="text-slate-500">Métricas clave de asistencia y consumo.</p>
                </div>
                <button className="flex items-center gap-2 bg-[#c5a059] text-white px-4 py-2 rounded-lg font-bold hover:bg-[#b08d4b] transition-colors">
                    <Download size={18} /> Exportar PDF
                </button>
            </div>

            {/* Attendance Summary */}
            <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
                        <FileText size={20} className="text-[#c5a059]" />
                        Resumen de Asistencia
                    </h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={attendanceData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip cursor={{ fill: '#f8fafc' }} />
                                <Bar dataKey="value" fill="#1e293b" radius={[4, 4, 0, 0]} barSize={50} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="mt-4 text-center">
                        <p className="text-3xl font-bold text-slate-800">91%</p>
                        <p className="text-xs text-slate-400 uppercase tracking-widest">Tasa de Asistencia</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
                        <FileText size={20} className="text-[#c5a059]" />
                        Preferencias de Menú
                    </h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={mealData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {mealData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="grid grid-cols-3 gap-2 mt-4 text-center text-xs">
                        {mealData.map((entry, index) => (
                            <div key={index}>
                                <div className="w-3 h-3 rounded-full mx-auto mb-1" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                                <span className="font-bold text-slate-700">{entry.value}</span> {entry.name}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StatsReport;
