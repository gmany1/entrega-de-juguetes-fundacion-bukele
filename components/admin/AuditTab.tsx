import React, { useMemo, useState } from 'react';
import { useAdmin } from '../../contexts/AdminContext';
import { useConfig } from '../../contexts/ConfigContext';
import { Search, MapPin, CheckCircle, XCircle, AlertTriangle, ChevronDown } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, Tooltip as RechartsTooltip } from 'recharts';

const AuditTab: React.FC = () => {
    const { registrations, stats } = useAdmin();
    const { config } = useConfig();
    const [searchTerm, setSearchTerm] = useState('');

    // Pre-calculate normalized registrations for search
    // We can reuse 'registrations' from context directly, but let's flatten kids for searching if needed.
    // Actually the search logic in AdminPanel scanned through them.

    // --- HEAVY COMPUTATION: Distributor Audit ---
    // Moved from AdminPanel.tsx to here to isolate performance cost
    const distributorAudit = useMemo(() => {
        if (!config.ticketDistributors) return [];

        const auditData = config.ticketDistributors.map(d => {
            const start = d.startRange || 0;
            const end = d.endRange || 0;
            const rangeSize = end - start + 1;
            const assignedTickets = new Set<number>();

            // 1. Find all registered tickets in this range
            registrations.forEach(r => {
                const kids = r.children && r.children.length > 0 ? r.children : (r.inviteNumber ? [{ inviteNumber: r.inviteNumber }] : []);
                kids.forEach((c: any) => {
                    const num = parseInt(String(c.inviteNumber).replace(/\D/g, ''));
                    if (!isNaN(num) && num >= start && num <= end) {
                        assignedTickets.add(num);
                    }
                });
            });

            // 2. Identify Missing
            const missingTickets: number[] = [];
            for (let i = start; i <= end; i++) {
                if (!assignedTickets.has(i)) {
                    missingTickets.push(i);
                }
            }

            // 3. Delivered Count (in this range)
            let deliveredCount = 0;
            registrations.forEach(r => {
                const kids = (r.children && r.children.length > 0) ? r.children : (r.inviteNumber ? [{ inviteNumber: r.inviteNumber, status: r.status || 'pending' }] : []);
                kids.forEach((c: any) => {
                    const num = parseInt(String(c.inviteNumber).replace(/\D/g, ''));
                    if (!isNaN(num) && num >= start && num <= end && c.status === 'delivered') {
                        deliveredCount++;
                    }
                });
            });

            // 4. Locations (Colonies) served by this distributor
            // We reuse stats.colonyData from context if possible, but that is grouped by colony. 
            // We need grouped by Dist -> Colony.
            // Let's recalculate quickly for this specific view (O(N) isn't too bad here)
            const locationCounts: Record<string, number> = {};
            registrations.forEach(r => {
                // Check if any child of this reg belongs to this distributor
                const belongsToDist = (r.children || []).some((c: any) => {
                    const num = parseInt(String(c.inviteNumber).replace(/\D/g, ''));
                    return !isNaN(num) && num >= start && num <= end;
                }) || (r.inviteNumber && (() => {
                    const num = parseInt(String(r.inviteNumber).replace(/\D/g, ''));
                    return !isNaN(num) && num >= start && num <= end;
                })());

                if (belongsToDist) {
                    const loc = (r.addressDetails || 'Desconocido').split(',')[0].trim();
                    locationCounts[loc] = (locationCounts[loc] || 0) + (r.children?.length || r.childCount || 1);
                }
            });

            const allLocations = Object.entries(locationCounts)
                .map(([name, value]) => ({ name, value }))
                .sort((a, b) => b.value - a.value);

            return {
                name: d.name,
                range: `${start} - ${end}`,
                totalAssigned: rangeSize,
                registeredCount: assignedTickets.size,
                deliveredCount,
                percentRegistered: Math.round((assignedTickets.size / rangeSize) * 100),
                percentDelivered: Math.round((deliveredCount / rangeSize) * 100),
                missingTickets,
                allLocations
            };
        });

        return auditData;
    }, [registrations, config.ticketDistributors]);

    return (
        <div className="space-y-6 animate-fade-in pb-20">
            <div>
                <h2 className="text-2xl font-bold text-slate-800">Auditoría de Tickets</h2>
                <p className="text-slate-500">Control de faltantes y distribución por rangos.</p>
            </div>

            {/* Ticket Checker Tool */}
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <Search className="w-5 h-5 text-slate-500" />
                    Consultar Estado de Ticket
                </h3>
                <input
                    type="text"
                    placeholder="Número de Ticket (ej. 618)"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg max-w-xs bg-white"
                />

                {searchTerm && (
                    <div className="mt-4 p-4 bg-white rounded-lg border border-slate-200">
                        {(() => {
                            const cleanInput = searchTerm.replace(/\D/g, '');
                            const num = parseInt(cleanInput);

                            if (!cleanInput || isNaN(num)) return <p className="text-slate-500 text-sm">Ingrese un número válido.</p>;

                            // Find Registration
                            let foundReg: any = null;
                            let foundChild: any = null;

                            registrations.some(r => {
                                const kids = r.children && r.children.length > 0 ? r.children : [{ inviteNumber: r.inviteNumber, fullName: r.fullName || 'N/A', id: 'legacy' }];
                                const match = kids.find((c: any) => parseInt(String(c.inviteNumber).replace(/\D/g, '') || '0') === num);
                                if (match) {
                                    foundReg = r;
                                    foundChild = match;
                                    return true;
                                }
                                return false;
                            });


                            // Check Distributor Assignment
                            const assignedDistributor = config.ticketDistributors?.find(d =>
                                d.startRange && d.endRange && num >= d.startRange && num <= d.endRange
                            );

                            return (
                                <div className="space-y-2 text-sm">
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold w-32">Ticket:</span>
                                        <span className="font-mono bg-slate-100 px-2 rounded">NI{num.toString().padStart(4, '0')}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold w-32">Estado:</span>
                                        {foundReg ? (
                                            <span className="text-green-600 font-bold flex items-center gap-1"><CheckCircle size={14} /> Registrado</span>
                                        ) : (
                                            <span className="text-red-600 font-bold flex items-center gap-1"><XCircle size={14} /> NO REGISTRADO</span>
                                        )}
                                    </div>
                                    {foundReg && (
                                        <>
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold w-32">Responsable:</span>
                                                <span>{foundReg.parentName || foundReg.fullName}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold w-32">Beneficiario:</span>
                                                <span>{foundChild?.fullName}</span>
                                            </div>
                                        </>
                                    )}
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold w-32">Asignado a:</span>
                                        {assignedDistributor ? (
                                            <span className="text-blue-600 font-bold">{assignedDistributor.name}</span>
                                        ) : (
                                            <span className="text-orange-500 font-bold flex items-center gap-1">
                                                <AlertTriangle size={14} /> SIN ASIGNAR
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                        })()}
                    </div>
                )}
            </div>

            {/* Audit Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {distributorAudit.map((audit) => (
                    <div key={audit.name} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                        <div className="p-5 border-b border-slate-100">
                            <div className="flex justify-between items-start mb-2">
                                <h4 className="font-bold text-slate-800 text-lg">{audit.name}</h4>
                                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded font-mono">{audit.range}</span>
                            </div>

                            <div className="space-y-3 mt-4">
                                <div>
                                    <div className="flex justify-between text-xs text-slate-600 mb-1">
                                        <span>Registrados</span>
                                        <span className="font-bold">{audit.registeredCount} / {audit.totalAssigned}</span>
                                    </div>
                                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${audit.percentRegistered}%` }}></div>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-xs text-slate-600 mb-1">
                                        <span>Entregados</span>
                                        <span className="font-bold text-green-600">{audit.deliveredCount}</span>
                                    </div>
                                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                                        <div className="h-full bg-green-500 rounded-full" style={{ width: `${audit.percentDelivered}%` }}></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {audit.allLocations && audit.allLocations.length > 0 && (
                            <div className="px-5 pb-5 pt-2 border-t border-slate-50">
                                <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                    <MapPin size={12} /> Zonas ({audit.allLocations.length})
                                </h5>
                                <div className="h-[200px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={audit.allLocations} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                                            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                            <XAxis type="number" hide />
                                            <YAxis dataKey="name" type="category" width={90} tick={{ fontSize: 10 }} interval={0} />
                                            <RechartsTooltip cursor={{ fill: '#f1f5f9' }} formatter={(v: any) => [v, 'Tickets']} />
                                            <Bar dataKey="value" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={12} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        )}

                        <div className="bg-slate-50/50 border-t border-slate-100">
                            <details className="group">
                                <summary className="p-4 cursor-pointer text-sm font-medium text-slate-700 hover:bg-slate-100 flex justify-between items-center">
                                    <span>Faltantes ({audit.missingTickets.length})</span>
                                    <ChevronDown className="w-4 h-4 text-slate-400 group-open:rotate-180 transition-transform" />
                                </summary>
                                <div className="px-4 pb-4">
                                    {audit.missingTickets.length > 0 ? (
                                        <div className="mt-2 flex flex-wrap gap-2 max-h-40 overflow-y-auto p-2 bg-white rounded border border-slate-200">
                                            {audit.missingTickets.map(num => (
                                                <span key={num} className="text-xs bg-red-50 text-red-600 px-1.5 py-0.5 rounded font-mono border border-red-100">
                                                    NI{num.toString().padStart(4, '0')}
                                                </span>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center text-green-600 text-sm py-4">¡Completo!</div>
                                    )}
                                </div>
                            </details>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AuditTab;
