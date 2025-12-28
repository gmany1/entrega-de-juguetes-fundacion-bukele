import React from 'react';
import { useConfig } from '../../../../contexts/ConfigContext';
import { Save, AlertTriangle } from 'lucide-react';

const SettingsPage: React.FC = () => {
    const { config, updateConfig } = useConfig();
    const [localConfig, setLocalConfig] = React.useState(config);

    // Simple handler to update local state deep keys
    const handleChange = (key: string, val: any) => {
        setLocalConfig(prev => ({ ...prev, [key]: val }));
    };

    const handleSave = () => {
        updateConfig(localConfig);
        alert('Configuración guardada.');
    };

    return (
        <div className="space-y-6 animate-fade-in pb-20">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Configuración del Evento</h2>
                    <p className="text-slate-500">Ajustes globales del sistema y del evento.</p>
                </div>
                <button onClick={handleSave} className="flex items-center gap-2 bg-[#c5a059] text-white px-4 py-2 rounded-lg font-bold hover:bg-[#b08d4b] transition-colors">
                    <Save size={18} /> Guardar Cambios
                </button>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                {/* Event Details */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="font-bold text-lg text-slate-800 mb-4">Detalles Generales</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-600 mb-1">Nombre del Evento</label>
                            <input
                                type="text"
                                value={localConfig.eventName}
                                onChange={e => handleChange('eventName', e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-600 mb-1">Total de Invitados (Capacidad)</label>
                            <input
                                type="number"
                                value={localConfig.maxRegistrations}
                                onChange={e => handleChange('maxRegistrations', parseInt(e.target.value))}
                                className="w-full px-3 py-2 border rounded-lg text-sm"
                            />
                        </div>
                    </div>
                </div>

                {/* System Settings */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="font-bold text-lg text-slate-800 mb-4">Sistema</h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                            <span className="text-sm font-medium text-slate-700">Habilitar RSVP Público</span>
                            <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                                <input type="checkbox" name="toggle" id="toggle" className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer" />
                                <label htmlFor="toggle" className="toggle-label block overflow-hidden h-5 rounded-full bg-gray-300 cursor-pointer"></label>
                            </div>
                        </div>

                        <div className="p-3 bg-orange-50 border border-orange-100 rounded-lg flex gap-3 text-orange-800 text-xs">
                            <AlertTriangle size={16} />
                            <p>Zona Peligrosa: Reiniciar base de datos solo debe hacerse antes del evento.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;
