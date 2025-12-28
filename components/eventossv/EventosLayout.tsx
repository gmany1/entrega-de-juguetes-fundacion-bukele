import React, { useState } from 'react';
import { LayoutDashboard, FileText, Package, Landmark, Menu, X, Plus, Users, Calendar, ScanLine, LogOut } from 'lucide-react';
import DashboardHome from './DashboardHome';
import QuoteScreen from './QuoteScreen';
import InventoryScreen from './InventoryScreen';
import FiscalComplianceScreen from './FiscalComplianceScreen';
import CRMPipeline from './CRMPipeline';
import EventHub from './EventHub';
import RegistrationsTab from '../admin/RegistrationsTab';
import ScannerTab from '../admin/ScannerTab';
import { SystemUser } from '../../types';

interface EventosLayoutProps {
    user?: SystemUser;
    onLogout?: () => void;
}

const EventosLayout: React.FC<EventosLayoutProps> = ({ user, onLogout }) => {
    const [activeTab, setActiveTab] = useState<'dashboard' | 'crm' | 'quotes' | 'inventory' | 'fiscal' | 'eventhub' | 'registrations' | 'scanner'>('dashboard');
    const [menuOpen, setMenuOpen] = useState(false);

    // Role Configuration
    const userRole = user?.role || 'admin'; // Default to admin for dev safety, or handle null

    const MENU_ITEMS = [
        { id: 'dashboard', label: 'Salud del Negocio', icon: <LayoutDashboard size={20} />, allowed: ['admin'] },
        { id: 'eventhub', label: 'Hub de Evento', icon: <Calendar size={20} />, allowed: ['admin', 'planner'] },
        { id: 'registrations', label: 'Invitados', icon: <Users size={20} />, allowed: ['admin', 'planner'] },
        { id: 'scanner', label: 'Check-in / Escáner', icon: <ScanLine size={20} />, allowed: ['admin', 'planner', 'scanner'] },
        { id: 'crm', label: 'Ventas (CRM)', icon: <Users size={20} />, allowed: ['admin', 'planner'] },
        { id: 'quotes', label: 'Cotizaciones', icon: <FileText size={20} />, allowed: ['admin', 'planner'] },
        { id: 'inventory', label: 'Inventario', icon: <Package size={20} />, allowed: ['admin', 'planner'] },
        { id: 'fiscal', label: 'Fiscalidad', icon: <Landmark size={20} />, allowed: ['admin'] },
    ];

    const allowedItems = MENU_ITEMS.filter(item => item.allowed.includes(userRole));

    // Redirect if current tab is not allowed
    // Implementation note: This should ideally be a useEffect, but for simple render logic:
    if (!allowedItems.find(i => i.id === activeTab)) {
        // If current tab is forbidden, switch to the first allowed tab
        if (allowedItems.length > 0) {
            setActiveTab(allowedItems[0].id as any);
        }
    }

    const renderContent = () => {
        // Basic safety check in render too
        if (!allowedItems.find(i => i.id === activeTab)) return null;

        switch (activeTab) {
            case 'dashboard': return <DashboardHome onChangeTab={setActiveTab} />;
            case 'crm': return <CRMPipeline />;
            case 'eventhub': return <EventHub />;
            case 'quotes': return <QuoteScreen />;
            case 'inventory': return <InventoryScreen />;
            case 'fiscal': return <FiscalComplianceScreen />;
            case 'registrations': return <RegistrationsTab />;
            case 'scanner': return <ScannerTab />;
            default: return <DashboardHome onChangeTab={setActiveTab} />;
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
            {/* Top Bar */}
            <header className="bg-white/95 backdrop-blur-sm border-b border-slate-200 h-16 flex items-center justify-between px-4 sticky top-0 z-50 transition-all duration-300">
                <div className="flex items-center gap-3">
                    <button onClick={() => setMenuOpen(!menuOpen)} className="p-2 -ml-2 text-slate-600 lg:hidden hover:bg-slate-100 rounded-lg transition-colors">
                        {menuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                    <div className="font-serif font-bold text-lg tracking-tight text-[#0A1929]">EventosSV</div>
                </div>
                <div className="w-9 h-9 bg-gradient-to-br from-[#D4AF37] to-[#B08D4B] rounded-full shadow-md border-2 border-white flex items-center justify-center text-xs font-bold text-white">
                    {user?.name?.charAt(0) || 'JD'}
                </div>
            </header>

            {/* Sidebar Overlay (Mobile) */}
            {menuOpen && (
                <div
                    className="fixed inset-0 bg-[#0A1929]/50 z-30 lg:hidden backdrop-blur-sm animate-fade-in"
                    onClick={() => setMenuOpen(false)}
                />
            )}

            {/* Sidebar (Desktop) & Drawer (Mobile) */}
            <aside className={`fixed inset-y-0 left-0 bg-[#0A1929] text-white w-72 transform transition-transform duration-300 ease-in-out z-40 lg:translate-x-0 ${menuOpen ? 'translate-x-0' : '-translate-x-full'} lg:static lg:h-[calc(100vh-64px)] lg:float-left shadow-2xl lg:shadow-none flex flex-col pt-16 lg:pt-0`}>
                <div className="p-6 pt-8 lg:pt-6">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Menú Principal</div>
                    <div className="space-y-2">
                        {allowedItems.map(item => (
                            <NavButton
                                key={item.id}
                                active={activeTab === item.id}
                                icon={item.icon}
                                label={item.label}
                                onClick={() => { setActiveTab(item.id as any); setMenuOpen(false); }}
                            />
                        ))}
                    </div>
                </div>

                <div className="mt-auto p-6 bg-[#07111d]">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#F3E5AB] flex items-center justify-center text-[#0A1929] font-bold">
                            {user?.name?.charAt(0) || 'JD'}
                        </div>
                        <div>
                            <div className="font-bold text-sm text-white">{user?.name || 'Juan Director'}</div>
                            <div className="text-xs text-slate-400 capitalize">{user?.role || 'Admin. General'}</div>
                        </div>
                    </div>
                    {onLogout && (
                        <button onClick={onLogout} className="w-full flex items-center gap-2 text-red-400 hover:text-red-300 hover:bg-white/5 p-2 rounded-lg text-xs font-medium transition-colors">
                            <LogOut size={14} /> Cerrar Sesión
                        </button>
                    )}
                </div>
            </aside>

            {/* Main Content */}
            <main className="lg:ml-72 p-6 min-h-[calc(100vh-64px)] pb-24 bg-slate-50">
                {renderContent()}
            </main>

            {/* FAB (Visible on Dashboard mainly, or global) */}
            {
                activeTab === 'dashboard' && (
                    <button
                        onClick={() => setActiveTab('quotes' as any)}
                        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-[#D4AF37] to-[#B08D4B] text-white rounded-full shadow-[0_4px_20px_-4px_rgba(212,175,55,0.5)] flex items-center justify-center hover:scale-105 active:scale-95 transition-all z-50"
                    >
                        <Plus size={32} />
                    </button>
                )
            }
        </div >
    );
};

const NavButton = ({ active, icon, label, onClick }: any) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${active ? 'bg-gradient-to-r from-[#D4AF37] to-[#B08D4B] text-white shadow-lg shadow-orange-900/20' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
    >
        <span className={`${active ? 'text-white' : 'text-slate-500 group-hover:text-[#D4AF37] transition-colors'}`}>
            {icon}
        </span>
        {label}
    </button>
);

export default EventosLayout;
