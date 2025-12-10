```
import React, { useState, useEffect } from 'react';
import { Download, Settings, Type, Image as ImageIcon, MessageSquare, Database, X, RotateCcw, Lock, User, Key, Sparkles, Upload, Loader2, ArrowRight, BarChart3 } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';
import * as XLSX from 'xlsx';
import { GoogleGenAI } from "@google/genai";
import { getRegistrations } from '../services/storageService';
import { useConfig } from '../contexts/ConfigContext';
import { AppConfig, DEPARTMENTS } from '../types';

const AdminPanel: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);

    // Auth State
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loginError, setLoginError] = useState('');

    const [activeTab, setActiveTab] = useState<'general' | 'hero' | 'content' | 'whatsapp' | 'data' | 'stats'>('general');
    const { config, updateConfig, resetConfig } = useConfig();

    const [registrationCount, setRegistrationCount] = useState(0);
    const [registrations, setRegistrations] = useState<any[]>([]);

    useEffect(() => {
        if (isAuthenticated) {
            getRegistrations().then(regs => {
                setRegistrationCount(regs.length);
                setRegistrations(regs);
            });
        }
    }, [isAuthenticated, isOpen]);
    // AI Generation State
    const [aiPrompt, setAiPrompt] = useState('');
    const [aiSourceImage, setAiSourceImage] = useState<string | null>(null);
    const [aiGeneratedImage, setAiGeneratedImage] = useState<string | null>(null);
    const [aiLoading, setAiLoading] = useState(false);
    const [aiError, setAiError] = useState<string | null>(null);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (username.trim() === 'jorge' && password.trim() === '79710214') {
            setIsAuthenticated(true);
            setLoginError('');
        } else {
            setLoginError('Credenciales incorrectas. Intente nuevamente.');
        }
    };

    const handleExport = async (type: 'xlsx' | 'csv') => {
        const data = await getRegistrations();
        if (data.length === 0) {
            alert("No hay registros para exportar.");
            return;
        }

        const exportData = data.map(row => ({
            "Nombre Completo": row.fullName,
            "No. Invitación": row.inviteNumber,
            "WhatsApp": row.whatsapp,
            "Cantidad Niños": row.childCount,
            "Género": row.genderSelection,
            "Departamento": row.department,
            "Municipio": row.municipality,
            "Distrito": row.district || "N/A",
            "Dirección Detallada": row.addressDetails || "N/A",
            "Fecha Registro": new Date(row.timestamp).toLocaleString('es-SV')
        }));

        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Registros");

        const fileName = `EntregaJuguetes_Registros_${ new Date().toISOString().split('T')[0] } `;

        if (type === 'xlsx') {
            XLSX.writeFile(workbook, `${ fileName }.xlsx`);
        } else {
            XLSX.writeFile(workbook, `${ fileName }.csv`);
        }
    };

    const handleInputChange = (field: keyof AppConfig, value: any) => {
        updateConfig({ [field]: value });
    };

    // AI Image Helpers
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setAiSourceImage(reader.result as string);
                setAiGeneratedImage(null); // Reset generated image when new source is uploaded
            };
            reader.readAsDataURL(file);
        }
    };

    const handleGenerateImage = async () => {
        if (!process.env.API_KEY) {
            setAiError("API Key no configurada en el entorno.");
            return;
        }
        if (!aiPrompt.trim()) {
            setAiError("Por favor ingresa una descripción para la IA.");
            return;
        }

        setAiLoading(true);
        setAiError(null);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const parts: any[] = [];

            // If a source image exists, add it to the parts for editing
            if (aiSourceImage) {
                const base64Data = aiSourceImage.split(',')[1];
                // Basic detection of mime type from data URI
                const mimeType = aiSourceImage.match(/[^:]\w+\/[\w-+\d.]+(?=;|,)/)?.[0] || 'image/png';

                parts.push({
                    inlineData: {
                        mimeType: mimeType,
                        data: base64Data
                    }
                });
            }

            parts.push({ text: aiPrompt });

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: { parts }
            });

            let foundImage = false;
            const candidates = response.candidates;
            if (candidates && candidates[0].content && candidates[0].content.parts) {
                for (const part of candidates[0].content.parts) {
                    if (part.inlineData) {
                        const imgUrl = `data:${ part.inlineData.mimeType }; base64, ${ part.inlineData.data } `;
                        setAiGeneratedImage(imgUrl);
                        foundImage = true;
                        break;
                    }
                }
            }

            if (!foundImage) {
                // Check for text refusal or error
                const textPart = candidates?.[0]?.content?.parts?.find(p => p.text);
                if (textPart) {
                    setAiError(`El modelo respondió solo con texto: ${ textPart.text } `);
                } else {
                    setAiError("No se pudo generar la imagen. Intenta con otro prompt.");
                }
            }

        } catch (e: any) {
            console.error("AI Generation Error", e);
            setAiError(`Error al generar imagen: ${ e.message } `);
        } finally {
            setAiLoading(false);
        }
    };

    const applyGeneratedImage = () => {
        if (aiGeneratedImage) {
            handleInputChange('heroBackgroundImage', aiGeneratedImage);
            alert("Imagen aplicada al fondo exitosamente.");
        }
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 left-6 z-50 bg-slate-800 text-white p-3 rounded-full shadow-lg hover:bg-slate-700 transition-all opacity-50 hover:opacity-100"
                title="Panel Administrativo"
            >
                <Settings className="w-6 h-6" />
            </button>
        );
    }

    return (
        <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-0 md:p-4">
            <div className="bg-white w-full h-full md:max-w-6xl md:h-[90vh] rounded-none md:rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all">

                {/* Header */}
                <div className="bg-slate-800 text-white px-4 md:px-6 py-4 flex justify-between items-center flex-shrink-0">
                    <h2 className="text-lg md:text-xl font-bold flex items-center gap-2">
                        <Settings className="w-5 h-5" />
                        Panel Administrativo
                    </h2>
                    <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content Body */}
                {!isAuthenticated ? (
                    /* Login Screen */
                    <div className="flex-grow flex flex-col items-center justify-center bg-slate-50 p-4">
                        <div className="bg-white p-8 rounded-xl shadow-lg border border-slate-200 w-full max-w-md">
                            <div className="flex justify-center mb-6">
                                <div className="bg-blue-100 p-3 rounded-full">
                                    <Lock className="w-8 h-8 text-blue-600" />
                                </div>
                            </div>
                            <h3 className="text-2xl font-bold text-center text-slate-800 mb-2">Acceso Restringido</h3>
                            <p className="text-center text-slate-500 mb-6">Ingresa tus credenciales para administrar el sistema.</p>

                            <form onSubmit={handleLogin} className="space-y-4">
                                {loginError && (
                                    <div className="bg-red-50 text-red-600 text-sm p-3 rounded border border-red-200 text-center">
                                        {loginError}
                                    </div>
                                )}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Usuario</label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
                                        <input
                                            type="text"
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                            placeholder="Usuario"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Contraseña</label>
                                    <div className="relative">
                                        <Key className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
                                        <input
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                            placeholder="Contraseña"
                                        />
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors mt-2"
                                >
                                    Ingresar
                                </button>
                            </form>
                        </div>
                    </div>
                ) : (
                    /* Authenticated Dashboard */
                    <div className="flex flex-col md:flex-row flex-grow overflow-hidden">

                        {/* Sidebar Tabs */}
                        <div className="w-64 bg-slate-100 border-r border-slate-200 overflow-y-auto hidden md:block">
                            <div className="p-4 space-y-2">
                                <TabButton active={activeTab === 'general'} onClick={() => setActiveTab('general')} icon={<Settings size={18} />} label="General" />
                                <TabButton active={activeTab === 'hero'} onClick={() => setActiveTab('hero')} icon={<ImageIcon size={18} />} label="Hero & Estilo" />
                                <TabButton active={activeTab === 'content'} onClick={() => setActiveTab('content')} icon={<Type size={18} />} label="Contenido" />
                                <TabButton active={activeTab === 'whatsapp'} onClick={() => setActiveTab('whatsapp')} icon={<MessageSquare size={18} />} label="WhatsApp & Ubicación" />
                                <TabButton active={activeTab === 'data'} onClick={() => setActiveTab('data')} icon={<Database size={18} />} label="Base de Datos" />
                            </div>
                            <div className="p-4 mt-auto border-t border-slate-200 space-y-2">
                                <button
                                    onClick={() => setIsAuthenticated(false)}
                                    className="flex items-center gap-2 text-xs text-slate-600 hover:text-slate-800 w-full px-4 py-2 hover:bg-slate-200 rounded"
                                >
                                    <Lock size={14} /> Cerrar Sesión
                                </button>
                                <button
                                    onClick={() => { if (confirm("¿Restaurar toda la configuración de fábrica?")) resetConfig(); }}
                                    className="flex items-center gap-2 text-xs text-red-600 hover:text-red-800 w-full px-4 py-2 hover:bg-red-50 rounded"
                                >
                                    <RotateCcw size={14} /> Restaurar Defaults
                                </button>
                            </div>
                        </div>

                        {/* Mobile Tabs (Horizontal) */}
                        <div className="md:hidden w-full overflow-x-auto flex border-b border-slate-200 bg-slate-50 flex-shrink-0">
                            <TabButtonMobile active={activeTab === 'general'} onClick={() => setActiveTab('general')} icon={<Settings size={18} />} />
                            <TabButtonMobile active={activeTab === 'hero'} onClick={() => setActiveTab('hero')} icon={<ImageIcon size={18} />} />
                            <TabButtonMobile active={activeTab === 'content'} onClick={() => setActiveTab('content')} icon={<Type size={18} />} />
                            <TabButtonMobile active={activeTab === 'whatsapp'} onClick={() => setActiveTab('whatsapp')} icon={<MessageSquare size={18} />} />
                            <TabButtonMobile active={activeTab === 'data'} onClick={() => setActiveTab('data')} icon={<Database size={18} />} />
                        </div>

                        {/* Content Area */}
                        <div className="flex-grow p-6 overflow-y-auto bg-slate-50">

                            {activeTab === 'general' && (
                                <div className="space-y-6 animate-fade-in">
                                    <SectionHeader title="Configuración General" description="Controla el estado principal del evento." />

                                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <label className="font-semibold text-slate-700">Estado del Registro</label>
                                                <p className="text-xs text-slate-500">Activa o desactiva el formulario manualmente.</p>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={config.isRegistrationOpen}
                                                    onChange={(e) => handleInputChange('isRegistrationOpen', e.target.checked)}
                                                    className="sr-only peer"
                                                />
                                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                            </label>
                                        </div>

                                        <hr className="border-slate-100" />

                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Límite Máximo de Registros</label>
                                            <input
                                                type="number"
                                                value={config.maxRegistrations}
                                                onChange={(e) => handleInputChange('maxRegistrations', Number(e.target.value))}
                                                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                                            />
                                            <p className="text-xs text-slate-500 mt-1">
                                                Actualmente hay {registrationCount} registros. Si bajas el límite por debajo de este número, se cerrará el registro.
                                            </p>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Fecha del Evento (Texto)</label>
                                            <input
                                                type="text"
                                                value={config.eventDate}
                                                onChange={(e) => handleInputChange('eventDate', e.target.value)}
                                                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'hero' && (
                                <div className="space-y-6 animate-fade-in">
                                    <SectionHeader title="Sección Hero & Estilos" description="Personaliza la primera impresión de la página." />

                                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                                        <InputGroup label="Título Principal" value={config.heroTitle} onChange={(v) => handleInputChange('heroTitle', v)} />
                                        <InputGroup label="Subtítulo" value={config.heroSubtitle} onChange={(v) => handleInputChange('heroSubtitle', v)} />

                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">URL Imagen de Fondo (Manual)</label>
                                            <input
                                                type="text"
                                                value={config.heroBackgroundImage}
                                                onChange={(e) => handleInputChange('heroBackgroundImage', e.target.value)}
                                                placeholder="https://ejemplo.com/imagen.jpg"
                                                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                                            />
                                        </div>
                                    </div>

                                    {/* AI Editor Section */}
                                    <div className="bg-gradient-to-r from-violet-50 to-blue-50 p-6 rounded-xl border border-violet-100 shadow-sm">
                                        <div className="flex items-center gap-2 mb-4">
                                            <div className="bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white p-2 rounded-lg">
                                                <Sparkles size={20} />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-slate-800">Editor de Fondo con IA</h4>
                                                <p className="text-xs text-slate-500">Impulsado por Gemini 2.5 Flash Image</p>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-slate-700 mb-2">1. Imagen Base (Opcional)</label>
                                                    <div className="flex items-center gap-2">
                                                        <label className="cursor-pointer flex items-center justify-center gap-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-600 px-4 py-2 rounded-lg text-sm w-full transition-colors">
                                                            <Upload size={16} />
                                                            Subir Imagen
                                                            <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                                                        </label>
                                                    </div>
                                                    {aiSourceImage && (
                                                        <div className="mt-2 relative group rounded-lg overflow-hidden border border-slate-200 h-32 bg-slate-100">
                                                            <img src={aiSourceImage} alt="Source" className="w-full h-full object-cover" />
                                                            <button
                                                                onClick={() => setAiSourceImage(null)}
                                                                className="absolute top-1 right-1 bg-black/50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                                            >
                                                                <X size={14} />
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-slate-700 mb-2">2. Instrucción (Prompt)</label>
                                                    <textarea
                                                        value={aiPrompt}
                                                        onChange={(e) => setAiPrompt(e.target.value)}
                                                        placeholder="Ej: Añade decoraciones navideñas y luces cálidas."
                                                        className="w-full h-[88px] px-3 py-2 border border-slate-300 rounded-lg text-sm resize-none"
                                                    />
                                                </div>
                                            </div>

                                            <button
                                                onClick={handleGenerateImage}
                                                disabled={aiLoading || !aiPrompt}
                                                className={`w - full py - 3 rounded - lg text - white font - medium flex items - center justify - center gap - 2 transition - all ${
    aiLoading || !aiPrompt
    ? 'bg-slate-300 cursor-not-allowed'
    : 'bg-violet-600 hover:bg-violet-700 shadow-md hover:shadow-lg'
} `}
                                            >
                                                {aiLoading ? (
                                                    <>
                                                        <Loader2 className="animate-spin w-5 h-5" />
                                                        Generando...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Sparkles className="w-5 h-5" />
                                                        Generar Imagen
                                                    </>
                                                )}
                                            </button>

                                            {aiError && (
                                                <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-200">
                                                    {aiError}
                                                </div>
                                            )}

                                            {aiGeneratedImage && (
                                                <div className="mt-6 border-t border-violet-200 pt-4 animate-fade-in">
                                                    <label className="block text-sm font-medium text-slate-700 mb-2">Resultado</label>
                                                    <div className="relative rounded-xl overflow-hidden shadow-lg border border-slate-200 mb-4 bg-slate-900">
                                                        <img src={aiGeneratedImage} alt="Generated" className="w-full h-48 md:h-64 object-contain mx-auto" />
                                                    </div>
                                                    <button
                                                        onClick={applyGeneratedImage}
                                                        className="w-full py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium flex items-center justify-center gap-2 shadow-sm transition-colors"
                                                    >
                                                        <ArrowRight className="w-4 h-4" />
                                                        Usar como Fondo del Hero
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'content' && (
                                <div className="space-y-6 animate-fade-in">
                                    <SectionHeader title="Contenido Informativo" description="Edita los textos de las tarjetas de información." />

                                    <div className="grid gap-6">
                                        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                                            <h4 className="font-semibold text-blue-800">Tarjeta 1: ¿Para quién es?</h4>
                                            <InputGroup label="Título" value={config.infoTargetTitle} onChange={(v) => handleInputChange('infoTargetTitle', v)} />
                                            <TextAreaGroup label="Descripción" value={config.infoTargetDescription} onChange={(v) => handleInputChange('infoTargetDescription', v)} />
                                        </div>

                                        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                                            <h4 className="font-semibold text-blue-800">Tarjeta 2: Requisitos</h4>
                                            <InputGroup label="Título" value={config.infoRequirementsTitle} onChange={(v) => handleInputChange('infoRequirementsTitle', v)} />
                                            <TextAreaGroup label="Descripción" value={config.infoRequirementsDescription} onChange={(v) => handleInputChange('infoRequirementsDescription', v)} />
                                        </div>

                                        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                                            <h4 className="font-semibold text-blue-800">Tarjeta 3: Ubicación</h4>
                                            <InputGroup label="Título" value={config.infoLocationTitle} onChange={(v) => handleInputChange('infoLocationTitle', v)} />
                                            <TextAreaGroup label="Descripción" value={config.infoLocationDescription} onChange={(v) => handleInputChange('infoLocationDescription', v)} />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'whatsapp' && (
                                <div className="space-y-6 animate-fade-in">
                                    <SectionHeader title="WhatsApp y Ubicación" description="Configura el contacto y los valores por defecto." />

                                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                                        <h4 className="font-semibold text-green-700 mb-2">Configuración WhatsApp</h4>
                                        <InputGroup label="Número de Organización" value={config.orgPhoneNumber} onChange={(v) => handleInputChange('orgPhoneNumber', v)} />

                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Plantilla del Mensaje</label>
                                            <textarea
                                                value={config.whatsappTemplate}
                                                onChange={(e) => handleInputChange('whatsappTemplate', e.target.value)}
                                                rows={6}
                                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono"
                                            />
                                            <div className="flex gap-2 mt-2">
                                                <button
                                                    onClick={() => {
                                                        const demoMsg = config.whatsappTemplate
                                                            .replace('{name}', 'Juan Pérez')
                                                            .replace('{count}', '2')
                                                            .replace('{invites}', 'NI0001, NI0002')
                                                            .replace('{phone}', config.vCardPhone)
                                                            .replace('{contactName}', config.vCardName);
                                                        window.open(`https://wa.me/${config.orgPhoneNumber}?text=${encodeURIComponent(demoMsg)}`, '_blank');
                                                    }}
className = "text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full hover:bg-green-200 transition-colors flex items-center gap-1"
    >
    <MessageSquare size={12} /> Probar Demo
                                                </button >
                                            </div >
    <p className="text-xs text-slate-500 mt-2">Variables disponibles: {'{name}, {count}, {invites}'}</p>
                                        </div >
                                    </div >

                                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                                        <h4 className="font-semibold text-purple-700 mb-2">Tarjeta de Contacto (vCard)</h4>
                                        <p className="text-xs text-slate-500 mb-2">Información para que los padres guarden el contacto.</p>
                                        <InputGroup label="Nombre del Contacto" value={config.vCardName} onChange={(v) => handleInputChange('vCardName', v)} />
                                        <InputGroup label="Teléfono de Contacto" value={config.vCardPhone} onChange={(v) => handleInputChange('vCardPhone', v)} />
                                    </div>

                                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                                        <h4 className="font-semibold text-blue-800 mb-2">Valores por Defecto (Ubicación)</h4>
                                        <div className="grid md:grid-cols-3 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-1">Departamento</label>
                                                <select
                                                    value={config.defaultDepartment}
                                                    onChange={(e) => handleInputChange('defaultDepartment', e.target.value)}
                                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                                                >
                                                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                                                </select>
                                            </div>
                                            <InputGroup label="Municipio" value={config.defaultMunicipality} onChange={(v) => handleInputChange('defaultMunicipality', v)} />
                                            <InputGroup label="Distrito" value={config.defaultDistrict} onChange={(v) => handleInputChange('defaultDistrict', v)} />
                                        </div>
                                    </div>
                                </div >
                            )}

{
    activeTab === 'data' && (
        <div className="space-y-6 animate-fade-in">
            <SectionHeader title="Base de Datos" description="Descarga los registros obtenidos." />

            <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center space-y-6">
                <div className="bg-blue-50 p-4 rounded-full">
                    <Database className="w-12 h-12 text-blue-600" />
                </div>
                <div>
                    <div className="text-4xl font-bold text-slate-800">{registrationCount}</div>
                    <div className="text-slate-500">Registros Totales</div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
                    <button
                        onClick={() => handleExport('csv')}
                        className="flex-1 flex items-center justify-center gap-2 bg-slate-600 hover:bg-slate-700 text-white py-3 px-4 rounded-lg transition-colors font-medium"
                    >
                        <Download className="w-4 h-4" /> Exportar CSV
                    </button>
                    <button
                        onClick={() => handleExport('xlsx')}
                        className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg transition-colors font-medium"
                    >
                        <Download className="w-4 h-4" /> Exportar Excel
                    </button>
                </div>
            </div>
        </div>
    )
}

                        </div >
                    </div >
                )}
            </div >
        </div >
    );
};

// UI Helpers
const TabButton = ({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${active ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:bg-slate-200/50'
            }`}
    >
        {icon}
        {label}
    </button>
);

const TabButtonMobile = ({ active, onClick, icon }: { active: boolean, onClick: () => void, icon: React.ReactNode }) => (
    <button
        onClick={onClick}
        className={`flex-1 flex items-center justify-center p-4 border-b-2 transition-colors ${active ? 'border-blue-600 text-blue-600 bg-white' : 'border-transparent text-slate-500'
            }`}
    >
        {icon}
    </button>
);

const SectionHeader = ({ title, description }: { title: string, description: string }) => (
    <div className="mb-2">
        <h3 className="text-lg font-bold text-slate-800">{title}</h3>
        <p className="text-sm text-slate-500">{description}</p>
    </div>
);

const InputGroup = ({ label, value, onChange }: { label: string, value: string, onChange: (val: string) => void }) => (
    <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
        <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg"
        />
    </div>
);

const TextAreaGroup = ({ label, value, onChange }: { label: string, value: string, onChange: (val: string) => void }) => (
    <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
        <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg"
        />
    </div>
);

export default AdminPanel;