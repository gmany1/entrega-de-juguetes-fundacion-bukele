import React, { useState } from 'react';
import { Plus, CheckCircle2, ShieldCheck, FileText, Trash2 } from 'lucide-react';
import DTEGenerator from './DTEGenerator';

const QuoteScreen: React.FC = () => {
    const [showGenerator, setShowGenerator] = useState(false);
    const [converted, setConverted] = useState(false);

    // State for dynamic items
    const [items, setItems] = useState([
        { name: 'Catering Premium (100 pax)', price: 500.00 },
        { name: 'Sistema de Audio Bose L1', price: 300.00 },
    ]);

    const subtotal = items.reduce((acc, item) => acc + item.price, 0);
    const iva = subtotal * 0.13;
    const total = subtotal + iva;

    const handleConvert = () => {
        setShowGenerator(true);
    };

    const handleDteSuccess = () => {
        setConverted(true);
        setShowGenerator(false);
    };

    const handleAddItem = () => {
        // Simple implementation for rapid prototyping
        const name = prompt("Nombre del servicio:");
        if (!name) return;
        const priceStr = prompt("Precio ($):");
        if (!priceStr) return;
        const price = parseFloat(priceStr);
        if (isNaN(price)) return;

        setItems([...items, { name, price }]);
    };

    const handleDeleteItem = (index: number) => {
        if (confirm('¿Eliminar este servicio?')) {
            const newItems = [...items];
            newItems.splice(index, 1);
            setItems(newItems);
        }
    };

    return (
        <div className="max-w-md mx-auto relative min-h-[80vh]">
            {showGenerator && (
                <DTEGenerator
                    onClose={() => setShowGenerator(false)}
                    onSuccess={handleDteSuccess}
                />
            )}

            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Nueva Cotización</h1>
                <span className="text-xs font-mono text-slate-400">#COT-2025-001</span>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative">

                {/* Header */}
                <div className="p-6 border-b border-slate-100 bg-[#f8fafc]">
                    <div className="text-sm text-slate-500 uppercase tracking-wide font-bold mb-1">Cliente</div>
                    <div className="font-bold text-lg text-slate-800">Industrias La Constancia</div>
                </div>

                {/* Items */}
                <div className="p-6 space-y-4">
                    <h3 className="font-bold text-sm text-slate-400 uppercase tracking-wider">Servicios</h3>
                    {items.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center text-sm group">
                            <div className="flex items-center gap-2">
                                <span className="font-medium text-slate-700">{item.name}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="font-mono font-bold text-slate-900">${item.price.toFixed(2)}</span>
                                {!converted && (
                                    <button
                                        onClick={() => handleDeleteItem(idx)}
                                        className="text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                    {!converted && (
                        <button
                            onClick={handleAddItem}
                            className="w-full py-3 border border-dashed border-slate-300 rounded-xl text-slate-400 text-sm font-medium hover:bg-slate-50 hover:text-blue-600 hover:border-blue-200 transition-colors flex items-center justify-center gap-2"
                        >
                            <Plus size={16} /> Agregar Servicio
                        </button>
                    )}
                </div>

                {/* Footer Totals */}
                <div className="bg-slate-50 p-6 space-y-3">
                    <div className="flex justify-between text-sm text-slate-500">
                        <span>Subtotal</span>
                        <span>${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm font-bold text-slate-800 bg-yellow-50 p-2 rounded-lg -mx-2">
                        <span>IVA (13%)</span>
                        <span>${iva.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xl font-bold text-blue-900 pt-2 border-t border-slate-200">
                        <span>Total</span>
                        <span>${total.toFixed(2)}</span>
                    </div>
                </div>

                {/* Success Overlay */}
                {converted && (
                    <div className="absolute inset-x-0 bottom-36 mx-4 p-4 bg-white/90 backdrop-blur-sm border border-green-100 shadow-xl rounded-2xl text-center animate-fade-in-up z-10 flex flex-col items-center gap-2">
                        <CheckCircle2 size={48} className="text-green-500" />
                        <div>
                            <h3 className="font-bold text-green-700 text-lg">DTE Generado</h3>
                            <p className="text-xs text-green-600">Firmado y Enviado a Hacienda</p>
                            <p className="text-[10px] text-slate-400 font-mono mt-1">M001-P001-000000045</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Action Area */}
            <div className="fixed bottom-0 left-0 right-0 sm:static p-4 sm:p-0 sm:mt-6 bg-white sm:bg-transparent border-t sm:border-0 border-slate-200">
                {!converted ? (
                    <div className="flex items-center justify-between bg-white p-1 rounded-full border border-slate-200 shadow-lg sm:shadow-none">
                        <span className="pl-6 text-sm font-bold text-slate-500">¿Listo para facturar?</span>
                        <button
                            onClick={handleConvert}
                            className="bg-blue-600 text-white px-6 py-3 rounded-full font-bold shadow-md hover:bg-blue-700 active:scale-95 transition-all flex items-center gap-2"
                        >
                            Convertir a DTE
                        </button>
                    </div>
                ) : (
                    <button className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg">
                        <FileText size={20} /> Ver Factura PDF
                    </button>
                )}
            </div>
        </div>
    );
};

export default QuoteScreen;
