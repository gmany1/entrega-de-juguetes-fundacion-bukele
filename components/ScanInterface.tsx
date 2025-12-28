import React, { useEffect, useState, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Check, X, QrCode, Loader2, UserCheck, Wifi, WifiOff, RefreshCw, DownloadCloud, Utensils, Music } from 'lucide-react';
import { GuestGroup, Companion } from '../types';
import { useOfflineSync } from '../hooks/useOfflineSync';

const ScanInterface: React.FC = () => {
    // Note: useOfflineSync likely expects generic or old types. 
    // We assume 'whitelist' returns GuestGroups array effectively same struct as before (id, children as companions)
    const { isOffline, whitelist, downloadWhitelist, addToQueue, queue, isSyncing } = useOfflineSync();

    const [scanResult, setScanResult] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const [foundGuest, setFoundGuest] = useState<GuestGroup | null>(null);
    const [foundCompanion, setFoundCompanion] = useState<Companion | null>(null);

    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [permissionGranted, setPermissionGranted] = useState<boolean>(false);

    const scannerRef = useRef<Html5QrcodeScanner | null>(null);

    const requestCameraPermission = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            stream.getTracks().forEach(track => track.stop());
            setPermissionGranted(true);
        } catch (err) {
            console.error("Camera permission denied", err);
            alert("Es necesario permitir el acceso a la cámara.");
        }
    };

    useEffect(() => {
        if (!permissionGranted) return;
        const scannerElement = document.getElementById('reader');
        if (scannerElement && !scannerRef.current && !scanResult) {
            const scanner = new Html5QrcodeScanner(
                "reader",
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                    aspectRatio: 1.0,
                    showTorchButtonIfSupported: true
                },
                false
            );
            scanner.render(onScanSuccess, onScanFailure);
            scannerRef.current = scanner;
        }
        return () => {
            // Cleanup usually handled via scanner.clear() in success
        };
    }, [scanResult, permissionGranted]);

    const onScanSuccess = (decodedText: string, decodedResult: any) => {
        if (scanResult) return;
        if (navigator.vibrate) navigator.vibrate(200);

        if (scannerRef.current) {
            scannerRef.current.clear().catch(console.error);
            scannerRef.current = null;
        }

        setScanResult(decodedText);
        setLoading(true);
        setError(null);
        setSuccessMessage(null);

        try {
            const data = JSON.parse(decodedText);
            // Expected: { groupId, companionId, code } OR { parentId, childId ... legacy }
            const gId = data.groupId || data.parentId;
            const cId = data.companionId || data.childId;
            const code = data.code || data.invite || data.ticketCode;

            if (!gId) throw new Error("QR Incompleto");

            processTicket(gId, cId, code);

        } catch (e) {
            console.error(e);
            setError("QR inválido o formato desconocido.");
            setLoading(false);
        }
    };

    const processTicket = (groupId: string, companionId: string | undefined, code: string | undefined) => {
        // Find Group
        let group = (whitelist as unknown as GuestGroup[]).find(g => g.id === groupId);

        // Fallback: search by code if ID not found directly (maybe legacy ID mismatch)
        if (!group && code) {
            group = (whitelist as unknown as GuestGroup[]).find(g => g.companions?.some(c => c.ticketCode === code));
        }

        if (!group) {
            setError("Invitado no encontrado en la lista offline. Actualiza la lista.");
            setLoading(false);
            return;
        }

        setFoundGuest(group);

        // Find Companion
        let comp: Companion | undefined;
        if (companionId) {
            comp = group.companions?.find(c => c.id === companionId);
        }
        if (!comp && code) {
            comp = group.companions?.find(c => c.ticketCode === code);
        }

        // If no companion found but group exists, maybe single ticket?
        if (!comp && group.companions?.length === 1) {
            comp = group.companions[0];
        }

        if (comp) {
            // Check status in Queue (Optimistic check)
            const queued = queue.some(q => q.parentId === group!.id && q.childId === comp!.id);
            if (queued) {
                comp = { ...comp, status: 'checked_in' };
            }
            setFoundCompanion(comp);
            setLoading(false);
        } else {
            setError("Grupo encontrado, pero boleto específico no válido.");
            setLoading(false);
        }
    };

    const handleCheckIn = () => {
        if (!foundGuest || !foundCompanion) return;
        setLoading(true);

        // Optimistic
        addToQueue(foundGuest.id, foundCompanion.id);

        setSuccessMessage(`¡Bienvenido/a ${foundCompanion.fullName}!`);

        // Update local state visually
        setFoundCompanion({ ...foundCompanion, status: 'checked_in', checkedInAt: new Date().toISOString() });
        setLoading(false);
    };

    const onScanFailure = (err: any) => { };

    const resetScan = () => {
        setScanResult(null);
        setFoundGuest(null);
        setFoundCompanion(null);
        setError(null);
        setSuccessMessage(null);
    };

    return (
        <div className="flex flex-col items-center justify-center w-full max-w-lg mx-auto">
            {/* Offline Bar */}
            <div className="w-full bg-white rounded-sm p-3 mb-6 flex items-center justify-between shadow-sm border border-slate-200">
                <div className="flex items-center gap-3">
                    {isOffline ? (
                        <div className="flex items-center gap-2 text-orange-600 font-bold text-xs uppercase tracking-wider">
                            <WifiOff size={14} /> Offline
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 text-green-600 font-bold text-xs uppercase tracking-wider">
                            <Wifi size={14} /> Online
                        </div>
                    )}
                    <span className="text-xs text-slate-300">|</span>
                    <span className="text-xs text-slate-500 font-serif italic">
                        {(whitelist as any[]).length} Grupos Cargados
                    </span>
                </div>
                <div className="flex gap-2">
                    {queue.length > 0 && (
                        <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded text-xs font-bold animate-pulse">
                            {queue.length} Cola
                        </span>
                    )}
                    <button onClick={downloadWhitelist} disabled={isSyncing} className="p-1.5 hover:bg-slate-50 border rounded-sm text-slate-600">
                        {isSyncing ? <Loader2 size={16} className="animate-spin" /> : <DownloadCloud size={16} />}
                    </button>
                </div>
            </div>

            {!permissionGranted ? (
                <div className="w-full bg-white p-10 rounded-sm shadow-xl text-center border-t-4 border-[#c5a059]">
                    <div className="bg-[#1e293b] w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 text-[#c5a059]">
                        <QrCode size={32} />
                    </div>
                    <h3 className="text-xl font-serif text-slate-800 mb-2">Habilitar Cámara</h3>
                    <button onClick={requestCameraPermission} className="bg-[#c5a059] text-white px-6 py-3 rounded-sm uppercase tracking-widest text-sm font-bold shadow-lg hover:bg-[#b08d4b] transition-all">
                        Activar
                    </button>
                </div>
            ) : (!scanResult && (
                <div className="w-full animate-fade-in relative">
                    <div id="reader" className="w-full rounded-sm overflow-hidden border-2 border-[#e6cfa3]"></div>
                    <div className="absolute top-0 left-0 w-full h-full pointer-events-none flex items-center justify-center">
                        <div className="w-64 h-64 border-2 border-white/50 rounded-lg"></div>
                    </div>
                </div>
            ))}

            {loading && <div className="p-10"><Loader2 className="w-10 h-10 animate-spin text-[#c5a059]" /></div>}

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-800 p-6 rounded-sm w-full mb-6 text-center">
                    <X className="w-8 h-8 mx-auto mb-2 text-red-500" />
                    <p className="font-bold">{error}</p>
                    <button onClick={resetScan} className="mt-4 text-sm underline">Intentar de nuevo</button>
                </div>
            )}

            {foundGuest && foundCompanion && !loading && !error && (
                <div className="bg-white rounded-sm shadow-2xl w-full border-t-4 border-[#c5a059] overflow-hidden animate-fade-in">
                    <div className="p-6 text-center">
                        <div className="inline-block px-3 py-1 bg-slate-100 rounded-full text-[10px] uppercase tracking-widest text-slate-500 mb-4">
                            {foundCompanion.ticketCode}
                        </div>

                        <h2 className="text-3xl font-serif text-slate-800 mb-2">{foundCompanion.fullName}</h2>
                        <p className="text-slate-500 text-sm mb-6">Grupo de {foundGuest.primaryGuestName}</p>

                        <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-6 mb-6">
                            <div>
                                <div className="text-[10px] uppercase tracking-widest text-slate-400 mb-1">Mesa</div>
                                <div className="font-serif text-xl text-[#1e293b]">{foundGuest.tableAssignment || "Sin Asignar"}</div>
                            </div>
                            <div>
                                <div className="text-[10px] uppercase tracking-widest text-slate-400 mb-1">Platillo</div>
                                <div className="font-serif text-xl text-[#1e293b] flex items-center justify-center gap-2">
                                    <Utensils size={16} className="text-[#c5a059]" />
                                    {foundCompanion.mealPreference || "Estándar"}
                                </div>
                            </div>
                        </div>

                        {foundCompanion.status === 'checked_in' ? (
                            <div className="bg-green-50 text-green-800 p-4 rounded-sm border border-green-200 font-bold flex items-center justify-center gap-2">
                                <Check size={20} /> YA INGRESÓ
                            </div>
                        ) : (
                            <button
                                onClick={handleCheckIn}
                                className="w-full bg-[#1e293b] text-white py-4 rounded-sm uppercase tracking-widest font-bold hover:bg-[#0f172a] shadow-lg flex items-center justify-center gap-2"
                            >
                                <UserCheck /> Marcar Ingreso
                            </button>
                        )}

                        <button onClick={resetScan} className="mt-6 text-slate-400 text-sm hover:text-slate-600">
                            Escanear Siguiente
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ScanInterface;
