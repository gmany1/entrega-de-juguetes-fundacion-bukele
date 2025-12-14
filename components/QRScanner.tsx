import React, { useEffect, useState, useRef } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { getRegistrationById, updateChildStatus } from '../services/storageService';
import { Registration, Child } from '../types';
import { Camera, CheckCircle, AlertTriangle, X, Package, Loader2 } from 'lucide-react';

interface ScannedData {
    parentId: string;
    childId: string;
    invite: string;
    name: string;
}

const QRScanner: React.FC = () => {
    const [scanning, setScanning] = useState(false);
    const [result, setResult] = useState<string | null>(null); // Raw Result
    const [scannedChild, setScannedChild] = useState<Child | null>(null);
    const [parentReg, setParentReg] = useState<Registration | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Using a ref to hold the instance
    const html5QrCodeRef = useRef<Html5Qrcode | null>(null);

    useEffect(() => {
        // Cleanup on unmount
        return () => {
            if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
                html5QrCodeRef.current.stop().catch(err => console.error("Failed to stop scanner", err));
            }
        };
    }, []);

    const startScanner = async () => {
        setScanning(true);
        setError(null);
        setResult(null);
        setScannedChild(null);
        setParentReg(null);
        setSuccessMessage(null);

        try {
            const html5QrCode = new Html5Qrcode("reader");
            html5QrCodeRef.current = html5QrCode;

            const config = { fps: 10, qrbox: { width: 250, height: 250 } };

            await html5QrCode.start(
                { facingMode: "environment" },
                config,
                async (decodedText) => {
                    // Success callback
                    await handleScanSuccess(decodedText);
                    // Stop scanning after success? User can restart.
                    html5QrCode.stop().then(() => {
                        html5QrCode.clear();
                        setScanning(false);
                    }).catch(console.error);
                },
                (errorMessage) => {
                    // parse error, ignore per frame
                }
            );
        } catch (err) {
            console.error(err);
            setError("No se pudo acceder a la cámara. Asegúrate de dar permisos.");
            setScanning(false);
        }
    };

    const handleScanSuccess = async (text: string) => {
        setResult(text);
        setLoading(true);
        try {
            // Attempt to parse JSON
            let data: ScannedData;
            try {
                data = JSON.parse(text);
            } catch (e) {
                throw new Error("Código QR no válido (Formato incorrecto)");
            }

            if (!data.parentId || !data.childId) {
                throw new Error("Datos del QR incompletos");
            }

            // Fetch Registration
            const reg = await getRegistrationById(data.parentId);
            if (!reg) {
                throw new Error("Registro no encontrado en la base de datos");
            }

            // Find Child
            const childResult = reg.children?.find(c => c.id === data.childId);
            if (!childResult) {
                // Fallback attempt by invite number if childId fails? 
                // No, stick to ID for security.
                throw new Error("Niño no encontrado en este registro");
            }

            setParentReg(reg);
            setScannedChild(childResult);

        } catch (err: any) {
            setError(err.message || "Error al procesar el código");
        } finally {
            setLoading(false);
        }
    };

    const handleDeliver = async () => {
        if (!parentReg || !scannedChild) return;

        setLoading(true);
        try {
            const result = await updateChildStatus(
                parentReg.id,
                scannedChild.id,
                'delivered',
                new Date().toISOString()
            );

            if (result.success) {
                setSuccessMessage(`¡Entrega registrada para ${scannedChild.fullName}!`);
                setScannedChild({ ...scannedChild, status: 'delivered', deliveredAt: new Date().toISOString() });
            } else {
                setError(result.message || "Error al actualizar estado");
            }
        } catch (e) {
            setError("Error de conexión al entregar");
        } finally {
            setLoading(false);
        }
    };

    const resetScanner = () => {
        setResult(null);
        setScannedChild(null);
        setParentReg(null);
        setError(null);
        setSuccessMessage(null);
        startScanner();
    };

    return (
        <div className="flex flex-col items-center justify-center w-full max-w-md mx-auto p-4">

            {!scanning && !scannedChild && !error && (
                <div className="text-center py-10 space-y-6">
                    <div className="bg-blue-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto text-blue-600">
                        <Camera size={40} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">Escanear Código QR</h2>
                        <p className="text-slate-500 mt-2">Utiliza la cámara para validar la entrega.</p>
                    </div>
                    <button
                        onClick={startScanner}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-full shadow-lg transition-transform active:scale-95 flex items-center gap-2 mx-auto"
                    >
                        <Camera size={20} />
                        Iniciar Escáner
                    </button>
                </div>
            )}

            {/* Error View */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center w-full animate-fade-in">
                    <div className="bg-red-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto text-red-600 mb-4">
                        <AlertTriangle size={24} />
                    </div>
                    <h3 className="text-lg font-bold text-red-800 mb-2">Error</h3>
                    <p className="text-red-600 mb-6">{error}</p>
                    <button
                        onClick={startScanner}
                        className="bg-slate-800 text-white px-6 py-2 rounded-lg font-medium hover:bg-black transition-colors"
                    >
                        Intentar de Nuevo
                    </button>
                </div>
            )}

            {/* Camera View */}
            <div id="reader" className={`w-full overflow-hidden rounded-xl bg-black ${!scanning ? 'hidden' : 'block'}`}></div>

            {/* Loading Indicator */}
            {loading && scanning && (
                <div className="text-center mt-4 text-slate-500 animate-pulse">Procesando...</div>
            )}

            {/* Result / Action View */}
            {scannedChild && parentReg && !scanning && (
                <div className="w-full bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden animate-fade-in">
                    {/* Header Status */}
                    <div className={`p-4 text-center ${scannedChild.status === 'delivered' || successMessage ? 'bg-green-100 text-green-800' : 'bg-blue-50 text-blue-800'}`}>
                        {(scannedChild.status === 'delivered' || successMessage) ? (
                            <div className="flex flex-col items-center">
                                <CheckCircle size={32} className="mb-2 text-green-600" />
                                <span className="font-bold text-lg">ENTREGADO</span>
                                {scannedChild.deliveredAt && (
                                    <span className="text-xs opacity-75">
                                        {new Date(scannedChild.deliveredAt).toLocaleString()}
                                    </span>
                                )}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center">
                                <Package size={32} className="mb-2 text-blue-600" />
                                <span className="font-bold text-lg">DISPONIBLE PARA ENTREGA</span>
                            </div>
                        )}
                    </div>

                    <div className="p-6 space-y-4">
                        {/* Child Details */}
                        <div className="space-y-1 text-center border-b border-slate-100 pb-4">
                            <h3 className="text-2xl font-bold text-slate-800">{scannedChild.fullName}</h3>
                            <p className="text-slate-500">{scannedChild.age} años • {scannedChild.gender}</p>
                            <div className="inline-block bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-sm font-mono mt-2">
                                Ticket: {scannedChild.inviteNumber}
                            </div>
                        </div>

                        {/* Parent Details */}
                        <div className="bg-slate-50 p-4 rounded-lg space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-slate-500">Responsable:</span>
                                <span className="font-medium text-slate-900 text-right">{parentReg.parentName || parentReg.fullName}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">WhatsApp:</span>
                                <span className="font-medium text-slate-900">{parentReg.whatsapp}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Municipio:</span>
                                <span className="font-medium text-slate-900">{parentReg.department} - {parentReg.municipality}</span>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="pt-2 flex flex-col gap-3">
                            {scannedChild.status !== 'delivered' && !successMessage && (
                                <button
                                    onClick={handleDeliver}
                                    disabled={loading}
                                    className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl shadow-lg transition-transform active:scale-[0.98] flex items-center justify-center gap-2"
                                >
                                    {loading ? <Loader2 className="animate-spin" /> : <CheckCircle />}
                                    CONFIRMAR ENTREGA
                                </button>
                            )}

                            <button
                                onClick={resetScanner}
                                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-3 rounded-xl transition-colors"
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

export default QRScanner;
