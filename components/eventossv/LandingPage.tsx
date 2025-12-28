import React from 'react';
import { FileText, Package, Calendar, CheckCircle, Star, ArrowRight } from 'lucide-react';

const LandingPage: React.FC = () => {
    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
            {/* Navbar */}
            <nav className="flex items-center justify-between px-6 py-4 bg-white sticky top-0 z-50 border-b border-slate-100">
                <div className="text-xl font-bold text-blue-600 tracking-tight">EventosSV</div>
                <button
                    onClick={() => window.location.href = '?app=eventossv'}
                    className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors"
                >
                    Ingresar
                </button>
            </nav>

            {/* Hero Section */}
            <header className="px-4 pt-8 pb-12">
                <div className="bg-[#0f172a] rounded-3xl p-8 pb-12 text-white relative overflow-hidden shadow-2xl">
                    {/* Background Overlay/Image Placeholder */}
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-[#0f172a] to-blue-900 opacity-80 z-0"></div>
                    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&q=80')] bg-cover bg-center opacity-20 z-0 mix-blend-overlay"></div>

                    <div className="relative z-10 max-w-lg mx-auto text-center md:text-left md:mx-0">
                        <div className="inline-flex items-center gap-2 bg-blue-600/20 border border-blue-500/30 rounded-full px-3 py-1 text-[10px] font-bold tracking-wide text-blue-300 uppercase mb-6">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>
                            Gestión simplificada 2024
                        </div>

                        <h1 className="text-4xl md:text-5xl font-extrabold leading-[1.1] mb-6 tracking-tight">
                            Tu negocio de <br />
                            eventos, <span className="text-blue-400">bajo control</span>.
                        </h1>

                        <p className="text-slate-300 text-lg mb-8 leading-relaxed max-w-sm mx-auto md:mx-0">
                            De cotización a factura en segundos. Gestiona todo desde tu celular, sin complicaciones.
                        </p>

                        <button
                            onClick={() => window.location.href = '?app=eventossv'}
                            className="w-full md:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-lg shadow-lg shadow-blue-900/50 transition-all hover:scale-[1.02] active:scale-[0.98]"
                        >
                            Empezar Ahora
                        </button>
                    </div>
                </div>
            </header>

            {/* Features Section */}
            <section className="px-4 py-8 max-w-4xl mx-auto">
                <div className="mb-8">
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Todo lo que necesitas</h2>
                    <p className="text-slate-500">Herramientas potentes simplificadas para tu celular.</p>
                </div>

                <div className="space-y-4 md:grid md:grid-cols-3 md:space-y-0 md:gap-6">
                    {/* Card 1 */}
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-start gap-4">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl shrink-0">
                            <FileText size={24} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800 mb-1">Cotización a Factura</h3>
                            <p className="text-sm text-slate-500 leading-relaxed">Genera documentos fiscales automáticamente en un clic.</p>
                        </div>
                    </div>

                    {/* Card 2 */}
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-start gap-4">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl shrink-0">
                            <Package size={24} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800 mb-1">Gestión de Inventario</h3>
                            <p className="text-sm text-slate-500 leading-relaxed">Control total de tu equipo. Evita pérdidas y conflictos.</p>
                        </div>
                    </div>

                    {/* Card 3 */}
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-start gap-4">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl shrink-0">
                            <Calendar size={24} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800 mb-1">Calendario Inteligente</h3>
                            <p className="text-sm text-slate-500 leading-relaxed">Visualiza tus eventos y disponibilidad al instante.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Dark/Trust Section */}
            <section className="bg-[#0f172a] text-white py-16 px-6 mt-8">
                <div className="max-w-md mx-auto text-center">
                    <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-400">
                        <CheckCircle size={32} />
                    </div>
                    <h2 className="text-2xl font-bold mb-4">Cumplimiento Fiscal Garantizado</h2>
                    <p className="text-slate-400 leading-relaxed">
                        Adaptado a las leyes locales de El Salvador para que operes tranquilo y sin multas.
                    </p>
                </div>
            </section>

            {/* Testimonials */}
            <section className="px-4 py-16 bg-slate-50 max-w-5xl mx-auto overflow-hidden">
                <div className="mb-8">
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Clientes satisfechos</h2>
                    <p className="text-slate-500">Empresas en El Salvador que confían en nosotros.</p>
                </div>

                <div className="flex gap-4 overflow-x-auto pb-6 -mx-4 px-4 scrollbar-hide snap-x">
                    <div className="min-w-[300px] bg-white p-6 rounded-2xl shadow-sm border border-slate-100 snap-center">
                        <div className="flex text-amber-400 mb-4 gap-0.5">
                            <Star size={16} fill="currentColor" />
                            <Star size={16} fill="currentColor" />
                            <Star size={16} fill="currentColor" />
                            <Star size={16} fill="currentColor" />
                            <Star size={16} fill="currentColor" />
                        </div>
                        <p className="text-slate-600 italic mb-6 leading-relaxed">
                            "Antes perdía horas haciendo facturas. Con EventosSV, lo hago desde el celular en el mismo evento."
                        </p>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-xs">
                                CM
                            </div>
                            <div>
                                <div className="font-bold text-slate-900 text-sm">Carlos Martinez</div>
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">FIESTAS SAN SALVADOR</div>
                            </div>
                        </div>
                    </div>

                    <div className="min-w-[300px] bg-white p-6 rounded-2xl shadow-sm border border-slate-100 snap-center">
                        <div className="flex text-amber-400 mb-4 gap-0.5">
                            <Star size={16} fill="currentColor" />
                            <Star size={16} fill="currentColor" />
                            <Star size={16} fill="currentColor" />
                            <Star size={16} fill="currentColor" />
                            <Star size={16} fill="currentColor" />
                        </div>
                        <p className="text-slate-600 italic mb-6 leading-relaxed">
                            "El control de inventario nos salvó de perder equipo costoso. Es indispensable para mi negocio."
                        </p>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-700 font-bold text-xs">
                                AR
                            </div>
                            <div>
                                <div className="font-bold text-slate-900 text-sm">Ana Rodriguez</div>
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">DECORACIONES ELITE</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer CTA */}
            <section className="px-6 py-12 text-center pb-24">
                <h2 className="text-2xl font-bold text-slate-900 mb-6">¿Listo para ordenar tu negocio?</h2>
                <button
                    onClick={() => window.location.href = '?app=eventossv'}
                    className="w-full max-w-sm px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-lg shadow-lg shadow-blue-900/30 transition-all hover:scale-[1.02] active:scale-[0.98] mb-4"
                >
                    Probar Gratis
                </button>
                <p className="text-xs text-slate-400 font-medium">
                    Sin tarjeta de crédito requerida.
                </p>
            </section>
        </div>
    );
};

export default LandingPage;
