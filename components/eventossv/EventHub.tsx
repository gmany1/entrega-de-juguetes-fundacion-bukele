import React, { useState } from 'react';
import {
    Calendar, Clock, Paperclip, MessageSquare,
    CheckSquare, FileText, Image,
    Send, Plus, X, Trash2, Edit2
} from 'lucide-react';

interface TimelineItem {
    id: number;
    time: string;
    title: string;
    description: string;
    completed: boolean;
}

interface FileItem {
    id: number;
    name: string;
    type: 'pdf' | 'img';
    size: string;
    date: string;
}

interface Collaborator {
    id: number;
    name: string;
    role: string;
    email: string;
}

const EventHub: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'timeline' | 'files' | 'chat'>('timeline');

    // Mock Data (Static for single event context)
    const eventDetails = {
        name: "Boda Civil: Andrea & Jorge",
        date: "12 de Noviembre, 2024",
        location: "Jardín Los Eucaliptos",
        status: "En Proceso"
    };

    // State for Timeline CRUD
    const [timeline, setTimeline] = useState<TimelineItem[]>([
        { id: 1, time: "09:00 AM", title: "Montaje de Estructuras", description: "Equipo de sonido e iluminación", completed: true },
        { id: 2, time: "11:00 AM", title: "Llegada de Mobiliario", description: "Sillas Tiffany y mesas", completed: true },
        { id: 3, time: "02:00 PM", title: "Prueba de Sonido", description: "Técnico de audio", completed: false },
        { id: 4, time: "04:00 PM", title: "Inicio de Ceremonia", description: "Coordinar entrada de novios", completed: false },
    ]);

    const [files] = useState<FileItem[]>([
        { id: 1, name: "Contrato_Firmado.pdf", type: "pdf", size: "2.5 MB", date: "Oct 15" },
        { id: 2, name: "Moodboard_Floral.png", type: "img", size: "12 MB", date: "Oct 20" },
        { id: 3, name: "Distribucion_Mesas_V3.pdf", type: "pdf", size: "1.1 MB", date: "Nov 02" },
    ]);

    // Form State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEventId, setEditingEventId] = useState<number | null>(null);
    const [formData, setFormData] = useState<Partial<TimelineItem>>({ time: '', title: '', description: '' });

    // State for Collaborators
    const [collaborators, setCollaborators] = useState<Collaborator[]>([
        { id: 1, name: "Carlos", role: "Fotógrafo", email: "carlos@wedding.com" },
        { id: 2, name: "Ana", role: "Catering", email: "ana@food.com" }
    ]);
    const [modalMode, setModalMode] = useState<'event' | 'collaborator'>('event');
    const [newCollaborator, setNewCollaborator] = useState<Partial<Collaborator>>({ name: '', role: 'Coordinador', email: '' });

    // State for Chat
    const [chatInput, setChatInput] = useState('');
    const [chatMessages, setChatMessages] = useState([
        { id: 1, text: "¿Ya confirmaron el color de la mantelería?", sender: "Jorge", time: "10:30 AM", isMe: false },
        { id: 2, text: "Sí, será Champagne. Ya actualicé el inventario.", sender: "Yo", time: "10:32 AM", isMe: true },
    ]);

    // --- CRUD Handlers ---

    const handleAddClick = () => {
        setModalMode('event');
        setEditingEventId(null);
        setFormData({ time: '', title: '', description: '' });
        setIsModalOpen(true);
    };

    const handleEditClick = (item: TimelineItem) => {
        setModalMode('event');
        setEditingEventId(item.id);
        setFormData({ time: item.time, title: item.title, description: item.description });
        setIsModalOpen(true);
    };

    const handleAddCollaboratorClick = () => {
        setModalMode('collaborator');
        setNewCollaborator({ name: '', role: 'Coordinador', email: '' });
        setIsModalOpen(true);
    };

    const handleSaveCollaborator = (e: React.FormEvent) => {
        e.preventDefault();
        if (newCollaborator.name && newCollaborator.role) {
            setCollaborators(prev => [...prev, {
                id: Date.now(),
                name: newCollaborator.name!,
                role: newCollaborator.role!,
                email: newCollaborator.email || ''
            }]);
            setIsModalOpen(false);
        }
    };

    const handleRemoveCollaborator = (id: number) => {
        if (confirm(`¿Eliminar colaborador?`)) {
            setCollaborators(prev => prev.filter(c => c.id !== id));
        }
    };

    const handleDeleteClick = (id: number) => {
        if (confirm('¿Eliminar este evento del timeline?')) {
            setTimeline(prev => prev.filter(item => item.id !== id));
        }
    };

    const handleToggleComplete = (id: number) => {
        setTimeline(prev => prev.map(item =>
            item.id === id ? { ...item, completed: !item.completed } : item
        ));
    };

    const handleSendMessage = () => {
        if (!chatInput.trim()) return;
        const newMessage = {
            id: Date.now(),
            text: chatInput,
            sender: "Yo",
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isMe: true
        };
        setChatMessages(prev => [...prev, newMessage]);
        setChatInput('');
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();

        if (editingEventId) {
            // Update
            setTimeline(prev => prev.map(item =>
                item.id === editingEventId
                    ? { ...item, time: formData.time!, title: formData.title!, description: formData.description! }
                    : item
            ));
        } else {
            // Create
            const newItem: TimelineItem = {
                id: Date.now(),
                time: formData.time || '12:00 PM',
                title: formData.title || 'Nuevo Evento',
                description: formData.description || '',
                completed: false
            };
            // Sort logic could go here, for now just append
            setTimeline(prev => [...prev, newItem].sort((a, b) => a.time.localeCompare(b.time)));
        }
        setIsModalOpen(false);
    };

    return (
        <div className="h-[calc(100vh-100px)] flex flex-col max-w-5xl mx-auto">

            {/* Event Header */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="bg-purple-100 text-purple-700 text-xs font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
                            {eventDetails.status}
                        </span>
                        <span className="text-slate-400 text-xs font-mono">#EVT-8821</span>
                    </div>
                    <h1 className="text-2xl font-bold text-[#0A1929]">{eventDetails.name}</h1>
                    <div className="flex items-center gap-4 text-slate-500 text-sm mt-1">
                        <div className="flex items-center gap-1"><Calendar size={14} /> {eventDetails.date}</div>
                        <div className="flex items-center gap-1"><Clock size={14} /> 45 Días Restantes</div>
                    </div>
                </div>

                <div className="flex -space-x-3">
                    {collaborators.map((collab) => (
                        <div
                            key={collab.id}
                            onClick={() => handleRemoveCollaborator(collab.id)}
                            className="group relative w-10 h-10 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-500 shadow-sm transition-transform hover:-translate-y-1 hover:bg-red-100 hover:text-red-500 cursor-pointer"
                            title={`${collab.name} - ${collab.role}`}
                        >
                            {collab.name.charAt(0)}
                            {/* Role Indicator Bubble */}
                            <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border border-white flex items-center justify-center text-[8px] bg-blue-100 text-blue-600">
                                {collab.role.charAt(0)}
                            </span>
                        </div>
                    ))}
                    <button
                        onClick={handleAddCollaboratorClick}
                        className="w-10 h-10 rounded-full border-2 border-white bg-blue-600 text-white flex items-center justify-center shadow-sm hover:scale-105 transition-transform"
                        title="Agregar Colaborador"
                    >
                        <Plus size={18} />
                    </button>
                </div>
            </div>

            {/* Tabs & Content */}
            <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                {/* Tab Nav */}
                <div className="flex border-b border-slate-100 justify-between items-center pr-4">
                    <div className="flex flex-1">
                        <button
                            onClick={() => setActiveTab('timeline')}
                            className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === 'timeline' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                        >
                            <CheckSquare size={18} /> Timeline
                        </button>
                        <button
                            onClick={() => setActiveTab('files')}
                            className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === 'files' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                        >
                            <Paperclip size={18} /> Archivos
                        </button>
                        <button
                            onClick={() => setActiveTab('chat')}
                            className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === 'chat' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                        >
                            <MessageSquare size={18} /> Chat de Equipo
                        </button>
                    </div>
                    {/* Add Button Contextual */}
                    {activeTab === 'timeline' && (
                        <button
                            onClick={handleAddClick}
                            className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-blue-700 transition"
                        >
                            <Plus size={14} /> Agregar Hito
                        </button>
                    )}
                </div>

                {/* Tab Panels */}
                <div className="flex-1 overflow-y-auto p-0 bg-slate-50/50">

                    {/* Timeline View */}
                    {activeTab === 'timeline' && (
                        <div className="p-6 relative max-w-2xl mx-auto">
                            <div className="absolute left-9 top-6 bottom-6 w-0.5 bg-slate-200"></div>
                            <div className="space-y-8">
                                {timeline.map((item) => (
                                    <div key={item.id} className="relative flex items-start gap-6 group">
                                        {/* Status Checkbox */}
                                        <button
                                            onClick={() => handleToggleComplete(item.id)}
                                            className={`relative z-10 w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 bg-white transition-colors hover:scale-110 ${item.completed ? 'border-green-500 text-green-500' : 'border-slate-300 text-slate-300 hover:border-green-400'}`}
                                        >
                                            <div className={`w-2 h-2 rounded-full ${item.completed ? 'bg-green-500' : 'bg-transparent'}`}></div>
                                        </button>

                                        {/* Content Card */}
                                        <div className="flex-1 bg-white p-4 rounded-xl shadow-sm border border-slate-100 group-hover:shadow-md transition-all relative">
                                            {/* Action Buttons (Hover) */}
                                            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleEditClick(item)}
                                                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                                                    title="Editar"
                                                >
                                                    <Edit2 size={14} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteClick(item.id)}
                                                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                                                    title="Eliminar"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>

                                            <div className="text-xs font-bold text-slate-400 mb-1 flex items-center gap-1">
                                                <Clock size={12} /> {item.time}
                                            </div>
                                            <h3 className={`font-bold ${item.completed ? 'text-slate-500 line-through' : 'text-slate-800'}`}>{item.title}</h3>
                                            <p className="text-sm text-slate-500 mt-1">{item.description}</p>
                                        </div>
                                    </div>
                                ))}
                                {timeline.length === 0 && (
                                    <div className="text-center py-10 text-slate-400 text-sm">
                                        No hay hitos en el timeline. ¡Agrega el primero!
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Files View */}
                    {activeTab === 'files' && (
                        <div className="p-6 grid grid-cols-2 md:grid-cols-3 gap-4">
                            {files.map((file) => (
                                <div key={file.id} className="bg-white p-4 rounded-xl border border-slate-200 hover:border-blue-300 cursor-pointer group transition-all">
                                    <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center mb-3 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                                        {file.type === 'pdf' ? <FileText size={20} /> : <Image size={20} />}
                                    </div>
                                    <div className="font-bold text-slate-700 text-sm truncate" title={file.name}>{file.name}</div>
                                    <div className="text-xs text-slate-400 mt-1">{file.size} • {file.date}</div>
                                </div>
                            ))}
                            {/* Upload Placeholer */}
                            <div className="border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center text-slate-400 p-4 hover:bg-slate-50 cursor-pointer hover:border-blue-300 transition-all">
                                <Paperclip size={24} className="mb-2" />
                                <span className="text-xs font-bold text-center">Subir Archivo</span>
                            </div>
                        </div>
                    )}

                    {/* Chat View */}
                    {activeTab === 'chat' && (
                        <div className="flex flex-col h-full h-[600px]">
                            <div className="flex-1 p-6 space-y-4 overflow-y-auto">
                                {chatMessages.map((msg) => (
                                    <div key={msg.id} className={`flex gap-3 ${msg.isMe ? 'flex-row-reverse' : ''}`}>
                                        <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-[10px] font-bold ${msg.isMe ? 'bg-blue-100 text-blue-600' : 'bg-slate-200 text-slate-500'}`}>
                                            {msg.sender.charAt(0)}
                                        </div>
                                        <div className={msg.isMe ? 'text-right' : ''}>
                                            <div className={`p-3 rounded-xl shadow-sm text-sm ${msg.isMe ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white border border-slate-100 text-slate-700 rounded-tl-none'}`}>
                                                {msg.text}
                                            </div>
                                            <div className="text-[10px] text-slate-400 mt-1 mr-1">{msg.isMe ? '' : `${msg.sender}, `}{msg.time}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="p-4 bg-white border-t border-slate-100">
                                <form
                                    className="flex gap-2"
                                    onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
                                >
                                    <input
                                        type="text"
                                        placeholder="Escribe un mensaje al equipo..."
                                        className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        value={chatInput}
                                        onChange={(e) => setChatInput(e.target.value)}
                                    />
                                    <button
                                        type="submit"
                                        className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center hover:bg-blue-700 active:scale-95 transition-transform"
                                    >
                                        <Send size={18} />
                                    </button>
                                </form>
                            </div>
                        </div>
                    )}

                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm animate-fade-in-up">
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="font-bold text-lg text-slate-800">
                                {modalMode === 'event'
                                    ? (editingEventId ? 'Editar Hito' : 'Nuevo Hito')
                                    : 'Nuevo Colaborador'
                                }
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X size={20} />
                            </button>
                        </div>

                        {modalMode === 'event' ? (
                            <form onSubmit={handleSave} className="p-4 space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Hora</label>
                                    <div className="relative">
                                        <Clock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="text"
                                            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="09:00 AM"
                                            value={formData.time}
                                            onChange={e => setFormData({ ...formData, time: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Título</label>
                                    <input
                                        type="text"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Ej. Ceremonia Civil"
                                        value={formData.title}
                                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Descripción</label>
                                    <textarea
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none h-20"
                                        placeholder="Detalles adicionales..."
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    />
                                </div>
                                <div className="pt-2 flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="flex-1 py-2 text-slate-500 font-bold text-sm hover:bg-slate-50 rounded-xl transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 py-2 bg-blue-600 text-white font-bold text-sm rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-colors"
                                    >
                                        Guardar
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <form onSubmit={handleSaveCollaborator} className="p-4 space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nombre</label>
                                    <input
                                        type="text"
                                        autoFocus
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Ej. Juan Pérez"
                                        value={newCollaborator.name}
                                        onChange={e => setNewCollaborator({ ...newCollaborator, name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Rol / Cargo</label>
                                    <select
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        value={newCollaborator.role}
                                        onChange={e => setNewCollaborator({ ...newCollaborator, role: e.target.value })}
                                    >
                                        <option value="Coordinador">Coordinador</option>
                                        <option value="Fotógrafo">Fotógrafo</option>
                                        <option value="Catering">Catering</option>
                                        <option value="Música/DJ">Música/DJ</option>
                                        <option value="Florista">Florista</option>
                                        <option value="Logística">Logística</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email <span className="text-slate-300 normal-case">(Opcional)</span></label>
                                    <input
                                        type="email"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="correo@ejemplo.com"
                                        value={newCollaborator.email}
                                        onChange={e => setNewCollaborator({ ...newCollaborator, email: e.target.value })}
                                    />
                                </div>
                                <div className="pt-2 flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="flex-1 py-2 text-slate-500 font-bold text-sm hover:bg-slate-50 rounded-xl transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 py-2 bg-blue-600 text-white font-bold text-sm rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-colors"
                                    >
                                        Agregar Equipo
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}

        </div>
    );
};

export default EventHub;
