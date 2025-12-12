import React, { useState, useEffect, useMemo } from 'react';
import { Download, Settings, Type, Image as ImageIcon, MessageSquare, Database, X, RotateCcw, Lock, User, Key, Sparkles, Upload, Loader2, ArrowRight, BarChart3, Contact, Trash2, AlertTriangle, ChevronDown, ChevronRight } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, AreaChart, Area } from 'recharts';
import * as XLSX from 'xlsx';
import { GoogleGenAI } from "@google/genai";
import { getRegistrations, deleteRegistration, clearAllRegistrations } from '../services/storageService';
import { useConfig } from '../contexts/ConfigContext';
import { AppConfig, DEPARTMENTS, Registration } from '../types';



const AdminPanel: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);

    // Auth State
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loginError, setLoginError] = useState('');

    const [activeTab, setActiveTab] = useState<'general' | 'hero' | 'content' | 'whatsapp' | 'data' | 'stats'>('general');
    const { config, updateConfig, resetConfig } = useConfig();

    // Local State for Editing (Draft Mode)
    const [localConfig, setLocalConfig] = useState<AppConfig>(config);
    const [hasChanges, setHasChanges] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setLocalConfig(config);
            setHasChanges(false);
        }
    }, [isOpen, config]);

    const [registrationCount, setRegistrationCount] = useState(0);
    const [registrations, setRegistrations] = useState<Registration[]>([]);

    useEffect(() => {
        if (isAuthenticated) {
            getRegistrations().then(regs => {
                setRegistrationCount(regs.length);
                setRegistrations(regs);
            });
        }
    }, [isAuthenticated, isOpen]);
    const [aiSourceImage, setAiSourceImage] = useState<string | null>(null);
    const [aiGeneratedImage, setAiGeneratedImage] = useState<string | null>(null);
    const [aiLoading, setAiLoading] = useState(false);
    const [aiError, setAiError] = useState<string | null>(null);
    const [aiPrompt, setAiPrompt] = useState('');

    // Statistics Data Processing
    const stats = useMemo(() => {
        // 1. Gender Distribution
        // Form saves "Niño" or "Niña". Old data might be "niños", "niñas", "ambos".
        const genderData = [
            {
                name: 'Niños',
                value: registrations.reduce((acc, r) => {
                    const g = (r.genderSelection || '').toLowerCase();
                    // Match 'niño', 'niños', 'nino', etc.
                    return acc + (g.includes('niño') || g.includes('nino') ? r.childCount : 0);
                }, 0)
            },
            {
                name: 'Niñas',
                value: registrations.reduce((acc, r) => {
                    const g = (r.genderSelection || '').toLowerCase();
                    return acc + (g.includes('niña') || g.includes('nina') ? r.childCount : 0);
                }, 0)
            },
            {
                name: 'Mixto/Otro',
                value: registrations.reduce((acc, r) => {
                    const g = (r.genderSelection || '').toLowerCase();
                    return acc + (g.includes('ambos') || g.includes('mixto') ? r.childCount : 0);
                }, 0)
            }
        ].filter(d => d.value > 0);

        // 2. Top Municipalities
        const muniCount: Record<string, number> = {};
        registrations.forEach(r => {
            const muni = r.municipality || 'Desconocido';
            muniCount[muni] = (muniCount[muni] || 0) + 1;
        });
        const municipalData = Object.entries(muniCount)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5);

        // 3. Family Size Distribution
        // 3. Family Size Distribution (Grouped by Household/Phone)
        const familySizeCountsByPhone: Record<string, number> = {};
        registrations.forEach(r => {
            // Normalize phone to avoid duplicates (remove spaces/dashes if any, simplified here)
            const phone = r.whatsapp?.trim() || 'unknown';
            if (phone !== 'unknown') {
                familySizeCountsByPhone[phone] = (familySizeCountsByPhone[phone] || 0) + r.childCount;
            } else {
                // If no phone, treat as single unique entry
                familySizeCountsByPhone[`unknown_${r.id}`] = r.childCount;
            }
        });

        const familySizeDist: Record<number, number> = {};
        Object.values(familySizeCountsByPhone).forEach(count => {
            familySizeDist[count] = (familySizeDist[count] || 0) + 1;
        });

        const familySizeData = Object.entries(familySizeDist)
            .map(([size, count]) => ({ size: `${size} Niños`, count }))
            .sort((a, b) => Number(a.size.split(' ')[0]) - Number(b.size.split(' ')[0]));

        // 4. Registration Timeline (Sorted Chronologically)
        const timelineMap: Record<string, { count: number, label: string }> = {};

        registrations.forEach(r => {
            const d = new Date(r.timestamp);
            const key = d.toISOString().split('T')[0]; // Sortable Key: 2023-12-24
            const label = d.toLocaleDateString('es-SV', { month: 'short', day: 'numeric' }); // Display: 24 dic

            if (!timelineMap[key]) {
                timelineMap[key] = { count: 0, label };
            }
            timelineMap[key].count++;
        });

        const timelineData = Object.entries(timelineMap)
            .sort((a, b) => a[0].localeCompare(b[0])) // Sort by date key
            .map(([_, val]) => ({ date: val.label, count: val.count }));

        // 5. Age Distribution
        const ageCount: Record<number, number> = {};
        registrations.forEach(r => {
            if (r.childAge !== undefined && r.childAge !== null) {
                ageCount[r.childAge] = (ageCount[r.childAge] || 0) + 1;
            }
        });
        const ageData = Array.from({ length: 13 }, (_, i) => ({
            age: `${i} años`,
            count: ageCount[i] || 0
        }));


        // 6. Distributor Stats (All distributors, sorted by performance)
        const distCount: Record<string, number> = {};
        registrations.forEach(r => {
            const dist = r.ticketDistributor || 'No Asignado';
            distCount[dist] = (distCount[dist] || 0) + r.childCount;
        });

        const distributorData = Object.entries(distCount)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);

        return { genderData, municipalData, familySizeData, timelineData, ageData, distributorData };
    }, [registrations]);

    // Progress
    const progressPercentage = Math.min(100, Math.round((registrations.length / localConfig.maxRegistrations) * 100));

    // ... (keep handleLogin and others) ...



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

        const fileName = `EntregaJuguetes_Registros_${new Date().toISOString().split('T')[0]} `;

        if (type === 'xlsx') {
            XLSX.writeFile(workbook, `${fileName}.xlsx`);
        } else {
            XLSX.writeFile(workbook, `${fileName}.csv`);
        }
    };

    const handleInputChange = (field: keyof AppConfig, value: any) => {
        setLocalConfig(prev => ({ ...prev, [field]: value }));
        setHasChanges(true);
    };

    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        setIsSaving(true);
        const result = await updateConfig(localConfig);
        setIsSaving(false);

        if (result.success) {
            setHasChanges(false);
            alert("¡Cambios guardados exitosamente en la nube!");
        } else {
            alert("Error al guardar en la nube: " + (result.message || "Intenta nuevamente."));
        }
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
                        const imgUrl = `data:${part.inlineData.mimeType}; base64, ${part.inlineData.data} `;
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
                    setAiError(`El modelo respondió solo con texto: ${textPart.text} `);
                } else {
                    setAiError("No se pudo generar la imagen. Intenta con otro prompt.");
                }
            }

        } catch (e: any) {
            console.error("AI Generation Error", e);
            setAiError(`Error al generar imagen: ${e.message} `);
        } finally {
            setAiLoading(false);
        }
    };

    const applyGeneratedImage = () => {
        if (aiGeneratedImage) {
            handleInputChange('heroBackgroundImage', aiGeneratedImage);
            alert("Imagen aplicada. No olvides GUARDAR los cambios.");
        }
    };

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    // Filtered Registrations
    const filteredRegistrations = useMemo(() => {
        if (!searchTerm) return registrations;
        const lowerTerm = searchTerm.toLowerCase();
        return registrations.filter(r =>
            r.fullName.toLowerCase().includes(lowerTerm) ||
            r.inviteNumber.toLowerCase().includes(lowerTerm) ||
            r.whatsapp.includes(searchTerm)
        );
    }, [registrations, searchTerm]);

    const groupedRegistrations = useMemo(() => {
        const groups: Record<string, Registration[]> = {};
        // Taking top 100 for display performance while maintaining grouping relevance
        const displayList = filteredRegistrations.slice(0, 100);

        displayList.forEach(reg => {
            const key = reg.ticketDistributor || 'Sin Distribuidor';
            if (!groups[key]) groups[key] = [];
            groups[key].push(reg);
        });

        return Object.entries(groups).sort((a, b) => {
            if (a[0] === 'Sin Distribuidor') return 1;
            if (b[0] === 'Sin Distribuidor') return -1;
            return a[0].localeCompare(b[0]);
        });
    }, [filteredRegistrations]);


    // Collapsible Logic
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

    const toggleGroup = (groupName: string) => {
        setExpandedGroups(prev => {
            const next = new Set(prev);
            if (next.has(groupName)) {
                next.delete(groupName);
            } else {
                next.add(groupName);
            }
            return next;
        });
    };

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            // Select all currently visible (filtered)
            const allIds = new Set(filteredRegistrations.map(r => r.id));
            setSelectedIds(allIds);
        } else {
            setSelectedIds(new Set());
        }
    };

    const handleSelectRow = (id: string) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedIds(newSelected);
    };

    const handleBulkDelete = async () => {
        if (selectedIds.size === 0) return;

        if (confirm(`¿Estás seguro de que deseas eliminar ${selectedIds.size} registros seleccionados? Esta acción no se puede deshacer.`)) {
            let successCount = 0;
            // Iterate and delete (or use a batch service if available, currently loop for simplicity with existing service)
            for (const id of Array.from(selectedIds)) {
                const res = await deleteRegistration(id);
                if (res.success) successCount++;
            }

            if (successCount > 0) {
                const updatedRegs = await getRegistrations();
                setRegistrations(updatedRegs);
                setRegistrationCount(updatedRegs.length);
                setSelectedIds(new Set());
                alert(`Se eliminaron ${successCount} registros exitosamente.`);
            } else {
                alert("No se pudieron eliminar los registros.");
            }
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (confirm(`¿Estás seguro de que quieres eliminar el registro de "${name}"? Esta acción no se puede deshacer.`)) {
            const result = await deleteRegistration(id);
            if (result.success) {
                // Refresh list
                const updatedRegs = await getRegistrations();
                setRegistrations(updatedRegs);
                setRegistrationCount(updatedRegs.length);

                // Remove from selection if it was selected
                if (selectedIds.has(id)) {
                    const newSet = new Set(selectedIds);
                    newSet.delete(id);
                    setSelectedIds(newSet);
                }
            } else {
                alert(result.message || "Error al eliminar el registro.");
            }
        }
    };

    const handleResetDatabase = async () => {
        const confirmation = prompt("⚠️ ZONA DE PELIGRO ⚠️\n\nEstás a punto de ELIMINAR TODOS LOS REGISTROS.\nEsta acción es irreversible.\n\nPara confirmar, escribe la palabra 'BORRAR' en mayúsculas:");
        if (confirmation === 'BORRAR') {
            const result = await clearAllRegistrations();
            if (result.success) {
                setRegistrations([]);
                setRegistrationCount(0);
                setSelectedIds(new Set());
                alert("Base de datos borrada correctamente.");
            } else {
                alert(result.message || "Error al borrar la base de datos.");
            }
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
                <div className="bg-slate-800 text-white px-4 md:px-6 py-4 flex justify-between items-center flex-shrink-0 z-50">
                    <div className="flex items-center gap-3">
                        <h2 className="text-lg md:text-xl font-bold flex items-center gap-2">
                            <Settings className="w-5 h-5" />
                            <span className="hidden sm:inline">Panel Administrativo</span>
                            <span className="inline sm:hidden">Admin</span>
                        </h2>
                        {hasChanges && (
                            <span className="bg-yellow-500 text-black text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">
                                SIN GUARDAR
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        {hasChanges && (
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className={`bg-green-600 hover:bg-green-500 text-white px-4 py-1.5 rounded-lg text-sm font-bold shadow-sm transition-all ${isSaving ? 'opacity-70 cursor-wait' : 'animate-bounce-short'}`}
                            >
                                {isSaving ? 'Guardando...' : 'Guardar'}
                            </button>
                        )}
                        <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white transition-colors ml-2">
                            <X className="w-6 h-6" />
                        </button>
                    </div>
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
                                <TabButton active={activeTab === 'stats'} onClick={() => setActiveTab('stats')} icon={<BarChart3 size={18} />} label="Estadísticas" />
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
                        <div className="md:hidden w-full overflow-x-auto flex border-b border-slate-200 bg-slate-50 flex-shrink-0 scrollbar-hide">
                            <TabButtonMobile active={activeTab === 'general'} onClick={() => setActiveTab('general')} icon={<Settings size={18} />} label="General" />
                            <TabButtonMobile active={activeTab === 'hero'} onClick={() => setActiveTab('hero')} icon={<ImageIcon size={18} />} label="Hero" />
                            <TabButtonMobile active={activeTab === 'content'} onClick={() => setActiveTab('content')} icon={<Type size={18} />} label="Info" />
                            <TabButtonMobile active={activeTab === 'whatsapp'} onClick={() => setActiveTab('whatsapp')} icon={<MessageSquare size={18} />} label="Contacto" />
                            <TabButtonMobile active={activeTab === 'stats'} onClick={() => setActiveTab('stats')} icon={<BarChart3 size={18} />} label="Stats" />
                            <TabButtonMobile active={activeTab === 'data'} onClick={() => setActiveTab('data')} icon={<Database size={18} />} label="Datos" />
                        </div>

                        {/* Content Area */}
                        <div className="flex-grow p-6 overflow-y-auto bg-slate-50">

                            {activeTab === 'general' && (
                                <div className="space-y-6 animate-fade-in pb-10">
                                    <SectionHeader title="Configuración General" description="Controla el estado principal del evento." />

                                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">

                                        {/* Status Toggle */}
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-slate-50 rounded-lg border border-slate-100">
                                            <div>
                                                <label className="font-bold text-slate-800 text-lg">Estado del Registro</label>
                                                <p className="text-sm text-slate-500 mt-1">Activa o desactiva el formulario públicamente.</p>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer self-start sm:self-center">
                                                <input
                                                    type="checkbox"
                                                    checked={localConfig.isRegistrationOpen}
                                                    onChange={(e) => handleInputChange('isRegistrationOpen', e.target.checked)}
                                                    className="sr-only peer"
                                                />
                                                <div className="w-14 h-7 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-blue-600"></div>
                                            </label>
                                        </div>

                                        <hr className="border-slate-100" />

                                        {/* Limits & Date */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-sm font-bold text-slate-700 mb-2">Límite Máximo de Registros</label>
                                                <input
                                                    type="number"
                                                    value={localConfig.maxRegistrations}
                                                    onChange={(e) => handleInputChange('maxRegistrations', Number(e.target.value))}
                                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                                />
                                                <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                                                    <span className={`w-2 h-2 rounded-full ${registrationCount >= localConfig.maxRegistrations ? 'bg-red-500' : 'bg-green-500'}`}></span>
                                                    Actualmente: <span className="font-semibold">{registrationCount}</span> registros.
                                                </p>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-bold text-slate-700 mb-2">Fecha del Evento (Texto)</label>
                                                <input
                                                    type="text"
                                                    value={localConfig.eventDate}
                                                    onChange={(e) => handleInputChange('eventDate', e.target.value)}
                                                    placeholder="Ej: 24 de Diciembre, 2:00 PM"
                                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                                />
                                            </div>
                                        </div>

                                        <hr className="border-slate-100" />

                                        {/* Distributors */}
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-3">Distribuidores de Tickets</label>

                                            <div className="flex flex-col sm:flex-row gap-2 mb-4">
                                                <input
                                                    type="text"
                                                    id="newDistributor"
                                                    placeholder="Nombre del distribuidor"
                                                    className="flex-grow px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            e.preventDefault();
                                                            const val = (e.target as HTMLInputElement).value.trim();
                                                            if (val) {
                                                                handleInputChange('ticketDistributors', [...(localConfig.ticketDistributors || []), val]);
                                                                (e.target as HTMLInputElement).value = '';
                                                            }
                                                        }
                                                    }}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const input = document.getElementById('newDistributor') as HTMLInputElement;
                                                        const val = input.value.trim();
                                                        if (val) {
                                                            handleInputChange('ticketDistributors', [...(localConfig.ticketDistributors || []), val]);
                                                            input.value = '';
                                                        }
                                                    }}
                                                    className="bg-slate-800 text-white px-6 py-2.5 rounded-lg text-sm font-bold hover:bg-slate-700 shadow-sm whitespace-nowrap active:scale-95 transition-all"
                                                >
                                                    + Agregar
                                                </button>
                                            </div>

                                            <div className="flex flex-wrap gap-2 p-4 bg-slate-50 rounded-xl border border-slate-100 min-h-[100px] content-start">
                                                {(localConfig.ticketDistributors || []).length === 0 ? (
                                                    <span className="text-slate-400 text-sm italic w-full text-center py-4">No hay distribuidores asignados.</span>
                                                ) : (
                                                    (localConfig.ticketDistributors || []).map((dist, idx) => (
                                                        <span key={idx} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 text-sm shadow-sm animate-fade-in">
                                                            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                                            {dist}
                                                            <button
                                                                onClick={() => {
                                                                    const newDistributors = localConfig.ticketDistributors.filter((_, i) => i !== idx);
                                                                    handleInputChange('ticketDistributors', newDistributors);
                                                                }}
                                                                className="ml-1 text-slate-400 hover:text-red-500 p-0.5 rounded-full hover:bg-red-50 transition-colors"
                                                            >
                                                                <X size={14} />
                                                            </button>
                                                        </span>
                                                    ))
                                                )}
                                            </div>
                                            <p className="text-xs text-slate-400 mt-2">Estos nombres aparecerán en la lista desplegable del formulario.</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'hero' && (
                                <div className="space-y-6 animate-fade-in">
                                    <SectionHeader title="Sección Hero & Estilos" description="Personaliza la primera impresión de la página." />

                                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                                        <InputGroup label="Título Principal" value={localConfig.heroTitle} onChange={(v) => handleInputChange('heroTitle', v)} />
                                        <InputGroup label="Subtítulo" value={localConfig.heroSubtitle} onChange={(v) => handleInputChange('heroSubtitle', v)} />

                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">URL Imagen de Fondo (Manual)</label>
                                            <input
                                                type="text"
                                                value={localConfig.heroBackgroundImage}
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
                                                className={`w-full py-3 rounded-lg text-white font-medium flex items-center justify-center gap-2 transition-all ${aiLoading || !aiPrompt
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
                                            <InputGroup label="Título" value={localConfig.infoTargetTitle} onChange={(v) => handleInputChange('infoTargetTitle', v)} />
                                            <TextAreaGroup label="Descripción" value={localConfig.infoTargetDescription} onChange={(v) => handleInputChange('infoTargetDescription', v)} />
                                        </div>

                                        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                                            <h4 className="font-semibold text-blue-800">Tarjeta 2: Requisitos</h4>
                                            <InputGroup label="Título" value={localConfig.infoRequirementsTitle} onChange={(v) => handleInputChange('infoRequirementsTitle', v)} />
                                            <TextAreaGroup label="Descripción" value={localConfig.infoRequirementsDescription} onChange={(v) => handleInputChange('infoRequirementsDescription', v)} />
                                        </div>

                                        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                                            <h4 className="font-semibold text-blue-800">Tarjeta 3: Ubicación</h4>
                                            <InputGroup label="Título" value={localConfig.infoLocationTitle} onChange={(v) => handleInputChange('infoLocationTitle', v)} />
                                            <TextAreaGroup label="Descripción" value={localConfig.infoLocationDescription} onChange={(v) => handleInputChange('infoLocationDescription', v)} />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'whatsapp' && (
                                <div className="space-y-6 animate-fade-in">
                                    <SectionHeader title="WhatsApp y Ubicación" description="Configura el contacto y los valores por defecto." />

                                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                                        <h4 className="font-semibold text-green-700 mb-2">Configuración WhatsApp</h4>
                                        <InputGroup label="Número de Organización" value={localConfig.orgPhoneNumber} onChange={(v) => handleInputChange('orgPhoneNumber', v)} />

                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Plantilla del Mensaje</label>
                                            <textarea
                                                value={localConfig.whatsappTemplate}
                                                onChange={(e) => handleInputChange('whatsappTemplate', e.target.value)}
                                                rows={6}
                                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono"
                                            />
                                            <div className="flex gap-2 mt-2">
                                                <button
                                                    onClick={() => {
                                                        const demoMsg = localConfig.whatsappTemplate
                                                            .replace('{name}', 'Juan Pérez')
                                                            .replace('{count}', '2')
                                                            .replace('{invites}', 'NI0001, NI0002')
                                                            .replace('{phone}', localConfig.vCardPhone)
                                                            .replace('{contactName}', localConfig.vCardName);
                                                        window.open(`https://wa.me/${localConfig.orgPhoneNumber}?text=${encodeURIComponent(demoMsg)}`, '_blank');
                                                    }}
                                                    className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full hover:bg-green-200 transition-colors flex items-center gap-1"
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
                                        <InputGroup label="Nombre del Contacto" value={localConfig.vCardName} onChange={(v) => handleInputChange('vCardName', v)} />
                                        <InputGroup label="Teléfono de Contacto" value={localConfig.vCardPhone} onChange={(v) => handleInputChange('vCardPhone', v)} />
                                    </div>

                                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                                        <h4 className="font-semibold text-blue-800 mb-2">Valores por Defecto (Ubicación)</h4>
                                        <div className="grid md:grid-cols-3 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-1">Departamento</label>
                                                <select
                                                    value={localConfig.defaultDepartment}
                                                    onChange={(e) => handleInputChange('defaultDepartment', e.target.value)}
                                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                                                >
                                                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                                                </select>
                                            </div>
                                            <InputGroup label="Municipio" value={localConfig.defaultMunicipality} onChange={(v) => handleInputChange('defaultMunicipality', v)} />
                                            <InputGroup label="Distrito" value={localConfig.defaultDistrict} onChange={(v) => handleInputChange('defaultDistrict', v)} />
                                        </div>
                                    </div>
                                </div >
                            )}

                            {activeTab === 'stats' && (
                                <div className="space-y-6 animate-fade-in pb-10">
                                    <SectionHeader title="Tablero de Control" description="Métricas clave para la logística del evento." />

                                    {registrations.length === 0 ? (
                                        <div className="bg-white p-12 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center">
                                            <div className="bg-slate-100 p-4 rounded-full mb-4">
                                                <BarChart3 className="w-12 h-12 text-slate-400" />
                                            </div>
                                            <h3 className="text-xl font-bold text-slate-800 mb-2">Aún no hay estadísticas</h3>
                                            <p className="text-slate-500 max-w-sm">
                                                Las gráficas aparecerán automáticamente cuando se reciban los primeros registros.
                                            </p>
                                        </div>
                                    ) : (
                                        <>
                                            {/* Goal Progress */}
                                            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                                <div className="flex justify-between items-end mb-2">
                                                    <div>
                                                        <h4 className="text-sm font-medium text-slate-500 uppercase tracking-wider">Meta de Registros</h4>
                                                        <div className="text-3xl font-bold text-slate-800 mt-1">{registrations.length} <span className="text-lg text-slate-400 font-normal">/ {config.maxRegistrations}</span></div>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${progressPercentage >= 100 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                                            {progressPercentage}%
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full transition-all duration-1000 ${progressPercentage >= 100 ? 'bg-red-500' : 'bg-gradient-to-r from-blue-500 to-green-400'}`}
                                                        style={{ width: `${progressPercentage}%` }}
                                                    ></div>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                                                {/* Distributor Chart (Bar) */}
                                                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm min-h-[400px] flex flex-col md:col-span-2 lg:col-span-3">
                                                    <h4 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                                                        <User className="w-4 h-4 text-blue-600" /> Tickets por Responsable
                                                    </h4>
                                                    <div className="flex-grow">
                                                        <ResponsiveContainer width="100%" height={350}>
                                                            <BarChart data={stats?.distributorData || []} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                                                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                                                <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" interval={0} />
                                                                <YAxis allowDecimals={false} />
                                                                <RechartsTooltip cursor={{ fill: 'transparent' }} />
                                                                <Bar dataKey="value" fill="#2563eb" radius={[4, 4, 0, 0]} barSize={40}>
                                                                    {
                                                                        (stats?.distributorData || []).map((entry, index) => (
                                                                            <Cell key={`cell-${index}`} fill={['#2563eb', '#3b82f6', '#60a5fa'][index % 3] || '#3b82f6'} />
                                                                        ))
                                                                    }
                                                                </Bar>
                                                            </BarChart>
                                                        </ResponsiveContainer>
                                                    </div>
                                                </div>

                                                {/* Gender Chart (Pie) */}
                                                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm min-h-[300px] flex flex-col">
                                                    <h4 className="font-semibold text-slate-800 mb-4 flex items-center gap-2"><PieChart className="w-4 h-4 text-purple-500" /> Género</h4>
                                                    <div className="flex-grow">
                                                        <ResponsiveContainer width="100%" height={250}>
                                                            <PieChart>
                                                                <Pie
                                                                    data={stats?.genderData || []}
                                                                    cx="50%"
                                                                    cy="50%"
                                                                    innerRadius={60}
                                                                    outerRadius={80}
                                                                    paddingAngle={5}
                                                                    dataKey="value"
                                                                >
                                                                    {(stats?.genderData || []).map((entry, index) => (
                                                                        <Cell key={`cell-${index}`} fill={['#3b82f6', '#ec4899', '#a855f7'][index % 3]} />
                                                                    ))}
                                                                </Pie>
                                                                <RechartsTooltip />
                                                                <Legend verticalAlign="bottom" height={36} />
                                                            </PieChart>
                                                        </ResponsiveContainer>
                                                    </div>
                                                    <div className="text-center text-sm text-slate-500 mt-2">
                                                        Total Niños/as: <span className="font-bold text-slate-800">{registrations.reduce((acc, r) => acc + r.childCount, 0)}</span>
                                                    </div>
                                                </div>
                                                {/* Cost/Size Distribution (Bar) */}
                                                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm min-h-[300px] flex flex-col md:col-span-2 lg:col-span-1">
                                                    <h4 className="font-semibold text-slate-800 mb-4 flex items-center gap-2"><User className="w-4 h-4 text-green-500" /> Tamaño de Familia</h4>
                                                    <div className="flex-grow">
                                                        <ResponsiveContainer width="100%" height={250}>
                                                            <BarChart data={stats?.familySizeData || []}>
                                                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                                                <XAxis dataKey="size" tick={{ fontSize: 10 }} />
                                                                <YAxis allowDecimals={false} />
                                                                <RechartsTooltip cursor={{ fill: 'transparent' }} />
                                                                <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} barSize={30} />
                                                            </BarChart>
                                                        </ResponsiveContainer>
                                                    </div>
                                                </div>


                                                {/* Age Distribution (Bar) */}
                                                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm min-h-[300px] flex flex-col md:col-span-2 lg:col-span-1">
                                                    <h4 className="font-semibold text-slate-800 mb-4 flex items-center gap-2"><Contact className="w-4 h-4 text-orange-500" /> Edades (0-12)</h4>
                                                    <div className="flex-grow">
                                                        <ResponsiveContainer width="100%" height={250}>
                                                            <BarChart data={stats?.ageData || []}>
                                                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                                                <XAxis dataKey="age" tick={{ fontSize: 10 }} interval={0} angle={-45} textAnchor="end" height={60} />
                                                                <YAxis allowDecimals={false} />
                                                                <RechartsTooltip cursor={{ fill: 'transparent' }} />
                                                                <Bar dataKey="count" fill="#f97316" radius={[4, 4, 0, 0]} barSize={20} />
                                                            </BarChart>
                                                        </ResponsiveContainer>
                                                    </div>
                                                </div>

                                                {/* Timeline (Area) */}
                                                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm min-h-[300px] flex flex-col md:col-span-2 lg:col-span-3">
                                                    <h4 className="font-semibold text-slate-800 mb-4">Ritmo de Inscripción</h4>
                                                    <div className="flex-grow">
                                                        <ResponsiveContainer width="100%" height={200}>
                                                            <AreaChart data={stats?.timelineData || []} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                                                <defs>
                                                                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                                                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                                                                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                                                    </linearGradient>
                                                                </defs>
                                                                <XAxis dataKey="date" />
                                                                <YAxis />
                                                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                                                <RechartsTooltip />
                                                                <Area type="monotone" dataKey="count" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorCount)" />
                                                            </AreaChart>
                                                        </ResponsiveContainer>
                                                    </div>
                                                </div>

                                            </div>

                                            {/* Detailed List (Collapsible or Scrollable) */}
                                            <div className="bg-white rounded-xl border border-slate-200 shadow-sm w-full">
                                                <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
                                                    <div>
                                                        <h4 className="font-semibold text-slate-800">Registros Recientes</h4>
                                                        <span className="text-xs text-slate-500">Mostrando {filteredRegistrations.length} registros</span>
                                                    </div>

                                                    <div className="flex items-center gap-2 w-full sm:w-auto">
                                                        <input
                                                            type="text"
                                                            placeholder="Buscar por nombre, invitación..."
                                                            value={searchTerm}
                                                            onChange={(e) => setSearchTerm(e.target.value)}
                                                            className="px-3 py-2 border border-slate-300 rounded-lg text-sm w-full sm:w-64"
                                                        />
                                                        {selectedIds.size > 0 && (
                                                            <button
                                                                onClick={handleBulkDelete}
                                                                className="bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                                Borrar ({selectedIds.size})
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Desktop Table View */}
                                                <div className="hidden md:block overflow-x-auto flex-grow">
                                                    <table className="w-full text-sm text-left">
                                                        <thead className="text-xs text-slate-500 uppercase bg-slate-50 sticky top-0">
                                                            <tr>
                                                                <th className="px-6 py-3 w-4">
                                                                    <input
                                                                        type="checkbox"
                                                                        onChange={handleSelectAll}
                                                                        checked={filteredRegistrations.length > 0 && selectedIds.size === filteredRegistrations.length}
                                                                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                                                    />
                                                                </th>
                                                                <th className="px-6 py-3">Nombre</th>
                                                                <th className="px-6 py-3">Teléfono</th>
                                                                <th className="px-6 py-3">Invitación</th>
                                                                <th className="px-6 py-3">Niños</th>
                                                                <th className="px-6 py-3"></th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-slate-100">
                                                            {groupedRegistrations.map(([distributor, regs]) => {
                                                                const isExpanded = expandedGroups.has(distributor);
                                                                return (
                                                                    <React.Fragment key={distributor}>
                                                                        <tr
                                                                            onClick={() => toggleGroup(distributor)}
                                                                            className="bg-slate-50/80 hover:bg-slate-100 cursor-pointer transition-colors"
                                                                        >
                                                                            <td colSpan={6} className="px-6 py-3 border-y border-slate-200">
                                                                                <div className="flex items-center gap-2 font-bold text-slate-700 text-xs uppercase tracking-wider">
                                                                                    {isExpanded ? (
                                                                                        <ChevronDown className="w-4 h-4 text-slate-400" />
                                                                                    ) : (
                                                                                        <ChevronRight className="w-4 h-4 text-slate-400" />
                                                                                    )}
                                                                                    {distributor}
                                                                                    <div className="flex gap-2 ml-3">
                                                                                        <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full text-[10px] whitespace-nowrap">
                                                                                            {regs.length} Familias
                                                                                        </span>
                                                                                        <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-[10px] whitespace-nowrap">
                                                                                            {regs.reduce((acc, curr) => acc + curr.childCount, 0)} Juguetes
                                                                                        </span>
                                                                                    </div>
                                                                                </div>
                                                                            </td>
                                                                        </tr>
                                                                        {isExpanded && regs.map((reg) => (
                                                                            <tr key={reg.id} className={`hover:bg-slate-50 animate-fade-in ${selectedIds.has(reg.id) ? 'bg-blue-50/50' : ''}`}>
                                                                                <td className="px-6 py-4">
                                                                                    <input
                                                                                        type="checkbox"
                                                                                        checked={selectedIds.has(reg.id)}
                                                                                        onChange={() => handleSelectRow(reg.id)}
                                                                                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                                                                    />
                                                                                </td>
                                                                                <td className="px-6 py-4 font-medium text-slate-900">
                                                                                    {reg.fullName}
                                                                                </td>
                                                                                <td className="px-6 py-4 text-slate-600">{reg.whatsapp}</td>
                                                                                <td className="px-6 py-4 text-slate-600 font-mono text-xs">{reg.inviteNumber}</td>
                                                                                <td className="px-6 py-4">
                                                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${reg.genderSelection === 'niños' ? 'bg-blue-100 text-blue-700' :
                                                                                        reg.genderSelection === 'niñas' ? 'bg-pink-100 text-pink-700' :
                                                                                            'bg-purple-100 text-purple-700'
                                                                                        }`}>
                                                                                        {reg.childCount} {reg.genderSelection}
                                                                                    </span>
                                                                                </td>
                                                                                <td className="px-6 py-4 text-right">
                                                                                    <button
                                                                                        onClick={(e) => {
                                                                                            e.stopPropagation();
                                                                                            handleDelete(reg.id, reg.fullName);
                                                                                        }}
                                                                                        className="text-slate-400 hover:text-red-500 transition-colors p-2"
                                                                                        title="Eliminar Registro"
                                                                                    >
                                                                                        <Trash2 className="w-4 h-4" />
                                                                                    </button>
                                                                                </td>
                                                                            </tr>
                                                                        ))}
                                                                    </React.Fragment>
                                                                );
                                                            })}
                                                            {groupedRegistrations.length === 0 && (
                                                                <tr>
                                                                    <td colSpan={6} className="px-6 py-8 text-center text-slate-500 italic">
                                                                        No se encontraron registros recientes.
                                                                    </td>
                                                                </tr>
                                                            )}
                                                        </tbody>
                                                    </table>
                                                </div>

                                                {/* Mobile Card View */}
                                                <div className="md:hidden">
                                                    <div className="divide-y divide-slate-100">
                                                        <div className="divide-y divide-slate-100">
                                                            {groupedRegistrations.map(([distributor, regs]) => {
                                                                const isExpanded = expandedGroups.has(distributor);
                                                                return (
                                                                    <React.Fragment key={distributor}>
                                                                        <div
                                                                            onClick={() => toggleGroup(distributor)}
                                                                            className="bg-slate-50/90 px-4 py-3 border-b border-slate-200 sticky top-0 backdrop-blur-sm z-10 flex justify-between items-center cursor-pointer active:bg-slate-200 transition-colors"
                                                                        >
                                                                            <div className="font-bold text-slate-700 text-xs uppercase tracking-wide flex items-center gap-2 flex-wrap">
                                                                                {distributor}
                                                                                <div className="flex gap-2">
                                                                                    <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full text-[10px] whitespace-nowrap">
                                                                                        {regs.length} Fam
                                                                                    </span>
                                                                                    <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-[10px] whitespace-nowrap">
                                                                                        {regs.reduce((acc, curr) => acc + curr.childCount, 0)} Jug
                                                                                    </span>
                                                                                </div>
                                                                            </div>
                                                                            {isExpanded ? <ChevronDown size={16} className="text-slate-500" /> : <ChevronRight size={16} className="text-slate-500" />}
                                                                        </div>

                                                                        {isExpanded && regs.map((reg) => (
                                                                            <div
                                                                                key={reg.id}
                                                                                className={`p-4 flex flex-col gap-3 animate-fade-in ${selectedIds.has(reg.id) ? 'bg-blue-50/30' : ''}`}
                                                                                onClick={() => {
                                                                                    // Optional: Toggle selection on click
                                                                                }}
                                                                            >
                                                                                <div className="flex justify-between items-start">
                                                                                    <div className="flex items-start gap-3">
                                                                                        <input
                                                                                            type="checkbox"
                                                                                            checked={selectedIds.has(reg.id)}
                                                                                            onChange={() => handleSelectRow(reg.id)}
                                                                                            className="mt-1 rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-5 h-5"
                                                                                        />
                                                                                        <div>
                                                                                            <div className="font-bold text-slate-900">{reg.fullName}</div>
                                                                                            <div className="text-xs text-slate-500 font-mono mt-0.5 flex items-center gap-1">
                                                                                                <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 border border-slate-200">{reg.inviteNumber}</span>
                                                                                            </div>
                                                                                        </div>
                                                                                    </div>
                                                                                    <button
                                                                                        onClick={(e) => {
                                                                                            e.stopPropagation();
                                                                                            handleDelete(reg.id, reg.fullName);
                                                                                        }}
                                                                                        className="text-slate-400 hover:text-red-500 p-1"
                                                                                    >
                                                                                        <Trash2 className="w-5 h-5" />
                                                                                    </button>
                                                                                </div>

                                                                                <div className="pl-8 grid grid-cols-2 gap-2 text-sm">
                                                                                    <div className="flex items-center gap-1.5 text-slate-600">
                                                                                        <MessageSquare className="w-3.5 h-3.5 text-green-600" />
                                                                                        {reg.whatsapp}
                                                                                    </div>
                                                                                    <div className="flex items-center justify-end gap-1.5">
                                                                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${reg.genderSelection === 'niños' ? 'bg-blue-100 text-blue-700' :
                                                                                            reg.genderSelection === 'niñas' ? 'bg-pink-100 text-pink-700' :
                                                                                                'bg-purple-100 text-purple-700'
                                                                                            }`}>
                                                                                            {reg.childCount} {reg.genderSelection}
                                                                                        </span>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </React.Fragment>
                                                                );
                                                            })}
                                                        </div>        </div>
                                                    {filteredRegistrations.length === 0 && (
                                                        <div className="p-8 text-center text-slate-500 text-sm">
                                                            No se encontraron registros.
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                        </>
                                    )}
                                </div>
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

                                        <div className="bg-red-50 p-6 rounded-xl border border-red-200 w-full animate-fade-in">
                                            <div className="flex items-start gap-4">
                                                <div className="bg-red-100 p-3 rounded-full flex-shrink-0">
                                                    <AlertTriangle className="w-6 h-6 text-red-600" />
                                                </div>
                                                <div className="flex-grow">
                                                    <h3 className="text-lg font-bold text-red-800">Zona de Peligro</h3>
                                                    <p className="text-sm text-red-700 mb-4">
                                                        Las siguientes acciones son destructivas y no se pueden deshacer.
                                                    </p>
                                                    <button
                                                        onClick={handleResetDatabase}
                                                        className="bg-white border border-red-300 text-red-600 hover:bg-red-600 hover:text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm flex items-center gap-2 shadow-sm"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                        Eliminar Toda la Base de Datos
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )
                            }

                        </div>
                    </div>
                )}
            </div>
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

const TabButtonMobile = ({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) => (
    <button
        onClick={onClick}
        className={`flex-1 flex flex-col items-center justify-center p-3 border-b-2 transition-colors min-w-[70px] ${active ? 'border-blue-600 text-blue-600 bg-white' : 'border-transparent text-slate-500'
            }`}
    >
        {icon}
        <span className="text-[10px] font-medium mt-1">{label}</span>
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