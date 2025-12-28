import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Search, CheckCircle, XCircle } from 'lucide-react';
// TODO: Import real service to fetch guest by code
// import { getGuestByCode, updateGuestRSVP } from '../../../services/guestService';

const RSVPPage: React.FC = () => {
    const { eventId } = useParams();
    const navigate = useNavigate();

    const [ticketCode, setTicketCode] = useState('');
    const [step, setStep] = useState<'search' | 'confirm'>('search');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Mock Data State
    const [guestGroup, setGuestGroup] = useState<any>(null);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        // Simulate API delay
        setTimeout(() => {
            // Mock logic
            if (ticketCode.toUpperCase() === 'BODA-123') {
                setGuestGroup({
                    id: '1',
                    primaryGuestName: 'Familia Pérez',
                    tickets: [
                        { id: 't1', name: 'Juan Pérez', rsvpStatus: 'pending' },
                        { id: 't2', name: 'Maria Pérez', rsvpStatus: 'pending' },
                        { id: 't3', name: 'Pedrito Pérez', rsvpStatus: 'pending' }
                    ]
                });
                setStep('confirm');
            } else {
                setError('Código no encontrado. Por favor verifica tu invitación.');
            }
            setLoading(false);
        }, 1000);
    };

    const handleUpdateStatus = (ticketId: string, status: 'confirmed' | 'declined') => {
        setGuestGroup((prev: any) => ({
            ...prev,
            tickets: prev.tickets.map((t: any) =>
                t.id === ticketId ? { ...t, rsvpStatus: status } : t
            )
        }));
    };

    const handleSubmitRSVP = async () => {
        setLoading(true);
        // Simulate save
        setTimeout(() => {
            alert('¡Gracias! Tu confirmación ha sido guardada.');
            navigate(`/boda/${eventId}`);
        }, 1000);
    };

    return (
        <div className="min-h-screen bg-[#fcfbf9] pt-20 pb-12 px-4">
            <div className="max-w-xl mx-auto bg-white p-8 rounded-xl shadow-xl border border-slate-100">
                <div className="text-center mb-8">
                    <h1 className="font-serif text-3xl text-slate-800 mb-2">Confirmar Asistencia</h1>
                    <p className="text-slate-500">Por favor busca tu invitación para comenzar.</p>
                </div>

                {step === 'search' ? (
                    <form onSubmit={handleSearch} className="space-y-6">
                        <div>
                            <label className="block text-xs font-bold uppercase text-slate-400 mb-2">Código de Ticket (QR)</label>
                            <input
                                type="text"
                                value={ticketCode}
                                onChange={(e) => setTicketCode(e.target.value)}
                                className="w-full text-center text-2xl font-mono p-4 border-2 border-slate-200 rounded-lg focus:border-[#c5a059] outline-none uppercase tracking-widest"
                                placeholder="XXXX-XXXX"
                            />
                        </div>

                        {error && (
                            <div className="text-red-500 text-sm text-center bg-red-50 p-3 rounded-lg">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading || !ticketCode}
                            className="w-full bg-[#1e293b] text-white py-4 rounded-lg font-bold hover:bg-[#2e3b4e] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {loading ? 'Buscando...' : <><Search size={18} /> BUSCAR INVITACIÓN</>}
                        </button>
                    </form>
                ) : (
                    <div className="space-y-8">
                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-center">
                            <h3 className="font-bold text-lg text-slate-800">{guestGroup.primaryGuestName}</h3>
                            <p className="text-sm text-slate-500">Selecciona la asistencia de cada invitado</p>
                        </div>

                        <div className="space-y-4">
                            {guestGroup.tickets.map((t: any) => (
                                <div key={t.id} className="p-4 border border-slate-100 rounded-lg bg-white shadow-sm">
                                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
                                        <span className="font-medium text-slate-700 text-lg">{t.name}</span>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleUpdateStatus(t.id, 'confirmed')}
                                                className={`flex items-center gap-1 px-4 py-2 rounded-full text-sm font-bold transition-colors ${t.rsvpStatus === 'confirmed' ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                                            >
                                                <CheckCircle size={16} /> ASISTIRÉ
                                            </button>
                                            <button
                                                onClick={() => handleUpdateStatus(t.id, 'declined')}
                                                className={`flex items-center gap-1 px-4 py-2 rounded-full text-sm font-bold transition-colors ${t.rsvpStatus === 'declined' ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                                            >
                                                <XCircle size={16} /> NO PODRÉ
                                            </button>
                                        </div>
                                    </div>

                                    {/* Expanded Details for Confirmed Guests */}
                                    {t.rsvpStatus === 'confirmed' && (
                                        <div className="mt-4 pt-4 border-t border-slate-50 grid gap-4 animate-fade-in">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Restricciones Alimentarias</label>
                                                <input
                                                    type="text"
                                                    placeholder="Ej. Vegetariano, Alergia a nueces..."
                                                    className="w-full text-sm p-2 border border-slate-200 rounded-md focus:border-[#c5a059] outline-none"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* General Group Questions */}
                        <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">🎵 ¿Qué canción no puede faltar?</label>
                                <input
                                    type="text"
                                    placeholder="Ej. La Bamba - Ritchie Valens"
                                    className="w-full p-3 border border-slate-200 rounded-lg focus:border-[#c5a059] outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">💌 Mensaje para los Novios</label>
                                <textarea
                                    rows={3}
                                    placeholder="Déjanos tus deseos..."
                                    className="w-full p-3 border border-slate-200 rounded-lg focus:border-[#c5a059] outline-none resize-none"
                                />
                            </div>
                        </div>

                        <button
                            onClick={handleSubmitRSVP}
                            disabled={loading}
                            className="w-full bg-[#c5a059] text-white py-4 rounded-lg font-bold hover:bg-[#b08d4b] transition-colors shadow-lg shadow-orange-900/10"
                        >
                            {loading ? 'Guardando...' : 'CONFIRMAR SELECCIÓN'}
                        </button>

                        <button onClick={() => setStep('search')} className="block w-full text-center text-sm text-slate-400 hover:text-slate-600">
                            Volver a buscar
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RSVPPage;
