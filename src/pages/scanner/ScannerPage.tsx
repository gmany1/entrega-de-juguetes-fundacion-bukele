import React, { useState, useEffect } from 'react';
import { Download, Wifi, WifiOff, Search, Camera, Battery } from 'lucide-react';
import { downloadFullEventData, searchGuestLocal, markTicketScannedLocal, syncPendingScans } from '../../services/OfflineSyncService';
import ScanInterface from '../../../components/ScanInterface'; // Reuse existing if possible, or build new
// Actually, let's build a dedicated robust UI here using the service methods
import { Html5QrcodeScanner } from 'html5-qrcode'; // Direct usage might be better for control
import { GuestGroup } from '../../../types';

const ScannerPage: React.FC = () => {
    const [view, setView] = useState<'scan' | 'search'>('scan');
    const [query, setQuery] = useState('');
    const [searchResults, setSearchResults] = useState<GuestGroup[]>([]);
    const [scanResult, setScanResult] = useState<{ status: 'success' | 'error' | 'idle', message: string, guest?: GuestGroup }>({ status: 'idle', message: '' });
    const [isDownloading, setIsDownloading] = useState(false);
    const [stats, setStats] = useState({ total: 0, checkedIn: 0 });

    useEffect(() => {
        // Initial sync attempt
        syncPendingScans();

        // Interval sync
        const interval = setInterval(() => {
            if (navigator.onLine) syncPendingScans();
        }, 30000);

        return () => clearInterval(interval);
    }, []);

    const handleDownload = async () => {
        setIsDownloading(true);
        const res = await downloadFullEventData();
        if (res.success) {
            alert(`Base de datos actualizada: ${res.count} grupos.`);
        } else {
            alert('Error al descargar datos. Revisa tu conexión.');
        }
        setIsDownloading(false);
    };

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        const res = await searchGuestLocal(query);
        setSearchResults(res);
    };

    const processCode = async (code: string) => {
        const res = await markTicketScannedLocal(code);
        if (res.success) {
            setScanResult({ status: 'success', message: 'Acceso Permitido', guest: res.guest });
            // Audio feedback could go here
        } else {
            setScanResult({ status: 'error', message: res.message || 'Error desconocido' });
        }
    };

    // Quick adapter for the existing ScanInterface or just creating a new one
    // Let's create a minimal One-file scanner here for robustness
    useEffect(() => {
        if (view === 'scan') {
            const scanner = new Html5QrcodeScanner(
                "reader",
                { fps: 10, qrbox: { width: 250, height: 250 } },
                /* verbose= */ false
            );

            scanner.render((decodedText) => {
                scanner.pause();
                processCode(decodedText).then(() => {
                    setTimeout(() => scanner.resume(), 3000);
                });
            }, (error) => {
                // ignore errors
            });

            return () => {
                scanner.clear().catch(err => console.error(err));
            }
        }
    }, [view]);

    return (
        <div className="pb-20">
            {/* Status Bar */}
            <div className="bg-slate-800 text-white p-3 flex justify-between items-center text-xs">
                <div className="flex gap-4">
                    <button onClick={handleDownload} disabled={isDownloading} className="flex items-center gap-1 hover:text-[#c5a059]">
                        <Download size={14} className={isDownloading ? 'animate-bounce' : ''} />
                        {isDownloading ? 'Bajando...' : 'Actualizar DB'}
                    </button>
                    <div className="flex items-center gap-1">
                        {/* Simple stat placeholder */}
                        <span>BD Local: OK</span>
                    </div>
                </div>
            </div>

            {/* Mode Switcher */}
            <div className="flex p-2 bg-slate-900 gap-2">
                <button
                    onClick={() => setView('scan')}
                    className={`flex-1 py-3 rounded text-sm font-bold flex items-center justify-center gap-2 ${view === 'scan' ? 'bg-[#c5a059] text-white' : 'bg-slate-800 text-slate-400'}`}
                >
                    <Camera size={18} /> ESCANEAR
                </button>
                <button
                    onClick={() => setView('search')}
                    className={`flex-1 py-3 rounded text-sm font-bold flex items-center justify-center gap-2 ${view === 'search' ? 'bg-[#c5a059] text-white' : 'bg-slate-800 text-slate-400'}`}
                >
                    <Search size={18} /> BUSCAR
                </button>
            </div>

            {/* Content Area */}
            <div className="p-4">
                {view === 'scan' && (
                    <div className="space-y-4">
                        <div id="reader" className="w-full bg-black rounded-lg overflow-hidden border-2 border-slate-700"></div>

                        {/* Result Card */}
                        {scanResult.status !== 'idle' && (
                            <div className={`p-6 rounded-xl text-center animate-pulse-once ${scanResult.status === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
                                <h1 className="text-3xl font-bold mb-2">{scanResult.status === 'success' ? 'BIENVENIDO' : 'ALERTA'}</h1>
                                <p className="text-xl opacity-90">{scanResult.message}</p>
                                {scanResult.guest && (
                                    <div className="mt-4 pt-4 border-t border-white/20">
                                        <p className="font-bold text-2xl">{scanResult.guest.primaryGuestName}</p>
                                        <p className="text-sm opacity-75">Mesa: {scanResult.guest.tableAssignment || 'Sin Asignar'}</p>
                                    </div>
                                )}
                            </div>
                        )}

                        <p className="text-center text-slate-500 text-sm mt-4">
                            Apunta la cámara al código QR de la invitación.
                        </p>
                    </div>
                )}

                {view === 'search' && (
                    <div className="space-y-4">
                        <form onSubmit={handleSearch} className="flex gap-2">
                            <input
                                type="text"
                                value={query}
                                onChange={e => setQuery(e.target.value)}
                                className="flex-1 bg-slate-800 border-none rounded p-3 text-white placeholder-slate-500"
                                placeholder="Nombre o Ticket..."
                            />
                            <button type="submit" className="bg-[#c5a059] p-3 rounded text-white font-bold">
                                <Search size={20} />
                            </button>
                        </form>

                        <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                            {searchResults.map(guest => (
                                <div key={guest.id} className="bg-slate-800 rounded p-4 border border-slate-700">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h3 className="font-bold text-white">{guest.primaryGuestName}</h3>
                                            <p className="text-xs text-slate-400">Mesa: {guest.tableAssignment}</p>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        {guest.companions.map(comp => (
                                            <div key={comp.ticketCode} className="flex justify-between items-center bg-slate-900/50 p-2 rounded">
                                                <span className="text-sm text-slate-300">{comp.fullName}</span>
                                                {comp.status === 'checked_in' ? (
                                                    <span className="text-xs font-bold text-green-400">ADENTRO</span>
                                                ) : (
                                                    <button
                                                        onClick={() => processCode(comp.ticketCode)}
                                                        className="text-xs bg-blue-600 text-white px-3 py-1 rounded font-bold hover:bg-blue-500"
                                                    >
                                                        INGRESAR
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                            {searchResults.length === 0 && query && (
                                <p className="text-center text-slate-500 py-4">No se encontraron resultados.</p>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default ScannerPage;
