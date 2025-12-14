
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
                { fps: 10, qrbox: { width: 250, height: 250 } },
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

        setScanResult(decodedText);
        setLoading(true);
        setError(null);
        setSuccessMessage(null);

        try {
            const data = JSON.parse(decodedText);
            setScannedData(data);

            // Validate Structure
            if (!data.parentId || !data.childId) {
                throw new Error("Código QR inválido (formato antiguo o incorrecto).");
            }

            fetchData(data.parentId, data.childId);

        } catch (e) {
            console.error(e);
            setError("Código QR no válido o corrupto.");
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

            const childIndex = reg.children.findIndex(c => c.id === childId);
            if (childIndex === -1) {
                setError("Niño no encontrado en este registro.");
                setLoading(false);
                return;
            }

            setChildValues(reg.children[childIndex]);
            setLoading(false);

        } catch (e) {
            setError("Error de conexión al verificar.");
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

        // Re-enable scanner if implementation allows, but Html5QrcodeScanner keeps running usually.
        // If we paused it, we'd resume here.
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
                <div className="bg-white rounded-2xl shadow-xl w-full border border-slate-200 overflow-hidden animate-fade-in">
                    {/* Header Status */}
                    <div className={`p-6 text-center ${childValues.status === 'delivered' ? 'bg-orange-100' : 'bg-green-100'}`}>
                        {childValues.status === 'delivered' ? (
                            <>
                                <div className="inline-flex bg-orange-200 p-3 rounded-full mb-2">
                                    <PackageCheck className="w-8 h-8 text-orange-700" />
                                </div>
                                <h2 className="text-2xl font-black text-orange-800 uppercase tracking-wide">Ya Entregado</h2>
                                <p className="text-orange-700 font-medium">Este código ya fue marcado previamente.</p>
                                <p className="text-xs text-orange-600 mt-1">Fecha: {new Date(childValues.deliveredAt!).toLocaleString()}</p>
                            </>
                        ) : (
                            <>
                                <div className="inline-flex bg-green-200 p-3 rounded-full mb-2">
                                    <Check className="w-8 h-8 text-green-700" />
                                </div>
                                <h2 className="text-2xl font-black text-green-800 uppercase tracking-wide">Válido para Entrega</h2>
                                <p className="text-green-700 font-medium">El código es correcto.</p>
                            </>
                        )}
                    </div>

                    {/* Content */}
                    <div className="p-8 space-y-6">
                        <div className="text-center">
                            <div className="text-sm text-slate-500 uppercase tracking-wide font-bold mb-1">Niño/a Beneficiario</div>
                            <div className="text-3xl font-bold text-slate-900">{childValues.fullName || "Sin Nombre"}</div>
                            <div className="inline-block bg-slate-100 px-4 py-1 rounded-full text-slate-700 font-bold mt-2 border border-slate-200">
                                {childValues.age} Años - {childValues.gender}
                            </div>
                        </div>

                        <div className="border-t border-b border-slate-100 py-4 grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="block text-slate-400 text-xs uppercase">Responsable</span>
                                <span className="font-semibold text-slate-700">{parentData.parentName}</span>
                            </div>
                            <div className="text-right">
                                <span className="block text-slate-400 text-xs uppercase">Invitación</span>
                                <span className="font-mono font-bold text-blue-600 text-lg">{childValues.inviteNumber}</span>
                            </div>
                        </div>

                        {/* Actions */}
                        {childValues.status !== 'delivered' && !successMessage ? (
                            <button
                                onClick={handleDeliver}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-xl text-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 transform active:scale-95"
                            >
                                <PackageCheck className="w-6 h-6" />
                                ENTREGAR JUGUETE
                            </button>
                        ) : (
                            <div className="bg-green-50 text-green-800 p-4 rounded-xl text-center font-bold border border-green-200">
                                {successMessage || "✅ Entrega registrada correctamente"}
                            </div>
                        )}

                        <button
                            onClick={resetScan}
                            className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium py-3 rounded-xl transition-colors"
                        >
                            Escanear Siguiente
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ScanInterface;
