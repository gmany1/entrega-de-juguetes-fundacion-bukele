import React, { useState } from 'react';
import { MoreHorizontal, Plus, Calendar, DollarSign, User, Phone, Mail, ArrowRight, Star, X } from 'lucide-react';

interface Deal {
    id: string;
    client: string;
    event: string;
    value: number;
    date: string;
    probability: number; // 0-100
    contact: string;
}

interface Column {
    id: string;
    title: string;
    color: string;
    deals: Deal[];
}

const CRMPipeline: React.FC = () => {
    // State
    const [columns, setColumns] = useState<Column[]>([
        {
            id: 'new',
            title: 'Nuevos Prospectos',
            color: 'bg-blue-500',
            deals: [
                { id: '1', client: 'Andrea & Jorge', event: 'Boda Civil', value: 3500, date: 'Nov 12', probability: 20, contact: '2222-1234' },
                { id: '2', client: 'Banco Agricola', event: 'Cena Navideña', value: 12000, date: 'Dec 15', probability: 30, contact: 'jurídico@banco.com' },
            ]
        },
        {
            id: 'quote',
            title: 'Cotización Enviada',
            color: 'bg-amber-500',
            deals: [
                { id: '3', client: 'Familia Rivas', event: '15 Años Sofía', value: 8500, date: 'Oct 30', probability: 60, contact: '7777-9999' },
            ]
        },
        {
            id: 'negotiation',
            title: 'Negociación',
            color: 'bg-purple-500',
            deals: [
                { id: '4', client: 'TechSummit SV', event: 'Lanzamiento App', value: 25000, date: 'Oct 05', probability: 85, contact: 'ceo@tech.sv' },
            ]
        },
        {
            id: 'won',
            title: 'Cerrado - Ganado',
            color: 'bg-green-500',
            deals: [
                { id: '5', client: 'Industrias La Constancia', event: 'Activación BTL', value: 900, date: 'Sep 28', probability: 100, contact: 'marketing@ilc.com' },
            ]
        }
    ]);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newDeal, setNewDeal] = useState<Partial<Deal>>({ client: '', event: '', value: 0, date: '', contact: '' });
    const [editingDealId, setEditingDealId] = useState<string | null>(null);
    const [activeMenuDealId, setActiveMenuDealId] = useState<string | null>(null);
    const [draggedDealId, setDraggedDealId] = useState<string | null>(null);
    const [sourceColId, setSourceColId] = useState<string | null>(null);

    const getTotalValue = (col: Column) => col.deals.reduce((sum, deal) => sum + deal.value, 0);

    // --- Drag & Drop Logic ---

    const handleDragStart = (e: React.DragEvent, dealId: string, colId: string) => {
        setDraggedDealId(dealId);
        setSourceColId(colId);
        e.dataTransfer.effectAllowed = 'move';
        // Add a ghost image or styling if needed
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault(); // Necessary to allow dropping
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = (e: React.DragEvent, targetColId: string) => {
        e.preventDefault();

        if (!draggedDealId || !sourceColId || sourceColId === targetColId) {
            setDraggedDealId(null);
            setSourceColId(null);
            return;
        }

        setColumns(prev => {
            const newCols = [...prev];
            const sourceCol = newCols.find(c => c.id === sourceColId);
            const destCol = newCols.find(c => c.id === targetColId);

            if (sourceCol && destCol) {
                const dealIndex = sourceCol.deals.findIndex(d => d.id === draggedDealId);
                if (dealIndex > -1) {
                    const [deal] = sourceCol.deals.splice(dealIndex, 1);

                    // Auto-update probability
                    if (targetColId === 'new') deal.probability = 20;
                    if (targetColId === 'quote') deal.probability = 60;
                    if (targetColId === 'negotiation') deal.probability = 85;
                    if (targetColId === 'won') deal.probability = 100;

                    destCol.deals.push(deal);
                }
            }
            return newCols;
        });

        setDraggedDealId(null);
        setSourceColId(null);
    };    // ... (existing dnd logic is fine, no changes needed inside)

    // --- Actions Logic ---
    const handleEditClick = (deal: Deal) => {
        setNewDeal(deal);
        setEditingDealId(deal.id);
        setIsModalOpen(true);
        setActiveMenuDealId(null);
    };

    const handleDeleteClick = (dealId: string) => {
        if (confirm('¿Estás seguro de eliminar este prospecto?')) {
            setColumns(prev => prev.map(col => ({
                ...col,
                deals: col.deals.filter(d => d.id !== dealId)
            })));
        }
        setActiveMenuDealId(null);
    };

    const toggleMenu = (e: React.MouseEvent, dealId: string) => {
        e.stopPropagation();
        setActiveMenuDealId(activeMenuDealId === dealId ? null : dealId);
    };

    // --- Add/Edit Deal Logic ---
    const handleSaveDeal = (e: React.FormEvent) => {
        e.preventDefault();

        const dealData: Deal = {
            id: editingDealId || Date.now().toString(),
            client: newDeal.client || 'Cliente Sin Nombre',
            event: newDeal.event || 'Evento General',
            value: Number(newDeal.value) || 0,
            date: newDeal.date || new Date().toLocaleDateString(),
            probability: editingDealId ? (newDeal.probability || 20) : 20, // Keep prob if editing
            contact: newDeal.contact || ''
        };

        if (editingDealId) {
            // Update existing
            setColumns(prev => prev.map(col => ({
                ...col,
                deals: col.deals.map(d => d.id === editingDealId ? { ...dealData, probability: d.probability } : d) // Preserve probability/stage logic unless specifically edited? Actually stage is column-dependent. The payload has probability.
                // Let's ensure we don't accidentally reset probability if it's not in the form form, but we are using newDeal state which probably doesn't have it fully sync'd if we didn't populate it.
                // Wait, newDeal state in the partial didn't have probability. Let's fix that.
            })));
        } else {
            // Create new
            setColumns(prev => {
                const newCols = [...prev];
                newCols[0].deals.push(dealData);
                return newCols;
            });
        }

        setIsModalOpen(false);
        setEditingDealId(null);
        setNewDeal({ client: '', event: '', value: 0, date: '', contact: '' });
    };

    return (
        <div className="h-[calc(100vh-140px)] flex flex-col relative" onClick={() => setActiveMenuDealId(null)}>
            {/* Header */}
            <div className="flex justify-between items-center mb-6 px-1">
                <div>
                    <h1 className="text-2xl font-bold text-[#0A1929]">Pipeline de Ventas</h1>
                    <p className="text-slate-500 text-sm">Arrastra y suelta para mover prospectos de etapa.</p>
                </div>
                <button
                    onClick={() => {
                        setEditingDealId(null);
                        setNewDeal({ client: '', event: '', value: 0, date: '', contact: '' });
                        setIsModalOpen(true);
                    }}
                    className="bg-[#D4AF37] hover:bg-[#B08D4B] text-white px-4 py-2 rounded-xl font-bold shadow-lg shadow-orange-900/10 flex items-center gap-2 transition-all active:scale-95"
                >
                    <Plus size={20} /> Nuevo Prospecto
                </button>
            </div>

            {/* Kanban Board */}
            <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4">
                <div className="flex gap-6 h-full min-w-[1000px] px-1">
                    {columns.map((col) => (
                        <div
                            key={col.id}
                            className="w-80 flex flex-col h-full"
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, col.id)}
                        >
                            {/* Column Header */}
                            <div className="flex items-center justify-between mb-4 px-2">
                                <div className="flex items-center gap-2">
                                    <div className={`w-3 h-3 rounded-full ${col.color}`}></div>
                                    <h3 className="font-bold text-slate-700">{col.title}</h3>
                                    <span className="bg-slate-100 text-slate-500 text-xs px-2 py-0.5 rounded-full font-bold">
                                        {col.deals.length}
                                    </span>
                                </div>
                                <button className="text-slate-400 hover:text-slate-600"><MoreHorizontal size={18} /></button>
                            </div>

                            {/* Column Body (Drop Zone) */}
                            <div className={`flex-1 bg-slate-100/50 rounded-2xl p-3 space-y-3 overflow-y-auto border-2 border-dashed transition-colors ${sourceColId && sourceColId !== col.id ? 'border-blue-200 bg-blue-50/30' : 'border-transparent'}`}>
                                {col.deals.map((deal) => (
                                    <div
                                        key={deal.id}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, deal.id, col.id)}
                                        className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-all cursor-grab active:cursor-grabbing group relative hover:-translate-y-1"
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="font-bold text-slate-800 text-sm line-clamp-1">{deal.client}</div>
                                            <div className="relative">
                                                <button
                                                    onClick={(e) => toggleMenu(e, deal.id)}
                                                    className="text-slate-300 hover:text-slate-600 p-1 rounded-md hover:bg-slate-100 transition-colors"
                                                >
                                                    <MoreHorizontal size={16} />
                                                </button>

                                                {/* Dropdown Menu */}
                                                {activeMenuDealId === deal.id && (
                                                    <div className="absolute right-0 top-6 w-32 bg-white rounded-xl shadow-xl border border-slate-100 z-10 overflow-hidden animate-fade-in">
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleEditClick(deal); }}
                                                            className="w-full text-left px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 flex items-center gap-2"
                                                        >
                                                            Editar
                                                        </button>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleDeleteClick(deal.id); }}
                                                            className="w-full text-left px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 flex items-center gap-2"
                                                        >
                                                            Eliminar
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="text-xs text-slate-500 font-medium mb-3 flex items-center gap-1">
                                            <Star size={12} className={col.id === 'won' ? 'text-green-500 fill-green-500' : 'text-slate-400'} />
                                            {deal.event}
                                        </div>

                                        <div className="flex items-center gap-2 mb-3">
                                            <div className="bg-slate-50 px-2 py-1 rounded text-[10px] font-mono text-slate-500 flex items-center gap-1">
                                                <Calendar size={10} /> {deal.date}
                                            </div>
                                            {deal.probability < 100 && (
                                                <div className={`px-2 py-1 rounded text-[10px] font-bold ${deal.probability > 50 ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}`}>
                                                    {deal.probability}% Prob.
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex justify-between items-end border-t border-slate-50 pt-3">
                                            <div className="flex -space-x-2">
                                                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-[10px] font-bold text-blue-700 border border-white">
                                                    <User size={12} />
                                                </div>
                                            </div>
                                            <div className="font-bold text-slate-900 text-sm">
                                                ${deal.value.toLocaleString()}
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {/* Add Button at bottom of column */}
                                <button
                                    onClick={() => {
                                        setEditingDealId(null);
                                        setNewDeal({ client: '', event: '', value: 0, date: '', contact: '' });
                                        setIsModalOpen(true);
                                    }}
                                    className="w-full py-2 border border-dashed border-slate-300 rounded-xl text-slate-400 text-xs font-bold hover:bg-white hover:text-blue-500 hover:border-blue-300 transition-colors"
                                >
                                    + Añadir
                                </button>
                            </div>

                            {/* Column Footer */}
                            <div className="mt-3 text-right px-2">
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Etapa</div>
                                <div className="text-sm font-bold text-slate-700">${getTotalValue(col).toLocaleString()}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Add/Edit Deal Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-fade-in-up">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="font-bold text-lg text-[#0A1929]">{editingDealId ? 'Editar Prospecto' : 'Nuevo Prospecto'}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSaveDeal} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Cliente</label>
                                <input
                                    autoFocus
                                    type="text"
                                    required
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                                    placeholder="Ej. Familia Pérez"
                                    value={newDeal.client}
                                    onChange={e => setNewDeal({ ...newDeal, client: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Evento</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                                    placeholder="Ej. Boda Civil"
                                    value={newDeal.event}
                                    onChange={e => setNewDeal({ ...newDeal, event: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Valor Estimado ($)</label>
                                    <input
                                        type="number"
                                        required
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                                        placeholder="0.00"
                                        value={newDeal.value}
                                        onChange={e => setNewDeal({ ...newDeal, value: Number(e.target.value) })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Fecha</label>
                                    <input
                                        type="text"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                                        placeholder="Nov 15"
                                        value={newDeal.date}
                                        onChange={e => setNewDeal({ ...newDeal, date: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Contacto</label>
                                <input
                                    type="text"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                                    placeholder="Teléfono o Email"
                                    value={newDeal.contact}
                                    onChange={e => setNewDeal({ ...newDeal, contact: e.target.value })}
                                />
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 py-3 text-slate-500 font-bold text-sm hover:bg-slate-50 rounded-xl transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-3 bg-[#D4AF37] text-white font-bold text-sm rounded-xl hover:bg-[#B08D4B] shadow-lg shadow-orange-900/10 transition-colors"
                                >
                                    {editingDealId ? 'Guardar Cambios' : 'Crear Prospecto'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CRMPipeline;
