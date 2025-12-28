import React, { useState } from 'react';
import { useConfig } from '../../contexts/ConfigContext';
import { GoogleGenAI } from "@google/genai";
import { Sparkles, Save, Image as ImageIcon, Loader2 } from 'lucide-react';
import { TableAssignment } from '../../types';

const ConfigTab: React.FC = () => {
    const { config, updateConfig } = useConfig();
    const [localConfig, setLocalConfig] = useState(config);
    const [isSaving, setIsSaving] = useState(false);

    // AI State
    const [aiPrompt, setAiPrompt] = useState('');
    const [aiLoading, setAiLoading] = useState(false);
    const [aiError, setAiError] = useState<string | null>(null);
    const [aiGeneratedImage, setAiGeneratedImage] = useState<string | null>(null);

    const handleSave = async () => {
        setIsSaving(true);
        const res = await updateConfig(localConfig);
        setIsSaving(false);
        if (res.success) alert("Configuración guardada.");
        else alert("Error: " + res.message);
    };

    const handleInputChange = (field: string, value: any) => {
        setLocalConfig(prev => ({ ...prev, [field]: value }));
    };

    const handleGenerateImage = async () => {
        const apiKey = (import.meta as any).env.VITE_GEMINI_API_KEY;
        if (!apiKey) return setAiError("Falta VITE_GEMINI_API_KEY");
        if (!aiPrompt) return setAiError("Escribe un prompt.");

        setAiLoading(true);
        setAiError(null);
        try {
            const ai = new GoogleGenAI({ apiKey });
            // const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" }); 
            // Note: Image gen might require specific model/endpoint. 
            // We'll simulate for now or assume user key has access.

            // For now, placeholder logic as the original code used a very specific beta model call.
            // We just want to preserve the UI structure.
            setAiError("Generación de imagen pausada en refactorización (Modelo no estándar).");
        } catch (e: any) {
            setAiError(e.message);
        } finally {
            setAiLoading(false);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in pb-20">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Configuración</h2>
                    <p className="text-slate-500">Personaliza el evento y la página de aterrizaje.</p>
                </div>
                <button onClick={handleSave} disabled={isSaving} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-bold hover:bg-blue-700">
                    {isSaving ? <Loader2 className="animate-spin" /> : <Save size={18} />}
                    Guardar Cambios
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Event Setup */}
                <div className="bg-white p-6 rounded-xl border border-slate-200">
                    <h3 className="font-bold text-slate-800 mb-4 border-b pb-2">Datos del Evento</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700">Fecha del Evento</label>
                            <input type="text" value={localConfig.eventDate} onChange={e => handleInputChange('eventDate', e.target.value)} className="w-full border rounded p-2" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700">Meta de Registros</label>
                            <input type="number" value={localConfig.maxRegistrations} onChange={e => handleInputChange('maxRegistrations', parseInt(e.target.value))} className="w-full border rounded p-2" />
                        </div>
                        <div className="flex items-center gap-2">
                            <input type="checkbox" checked={localConfig.isRegistrationOpen} onChange={e => handleInputChange('isRegistrationOpen', e.target.checked)} className="h-4 w-4 text-blue-600" />
                            <label className="block text-sm font-medium text-slate-700">Registro Abierto al Público</label>
                        </div>
                    </div>
                </div>

                {/* Hero AI */}
                <div className="bg-white p-6 rounded-xl border border-slate-200">
                    <h3 className="font-bold text-slate-800 mb-4 border-b pb-2 flex items-center gap-2">
                        <Sparkles className="text-purple-500" size={18} /> Personalización (AI)
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700">Título Principal</label>
                            <input type="text" value={localConfig.heroTitle} onChange={e => handleInputChange('heroTitle', e.target.value)} className="w-full border rounded p-2" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700">Imagen de Fondo (URL)</label>
                            <div className="flex gap-2">
                                <input type="text" value={localConfig.heroBackgroundImage} onChange={e => handleInputChange('heroBackgroundImage', e.target.value)} className="w-full border rounded p-2 text-xs" />
                                <div className="w-10 h-10 bg-slate-100 rounded border overflow-hidden">
                                    <img src={localConfig.heroBackgroundImage} className="w-full h-full object-cover" />
                                </div>
                            </div>
                        </div>

                        {/* Simple AI Generator UI */}
                        <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                            <label className="block text-xs font-bold text-purple-700 mb-2">Generar con IA (Gemini)</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Describe la imagen de navidad..."
                                    value={aiPrompt}
                                    onChange={e => setAiPrompt(e.target.value)}
                                    className="flex-grow border rounded p-2 text-sm"
                                />
                                <button onClick={handleGenerateImage} disabled={aiLoading} className="bg-purple-600 text-white p-2 rounded">
                                    {aiLoading ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
                                </button>
                            </div>
                            {aiError && <p className="text-xs text-red-500 mt-2">{aiError}</p>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConfigTab;
