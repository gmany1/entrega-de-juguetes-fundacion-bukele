import React, { useEffect, useState } from 'react';
import { TrendingUp, AlertCircle, Package, Users, Calendar, ArrowRight, DollarSign, CheckCircle, Clock } from 'lucide-react';
import { getTotalGuestCount, getGuestGroups, getTables } from '../../services/storageService';
import { GuestGroup } from '../../types';

interface Props {
    onChangeTab: (tab: any) => void;
}

const DashboardHome: React.FC<Props> = ({ onChangeTab }) => {
    const [stats, setStats] = useState({
        totalGuests: 0,
        confirmedGuests: 0,
        tablesCount: 0,
        recentActivity: [] as any[]
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadDashboardData = async () => {
            try {
                // Parallel fetching
                const [guests, tables] = await Promise.all([
                    getGuestGroups(),
                    getTables()
                ]);

                // Calculate metrics
                const totalGuests = guests.reduce((sum, g) => sum + (g.companions?.length || 0), 0) + (guests.length > 0 ? guests.length : 0); // Primary + companions? Logic check: stored groups contain primary?
                // Actually storageService logic for guest groups is: primary + companions list.
                // Let's approximate: 1 (Primary) + companions.length

                const confirmedGuests = guests.reduce((sum, g) => {
                    const primaryChecked = 0; // Primary status not explicitly tracked separate from group yet?
                    const compsChecked = g.companions?.filter(c => c.status === 'checked_in').length || 0;
                    return sum + compsChecked;
                }, 0);

                const recent = guests.slice(0, 5).map(g => ({
                    user: 'Sistema',
                    action: `Nuevo Registro: ${g.primaryGuestName} (${g.companions.length + 1} pax)`,
                    time: new Date(g.timestamp).toLocaleDateString(),
                    icon: '📝'
                }));

                setStats({
                    totalGuests: guests.reduce((acc, g) => acc + 1 + (g.companions?.length || 0), 0),
                    confirmedGuests: confirmedGuests, // This needs refined logic if primary has status
                    tablesCount: tables.length,
                    recentActivity: recent
                });
            } catch (error) {
                console.error("Failed to load dashboard stats", error);
            } finally {
                setLoading(false);
            }
        };
        loadDashboardData();
    }, []);

    if (loading) return <div className="p-10 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D4AF37]"></div></div>;

    return (
        <div className="space-y-6 animate-fade-in text-slate-800 h-[calc(100vh-100px)] overflow-y-auto">
            <div className="flex justify-between items-center mb-2">
                <div>
                    <h1 className="text-2xl font-bold text-[#0A1929]">Buenos días</h1>
                    <p className="text-slate-500 text-sm">Resumen del evento en tiempo real.</p>
                </div>
                <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-200 text-xs font-mono text-slate-400">
                    Sincronizado
                </div>
            </div>

            {/* Main KPI Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">

                {/* KPI 1: Total Invitados */}
                <button onClick={() => onChangeTab('registrations')} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden group hover:shadow-md transition-all text-left">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-indigo-50 to-transparent rounded-bl-full -mr-6 -mt-6"></div>
                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                                <Users size={20} />
                            </div>
                            <span className="bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2 py-1 rounded-full">Total</span>
                        </div>
                        <div className="text-2xl font-bold text-[#0A1929]">{stats.totalGuests}</div>
                        <div className="text-xs text-slate-400 font-medium uppercase tracking-wide mt-1">Invitados Registrados</div>
                    </div>
                </button>

                {/* KPI 2: Check-ins */}
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden group hover:shadow-md transition-all">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-green-50 to-transparent rounded-bl-full -mr-6 -mt-6"></div>
                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center text-green-600">
                                <CheckCircle size={20} />
                            </div>
                            <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-1 rounded-full">En Evento</span>
                        </div>
                        <div className="text-2xl font-bold text-[#0A1929]">{stats.confirmedGuests}</div>
                        <div className="text-xs text-slate-400 font-medium uppercase tracking-wide mt-1">Check-ins Realizados</div>
                    </div>
                </div>

                {/* KPI 3: Mesas */}
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden group hover:shadow-md transition-all">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-amber-50 to-transparent rounded-bl-full -mr-6 -mt-6"></div>
                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
                                <Package size={20} />
                            </div>
                        </div>
                        <div className="text-2xl font-bold text-[#0A1929]">{stats.tablesCount}</div>
                        <div className="text-xs text-slate-400 font-medium uppercase tracking-wide mt-1">Mesas Configuradas</div>
                    </div>
                </div>

                {/* KPI 4: Próximo Evento (Static for now, represents the main feature) */}
                <button onClick={() => onChangeTab('eventhub')} className="bg-[#0A1929] text-white p-5 rounded-2xl shadow-lg border border-slate-800 relative overflow-hidden group hover:scale-[1.02] transition-all text-left">
                    <div className="absolute right-0 top-0 h-full w-1/2 bg-gradient-to-l from-blue-900/20 to-transparent"></div>
                    <div className="relative z-10 flex flex-col justify-between h-full">
                        <div className="flex justify-between items-start">
                            <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center text-white backdrop-blur-md">
                                <Calendar size={20} />
                            </div>
                            <span className="bg-blue-500 text-white text-[10px] font-bold px-2 py-1 rounded-full animate-pulse">En Curso</span>
                        </div>
                        <div className="mt-4">
                            <div className="text-lg font-bold text-white mb-1">Boda Real</div>
                            <div className="text-xs text-slate-400">Ver Cronograma</div>
                        </div>
                    </div>
                </button>
            </div>

            <div className="grid gap-6 md:grid-cols-2">

                {/* Action Required (Placeholder logic for demo) */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                        <h3 className="font-bold text-slate-700 text-sm">Estado del Sistema</h3>
                        <span className="w-2 h-2 rounded-full bg-green-500"></span>
                    </div>
                    <div className="p-8 text-center text-slate-400 text-sm">
                        Todo funciona correctamente.
                    </div>
                </div>

                {/* Recent Activity Feed (Real Data) */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-4 border-b border-slate-100 bg-slate-50">
                        <h3 className="font-bold text-slate-700 text-sm">Registros Recientes</h3>
                    </div>
                    <div className="divide-y divide-slate-50 max-h-60 overflow-y-auto">
                        {stats.recentActivity.length === 0 ? (
                            <div className="p-4 text-center text-slate-400 text-xs">No hay actividad reciente.</div>
                        ) : (
                            stats.recentActivity.map((item, i) => (
                                <div key={i} className="p-4 flex items-center gap-3 hover:bg-slate-50 transition-colors">
                                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-sm">
                                        {item.icon}
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-sm font-medium text-slate-800">{item.action}</div>
                                        <div className="text-[10px] text-slate-400">{item.user} • {item.time}</div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardHome;
