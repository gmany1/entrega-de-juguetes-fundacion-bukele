import React from 'react';
import { Calendar, Clock, MapPin, Heart, Target, Users, Map, Star, Instagram, Facebook, Globe } from 'lucide-react';
import RSVPForm from './RSVPForm';

const LandingV2: React.FC = () => {
    return (
        <div className="min-h-screen bg-[#fcfbf9] font-sans selection:bg-[#c5a059] selection:text-white">

            {/* HERRO SECTION */}
            <div className="relative bg-[#1e293b] text-white overflow-hidden pb-32">
                {/* Hero Background Pattern */}
                <div className="absolute inset-0 opacity-10"
                    style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                    }}
                ></div>

                <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-transparent"></div>

                <div className="container mx-auto px-4 pt-12 pb-20 relative z-10 text-center">
                    <div className="inline-block mb-6 px-4 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-bold tracking-[0.2em] uppercase text-[#c5a059]">
                        Wedding Invitation
                    </div>

                    <h1 className="text-4xl md:text-6xl font-serif font-bold mb-6 leading-tight max-w-4xl mx-auto">
                        <span className="block text-[#c5a059] mb-2 font-sans text-xl md:text-2xl tracking-widest uppercase">Nos Casamos</span>
                        Celebra con Nosotros
                    </h1>

                    <p className="text-xl md:text-2xl text-[#e6cfa3] mb-12 font-light max-w-2xl mx-auto italic">
                        "El inicio de nuestra mejor aventura"
                    </p>

                    {/* Event Quick Info Cards */}
                    <div className="flex flex-wrap justify-center gap-4 text-left max-w-4xl mx-auto text-slate-800">
                        <div className="bg-white/90 backdrop-blur p-4 rounded-sm border border-white/10 flex items-center gap-3 min-w-[200px]">
                            <div className="bg-[#1e293b] p-2 rounded-sm text-[#c5a059]"><Calendar className="w-5 h-5" /></div>
                            <div>
                                <div className="text-[10px] uppercase opacity-70 font-bold tracking-wider">Fecha</div>
                                <div className="font-bold">Enero 1, 2026</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* OVERLAPPING REGISTRATION FORM */}
            <div className="-mt-24 container mx-auto px-4 relative z-20">
                <RSVPForm />
            </div>

            {/* INFO SECTIONS */}
            <div className="py-20">
                <div className="container mx-auto px-4">

                    {/* Mission / Values Grid */}
                    <div className="grid md:grid-cols-3 gap-8 mb-20">
                        {/* Card 1 */}
                        <div className="bg-white p-8 rounded-sm border border-slate-100 shadow-xl shadow-slate-200/50">
                            <div className="w-12 h-12 bg-[#fcfbf9] rounded-full flex items-center justify-center text-[#c5a059] mb-6 border border-[#e6cfa3]">
                                <Heart size={24} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 mb-4 font-serif">Ceremonia</h3>
                            <p className="text-slate-600 leading-relaxed text-sm">
                                Una celebración íntima rodeada de nuestros seres queridos para bendecir nuestra unión.
                            </p>
                        </div>

                        {/* Card 2 */}
                        <div className="bg-white p-8 rounded-sm border border-slate-100 shadow-xl shadow-slate-200/50">
                            <div className="w-12 h-12 bg-[#fcfbf9] rounded-full flex items-center justify-center text-[#c5a059] mb-6 border border-[#e6cfa3]">
                                <Star size={24} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 mb-4 font-serif">Recepción</h3>
                            <p className="text-slate-600 leading-relaxed text-sm">
                                Cena, música y baile para celebrar el amor y la amistad que nos une a todos.
                            </p>
                        </div>

                        {/* Card 3 */}
                        <div className="bg-white p-8 rounded-sm border border-slate-100 shadow-xl shadow-slate-200/50">
                            <div className="w-12 h-12 bg-[#fcfbf9] rounded-full flex items-center justify-center text-[#c5a059] mb-6 border border-[#e6cfa3]">
                                <Target size={24} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 mb-4 font-serif">Código de Vestimenta</h3>
                            <p className="text-slate-600 leading-relaxed text-sm">
                                Formal / Etiqueta Rigurosa. Queremos verlos a todos brillar en esta noche especial.
                            </p>
                        </div>
                    </div>

                    {/* Details & Map */}
                    <div className="bg-white rounded-sm p-8 md:p-12 shadow-xl border border-slate-100 overflow-hidden relative">
                        <div className="grid lg:grid-cols-2 gap-12 items-center">
                            <div>
                                <div className="inline-block px-3 py-1 bg-[#1e293b] text-[#c5a059] rounded-sm text-[10px] font-bold tracking-widest uppercase mb-4">
                                    Detalles
                                </div>
                                <h2 className="text-3xl font-serif font-bold text-slate-900 mb-6">Información del Evento</h2>

                                <div className="space-y-6">
                                    <div className="flex gap-4">
                                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 shrink-0 font-serif font-bold">1</div>
                                        <div>
                                            <h4 className="font-bold text-slate-800">RSVP</h4>
                                            <p className="text-sm text-slate-500">Por favor confirma tu asistencia antes del 1 de Diciembre.</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 shrink-0 font-serif font-bold">2</div>
                                        <div>
                                            <h4 className="font-bold text-slate-800">Acceso</h4>
                                            <p className="text-sm text-slate-500">Presenta tu código QR en la entrada para facilitar el acceso a tu mesa asignada.</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-8 pt-8 border-t border-slate-100">
                                    <h5 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
                                        <Map size={18} className="text-[#c5a059]" />
                                        Ubicación
                                    </h5>
                                    <p className="text-slate-600 text-sm mb-4">
                                        Salón de Eventos "El Ensueño"<br />
                                        Carretera al Lago, KM 15
                                    </p>
                                </div>
                            </div>
                            <div className="relative h-full min-h-[400px] bg-slate-200 rounded-sm overflow-hidden shadow-inner">
                                <div className="flex items-center justify-center h-full text-slate-400">
                                    Mapa / Imagen del Lugar
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            {/* FOOTER */}
            <div className="bg-[#1e293b] text-[#e6cfa3] py-12 text-center text-sm px-4">
                <div className="max-w-4xl mx-auto">
                    <p className="opacity-80 leading-relaxed mb-8 font-serif italic">
                        "El amor es paciente, es bondadoso..."
                    </p>
                    <div className="flex justify-center items-center gap-2 opacity-50 text-xs">
                        <span>© 2026 Wedding Planner System</span>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default LandingV2;
