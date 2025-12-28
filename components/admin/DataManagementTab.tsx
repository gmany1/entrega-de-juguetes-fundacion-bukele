import React, { useState } from 'react';
import { useAdmin } from '../../contexts/AdminContext';
import { useConfig } from '../../contexts/ConfigContext';
import { getFullDatabaseDump, restoreDatabaseDump, cleanupOrphanedInvites, clearAllRegistrations } from '../../services/storageService';
import * as XLSX from 'xlsx';
import { Database, Download, ShieldCheck, AlertTriangle, Trash2, Upload, Cloud } from 'lucide-react';

const DataManagementTab: React.FC = () => {
    const { registrations, refreshData } = useAdmin();
    const [isLoading, setIsLoading] = useState(false);
    const [isRestoring, setIsRestoring] = useState(false);

    // Export Logic
    const handleExport = (type: 'xlsx' | 'csv') => {
        if (registrations.length === 0) {
            alert("No hay registros para exportar.");
            return;
        }

        const exportData: any[] = [];
        registrations.forEach(reg => {
            const kids = reg.children && reg.children.length > 0 ? reg.children : [{ fullName: 'Legacy', inviteNumber: reg.inviteNumber, age: reg.childAge, gender: reg.genderSelection, status: 'pending' }];

            kids.forEach((child: any) => {
                exportData.push({
                    "ID": reg.id,
                    "Invitado Principal": reg.primaryGuestName || "N/A",
                    "WhatsApp": reg.whatsapp,
                    "Acompañante": child.fullName,
                    "Boleto": child.ticketCode || child.inviteNumber,
                    "Mesa": reg.tableAssignment || reg.ticketDistributor || "N/A",
                    "Platillo": child.mealPreference || "N/A",
                    "Alergias": reg.dietaryRestrictions || "N/A",
                    "Canción": reg.songRequest || "N/A",
                    "Estado": child.status === 'checked_in' || child.status === 'delivered' ? 'ASISTIÓ' : 'PENDIENTE',
                    "Fecha": reg.timestamp ? new Date(reg.timestamp).toLocaleString('es-SV') : 'N/A'
                });
            });
        });

        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Registros");
        const fileName = `EntregaJuguetes_Registros_${new Date().toISOString().split('T')[0]}`;

        if (type === 'xlsx') XLSX.writeFile(workbook, `${fileName}.xlsx`);
        else XLSX.writeFile(workbook, `${fileName}.csv`);
    };

    // Backup & Restore
    const handleDownloadBackup = async () => {
        try {
            const dump = await getFullDatabaseDump();
            const jsonString = JSON.stringify(dump, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `backup_juguetes_FULL_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        } catch (e: any) {
            alert("Error al generar respaldo: " + e.message);
        }
    };

    const handleRestoreBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const json = JSON.parse(event.target?.result as string);
                if (confirm("⚠️ PELIGRO CRÍTICO ⚠️\n\nEstás a punto de RESTAURAR una copia de seguridad.\nESTO BORRARÁ TODOS LOS DATOS ACTUALES.\n¿Confirmar restauración?")) {
                    setIsRestoring(true);
                    const res = await restoreDatabaseDump(json);
                    setIsRestoring(false);
                    if (res.success) {
                        alert("✅ Restauración completada. Recargando...");
                        window.location.reload();
                    } else {
                        alert("❌ Error: " + res.message);
                    }
                }
            } catch (err) {
                alert("Error al leer archivo backup. ¿Es un JSON válido?");
                setIsRestoring(false);
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    };

    const handleResetDatabase = async () => {
        const confirm1 = confirm("⚠️ ¿ESTÁS SEGURO?\n\nEsto ELIMINARÁ TODOS los registros y reiniciará el contador a 0.\nLos usuarios y configuraciones se mantendrán.");
        if (confirm1) {
            const confirm2 = prompt("Para confirmar, escribe: BORRAR TODO");
            if (confirm2 === 'BORRAR TODO') {
                setIsLoading(true);
                const res = await clearAllRegistrations();
                await refreshData();
                setIsLoading(false);
                alert(res.message || (res.success ? "Base de datos reiniciada." : "Error."));
            }
        }
    };

    return (
        <div className="space-y-8 animate-fade-in pb-20">
            <div>
                <h2 className="text-2xl font-bold text-slate-800">Base de Datos</h2>
                <p className="text-slate-500">Exportación, copias de seguridad y mantenimiento.</p>
            </div>

            {/* Stats Card */}
            <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center space-y-6">
                <div className="bg-blue-50 p-4 rounded-full">
                    <Database className="w-12 h-12 text-blue-600" />
                </div>
                <div>
                    <div className="text-4xl font-bold text-slate-800">{registrations.length}</div>
                    <div className="text-slate-500">Registros Familiares Activos</div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
                    <button onClick={() => handleExport('csv')} className="flex-1 flex items-center justify-center gap-2 bg-slate-600 hover:bg-slate-700 text-white py-3 px-4 rounded-lg font-medium transition-colors">
                        <Download className="w-4 h-4" /> Exportar CSV
                    </button>
                    <button onClick={() => handleExport('xlsx')} className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg font-medium transition-colors">
                        <Download className="w-4 h-4" /> Exportar Excel
                    </button>
                </div>
            </div>

            {/* Backup Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <Cloud className="w-5 h-5 text-indigo-500" /> Copia de Seguridad
                    </h3>
                    <p className="text-sm text-slate-500 mb-6">
                        Descarga un archivo JSON completo con todos los datos del sistema (Registros, Usuarios, Configuración).
                    </p>
                    <button onClick={handleDownloadBackup} className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-3 rounded-lg flex items-center justify-center gap-2 transition-colors">
                        <Download className="w-4 h-4" /> Descargar Backup Completo
                    </button>
                </div>

                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <Upload className="w-5 h-5 text-purple-500" /> Restaurar Sistema
                    </h3>
                    <p className="text-sm text-slate-500 mb-6">
                        Restaura el sistema desde un archivo de respaldo. <strong className="text-red-500">Esto sobrescribirá los datos actuales.</strong>
                    </p>
                    <label className="w-full bg-purple-50 hover:bg-purple-100 text-purple-700 font-medium py-3 rounded-lg flex items-center justify-center gap-2 cursor-pointer transition-colors border border-purple-100">
                        {isRestoring ? <span className="animate-spin">⏳</span> : <Upload className="w-4 h-4" />}
                        {isRestoring ? "Restaurando..." : "Subir Archivo de Respaldo"}
                        <input type="file" accept=".json" onChange={handleRestoreBackup} className="hidden" disabled={isRestoring} />
                    </label>
                </div>
            </div>

            {/* Maintenance */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-orange-500" /> Integridad de Datos
                </h3>
                <div className="flex flex-col sm:flex-row items-center gap-4 justify-between">
                    <p className="text-sm text-slate-500">
                        Detecta y elimina invitaciones marcadas como "ocupadas" que no pertenecen a ningún registro válido.
                    </p>
                    <button
                        onClick={async () => {
                            setIsLoading(true);
                            const res = await cleanupOrphanedInvites();
                            setIsLoading(false);
                            alert(res.message);
                        }}
                        disabled={isLoading}
                        className="whitespace-nowrap bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 py-2 px-4 rounded-lg text-sm font-medium"
                    >
                        {isLoading ? 'Escaneando...' : 'Reparar Invitaciones Huérfanas'}
                    </button>
                </div>
            </div>

            {/* Danger Zone */}
            <div className="bg-red-50 p-6 rounded-xl border border-red-200 w-full">
                <div className="flex items-start gap-4">
                    <div className="bg-red-100 p-3 rounded-full flex-shrink-0">
                        <AlertTriangle className="w-6 h-6 text-red-600" />
                    </div>
                    <div className="flex-grow">
                        <h3 className="text-lg font-bold text-red-800">Zona de Peligro</h3>
                        <p className="text-sm text-red-700 mb-4">
                            Las siguientes acciones son destructivas y no se pueden deshacer.
                        </p>
                        <button
                            onClick={handleResetDatabase}
                            className="bg-white border border-red-300 text-red-600 hover:bg-red-600 hover:text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm flex items-center gap-2 shadow-sm"
                        >
                            <Trash2 className="w-4 h-4" />
                            Eliminar Toda la Base de Datos
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DataManagementTab;
