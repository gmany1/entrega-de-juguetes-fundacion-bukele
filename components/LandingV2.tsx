import React from 'react';
import { Calendar, Clock, MapPin, Heart, Target, Users, Map, Star, Instagram, Facebook, Globe } from 'lucide-react';
import RegistrationFormV2 from './RegistrationFormV2';

const LandingV2: React.FC = () => {
    return (
        <div className="min-h-screen bg-[#fdfaf5] font-sans selection:bg-[#1e4620] selection:text-white">

            {/* HERRO SECTION */}
            <div className="relative bg-[#1e4620] text-white overflow-hidden pb-32">
                {/* Hero Background Pattern */}
                <div className="absolute inset-0 opacity-10"
                    style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                    }}
                ></div>

                <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-transparent"></div>

                <div className="container mx-auto px-4 pt-12 pb-20 relative z-10 text-center">
                    <div className="inline-block mb-6 px-4 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-bold tracking-[0.2em] uppercase">
                        Fundación Armando Bukele
                    </div>

                    <h1 className="text-4xl md:text-6xl font-serif font-bold mb-6 leading-tight max-w-4xl mx-auto">
                        <span className="block text-[#fbbf24] mb-2 font-sans text-xl md:text-2xl tracking-widest uppercase">Compartiendo Sonrisas</span>
                        Gran Entrega de Juguetes 2025
                    </h1>

                    <p className="text-xl md:text-2xl text-green-50 mb-12 font-light max-w-2xl mx-auto italic">
                        "Un compromiso con nuestra niñez"
                    </p>

                    {/* Event Quick Info Cards */}
                    <div className="flex flex-wrap justify-center gap-4 text-left max-w-4xl mx-auto">
                        <div className="bg-white/10 backdrop-blur p-4 rounded-xl border border-white/10 flex items-center gap-3 min-w-[200px]">
                            <div className="bg-[#b91c1c] p-2 rounded-lg"><Calendar className="w-5 h-5" /></div>
                            <div>
                                <div className="text-[10px] uppercase opacity-70 font-bold tracking-wider">Fecha</div>
                                <div className="font-bold">Mar 23 Dic, 2025</div>
                            </div>
                        </div>
                        <div className="bg-white/10 backdrop-blur p-4 rounded-xl border border-white/10 flex items-center gap-3 min-w-[200px]">
                            <div className="bg-[#b91c1c] p-2 rounded-lg"><Clock className="w-5 h-5" /></div>
                            <div>
                                <div className="text-[10px] uppercase opacity-70 font-bold tracking-wider">Hora</div>
                                <div className="font-bold">3:00 p. m.</div>
                            </div>
                        </div>
                        <div className="bg-white/10 backdrop-blur p-4 rounded-xl border border-white/10 flex items-center gap-3 min-w-[280px] flex-1">
                            <div className="bg-[#b91c1c] p-2 rounded-lg"><MapPin className="w-5 h-5" /></div>
                            <div>
                                <div className="text-[10px] uppercase opacity-70 font-bold tracking-wider">Lugar</div>
                                <div className="font-bold text-sm leading-tight">C.D. La Esmeralda, El Congo</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* OVERLAPPING REGISTRATION FORM */}
            <div className="-mt-24 container mx-auto px-4 relative z-20">
                <RegistrationFormV2 />
            </div>

            {/* INFO SECTIONS */}
            <div className="py-20">
                <div className="container mx-auto px-4">

                    {/* Mission / Values Grid */}
                    <div className="grid md:grid-cols-3 gap-8 mb-20">
                        {/* Card 1 */}
                        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 hover:-translate-y-1 transition-transform duration-300">
                            <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center text-[#1e4620] mb-6">
                                <Heart size={24} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 mb-4 font-serif">Sobre el Evento</h3>
                            <p className="text-slate-600 leading-relaxed text-sm">
                                Compartiendo Sonrisas es una jornada solidaria organizada por la Fundación Armando Bukele, orientada a la entrega gratuita de juguetes a niños y niñas del distrito de El Congo.
                            </p>
                        </div>

                        {/* Card 2 */}
                        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 hover:-translate-y-1 transition-transform duration-300">
                            <div className="w-12 h-12 bg-yellow-50 rounded-2xl flex items-center justify-center text-yellow-600 mb-6">
                                <Star size={24} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 mb-4 font-serif">Mensaje Institucional</h3>
                            <p className="text-slate-600 leading-relaxed text-sm">
                                Bajo la coordinación de Lorena Romero, reafirmamos nuestro compromiso con la niñez salvadoreña, impulsando acciones de impacto social que fortalecen el tejido comunitario.
                            </p>
                        </div>

                        {/* Card 3 */}
                        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 hover:-translate-y-1 transition-transform duration-300">
                            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mb-6">
                                <Target size={24} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 mb-4 font-serif">Objetivo Social</h3>
                            <p className="text-slate-600 leading-relaxed text-sm">
                                Generar un impacto positivo mediante una actividad que fomente la alegría, la inclusión y el compromiso social, fortaleciendo la relación entre comunidad y fundación.
                            </p>
                        </div>
                    </div>

                    {/* Details & Map */}
                    <div className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-xl border border-slate-100 overflow-hidden relative">
                        <div className="grid lg:grid-cols-2 gap-12 items-center">
                            <div>
                                <div className="inline-block px-3 py-1 bg-red-50 text-[#b91c1c] rounded-full text-[10px] font-bold tracking-widest uppercase mb-4">
                                    Información Importante
                                </div>
                                <h2 className="text-3xl font-serif font-bold text-slate-900 mb-6">Mecanismo de Entrega</h2>

                                <div className="space-y-6">
                                    <div className="flex gap-4">
                                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 shrink-0 font-serif font-bold">1</div>
                                        <div>
                                            <h4 className="font-bold text-slate-800">Inscripción Previa</h4>
                                            <p className="text-sm text-slate-500">Los juguetes están destinados exclusivamente a niños y niñas de 0 a 12 años previamente inscritos.</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 shrink-0 font-serif font-bold">2</div>
                                        <div>
                                            <h4 className="font-bold text-slate-800">Código QR</h4>
                                            <p className="text-sm text-slate-500">Cada niño deberá presentar su código QR autorizado el día del evento. No se entregarán juguetes sin QR.</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 shrink-0 font-serif font-bold">3</div>
                                        <div>
                                            <h4 className="font-bold text-slate-800">Orden y Transparencia</h4>
                                            <p className="text-sm text-slate-500">Este mecanismo asegura una distribución equitativa, organizada y digna para las familias.</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-8 pt-8 border-t border-slate-100">
                                    <h5 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
                                        <Map size={18} className="text-[#b91c1c]" />
                                        Ubicación del Evento
                                    </h5>
                                    <p className="text-slate-600 text-sm mb-4">
                                        Centro Deportivo La Esmeralda<br />
                                        Distrito de El Congo · Municipio de Santa Ana Este
                                    </p>
                                    <div className="flex gap-3">
                                        <a href="https://maps.app.goo.gl/Vx7RyMeFCohovQQq7" target="_blank" rel="noreferrer" className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-bold text-slate-700 transition-colors">
                                            Google Maps
                                        </a>
                                        <a href="https://waze.com/ul/hd42r5khv3" target="_blank" rel="noreferrer" className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-xs font-bold transition-colors">
                                            Waze
                                        </a>
                                    </div>
                                </div>
                            </div>

                            <div className="relative h-full min-h-[400px] bg-slate-200 rounded-3xl overflow-hidden shadow-inner">
                                {/* Decor */}
                                <div className="absolute inset-0 bg-slate-900/10 z-10 pointer-events-none"></div>
                                <iframe
                                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15495.346617937398!2d-89.5042!3d13.9114!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8f62e8a1d1d1d1d1%3A0x1234567890abcdef!2sEl%20Congo%2C%20Santa%20Ana!5e0!3m2!1ses-419!2ssv!4v1634567890123!5m2!1ses-419!2ssv"
                                    width="100%"
                                    height="100%"
                                    style={{ border: 0, position: 'absolute', inset: 0 }}
                                    allowFullScreen={true}
                                    loading="lazy"
                                    className="filter grayscale contrast-[0.9]"
                                ></iframe>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            {/* SPONSORS SECTION */}
            <div className="bg-white border-t border-slate-100 py-16">
                <div className="container mx-auto px-4 text-center">
                    <span className="text-[#b91c1c] font-bold tracking-widest uppercase text-xs mb-2 block">Gracias al apoyo de</span>
                    <h2 className="text-2xl font-serif font-bold text-slate-900 mb-12">Nuestros Aliados Empresariales - Lago de Coatepeque</h2>

                    <div className="grid md:grid-cols-4 gap-8">
                        {/* Sponsor 1 */}
                        <div className="group">
                            <div className="h-24 flex items-center justify-center bg-slate-50 border border-slate-100 rounded-xl mb-4 group-hover:border-[#1e4620] transition-colors">
                                <span className="font-serif font-bold text-slate-700">Las Palmeras</span>
                            </div>
                            <div className="flex justify-center gap-3 opacity-60 group-hover:opacity-100 transition-opacity">
                                <a href="https://www.facebook.com/LasPalmerasLagoDeCoatepeque" target="_blank" className="hover:text-blue-600"><Facebook size={16} /></a>
                                <a href="https://www.instagram.com/restaurante_laspalmeras/" target="_blank" className="hover:text-pink-600"><Instagram size={16} /></a>
                            </div>
                        </div>

                        {/* Sponsor 2 */}
                        <div className="group">
                            <div className="h-24 flex items-center justify-center bg-slate-50 border border-slate-100 rounded-xl mb-4 group-hover:border-[#1e4620] transition-colors">
                                <span className="font-serif font-bold text-slate-700">El Faro del Lago</span>
                            </div>
                            <div className="flex justify-center gap-3 opacity-60 group-hover:opacity-100 transition-opacity">
                                <a href="https://www.facebook.com/elfarodellago" target="_blank" className="hover:text-blue-600"><Facebook size={16} /></a>
                                <a href="https://www.instagram.com/restauranteelfarodellago/" target="_blank" className="hover:text-pink-600"><Instagram size={16} /></a>
                            </div>
                        </div>

                        {/* Sponsor 3 */}
                        <div className="group">
                            <div className="h-24 flex items-center justify-center bg-slate-50 border border-slate-100 rounded-xl mb-4 group-hover:border-[#1e4620] transition-colors">
                                <span className="font-serif font-bold text-slate-700">La Octava Maravilla</span>
                            </div>
                            <div className="flex justify-center gap-3 opacity-60 group-hover:opacity-100 transition-opacity">
                                <a href="https://laoctavamaravilla.com/" target="_blank" className="hover:text-emerald-600"><Globe size={16} /></a>
                                <a href="https://www.facebook.com/laoctavamaravillasv" target="_blank" className="hover:text-blue-600"><Facebook size={16} /></a>
                                <a href="https://www.instagram.com/laoctavamaravillasv/" target="_blank" className="hover:text-pink-600"><Instagram size={16} /></a>
                            </div>
                        </div>

                        {/* Sponsor 4 */}
                        <div className="group">
                            <div className="h-24 flex items-center justify-center bg-slate-50 border border-slate-100 rounded-xl mb-4 group-hover:border-[#1e4620] transition-colors">
                                <span className="font-serif font-bold text-slate-700">Rancho Alegre</span>
                            </div>
                            <div className="flex justify-center gap-3 opacity-60 group-hover:opacity-100 transition-opacity">
                                <a href="https://www.facebook.com/rancho.alegre.378" target="_blank" className="hover:text-blue-600"><Facebook size={16} /></a>
                            </div>
                        </div>
                    </div>

                    <p className="max-w-2xl mx-auto mt-12 text-sm text-slate-500 italic">
                        "El apoyo de estos aliados refleja el compromiso del sector empresarial con el desarrollo social y el bienestar de la niñez del distrito de El Congo."
                    </p>
                </div>
            </div>

            {/* FOOTER */}
            <div className="bg-[#1e4620] text-white py-12 text-center text-sm px-4">
                <div className="max-w-4xl mx-auto">
                    <p className="opacity-80 leading-relaxed mb-8">
                        Compartiendo Sonrisas – Gran Entrega de Juguetes 2025 representa el compromiso activo de la Fundación Armando Bukele, bajo la coordinación de Lorena Romero y con el respaldo de los empresarios del Lago de Coatepeque, para construir una comunidad más solidaria.
                    </p>
                    <div className="flex justify-center items-center gap-2 opacity-50 text-xs">
                        <span>© 2025 Fundación Armando Bukele</span>
                        <span>•</span>
                        <span>Todos los derechos reservados</span>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default LandingV2;
