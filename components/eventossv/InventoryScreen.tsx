import React, { useState } from 'react';
import { Package, Search, Filter, Grid, List, AlertTriangle, Minus, Plus } from 'lucide-react';

const InventoryScreen: React.FC = () => {
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [searchTerm, setSearchTerm] = useState('');

    // State for inventory items
    const [inventory, setInventory] = useState([
        { id: 1, name: 'Sillas Tiffany Doradas', category: 'Mobiliario', stock: 150, total: 200, status: 'available', image: 'https://images.unsplash.com/photo-1544457070-4cd773b4d71e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' },
        { id: 2, name: 'Mesas Redondas 10pax', category: 'Mobiliario', stock: 12, total: 20, status: 'low_stock', image: 'https://images.unsplash.com/photo-1574621100236-d25b64cfd647?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' },
        { id: 3, name: 'Mantelería Champagne', category: 'Textiles', stock: 0, total: 50, status: 'out_of_stock', image: 'https://images.unsplash.com/photo-1533090481720-856c6e3c1fdc?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' },
        { id: 4, name: 'Centros de Mesa Cristal', category: 'Decoración', stock: 45, total: 45, status: 'available', image: 'https://images.unsplash.com/photo-1516600164266-f3b8166cf679?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' },
    ]);

    const handleAdjustStock = (id: number, delta: number) => {
        setInventory(prev => prev.map(item => {
            if (item.id === id) {
                const newStock = Math.max(0, Math.min(item.total, item.stock + delta));
                let newStatus = 'available';
                if (newStock === 0) newStatus = 'out_of_stock';
                else if (newStock < 10) newStatus = 'low_stock';
                return { ...item, stock: newStock, status: newStatus };
            }
            return item;
        }));
    };

    const filteredInventory = inventory.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-[#0A1929]">Inventario</h1>
                    <p className="text-slate-500 text-sm">Gestión de activos y disponibilidad</p>
                </div>
                <div className="flex gap-2 bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
                    <button
                        onClick={() => setViewMode('grid')}
                        className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-blue-50 text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        <Grid size={20} />
                    </button>
                    <button
                        onClick={() => setViewMode('list')}
                        className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-blue-50 text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        <List size={20} />
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar item..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg font-bold text-slate-600 hover:bg-slate-50">
                    <Filter size={18} /> Filtros
                </button>
            </div>

            {/* Grid View */}
            {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {filteredInventory.map((item) => (
                        <div key={item.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow group">
                            <div className="h-48 overflow-hidden relative">
                                <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                <div className={`absolute top-3 right-3 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide 
                                    ${item.status === 'available' ? 'bg-green-100 text-green-700' :
                                        item.status === 'low_stock' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                                    {item.status === 'available' ? 'Disponible' : item.status === 'low_stock' ? 'Poco Stock' : 'Agotado'}
                                </div>
                            </div>
                            <div className="p-4">
                                <div className="text-xs text-slate-400 font-bold uppercase mb-1">{item.category}</div>
                                <h3 className="font-bold text-[#0A1929] mb-3 truncate">{item.name}</h3>

                                <div className="flex justify-between items-end">
                                    <div>
                                        <div className="text-xs text-slate-400">Stock</div>
                                        <div className="text-xl font-bold flex items-baseline gap-1">
                                            {item.stock} <span className="text-xs text-slate-400 font-normal">/ {item.total}</span>
                                        </div>
                                    </div>
                                    <div className="flex bg-slate-100 rounded-lg p-1">
                                        <button
                                            onClick={() => handleAdjustStock(item.id, -1)}
                                            className="w-8 h-8 flex items-center justify-center text-slate-500 hover:bg-white hover:shadow-sm rounded-md transition-all"
                                        >
                                            <Minus size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleAdjustStock(item.id, 1)}
                                            className="w-8 h-8 flex items-center justify-center text-blue-600 hover:bg-white hover:shadow-sm rounded-md transition-all"
                                        >
                                            <Plus size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <div className="p-8 text-center text-slate-400">
                        Vista de lista simplificada (Cambiar a Grid para acciones)
                    </div>
                </div>
            )}
        </div>
    );
};

export default InventoryScreen;
