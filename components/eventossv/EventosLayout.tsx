import React, { useState } from 'react';
import { LayoutDashboard, FileText, Package, Landmark, Menu, X, Plus } from 'lucide-react';
import DashboardHome from './DashboardHome';
import QuoteScreen from './QuoteScreen';
import InventoryScreen from './InventoryScreen';
import FiscalComplianceScreen from './FiscalComplianceScreen';

const EventosLayout: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'dashboard' | 'quotes' | 'inventory' | 'fiscal'>('dashboard');
    const [menuOpen, setMenuOpen] = useState(false);

    const renderContent = () => {
        switch (activeTab) {
            case 'dashboard': return <DashboardHome onChangeTab={setActiveTab} />;
            case 'quotes': return <QuoteScreen />;
            case 'inventory': return <InventoryScreen />;
            case 'fiscal': return <FiscalComplianceScreen />;
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
                    JD
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
                        <NavButton
                            active={activeTab === 'dashboard'}
                            icon={<LayoutDashboard size={20} />}
                            label="Salud del Negocio"
                            onClick={() => { setActiveTab('dashboard'); setMenuOpen(false); }}
                        />
                        <NavButton
                            active={activeTab === 'quotes'}
                            icon={<FileText size={20} />}
                            label="Cotizaciones"
                            onClick={() => { setActiveTab('quotes'); setMenuOpen(false); }}
                        />
                        <NavButton
                            active={activeTab === 'inventory'}
                            icon={<Package size={20} />}
                            label="Inventario"
                            onClick={() => { setActiveTab('inventory'); setMenuOpen(false); }}
                        />
                        <NavButton
                            active={activeTab === 'fiscal'}
                            icon={<Landmark size={20} />}
                            label="Fiscalidad"
                            onClick={() => { setActiveTab('fiscal'); setMenuOpen(false); }}
                        />
                    </div>
                </div>

                <div className="mt-auto p-6 bg-[#07111d]">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#F3E5AB] flex items-center justify-center text-[#0A1929] font-bold">
                            JD
                        </div>
                        <div>
                            <div className="font-bold text-sm text-white">Juan Director</div>
                            <div className="text-xs text-slate-400">Admin. General</div>
                        </div>
                    </div>
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
                        onClick={() => setActiveTab('quotes')}
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
