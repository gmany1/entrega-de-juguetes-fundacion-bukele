import React, { useState } from 'react';
import { DownloadCloud, CheckCircle, Clock, AlertTriangle, FileText, ChevronRight, CreditCard, Link } from 'lucide-react';
import PaymentGateway from './PaymentGateway';

const FiscalComplianceScreen: React.FC = () => {
    const [showPayment, setShowPayment] = useState(false);
    const [selectedTx, setSelectedTx] = useState<any>(null);
    const [transactions, setTransactions] = useState([
        { id: 'M001-450', date: 'Oct 24', status: 'pending', amount: 450.00, type: 'factura', client: 'Banco Cuscatlán' },
        { id: 'M001-449', date: 'Oct 23', status: 'ready', amount: 1250.00, type: 'ccf', client: 'Industrias La Constancia' },
        { id: 'M001-448', date: 'Oct 22', status: 'pending', amount: 800.00, type: 'factura', client: 'Boda Andrea & Jorge' },
        { id: 'M001-447', date: 'Oct 21', status: 'ready', amount: 3200.00, type: 'ccf', client: 'TechSummit SV' },
        { id: 'M001-446', date: 'Oct 20', status: 'ready', amount: 150.00, type: 'factura', client: 'Cumpleaños Infantil' },
    ]);

    // Mock Discrepancy Logic
    // Mock Discrepancy Logic
    // DYNAMIC VAT CALCULATION: Sum 13% of all 'ready' (signed/paid) transactions
    const recordedVat = transactions
        .filter(t => t.status === 'ready')
        .reduce((sum, t) => sum + (t.amount * 0.13), 0);

    const calculatedVat = 1450.00; // This would come from the expense ledger in a real app

    // Check match with a small tolerance for floating point math
    const isMatched = Math.abs(recordedVat - calculatedVat) < 0.01;

    const handlePayClick = (tx: any) => {
        setSelectedTx(tx);
        setShowPayment(true);
    };

    const handlePaymentComplete = () => {
        // Auto-Conciliation Logic: Update status to 'ready' (Paid)
        if (selectedTx) {
            setTransactions(prev => prev.map(t =>
                t.id === selectedTx.id ? { ...t, status: 'ready' } : t
            ));
        }
        setShowPayment(false);
        setSelectedTx(null);
    };

    return (
        <div className="max-w-md mx-auto h-[85vh] flex flex-col relative">

            {showPayment && selectedTx && (
                <PaymentGateway
                    amount={selectedTx.amount}
                    description={`Pago de Factura ${selectedTx.id} - ${selectedTx.client}`}
                    onClose={() => setShowPayment(false)}
                    onPaymentComplete={handlePaymentComplete}
                />
            )}

            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Cumplimiento Fiscal</h1>
                <span className="text-xs bg-green-100 text-green-700 font-bold px-2 py-1 rounded-lg">Online</span>
            </div>

            {/* Tax Health Dashboard */}
            <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-lg mb-6 relative overflow-hidden">
                <div className="relative z-10">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Salud Fiscal (Octubre)</div>
                    <div className="flex items-end gap-2 mb-4">
                        <span className="text-3xl font-serif font-bold">$1,450.00</span>
                        <span className="text-sm text-slate-400 mb-1">IVA Débito</span>
                    </div>

                    <div className="bg-white/10 rounded-xl p-3 flex items-center justify-between border border-white/5">
                        <div className="flex items-center gap-2">
                            {isMatched ? <CheckCircle className="text-green-400" size={18} /> : <AlertTriangle className="text-amber-400" size={18} />}
                            <span className="text-sm font-medium">Cuadratura F-07</span>
                        </div>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${isMatched ? 'bg-green-500/20 text-green-300' : 'bg-amber-500/20 text-amber-300'}`}>
                            {isMatched ? 'EXACTO' : 'REVISAR'}
                        </span>
                    </div>
                </div>
                {/* Background Decor */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500 rounded-full blur-3xl opacity-20 -mr-10 -mt-10"></div>
            </div>

            {/* Report Exporters - The "1-Click" Solution */}
            <div className="grid grid-cols-2 gap-3 mb-6">
                <button className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 text-left hover:border-blue-300 transition-colors group">
                    <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 mb-2 group-hover:scale-110 transition-transform">
                        <FileText size={18} />
                    </div>
                    <div className="font-bold text-slate-800 text-sm">Modelo F-14</div>
                    <div className="text-[10px] text-slate-400">IVA Mensual</div>
                </button>

                <button className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 text-left hover:border-purple-300 transition-colors group">
                    <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center text-purple-600 mb-2 group-hover:scale-110 transition-transform">
                        <FileText size={18} />
                    </div>
                    <div className="font-bold text-slate-800 text-sm">Anexo F-987</div>
                    <div className="text-[10px] text-slate-400">Proveedores</div>
                </button>
            </div>

            {/* Transaction List */}
            <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Libro de Ventas</div>
                    <button className="text-blue-600 text-xs font-bold hover:underline">Ver Todo</button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {transactions.map(tx => (
                        <div key={tx.id} className="bg-white border border-slate-100 p-3 rounded-xl shadow-sm flex items-center justify-between hover:bg-slate-50 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold ${tx.type === 'ccf' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                    {tx.type === 'ccf' ? 'CCF' : 'FAC'}
                                </div>
                                <div className="max-w-[120px]">
                                    <div className="font-bold text-slate-800 text-sm truncate" title={tx.client}>{tx.client}</div>
                                    <div className="text-[10px] text-slate-400 font-mono">{tx.date} • {tx.id}</div>
                                </div>
                            </div>

                            <div className="text-right flex flex-col items-end gap-1">
                                <div className="font-bold text-slate-900 text-sm">${tx.amount.toFixed(2)}</div>
                                {tx.status === 'pending' ? (
                                    <button
                                        onClick={() => handlePayClick(tx)}
                                        className="text-[10px] font-bold text-white bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded-full flex items-center gap-1 shadow-sm transition-colors animate-pulse"
                                    >
                                        <Link size={10} /> Copiar Link Pago
                                    </button>
                                ) : (
                                    <span className="text-[10px] font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded flex items-center gap-1">
                                        <CheckCircle size={10} /> Conciliado
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default FiscalComplianceScreen;
