import React, { useState, useEffect } from 'react';
import { Send, CheckCircle2, AlertCircle, MapPin, Lock, Loader2, User, Music, Utensils, Heart, Users, Ticket } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { getTotalGuestCount, saveGuestGroup } from '../services/storageService';
import { useConfig } from '../contexts/ConfigContext';
import { MEAL_OPTIONS } from '../types';

const RSVPForm: React.FC = () => {
    const { config } = useConfig();

    const [remainingSlots, setRemainingSlots] = useState<number>(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submittedData, setSubmittedData] = useState<{
        groupId: string;
        name: string;
        count: number;
        whatsappLink: string;
        companions: { id: string; name: string; ticketCode: string; meal?: string }[];
    } | null>(null);

    // Initial State: Primary Guest + 0 Companions by default? Or 1?
    // Let's assume start with just primary guest details, then add companions.
    // Actually, the structure uses 'companions' array. Primary is in root.
    // We can treat Primary as "Companion 0" visually or separate.
    // Let's keep separate: Primary Info + Companions List.
    const [companions, setCompanions] = useState<{ id: string; name: string; ticketCode: string; meal: string }[]>([]);

    const [formData, setFormData] = useState({
        primaryGuestName: '',
        whatsapp: '',
        email: '',
        dietaryRestrictions: '',
        songRequest: '',
        messageToCouple: '' // New nice-to-have
    });

    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchSlots = async () => {
            const slots = await getTotalGuestCount(config.maxGuests);
            setRemainingSlots(slots);
        };
        fetchSlots();
    }, [config.maxGuests]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (error) setError(null);
    };

    const handleCompanionChange = (id: string, field: 'ticketCode' | 'name' | 'meal', value: string) => {
        setCompanions(prev => prev.map(c => {
            if (c.id === id) {
                return {
                    ...c,
                    [field]: field === 'ticketCode' ? value.toUpperCase() : value
                };
            }
            return c;
        }));
        if (error) setError(null);
    };

    const addCompanion = () => {
        setCompanions(prev => [...prev, { id: crypto.randomUUID(), name: '', ticketCode: '', meal: 'Pollo' }]);
    };

    const removeCompanion = (id: string) => {
        setCompanions(prev => prev.filter(c => c.id !== id));
    };

    const validate = (): boolean => {
        if (!formData.primaryGuestName.trim()) {
            setError("Por favor ingresa tu nombre completo.");
            return false;
        }

        if (!formData.whatsapp.trim()) {
            setError("El número de WhatsApp es obligatorio para enviarte la confirmación.");
            return false;
        }

        // Validate Companions
        // It's possible to just register yourself if you are the only one invited?
        // But if you are the Primary, you usually have a ticket too?
        // Our 'GuestGroup' model assumes `companions` are the attendees.
        // Wait, does Primary Guest need a ticket?
        // In the previous model, `children` had tickets. `parent` was just contact.
        // In THIS model, everyone attending needs a seat/ticket.
        // So we should probably treat the Primary Guest as someone who ALSO needs a ticket,
        // OR we just add them to the companions list implicitly?
        // Let's add a "Primary Guest Ticket" field or just force at least 1 companion (yourself).
        // Better UX: "Soy el invitado principal" checkbox in companion list?
        // Simpler: Just ask "Cuantas personas asistirán (incluyéndote)?" and generate rows.

        // Let's require at least 1 person in the group (the primary or someone else).
        if (companions.length === 0) {
            setError("Por favor agrega al menos una persona a la lista de asistencia (puedes ser tú mismo).");
            return false;
        }

        const usedCodes = new Set();
        for (let i = 0; i < companions.length; i++) {
            const c = companions[i];
            if (!c.name.trim()) {
                setError(`El nombre del acompañante #${i + 1} es obligatorio.`);
                return false;
            }
            if (!c.ticketCode.trim()) {
                setError(`El código de ticket para ${c.name || `Acompañante #${i + 1}`} es obligatorio.`);
                return false;
            }

            // Simple format check (flexible for weddings? maybe just not empty)
            if (c.ticketCode.length < 3) {
                setError(`El código de ticket "${c.ticketCode}" parece muy corto.`);
                return false;
            }

            if (usedCodes.has(c.ticketCode)) {
                setError(`El código ${c.ticketCode} está repetido.`);
                return false;
            }
            usedCodes.add(c.ticketCode);
        }

        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        setIsSubmitting(true);
        setError(null);

        try {
            const payload = {
                primaryGuestName: formData.primaryGuestName,
                whatsapp: formData.whatsapp,
                email: formData.email,
                dietaryRestrictions: formData.dietaryRestrictions,
                songRequest: formData.songRequest,
                messageToCouple: formData.messageToCouple,
                companions: companions.map(c => ({
                    id: c.id,
                    fullName: c.name,
                    ticketCode: c.ticketCode,
                    mealPreference: c.meal,
                    status: 'pending' as const
                })),
                timestamp: new Date().toISOString()
            };

            const result = await saveGuestGroup(payload, config.maxGuests);

            if (!result.success) {
                throw new Error(result.message);
            }

            // Update slots
            const slots = await getTotalGuestCount(config.maxGuests);
            setRemainingSlots(slots);

            // WhatsApp Message
            const message = config.whatsappTemplate
                .replace('{name}', formData.primaryGuestName)
                .replace('{count}', companions.length.toString())
                .replace('{invites}', companions.map(c => `${c.name} (${c.ticketCode})`).join('\\n• '))
                .replace('{phone}', config.plannerPhoneNumber);

            const link = `https://wa.me/${config.plannerPhoneNumber}?text=${encodeURIComponent(message)}`;

            setSubmittedData({
                groupId: result.data?.id || 'unknown',
                name: formData.primaryGuestName,
                count: companions.length,
                whatsappLink: link,
                companions: companions
            });

            window.open(link, '_blank');

        } catch (err: any) {
            console.error(err);
            setError(err.message || "Error al enviar la confirmación.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (submittedData) {
        return (
            <div className="max-w-2xl mx-auto my-12 animate-fade-in-up px-6">
                <div className="bg-white border border-[#e6cfa3] rounded-sm shadow-xl overflow-hidden relative">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#c5a059] to-[#e6cfa3]"></div>
                    <div className="p-10 text-center">
                        <div className="w-20 h-20 bg-[#fcfbf9] rounded-full flex items-center justify-center mx-auto mb-6 border border-[#c5a059]">
                            <CheckCircle2 className="w-10 h-10 text-[#c5a059]" />
                        </div>
                        <h2 className="text-4xl mb-4 font-serif text-[#1e293b]">¡Confirmación Recibida!</h2>
                        <p className="text-slate-600 mb-8 font-light">
                            Muchas gracias, <strong>{submittedData.name}</strong>. Hemos reservado lugar para {submittedData.count} persona(s).
                        </p>

                        <div className="space-y-4 mb-8 text-left">
                            {submittedData.companions.map((c, idx) => (
                                <div key={idx} className="flex items-center gap-4 p-4 bg-[#fcfbf9] border border-slate-100 rounded-lg">
                                    <QRCodeCanvas
                                        value={JSON.stringify({ groupId: submittedData.groupId, companionId: c.id, code: c.ticketCode })}
                                        size={64}
                                        fgColor="#1e293b"
                                    />
                                    <div>
                                        <div className="text-xs uppercase tracking-widest text-[#c5a059] font-bold">{c.ticketCode}</div>
                                        <div className="font-serif text-xl">{c.name}</div>
                                        <div className="text-sm text-slate-400">{c.meal}</div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <button
                            onClick={() => window.open(submittedData.whatsappLink, '_blank')}
                            className="bg-[#1e293b] text-white px-8 py-3 rounded-sm font-medium hover:bg-[#0f172a] transition-all flex items-center justify-center gap-2 w-full uppercase tracking-wider text-sm"
                        >
                            <Send size={16} /> Enviar Confirmación a WhatsApp
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (!config.isRsvpOpen || remainingSlots <= 0) {
        return (
            <div className="max-w-md mx-auto my-20 p-8 text-center bg-white shadow-lg border-t-4 border-[#c5a059]">
                <h2 className="text-3xl font-serif text-slate-800 mb-4">Registro Cerrado</h2>
                <p className="text-slate-500">
                    Agradecemos tu interés, pero ya no estamos recibiendo más confirmaciones para este evento.
                </p>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto my-12 bg-white shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[700px]">
            {/* Left Panel: Aesthetic Image / Info */}
            <div className="md:w-1/3 bg-[#1e293b] text-[#fcfbf9] p-10 flex flex-col justify-between relative overflow-hidden">
                <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80')] bg-cover bg-center mix-blend-overlay"></div>

                <div className="relative z-10">
                    <h3 className="text-xl uppercase tracking-[0.2em] mb-2 text-[#c5a059]">RSVP</h3>
                    <h1 className="text-5xl font-serif mb-6 leading-tight">Celebra<br />con<br />Nosotros</h1>
                    <p className="font-light opacity-80 text-lg leading-relaxed">
                        Por favor confirma tu asistencia antes del 1 de Enero para que podamos preparar todo para ti.
                    </p>
                </div>

                <div className="relative z-10 space-y-6 mt-12">
                    <div className="flex items-start gap-4">
                        <MapPin className="text-[#c5a059] mt-1" />
                        <div>
                            <div className="uppercase text-xs tracking-wider opacity-50">Lugar</div>
                            <div className="font-serif text-xl">{config.venueName}</div>
                            <div className="text-sm opacity-70">{config.venueAddress}</div>
                        </div>
                    </div>
                    <div className="flex items-start gap-4">
                        <Utensils className="text-[#c5a059] mt-1" />
                        <div>
                            <div className="uppercase text-xs tracking-wider opacity-50">Cena</div>
                            <div className="font-serif text-xl">3 Tiempos</div>
                            <div className="text-sm opacity-70">Opciones Vegetarianas Disponibles</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Panel: Form */}
            <div className="md:w-2/3 p-8 md:p-12 bg-[#fffcf5]">
                <form onSubmit={handleSubmit} className="space-y-8 max-w-2xl mx-auto">

                    {error && (
                        <div className="p-4 bg-red-50 text-red-800 border-l-4 border-red-500 text-sm flex gap-3">
                            <AlertCircle size={20} />
                            {error}
                        </div>
                    )}

                    {/* Section 1: Contact */}
                    <div className="space-y-6">
                        <h4 className="flex items-center gap-2 text-[#1e293b] font-serif text-2xl border-b border-[#e6cfa3] pb-2">
                            <User className="text-[#c5a059]" size={24} />
                            Datos de Contacto
                        </h4>

                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="md:col-span-2">
                                <label className="block text-xs uppercase tracking-wider text-slate-500 mb-1">Nombre Completo (Organizador del Grupo)</label>
                                <input
                                    type="text"
                                    name="primaryGuestName"
                                    value={formData.primaryGuestName}
                                    onChange={handleChange}
                                    className="w-full bg-white border-b-2 border-[#e6cfa3] p-3 outline-none focus:border-[#c5a059] transition-colors placeholder:font-light font-serif text-lg"
                                    placeholder="Ej. Juan Pérez"
                                />
                            </div>
                            <div>
                                <label className="block text-xs uppercase tracking-wider text-slate-500 mb-1">WhatsApp</label>
                                <input
                                    type="tel"
                                    name="whatsapp"
                                    value={formData.whatsapp}
                                    onChange={handleChange}
                                    className="w-full bg-white border-b-2 border-slate-200 p-3 outline-none focus:border-[#c5a059] transition-colors"
                                    placeholder="0000-0000"
                                />
                            </div>
                            <div>
                                <label className="block text-xs uppercase tracking-wider text-slate-500 mb-1">Email (Opcional)</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="w-full bg-white border-b-2 border-slate-200 p-3 outline-none focus:border-[#c5a059] transition-colors"
                                    placeholder="correo@ejemplo.com"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Companions */}
                    <div className="space-y-6">
                        <h4 className="flex items-center gap-2 text-[#1e293b] font-serif text-2xl border-b border-[#e6cfa3] pb-2">
                            <Users className="text-[#c5a059]" size={24} />
                            Lista de Asistencia
                        </h4>
                        <p className="text-sm text-slate-500 font-light italic">
                            Por favor ingresa los datos de cada persona que asistirá, incluyéndote a ti mismo si aplicas.
                        </p>

                        <div className="space-y-4">
                            {companions.map((comp, idx) => (
                                <div key={comp.id} className="bg-white p-6 shadow-sm border border-slate-100 relative group transition-all hover:shadow-md">
                                    <div className="grid md:grid-cols-12 gap-4">
                                        <div className="md:col-span-1 flex items-center justify-center text-[#c5a059] font-serif text-2xl opacity-30 font-bold">
                                            {idx + 1}
                                        </div>
                                        <div className="md:col-span-5">
                                            <label className="text-[10px] uppercase text-slate-400 block mb-1">Nombre</label>
                                            <input
                                                type="text"
                                                value={comp.name}
                                                onChange={(e) => handleCompanionChange(comp.id, 'name', e.target.value)}
                                                className="w-full border-b border-slate-200 focus:border-[#c5a059] outline-none py-1 font-serif"
                                                placeholder="Nombre Asistente"
                                            />
                                        </div>
                                        <div className="md:col-span-3">
                                            <label className="text-[10px] uppercase text-slate-400 block mb-1">Boleto #</label>
                                            <input
                                                type="text"
                                                value={comp.ticketCode}
                                                onChange={(e) => handleCompanionChange(comp.id, 'ticketCode', e.target.value)}
                                                className="w-full border-b border-slate-200 focus:border-[#c5a059] outline-none py-1 uppercase tracking-widest font-mono text-sm"
                                                placeholder="A001"
                                            />
                                        </div>
                                        <div className="md:col-span-3">
                                            <label className="text-[10px] uppercase text-slate-400 block mb-1">Platillo</label>
                                            <select
                                                value={comp.meal}
                                                onChange={(e) => handleCompanionChange(comp.id, 'meal', e.target.value)}
                                                className="w-full border-b border-slate-200 focus:border-[#c5a059] outline-none py-1 text-sm bg-transparent"
                                            >
                                                {MEAL_OPTIONS.map(m => <option key={m} value={m}>{m}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => removeCompanion(comp.id)}
                                        className="absolute top-2 right-2 text-red-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        &times; Borrar
                                    </button>
                                </div>
                            ))}
                        </div>

                        <button
                            type="button"
                            onClick={addCompanion}
                            className="text-[#c5a059] font-medium text-sm flex items-center gap-2 hover:text-[#a37e36] transition-colors"
                        >
                            + Agregar Asistente
                        </button>
                    </div>

                    {/* Section 3: Details */}
                    <div className="space-y-6 pt-4">
                        <h4 className="flex items-center gap-2 text-[#1e293b] font-serif text-2xl border-b border-[#e6cfa3] pb-2">
                            <Heart className="text-[#c5a059]" size={24} />
                            Detalles Finales
                        </h4>

                        <div>
                            <label className="block text-xs uppercase tracking-wider text-slate-500 mb-2">Restricciones Alimenticias / Alergias</label>
                            <textarea
                                name="dietaryRestrictions"
                                value={formData.dietaryRestrictions}
                                onChange={handleChange}
                                className="w-full bg-slate-50 border border-slate-200 p-3 rounded-sm focus:border-[#c5a059] outline-none h-20 text-sm"
                                placeholder="¿Alguien en tu grupo es alérgico a algo?"
                            ></textarea>
                        </div>

                        <div>
                            <label className="block text-xs uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-2">
                                <Music size={14} /> Canción que no puede faltar
                            </label>
                            <input
                                type="text"
                                name="songRequest"
                                value={formData.songRequest}
                                onChange={handleChange}
                                className="w-full bg-slate-50 border border-slate-200 p-3 rounded-sm focus:border-[#c5a059] outline-none text-sm"
                                placeholder="Artista - Canción"
                            />
                        </div>

                        <div>
                            <label className="block text-xs uppercase tracking-wider text-slate-500 mb-2">Mensaje para los Novios</label>
                            <textarea
                                name="messageToCouple"
                                value={formData.messageToCouple}
                                onChange={handleChange}
                                className="w-full bg-slate-50 border border-slate-200 p-3 rounded-sm focus:border-[#c5a059] outline-none h-20 text-sm"
                                placeholder="Déjales un mensaje de cariño..."
                            ></textarea>
                        </div>
                    </div>

                    <div className="pt-8">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full bg-[#1e293b] text-white py-4 text-lg tracking-widest uppercase hover:bg-[#0f172a] transition-all shadow-xl disabled:opacity-70 flex items-center justify-center gap-3"
                        >
                            {isSubmitting ? <Loader2 className="animate-spin" /> : 'Confirmar Asistencia'}
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
};

export default RSVPForm;
