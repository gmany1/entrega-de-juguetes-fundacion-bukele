import React from 'react';
import { useAdmin } from '../../contexts/AdminContext';
import { useConfig } from '../../contexts/ConfigContext';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, AreaChart, Area } from 'recharts';
import { Users, Ticket, CheckCircle, Clock, PieChart as PieIcon, Contact, MapPin, BarChart3, TrendingUp, ScanLine } from 'lucide-react';

const StatCard = ({ title, value, subtext, icon, color }: { title: string, value: string | number, subtext?: string, icon: React.ReactNode, color: string }) => (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-start justify-between">
        <div>
            <p className="text-slate-500 text-sm font-medium mb-1">{title}</p>
            <h3 className="text-3xl font-bold text-slate-800">{value}</h3>
            {subtext && <p className={`text-xs mt-2 font-medium ${color}`}>{subtext}</p>}
        </div>
        <div className={`p-3 rounded-lg ${color.replace('text-', 'bg-').replace('600', '50').replace('500', '50')}`}>
            {React.cloneElement(icon as React.ReactElement, { className: `w-6 h-6 ${color}` })}
        </div>
    </div>
);

const DashboardTab: React.FC = () => {
    const { stats, isLoading } = useAdmin();
    const { config } = useConfig();

    if (isLoading) return <div className="p-8 text-center text-slate-500">Cargando estadísticas...</div>;

    // Calculate percentages
    const percentDelivered = stats.totalTickets > 0 ? Math.round((stats.deliveredCount / stats.totalTickets) * 100) : 0;
    const percentRegistered = Math.round((stats.totalTickets / config.maxRegistrations) * 100);

    return (
        <div className="space-y-6 animate-fade-in pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Panel de Control</h2>
                    <p className="text-slate-500">Resumen en tiempo real de la operación.</p>
                </div>
                <div className="flex gap-2 text-sm bg-white p-1.5 rounded-lg border border-slate-200 shadow-sm">
                    <div className="px-3 py-1 bg-green-50 text-green-700 rounded-md font-bold">
                        {stats.deliveredCount} Entregados
                    </div>
                    <div className="px-3 py-1 bg-slate-50 text-slate-600 rounded-md">
                        {(stats.totalTickets - stats.deliveredCount)} Pendientes
                    </div>
                </div>
            </div>

            {/* KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Invitados Totales"
                    value={config.maxRegistrations}
                    subtext="Capacidad del evento"
                    icon={<Users />}
                    color="text-blue-600"
                />
                <StatCard
                    title="Confirmados (RSVP)"
                    value={stats.totalTickets} // Functionally mapping 'tickets' to 'confirmed' for this context
                    subtext={`${percentRegistered}% de asistencia esperada`}
                    icon={<CheckCircle />}
                    color="text-purple-600"
                />
                <StatCard
                    title="Check-in Realizado"
                    value={stats.deliveredCount} // Mapping 'delivered' to 'checked-in'
                    subtext={`${percentDelivered}% de los confirmados`}
                    icon={<ScanLine />}
                    color="text-green-600"
                />
                <StatCard
                    title="Pendientes de Llegar"
                    value={stats.totalTickets - stats.deliveredCount}
                    subtext="Esperando llegada"
                    icon={<Clock />}
                    color="text-orange-500"
                />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                {/* Distributor Performance */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm min-h-[400px] flex flex-col md:col-span-2 lg:col-span-1">
                    <h4 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-blue-500" /> Rendimiento por Distribuidor
                    </h4>
                    <div className="flex-grow overflow-x-hidden overflow-y-auto max-h-[600px] pr-2 custon-scrollbar">
                        <div style={{ height: Math.max(400, (stats.distributorData || []).length * 50) }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={stats.distributorData}
                                    layout="vertical"
                                    margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} vertical={true} />
                                    <XAxis type="number" hide />
                                    <YAxis
                                        dataKey="name"
                                        type="category"
                                        width={100}
                                        tick={{ fontSize: 11, fill: '#64748b' }}
                                        interval={0}
                                    />
                                    <RechartsTooltip
                                        cursor={{ fill: '#f1f5f9' }}
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Legend verticalAlign="top" height={36} />
                                    <Bar dataKey="registered" stackId="a" fill="#10b981" name="Registrados" radius={[0, 0, 0, 0]} barSize={24} />
                                    <Bar dataKey="missing" stackId="a" fill="#f43f5e" name="Faltantes" radius={[0, 4, 4, 0]} barSize={24} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Gender Chart (Pie) */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm min-h-[300px] flex flex-col">
                    <h4 className="font-semibold text-slate-800 mb-4 flex items-center gap-2"><PieIcon className="w-4 h-4 text-purple-500" /> Género</h4>
                    <div className="flex-grow">
                        <ResponsiveContainer width="100%" height={250}>
                            <PieChart>
                                <Pie
                                    data={stats.genderData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                    label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                                        const RADIAN = Math.PI / 180;
                                        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                                        const x = cx + radius * Math.cos(-midAngle * RADIAN);
                                        const y = cy + radius * Math.sin(-midAngle * RADIAN);
                                        return (
                                            <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize={12} fontWeight="bold">
                                                {`${(percent * 100).toFixed(0)}%`}
                                            </text>
                                        );
                                    }}
                                    labelLine={false}
                                >
                                    {stats.genderData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={['#3b82f6', '#ec4899'][index % 2]} />
                                    ))}
                                </Pie>
                                <RechartsTooltip />
                                <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Age Distribution (Bar) */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm min-h-[300px] flex flex-col md:col-span-2 lg:col-span-1">
                    <h4 className="font-semibold text-slate-800 mb-4 flex items-center gap-2"><Contact className="w-4 h-4 text-orange-500" /> Edades (0-12)</h4>
                    <div className="flex-grow">
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={stats.ageData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="age" tick={{ fontSize: 10 }} interval={0} />
                                <YAxis allowDecimals={false} />
                                <RechartsTooltip cursor={{ fill: 'transparent' }} />
                                <Bar dataKey="count" fill="#f97316" radius={[4, 4, 0, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Timeline */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm min-h-[300px] flex flex-col md:col-span-2 lg:col-span-3">
                    <h4 className="font-semibold text-slate-800 mb-4 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-indigo-500" /> Ritmo de Inscripción</h4>
                    <div className="flex-grow">
                        <ResponsiveContainer width="100%" height={200}>
                            <AreaChart data={stats.timelineData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="date" />
                                <YAxis />
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <RechartsTooltip />
                                <Area type="monotone" dataKey="count" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorCount)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Colony Map (Full Width) */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm min-h-[400px] flex flex-col col-span-1 md:col-span-2 lg:col-span-3">
                    <h4 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-indigo-500" /> Distribución Geográfica ({stats.colonyData.length})
                    </h4>
                    <div className="flex-grow overflow-y-auto max-h-[500px] border border-slate-100 rounded-lg p-2">
                        <div style={{ height: Math.max(400, stats.colonyData.length * 30) }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={stats.colonyData} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                    <XAxis type="number" orientation="top" />
                                    <YAxis
                                        dataKey="name"
                                        type="category"
                                        width={100}
                                        tick={{ fontSize: 9 }}
                                        interval={0}
                                    />
                                    <RechartsTooltip
                                        contentStyle={{ fontSize: '12px' }}
                                        cursor={{ fill: '#f1f5f9' }}
                                    />
                                    <Legend iconType="circle" />
                                    {/* Generate Bars for each distributor */}
                                    {(config.ticketDistributors || []).map((dist, idx) => {
                                        const colors = ['#ef4444', '#f97316', '#f59e0b', '#84cc16', '#10b981', '#06b6d4', '#0ea5e9', '#6366f1', '#8b5cf6', '#d946ef'];
                                        return (
                                            <Bar key={dist.name} dataKey={dist.name} stackId="a" fill={colors[idx % colors.length]} radius={[0, 0, 0, 0]} barSize={15} />
                                        );
                                    })}
                                    <Bar dataKey="Otros" stackId="a" fill="#64748b" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default DashboardTab;
