import React, { useState } from 'react';
import { Plus, Phone, Mail, Trash2 } from 'lucide-react';

interface Vendor {
    id: string;
    name: string;
    category: string;
    contactName: string;
    phone: string;
    email: string;
    status: 'active' | 'pending';
}

const VendorDashboard: React.FC = () => {
    // Mock Data
    const [vendors, setVendors] = useState<Vendor[]>([
        { id: '1', name: 'Banquetes El Cielo', category: 'Catering', contactName: 'Roberto Gomez', phone: '555-0101', email: 'roberto@elcielo.com', status: 'active' },
        { id: '2', name: 'Flores y Detalles', category: 'Decoración', contactName: 'Ana Martinez', phone: '555-0102', email: 'ana@flores.com', status: 'active' },
        { id: '3', name: 'DJ Party Mix', category: 'Música', contactName: 'Carlos Ruiz', phone: '555-0103', email: 'carlos@dj.com', status: 'pending' },
    ]);

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Proveedores</h2>
                    <p className="text-slate-500">Gestión de contactos y servicios externos.</p>
                </div>
                <button className="flex items-center gap-2 bg-[#1e293b] text-white px-4 py-2 rounded-lg font-bold hover:bg-[#2e3b4e] transition-colors">
                    <Plus size={18} /> Nuevo Proveedor
                </button>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {vendors.map(vendor => (
                    <div key={vendor.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-4">
                            <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-bold uppercase tracking-wide">
                                {vendor.category}
                            </span>
                            <div className={`w-2 h-2 rounded-full ${vendor.status === 'active' ? 'bg-green-500' : 'bg-orange-500'}`} />
                        </div>

                        <h3 className="font-bold text-lg text-slate-800 mb-1">{vendor.name}</h3>
                        <p className="text-sm text-slate-500 mb-4">Contacto: {vendor.contactName}</p>

                        <div className="space-y-2 pt-4 border-t border-slate-100">
                            <a href={`tel:${vendor.phone}`} className="flex items-center gap-3 text-slate-600 hover:text-[#c5a059] transition-colors text-sm">
                                <Phone size={16} /> {vendor.phone}
                            </a>
                            <a href={`mailto:${vendor.email}`} className="flex items-center gap-3 text-slate-600 hover:text-[#c5a059] transition-colors text-sm">
                                <Mail size={16} /> {vendor.email}
                            </a>
                        </div>

                        <div className="mt-4 pt-4 border-t border-slate-100">
                            <a
                                href={`/portal/${vendor.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block w-full text-center bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold py-2 rounded-lg border border-slate-200 transition-colors text-sm"
                            >
                                🔗 Simular Vista de Proveedor
                            </a>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default VendorDashboard;
