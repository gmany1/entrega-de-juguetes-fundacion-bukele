import React, { useState, useEffect } from 'react';
import { Send, CheckCircle2, AlertCircle, MapPin, Lock, Loader2, User, Phone, Ticket, Calendar, Users } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { getRemainingSlots, saveRegistration } from '../services/storageService';
import { useConfig } from '../contexts/ConfigContext';

const RegistrationFormV2: React.FC = () => {
    const { config } = useConfig();

    const downloadVCard = () => {
        // Construct vCard 3.0 string
        const vCardData = [
            'BEGIN:VCARD',
            'VERSION:3.0',
            `FN:${config.vCardName}`,
            `TEL;TYPE=CELL,VOICE:${config.vCardPhone}`,
            'END:VCARD'
        ].join('\n');

        const blob = new Blob([vCardData], { type: 'text/vcard;charset=utf-8' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'contacto_fundacion.vcf');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    const [remainingSlots, setRemainingSlots] = useState<number>(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submittedData, setSubmittedData] = useState<{
        parentId: string;
        name: string;
        count: number;
        whatsappLink: string;
        children: { id: string; name: string; inviteNumber: string; age: number; gender: string }[];
    } | null>(null);

    // New state for children list
    const [children, setChildren] = useState([{ id: crypto.randomUUID(), name: '', inviteNumber: '', gender: 'Niño', age: '' }]);

    const [formData, setFormData] = useState({
        fullName: '',
        whatsapp: '',
        ticketDistributor: '',
        department: config.defaultDepartment,
        municipality: config.defaultMunicipality,
        district: config.defaultDistrict,
        addressDetails: ''
    });

    // Update form defaults when config changes
    useEffect(() => {
        setFormData(prev => ({
            ...prev,
            department: config.defaultDepartment,
            municipality: config.defaultMunicipality,
            district: config.defaultDistrict,
        }));
    }, [config.defaultDepartment, config.defaultMunicipality, config.defaultDistrict]);

    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchSlots = async () => {
            const slots = await getRemainingSlots(config.maxRegistrations);
            setRemainingSlots(slots);
        };
        fetchSlots();
    }, [config.maxRegistrations]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (error) setError(null);
    };

    const handleChildChange = (id: string, field: 'inviteNumber' | 'gender' | 'age' | 'name', value: string) => {
        setChildren(prev => prev.map(child => {
            if (child.id === id) {
                return {
                    ...child,
                    [field]: field === 'inviteNumber' ? value.toUpperCase() : value
                };
            }
            return child;
        }));
        if (error) setError(null);
    };

    const addChild = () => {
        setChildren(prev => [...prev, { id: crypto.randomUUID(), name: '', inviteNumber: '', gender: 'Niño', age: '' }]);
    };

    const removeChild = (id: string) => {
        if (children.length > 1) {
            setChildren(prev => prev.filter(c => c.id !== id));
        }
    };

    const validate = (): boolean => {
        if (!formData.fullName.trim()) {
            setError("El nombre completo es obligatorio.");
            return false;
        }

        if (!formData.whatsapp.trim()) {
            setError("El número de WhatsApp es obligatorio.");
            return false;
        }
        if (!/^\d{8,}$/.test(formData.whatsapp.replace(/\D/g, ''))) {
            setError("Ingresa un número de teléfono válido (mínimo 8 dígitos).");
            return false;
        }

        if (!formData.ticketDistributor && config.ticketDistributors && config.ticketDistributors.length > 0) {
            setError("Debes seleccionar quién te entregó los tickets.");
            return false;
        }

        if (!formData.addressDetails.trim()) {
            setError("Debes especificar tu colonia, caserío o cantón.");
            return false;
        }

        // Validate Children
        const inviteRegex = /^NI(\d{4})$/i;
        const usedInvites = new Set();

        for (let i = 0; i < children.length; i++) {
            const child = children[i];
            if (!child.inviteNumber.trim()) {
                setError(`El número de invitación es obligatorio para el niño #${i + 1}.`);
                return false;
            }

            const match = child.inviteNumber.trim().match(inviteRegex);
            if (!match) {
                setError(`La invitación "${child.inviteNumber}" (Niño #${i + 1}) debe tener el formato NIxxxx (ej. NI0001).`);
                return false;
            }

            const inviteNum = parseInt(match[1], 10);
            if (inviteNum < 1 || inviteNum > 1000) {
                setError(`La invitación "${child.inviteNumber}" debe estar entre NI0001 y NI1000.`);
                return false;
            }

            // Distributor Range Validation
            if (formData.ticketDistributor && config.ticketDistributors) {
                const distributor = config.ticketDistributors.find(d => d.name === formData.ticketDistributor);
                if (distributor && distributor.startRange && distributor.endRange) {
                    if (inviteNum < distributor.startRange || inviteNum > distributor.endRange) {
                        setError(`La invitación "${child.inviteNumber}" no pertenece a ${distributor.name}. Su rango asignado es del TI${distributor.startRange.toString().padStart(4, '0')} al TI${distributor.endRange.toString().padStart(4, '0')}.`);
                        return false;
                    }
                }
            }

            if (usedInvites.has(child.inviteNumber.trim())) {
                setError(`La invitación "${child.inviteNumber}" está duplicada en este formulario.`);
                return false;
            }
            usedInvites.add(child.inviteNumber.trim());

            // Age validation
            if (!child.age || child.age.trim() === '') {
                setError(`Debes ingresar la edad del niño/a #${i + 1}.`);
                return false;
            }
            const ageNum = parseInt(child.age, 10);
            if (isNaN(ageNum) || ageNum < 0) {
                setError(`La edad del niño/a #${i + 1} no es válida.`);
                return false;
            }
            if (ageNum > 12) {
                setError(`El niño/a #${i + 1} tiene ${ageNum} años. La edad máxima permitida es 12 años.`);
                return false;
            }
        }

        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        setIsSubmitting(true);
        setError(null);

        try {
            // Prepare payload with new structure
            const registrationPayload = {
                parentName: formData.fullName,
                whatsapp: formData.whatsapp,
                ticketDistributor: formData.ticketDistributor,
                department: formData.department,
                municipality: formData.municipality,
                district: formData.district,
                addressDetails: formData.addressDetails,
                children: children.map((c, index) => ({
                    id: c.id,
                    fullName: c.name || `Menor ${index + 1}`,
                    age: parseInt(c.age, 10),
                    gender: c.gender,
                    inviteNumber: c.inviteNumber,
                    status: 'pending' as const
                })),
                fullName: formData.fullName,
                childCount: children.length
            };

            const result = await saveRegistration(registrationPayload, config.maxRegistrations);

            if (!result.success) {
                throw new Error(result.message);
            }

            // Refresh slots
            const slots = await getRemainingSlots(config.maxRegistrations);
            setRemainingSlots(slots);

            // Generate WhatsApp Link
            const message = config.whatsappTemplate
                .replace('{name}', formData.fullName)
                .replace('{count}', children.length.toString())
                .replace('{invites}', children.map(c => `${c.inviteNumber} (${c.name})`).join('\\n• '))
                // Contact variables
                .replace('{phone}', config.vCardPhone)
                .replace('{contactName}', config.vCardName)
                // Fallback for old templates
                .replace('{gender}', children.length > 1 ? 'niños' : 'niño/a')
                .replace('{date}', config.eventDate);

            const link = `https://wa.me/${config.orgPhoneNumber}?text=${encodeURIComponent(message)}`;

            // Handle success state
            setSubmittedData({
                parentId: result.data?.id || 'unknown',
                name: formData.fullName,
                count: children.length,
                whatsappLink: link,
                children: children.map(c => ({
                    id: c.id,
                    name: c.name,
                    inviteNumber: c.inviteNumber,
                    age: parseInt(c.age),
                    gender: c.gender
                }))
            });

            // Try to auto-open (best effort)
            window.open(link, '_blank');

        } catch (err: any) {
            console.error(err);
            setError(err.message || "Error de conexión.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (submittedData) {
        const handleCombinedAction = () => {
            downloadVCard();
            setTimeout(() => {
                window.open(submittedData.whatsappLink, '_blank');
            }, 300);
        };

        return (
            <div className="max-w-3xl mx-auto my-8 animate-fade-in-up px-4">
                <div className="bg-white/95 backdrop-blur-sm border border-green-200 rounded-3xl shadow-2xl overflow-hidden">
                    <div className="bg-[#1e4620] p-8 text-center text-white relative overflow-hidden">
                        {/* Decor */}
                        <div className="absolute top-0 left-0 w-32 h-32 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
                        <div className="absolute bottom-0 right-0 w-48 h-48 bg-white/5 rounded-full translate-x-1/3 translate-y-1/3"></div>

                        <div className="bg-white/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-md border border-white/20">
                            <CheckCircle2 className="w-10 h-10 text-white" />
                        </div>
                        <h2 className="text-3xl font-bold mb-2 font-serif">¡Registro Exitoso!</h2>
                        <p className="text-green-50 opacity-90 max-w-md mx-auto">
                            Gracias <strong>{submittedData.name}</strong>. Hemos procesado correctamente el registro para {submittedData.count} niño(s).
                        </p>
                    </div>

                    <div className="p-8 space-y-8">
                        <div className="grid gap-4">
                            {submittedData.children.map((child, idx) => (
                                <div key={idx} className="bg-slate-50 p-5 rounded-2xl border border-slate-200 flex items-center gap-5 relative overflow-hidden">
                                    <div className="bg-white p-2 rounded-xl border border-slate-100 shadow-sm shrink-0">
                                        <QRCodeCanvas
                                            value={JSON.stringify({
                                                parentId: submittedData.parentId,
                                                childId: child.id,
                                                invite: child.inviteNumber
                                            })}
                                            size={90}
                                            level={"H"}
                                        />
                                    </div>
                                    <div className="flex-grow">
                                        <div className="text-xs font-bold text-[#b91c1c] uppercase tracking-widest mb-1 bg-red-50 inline-block px-2 py-0.5 rounded-full border border-red-100">Ticket #{child.inviteNumber}</div>
                                        <div className="font-bold text-slate-900 text-xl font-serif">{child.name || "Sin Nombre"}</div>
                                        <div className="text-sm text-slate-500 mt-1 flex items-center gap-4">
                                            <span className="flex items-center gap-1"><Users size={14} /> {child.age} Años</span>
                                            <span className="flex items-center gap-1"><User size={14} /> {child.gender}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-2xl border border-green-100 text-center">
                            <p className="text-slate-700 font-medium mb-4">
                                Para finalizar, confirma tu asistencia en WhatsApp y guarda nuestro contacto.
                            </p>

                            <div className="flex flex-col gap-3 max-w-md mx-auto">
                                <button
                                    onClick={handleCombinedAction}
                                    className="w-full py-4 bg-[#1e4620] hover:bg-[#163318] text-white rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-3 transition-transform active:scale-[0.98]"
                                >
                                    <Send className="w-5 h-5" />
                                    Confirmar en WhatsApp
                                </button>
                            </div>
                        </div>

                        <button
                            onClick={() => window.location.reload()}
                            className="w-full py-2 text-slate-400 font-medium hover:text-slate-600 transition-colors text-sm"
                        >
                            Registrar otra familia
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const isClosed = !config.isRegistrationOpen || remainingSlots <= 0;

    if (isClosed) {
        return (
            <div className="max-w-2xl mx-auto my-12 p-12 bg-white/90 backdrop-blur rounded-3xl text-center shadow-xl">
                <div className="flex justify-center mb-6">
                    {remainingSlots <= 0 ? (
                        <div className="bg-red-100 p-4 rounded-full"><AlertCircle className="w-12 h-12 text-red-600" /></div>
                    ) : (
                        <div className="bg-slate-100 p-4 rounded-full"><Lock className="w-12 h-12 text-slate-500" /></div>
                    )}
                </div>
                <h2 className="text-3xl font-bold text-slate-800 mb-4 font-serif">
                    {remainingSlots <= 0 ? "Cupos Agotados" : "Registro Cerrado"}
                </h2>
                <p className="text-slate-600 text-lg">
                    {remainingSlots <= 0
                        ? "Hemos alcanzado el límite máximo de registros para esta entrega."
                        : "El formulario de registro no está disponible en este momento."}
                </p>
            </div>
        );
    }

    return (
        <div className="w-full max-w-6xl mx-auto rounded-3xl shadow-2xl overflow-hidden bg-white mb-20 relative z-20">
            <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[600px]">

                {/* Left Column - Green Side */}
                <div className="lg:col-span-5 bg-[#1e4620] p-8 md:p-12 text-white flex flex-col justify-between relative overflow-hidden">
                    {/* Background Decorations */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full translate-x-1/2 -translate-y-1/2"></div>
                    <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/5 rounded-full -translate-x-1/3 translate-y-1/3"></div>

                    <div className="relative z-10">
                        <div className="bg-white/10 w-fit px-3 py-1 rounded-full text-xs font-bold tracking-wider mb-6 border border-white/10 uppercase">
                            Inscripciones Abiertas
                        </div>
                        <h2 className="text-3xl md:text-4xl font-bold font-serif leading-tight mb-6">
                            Registro de Beneficiarios
                        </h2>
                        <p className="text-green-50/80 mb-8 leading-relaxed">
                            Utiliza este formulario exclusivamente para inscribir a niños y niñas (de 0 a 12 años) para recibir su juguete en nuestra gran entrega.
                        </p>

                        <div className="bg-white/10 rounded-2xl p-6 backdrop-blur-sm border border-white/5">
                            <h4 className="font-bold flex items-center gap-2 mb-4 text-[#fbbf24]">
                                <AlertCircle size={20} /> Requisitos:
                            </h4>
                            <ul className="space-y-3 text-sm text-green-50">
                                <li className="flex items-start gap-2">
                                    <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-white/70" />
                                    El registro es por NIÑO.
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-white/70" />
                                    Edad máxima: 12 años.
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-white/70" />
                                    Presentar QR de responsable.
                                </li>
                            </ul>
                        </div>
                    </div>

                    <div className="mt-8 relative z-10 opacity-50">
                        {/* Decorative Car Icon or similar */}
                        <svg className="w-24 h-24 mx-auto" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z" />
                        </svg>
                    </div>
                </div>

                {/* Right Column - Form */}
                <div className="lg:col-span-7 bg-white p-8 md:p-12">
                    <div className="flex items-center gap-2 mb-8 text-[#1e4620]">
                        <User size={20} />
                        <h3 className="text-xl font-bold">Datos del Responsable</h3>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="bg-red-50 text-red-700 p-4 rounded-xl text-sm flex items-start gap-3 border border-red-200">
                                <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="md:col-span-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5 block">Nombre Completo</label>
                                <input
                                    type="text"
                                    name="fullName"
                                    value={formData.fullName}
                                    onChange={handleChange}
                                    placeholder="Escribe tu nombre completo"
                                    className="w-full px-4 py-3 bg-slate-50 border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#1e4620] focus:border-transparent outline-none transition-all"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5 block">Teléfono / WhatsApp</label>
                                <input
                                    type="tel"
                                    name="whatsapp"
                                    value={formData.whatsapp}
                                    onChange={handleChange}
                                    placeholder="0000-0000"
                                    className="w-full px-4 py-3 bg-slate-50 border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#1e4620] focus:border-transparent outline-none transition-all"
                                />
                            </div>
                        </div>

                        {/* Distributor */}
                        {config.ticketDistributors && config.ticketDistributors.length > 0 && (
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5 block">¿Quién entregó los tickets?</label>
                                <select
                                    name="ticketDistributor"
                                    value={formData.ticketDistributor}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-slate-50 border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#1e4620] focus:border-transparent outline-none transition-all appearance-none"
                                >
                                    <option value="">-- Seleccione un distribuidor --</option>
                                    {config.ticketDistributors.map((dist, idx) => (
                                        <option key={idx} value={dist.name}>{dist.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Location (Simplified visual) */}
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5 block">Colonia / Caserío / Cantón</label>
                            <input
                                type="text"
                                name="addressDetails"
                                value={formData.addressDetails}
                                onChange={handleChange}
                                placeholder="Detalla tu ubicación exacta"
                                className="w-full px-4 py-3 bg-slate-50 border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#1e4620] focus:border-transparent outline-none transition-all"
                            />
                            <div className="flex gap-2 mt-2 text-xs text-slate-400">
                                <span className="flex items-center gap-1"><MapPin size={10} /> {formData.department}</span>
                                <span>•</span>
                                <span>{formData.municipality}</span>
                            </div>
                        </div>

                        <div className="border-t border-dashed border-slate-200 my-8"></div>

                        <div className="flex items-center gap-2 mb-6 text-[#b91c1c]">
                            <Ticket size={20} />
                            <h3 className="text-xl font-bold">Datos del Niño o Niña</h3>
                        </div>

                        <div className="space-y-6">
                            {children.map((child, index) => (
                                <div key={child.id} className="relative group">
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div className="md:col-span-2">
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5 block">Nombre del niño/a</label>
                                            <input
                                                type="text"
                                                value={child.name}
                                                onChange={(e) => handleChildChange(child.id, 'name', e.target.value)}
                                                placeholder="Nombre completo del menor"
                                                className="w-full px-4 py-3 bg-slate-50 border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#b91c1c] focus:border-transparent outline-none transition-all"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5 block">Edad (Años)</label>
                                            <input
                                                type="number"
                                                value={child.age}
                                                onChange={(e) => handleChildChange(child.id, 'age', e.target.value)}
                                                placeholder="0-12"
                                                className="w-full px-4 py-3 bg-slate-50 border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#b91c1c] focus:border-transparent outline-none transition-all"
                                            />
                                        </div>
                                        <div className="relative">
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5 block">Número de Ticket</label>
                                            <div className="relative">
                                                <Ticket className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                                <input
                                                    type="text"
                                                    value={child.inviteNumber}
                                                    onChange={(e) => handleChildChange(child.id, 'inviteNumber', e.target.value)}
                                                    placeholder="NI0000"
                                                    className="w-full py-3 pl-10 pr-4 bg-slate-50 border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#b91c1c] focus:border-transparent outline-none transition-all font-mono"
                                                />
                                            </div>
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5 block">Género</label>
                                            <div className="flex gap-4">
                                                <label className={`flex-1 py-3 px-4 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-center gap-2 ${child.gender === 'Niño' ? 'border-[#1e4620] bg-green-50 text-[#1e4620]' : 'border-slate-100 hover:border-slate-300'}`}>
                                                    <input type="radio" name={`g-${child.id}`} value="Niño" checked={child.gender === 'Niño'} onChange={(e) => handleChildChange(child.id, 'gender', e.target.value)} className="hidden" />
                                                    <span className="font-semibold">Niño</span>
                                                </label>
                                                <label className={`flex-1 py-3 px-4 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-center gap-2 ${child.gender === 'Niña' ? 'border-pink-500 bg-pink-50 text-pink-700' : 'border-slate-100 hover:border-slate-300'}`}>
                                                    <input type="radio" name={`g-${child.id}`} value="Niña" checked={child.gender === 'Niña'} onChange={(e) => handleChildChange(child.id, 'gender', e.target.value)} className="hidden" />
                                                    <span className="font-semibold">Niña</span>
                                                </label>
                                            </div>
                                        </div>
                                    </div>

                                    {children.length > 1 && (
                                        <button type="button" onClick={() => removeChild(child.id)} className="absolute -top-3 -right-3 bg-red-100 text-red-500 p-1 rounded-full shadow-sm hover:bg-red-200">
                                            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                                        </button>
                                    )}
                                </div>
                            ))}

                            <button type="button" onClick={addChild} className="text-sm font-semibold text-[#b91c1c] hover:text-red-800 flex items-center gap-1 active:scale-95 transition-transform">
                                + Agregar otro niño
                            </button>
                        </div>

                        <div className="pt-6">
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full py-4 rounded-xl bg-[#b91c1c] hover:bg-[#991b1b] text-white font-bold text-lg shadow-xl shadow-red-900/10 transition-all hover:-translate-y-1 active:scale-[0.99] flex items-center justify-center gap-3"
                            >
                                {isSubmitting ? <Loader2 className="animate-spin" /> : <Send size={20} />}
                                REGISTRAR AHORA
                            </button>
                            <p className="text-center text-[10px] text-slate-400 mt-4 uppercase tracking-widest">
                                Al completar este formulario aceptas nuestra política de privacidad
                            </p>
                        </div>

                    </form>
                </div>
            </div>
        </div>
    );
};

export default RegistrationFormV2;
