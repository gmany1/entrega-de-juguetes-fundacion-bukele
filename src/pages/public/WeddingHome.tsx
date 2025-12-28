import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Heart, Calendar, MapPin, Clock } from 'lucide-react';

const WeddingHome: React.FC = () => {
    const { eventId } = useParams();
    // TODO: Fetch event details based on eventId (for now hardcoded/mocked)

    return (
        <div className="animate-fade-in relative pb-20">
            {/* Hero Section */}
            <div className="h-[80vh] bg-slate-900 relative flex items-center justify-center text-center px-4 overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-40"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30"></div>

                <div className="relative z-10 text-white max-w-4xl mx-auto">
                    <p className="font-sans text-[#c5a059] tracking-[0.3em] uppercase text-sm md:text-base mb-6 animate-slide-up">
                        Nos Casamos
                    </p>
                    <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl mb-8 leading-tight animate-slide-up animation-delay-200">
                        Maria & Juan
                    </h1>
                    <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-12 font-light text-lg md:text-xl tracking-wide animate-slide-up animation-delay-400">
                        <div className="flex items-center gap-2">
                            <Calendar className="text-[#c5a059]" size={20} />
                            <span>14 Febrero 2026</span>
                        </div>
                        <div className="hidden md:block w-px h-8 bg-white/30"></div>
                        <div className="flex items-center gap-2">
                            <MapPin className="text-[#c5a059]" size={20} />
                            <span>Jardín de los Sueños</span>
                        </div>
                    </div>

                    <div className="mt-12 animate-slide-up animation-delay-600">
                        <Link
                            to={`/boda/${eventId}/rsvp`}
                            className="bg-[#c5a059] text-white px-8 py-4 rounded-full font-bold tracking-widest hover:bg-[#b08d4b] transition-all hover:scale-105 active:scale-95 inline-block"
                        >
                            CONFIRMAR ASISTENCIA
                        </Link>
                    </div>
                </div>
            </div>

            {/* Our Story / Intro */}
            <div className="container mx-auto px-4 py-24 text-center max-w-3xl">
                <Heart className="mx-auto text-[#c5a059] mb-8" size={32} />
                <h2 className="font-serif text-4xl md:text-5xl text-slate-800 mb-8">Nuestra Historia</h2>
                <p className="text-slate-600 leading-relaxed text-lg font-light">
                    "Desde el primer momento supimos que este día llegaría. Queremos compartir con ustedes el comienzo de nuestra vida juntos en una celebración llena de amor, risas y buenos recuerdos."
                </p>
            </div>

            {/* Details Grid */}
            <div className="bg-[#fcfbf9] py-20 border-y border-[#e6e2d8]">
                <div className="container mx-auto px-4">
                    <div className="grid md:grid-cols-3 gap-12 text-center">
                        <div>
                            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-md border border-[#eee]">
                                <Clock size={24} className="text-[#c5a059]" />
                            </div>
                            <h3 className="font-serif text-2xl text-slate-800 mb-2">Ceremonia</h3>
                            <p className="text-slate-500">4:00 PM</p>
                            <p className="text-slate-500 text-sm mt-2">Capilla Principal</p>
                        </div>
                        <div>
                            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-md border border-[#eee]">
                                <Heart size={24} className="text-[#c5a059]" />
                            </div>
                            <h3 className="font-serif text-2xl text-slate-800 mb-2">Cóctel</h3>
                            <p className="text-slate-500">5:30 PM</p>
                            <p className="text-slate-500 text-sm mt-2">Jardín Central</p>
                        </div>
                        <div>
                            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-md border border-[#eee]">
                                <Calendar size={24} className="text-[#c5a059]" />
                            </div>
                            <h3 className="font-serif text-2xl text-slate-800 mb-2">Recepción</h3>
                            <p className="text-slate-500">7:00 PM - 2:00 AM</p>
                            <p className="text-slate-500 text-sm mt-2">Salón de Baile</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Post-Event Gallery Teaser */}
            <div className="bg-white py-20 text-center">
                <div className="container mx-auto px-4">
                    <h2 className="font-serif text-3xl text-slate-800 mb-6">Recuerdos Inolvidables</h2>
                    <p className="text-slate-500 max-w-2xl mx-auto mb-8">
                        Después de la celebración, revive cada momento. La galería oficial estará disponible aquí.
                    </p>
                    <button className="border-2 border-[#1e293b] text-[#1e293b] px-8 py-3 rounded-full font-bold hover:bg-[#1e293b] hover:text-white transition-colors uppercase tracking-widest text-sm">
                        Ver Galería (Pronto)
                    </button>
                </div>
            </div>
        </div>
    );
};

export default WeddingHome;
