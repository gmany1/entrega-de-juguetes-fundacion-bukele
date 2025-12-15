
import React, { useEffect, useState, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Check, X, QrCode, Loader2, PackageCheck, Wifi, WifiOff, RefreshCw, DownloadCloud } from 'lucide-react';
import { Registration, Child } from '../types';
import { useOfflineSync } from '../hooks/useOfflineSync';

const ScanInterface: React.FC = () => {
    const { isOffline, whitelist, downloadWhitelist, addToQueue, queue, isSyncing } = useOfflineSync();

    const [scanResult, setScanResult] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [childValues, setChildValues] = useState<Child | null>(null);
    const [parentData, setParentData] = useState<Registration | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const scannerRef = useRef<Html5QrcodeScanner | null>(null);

    useEffect(() => {
        // Initialize Scanner
        // Ensure element exists before init
        const scannerElement = document.getElementById('reader');
        if (scannerElement && !scannerRef.current && !scanResult) {
            const scanner = new Html5QrcodeScanner(
                "reader",
                {
                    fps: 10,
                    qrbox: { width: 300, height: 300 }, // Larger box
                    aspectRatio: 1.0,
                    showTorchButtonIfSupported: true
                },
                false
            );

            scanner.render(onScanSuccess, onScanFailure);
            scannerRef.current = scanner;
        }

        return () => {
            // Cleanup handled by success/reset logic manually to avoid double-clear issues
        };
    }, [scanResult]); // Re-init when scanResult is cleared

    const onScanSuccess = (decodedText: string, decodedResult: any) => {
        if (scanResult) return;

        // Haptic Feedback
        if (navigator.vibrate) navigator.vibrate(200);

        // Stop scanner logic
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

            // Validate Structure
            if (!data.parentId || !data.childId) {
                throw new Error("Formato QR incorrecto.");
            }

            verifyTicket(data);

        } catch (e) {
            console.error(e);
            setError("QR inválido o irreconocible.");
            setLoading(false);
        }
    };

    const onScanFailure = (error: any) => {
        // console.warn(`Code scan error = ${error}`);
    };

    const verifyTicket = (qrData: any) => {
        const { parentId, childId, invite } = qrData;

        let localParent: Registration | undefined;
        let foundChild: Child | undefined;

        // STRATEGY 1: Direct ID Match (Fastest)
        localParent = whitelist.find(p => p.id === parentId);

        // STRATEGY 2: Legacy Group ID Fix (Virtual to Real ID)
        if (!localParent && parentId && parentId.startsWith('legacy_group_')) {
            localParent = whitelist.find(p => p.id === childId);
        }

        // STRATEGY 3: Invite Number Lookup (Fallback for Broken IDs)
        if (!localParent && invite) {
            // Check Root Level (Legacy)
            localParent = whitelist.find(p => p.inviteNumber === invite);

            // Check Children Level (Modern)
            if (!localParent) {
                localParent = whitelist.find(p => p.children?.some(c => c.inviteNumber === invite));
            }
        }

        if (localParent) {
            setParentData(localParent);

            // Normalize children for legacy support
            const children = (localParent.children && localParent.children.length > 0)
                ? localParent.children
                : [{
                    fullName: `${localParent.genderSelection || 'Niño/a'} ${localParent.childAge ? `(${localParent.childAge} años)` : ''} (Registro Digital)`,
                    inviteNumber: localParent.inviteNumber || '???',
                    id: 'legacy',
                    age: localParent.childAge || 0,
                    gender: localParent.genderSelection || 'N/A'
                } as any];

            // Resolve Child
            // 1. Try ID match
            foundChild = children.find(c => c.id === childId);

            // 2. Try Invite match (if we found parent via invite, ensure we grab the right child)
            if (!foundChild && invite) {
                foundChild = children.find(c => c.inviteNumber === invite);
            }

            // 3. Fallback for single-child/legacy
            if (!foundChild && (childId === 'legacy' || children.length === 1)) {
                foundChild = children[0];
            }

            if (foundChild) {
                // Check if locally pending
                // Use localParent.id (Real ID) for queue check to ensure consistency
                const isPendingInQueue = queue.some(q => q.parentId === localParent!.id && q.childId === foundChild!.id);
                if (isPendingInQueue) {
                    foundChild = { ...foundChild, status: 'delivered' };
                }

                setChildValues(foundChild);
                setLoading(false);
                return;
            }
        }

        // 2. If not in whitelist, valid error?
        // If we are strictly offline, we can't do anything else.
        if (whitelist.length > 0) {
            setError("Ticket no encontrado en la lista descargada. Actualiza la lista si es reciente.");
            setLoading(false);
            return;
        }

        // 3. Fallback (shouldn't really happen if we enforce download, but for safety)
        setError("Lista de validación vacía. Descarga la lista primero.");
        setLoading(false);
    };

    const handleDeliver = () => {
        if (!parentData || !childValues) return;

        setLoading(true);

        // Optimistic Offline Add
        addToQueue(parentData.id, childValues.id);

        setSuccessMessage(`¡Entrega registrada offline! (${queue.length + 1} pendientes)`);
        setChildValues({ ...childValues, status: 'delivered', deliveredAt: new Date().toISOString() });
        setLoading(false);
    };

    const resetScan = () => {
        setScanResult(null);
        setChildValues(null);
        setParentData(null);
        setError(null);
        setSuccessMessage(null);
        // Effect will re-init scanner
    };

    return (
        <div className="flex flex-col items-center justify-center w-full max-w-2xl mx-auto">

            {/* Offline Status Bar */}
            <div className="w-full bg-slate-100 rounded-lg p-3 mb-4 flex items-center justify-between shadow-inner">
                <div className="flex items-center gap-3">
                    {isOffline ? (
                        <div className="flex items-center gap-2 text-orange-600 font-bold text-sm">
                            <WifiOff size={18} /> Offline
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 text-green-600 font-bold text-sm">
                            <Wifi size={18} /> Online
                        </div>
                    )}
                    <span className="text-xs text-slate-400">|</span>
                    <span className="text-xs text-slate-500 font-medium">Lista: {whitelist.length} regs</span>
                </div>

                <div className="flex gap-2">
                    {queue.length > 0 && (
                        <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded text-xs font-bold border border-orange-200 animate-pulse">
                            {queue.length} Pendientes
                        </span>
                    )}
                    <button
                        onClick={downloadWhitelist}
                        disabled={isSyncing || isOffline}
                        className="p-1.5 bg-white text-slate-600 rounded border hover:bg-slate-50 disabled:opacity-50"
                        title="Descargar Lista"
                    >
                        {isSyncing ? <Loader2 size={16} className="animate-spin" /> : <DownloadCloud size={16} />}
                    </button>
                </div>
            </div>

            {/* Scanner Container */}
            {!scanResult && (
                <div className="w-full">
                    <div id="reader" className="w-full rounded-xl overflow-hidden shadow-sm"></div>
                    <p className="text-center text-slate-500 mt-4 text-sm">Apunta la cámara al código QR de la invitación.</p>
                </div>
            )}

            {/* Loading */}
            {loading && (
                <div className="p-8 flex flex-col items-center animate-fade-in">
                    <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
                    <p className="text-slate-600 font-medium">Procesando...</p>
                </div>
            )}

            {/* Error State */}
            {error && (
                <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-r-lg shadow-sm w-full animate-fade-in mb-6">
                    <div className="flex items-center gap-4">
                        <div className="bg-red-100 p-3 rounded-full">
                            <X className="w-8 h-8 text-red-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-red-800">No Encontrado / Válido</h3>
                            <p className="text-red-700">{error}</p>
                        </div>
                    </div>
                    <button onClick={resetScan} className="mt-4 bg-red-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-red-700 w-full">
                        Escanear Otro
                    </button>
                </div>
            )}

            {/* Result Card */}
            {childValues && parentData && !loading && !error && (
                <div className="bg-white rounded-2xl shadow-xl w-full border border-slate-200 overflow-hidden animate-fade-in max-w-sm mx-auto">

                    {/* Header - Validation Status */}
                    <div className="bg-slate-900 text-white p-4 text-center">
                        <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400">Detalles del Invitado</h2>
                    </div>

                    {/* Status Banner */}
                    <div className={`py-2 text-center text-xs font-bold uppercase tracking-widest ${childValues.status === 'delivered' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
                        {childValues.status === 'delivered' ? '⚠️ YA ENTREGADO' : '✅ TICKET VÁLIDO'}
                    </div>

                    {/* Essential Info */}
                    <div className="p-6 text-center space-y-6">

                        {/* Invitation Number */}
                        <div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Número de Invitación</p>
                            <div className="text-4xl font-black text-slate-800 font-mono tracking-tighter bg-slate-50 py-2 rounded-lg border border-slate-100">
                                {childValues.inviteNumber}
                            </div>
                        </div>

                        {/* Child Info */}
                        <div className="grid grid-cols-2 gap-4 text-left">
                            <div>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Niño/a</p>
                                <div className="font-bold text-slate-700 leading-tight">
                                    {childValues.fullName || "Sin Nombre"}
                                </div>
                                <div className="text-xs text-slate-500 mt-1">{childValues.age} Años • {childValues.gender}</div>
                            </div>
                            <div>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Responsable</p>
                                <div className="font-bold text-slate-700 leading-tight">
                                    {parentData.parentName || parentData.fullName}
                                </div>
                            </div>
                        </div>

                        <div className="pt-2 pb-2">
                            <p className="text-xs font-bold text-red-500 uppercase tracking-widest border border-red-200 bg-red-50 py-1.5 px-3 rounded-md inline-block">
                                Invitación Única e Intransferible
                            </p>
                        </div>

                        {/* Action Buttons */}
                        <div className="pt-2">
                            {childValues.status !== 'delivered' && !successMessage ? (
                                <button
                                    onClick={handleDeliver}
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-xl text-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 transform active:scale-[0.98]"
                                >
                                    <PackageCheck className="w-6 h-6" />
                                    ENTREGAR (OFFLINE)
                                </button>
                            ) : (
                                <div className="bg-slate-100 text-slate-500 py-3 rounded-xl font-bold border border-slate-200">
                                    {successMessage || "Ticket Procesado"}
                                </div>
                            )}

                            <button
                                onClick={resetScan}
                                className="mt-3 w-full text-slate-400 hover:text-slate-600 font-medium py-3 rounded-xl transition-colors text-sm hover:underline"
                            >
                                Escanear Siguiente
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ScanInterface;
