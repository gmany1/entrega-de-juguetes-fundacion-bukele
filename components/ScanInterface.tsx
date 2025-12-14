
import React, { useEffect, useState, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Check, X, QrCode, Loader2, PackageCheck } from 'lucide-react';
import { Registration, Child } from '../types';
import { getRegistrationById, updateChildStatus } from '../services/storageService';

const ScanInterface: React.FC = () => {
    const [scanResult, setScanResult] = useState<string | null>(null);
    const [scannedData, setScannedData] = useState<any | null>(null);
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
        if (scannerElement && !scannerRef.current) {
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
            if (scannerRef.current) {
                scannerRef.current.clear().catch(console.error);
                scannerRef.current = null;
            }
        };
    }, []);

    const onScanSuccess = (decodedText: string, decodedResult: any) => {
        // Handle double verify
        if (scanResult === decodedText) return;

        console.log("Scan success:", decodedText);

        // Haptic Feedback
        if (navigator.vibrate) {
            navigator.vibrate(200);
        }

        // CRITICAL FIX: Stop the scanner BEFORE React removes the div
        if (scannerRef.current) {
            scannerRef.current.clear().catch(console.error);
        }

        setScanResult(decodedText);
        setLoading(true);
        setError(null);
        setSuccessMessage(null);

        try {
            const data = JSON.parse(decodedText);
            setScannedData(data);

            // Validate Structure
            if (!data.parentId || !data.childId) {
                throw new Error("Formato QR incorrecto.");
            }

            fetchData(data.parentId, data.childId);

        } catch (e) {
            console.error("QR Parse Error", e);
            setError("QR inválido. Intenta acercar más la cámara.");
            setLoading(false);
        }
    };

    const onScanFailure = (error: any) => {
        // console.warn(`Code scan error = ${error}`);
    };

    const fetchData = async (parentId: string, childId: string) => {
        try {
            const reg = await getRegistrationById(parentId);
            if (!reg) {
                setError("Registro de padre no encontrado en base de datos.");
                setLoading(false);
                return;
            }

            setParentData(reg);

            if (!reg.children || !Array.isArray(reg.children)) {
                throw new Error("El registro no contiene datos de niños válidos.");
            }

            const childIndex = reg.children.findIndex(c => c.id === childId);
            if (childIndex === -1) {
                setError("Niño no encontrado en este registro.");
                setLoading(false);
                return;
            }

            setChildValues(reg.children[childIndex]);
            setLoading(false);

        } catch (e: any) {
            console.error("Fetch error", e);
            const msg = e.code ? `Error Code: ${e.code}` : (e.message || "Error desconocido");
            setError(`Error de conexión: ${msg}`);
            setLoading(false);
        }
    };

    const handleDeliver = async () => {
        if (!parentData || !childValues) return;

        setLoading(true);
        const result = await updateChildStatus(parentData.id, childValues.id, 'delivered', new Date().toISOString());

        if (result.success) {
            setSuccessMessage(`¡Juguete entregado a ${childValues.fullName || 'Niño'}!`);
            // Update local state to reflect change immediately
            setChildValues({ ...childValues, status: 'delivered', deliveredAt: new Date().toISOString() });
        } else {
            setError("Error al guardar la entrega. Intente de nuevo.");
        }
        setLoading(false);
    };

    const resetScan = () => {
        setScanResult(null);
        setScannedData(null);
        setChildValues(null);
        setParentData(null);
        setError(null);
        setSuccessMessage(null);

        // Re-initialize scanner with a slight delay to allow DOM to render
        setTimeout(() => {
            const scannerElement = document.getElementById('reader');
            if (scannerElement) {
                const scanner = new Html5QrcodeScanner(
                    "reader",
                    {
                        fps: 10,
                        qrbox: { width: 300, height: 300 },
                        aspectRatio: 1.0,
                        showTorchButtonIfSupported: true
                    },
                    false
                );
                scanner.render(onScanSuccess, onScanFailure);
                scannerRef.current = scanner;
            }
        }, 100);
    };

    return (
        <div className="flex flex-col items-center justify-center w-full max-w-2xl mx-auto">
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
                    <p className="text-slate-600 font-medium">Verificando...</p>
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
                            <h3 className="text-lg font-bold text-red-800">Error de Validación</h3>
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
                    <div className={`p-8 text-center flex flex-col items-center justify-center ${childValues.status === 'delivered' ? 'bg-orange-500 text-white' : 'bg-green-600 text-white'}`}>
                        {childValues.status === 'delivered' ? (
                            <>
                                <PackageCheck className="w-16 h-16 mb-2 opacity-90" />
                                <h2 className="text-3xl font-black uppercase tracking-wider">YA ENTREGADO</h2>
                                <p className="text-white/80 font-medium mt-1">Este ticket ya fue canjeado</p>
                            </>
                        ) : (
                            <>
                                <Check className="w-16 h-16 mb-2 opacity-90" />
                                <h2 className="text-4xl font-black uppercase tracking-wider">VALIDADO</h2>
                                <p className="text-white/80 font-medium mt-1">Ticket Correcto</p>
                            </>
                        )}
                    </div>

                    {/* Essential Info */}
                    <div className="p-6 text-center space-y-6">

                        {/* Invitation Number */}
                        <div>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-1">Número de Invitación</p>
                            <div className="text-5xl font-black text-slate-800 font-mono tracking-tighter">
                                {childValues.inviteNumber}
                            </div>
                        </div>

                        {/* Responsible Name */}
                        <div className="border-t border-slate-100 pt-4">
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-1">Responsable</p>
                            <div className="text-xl font-bold text-slate-700 leading-tight">
                                {parentData.parentName || parentData.fullName}
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="pt-2">
                            {childValues.status !== 'delivered' && !successMessage ? (
                                <button
                                    onClick={handleDeliver}
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-xl text-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 transform active:scale-[0.98]"
                                >
                                    <PackageCheck className="w-6 h-6" />
                                    ENTREGAR JUGUETE
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
