import React from 'react';
import { TrendingUp, AlertCircle, Package } from 'lucide-react';

interface Props {
    onChangeTab: (tab: any) => void;
}

const DashboardHome: React.FC<Props> = ({ onChangeTab }) => {
    return (
        <div className="space-y-6 animate-fade-in text-slate-800">
            <h1 className="text-2xl font-bold mb-4">Salud del Negocio</h1>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {/* KPI 1: Ingresos */}
                <div className="bg-white p-6 rounded-2xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.05)] border-0 ring-1 ring-slate-100 flex flex-col justify-between h-48 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-50 to-transparent rounded-bl-full -mr-8 -mt-8 opacity-40"></div>

                    <div className="flex justify-between items-start relative z-10">
                        <div className="w-10 h-10 rounded-lg bg-white shadow-sm border border-slate-100 flex items-center justify-center text-[#D4AF37]">
                            <span className="font-serif font-bold text-lg">$</span>
                        </div>
                    </div>
                    <div className="relative z-10">
                        <div className="text-4xl font-serif font-medium text-[#0A1929] tracking-tight">$12,500</div>
                        <div className="text-xs text-slate-500 font-medium mt-3 flex items-center gap-2 uppercase tracking-wide">
                            Ingresos Mensuales
                            <span className="text-emerald-700 text-[10px] font-bold bg-emerald-50 px-2 py-0.5 rounded-full">+5%</span>
                        </div>
                    </div>
                </div>

                {/* KPI 2: Facturas Pendientes - Alerta */}
                {/* KPI 2: Facturas Pendientes - Alerta */}
                <button
                    onClick={() => onChangeTab('fiscal')}
                    className="bg-white p-6 rounded-2xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.05)] border-0 ring-1 ring-slate-100 flex flex-col justify-between h-48 text-left hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 group relative overflow-hidden"
                >
                    <div className="flex justify-between items-start w-full relative z-10">
                        <div className="w-10 h-10 rounded-lg bg-rose-50 flex items-center justify-center text-rose-500 group-hover:scale-110 transition-transform">
                            <AlertCircle size={20} />
                        </div>
                        <span className="text-[10px] font-bold text-rose-600 uppercase tracking-widest bg-rose-50 px-2 py-1 rounded-full border border-rose-100">Atención</span>
                    </div>
                    <div className="relative z-10">
                        <div className="text-4xl font-serif font-medium text-rose-600 tracking-tight">3</div>
                        <div className="text-xs text-rose-600/80 font-medium mt-3 uppercase tracking-wide">
                            DTE Pendientes
                        </div>
                    </div>
                </button>

                {/* KPI 3: Inventario Bajo */}
                <button
                    onClick={() => onChangeTab('inventory')}
                    className="bg-[#0A1929] text-white p-6 rounded-2xl shadow-xl shadow-slate-900/10 border-0 ring-1 ring-slate-800 flex flex-col justify-between h-48 text-left hover:bg-[#11263c] transition-all duration-300 group relative overflow-hidden"
                >
                    <div className="absolute -bottom-4 -right-4 opacity-5 transform rotate-12">
                        <Package size={140} />
                    </div>
                    <div className="flex justify-between items-start w-full relative z-10">
                        <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center text-white backdrop-blur-md border border-white/5">
                            <Package size={20} />
                        </div>
                    </div>
                    <div className="relative z-10">
                        <div className="text-4xl font-serif font-medium text-white tracking-tight">5</div>
                        <div className="text-xs text-slate-400 font-medium mt-3 uppercase tracking-wide">
                            Inventario Bajo
                        </div>
                    </div>
                </button>
            </div>

            <div className="mt-8">
                <h3 className="text-xl font-serif font-medium mb-6 text-[#0A1929] px-1">Actividad Reciente</h3>
                <div className="bg-white rounded-2xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.05)] overflow-hidden border border-slate-50">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="p-5 flex items-center justify-between border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors cursor-pointer group">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center text-xs font-serif font-bold group-hover:bg-[#0A1929] group-hover:text-white transition-all duration-300 shadow-sm">
                                    {i === 1 ? 'BC' : i === 2 ? 'G' : 'T'}
                                </div>
                                <div>
                                    <div className="font-semibold text-slate-700 text-sm group-hover:text-[#0A1929] transition-colors">Evento Banco Cuscatlán</div>
                                    <div className="text-[10px] uppercase tracking-wide text-slate-400 font-medium mt-1">Hace {i * 2}h • #402{i}</div>
                                </div>
                            </div>
                            <div className="text-sm font-bold text-[#0A1929] font-serif">
                                $450.00
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default DashboardHome;
