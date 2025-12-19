import React, { useState, useEffect, useMemo } from 'react';
import { Sparkles, Download, Settings, Type, Image as ImageIcon, MessageSquare, Database, X, XCircle, RotateCcw, Lock, User, Key, Upload, Loader2, ArrowRight, BarChart3, Contact, Trash2, Pencil, AlertTriangle, ChevronDown, ChevronRight, ScanLine, Send, Share2, Check, Clock, Edit2, Info, ShieldCheck, Search, CheckCircle, FolderLock, ClipboardCheck, MapPin, Menu, Grid } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, AreaChart, Area } from 'recharts';
import * as XLSX from 'xlsx';
import { QRCodeCanvas } from 'qrcode.react';
import { GoogleGenAI } from "@google/genai";
import { jsPDF } from "jspdf";
import ScanInterface from './ScanInterface';

import { AppConfig, DEPARTMENTS, Registration, SystemUser, Child } from '../types';
import { useConfig } from '../contexts/ConfigContext';
import {
    initDefaultAdmin,
    getSystemUsers,
    saveSystemUser,
    deleteSystemUser,
    getDistributors,
    saveDistributor,
    deleteDistributor,
    deleteRegistration,
    getRegistrations,
    updateRegistration,
    updateChildStatus,
    getFullDatabaseDump,
    restoreDatabaseDump,
    clearAllRegistrations,
    saveAppConfig,
    authenticateUser,
    cleanupOrphanedInvites,
    cleanupDuplicateDistributors
} from '../services/storageService';

export interface TicketDistributor {
    name: string;
    phone?: string;
    startRange?: number;
    endRange?: number;
}





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

// --- User Management Component ---

const UsersManagementTab = () => {
    const { config } = useConfig();
    const [users, setUsers] = useState<SystemUser[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Form State
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState<Omit<SystemUser, 'id'>>({
        username: '',
        password: '',
        name: '',
        whatsapp: '',
        role: 'verifier',
        assignedDistributor: ''
    });

    const loadUsers = async () => {
        setIsLoading(true);
        const data = await getSystemUsers();
        setUsers(data);
        setIsLoading(false);
    };

    useEffect(() => {
        loadUsers();
    }, []);

    const handleEdit = (user: SystemUser) => {
        setFormData({
            username: user.username,
            password: user.password,
            name: user.name,
            whatsapp: user.whatsapp || '',
            role: user.role,
            assignedDistributor: user.assignedDistributor || ''
        });
        setEditingId(user.id);
        setIsEditing(true);
    };

    const handleDeleteUser = async (id: string, name: string) => {
        if (confirm(`¿Eliminar usuario "${name}"?`)) {
            const res = await deleteSystemUser(id);
            if (res.success) {
                loadUsers();
            } else {
                alert(res.message);
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.username || !formData.password || !formData.name) {
            alert("Todos los campos son obligatorios (excepto Distribuidor/WhatsApp)");
            return;
        }

        const payload = {
            ...formData,
            id: editingId || undefined
        };

        const res = await saveSystemUser(payload);
        if (res.success) {
            setIsEditing(false);
            setEditingId(null);
            setFormData({ username: '', password: '', name: '', whatsapp: '', role: 'verifier', assignedDistributor: '' });
            loadUsers();
            alert("Usuario guardado correctamente.");
        } else {
            alert(res.message || "Error al guardar.");
        }
    };

    const resetForm = () => {
        setIsEditing(false);
        setEditingId(null);
        setFormData({ username: '', password: '', name: '', whatsapp: '', role: 'verifier', assignedDistributor: '' });
    };

    const handleSyncDistributors = async () => {
        if (!confirm("Esto creará cuentas de usuario para todos los distribuidores configurados que aún no tengan cuenta. ¿Proceder?")) return;

        setIsLoading(true);
        let createdCount = 0;

        // Iterate through configured distributors
        for (const dist of (config.ticketDistributors || [])) {
            // Check if user exists for this distributor
            const exists = users.find(u => u.role === 'verifier' && u.assignedDistributor === dist.name);

            if (!exists) {
                // Create new user
                // Generate username: distribuidor.firstname (sanitize)
                const firstName = (dist.name || '').split(' ')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
                const username = `distribuidor.${firstName}`;
                const password = "Navidad2025"; // Generic generic password for all

                // Generate WhatsApp Onboarding Link
                // Template: Hola [Nombre], tu usuario es [User] y contraseña [Pass]. Ingresa aquí: [Link]
                const appUrl = window.location.origin + "/admin";
                const message = `Hola *${dist.name}*! 👋\n\nTe hemos creado una cuenta para verificar entregas de juguetes.\n\n👤 Usuario: *${username}*\n🔑 Contraseña: *${password}*\n\nIngresa aquí para gestionar tus entregas:\n${appUrl}`;
                const whatsappLink = `https://wa.me/${dist.phone?.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;

                const newUserResult = await saveSystemUser({
                    username,
                    password,
                    name: dist.name,
                    role: 'verifier',
                    assignedDistributor: dist.name,
                    whatsapp: dist.phone // Use phone from CRM
                });

                if (newUserResult.success) {
                    createdCount++;
                    // Ideally we could open the WA link here, but we are in a loop. 
                    // We might just want to store it or log it. 
                    // For now, let's just count it. The user has to manually send it or we build a "Send Invites" feature.
                    // But the user asked for "template with onboarding", so saving it to the user record might be useful?
                    // The current SystemUser interface doesn't store the welcome link, but we can assume standard template.
                }
            }
        }

        await loadUsers();
        setIsLoading(false);
        alert(`Sincronización completada. Se crearon ${createdCount} nuevos usuarios.\n\nContraseña genérica: Navidad2025`);
    };

    return (
        <div className="space-y-6 animate-fade-in pb-20">
            <SectionHeader title="Gestión de Usuarios" description="Crea cuentas para Administradores y Verificadores (Distribuidores)." />

            {/* Form */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <User size={18} />
                    {isEditing ? 'Editar Usuario' : 'Crear Nuevo Usuario'}
                </h4>
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-100">
                    <InputGroup label="Nombre (Responsable)" value={formData.name} onChange={v => setFormData({ ...formData, name: v })} />
                    <InputGroup label="Usuario" value={formData.username} onChange={v => setFormData({ ...formData, username: v })} />
                    <InputGroup label="Contraseña" value={formData.password} onChange={v => setFormData({ ...formData, password: v })} />
                    <InputGroup label="WhatsApp (503...)" value={formData.whatsapp || ''} onChange={v => setFormData({ ...formData, whatsapp: v })} />

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Rol</label>
                        <select
                            value={formData.role}
                            onChange={e => setFormData({ ...formData, role: e.target.value as 'admin' | 'verifier' })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                        >
                            <option value="verifier">Verificador</option>
                            <option value="admin">Administrador</option>
                            <option value="whatsapp_sender">Enviador WhatsApp</option>
                        </select>
                    </div>

                    {(formData.role === 'verifier' || formData.role === 'whatsapp_sender') && (
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Distribuidor Asociado (Opcional)</label>
                            <input
                                type="text"
                                value={formData.assignedDistributor}
                                onChange={e => setFormData({ ...formData, assignedDistributor: e.target.value })}
                                placeholder="Ej: Zona Norte"
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                            />
                        </div>
                    )}

                    <div className="md:col-span-2 lg:col-span-3 flex justify-end gap-2 mt-2">
                        {isEditing && (
                            <button type="button" onClick={resetForm} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors">
                                Cancelar
                            </button>
                        )}
                        <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-bold shadow-sm transition-colors flex items-center gap-2">
                            <Sparkles size={16} />
                            {isEditing ? 'Actualizar Usuario' : 'Crear Usuario'}
                        </button>
                    </div>
                </form>
            </div >

            {/* List */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50 font-bold text-slate-700 flex justify-between">
                    <span>Usuarios del Sistema</span>
                    <div className="flex gap-2">
                        <button onClick={handleSyncDistributors} className="text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-1 rounded-lg font-medium transition-colors flex items-center gap-1">
                            <Sparkles size={14} /> Sincronizar Distribuidores
                        </button>
                        <button onClick={loadUsers} title="Recargar"><RotateCcw size={16} /></button>
                    </div>
                </div>

                {
                    isLoading ? (
                        <div className="p-8 text-center text-slate-500"><Loader2 className="animate-spin w-6 h-6 mx-auto mb-2" />Cargando...</div>
                    ) : (
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 text-slate-500 font-medium">
                                <tr>
                                    <th className="px-4 py-3">Nombre</th>
                                    <th className="px-4 py-3">Usuario</th>
                                    <th className="px-4 py-3">Rol</th>
                                    <th className="px-4 py-3">WhatsApp</th>
                                    <th className="px-4 py-3">Distribuidor</th>
                                    <th className="px-4 py-3 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {users.map(u => (
                                    <tr key={u.id} className="hover:bg-slate-50/50">
                                        <td className="px-4 py-3 font-medium text-slate-800">{u.name}</td>
                                        <td className="px-4 py-3 font-mono text-slate-600">{u.username}</td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'}`}>
                                                {u.role === 'admin' ? 'ADMIN' : u.role === 'whatsapp_sender' ? 'WA SENDER' : 'VERIFICADOR'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-slate-500">{u.whatsapp || '-'}</td>
                                        <td className="px-4 py-3 text-slate-500">{u.assignedDistributor || '-'}</td>
                                        <td className="px-4 py-3 flex justify-end gap-2">
                                            <button onClick={() => handleEdit(u)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="Editar"><Settings size={16} /></button>
                                            {u.role !== 'admin' && (
                                                <button
                                                    onClick={() => {
                                                        const appUrl = window.location.origin; // Current URL
                                                        let message = `Hola *${u.name}*! 👋\n\nHas sido registrado en el sistema de *Fundación Bukele*.\n\n🔐 *Tus Credenciales:*\nUsuario: ${u.username}\nContraseña: ${u.password}\n\n🌐 *Accede aquí:* ${appUrl}\n\n`;

                                                        if (u.role === 'verifier') {
                                                            message += `🛡️ *Rol: Verificador*\n📍 *Punto:* ${u.assignedDistributor}\n\nTu tarea es escanear los códigos QR de los beneficiarios para entregar los juguetes.`;
                                                        } else if (u.role === 'whatsapp_sender') {
                                                            message += `💬 *Rol: Envíos WhatsApp*\n\nTu tarea es enviar las confirmaciones y QRs a los padres beneficiados.`;
                                                        }

                                                        // Use stored whatsapp number if available, otherwise open blank for user to choose
                                                        const targetPhone = u.whatsapp ? u.whatsapp.replace(/[^0-9]/g, '') : '';
                                                        const url = `https://wa.me/${targetPhone}?text=${encodeURIComponent(message)}`;
                                                        window.open(url, '_blank');
                                                    }}
                                                    className="p-1.5 text-green-600 hover:bg-green-50 rounded"
                                                    title="Enviar Onboarding por WhatsApp"
                                                >
                                                    <MessageSquare size={16} />
                                                </button>
                                            )}
                                            {u.username !== 'jorge' && (
                                                <button onClick={() => handleDeleteUser(u.id, u.name)} className="p-1.5 text-red-600 hover:bg-red-50 rounded" title="Eliminar"><Trash2 size={16} /></button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {users.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="p-8 text-center text-slate-400 italic">No hay usuarios registrados (solo Super Admin hardcoded).</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )
                }
            </div>
        </div>
    );
};

// --- System Backup Component ---

const SystemBackupTab = () => {
    const [isRestoring, setIsRestoring] = useState(false);

    const handleDownloadBackup = async () => {
        try {
            const dump = await getFullDatabaseDump();
            const jsonString = JSON.stringify(dump, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = `backup_juguetes_${new Date().toISOString().split('T')[0]}_${new Date().getTime()}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (e) {
            alert("Error al generar respaldo: " + e);
        }
    };

    const handleRestoreBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const json = JSON.parse(event.target?.result as string);

                // Security Check
                const confirmation = prompt("⚠️ PELIGRO CRÍTICO ⚠️\n\nEstás a punto de RESTAURAR una copia de seguridad.\nESTO BORRARÁ TODOS LOS DATOS ACTUALES y los reemplazará con los del archivo.\n\nPara confirmar, escribe: RESTAURAR");

                if (confirmation === 'RESTAURAR') {
                    setIsRestoring(true);
                    const res = await restoreDatabaseDump(json);
                    setIsRestoring(false);

                    if (res.success) {
                        alert("✅ Restauración completada con éxito. La página se recargará.");
                        window.location.reload();
                    } else {
                        alert("❌ Error al restaurar: " + res.message);
                    }
                } else {
                    alert("Restauración cancelada.");
                }

            } catch (err) {
                alert("Error al leer el archivo de respaldo. Asegúrate que sea un JSON válido.");
                setIsRestoring(false);
            }
        };
        reader.readAsText(file);
        // Reset input
        e.target.value = '';
    };

    return (
        <div className="space-y-6 animate-fade-in pb-20">
            <SectionHeader title="Sistemas y Respaldos" description="Gestión de copias de seguridad y recuperación ante desastres." />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Backup Card */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div className="bg-blue-50 w-12 h-12 rounded-full flex items-center justify-center text-blue-600 mb-4">
                        <Download size={24} />
                    </div>
                    <h4 className="font-bold text-lg text-slate-800 mb-2">Crear Respaldo</h4>
                    <p className="text-sm text-slate-500 mb-6">
                        Descarga una copia completa de la base de datos (Registros, Usuarios, Configuración) en formato JSON.
                        Guarda este archivo en un lugar seguro.
                    </p>
                    <button
                        onClick={handleDownloadBackup}
                        className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                        <Database size={18} /> Descargar Respaldo JSON
                    </button>
                </div>

                {/* Restore Card */}
                <div className="bg-white p-6 rounded-xl border border-red-100 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-bl-lg">
                        ZONA DE PELIGRO
                    </div>
                    <div className="bg-red-50 w-12 h-12 rounded-full flex items-center justify-center text-red-600 mb-4">
                        <Upload size={24} />
                    </div>
                    <h4 className="font-bold text-lg text-slate-800 mb-2">Restaurar Sistema</h4>
                    <p className="text-sm text-slate-500 mb-6">
                        Sube un archivo de respaldo (.json) para restaurar el sistema.
                        <br /><span className="font-bold text-red-600">ADVERTENCIA: Esto borrará todos los datos actuales.</span>
                    </p>

                    <label className={`w-full py-2 ${isRestoring ? 'bg-slate-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700 cursor-pointer'} text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2 text-center`}>
                        {isRestoring ? (
                            <><Loader2 className="animate-spin" size={18} /> Restaurando...</>
                        ) : (
                            <><RotateCcw size={18} /> Restaurar desde Archivo</>
                        )}
                        <input
                            type="file"
                            accept=".json"
                            onChange={handleRestoreBackup}
                            disabled={isRestoring}
                            className="hidden"
                        />
                    </label>
                </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mt-6">
                <h5 className="font-bold text-slate-700 mb-2 flex items-center gap-2">
                    <Info size={16} /> Protocolo de Emergencia
                </h5>
                <ul className="list-disc list-inside text-sm text-slate-600 space-y-1">
                    <li>Realice respaldos periódicos (ej. al finalizar cada día).</li>
                    <li>Si el sistema falla, intente recargar la página primero.</li>
                    <li>Si los datos están corruptos, use la opción de "Restaurar" con el último respaldo válido.</li>
                    <li>Este proceso solo restaura datos, no el código de la aplicación.</li>
                </ul>
            </div>
        </div>
    );
};
const EditRegistrationModal = ({ registration, onClose, onSave }: { registration: Registration, onClose: () => void, onSave: (id: string, data: Partial<Registration>) => Promise<void> }) => {
    const [formData, setFormData] = useState({ ...registration });
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        setLoading(true);
        // Clean children data if needed or just pass as is
        await onSave(registration.id, formData);
        setLoading(false);
        onClose();
    };

    const updateChild = (idx: number, field: string, value: any) => {
        const newChildren = [...(formData.children || [])];
        // Safe check if children exists
        if (!newChildren[idx]) return;

        (newChildren[idx] as any)[field] = value;
        setFormData({ ...formData, children: newChildren });
    };

    return (
        <div className="fixed inset-0 z-[80] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-xl">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <Settings size={18} /> Editar Registro (CRM)
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
                </div>

                <div className="p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InputGroup label="Nombre del Padre/Madre" value={formData.parentName} onChange={v => setFormData({ ...formData, parentName: v })} />
                        <InputGroup label="WhatsApp" value={formData.whatsapp} onChange={v => setFormData({ ...formData, whatsapp: v })} />
                        <InputGroup label="Departamento" value={formData.department} onChange={v => setFormData({ ...formData, department: v })} />
                        <InputGroup label="Municipio" value={formData.municipality} onChange={v => setFormData({ ...formData, municipality: v })} />
                        <InputGroup label="Distrito" value={formData.district} onChange={v => setFormData({ ...formData, district: v })} />
                        <div className="md:col-span-2">
                            <TextAreaGroup label="Detalles de Dirección" value={formData.addressDetails} onChange={v => setFormData({ ...formData, addressDetails: v })} />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Distribuidor Asignado</label>
                            <input
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-50"
                                value={formData.ticketDistributor}
                                onChange={e => setFormData({ ...formData, ticketDistributor: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                        <h4 className="font-bold text-slate-700 mb-2 text-sm flex justify-between">
                            <span>Niños Registrados</span>
                            <span className="text-xs font-normal text-slate-400">Total: {formData.children?.length || 0}</span>
                        </h4>

                        {(formData.children || []).map((child, idx) => (
                            <div key={idx} className="mb-2 p-3 bg-white border border-slate-200 rounded-lg grid grid-cols-1 md:grid-cols-12 gap-3 items-end text-sm shadow-sm">
                                <div className="md:col-span-4">
                                    <label className="block text-[10px] text-slate-400 mb-0.5">Nombre Completo</label>
                                    <input className="w-full border rounded px-2 py-1.5 focus:ring-2 ring-blue-100 outline-none"
                                        value={child.fullName}
                                        onChange={e => updateChild(idx, 'fullName', e.target.value)}
                                        placeholder="Nombre Niño"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-[10px] text-slate-400 mb-0.5">Edad</label>
                                    <input type="number" className="w-full border rounded px-2 py-1.5 focus:ring-2 ring-blue-100 outline-none"
                                        value={child.age}
                                        onChange={e => updateChild(idx, 'age', parseInt(e.target.value) || 0)}
                                        placeholder="Edad"
                                    />
                                </div>
                                <div className="md:col-span-3">
                                    <label className="block text-[10px] text-slate-400 mb-0.5">Género</label>
                                    <select className="w-full border rounded px-2 py-1.5 focus:ring-2 ring-blue-100 outline-none bg-white"
                                        value={child.gender}
                                        onChange={e => updateChild(idx, 'gender', e.target.value)}
                                    >
                                        <option value="Niño">Niño</option>
                                        <option value="Niña">Niña</option>
                                    </select>
                                </div>
                                <div className="md:col-span-3 text-right">
                                    <span className="inline-block bg-slate-100 text-slate-500 px-2 py-1 rounded text-xs font-mono">
                                        {child.inviteNumber}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="p-4 border-t border-slate-100 bg-slate-50 rounded-b-xl flex justify-end gap-2">
                    <button onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg font-medium transition-colors">Cancelar</button>
                    <button onClick={handleSave} disabled={loading} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-md transition-colors flex items-center gap-2">
                        {loading ? <Loader2 className="animate-spin w-4 h-4" /> : <Sparkles size={16} />} Guardar Cambios
                    </button>
                </div>
            </div>
        </div>
    );
};

const AdminPanel: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Auth State
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [currentUser, setCurrentUser] = useState<SystemUser | null>(null);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loginError, setLoginError] = useState('');

    const [activeTab, setActiveTab] = useState<'general' | 'hero' | 'content' | 'whatsapp' | 'data' | 'stats' | 'scanner' | 'users' | 'wa_list' | 'system'>('general');
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const { config, updateConfig, resetConfig, refreshConfig } = useConfig();

    const [localConfig, setLocalConfig] = useState<AppConfig>(config);
    const [hasChanges, setHasChanges] = useState(false);

    // WA View State
    const [showPendingOnly, setShowPendingOnly] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setLocalConfig(config);
            setHasChanges(false);
        }
        // Initialize Admin Security Check
        initDefaultAdmin();
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
    const [viewingQR, setViewingQR] = useState<{ name: string, data: string, invite: string } | null>(null);
    const [editingReg, setEditingReg] = useState<Registration | null>(null);

    const loadData = async () => {
        // SCOPED VIEW: Filter by distributor for Verifiers
        const distributorFilter = (currentUser?.role === 'verifier' && currentUser?.assignedDistributor)
            ? currentUser.assignedDistributor
            : undefined;

        const data = await getRegistrations(distributorFilter);
        setRegistrationCount(data.length);
        setRegistrations(data);
    };

    useEffect(() => {
        if (isAuthenticated) {
            loadData();
        }
    }, [isAuthenticated, isOpen]);

    const [aiGeneratedImage, setAiGeneratedImage] = useState<string | null>(null);
    const [aiLoading, setAiLoading] = useState(false);
    const [aiError, setAiError] = useState<string | null>(null);
    const [aiPrompt, setAiPrompt] = useState('');

    // Distributor CRUD State
    const [editingDistributorIndex, setEditingDistributorIndex] = useState<number | null>(null);
    const [tempDistributorName, setTempDistributorName] = useState('');
    const [tempDistributorPhone, setTempDistributorPhone] = useState('');
    const [tempDistributorStart, setTempDistributorStart] = useState<number>(0);
    const [tempDistributorEnd, setTempDistributorEnd] = useState<number>(0);
    const [newDistributorName, setNewDistributorName] = useState('');
    const [newDistributorPhone, setNewDistributorPhone] = useState('');
    const [newDistributorStart, setNewDistributorStart] = useState<number>(0);
    const [newDistributorEnd, setNewDistributorEnd] = useState<number>(0);


    // Normalization Logic: Group Legacy Records by WhatsApp
    const normalizedRegistrations = useMemo(() => {
        const legacyGroups: Record<string, Registration[]> = {}; // Key: whatsapp
        const modernRecords: Registration[] = [];

        registrations.forEach(reg => {
            if (reg.children && reg.children.length > 0) {
                modernRecords.push(reg);
            } else {
                // Legacy Record
                // Sanitize WhatsApp for grouping (remove spaces, dashes, etc.)
                const rawWa = reg.whatsapp || '';
                const key = rawWa.replace(/\D/g, '') || 'unknown';

                if (!legacyGroups[key]) legacyGroups[key] = [];
                legacyGroups[key].push(reg);
            }
        });

        const groupedLegacy: Registration[] = Object.entries(legacyGroups).map(([wa, group]) => {
            const first = group[0];
            return {
                ...first,
                id: `legacy_group_${wa}`, // Virtual ID
                children: group.map((g, idx) => ({
                    id: g.id,
                    // Use updated fields or fallback to legacy top-level fields
                    inviteNumber: g.inviteNumber || '???',
                    fullName: g.fullName || 'Niño (Legacy)',
                    age: g.childAge || 0,
                    gender: g.genderSelection || 'N/A',
                    // Logic for legacy status: if we don't have it, assume pending. 
                    // In future we could check db for specific child status if migrated.
                    status: 'pending' as const
                })),
                childCount: group.length,
                timestamp: group.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0].timestamp
            };
        });

        return [...modernRecords, ...groupedLegacy].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }, [registrations]);

    // Helper to determine distributor for a SINGLE TICKET (Strict Logic)
    const getDistributorForTicket = (inviteNumber: string | undefined, distributors: TicketDistributor[]): string => {
        if (!inviteNumber) return 'Otros / Sin Asignar';
        const ticketNum = parseInt(inviteNumber.replace(/\D/g, '')) || 0;

        if (ticketNum > 0) {
            const match = distributors.find(d =>
                d.startRange && d.endRange && ticketNum >= d.startRange && ticketNum <= d.endRange
            );
            if (match) return match.name;
        }
        return 'Otros / Sin Asignar';
    };

    // Statistics Data Processing (Consumed Normalized Data)
    const stats = useMemo(() => {
        // 1. Gender Distribution
        const genderData = [
            {
                name: 'Niños',
                value: normalizedRegistrations.reduce((acc, r) => {
                    return acc + (r.children || []).filter(c => c.gender === 'Niño' || (c.gender || '').toLowerCase().includes('niño')).length;
                }, 0)
            },
            {
                name: 'Niñas',
                value: normalizedRegistrations.reduce((acc, r) => {
                    return acc + (r.children || []).filter(c => c.gender === 'Niña' || (c.gender || '').toLowerCase().includes('niña')).length;
                }, 0)
            },
            {
                name: 'Mixto/Otro',
                value: normalizedRegistrations.reduce((acc, r) => {
                    // For pure mixed we might need to check parent if it was an aggregate, but with normalized children we count individuals.
                    // The chart expects aggregated "Mixto" which doesn't make sense if we break down by child.
                    // But if the user wants "Families with Mixed", that's different.
                    // The original logic counted "Mixto" gender selection.
                    // If we are strictly counting children, they are either Boy or Girl. 
                    // We will leave this 0 or repurposed if needed, but for now strict binary count based on children is better.
                    // Actually, some legacy records *literal gender* is "Mixto" (pack of toys).
                    // If child.gender is "Mixto", count it here.
                    return acc + (r.children || []).filter(c =>
                        !['Niño', 'Niña'].includes(c.gender) &&
                        !c.gender.toLowerCase().includes('niño') &&
                        !c.gender.toLowerCase().includes('niña')
                    ).length;
                }, 0)
            }
        ].filter(d => d.value > 0);

        // 2. Top Municipalities
        const muniCount: Record<string, number> = {};
        normalizedRegistrations.forEach(r => {
            const muni = r.municipality || 'Desconocido';
            muniCount[muni] = (muniCount[muni] || 0) + 1;
        });
        const municipalData = Object.entries(muniCount)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5);

        // 3. Delivery Progress
        let totalTickets = 0;
        let deliveredTickets = 0;

        normalizedRegistrations.forEach(r => {
            r.children.forEach(c => {
                totalTickets++;
                if (c.status === 'delivered') deliveredTickets++;
            });
        });

        const deliveryProgressData = [
            { name: 'Entregados', value: deliveredTickets },
            { name: 'Pendientes', value: totalTickets - deliveredTickets }
        ].filter(d => d.value > 0);

        // 7. Red Flags (Phones with > 3 children)
        // Normalized regs already group legacy by phone, so we just check r.children.length
        const redFlags = normalizedRegistrations
            .filter(r => r.children.length > 3)
            .map(r => ({ phone: r.whatsapp || 'unknown', count: r.children.length }))
            .sort((a, b) => b.count - a.count);

        // 4. Timeline
        const timelineMap: Record<string, { count: number, label: string }> = {};
        normalizedRegistrations.forEach(r => {
            const d = new Date(r.timestamp);
            const key = !isNaN(d.getTime()) ? d.toISOString().split('T')[0] : 'Invalid Date';
            const label = d.toLocaleDateString('es-SV', { month: 'short', day: 'numeric' });
            if (!timelineMap[key]) timelineMap[key] = { count: 0, label };
            timelineMap[key].count++;
        });
        const timelineData = Object.entries(timelineMap).sort((a, b) => a[0].localeCompare(b[0])).map(([_, val]) => ({ date: val.label, count: val.count }));

        // 5. Age Distribution
        const ageCount: Record<number, number> = {};
        normalizedRegistrations.forEach(r => {
            r.children.forEach(c => {
                const a = c.age !== undefined ? c.age : 0;
                ageCount[a] = (ageCount[a] || 0) + 1;
            });
        });
        const ageData = Array.from({ length: 13 }, (_, i) => ({
            age: `${i} años`,
            count: ageCount[i] || 0
        }));

        // 6. Distributor Stats (Range Capacity vs Registered)
        const distCount: Record<string, { registered: number, missing: number, total: number }> = {};

        // 1. Initialize with RANGE capacities
        (config.ticketDistributors || []).forEach(d => {
            const rangeSize = (d.startRange && d.endRange) ? (d.endRange - d.startRange + 1) : 0;
            distCount[d.name] = { registered: 0, missing: rangeSize, total: rangeSize };
        });

        // Always have an entry for others, starts at 0/0/0 and grows as we find them
        if (!distCount['Otros / Sin Asignar']) {
            distCount['Otros / Sin Asignar'] = { registered: 0, missing: 0, total: 0 };
        }

        // 2. Count ACTUAL Registrations (This signals "Distribution to Parent")
        const registeredTicketsSet = new Set<number>();

        normalizedRegistrations.forEach(r => {
            r.children.forEach(c => {
                const num = parseInt(c.inviteNumber.replace(/\D/g, ''));

                // Track Unique Registered Tickets
                if (!isNaN(num) && !registeredTicketsSet.has(num)) {
                    registeredTicketsSet.add(num);

                    // Find who this belongs to
                    const distName = getDistributorForTicket(c.inviteNumber, config.ticketDistributors || []);
                    let finalDist = distName;

                    // Fallback to text override if "Others"
                    if (distName === 'Otros / Sin Asignar' && r.ticketDistributor) {
                        finalDist = r.ticketDistributor;
                    }

                    // Ensure entry exists (for manual overrides that aren't in config list)
                    if (!distCount[finalDist]) {
                        distCount[finalDist] = { registered: 0, missing: 0, total: 0 };
                    }

                    distCount[finalDist].registered++;

                    // Logic for "Missing":
                    // If it's a known distributor with a range, "missing" decreases as they register.
                    // But prevent negative missing if they go over (or if range is 0)
                    if (distCount[finalDist].total > 0) {
                        distCount[finalDist].missing = Math.max(0, distCount[finalDist].total - distCount[finalDist].registered);
                    } else {
                        // For "Others" or manual, Total grows with Registered, Missing stays 0
                        distCount[finalDist].total++;
                    }
                }
            });
        });

        const distributorData = Object.entries(distCount)
            .map(([name, counts]) => ({
                name,
                value: counts.total,
                registered: counts.registered,
                missing: counts.missing
            }))
            .sort((a, b) => b.value - a.value);

        // 8. Top Colonies (Address Details)
        // 8. Top Colonies (Address Details)
        // Structure: { "COLONIA X": { total: 10, distributors: { "Dist A": 5, "Dist B": 5 } } }
        const colonyDetails: Record<string, { total: number, distributors: Record<string, number> }> = {};

        normalizedRegistrations.forEach(r => {
            const rawColony = (r.addressDetails || 'Sin Dato').trim();
            if (rawColony.length > 2) {
                const key = rawColony.toUpperCase();

                if (!colonyDetails[key]) {
                    colonyDetails[key] = { total: 0, distributors: {} };
                }

                // Determine distributor for this registration (mostly parent level)
                // Use first child to determine representative distributor
                const representativeChild = r.children[0];
                let distName = 'Desconocido';
                if (representativeChild) {
                    distName = getDistributorForTicket(representativeChild.inviteNumber, config.ticketDistributors || []);
                }

                // Fallback to manual assignment if "Others"
                if ((distName === 'Otros / Sin Asignar' || distName === 'Desconocido') && r.ticketDistributor) {
                    distName = r.ticketDistributor;
                }

                // Add to total
                colonyDetails[key].total++;
                // Add to distributor specific count
                colonyDetails[key].distributors[distName] = (colonyDetails[key].distributors[distName] || 0) + 1;
            }
        });

        const colonyData = Object.entries(colonyDetails)
            .map(([name, data]) => ({
                name,
                value: data.total,
                displayName: name.length > 20 ? name.substring(0, 18) + '...' : name,
                ...data.distributors // Spread distributors as keys: { "Juan": 5, "Maria": 2 }
            }))
            .sort((a, b) => b.value - a.value);

        return { genderData, municipalData, deliveryProgressData, timelineData, ageData, distributorData, redFlags, colonyData };
    }, [normalizedRegistrations, config.ticketDistributors]);

    // Progress
    const progressPercentage = Math.min(100, Math.round((registrations.length / localConfig.maxRegistrations) * 100));

    // ... (keep handleLogin and others) ...



    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoginError('');

        const user = await authenticateUser(username, password);

        if (user) {
            setIsAuthenticated(true);
            setCurrentUser(user);
            // Redirect based on role
            if (user.role === 'verifier') {
                setActiveTab('scanner');
            } else if (user.role === 'whatsapp_sender') {
                setActiveTab('wa_list');
            } else {
                setActiveTab('general');
            }
        } else {
            setLoginError('Credenciales incorrectas. Intente nuevamente.');
        }
    };

    const handleExport = async (type: 'xlsx' | 'csv') => {
        // Use normalizedRegistrations (current view state) instead of fetching fresh raw data
        const data = normalizedRegistrations;

        if (data.length === 0) {
            alert("No hay registros para exportar.");
            return;
        }

        // Export individual children rows
        const exportData: any[] = [];

        data.forEach(reg => {
            reg.children.forEach(child => {
                exportData.push({
                    "Nombre Padre/Madre": reg.parentName || reg.fullName || "N/A",
                    "Nombre Niño": child.fullName,
                    "No. Invitación": child.inviteNumber,
                    "Edad": child.age,
                    "Género": child.gender,
                    "WhatsApp": reg.whatsapp,
                    "Departamento": reg.department,
                    "Municipio": reg.municipality,
                    "Distrito": reg.district || "N/A",
                    "Dirección": reg.addressDetails || "N/A",
                    "Distribuidor": reg.ticketDistributor || "N/A",
                    "Estado": child.status === 'delivered' ? 'ENTREGADO' : 'PENDIENTE',
                    "Fecha Registro": new Date(reg.timestamp).toLocaleString('es-SV')
                });
            });
        });

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

    // Normalized Registrations was moved up to be available for stats.

    // Distributor Control Logic (Strict Range Audit)
    const distributorAudit = useMemo(() => {
        if (!config.ticketDistributors) return [];

        // 1. Collect ALL registered ticket numbers and their status
        const registeredTickets = new Map<number, { status: string, location?: string }>();
        normalizedRegistrations.forEach(r => {
            r.children.forEach(c => {
                const num = parseInt(c.inviteNumber.replace(/\D/g, ''));
                if (!isNaN(num)) {
                    // If duplicate, we just take the last one (edge case), or prioritize delivered?
                    // Let's prioritize delivered if duplicates exist.
                    const current = registeredTickets.get(num);
                    if (!current || c.status === 'delivered') {
                        registeredTickets.set(num, {
                            status: c.status || 'pending',
                            location: r.addressDetails // Capture location from parent registration
                        });
                    }
                }
            });
        });

        // 2. Check each distributor's range against the collected numbers
        return config.ticketDistributors.map(dist => {
            const start = dist.startRange || 0;
            const end = dist.endRange || 0;
            const totalAssigned = (start > 0 && end > 0) ? (end - start + 1) : 0;

            const missingTickets: number[] = [];
            let registeredCount = 0;
            let deliveredCount = 0;

            // Location tracking for this distributor
            const locationCounts: Record<string, number> = {};

            if (totalAssigned > 0) {
                for (let i = start; i <= end; i++) {
                    const ticket = registeredTickets.get(i);
                    if (ticket) {
                        registeredCount++;
                        if (ticket.status === 'delivered') {
                            deliveredCount++;
                        }

                        // Count Location
                        if (ticket.location && ticket.location.trim().length > 2) {
                            const loc = ticket.location.trim().toUpperCase();
                            // Use original case from first occurrence or just capitalized? 
                            // Let's store UPPER key but maybe we want display name.
                            // For simplicity, let's just use the raw string but grouped by UPPER
                            locationCounts[loc] = (locationCounts[loc] || 0) + 1;
                        }
                    } else {
                        missingTickets.push(i);
                    }
                }
            }

            // Convert location counts to array for Chart
            const allLocations = Object.entries(locationCounts)
                .map(([name, value]) => ({
                    name: name.length > 20 ? name.substring(0, 18) + '...' : name, // Truncate for display
                    fullName: name,
                    value
                }))
                .sort((a, b) => b.value - a.value);

            return {
                name: dist.name,
                range: `${start} - ${end}`,
                totalAssigned,
                registeredCount,
                deliveredCount,
                percentRegistered: totalAssigned > 0 ? Math.round((registeredCount / totalAssigned) * 100) : 0,
                percentDelivered: totalAssigned > 0 ? Math.round((deliveredCount / totalAssigned) * 100) : 0,
                missingTickets,
                allLocations
            };
        }).sort((a, b) => b.missingTickets.length - a.missingTickets.length);
    }, [config.ticketDistributors, normalizedRegistrations]);

    const phoneAudit = useMemo(() => {
        const invalidPhones: { name: string, phone: string, distributor: string }[] = [];
        normalizedRegistrations.forEach(reg => {
            const cleanPhone = reg.whatsapp ? reg.whatsapp.replace(/\D/g, '') : '';
            // Check if phone is NOT exactly 8 digits
            if (cleanPhone.length !== 8) {
                invalidPhones.push({
                    name: reg.parentName || reg.fullName || 'Sin Nombre',
                    phone: reg.whatsapp || 'N/A',
                    distributor: reg.ticketDistributor || 'Sin Asignar'
                });
            }
        });
        return invalidPhones;
    }, [normalizedRegistrations]);

    // PDF Control List for Distributor
    const handleDownloadDistributorControl = (distributor: TicketDistributor) => {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();

        // 1. Filter Data (STRICT LOGIC: Only tickets belonging to this distributor)
        const relevantChildren: { invite: string, name: string, age: number, gender: string, parent: string }[] = [];

        normalizedRegistrations.forEach(reg => {
            reg.children.forEach(child => {
                // Check if THIS SPECIFIC TICKET belongs to the distributor
                const ownerName = getDistributorForTicket(child.inviteNumber, config.ticketDistributors || []);

                // Also handle the fallback text case if it matches this distributor name
                let finalOwner = ownerName;
                if (ownerName === 'Otros / Sin Asignar' && reg.ticketDistributor === distributor.name) {
                    finalOwner = distributor.name;
                }

                if (finalOwner === distributor.name) {
                    relevantChildren.push({
                        invite: child.inviteNumber,
                        name: child.fullName,
                        age: child.age || 0,
                        gender: child.gender,
                        parent: reg.parentName || reg.fullName || 'N/A'
                    });
                }
            });
        });

        // 2. Sort by Ticket Number
        relevantChildren.sort((a, b) => {
            const numA = parseInt(a.invite.replace(/\D/g, '')) || 0;
            const numB = parseInt(b.invite.replace(/\D/g, '')) || 0;
            return numA - numB;
        });

        // 3. Header
        doc.setFontSize(18);
        doc.text("Control de Distribución", pageWidth / 2, 15, { align: "center" });

        doc.setFontSize(14);
        doc.setTextColor(100);
        doc.text(`${distributor.name}`, pageWidth / 2, 22, { align: "center" });

        doc.setFontSize(10);
        doc.setTextColor(0);
        let headerText = `Total Tickets: ${relevantChildren.length}`;
        if (distributor.startRange && distributor.endRange) {
            headerText = `Rango: ${distributor.startRange} - ${distributor.endRange} | ` + headerText;
        }
        doc.text(headerText, pageWidth / 2, 28, { align: "center" });
        doc.text(`Generado: ${new Date().toLocaleString()}`, pageWidth / 2, 33, { align: "center" });

        // 4. Table Header
        let y = 45; // Increased spacing from top
        const colX = { ticket: 14, state: 35, name: 65, age: 130, parent: 155, phone: 210 }; // Adjusted columns

        // Background for Header
        doc.setFillColor(240, 240, 240);
        doc.rect(10, y - 5, pageWidth - 20, 8, 'F');

        doc.setFontSize(9);
        doc.setTextColor(0);
        doc.setFont("helvetica", "bold");

        doc.text("Ticket", colX.ticket, y);
        doc.text("Estado", colX.state, y);
        doc.text("Beneficiario", colX.name, y);
        doc.text("Edad/Sex", colX.age, y);
        doc.text("Responsable", colX.parent, y);
        // doc.text("Teléfono", colX.phone, y); // Phone might be too wide, maybe just Parent Name

        y += 10; // More space after header

        // 5. Table Rows
        doc.setFont("helvetica", "normal");
        relevantChildren.forEach((child, index) => {
            if (y > 270) {
                doc.addPage();
                y = 20;
            }

            // Zebra striping
            if (index % 2 === 1) {
                doc.setFillColor(252, 252, 252);
                doc.rect(10, y - 5, pageWidth - 20, 8, 'F');
            }

            // Ticket
            doc.setFont("helvetica", "bold");
            doc.text(child.invite, colX.ticket, y);

            // Status (Mocked as Registered for now as that's what it is)
            doc.setFont("helvetica", "normal");
            doc.setTextColor(0, 128, 0); // Green
            doc.text("REGISTRADO", colX.state, y);
            doc.setTextColor(0);

            // Child Name
            const childName = child.name.length > 28 ? child.name.substring(0, 25) + '...' : child.name;
            doc.text(childName, colX.name, y);

            // Age / Gender (Better Format)
            // "4 / Niño" instead of "4 / N"
            const genderFull = child.gender === 'Niña' ? 'Niña' : 'Niño';
            doc.text(`${child.age} / ${genderFull}`, colX.age, y);

            // Parent Name (Responsable)
            const parentName = child.parent.length > 25 ? child.parent.substring(0, 22) + '...' : child.parent;
            doc.text(parentName, colX.parent, y);

            // Phone (Optional, if we have space, currently omitted to fit neatly)

            y += 8; // Row height
        });

        doc.save(`Control_${distributor.name.replace(/\s+/g, '_')}.pdf`);
    };


    // Filtered Registrations (use Normalized now)
    const filteredRegistrations = useMemo(() => {
        let result = normalizedRegistrations; // USE NORMALIZED HERE

        // 1. Text Search
        // 1. Text Search
        if (searchTerm) {
            const lowerInfo = searchTerm.toLowerCase();
            // Try to extract a pure number from the search term for looser matching (e.g., "NI0618" -> 618)
            const numericSearch = parseInt(lowerInfo.replace(/\D/g, ''));
            const hasNumericSearch = !isNaN(numericSearch);

            result = result.filter(reg => {
                // Basic string fields
                if (
                    (reg.parentName || reg.fullName || '').toLowerCase().includes(lowerInfo) ||
                    (reg.whatsapp || '').includes(lowerInfo) ||
                    (reg.ticketDistributor || '').toLowerCase().includes(lowerInfo)
                ) return true;

                // Check tickets (children & legacy field) with enhanced logic
                const checkTicket = (invite: string | undefined) => {
                    if (!invite) return false;
                    const val = invite.toLowerCase();
                    if (val.includes(lowerInfo)) return true; // Direct substring match

                    // Numeric equivalence check (e.g. search "NI0618" matches "618")
                    if (hasNumericSearch) {
                        const valNum = parseInt(val.replace(/\D/g, ''));
                        // Exact numeric match is usually what's needed if specific format fails
                        if (!isNaN(valNum) && valNum === numericSearch) return true;
                    }
                    return false;
                };

                if (checkTicket(reg.inviteNumber)) return true;
                return (reg.children || []).some(child => checkTicket(child.inviteNumber));
            });
        }


        // 2. Pending Only Filter (WA View)
        if (activeTab === 'wa_list' && showPendingOnly) {
            result = result.filter(r => !r.whatsappSent);
        }

        // 3. Tab Specific Filters (existing logic)
        if (activeTab === 'scanner') return result; // Scanner usually clears this anyway or uses its own lookup

        return result;
    }, [registrations, searchTerm, activeTab, showPendingOnly]);

    const groupedRegistrations = useMemo(() => {
        const groups: Record<string, Registration[]> = {};
        const displayList = filteredRegistrations;

        displayList.forEach(reg => {
            // MULTI-ASSIGNMENT LOGIC
            // A family can belong to multiple distributors if they have mixed tickets.
            const distributorsFound = new Set<string>();

            reg.children.forEach(c => {
                let dName = getDistributorForTicket(c.inviteNumber, config.ticketDistributors || []);
                // Fallback for tickets out of range but with manual text
                if (dName === 'Otros / Sin Asignar' && reg.ticketDistributor) {
                    dName = reg.ticketDistributor;
                }
                distributorsFound.add(dName);
            });

            // If no children (legacy edge case with 0 kids?), use text
            if (reg.children.length === 0 && reg.ticketDistributor) {
                distributorsFound.add(reg.ticketDistributor);
            }
            // If still empty (no kids, no text), "Otros"
            if (distributorsFound.size === 0) distributorsFound.add('Otros / Sin Asignar');

            distributorsFound.forEach(distName => {
                if (!groups[distName]) groups[distName] = [];
                groups[distName].push(reg);
            });
        });

        // Smart Sort: By Total Tickets IN THAT GROUP (High to Low)
        return Object.entries(groups).map(([distName, regs]) => {
            // Calculate how many tickets in this group actually belong to this distributor
            // This is needed for the sort and the UI badge
            const relevantTickets = regs.reduce((acc, r) => {
                return acc + r.children.filter(c => {
                    let d = getDistributorForTicket(c.inviteNumber, config.ticketDistributors || []);
                    if (d === 'Otros / Sin Asignar' && r.ticketDistributor) d = r.ticketDistributor;
                    return d === distName;
                }).length;
            }, 0);
            return { distName, regs, relevantTickets };
        }).sort((a, b) => b.relevantTickets - a.relevantTickets); // Sort by volume
    }, [filteredRegistrations, config.ticketDistributors]);


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
            for (const id of Array.from(selectedIds) as string[]) {
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

    const handleWhatsApp = async (reg: Registration) => {
        // Optimistic Update
        const updatedRegs = registrations.map(r => r.id === reg.id ? { ...r, whatsappSent: true } : r);
        setRegistrations(updatedRegs);

        // Background Save
        updateRegistration(reg.id, { whatsappSent: true }).catch(err => console.error("Error saving WA status", err));

        const name = reg.parentName || reg.fullName || "Beneficiario";
        let message = `Hola ${name}, aquí tienes tus invitaciones para la entrega de juguetes:\n\n`;

        const baseUrl = window.location.origin;

        if (reg.children && reg.children.length > 0) {
            // Check if this is a legacy group to pass the flag
            const isLegacyGroup = reg.id.startsWith('legacy_group_');

            reg.children.forEach(child => {
                let qrLink = `${baseUrl}?view=qr&p=${reg.id}&c=${child.id}&i=${child.inviteNumber}&n=${encodeURIComponent(child.fullName || '')}&a=${child.age}&g=${child.gender}`;
                if (isLegacyGroup) {
                    qrLink += '&l=1';
                }

                // Construct message for each child
                message += `🎁 ${child.fullName} (${child.age} años): ${child.inviteNumber}\n🔗 Ver QR Digital: ${qrLink}\n\n`;
            });
        } else {
            // Legacy
            const qrLink = `${baseUrl}?view=qr&p=${reg.id}&c=legacy&i=${reg.inviteNumber}&n=${encodeURIComponent(reg.fullName || '')}&a=${0}&g=${reg.genderSelection}`;
            message += `🎫 Invitación: ${reg.inviteNumber}\n🔗 Ver QR Digital: ${qrLink}\n`;
        }

        message += `\n⚠️ *IMPORTANTE:*\nPresenta el *CÓDIGO QR* (entrando a los enlaces de arriba o en papel) para recibir los juguetes.`;

        // Clean phone number
        const phone = reg.whatsapp.replace(/[^0-9]/g, '');
        const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
    };

    const handleExportPDF = async (target?: Registration[] | TicketDistributor, groupName?: string) => {
        // Handle explicit click event or undefined
        if (target && ('bubbles' in target || 'target' in target)) {
            target = undefined;
        }

        setIsLoading(true);
        try {
            const doc = new jsPDF();

            // Check if we are printing a Distributor Control List
            // If target exists and is NOT an array, it must be a TicketDistributor object
            // (The event check above clears target if it's a React event)
            const isDistributorReport = target && !Array.isArray(target);

            if (isDistributorReport) {
                const dist = target as TicketDistributor;
                const start = dist.startRange || 0;
                const end = dist.endRange || 0;
                const rangeCount = end - start + 1;

                // --- HEADER ---
                doc.setFontSize(16);
                doc.setFont("helvetica", "bold");
                doc.text(`Control de Distribución - ${dist.name}`, 15, 20);

                doc.setFontSize(10);
                doc.setFont("helvetica", "normal");
                doc.text(`Rango: ${start} - ${end} | Total: ${rangeCount} Tickets`, 15, 28);
                doc.text(`Generado: ${new Date().toLocaleString()}`, 15, 33);

                // --- TABLE HEADER ---
                let y = 45;
                const headers = ["Ticket", "Estado", "Beneficiario", "Edad/Sex", "Responsable", "Teléfono"];
                const colWidths = [20, 25, 50, 20, 45, 25];
                let x = 15;

                doc.setFillColor(240, 240, 240);
                doc.rect(15, 38, 185, 8, "F");
                doc.setFont("helvetica", "bold");
                doc.setFontSize(9);
                headers.forEach((h, i) => {
                    doc.text(h, x, 43);
                    x += colWidths[i];
                });


                // --- DATA PREP ---
                // Map all registrations by Invite Number for fast lookup
                const regMap = new Map<number, { child: any, reg: Registration }>();
                const phoneCounts = new Map<string, number>();

                normalizedRegistrations.forEach(r => {
                    // Count phones
                    if (r.whatsapp) {
                        const cleanPhone = r.whatsapp.replace(/\D/g, '');
                        phoneCounts.set(cleanPhone, (phoneCounts.get(cleanPhone) || 0) + 1);
                    }

                    r.children.forEach(c => {
                        if (c.inviteNumber) {
                            // Normalize invite number (NIxxxx -> number)
                            const match = c.inviteNumber.match(/\d+/);
                            if (match) {
                                const num = parseInt(match[0], 10);
                                regMap.set(num, { child: c, reg: r });
                            }
                        }
                    });
                });

                // --- ROWS ---
                doc.setFont("helvetica", "normal");

                let missingCount = 0;
                let registeredCount = 0;

                for (let i = start; i <= end; i++) {
                    if (y > 275) {
                        doc.addPage();
                        y = 20;
                        // Reprint Header
                        doc.setFont("helvetica", "bold");
                        let hx = 15;
                        headers.forEach((h, idx) => {
                            doc.text(h, hx, y);
                            hx += colWidths[idx];
                        });
                        y += 10;
                        doc.setFont("helvetica", "normal");
                    }

                    const match = regMap.get(i);
                    const ticketStr = `NI${i.toString().padStart(4, '0')}`;

                    let xPos = 15;
                    doc.setFontSize(8);

                    // 1. Ticket Number
                    doc.setTextColor(0);
                    doc.text(ticketStr, xPos, y);
                    xPos += colWidths[0];

                    if (match) {
                        registeredCount++;
                        const { child, reg } = match;
                        const phone = (reg.whatsapp || '').replace(/\D/g, '');
                        const isMultiReg = (phoneCounts.get(phone) || 0) > 3;

                        // 2. Status
                        doc.setTextColor(0, 128, 0); // Green
                        doc.text("REGISTRADO", xPos, y);
                        xPos += colWidths[1];

                        // 3. Name
                        doc.setTextColor(0);
                        const name = (child.fullName || "Sin Nombre").substring(0, 30);
                        doc.text(name, xPos, y);
                        xPos += colWidths[2];

                        // 4. Age/Sex
                        const age = child.age !== undefined ? child.age : (child.childAge || '?');
                        const sex = child.gender ? child.gender.charAt(0) : (child.genderSelection ? child.genderSelection.charAt(0) : '?');
                        doc.text(`${age} / ${sex}`, xPos, y);
                        xPos += colWidths[3];

                        // 5. Responsible
                        const resp = (reg.parentName || reg.fullName || "").substring(0, 25);
                        doc.text(resp, xPos, y);
                        xPos += colWidths[4];

                        // 6. Phone
                        if (isMultiReg) {
                            doc.setTextColor(220, 38, 38); // Red
                            doc.setFont("helvetica", "bold");
                        } else {
                            doc.setTextColor(0);
                            doc.setFont("helvetica", "normal");
                        }
                        doc.text(reg.whatsapp || "", xPos, y);

                    } else {
                        missingCount++;
                        // MISSING
                        doc.setTextColor(220, 38, 38); // Red
                        doc.setFont("helvetica", "bold");
                        doc.text("PENDIENTE / FALTA", xPos, y);

                        // Reset
                        doc.setTextColor(0);
                        doc.setFont("helvetica", "normal");
                    }

                    // Line
                    doc.setDrawColor(240);
                    doc.line(15, y + 2, 200, y + 2);

                    y += 6;
                }

                // Summary Footer
                doc.setFontSize(10);
                doc.setTextColor(0);
                doc.text(`Resumen: Entregados: ${registeredCount} | Faltantes: ${missingCount}`, 15, y + 10);

                doc.save(`Control_Distribucion_${dist.name.replace(/\s+/g, '_')}.pdf`);

            } else {
                // --- EXISTING CARD LOGIC (Legacy/Bulk) ---
                let regsToPrint: Registration[] = [];

                if (Array.isArray(target)) {
                    regsToPrint = target;
                } else {
                    regsToPrint = filteredRegistrations;
                }

                if (regsToPrint.length === 0) {
                    alert("⚠️ No hay datos seleccionados o la tabla está vacía. Verifica que haya registros cargados.");
                    return;
                }

                // 1. Flatten all tickets (children) from the registrations
                interface PrintableTicket {
                    id: string;
                    inviteNumber: string;
                    gender: string;
                    age: number;
                    parentName: string;
                    originalReg: Registration;
                }

                const allTickets: PrintableTicket[] = [];

                regsToPrint.forEach(reg => {
                    const children = (reg.children && reg.children.length > 0)
                        ? reg.children
                        : [{
                            id: 'legacy',
                            inviteNumber: reg.inviteNumber || '???',
                            gender: reg.genderSelection || '?',
                            age: reg.childAge || 0,
                            fullName: 'Niño'
                        } as any];

                    children.forEach(child => {
                        allTickets.push({
                            id: child.id,
                            inviteNumber: child.inviteNumber || '',
                            gender: child.gender || 'Niño/a',
                            age: child.age !== undefined ? child.age : 0,
                            parentName: reg.parentName || reg.fullName || "Sin Nombre",
                            originalReg: reg
                        });
                    });
                });

                // 2. Sort by Invitation Number (Numeric)
                allTickets.sort((a, b) => {
                    const getNum = (str: string) => {
                        const match = str.match(/\d+/);
                        return match ? parseInt(match[0], 10) : 999999;
                    };
                    return getNum(a.inviteNumber) - getNum(b.inviteNumber);
                });

                // 3. Print Cards
                let col = 0, row = 0;
                const cardWidth = 90;
                const cardHeight = 130;
                const startX = 15;
                const startY = 15;
                let processed = 0;

                for (const ticket of allTickets) {
                    // Position
                    const posX = startX + (col * (cardWidth + 10));
                    const posY = startY + (row * (cardHeight + 10));

                    // Border
                    doc.setDrawColor(200);
                    doc.rect(posX, posY, cardWidth, cardHeight);

                    // Header
                    doc.setTextColor(30, 41, 59); // Slate 800
                    doc.setFontSize(10);
                    doc.setFont("helvetica", "bold");
                    doc.text("Entrega de Juguetes", posX + cardWidth / 2, posY + 15, { align: 'center' });
                    doc.setFontSize(8);
                    doc.setFont("helvetica", "bold");
                    doc.text("Gracias a Lorena Romero y Fundación Armando Bukele", posX + cardWidth / 2, posY + 22, { align: 'center' });

                    // Divider
                    doc.setDrawColor(230);
                    doc.line(posX + 10, posY + 28, posX + cardWidth - 10, posY + 28);

                    // Content
                    doc.setTextColor(0, 0, 0);

                    // Gender
                    doc.setFontSize(14);
                    doc.setFont("helvetica", "bold");
                    doc.text(ticket.gender, posX + cardWidth / 2, posY + 45, { align: 'center' });

                    // Age
                    doc.setFontSize(12);
                    doc.setFont("helvetica", "normal");
                    doc.text(`${ticket.age} Años`, posX + cardWidth / 2, posY + 52, { align: 'center' });

                    // Ticket Number
                    doc.setFontSize(10);
                    doc.setTextColor(100);
                    doc.text("Número de Ticket:", posX + cardWidth / 2, posY + 70, { align: 'center' });

                    doc.setFontSize(22);
                    doc.setTextColor(37, 99, 235); // Blue high vis
                    doc.setFont("courier", "bold"); // Monospace for numbers
                    doc.text(ticket.inviteNumber, posX + cardWidth / 2, posY + 82, { align: 'center' });

                    // Responsible
                    doc.setFont("helvetica", "normal");
                    doc.setTextColor(80);
                    doc.setFontSize(8);
                    doc.text("Responsable:", posX + cardWidth / 2, posY + 100, { align: 'center' });

                    doc.setFontSize(9);
                    doc.setTextColor(0);
                    doc.text(ticket.parentName, posX + cardWidth / 2, posY + 106, { align: 'center', maxWidth: cardWidth - 10 });

                    // Footer / Management Hint
                    doc.setFontSize(7);
                    doc.setTextColor(150);
                    doc.text("Control de Distribución", posX + cardWidth / 2, posY + 122, { align: 'center' });

                    // Grid Logic
                    col++;
                    if (col >= 2) { // 2 columns
                        col = 0;
                        row++;
                    }

                    if (row >= 2) { // 2 rows (4 per page)
                        doc.addPage();
                        col = 0;
                        row = 0;
                    }
                    processed++;
                }

                const finalFileName = typeof groupName === 'string'
                    ? `Control_Tickets_${groupName.replace(/\s+/g, '_')}.pdf`
                    : "Control_Tickets_Global.pdf";

                doc.save(finalFileName);
                alert(`✅ PDF de Tickets generado con éxito!\n\nSe procesaron ${processed} tickets.`);
            }
        } catch (e) {
            console.error(e);
            alert("Error al generar PDF. Revisa la consola.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (confirm(`¿Estás seguro de que quieres eliminar el registro de "${name}"? Esta acción no se puede deshacer.`)) {
            const result = await deleteRegistration(id);
            if (result.success) {
                // Refresh list using scoped load
                loadData();

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

    const handleUpdateRegistration = async (id: string, data: Partial<Registration>) => {
        const result = await updateRegistration(id, data);
        if (result.success) {
            loadData();
            alert("Registro actualizado correctamente.");
        } else {
            alert(result.message || "Error al actualizar");
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
                            <span className="hidden sm:inline">Panel: {currentUser?.role === 'verifier' ? 'Verificador' : 'Administrativo'}</span>
                            <span className="inline sm:hidden">{currentUser?.role === 'verifier' ? 'Verificador' : 'Admin'}</span>
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
                        <div className="w-72 bg-slate-100 border-r border-slate-200 overflow-y-auto hidden md:block flex-shrink-0">
                            <div className="p-4 space-y-2">
                                {currentUser?.role === 'admin' ? (
                                    <>
                                        <div className="mb-2">
                                            <p className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 mt-2">Tablero</p>
                                            <TabButton active={activeTab === 'stats'} onClick={() => setActiveTab('stats')} icon={<BarChart3 size={18} />} label="Estadísticas" />
                                        </div>

                                        <div className="mb-2">
                                            <p className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 mt-4">Operaciones</p>
                                            <TabButton active={activeTab === 'scanner'} onClick={() => setActiveTab('scanner')} icon={<ScanLine size={18} />} label="Escanear" />
                                            <TabButton active={activeTab === 'wa_list'} onClick={() => setActiveTab('wa_list')} icon={<Send size={18} />} label="Envíos WhatsApp" />
                                        </div>

                                        <div className="mb-2">
                                            <p className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 mt-4">Datos</p>
                                            <TabButton active={activeTab === 'data'} onClick={() => setActiveTab('data')} icon={<Database size={18} />} label="Base de Datos" />
                                        </div>

                                        <div className="mb-2">
                                            <p className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 mt-4">Sistema</p>
                                            <TabButton active={activeTab === 'users'} onClick={() => setActiveTab('users')} icon={<User size={18} />} label="Usuarios" />
                                            <TabButton active={activeTab === 'general'} onClick={() => setActiveTab('general')} icon={<Settings size={18} />} label="Configuración" />
                                            <TabButton active={activeTab === 'hero'} onClick={() => setActiveTab('hero')} icon={<ImageIcon size={18} />} label="Estilo" />
                                            <TabButton active={activeTab === 'content'} onClick={() => setActiveTab('content')} icon={<Type size={18} />} label="Contenido" />
                                            <TabButton active={activeTab === 'whatsapp'} onClick={() => setActiveTab('whatsapp')} icon={<MessageSquare size={18} />} label="Config WhatsApp" />
                                            <TabButton active={activeTab === 'system'} onClick={() => setActiveTab('system')} icon={<FolderLock size={18} />} label="Respaldos" />
                                        </div>
                                    </>
                                ) : currentUser?.role === 'verifier' ? (
                                    // Verifier ONLY
                                    <TabButton active={activeTab === 'scanner'} onClick={() => setActiveTab('scanner')} icon={<ScanLine size={18} />} label="Escanear QR" />
                                ) : (
                                    // WhatsApp Sender ONLY
                                    <TabButton active={activeTab === 'wa_list'} onClick={() => setActiveTab('wa_list')} icon={<MessageSquare size={18} />} label="Envíos WhatsApp" />
                                )}
                            </div>
                            <button
                                onClick={() => setActiveTab('audit')}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'audit' ? 'bg-blue-600 text-white shadow-blue-200 shadow-md' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}
                            >
                                <ClipboardCheck size={20} />
                                <span className="font-medium">Auditoría</span>
                            </button>

                            <div className="pt-4 mt-4 border-t border-slate-100 space-y-2">
                                <div className="px-4 py-2 text-xs text-slate-500 font-mono">
                                    {currentUser?.username}
                                </div>
                                <button
                                    onClick={() => { setIsAuthenticated(false); setCurrentUser(null); }}
                                    className="flex items-center gap-2 text-xs text-slate-600 hover:text-slate-800 w-full px-4 py-2 hover:bg-slate-200 rounded"
                                >
                                    <Lock size={14} /> Cerrar Sesión
                                </button>
                                {currentUser?.role === 'admin' && (
                                    <button
                                        onClick={() => { if (confirm("¿Restaurar toda la configuración de fábrica?")) resetConfig(); }}
                                        className="flex items-center gap-2 text-xs text-red-600 hover:text-red-800 w-full px-4 py-2 hover:bg-red-50 rounded"
                                    >
                                        <RotateCcw size={14} /> Restaurar Defaults
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Mobile Tabs (Horizontal) */}
                        {/* Mobile Tabs (Horizontal) - OPTIMIZED */}
                        <div className="md:hidden w-full border-b border-slate-200 bg-white flex-shrink-0 grid grid-cols-4">
                            <TabButtonMobile
                                active={!mobileMenuOpen && activeTab === 'stats'}
                                onClick={() => { setActiveTab('stats'); setMobileMenuOpen(false); }}
                                icon={<BarChart3 size={20} />}
                                label="Tablero"
                            />
                            <TabButtonMobile
                                active={!mobileMenuOpen && activeTab === 'scanner'}
                                onClick={() => { setActiveTab('scanner'); setMobileMenuOpen(false); }}
                                icon={<ScanLine size={20} />}
                                label="Escanear"
                            />
                            <TabButtonMobile
                                active={!mobileMenuOpen && (activeTab === 'data' || activeTab === 'wa_list')}
                                onClick={() => { setActiveTab('data'); setMobileMenuOpen(false); }}
                                icon={<Database size={20} />}
                                label="Registros"
                            />
                            <TabButtonMobile
                                active={mobileMenuOpen}
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                icon={<Menu size={20} />}
                                label="Menú"
                            />
                        </div>

                        {/* Content Area */}
                        <div className="flex-grow p-6 overflow-y-auto bg-slate-50">

                            {mobileMenuOpen && (
                                <div className="absolute inset-0 z-50 bg-slate-50 p-6 overflow-y-auto animate-fade-in pb-24">
                                    <div className="max-w-md mx-auto space-y-6">
                                        <div className="text-center mb-6">
                                            <h3 className="text-xl font-bold text-slate-800">Menú Principal</h3>
                                            <p className="text-sm text-slate-500">Opciones adicionales de administración</p>
                                        </div>

                                        {/* Operaciones */}
                                        <div>
                                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Operaciones</h4>
                                            <div className="grid grid-cols-2 gap-3">
                                                <button onClick={() => { setActiveTab('wa_list'); setMobileMenuOpen(false); }} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center gap-2 active:scale-95 transition-transform">
                                                    <div className="p-3 bg-green-50 rounded-full text-green-600">
                                                        <Send size={24} />
                                                    </div>
                                                    <span className="font-bold text-slate-700 text-sm">Envíos WA</span>
                                                </button>
                                                <button onClick={() => { setActiveTab('audit'); setMobileMenuOpen(false); }} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center gap-2 active:scale-95 transition-transform">
                                                    <div className="p-3 bg-blue-50 rounded-full text-blue-600">
                                                        <ClipboardCheck size={24} />
                                                    </div>
                                                    <span className="font-bold text-slate-700 text-sm">Auditoría</span>
                                                </button>
                                            </div>
                                        </div>

                                        {/* Sistema */}
                                        <div>
                                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Sistema</h4>
                                            <div className="grid grid-cols-2 gap-3">
                                                <button onClick={() => { setActiveTab('users'); setMobileMenuOpen(false); }} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center gap-2 active:scale-95 transition-transform">
                                                    <div className="p-3 bg-purple-50 rounded-full text-purple-600">
                                                        <User size={24} />
                                                    </div>
                                                    <span className="font-bold text-slate-700 text-sm">Usuarios</span>
                                                </button>
                                                <button onClick={() => { setActiveTab('system'); setMobileMenuOpen(false); }} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center gap-2 active:scale-95 transition-transform">
                                                    <div className="p-3 bg-orange-50 rounded-full text-orange-600">
                                                        <FolderLock size={24} />
                                                    </div>
                                                    <span className="font-bold text-slate-700 text-sm">Respaldos</span>
                                                </button>
                                            </div>
                                        </div>

                                        {/* Configuración */}
                                        <div>
                                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Configuración</h4>
                                            <div className="grid grid-cols-2 gap-3">
                                                <button onClick={() => { setActiveTab('general'); setMobileMenuOpen(false); }} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center gap-2 active:scale-95 transition-transform">
                                                    <div className="p-3 bg-slate-50 rounded-full text-slate-600">
                                                        <Settings size={24} />
                                                    </div>
                                                    <span className="font-bold text-slate-700 text-sm">General</span>
                                                </button>
                                                <button onClick={() => { setActiveTab('hero'); setMobileMenuOpen(false); }} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center gap-2 active:scale-95 transition-transform">
                                                    <div className="p-3 bg-pink-50 rounded-full text-pink-600">
                                                        <ImageIcon size={24} />
                                                    </div>
                                                    <span className="font-bold text-slate-700 text-sm">Estilo</span>
                                                </button>
                                                <button onClick={() => { setActiveTab('content'); setMobileMenuOpen(false); }} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center gap-2 active:scale-95 transition-transform">
                                                    <div className="p-3 bg-indigo-50 rounded-full text-indigo-600">
                                                        <Type size={24} />
                                                    </div>
                                                    <span className="font-bold text-slate-700 text-sm">Contenido</span>
                                                </button>
                                                <button onClick={() => { setActiveTab('whatsapp'); setMobileMenuOpen(false); }} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center gap-2 active:scale-95 transition-transform">
                                                    <div className="p-3 bg-green-50 rounded-full text-green-600">
                                                        <MessageSquare size={24} />
                                                    </div>
                                                    <span className="font-bold text-slate-700 text-sm">Config WA</span>
                                                </button>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => { setIsAuthenticated(false); setCurrentUser(null); }}
                                            className="w-full bg-red-50 text-red-600 font-bold py-4 rounded-xl border border-red-100 flex items-center justify-center gap-2 active:scale-95 transition-transform"
                                        >
                                            <Lock size={18} />
                                            Cerrar Sesión
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Main Content Render (Hide when menu is open on mobile to prevent scrolling double issues) */}
                            <div className={`space-y-6 animate-fade-in pb-10 ${mobileMenuOpen ? 'hidden md:block' : ''}`}>
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
                                                        Actualmente: <span className="font-semibold">{registrationCount}</span> familias
                                                        <span className="font-bold text-blue-600 ml-1">
                                                            ({normalizedRegistrations.reduce((acc, r) => acc + (r.children?.length || r.childCount || 1), 0)} Juguetes)
                                                        </span>
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

                                            <div className="md:col-span-2">
                                                <div className="flex items-center justify-between mb-2">
                                                    <label className="block text-sm font-medium text-slate-700">
                                                        Gestión de Distribuidores (CRM)
                                                    </label>
                                                    <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
                                                        {localConfig.ticketDistributors?.length || 0} Registrados
                                                    </span>
                                                </div>

                                                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                                                    {/* Add New */}
                                                    <div className="flex flex-col gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
                                                        <div className="flex gap-2">
                                                            <input
                                                                type="text"
                                                                value={newDistributorName}
                                                                onChange={(e) => setNewDistributorName(e.target.value)}
                                                                placeholder="Nuevo Distribuidor..."
                                                                className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                                            />
                                                            <input
                                                                type="tel"
                                                                value={newDistributorPhone}
                                                                onChange={(e) => setNewDistributorPhone(e.target.value)}
                                                                placeholder="WhatsApp"
                                                                className="w-32 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                                            />
                                                        </div>
                                                        <div className="flex gap-2 items-center">
                                                            <input
                                                                type="number"
                                                                placeholder="Inicio"
                                                                className="w-24 px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none"
                                                                value={newDistributorStart || ''}
                                                                onChange={(e) => setNewDistributorStart(parseInt(e.target.value) || 0)}
                                                            />
                                                            <span className="text-slate-400">-</span>
                                                            <input
                                                                type="number"
                                                                placeholder="Fin"
                                                                className="w-24 px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none"
                                                                value={newDistributorEnd || ''}
                                                                onChange={(e) => setNewDistributorEnd(parseInt(e.target.value) || 0)}
                                                            />
                                                            <div className="flex-grow"></div>
                                                            <button
                                                                onClick={async () => {
                                                                    if (!confirm("Esto analizará todos los registros e importará automáticamente los distribuidores y sus rangos detectados. ¿Continuar?")) return;

                                                                    setIsLoading(true);
                                                                    try {
                                                                        const inferredDistributors: Record<string, { start: number, end: number }> = {};

                                                                        // 1. Analyze all registrations
                                                                        normalizedRegistrations.forEach(r => {
                                                                            if (r.ticketDistributor && r.ticketDistributor.trim()) {
                                                                                const name = r.ticketDistributor.trim();
                                                                                if (!inferredDistributors[name]) inferredDistributors[name] = { start: 999999, end: 0 };

                                                                                r.children.forEach(c => {
                                                                                    const num = parseInt(c.inviteNumber.replace(/\D/g, ''));
                                                                                    if (!isNaN(num) && num > 0) {
                                                                                        inferredDistributors[name].start = Math.min(inferredDistributors[name].start, num);
                                                                                        inferredDistributors[name].end = Math.max(inferredDistributors[name].end, num);
                                                                                    }
                                                                                });
                                                                            }
                                                                        });

                                                                        // 2. Save only NEW ones (don't overwrite existing configs to prevent data loss)
                                                                        let importedCount = 0;
                                                                        const existingNames = new Set((config.ticketDistributors || []).map(d => d.name));

                                                                        for (const [name, range] of Object.entries(inferredDistributors)) {
                                                                            if (range.end > 0 && !existingNames.has(name)) {
                                                                                await saveDistributor({
                                                                                    name: name,
                                                                                    startRange: range.start,
                                                                                    endRange: range.end,
                                                                                    phone: ''
                                                                                });
                                                                                importedCount++;
                                                                            }
                                                                        }

                                                                        if (importedCount > 0) {
                                                                            await refreshConfig();
                                                                            alert(`Se importaron ${importedCount} distribuidores nuevos basados en los registros.`);
                                                                        } else {
                                                                            alert("No se encontraron nuevos distribuidores para importar (o ya existen).");
                                                                        }

                                                                    } catch (e) {
                                                                        console.error(e);
                                                                        alert("Error al importar.");
                                                                    }
                                                                    setIsLoading(false);
                                                                }}
                                                                className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors flex items-center gap-2"
                                                                title="Detectar rangos automáticamente desde los registros"
                                                            >
                                                                <Database className="w-4 h-4" /> Importar
                                                            </button>
                                                            <button
                                                                onClick={async () => {

                                                                    if (newDistributorName.trim()) {
                                                                        setIsLoading(true);
                                                                        const res = await saveDistributor({
                                                                            name: newDistributorName.trim(),
                                                                            phone: newDistributorPhone.trim(),
                                                                            startRange: newDistributorStart,
                                                                            endRange: newDistributorEnd
                                                                        });

                                                                        if (res.success) {
                                                                            await refreshConfig();
                                                                            setNewDistributorName('');
                                                                            setNewDistributorPhone('');
                                                                            setNewDistributorStart(0);
                                                                            setNewDistributorEnd(0);
                                                                        } else {
                                                                            alert("Error: " + res.message);
                                                                        }
                                                                        setIsLoading(false);
                                                                    }
                                                                }}
                                                                disabled={!newDistributorName.trim()}
                                                                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                            >
                                                                Agregar
                                                            </button>
                                                        </div>
                                                    </div>

                                                    <div className="flex justify-end mb-4">
                                                        <button
                                                            onClick={async () => {
                                                                if (confirm("Esto eliminará distribuidores duplicados (mismo nombre), manteniendo el que tiene mejor definición de rango. ¿Continuar?")) {
                                                                    setIsLoading(true);
                                                                    const res = await cleanupDuplicateDistributors();
                                                                    await refreshConfig();
                                                                    setIsLoading(false);
                                                                    alert(res.message);
                                                                }
                                                            }}
                                                            className="text-orange-600 hover:bg-orange-50 px-3 py-1.5 rounded-lg text-xs font-medium border border-orange-200 flex items-center gap-2"
                                                        >
                                                            <ShieldCheck className="w-3 h-3" /> Reparar Duplicados
                                                        </button>
                                                    </div>

                                                    {/* List */}
                                                    <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
                                                        {(localConfig.ticketDistributors || []).length === 0 ? (
                                                            <div className="p-8 text-center text-slate-400 text-sm">
                                                                No hay distribuidores registrados.
                                                            </div>
                                                        ) : (
                                                            <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                                                                {(localConfig.ticketDistributors || []).map((rawDist, idx) => {
                                                                    // Normalize data: Handle legacy strings and new objects
                                                                    const dist = typeof rawDist === 'string'
                                                                        ? { name: rawDist, phone: '', startRange: 0, endRange: 0 }
                                                                        : (rawDist || { name: '', phone: '', startRange: 0, endRange: 0 });
                                                                    const isEditing = editingDistributorIndex === idx;
                                                                    return (
                                                                        <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200 group hover:border-blue-300 transition-colors">
                                                                            {isEditing ? (
                                                                                <div className="flex-1 flex flex-col gap-2">
                                                                                    <div className="flex gap-2">
                                                                                        <input
                                                                                            type="text"
                                                                                            value={tempDistributorName}
                                                                                            onChange={(e) => setTempDistributorName(e.target.value)}
                                                                                            className="flex-1 px-2 py-1 border border-slate-300 rounded text-sm"
                                                                                            placeholder="Nombre"
                                                                                        />
                                                                                        <input
                                                                                            type="text"
                                                                                            value={tempDistributorPhone}
                                                                                            onChange={(e) => setTempDistributorPhone(e.target.value)}
                                                                                            className="w-24 px-2 py-1 border border-slate-300 rounded text-sm"
                                                                                            placeholder="Teléfono"
                                                                                        />
                                                                                    </div>
                                                                                    <div className="flex items-center gap-2">
                                                                                        <input
                                                                                            type="number"
                                                                                            placeholder="Inicio e.g. 1"
                                                                                            className="w-20 px-2 py-1 text-xs border border-slate-300 rounded"
                                                                                            value={tempDistributorStart}
                                                                                            onChange={(e) => setTempDistributorStart(parseInt(e.target.value) || 0)}
                                                                                        />
                                                                                        <span className="text-slate-400">-</span>
                                                                                        <input
                                                                                            type="number"
                                                                                            placeholder="Fin e.g. 100"
                                                                                            className="w-20 px-2 py-1 text-xs border border-slate-300 rounded"
                                                                                            value={tempDistributorEnd}
                                                                                            onChange={(e) => setTempDistributorEnd(parseInt(e.target.value) || 0)}
                                                                                        />
                                                                                        <div className="flex-grow"></div>
                                                                                        <div className="flex gap-1">
                                                                                            <button
                                                                                                onClick={async () => {
                                                                                                    setIsLoading(true);
                                                                                                    await saveDistributor({
                                                                                                        id: dist.id,
                                                                                                        name: tempDistributorName.trim(),
                                                                                                        phone: tempDistributorPhone.trim(),
                                                                                                        startRange: tempDistributorStart,
                                                                                                        endRange: tempDistributorEnd
                                                                                                    });
                                                                                                    setEditingDistributorIndex(null);
                                                                                                    window.location.reload();
                                                                                                }}
                                                                                                className="text-green-600 hover:bg-green-50 p-1 rounded"
                                                                                                title="Guardar"
                                                                                            >
                                                                                                <Check size={16} />
                                                                                            </button>
                                                                                            <button
                                                                                                onClick={() => setEditingDistributorIndex(null)}
                                                                                                className="text-red-500 hover:bg-red-50 p-1 rounded"
                                                                                                title="Cancelar"
                                                                                            >
                                                                                                <X size={16} />
                                                                                            </button>
                                                                                        </div>
                                                                                    </div>
                                                                                </div>


                                                                            ) : (
                                                                                <>
                                                                                    <div className="flex items-center gap-3">
                                                                                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs relative">
                                                                                            {(dist.name || '').charAt(0).toUpperCase()}
                                                                                            {dist.startRange && dist.endRange ? (
                                                                                                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                                                                                            ) : null}
                                                                                        </div>
                                                                                        <div className="flex flex-col">
                                                                                            <span className="text-sm text-slate-700 font-medium">{dist.name}</span>
                                                                                            <div className="flex items-center gap-2 text-xs text-slate-400">
                                                                                                {dist.phone && <span>{dist.phone}</span>}
                                                                                                {dist.startRange && dist.endRange && (
                                                                                                    <span className="bg-green-50 text-green-700 px-1.5 rounded border border-green-100">
                                                                                                        Range: {dist.startRange} - {dist.endRange}
                                                                                                    </span>
                                                                                                )}
                                                                                            </div>
                                                                                        </div>
                                                                                    </div>
                                                                                    <div className="flex items-center gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                                                                        <button
                                                                                            onClick={() => handleExportPDF(dist)}
                                                                                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                                                                            title="Descargar Lista de Control"
                                                                                        >
                                                                                            <Download size={14} />
                                                                                        </button>
                                                                                        <button
                                                                                            onClick={() => {
                                                                                                setEditingDistributorIndex(idx);
                                                                                                setTempDistributorName(dist.name);
                                                                                                setTempDistributorPhone(dist.phone || '');
                                                                                                setTempDistributorStart(dist.startRange || 0);
                                                                                                setTempDistributorEnd(dist.endRange || 0);
                                                                                            }}
                                                                                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                                                                            title="Editar"
                                                                                        >
                                                                                            <Edit2 size={14} />
                                                                                        </button>
                                                                                        <button
                                                                                            onClick={async () => {
                                                                                                if (confirm(`¿Eliminar a "${dist.name}" de la lista?`)) {
                                                                                                    if (dist.id) {
                                                                                                        await deleteDistributor(dist.id);
                                                                                                        window.location.reload();
                                                                                                    } else {
                                                                                                        const updated = (localConfig.ticketDistributors || []).filter((_, i) => i !== idx);
                                                                                                        handleInputChange('ticketDistributors', updated);
                                                                                                    }
                                                                                                }
                                                                                            }}
                                                                                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                                                                            title="Eliminar"
                                                                                        >
                                                                                            <Trash2 size={14} />
                                                                                        </button>
                                                                                    </div>
                                                                                </>
                                                                            )}
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                                                    <Info size={12} />
                                                    Gestiona aquí quiénes pueden entregar tickets. Esto no afecta los registros ya existentes.
                                                </p>
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
                                                            <h4 className="text-sm font-medium text-slate-500 uppercase tracking-wider">Meta de Juguetes / Tickets</h4>
                                                            <div className="text-3xl font-bold text-slate-800 mt-1">
                                                                {normalizedRegistrations.reduce((acc, r) => acc + (r.children?.length || r.childCount || 1), 0)}
                                                                <span className="text-lg text-slate-400 font-normal"> / {config.maxRegistrations}</span>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${Math.round((normalizedRegistrations.reduce((acc, r) => acc + (r.children?.length || r.childCount || 1), 0) / config.maxRegistrations) * 100) >= 100
                                                                ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                                                                }`}>
                                                                {Math.round((normalizedRegistrations.reduce((acc, r) => acc + (r.children?.length || r.childCount || 1), 0) / config.maxRegistrations) * 100)}%
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full transition-all duration-1000 ${Math.round((normalizedRegistrations.reduce((acc, r) => acc + (r.children?.length || r.childCount || 1), 0) / config.maxRegistrations) * 100) >= 100
                                                                ? 'bg-red-500' : 'bg-gradient-to-r from-blue-500 to-green-400'
                                                                }`}
                                                            style={{ width: `${Math.round((normalizedRegistrations.reduce((acc, r) => acc + (r.children?.length || r.childCount || 1), 0) / config.maxRegistrations) * 100)}%` }}
                                                        ></div>
                                                    </div>
                                                </div>

                                                {/* Red Flags Alert Section */}
                                                {stats?.redFlags && stats.redFlags.length > 0 && (
                                                    <div className="mb-6 animate-fade-in">
                                                        <details className="group bg-red-50 border border-red-200 rounded-lg shadow-sm open:shadow-md transition-all duration-300">
                                                            <summary className="list-none flex items-center justify-between p-4 cursor-pointer">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="bg-red-100 p-2 rounded-full">
                                                                        <AlertTriangle className="h-5 w-5 text-red-600" />
                                                                    </div>
                                                                    <div>
                                                                        <h3 className="text-base font-bold text-red-800">
                                                                            Alerta de Anomalías
                                                                        </h3>
                                                                        <p className="text-xs text-red-600 font-medium">
                                                                            {stats.redFlags.length} números con exceso de registros
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                                <ChevronDown className="w-5 h-5 text-red-400 transform group-open:rotate-180 transition-transform duration-300" />
                                                            </summary>

                                                            <div className="px-4 pb-4 border-t border-red-100 mt-2 pt-2">
                                                                <p className="text-sm text-red-700 mb-3 ml-1">
                                                                    Los siguientes números de teléfono tienen registrados <strong>más de 3 niños</strong>, lo cual es inusual:
                                                                </p>
                                                                <div className="overflow-x-auto bg-white rounded-lg border border-red-100 shadow-sm">
                                                                    <table className="min-w-full text-sm text-left">
                                                                        <thead className="bg-red-50/50">
                                                                            <tr>
                                                                                <th className="px-4 py-2 text-red-900 font-bold border-b border-red-100">Teléfono</th>
                                                                                <th className="px-4 py-2 text-red-900 font-bold text-right border-b border-red-100">Cantidad de Niños</th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody className="divide-y divide-red-50">
                                                                            {stats.redFlags.map((item, idx) => (
                                                                                <tr key={idx} className="hover:bg-red-50/30 transition-colors">
                                                                                    <td className="px-4 py-2 text-slate-700 font-mono">{item.phone}</td>
                                                                                    <td className="px-4 py-2 text-red-600 font-bold text-right">{item.count}</td>
                                                                                </tr>
                                                                            ))}
                                                                        </tbody>
                                                                    </table>
                                                                </div>
                                                            </div>
                                                        </details>
                                                    </div>
                                                )}

                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                                                    {/* Distributor Chart (Horizontal Bar for better Mobile/List view) */}
                                                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:col-span-2 lg:col-span-3">
                                                        <h4 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                                                            <User className="w-4 h-4 text-blue-600" /> Tickets por Responsable
                                                        </h4>
                                                        {/* Scrollable Container for massive lists */}
                                                        <div className="flex-grow overflow-x-hidden overflow-y-auto max-h-[600px] pr-2 custon-scrollbar">

                                                            {/* Dynamic Height based on item count (approx 50px per item + buffer) */}
                                                            <div style={{ height: Math.max(400, (stats?.distributorData || []).length * 50) }}>
                                                                <ResponsiveContainer width="100%" height="100%">
                                                                    <BarChart
                                                                        data={stats?.distributorData || []}
                                                                        layout="vertical"
                                                                        margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                                                                    >
                                                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} vertical={true} />
                                                                        <XAxis type="number" hide />
                                                                        <YAxis
                                                                            dataKey="name"
                                                                            type="category"
                                                                            width={100}
                                                                            tick={{ fontSize: 11, fill: '#64748b' }}
                                                                            interval={0}
                                                                        />
                                                                        <RechartsTooltip
                                                                            cursor={{ fill: '#f1f5f9' }}
                                                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                                                        />
                                                                        <Legend verticalAlign="top" height={36} />
                                                                        <Bar dataKey="registered" stackId="a" fill="#10b981" name="Entregados (Monitor)" radius={[0, 0, 0, 0]} barSize={24} />
                                                                        <Bar dataKey="missing" stackId="a" fill="#f43f5e" name="Faltantes" radius={[0, 4, 4, 0]} barSize={24} />
                                                                    </BarChart>
                                                                </ResponsiveContainer>
                                                            </div>
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
                                                            Total Niños/as: <span className="font-bold text-slate-800">{normalizedRegistrations.reduce((acc, r) => acc + r.children.length, 0)}</span>
                                                        </div>
                                                    </div>
                                                    {/* Delivery Progress (Pie) */}
                                                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm min-h-[300px] flex flex-col md:col-span-2 lg:col-span-1">
                                                        <h4 className="font-semibold text-slate-800 mb-4 flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-600" /> Progreso Entrega</h4>
                                                        <div className="flex-grow">
                                                            <ResponsiveContainer width="100%" height={250}>
                                                                <PieChart>
                                                                    <Pie
                                                                        data={stats?.deliveryProgressData || []}
                                                                        cx="50%"
                                                                        cy="50%"
                                                                        innerRadius={60}
                                                                        outerRadius={80}
                                                                        paddingAngle={5}
                                                                        dataKey="value"
                                                                    >
                                                                        {(stats?.deliveryProgressData || []).map((entry, index) => (
                                                                            <Cell key={`cell-${index}`} fill={entry.name === 'Entregados' ? '#16a34a' : '#94a3b8'} />
                                                                        ))}
                                                                    </Pie>
                                                                    <RechartsTooltip />
                                                                    <Legend verticalAlign="bottom" height={36} />
                                                                </PieChart>
                                                            </ResponsiveContainer>
                                                        </div>
                                                        <div className="text-center text-sm text-slate-500 mt-2">
                                                            {stats?.deliveryProgressData.find(d => d.name === 'Entregados')?.value || 0} Entregados / {registrations.reduce((acc, r) => acc + (r.children?.length || r.childCount || 0), 0)} Total
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

                                                    {/* Top Colonies (Bar - Vertical) */}
                                                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm min-h-[300px] flex flex-col md:col-span-2 lg:col-span-1">
                                                        <h4 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                                                            <MapPin className="w-4 h-4 text-purple-500" /> Top Lugares
                                                        </h4>
                                                        <div className="flex-grow">
                                                            <ResponsiveContainer width="100%" height={250}>
                                                                <BarChart data={(stats?.colonyData || []).slice(0, 8)} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                                                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                                                    <XAxis type="number" hide />
                                                                    <YAxis
                                                                        dataKey="displayName"
                                                                        type="category"
                                                                        width={90}
                                                                        tick={{ fontSize: 10 }}
                                                                        interval={0}
                                                                    />
                                                                    <RechartsTooltip
                                                                        contentStyle={{ fontSize: '12px' }}
                                                                        cursor={{ fill: 'transparent' }}
                                                                    />
                                                                    <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={20} />
                                                                </BarChart>
                                                            </ResponsiveContainer>
                                                        </div>
                                                    </div>

                                                    {/* Full Colonies List (Scrollable Chart) */}
                                                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm min-h-[400px] flex flex-col col-span-1 md:col-span-2 lg:col-span-4">
                                                        <h4 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                                                            <MapPin className="w-4 h-4 text-indigo-500" /> Distribución Completa de Lugares ({stats?.colonyData?.length || 0})
                                                        </h4>
                                                        <div className="flex-grow overflow-y-auto max-h-[500px] border border-slate-100 rounded-lg p-2">
                                                            {/* Force height based on number of items to make it scrollable properly */}
                                                            <div style={{ height: Math.max(400, (stats?.colonyData?.length || 0) * 30) }}>
                                                                <ResponsiveContainer width="100%" height="100%">
                                                                    <BarChart data={stats?.colonyData || []} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                                                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                                                        <XAxis type="number" orientation="top" />
                                                                        <YAxis
                                                                            dataKey="name" // Use full name here
                                                                            type="category"
                                                                            width={150}
                                                                            tick={{ fontSize: 10 }}
                                                                            interval={0}
                                                                        />
                                                                        <RechartsTooltip
                                                                            contentStyle={{ fontSize: '12px' }}
                                                                            cursor={{ fill: '#f1f5f9' }}
                                                                        />
                                                                        <Legend iconType="circle" />
                                                                        {/* Dynamic Stacked Bars for Distributors */}
                                                                        {/* We need a color for each distributor. We can cycle through a palette. */}
                                                                        {(config.ticketDistributors || []).concat([{ name: 'Desconocido', phone: '' }, { name: 'Otros / Sin Asignar', phone: '' }]).map((dist, idx) => {
                                                                            const colors = [
                                                                                '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#10b981',
                                                                                '#06b6d4', '#0ea5e9', '#6366f1', '#8b5cf6', '#d946ef',
                                                                                '#f43f5e', '#64748b'
                                                                            ];
                                                                            const color = colors[idx % colors.length];
                                                                            return (
                                                                                <Bar
                                                                                    key={dist.name}
                                                                                    dataKey={dist.name}
                                                                                    stackId="a"
                                                                                    fill={color}
                                                                                    radius={[0, 0, 0, 0]}
                                                                                    barSize={15}
                                                                                />
                                                                            );
                                                                        })}
                                                                    </BarChart>
                                                                </ResponsiveContainer>
                                                            </div>
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
                                                            <span className="text-xs text-slate-500">
                                                                Mostrando {filteredRegistrations.length} familias ({filteredRegistrations.reduce((acc, r) => acc + (r.children?.length || r.childCount || 0), 0)} tickets)
                                                            </span>
                                                        </div>

                                                        <div className="flex items-center gap-2 w-full sm:w-auto">
                                                            <input
                                                                type="text"
                                                                placeholder="Buscar por nombre, invitación..."
                                                                value={searchTerm}
                                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                                className="px-3 py-2 border border-slate-300 rounded-lg text-sm w-full sm:w-64"
                                                            />
                                                            <button onClick={handleExportPDF} disabled={isLoading} className="bg-slate-800 text-white hover:bg-slate-700 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm whitespace-nowrap disabled:opacity-50">
                                                                {isLoading ? <Loader2 className="animate-spin w-4 h-4" /> : <Download size={16} />}
                                                                <span className="hidden sm:inline">Exportar PDF</span>
                                                            </button>
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
                                                                {groupedRegistrations.map(({ distName, regs, relevantTickets }) => {
                                                                    const distributor = distName;
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
                                                                                                {relevantTickets} Juguetes  {/* USES PRE-CALCULATED RELEVANT SUM */}
                                                                                            </span>
                                                                                            <button
                                                                                                onClick={(e) => { e.stopPropagation(); handleExportPDF(regs, distributor); }}
                                                                                                className="bg-white/50 hover:bg-white border border-slate-300 text-slate-700 px-2 py-0.5 rounded text-[10px] flex items-center gap-1 shadow-sm transition-all"
                                                                                            >
                                                                                                <Download className="w-3 h-3" /> PDF Lote
                                                                                            </button>
                                                                                        </div>
                                                                                    </div>
                                                                                </td>
                                                                            </tr>
                                                                            {isExpanded && regs.map((reg) => (
                                                                                <React.Fragment key={reg.id}>
                                                                                    <tr className={`hover:bg-slate-50 animate-fade-in ${selectedIds.has(reg.id) ? 'bg-blue-50/50' : ''}`}>
                                                                                        <td className="px-6 py-4">
                                                                                            <input
                                                                                                type="checkbox"
                                                                                                checked={selectedIds.has(reg.id)}
                                                                                                onChange={() => handleSelectRow(reg.id)}
                                                                                                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                                                                            />
                                                                                        </td>
                                                                                        <td className="px-6 py-4 font-medium text-slate-900">
                                                                                            {reg.parentName || reg.fullName}
                                                                                            {/* Show children count badge if not expanded? No, we show children below */}
                                                                                        </td>
                                                                                        <td className="px-6 py-4 text-slate-600 md:whitespace-nowrap">{reg.whatsapp}</td>
                                                                                        <td className="px-6 py-4">
                                                                                            {/* Legacy or Summary of Invites */}
                                                                                            <div className="text-xs text-slate-500 font-mono">
                                                                                                {reg.children && reg.children.length > 0 ? (
                                                                                                    <span className="bg-slate-100 px-2 py-1 rounded">{reg.children.length} Tickets</span>
                                                                                                ) : (
                                                                                                    reg.inviteNumber
                                                                                                )}
                                                                                            </div>
                                                                                        </td>
                                                                                        <td className="px-6 py-4">
                                                                                            {reg.children && reg.children.length > 0 ? (
                                                                                                <div className="space-y-1">
                                                                                                    {reg.children.map((child, idx) => (
                                                                                                        <div key={idx} className={`flex items-center justify-between text-xs border p-1.5 rounded gap-2 ${child.status === 'delivered' ? 'bg-green-50 border-green-200' : 'bg-white border-slate-200'}`}>
                                                                                                            <div className="flex flex-col">
                                                                                                                <div className="flex items-center gap-1">
                                                                                                                    <span className="font-bold text-slate-700">{child.fullName || `Niño #${idx + 1}`}</span>
                                                                                                                    {child.status === 'delivered' && <span className="text-[10px] bg-green-100 text-green-700 px-1 rounded-full font-medium">Entregado</span>}
                                                                                                                </div>
                                                                                                                <span className="text-[10px] text-slate-500">{child.age} años - {child.gender} - {child.inviteNumber}</span>
                                                                                                            </div>
                                                                                                            <button
                                                                                                                onClick={() => setViewingQR({
                                                                                                                    name: child.fullName || `Niño #${idx + 1}`,
                                                                                                                    invite: child.inviteNumber,
                                                                                                                    data: JSON.stringify({ parentId: reg.id, childId: child.id, invite: child.inviteNumber, name: child.fullName })
                                                                                                                })}
                                                                                                                className="bg-slate-800 text-white p-1 rounded hover:bg-black transition-colors"
                                                                                                                title="Ver QR"
                                                                                                            >
                                                                                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-qr-code"><rect width="5" height="5" x="3" y="3" rx="1" /><rect width="5" height="5" x="16" y="3" rx="1" /><rect width="5" height="5" x="3" y="16" rx="1" /><path d="M21 16h-3a2 2 0 0 0-2 2v3" /><path d="M21 21v.01" /><path d="M12 7v3a2 2 0 0 1-2 2H7" /><path d="M3 12h.01" /><path d="M12 3h.01" /><path d="M12 16v.01" /><path d="M16 12h1" /><path d="M21 12v.01" /><path d="M12 21v-1" /></svg>
                                                                                                            </button>
                                                                                                        </div>
                                                                                                    ))}
                                                                                                </div>
                                                                                            ) : (
                                                                                                /* Legacy Display - Now Standardized */
                                                                                                <div className="space-y-1">
                                                                                                    {Array.from({ length: Math.max(1, reg.childCount || 1) }).map((_, i) => {
                                                                                                        // Virtual Child for Legacy Data
                                                                                                        const legacyName = reg.fullName || "Sin Nombre";
                                                                                                        const legacyInvite = reg.inviteNumber || "---";
                                                                                                        const legacyAge = reg.childAge || 0;
                                                                                                        const legacyGender = reg.genderSelection || "Niño/a";

                                                                                                        return (
                                                                                                            <div key={`legacy-${i}`} className="flex items-center justify-between text-xs bg-orange-50/50 border border-orange-200 p-1.5 rounded gap-2">
                                                                                                                <div className="flex flex-col">
                                                                                                                    <span className="font-bold text-slate-700">{legacyName} <span className="text-[9px] text-orange-600">(Legacy)</span></span>
                                                                                                                    <span className="text-[10px] text-slate-500">{legacyAge} años - {legacyGender} - {legacyInvite}</span>
                                                                                                                </div>
                                                                                                                <button
                                                                                                                    onClick={(e) => {
                                                                                                                        e.stopPropagation();
                                                                                                                        setViewingQR({
                                                                                                                            name: legacyName,
                                                                                                                            invite: legacyInvite,
                                                                                                                            data: JSON.stringify({
                                                                                                                                parentId: reg.id,
                                                                                                                                childId: 'legacy',
                                                                                                                                invite: legacyInvite,
                                                                                                                                name: legacyName,
                                                                                                                                isLegacy: true
                                                                                                                            })
                                                                                                                        });
                                                                                                                    }}
                                                                                                                    className="bg-slate-800 text-white p-1 rounded hover:bg-black transition-colors"
                                                                                                                    title="Ver QR (Generado)"
                                                                                                                >
                                                                                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-qr-code"><rect width="5" height="5" x="3" y="3" rx="1" /><rect width="5" height="5" x="16" y="3" rx="1" /><rect width="5" height="5" x="3" y="16" rx="1" /><path d="M21 16h-3a2 2 0 0 0-2 2v3" /><path d="M21 21v.01" /><path d="M12 7v3a2 2 0 0 1-2 2H7" /><path d="M3 12h.01" /><path d="M12 3h.01" /><path d="M12 16v.01" /><path d="M16 12h1" /><path d="M21 12v.01" /><path d="M12 21v-1" /></svg>
                                                                                                                </button>
                                                                                                            </div>
                                                                                                        );
                                                                                                    })}
                                                                                                </div>
                                                                                            )}
                                                                                        </td>
                                                                                        <td className="px-6 py-4 text-right flex justify-end gap-2">
                                                                                            <button
                                                                                                onClick={(e) => {
                                                                                                    e.stopPropagation();
                                                                                                    handleWhatsApp(reg);
                                                                                                }}
                                                                                                className="text-slate-400 hover:text-green-500 transition-colors p-2"
                                                                                                title="Enviar por WhatsApp"
                                                                                            >
                                                                                                <MessageSquare className="w-4 h-4" />
                                                                                            </button>
                                                                                            <button
                                                                                                onClick={(e) => {
                                                                                                    e.stopPropagation();
                                                                                                    setEditingReg(reg);
                                                                                                }}
                                                                                                className="text-slate-400 hover:text-blue-500 transition-colors p-2"
                                                                                                title="Editar Registro"
                                                                                            >
                                                                                                <Pencil className="w-4 h-4" />
                                                                                            </button>
                                                                                            <button
                                                                                                onClick={(e) => {
                                                                                                    e.stopPropagation();
                                                                                                    handleDelete(reg.id, reg.parentName || reg.fullName || 'Desconocido');
                                                                                                }}
                                                                                                className="text-slate-400 hover:text-red-500 transition-colors p-2"
                                                                                                title="Eliminar Registro"
                                                                                            >
                                                                                                <Trash2 className="w-4 h-4" />
                                                                                            </button>
                                                                                        </td>
                                                                                    </tr>
                                                                                </React.Fragment>
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
                                                                {groupedRegistrations.map(({ distName, regs, relevantTickets }) => {
                                                                    const distributor = distName;
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
                                                                                            {relevantTickets} Jug
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

                                                <div className="w-full max-w-md border-t border-slate-100 pt-6">
                                                    <h4 className="text-sm font-bold text-slate-700 mb-3 text-left">Mantenimiento</h4>
                                                    <button
                                                        onClick={async () => {
                                                            if (confirm("Esto buscará y liberará invitaciones marcadas como 'ocupadas' pero cuyo registro ya no existe. ¿Deseas continuar?")) {
                                                                setIsLoading(true);
                                                                const res = await cleanupOrphanedInvites();
                                                                setIsLoading(false);
                                                                alert(res.message);
                                                            }
                                                        }}
                                                        className="w-full bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 py-2 px-4 rounded-lg transition-colors font-medium text-sm flex items-center justify-center gap-2"
                                                    >
                                                        <ShieldCheck className="w-4 h-4" />
                                                        Liberar Invitaciones Huérfanas (Reparar DB)
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

                                {
                                    activeTab === 'scanner' && (
                                        <div className="space-y-6 animate-fade-in">
                                            <SectionHeader title="Escáner QR" description="Escanea los códigos de las invitaciones para marcar entregas." />
                                            <div className="bg-white p-4 md:p-8 rounded-xl border border-slate-200 shadow-sm min-h-[400px]">
                                                <ScanInterface />
                                            </div>
                                        </div>
                                    )
                                }



                                {activeTab === 'audit' && (
                                    <div className="space-y-6 animate-fade-in">
                                        <SectionHeader title="Auditoría de Tickets" description="Control de faltantes por rango y distribuidor." />

                                        <div className="mb-8 bg-slate-50 p-6 rounded-xl border border-slate-200">
                                            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                                                <Search className="w-5 h-5 text-slate-500" />
                                                Consultar Estado de Ticket
                                            </h3>
                                            <div className="flex gap-4 items-end">
                                                <InputGroup
                                                    label="Número de Ticket (ej. 618)"
                                                    value={searchTerm}
                                                    onChange={setSearchTerm}
                                                />
                                            </div>

                                            {searchTerm && (
                                                <div className="mt-4 p-4 bg-white rounded-lg border border-slate-200">
                                                    {(() => {
                                                        const cleanInput = searchTerm.replace(/\D/g, '');
                                                        const num = parseInt(cleanInput);

                                                        if (!cleanInput || isNaN(num)) return <p className="text-slate-500 text-sm">Ingrese un número válido.</p>;

                                                        // 1. Check Registration Status
                                                        const reg = normalizedRegistrations.find(r =>
                                                            r.children.some(c => c.inviteNumber.includes(num.toString())) // Loose check
                                                            || r.children.some(c => parseInt(c.inviteNumber.replace(/\D/g, '') || '0') === num) // Strict check
                                                        );

                                                        const childFound = reg?.children.find(c => parseInt(c.inviteNumber.replace(/\D/g, '') || '0') === num);

                                                        // 2. Check Distributor Assignment
                                                        const assignedDistributor = config.ticketDistributors?.find(d =>
                                                            d.startRange && d.endRange && num >= d.startRange && num <= d.endRange
                                                        );

                                                        return (
                                                            <div className="space-y-2 text-sm">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="font-bold w-32">Ticket:</span>
                                                                    <span className="font-mono bg-slate-100 px-2 rounded">NI{num.toString().padStart(4, '0')}</span>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="font-bold w-32">Estado Registro:</span>
                                                                    {reg ? (
                                                                        <span className="text-green-600 font-bold flex items-center gap-1">
                                                                            <CheckCircle className="w-4 h-4" />
                                                                            Registrado
                                                                        </span>
                                                                    ) : (
                                                                        <span className="text-red-600 font-bold flex items-center gap-1">
                                                                            <XCircle className="w-4 h-4" />
                                                                            NO REGISTRADO (Disponible)
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                {reg && (
                                                                    <>
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="font-bold w-32">Responsable:</span>
                                                                            <span>{reg.parentName || reg.fullName}</span>
                                                                        </div>
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="font-bold w-32">Beneficiario:</span>
                                                                            <span>{childFound?.fullName || 'N/A'}</span>
                                                                        </div>
                                                                    </>
                                                                )}
                                                                <div className="flex items-center gap-2">
                                                                    <span className="font-bold w-32">Asignado a:</span>
                                                                    {assignedDistributor ? (
                                                                        <span className="text-blue-600 font-bold">
                                                                            {assignedDistributor.name} (Rango: {assignedDistributor.startRange}-{assignedDistributor.endRange})
                                                                        </span>
                                                                    ) : (
                                                                        <span className="text-orange-500 font-bold flex items-center gap-1">
                                                                            <AlertTriangle className="w-4 h-4" />
                                                                            SIN ASIGNAR (Fuera de Rangos)
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                {!reg && assignedDistributor && (
                                                                    <div className="mt-2 text-xs text-slate-500 bg-blue-50 p-2 rounded">
                                                                        Este ticket debería aparecer como "Pendiente" en la auditoría de <strong>{assignedDistributor.name}</strong>.
                                                                    </div>
                                                                )}
                                                                {!reg && !assignedDistributor && (
                                                                    <div className="mt-2 text-xs text-slate-500 bg-orange-50 p-2 rounded">
                                                                        Al no estar asignado a ningún rango, este ticket <strong>NO aparecerá</strong> en ninguna auditoría de faltantes.
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })()}
                                                </div>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {distributorAudit.map((audit) => (
                                                <div key={audit.name} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                                                    <div className="p-5 border-b border-slate-100">
                                                        <div className="flex justify-between items-start mb-2">
                                                            <h4 className="font-bold text-slate-800 text-lg">{audit.name}</h4>
                                                            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded font-mono">
                                                                {audit.range}
                                                            </span>
                                                        </div>

                                                        <div className="space-y-3 mt-4">
                                                            {/* Registered Stats */}
                                                            <div>
                                                                <div className="flex justify-between text-xs text-slate-600 mb-1">
                                                                    <span>Ingresados en Sistema</span>
                                                                    <span className="font-bold">{audit.registeredCount} / {audit.totalAssigned}</span>
                                                                </div>
                                                                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                                                                    <div
                                                                        className="h-full bg-blue-500 rounded-full transition-all duration-500"
                                                                        style={{ width: `${audit.percentRegistered}%` }}
                                                                    ></div>
                                                                </div>
                                                            </div>

                                                            {/* Delivered Stats */}
                                                            <div>
                                                                <div className="flex justify-between text-xs text-slate-600 mb-1">
                                                                    <span>Juguetes Entregados (Scaneados)</span>
                                                                    <span className="font-bold text-green-600">{audit.deliveredCount}</span>
                                                                </div>
                                                                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                                                    <div
                                                                        className="h-full bg-green-500 rounded-full transition-all duration-500"
                                                                        style={{ width: `${audit.percentDelivered}%` }}
                                                                    ></div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Distributor Locations Chart */}
                                                    {audit.allLocations && audit.allLocations.length > 0 && (
                                                        <div className="px-5 pb-5 pt-2 border-t border-slate-50">
                                                            <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                                                <MapPin size={12} /> Zonas de Influencia ({audit.allLocations.length})
                                                            </h5>

                                                            <div className="relative border border-slate-100 rounded-lg bg-slate-50/50">
                                                                <div className="overflow-y-auto max-h-[250px] p-2 custon-scrollbar">
                                                                    <div style={{ height: Math.max(100, audit.allLocations.length * 30) }}>
                                                                        <ResponsiveContainer width="100%" height="100%">
                                                                            <BarChart
                                                                                data={audit.allLocations}
                                                                                layout="vertical"
                                                                                margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                                                                            >
                                                                                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                                                                <XAxis type="number" hide />
                                                                                <YAxis
                                                                                    dataKey="name"
                                                                                    type="category"
                                                                                    width={90}
                                                                                    tick={{ fontSize: 10 }}
                                                                                    interval={0}
                                                                                />
                                                                                <RechartsTooltip
                                                                                    contentStyle={{ fontSize: '11px', padding: '5px' }}
                                                                                    cursor={{ fill: '#e2e8f0' }}
                                                                                    formatter={(value: any, name: any, props: any) => [value, 'Tickets']}
                                                                                    labelFormatter={(idx) => {
                                                                                        // We passed index or label? Recharts passes dataKey value usually if category
                                                                                        // But safety fallback:
                                                                                        const item = audit.allLocations[idx];
                                                                                        return item ? item.fullName : '';
                                                                                    }}
                                                                                />
                                                                                <Bar dataKey="value" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={12} />
                                                                            </BarChart>
                                                                        </ResponsiveContainer>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}

                                                    <div className="p-0 flex-grow bg-slate-50/50 border-t border-slate-100">
                                                        <details className="group">
                                                            <summary className="p-4 cursor-pointer text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors flex justify-between items-center">
                                                                <span>Tickets Pendientes de Registro ({audit.missingTickets.length})</span>
                                                                <ChevronDown className="w-4 h-4 text-slate-400 group-open:rotate-180 transition-transform" />
                                                            </summary>
                                                            <div className="px-4 pb-4">
                                                                <p className="text-xs text-slate-500 mb-2 italic">
                                                                    Estos tickets están asignados al distribuidor pero NO han sido ingresados al sistema por ningún padre.
                                                                </p>
                                                                {audit.missingTickets.length > 0 ? (
                                                                    <div className="mt-2 flex flex-wrap gap-2 max-h-40 overflow-y-auto p-2 bg-white rounded border border-slate-200">
                                                                        {audit.missingTickets.map(num => (
                                                                            <span key={num} className="text-xs bg-red-50 text-red-600 px-1.5 py-0.5 rounded font-mono border border-red-100">
                                                                                {`NI${num.toString().padStart(4, '0')}`}
                                                                            </span>
                                                                        ))}
                                                                    </div>
                                                                ) : (
                                                                    <div className="text-center text-green-600 text-sm py-4 bg-green-50 rounded border border-green-100 mt-2">
                                                                        ¡Completo! Todos los tickets fueron ingresados al sistema.
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </details>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Phone Audit Section */}
                                        <div className="mt-8 pt-6 border-t border-slate-200">
                                            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                                                <span className="bg-orange-100 text-orange-600 p-1.5 rounded-lg">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-alert-triangle"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><path d="M12 9v4" /><path d="M12 17h.01" /></svg>
                                                </span>
                                                Auditoría de Teléfonos (Formato Incorrecto)
                                            </h3>

                                            {phoneAudit.length === 0 ? (
                                                <div className="bg-green-50 border border-green-100 text-green-700 p-4 rounded-lg flex items-center gap-2">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check-circle"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><path d="m9 11 3 3L22 4" /></svg>
                                                    Todos los teléfonos tienen el formato correcto (8 dígitos).
                                                </div>
                                            ) : (
                                                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                                                    <div className="p-4 bg-orange-50 border-b border-orange-100 text-orange-800 text-sm">
                                                        Se encontraron <strong>{phoneAudit.length}</strong> números que no cumplen con el formato de 8 dígitos (ej. 12345678).
                                                    </div>
                                                    <div className="overflow-x-auto">
                                                        <table className="w-full text-sm text-left">
                                                            <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
                                                                <tr>
                                                                    <th className="p-3">Responsable</th>
                                                                    <th className="p-3">Teléfono (Incorrecto)</th>
                                                                    <th className="p-3">Distribuidor Asignado</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-slate-100">
                                                                {phoneAudit.map((item, idx) => (
                                                                    <tr key={idx} className="hover:bg-slate-50">
                                                                        <td className="p-3 font-medium text-slate-900">{item.name}</td>
                                                                        <td className="p-3">
                                                                            <span className="font-mono text-red-600 bg-red-50 rounded px-2 py-1 border border-red-100">
                                                                                {item.phone}
                                                                            </span>
                                                                        </td>
                                                                        <td className="p-3 text-slate-600">{item.distributor}</td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {
                                    activeTab === 'wa_list' && (
                                        <div className="space-y-6 animate-fade-in">
                                            <div className="flex justify-between items-center">
                                                <SectionHeader title="Envíos WhatsApp" description="Gestiona los mensajes de confirmación pendientes." />
                                                <button
                                                    onClick={async () => {
                                                        const vcfContent = [
                                                            "BEGIN:VCARD",
                                                            "VERSION:3.0",
                                                            "FN:Fundación Bukele",
                                                            "ORG:Fundación Bukele",
                                                            "TEL;TYPE=WORK,VOICE:79710214",
                                                            "EMAIL:contacto@fundacionbukele.org",
                                                            "END:VCARD"
                                                        ].join("\n");

                                                        const file = new File([vcfContent], "Contacto_Fundacion.vcf", { type: "text/vcard" });

                                                        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                                                            try {
                                                                await navigator.share({
                                                                    files: [file],
                                                                    title: 'Contacto Fundación Bukele',
                                                                    text: 'Contacto para entregas de juguetes.'
                                                                });
                                                            } catch (error) {
                                                                console.log("Error sharing", error);
                                                            }
                                                        } else {
                                                            // Fallback to download
                                                            const url = URL.createObjectURL(file);
                                                            const a = document.createElement("a");
                                                            a.href = url;
                                                            a.download = "Contacto_Fundacion.vcf";
                                                            a.click();
                                                            URL.revokeObjectURL(url);
                                                        }
                                                    }}
                                                    className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-black transition-colors"
                                                >
                                                    <Share2 className="w-4 h-4" />
                                                    Compartir Contacto
                                                </button>
                                            </div>

                                            {/* Stats Cards */}
                                            <div className="grid grid-cols-3 gap-4">
                                                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center">
                                                    <div className="text-3xl font-bold text-slate-800">{registrations.length}</div>
                                                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wide">Total</div>
                                                </div>
                                                <div className="bg-green-50 p-4 rounded-xl border border-green-100 shadow-sm flex flex-col items-center">
                                                    <div className="text-3xl font-bold text-green-600">{registrations.filter(r => r.whatsappSent).length}</div>
                                                    <div className="text-xs font-bold text-green-600 uppercase tracking-wide">Enviados</div>
                                                </div>
                                                <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 shadow-sm flex flex-col items-center">
                                                    <div className="text-3xl font-bold text-orange-600">{registrations.filter(r => !r.whatsappSent).length}</div>
                                                    <div className="text-xs font-bold text-orange-600 uppercase tracking-wide">Pendientes</div>
                                                </div>
                                            </div>

                                            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                                                <div className="p-4 border-b border-slate-100 flex gap-4 items-center">
                                                    <input
                                                        type="text"
                                                        placeholder="Buscar por nombre o teléfono..."
                                                        value={searchTerm}
                                                        onChange={(e) => setSearchTerm(e.target.value)}
                                                        className="px-3 py-2 border border-slate-300 rounded-lg text-sm w-full"
                                                    />
                                                    <label className="flex items-center gap-2 cursor-pointer whitespace-nowrap">
                                                        <input
                                                            type="checkbox"
                                                            checked={showPendingOnly}
                                                            onChange={(e) => setShowPendingOnly(e.target.checked)}
                                                            className="w-4 h-4 rounded border-slate-300 text-orange-500 focus:ring-orange-500"
                                                        />
                                                        <span className="text-sm font-medium text-slate-700">Solo Pendientes</span>
                                                    </label>
                                                </div>

                                                {filteredRegistrations.length === 0 ? (
                                                    <div className="p-8 text-center text-slate-500">No hay registros</div>
                                                ) : (
                                                    <div className="overflow-x-auto">
                                                        {/* Desktop Table */}
                                                        <table className="w-full text-sm text-left hidden md:table">
                                                            <thead className="text-xs text-slate-500 uppercase bg-slate-50">
                                                                <tr>
                                                                    <th className="px-6 py-3">Nombre</th>
                                                                    <th className="px-6 py-3">WhatsApp</th>
                                                                    <th className="px-6 py-3 text-center">Estado</th>
                                                                    <th className="px-6 py-3">Niños</th>
                                                                    <th className="px-6 py-3 text-right">Acción</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-slate-100">
                                                                {filteredRegistrations.map(reg => (
                                                                    <tr key={reg.id} className="hover:bg-slate-50">
                                                                        <td className="px-6 py-4 font-medium text-slate-900">
                                                                            {reg.parentName || reg.fullName}
                                                                            <div className="text-xs text-slate-500">{reg.ticketDistributor || 'Sin Distribuidor'}</div>
                                                                        </td>
                                                                        <td className="px-6 py-4 text-slate-600">{reg.whatsapp}</td>
                                                                        <td className="px-6 py-4 text-center">
                                                                            {reg.whatsappSent ? (
                                                                                <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-bold">
                                                                                    <MessageSquare size={12} className="fill-green-700" /> Enviado
                                                                                </span>
                                                                            ) : (
                                                                                <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-500 px-2 py-1 rounded-full text-xs font-bold">
                                                                                    <Loader2 size={12} /> Pendiente
                                                                                </span>
                                                                            )}
                                                                        </td>
                                                                        <td className="px-6 py-4">
                                                                            <span className="bg-slate-100 px-2 py-1 rounded text-xs font-bold text-slate-600">
                                                                                {reg.children?.length || reg.childCount || 0}
                                                                            </span>
                                                                        </td>
                                                                        <td className="px-6 py-4 text-right">
                                                                            <div className="flex justify-end gap-2">
                                                                                <button
                                                                                    onClick={() => handleWhatsApp(reg)}
                                                                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm transition-colors flex items-center gap-1 ${reg.whatsappSent ? 'bg-slate-200 text-slate-600 hover:bg-slate-300' : 'bg-green-500 hover:bg-green-600 text-white'}`}
                                                                                >
                                                                                    <MessageSquare size={14} /> {reg.whatsappSent ? 'Reenviar' : 'Enviar QR'}
                                                                                </button>
                                                                            </div>
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>

                                                        {/* Mobile Cards */}
                                                        <div className="md:hidden divide-y divide-slate-100">
                                                            {filteredRegistrations.map(reg => (
                                                                <div key={reg.id} className="p-4 flex flex-col gap-3">
                                                                    <div className="flex justify-between items-start">
                                                                        <div>
                                                                            <div className="font-bold text-slate-900">{reg.parentName || reg.fullName}</div>
                                                                            <div className="text-xs text-slate-500 flex items-center gap-2 mt-1">
                                                                                <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 border border-slate-200 flex items-center gap-1">
                                                                                    <User size={10} /> {reg.children?.length || reg.childCount || 0} Niños
                                                                                </span>
                                                                                {reg.ticketDistributor && (
                                                                                    <span className="text-blue-600 font-medium">@{reg.ticketDistributor}</span>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                        {reg.whatsappSent ? (
                                                                            <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 px-2 py-1 rounded-full text-[10px] font-bold border border-green-100">
                                                                                <Check size={10} /> Enviado
                                                                            </span>
                                                                        ) : (
                                                                            <span className="inline-flex items-center gap-1 bg-orange-50 text-orange-600 px-2 py-1 rounded-full text-[10px] font-bold border border-orange-100">
                                                                                <Clock size={10} /> Pendiente
                                                                            </span>
                                                                        )}
                                                                    </div>

                                                                    <div className="flex items-center justify-between mt-1">
                                                                        <div className="text-sm text-slate-600 font-mono bg-slate-50 px-2 py-1 rounded border border-slate-100">
                                                                            {reg.whatsapp}
                                                                        </div>
                                                                        <button
                                                                            onClick={() => handleWhatsApp(reg)}
                                                                            className={`px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition-colors flex items-center gap-2 ${reg.whatsappSent ? 'bg-slate-100 text-slate-500 border border-slate-200' : 'bg-green-500 text-white shadow-green-200'}`}
                                                                        >
                                                                            <MessageSquare size={16} />
                                                                            {reg.whatsappSent ? 'Reenviar' : 'Enviar QR'}
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )
                                }

                                {
                                    activeTab === 'users' && currentUser?.role === 'admin' && (
                                        <UsersManagementTab />
                                    )
                                }
                                {
                                    activeTab === 'system' && currentUser?.role === 'admin' && (
                                        <SystemBackupTab />
                                    )
                                }

                            </div>
                        </div>
                        {/* QR Code Modal */}
                        {
                            viewingQR && (
                                <div className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
                                    <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-sm w-full relative flex flex-col items-center">
                                        <button
                                            onClick={() => setViewingQR(null)}
                                            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
                                        >
                                            <X size={24} />
                                        </button>

                                        <h3 className="text-xl font-bold text-slate-800 mb-1">{viewingQR.name}</h3>
                                        <p className="text-sm text-slate-500 font-mono mb-6">{viewingQR.invite}</p>

                                        <div className="bg-white p-4 rounded-xl shadow-inner border border-slate-100">
                                            <QRCodeCanvas
                                                value={viewingQR.data}
                                                size={200}
                                                level={"H"}
                                                includeMargin={true}
                                            />
                                        </div>

                                        <p className="text-xs text-slate-400 mt-6 text-center">
                                            Muestra este código al equipo de entrega para recibir el juguete.
                                        </p>
                                    </div>
                                </div>
                            )
                        }
                        {/* Edit Modal (CRM) */}
                        {
                            editingReg && (
                                <EditRegistrationModal
                                    registration={editingReg}
                                    onClose={() => setEditingReg(null)}
                                    onSave={handleUpdateRegistration}
                                />
                            )
                        }
                    </div>
                )}
            </div>
        </div >
    );
};


export default AdminPanel;