import React, { useState } from 'react';
import { Image, Upload, Trash2, Heart, CheckCircle } from 'lucide-react';

const GalleryManager: React.FC = () => {
    // Mock Data
    const [photos, setPhotos] = useState([
        { id: 1, url: 'https://images.unsplash.com/photo-1519741497674-611481863552', caption: 'Ceremonia', status: 'approved' },
        { id: 2, url: 'https://images.unsplash.com/photo-1511285560982-1351cdeb9821', caption: 'Brindis', status: 'approved' },
        { id: 3, url: 'https://images.unsplash.com/photo-1520854221256-17451cc330e7', caption: 'Baile', status: 'pending' },
    ]);

    return (
        <div className="space-y-6 animate-fade-in pb-20">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Galería de Fotos</h2>
                    <p className="text-slate-500">Modera y comparte los recuerdos del evento.</p>
                </div>
                <button className="flex items-center gap-2 bg-[#1e293b] text-white px-4 py-2 rounded-lg font-bold hover:bg-[#2e3b4e] transition-colors">
                    <Upload size={18} /> Subir Fotos
                </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {photos.map(photo => (
                    <div key={photo.id} className="group relative aspect-square bg-slate-100 rounded-lg overflow-hidden border border-slate-200 shadow-sm">
                        <img src={photo.url} alt={photo.caption} className="w-full h-full object-cover transition-transform group-hover:scale-105" />

                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4 translate-y-full group-hover:translate-y-0 transition-transform">
                            <p className="text-white text-sm font-bold mb-2">{photo.caption}</p>
                            <div className="flex gap-2">
                                <button className="p-2 bg-green-500 text-white rounded-full hover:bg-green-600"><CheckCircle size={14} /></button>
                                <button className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600"><Trash2 size={14} /></button>
                            </div>
                        </div>

                        {photo.status === 'pending' && (
                            <div className="absolute top-2 right-2 bg-orange-500 text-white text-xs px-2 py-1 rounded-full font-bold shadow-sm">
                                Pendiente
                            </div>
                        )}
                    </div>
                ))}

                {/* Upload Placeholder */}
                <div className="aspect-square bg-slate-50 rounded-lg border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 hover:border-[#c5a059] hover:text-[#c5a059] cursor-pointer transition-colors">
                    <Image size={32} className="mb-2" />
                    <span className="text-xs font-bold uppercase tracking-wide">Añadir más</span>
                </div>
            </div>
        </div>
    );
};

export default GalleryManager;
