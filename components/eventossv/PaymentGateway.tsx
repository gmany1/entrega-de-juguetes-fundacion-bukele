import React, { useState } from 'react';
import { CreditCard, Lock, CheckCircle, Smartphone, Globe } from 'lucide-react';

interface PaymentGatewayProps {
    amount: number;
    description: string;
    onClose: () => void;
    onPaymentComplete: () => void;
}

const PaymentGateway: React.FC<PaymentGatewayProps> = ({ amount, description, onClose, onPaymentComplete }) => {
    const [status, setStatus] = useState<'details' | 'processing' | 'success'>('details');

    const handlePay = () => {
        setStatus('processing');
        setTimeout(() => {
            setStatus('success');
            setTimeout(() => {
                onPaymentComplete();
            }, 1500);
        }, 2000);
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in">

            {/* Payment Modal Container */}
            <div className="bg-white w-full max-w-md rounded-2xl overflow-hidden shadow-2xl relative">

                {/* Wompi-style Header */}
                <div className="bg-[#2B3467] p-6 text-white text-center relative">
                    <button onClick={onClose} className="absolute top-4 right-4 text-white/50 hover:text-white">✕</button>
                    <div className="font-bold text-2xl tracking-tight mb-1">Wompi</div>
                    <p className="text-xs text-blue-200">Pasarela de Pagos Segura</p>
                </div>

                {/* Content */}
                <div className="p-8">
                    {status === 'details' && (
                        <div className="space-y-6">
                            <div className="text-center">
                                <p className="text-sm text-slate-500 mb-1">Pago por servicos a</p>
                                <h3 className="font-bold text-slate-800">EventosSV, S.A. de C.V.</h3>
                                <div className="mt-4 text-3xl font-bold text-[#2B3467]">${amount.toFixed(2)}</div>
                                <p className="text-xs text-slate-400 mt-1">{description}</p>
                            </div>

                            <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handlePay(); }}>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Número de Tarjeta</label>
                                    <div className="relative">
                                        <CreditCard className="absolute left-3 top-3 text-slate-400" size={18} />
                                        <input type="text" placeholder="0000 0000 0000 0000" className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2B3467]" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Fecha Exp.</label>
                                        <input type="text" placeholder="MM/YY" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2B3467]" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">CVC</label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-3 text-slate-400" size={14} />
                                            <input type="text" placeholder="123" className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2B3467]" />
                                        </div>
                                    </div>
                                </div>

                                <button type="submit" className="w-full bg-[#EB0029] hover:bg-[#C90023] text-white font-bold py-3.5 rounded-xl shadow-lg shadow-red-900/20 transition-all active:scale-95 flex items-center justify-center gap-2">
                                    <CreditCard size={18} /> Pagar Ahora
                                </button>
                            </form>

                            <div className="flex items-center justify-center gap-4 text-xs text-slate-400 pt-2">
                                <span className="flex items-center gap-1"><Lock size={10} /> Encriptado SSL</span>
                                <span className="flex items-center gap-1"><Globe size={10} /> Visa/Mastercard</span>
                            </div>
                        </div>
                    )}

                    {status === 'processing' && (
                        <div className="py-12 text-center space-y-4">
                            <div className="w-16 h-16 border-4 border-[#2B3467] border-t-transparent rounded-full animate-spin mx-auto"></div>
                            <h3 className="font-bold text-slate-800">Procesando Pago...</h3>
                            <p className="text-sm text-slate-500">No cierres esta ventana</p>
                        </div>
                    )}

                    {status === 'success' && (
                        <div className="py-8 text-center space-y-4 animate-scale-in">
                            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto text-green-600">
                                <CheckCircle size={40} />
                            </div>
                            <div>
                                <h3 className="font-bold text-2xl text-slate-800 mb-2">¡Pago Exitoso!</h3>
                                <p className="text-slate-500 text-sm">Transacción aprobada: #TX-99821</p>
                            </div>
                            <div className="bg-slate-50 p-4 rounded-xl text-xs text-slate-400">
                                Tu comprobande ha sido enviado a tu correo.
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PaymentGateway;
