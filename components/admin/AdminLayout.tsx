import React, { useState } from 'react';
import { SystemUser } from '../../types';
import {
    LayoutDashboard, ScanLine, Users, Menu, X, LogOut,
    Database, ShieldCheck, Settings, FileText
} from 'lucide-react';

import DashboardTab from './DashboardTab';
import ScannerTab from './ScannerTab';
import RegistrationsTab from './RegistrationsTab';
import UsersTab from './UsersTab';
import DataManagementTab from './DataManagementTab';
import AuditTab from './AuditTab';
import ConfigTab from './ConfigTab';

interface AdminLayoutProps {
    user: SystemUser;
    onLogout: () => void;
}

type TabId = 'dashboard' | 'scanner' | 'registrations' | 'audit' | 'users' | 'data' | 'settings';

const AdminLayout: React.FC<AdminLayoutProps> = ({ user, onLogout }) => {
    const [activeTab, setActiveTab] = useState<TabId>(user.role === 'verifier' ? 'scanner' : 'dashboard');
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const menuItems = [
        { id: 'dashboard', label: 'Tablero', icon: <LayoutDashboard size={20} />, allowed: ['admin', 'planner', 'scanner'] }, // 'whatsapp_sender' -> 'planner'
        { id: 'registrations', label: 'Invitados', icon: <Users size={20} />, allowed: ['admin', 'planner'] },
        { id: 'scanner', label: 'Check-in', icon: <ScanLine size={20} />, allowed: ['admin', 'scanner'] },
        { id: 'audit', label: 'Actividad', icon: <FileText size={20} />, allowed: ['admin'] },
        { id: 'users', label: 'Acceso', icon: <ShieldCheck size={20} />, allowed: ['admin'] },
        { id: 'data', label: 'Sistema', icon: <Database size={20} />, allowed: ['admin'] },
        { id: 'settings', label: 'Configuración', icon: <Settings size={20} />, allowed: ['admin'] },
    ];

    const allowedItems = menuItems.filter(item => item.allowed.includes(user.role));

    // Mobile specific logic
    const handleMobileNav = (tab: TabId | 'menu') => {
        if (tab === 'menu') {
            setMobileMenuOpen(true);
        } else {
            setActiveTab(tab as TabId);
            setMobileMenuOpen(false);
        }
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'dashboard': return <DashboardTab />;
            case 'scanner': return <ScannerTab />;
            case 'registrations': return <RegistrationsTab />;
            case 'users': return <UsersTab />;
            case 'data': return <DataManagementTab />;
            case 'audit': return <AuditTab />;
            case 'settings': return <ConfigTab />;
            default: return <div className="p-10 text-center text-slate-400">En Construcción</div>;
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 md:flex">
            {/* Desktop Sidebar */}
            <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 h-screen sticky top-0">
                <div className="p-6 border-b border-slate-100">
                    <h1 className="text-xl font-serif text-slate-800 tracking-tight flex items-center gap-2">
                        <span className="bg-[#1e293b] text-[#c5a059] p-1 rounded-full"><Users size={16} /></span>
                        Wedding
                    </h1>
                    <p className="text-xs text-slate-500 mt-1 uppercase tracking-widest">Admin Panel</p>
                </div>

                <nav className="flex-grow p-4 space-y-1">
                    {allowedItems.map(item => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id as TabId)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === item.id
                                ? 'bg-blue-50 text-blue-700'
                                : 'text-slate-600 hover:bg-slate-100 text-slate-500'
                                }`}
                        >
                            {item.icon}
                            {item.label}
                        </button>
                    ))}
                </nav>

                <div className="p-4 border-t border-slate-100 bg-slate-50/50">
                    <div className="mb-3 px-2">
                        <p className="text-sm font-bold text-slate-800">{user.name}</p>
                        <p className="text-xs text-slate-500 capitalize">{user.role}</p>
                    </div>
                    <button onClick={onLogout} className="w-full flex items-center gap-2 text-red-600 hover:bg-red-50 p-2 rounded-lg text-sm font-medium transition-colors">
                        <LogOut size={16} /> Cerrar Sesión
                    </button>
                </div>
            </aside>

            {/* Mobile Header */}
            <header className="md:hidden bg-white border-b border-slate-200 p-4 flex justify-between items-center sticky top-0 z-20">
                <div className="font-bold text-slate-800 flex items-center gap-2">
                    <span className="bg-blue-600 text-white text-xs p-1 rounded">FB</span>
                    {menuItems.find(i => i.id === activeTab)?.label || 'Panel'}
                </div>
                <div className="text-xs text-slate-500">{user.name}</div>
            </header>

            {/* Main Content */}
            <main className="flex-grow p-4 md:p-8 w-full max-w-[1600px] mx-auto overflow-hidden">
                {renderContent()}
            </main>

            {/* Mobile Bottom Nav */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-30 pb-safe">
                <div className="flex justify-around items-center">
                    {user.role !== 'verifier' && (
                        <button onClick={() => handleMobileNav('dashboard')} className={`flex flex-col items-center p-3 flex-1 ${activeTab === 'dashboard' ? 'text-blue-600' : 'text-slate-400'}`}>
                            <LayoutDashboard size={20} />
                            <span className="text-[10px] mt-1 font-medium">Tablero</span>
                        </button>
                    )}

                    <button onClick={() => handleMobileNav('scanner')} className={`flex flex-col items-center p-3 flex-1 ${activeTab === 'scanner' ? 'text-blue-600' : 'text-slate-400'}`}>
                        <ScanLine size={20} />
                        <span className="text-[10px] mt-1 font-medium">Escáner</span>
                    </button>

                    {user.role !== 'verifier' && (
                        <button onClick={() => handleMobileNav('registrations')} className={`flex flex-col items-center p-3 flex-1 ${activeTab === 'registrations' ? 'text-blue-600' : 'text-slate-400'}`}>
                            <Users size={20} />
                            <span className="text-[10px] mt-1 font-medium">Registros</span>
                        </button>
                    )}

                    <button onClick={() => handleMobileNav('menu')} className={`flex flex-col items-center p-3 flex-1 ${mobileMenuOpen ? 'text-blue-600' : 'text-slate-400'}`}>
                        <Menu size={20} />
                        <span className="text-[10px] mt-1 font-medium">Menú</span>
                    </button>
                </div>
            </div>

            {/* Mobile Menu Drawer */}
            {mobileMenuOpen && (
                <div className="md:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={() => setMobileMenuOpen(false)}>
                    <div className="absolute right-0 top-0 bottom-0 w-64 bg-white shadow-xl p-6 flex flex-col" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="font-bold text-lg text-slate-800">Menú</h2>
                            <button onClick={() => setMobileMenuOpen(false)} className="text-slate-400"><X size={24} /></button>
                        </div>

                        <nav className="space-y-2 flex-grow">
                            {/* Only show items NOT in the bottom bar or ALL items? Let's show secondary items mostly */}
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Herramientas</p>
                            {allowedItems.map(item => (
                                <button
                                    key={item.id}
                                    onClick={() => handleMobileNav(item.id as TabId)}
                                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium ${activeTab === item.id ? 'bg-blue-50 text-blue-600' : 'text-slate-600'}`}
                                >
                                    {item.icon}
                                    {item.label}
                                </button>
                            ))}
                        </nav>

                        <div className="pt-6 border-t border-slate-100">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                                    {user.name.charAt(0)}
                                </div>
                                <div className="text-xs">
                                    <div className="font-bold text-slate-800">{user.name}</div>
                                    <div className="text-slate-500 capitalize">{user.role}</div>
                                </div>
                            </div>
                            <button onClick={onLogout} className="w-full bg-red-50 text-red-600 py-3 rounded-lg font-bold text-sm">
                                Cerrar Sesión
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminLayout;
