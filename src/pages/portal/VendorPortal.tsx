import React, { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useAdmin } from '../../../contexts/AdminContext'; // Accessing global state effectively acts as the "backend" connection
import { Clock, MapPin, Music, Utensils, AlertCircle, CheckCircle } from 'lucide-react';

const VendorPortal: React.FC = () => {
    const { id } = useParams();
    const { stats, registrations } = useAdmin();

    // Mock ID mapping to Vendor Type
    const vendorType = useMemo(() => {
        if (id === '1') return 'catering'; // Banquetes El Cielo
        if (id === '3') return 'dj';       // DJ Party Mix
        return 'logistics';                // Fallback / Decorators
    }, [id]);

    const vendorName = useMemo(() => {
        if (id === '1') return 'Banquetes El Cielo';
        if (id === '3') return 'DJ Party Mix';
        return 'Proveedor Logístico';
    }, [id]);

    // Derived Data for Catering
    const dietSummary = useMemo(() => {
        const summary: Record<string, number> = {};
        registrations.forEach(reg => {
            reg.companions.forEach(c => {
                if (c.mealPreference) {
                    summary[c.mealPreference] = (summary[c.mealPreference] || 0) + 1;
                }
            });
            // Also check the group level dietary restrictions note
            if (reg.dietaryRestrictions) {
                // Just counting existence of special requests for now, could parse richer
            }
        });
        return summary;
    }, [registrations]);

    // Derived Data for DJ
    const songRequests = useMemo(() => {
        return registrations
            .filter(r => r.songRequest)
            .map(r => ({ song: r.songRequest, from: r.primaryGuestName }));
    }, [registrations]);

    if (!stats) return <div>Cargando datos del evento...</div>;

    return (
        <div className="min-h-screen bg-slate-50 font-sans pb-20">
            {/* Header */}
            <header className="bg-[#1e293b] text-white p-6 shadow-md">
                <div className="container mx-auto flex justify-between items-center">
                    <div>
                        <h1 className="text-xl font-bold">Portal de Proveedores</h1>
                        <p className="text-slate-400 text-sm">{vendorName} • <span className="uppercase text-[#c5a059] font-bold">{vendorType}</span></p>
                    </div>
                    <div className="text-right hidden md:block">
                        <p className="text-xs text-slate-400">Evento</p>
                        <p className="font-serif">Boda Maria & Juan</p>
                    </div>
                </div>
            </header>

            <div className="container mx-auto px-4 py-8 space-y-8">

                {/* SHARED: Timeline & Logistics Map */}
                <div className="grid md:grid-cols-2 gap-6">
                    {/* Live Timeline */}
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-slate-800">
                            <Clock size={20} className="text-[#c5a059]" />
                            Cronograma en Vivo
                        </h3>
                        <div className="space-y-4 relative pl-4 border-l-2 border-slate-100">
                            {[
                                { time: '15:00', event: 'Acceso Proveedores', status: 'done' },
                                { time: '17:00', event: 'Llegada Invitados', status: 'current' },
                                { time: '17:30', event: 'Ceremonia', status: 'pending' },
                                { time: '19:00', event: 'Cena', status: 'pending' },
                                { time: '21:00', event: 'Fiesta', status: 'pending' }
                            ].map((item, idx) => (
                                <div key={idx} className="relative">
                                    <div className={`absolute -left-[21px] top-1 w-3 h-3 rounded-full ${item.status === 'done' ? 'bg-green-500' : item.status === 'current' ? 'bg-blue-500 animate-pulse' : 'bg-slate-300'}`} />
                                    <p className="font-bold text-slate-700">{item.time}</p>
                                    <p className="text-slate-500 text-sm">{item.event}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Venue Map Placeholder */}
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
                        <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-slate-800">
                            <MapPin size={20} className="text-[#c5a059]" />
                            Mapa del Venue
                        </h3>
                        <div className="flex-grow bg-slate-100 rounded-lg flex items-center justify-center p-8 border-2 border-dashed border-slate-200">
                            <p className="text-slate-400 text-center text-sm">Mapa Interactivo<br />(Visualización de Zonas)</p>
                        </div>
                    </div>
                </div>

                {/* CATERING SPECIFIC VIEW */}
                {vendorType === 'catering' && (
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm animate-fade-in">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-bold text-lg flex items-center gap-2 text-slate-800">
                                <Utensils size={20} className="text-[#c5a059]" />
                                Control de Alimentos
                            </h3>
                            <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-bold">
                                {stats.totalTickets} Confirmados
                            </span>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                            {Object.entries(dietSummary).map(([type, count]) => (
                                <div key={type} className="bg-slate-50 p-4 rounded-lg border border-slate-100 text-center">
                                    <p className="text-2xl font-bold text-slate-700">{count}</p>
                                    <p className="text-xs text-slate-500 uppercase">{type}</p>
                                </div>
                            ))}
                        </div>

                        <div className="bg-orange-50 p-4 rounded-lg border border-orange-100">
                            <h4 className="font-bold text-orange-800 flex items-center gap-2 mb-2">
                                <AlertCircle size={16} /> Alergias & Notas Importantes
                            </h4>
                            <ul className="list-disc list-inside text-sm text-orange-700 space-y-1">
                                {registrations.filter(r => r.dietaryRestrictions).map(r => (
                                    <li key={r.id}>
                                        <span className="font-bold">{r.primaryGuestName}:</span> {r.dietaryRestrictions}
                                    </li>
                                ))}
                                {registrations.filter(r => r.dietaryRestrictions).length === 0 && (
                                    <li>No hay alergias reportadas hasta el momento.</li>
                                )}
                            </ul>
                        </div>
                    </div>
                )}

                {/* DJ SPECIFIC VIEW */}
                {vendorType === 'dj' && (
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm animate-fade-in">
                        <h3 className="font-bold text-lg mb-6 flex items-center gap-2 text-slate-800">
                            <Music size={20} className="text-[#c5a059]" />
                            Playlist Colaborativa (Requests)
                        </h3>

                        <div className="space-y-2">
                            {songRequests.length > 0 ? songRequests.map((req, idx) => (
                                <div key={idx} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg border-b border-slate-100 last:border-0 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 font-bold text-xs">
                                            {idx + 1}
                                        </div>
                                        <span className="font-medium text-slate-700">{req.song}</span>
                                    </div>
                                    <span className="text-xs text-slate-400 italic">x {req.from}</span>
                                </div>
                            )) : (
                                <p className="text-slate-400 text-center py-8 italic">Aún no hay canciones solicitadas</p>
                            )}
                        </div>
                    </div>
                )}

                {/* INCIDENT REPORTING (New Feature) */}
                <div className="bg-red-50 p-6 rounded-xl border border-red-100 flex items-center justify-between">
                    <div>
                        <h3 className="font-bold text-lg flex items-center gap-2 text-red-800">
                            <AlertCircle size={20} />
                            Reportar Incidencia
                        </h3>
                        <p className="text-sm text-red-600 max-w-md">
                            Reporta problemas urgentes (audio, luces, limpieza) directamente a la Planner.
                        </p>
                    </div>
                    <button
                        onClick={() => alert("🚨 Incidencia Reportada: La Planner ha recibido una notificación prioritaria.")}
                        className="bg-red-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-200"
                    >
                        NOTIFICAR URGENCIA
                    </button>
                </div>
            </div>
        </div>
    );
};

export default VendorPortal;
