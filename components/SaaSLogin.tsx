import React, { useState } from 'react';
import { ArrowRight, Lock, Command, CheckCircle2, Star, ShieldCheck } from 'lucide-react';

interface SaaSLoginProps {
    onLogin: (e: React.FormEvent) => void;
    username: string;
    setUsername: (u: string) => void;
    password: string;
    setPassword: (p: string) => void;
    isLoading: boolean;
    error?: string;
}

const SaaSLogin: React.FC<SaaSLoginProps> = ({
    onLogin,
    username,
    setUsername,
    password,
    setPassword,
    isLoading,
    error
}) => {
    return (
        <div className="min-h-screen flex font-sans text-slate-800">
            {/* Left Column - Brand & Value Prop (Desktop only) */}
            <div className="hidden lg:flex lg:w-1/2 bg-[#0A1929] text-white relative flex-col justify-between p-16 overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10" style={{
                    backgroundImage: `radial-gradient(circle at 2px 2px, rgba(212, 175, 55, 0.4) 1px, transparent 0)`,
                    backgroundSize: '32px 32px'
                }}></div>
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#D4AF37] rounded-full filter blur-[120px] opacity-10 -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-900 rounded-full filter blur-[120px] opacity-20 translate-y-1/2 -translate-x-1/2"></div>

                {/* Content */}
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#D4AF37] to-[#B08D4B] flex items-center justify-center shadow-lg shadow-orange-900/20">
                            <Command size={18} className="text-[#0A1929]" />
                        </div>
                        <span className="font-bold text-xl tracking-tight">EventosSV</span>
                    </div>
                </div>

                <div className="relative z-10 max-w-lg">
                    <h1 className="text-5xl font-serif font-bold mb-6 leading-tight">
                        Gestión de Eventos <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] to-[#F3E5AB]">Premium & Ejecutiva</span>
                    </h1>
                    <p className="text-slate-400 text-lg mb-8 font-light">
                        Control total sobre invitados, fiscalidad e inventario en una plataforma diseñada para la excelencia.
                    </p>

                    <div className="space-y-4">
                        <div className="flex items-center gap-3 text-sm text-slate-300">
                            <CheckCircle2 size={18} className="text-[#D4AF37]" />
                            <span>Control de Inventario Offline</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-slate-300">
                            <CheckCircle2 size={18} className="text-[#D4AF37]" />
                            <span>Facturación DTE Integrada</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-slate-300">
                            <CheckCircle2 size={18} className="text-[#D4AF37]" />
                            <span>Métricas en Tiempo Real</span>
                        </div>
                    </div>
                </div>

                <div className="relative z-10 text-xs text-slate-500 font-medium tracking-widest uppercase">
                    © 2026 EventosSV Platform
                </div>
            </div>

            {/* Right Column - Login Form */}
            <div className="w-full lg:w-1/2 bg-white flex items-center justify-center p-8 relative">
                <div className="w-full max-w-md">
                    {/* Mobile Brand (visible only on mobile) */}
                    <div className="lg:hidden text-center mb-10">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#D4AF37] to-[#B08D4B] flex items-center justify-center shadow-lg shadow-orange-900/20 mx-auto mb-4">
                            <Command size={24} className="text-[#0A1929]" />
                        </div>
                        <h2 className="text-2xl font-serif font-bold text-[#0A1929]">EventosSV</h2>
                    </div>

                    <div className="mb-8">
                        <h2 className="text-3xl font-bold text-[#0A1929] mb-2 font-serif">Bienvenido de nuevo</h2>
                        <p className="text-slate-500 text-sm">Ingrese sus credenciales para acceder al panel administrativo.</p>
                    </div>

                    <form onSubmit={onLogin} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Usuario</label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] outline-none transition-all font-medium text-slate-800"
                                placeholder="ej. admin"
                                autoFocus
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Contraseña</label>
                            </div>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] outline-none transition-all font-medium text-slate-800"
                                placeholder="••••••••"
                            />
                        </div>

                        {error && (
                            <div className="p-4 bg-red-50 text-red-600 text-sm rounded-lg flex items-center gap-2 animate-shake">
                                <ShieldCheck size={18} />
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-[#0A1929] text-white font-bold py-4 rounded-lg hover:bg-[#11263c] hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all transform flex items-center justify-center gap-2 tracking-wide"
                        >
                            {isLoading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>Ingresar al Panel <ArrowRight size={18} /></>
                            )}
                        </button>
                    </form>

                </div>

                {/* DEMO MODE HELPERS */}
                <div className="mt-8 pt-8 border-t border-slate-100">
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-xs text-slate-500">
                        <p className="font-bold text-[#0A1929] mb-2 uppercase tracking-wide">🔧 Demo Access Check</p>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <p className="font-bold text-slate-700">Planner (Admin)</p>
                                <code className="bg-white border border-slate-200 px-1 py-0.5 rounded">admin</code> / <code className="bg-white border border-slate-200 px-1 py-0.5 rounded">admin123</code>
                            </div>
                            <div>
                                <p className="font-bold text-slate-700">Scanner (Gate)</p>
                                <code className="bg-white border border-slate-200 px-1 py-0.5 rounded">scanner</code> / <code className="bg-white border border-slate-200 px-1 py-0.5 rounded">scan123</code>
                            </div>
                        </div>

                        <p className="font-bold text-[#0A1929] mb-2 uppercase tracking-wide pt-2 border-t border-slate-200">🔗 Quick Links (Public)</p>
                        <ul className="space-y-1">
                            <li><a href="/boda/demo-boda-123" target="_blank" className="text-blue-600 hover:underline">Wedding Site (Boda)</a></li>
                            <li><a href="/boda/demo-boda-123/rsvp" target="_blank" className="text-blue-600 hover:underline">RSVP Inv. (Code: BODA-123)</a></li>
                            <li><a href="/scanner" target="_blank" className="text-blue-600 hover:underline">Scanner App</a></li>
                            <li><a href="/portal/1" target="_blank" className="text-blue-600 hover:underline">Vendor: Catering (#1)</a></li>
                            <li><a href="/portal/3" target="_blank" className="text-blue-600 hover:underline">Vendor: DJ (#3)</a></li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SaaSLogin;
