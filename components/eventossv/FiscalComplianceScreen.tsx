import React from 'react';
import { DownloadCloud, CheckCircle, Clock } from 'lucide-react';

const FiscalComplianceScreen: React.FC = () => {
    const transactions = [
        { id: 1023, date: 'Oct 24', status: 'pending', amount: 450.00 },
        { id: 1024, date: 'Oct 23', status: 'ready', amount: 1250.00 },
        { id: 1025, date: 'Oct 22', status: 'pending', amount: 800.00 },
        { id: 1026, date: 'Oct 21', status: 'ready', amount: 3200.00 },
        { id: 1027, date: 'Oct 20', status: 'ready', amount: 150.00 },
    ];

    return (
        <div className="max-w-md mx-auto h-[80vh] flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Cumplimiento Fiscal</h1>
            </div>

            <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                <div className="p-4 border-b border-slate-100 bg-slate-50">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Últimos Movimientos</div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {transactions.map(tx => (
                        <div key={tx.id} className="bg-white border border-slate-100 p-4 rounded-xl shadow-sm flex items-center justify-between">
                            <div>
                                <div className="font-bold text-slate-800">Factura #{tx.id}</div>
                                <div className="text-xs text-slate-400 font-mono mt-1">{tx.date} • ${tx.amount.toFixed(2)}</div>
                            </div>

                            {tx.status === 'pending' ? (
                                <div className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-[10px] font-bold uppercase tracking-wide flex items-center gap-1">
                                    <Clock size={10} /> Pendiente F-14
                                </div>
                            ) : (
                                <div className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-[10px] font-bold uppercase tracking-wide flex items-center gap-1">
                                    <CheckCircle size={10} /> Anexo F-987
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <div className="mt-4">
                <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-200 flex items-center justify-center gap-2 active:scale-95 transition-all">
                    <DownloadCloud size={20} />
                    Exportar CSV para Hacienda
                </button>
            </div>
        </div>
    );
};

export default FiscalComplianceScreen;
