import React, { useState, useEffect } from 'react';
import { FileJson, ShieldCheck, Lock, ChevronRight, AlertTriangle, Check, RefreshCw } from 'lucide-react';

interface DTEGeneratorProps {
    sourceQuote?: any;
    onClose: () => void;
    onSuccess: () => void;
}

const DTEGenerator: React.FC<DTEGeneratorProps> = ({ sourceQuote, onClose, onSuccess }) => {
    const [step, setStep] = useState<'validating' | 'generating' | 'signing' | 'completed'>('validating');
    const [progress, setProgress] = useState(0);
    const [showJson, setShowJson] = useState(false);

    // Mock Correlative State (The "Black Box")
    const [correlative, setCorrelative] = useState('M001-P001-000000045');

    // Simulated Hacienda JSON Structure
    const [dtePayload, setDtePayload] = useState<any>(null);

    useEffect(() => {
        if (step === 'validating') {
            const timer = setInterval(() => {
                setProgress(prev => {
                    if (prev >= 100) {
                        clearInterval(timer);
                        setStep('generating');
                        return 0;
                    }
                    return prev + 5;
                });
            }, 50);
            return () => clearInterval(timer);
        }

        if (step === 'generating') {
            // Construct the JSON
            const payload = {
                identificacion: {
                    version: 3,
                    ambiente: "00", // Pruebas
                    tipoDte: "01", // Factura
                    numeroControl: correlative,
                    codigoGeneracion: "D5634003-8C85-4874-B326-B81014CD7F36",
                    fecEmi: new Date().toISOString().split('T')[0],
                    horEmi: new Date().toLocaleTimeString(),
                },
                emisor: {
                    nit: "06142803901121",
                    nombre: "EVENTOS SV, S.A. DE C.V.",
                    establecimiento: "001"
                },
                receptor: {
                    nombre: "INDUSTRIAS LA CONSTANCIA, S.A. DE C.V.",
                    nit: "06142010750015"
                },
                cuerpoDocumento: [
                    { numItem: 1, descripcion: "Catering Premium (100 pax)", precioUni: 500.00, montoDescu: 0, ventaGravada: 500.00 },
                    { numItem: 2, descripcion: "Sistema de Audio Bose L1", precioUni: 300.00, montoDescu: 0, ventaGravada: 300.00 }
                ],
                resumen: {
                    totalGravada: 800.00,
                    totalIva: 104.00,
                    montoTotalOperacion: 904.00
                }
            };
            setDtePayload(payload);

            setTimeout(() => setStep('signing'), 1500);
        }

        if (step === 'signing') {
            // Simulate Digital Signature delay
            setTimeout(() => setStep('completed'), 2000);
        }

    }, [step]);

    const handleDownload = () => {
        onSuccess();
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="bg-[#0A1929] px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center border border-green-500/50">
                            <ShieldCheck className="text-green-400" size={18} />
                        </div>
                        <div>
                            <h2 className="text-white font-bold">Motor de Facturación</h2>
                            <p className="text-xs text-slate-400 flex items-center gap-1">
                                <Lock size={10} /> Encriptado SHA-256 • Ministerio de Hacienda
                            </p>
                        </div>
                    </div>
                    {step === 'completed' && (
                        <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
                    )}
                </div>

                {/* Body */}
                <div className="p-8 flex-1 overflow-y-auto">

                    {/* Stage Visualization */}
                    <div className="mb-10">
                        <div className="flex items-center justify-between relative">
                            {/* Connecting Line */}
                            <div className="absolute left-0 top-1/2 w-full h-1 bg-slate-100 -z-0"></div>

                            {/* Step 1 */}
                            <div className={`relative z-10 flex flex-col items-center gap-2 ${step === 'validating' ? 'animate-pulse' : ''}`}>
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${['validating', 'generating', 'signing', 'completed'].includes(step) ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-200 text-slate-300'}`}>
                                    1
                                </div>
                                <span className="text-xs font-bold text-slate-600">Validación</span>
                            </div>

                            {/* Step 2 */}
                            <div className={`relative z-10 flex flex-col items-center gap-2 ${step === 'generating' ? 'animate-pulse' : ''}`}>
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${['generating', 'signing', 'completed'].includes(step) ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-200 text-slate-300'}`}>
                                    2
                                </div>
                                <span className="text-xs font-bold text-slate-600">Generación JSON</span>
                            </div>

                            {/* Step 3 */}
                            <div className={`relative z-10 flex flex-col items-center gap-2 ${step === 'signing' ? 'animate-pulse' : ''}`}>
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${['signing', 'completed'].includes(step) ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-200 text-slate-300'}`}>
                                    <ShieldCheck size={18} />
                                </div>
                                <span className="text-xs font-bold text-slate-600">Firma Digital</span>
                            </div>
                        </div>
                    </div>

                    {/* Status Content */}
                    <div className="text-center space-y-4">

                        {step === 'validating' && (
                            <div className="space-y-4">
                                <h3 className="text-lg font-bold text-slate-700">Validando Requisitos Fiscales...</h3>
                                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                    <div className="bg-blue-600 h-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
                                </div>
                                <div className="text-sm text-slate-500 text-left space-y-2 max-w-xs mx-auto">
                                    <div className="flex items-center gap-2"><Check size={14} className="text-green-500" /> NIT Emisor Válido</div>
                                    <div className="flex items-center gap-2"><Check size={14} className="text-green-500" /> NIT Receptor Válido</div>
                                    <div className="flex items-center gap-2"><Check size={14} className="text-green-500" /> Estructura de Ítems Correcta</div>
                                </div>
                            </div>
                        )}

                        {step === 'generating' && (
                            <div className="animate-fade-in">
                                <h3 className="text-lg font-bold text-slate-700 mb-2">Construyendo DTE...</h3>
                                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-left font-mono text-xs text-slate-600 mb-4">
                                    <div className="flex justify-between border-b border-slate-200 pb-2 mb-2">
                                        <span className="font-bold text-slate-400">CORRELATIVO ASIGNADO</span>
                                        <span className="font-bold text-blue-600">{correlative}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="font-bold text-slate-400">CÓDIGO GENERACIÓN</span>
                                        <span className="break-all">D5634003-8C85-4874-B326-B81014CD7F36</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === 'signing' && (
                            <div className="animate-fade-in flex flex-col items-center">
                                <RefreshCw className="animate-spin text-blue-600 mb-4" size={40} />
                                <h3 className="text-lg font-bold text-slate-700">Firmando Documento Digitalmente...</h3>
                                <p className="text-sm text-slate-500">Conectando con Ministerio de Hacienda</p>
                            </div>
                        )}

                        {step === 'completed' && (
                            <div className="animate-fade-in-up">
                                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Check className="text-green-600" size={32} strokeWidth={3} />
                                </div>
                                <h3 className="text-xl font-bold text-[#0A1929] mb-2">¡DTE Generado Exitosamente!</h3>
                                <p className="text-slate-500 text-sm mb-8">El documento ha sido firmado y almacenado en la bóveda digital.</p>

                                <div className="flex gap-3">
                                    <button onClick={handleDownload} className="flex-1 bg-white border border-slate-200 text-slate-700 font-bold py-3 rounded-xl hover:bg-slate-50">
                                        Descargar PDF
                                    </button>
                                    <button onClick={handleDownload} className="flex-1 bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200">
                                        Enviar al Cliente
                                    </button>
                                </div>
                            </div>
                        )}

                    </div>

                    {/* Advanced JSON Toggle */}
                    {(step === 'generating' || step === 'completed') && (
                        <div className="mt-8 border-t border-slate-100 pt-4">
                            <button onClick={() => setShowJson(!showJson)} className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-blue-600 transition-colors">
                                <FileJson size={14} />
                                {showJson ? 'Ocultar Payload JSON' : 'Ver Payload JSON (Modo Avanzado)'}
                            </button>

                            {showJson && dtePayload && (
                                <div className="mt-4 bg-[#1e293b] rounded-xl p-4 overflow-x-auto text-left">
                                    <pre className="text-[10px] text-green-400 font-mono leading-relaxed">
                                        {JSON.stringify(dtePayload, null, 2)}
                                    </pre>
                                </div>
                            )}
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};

export default DTEGenerator;
