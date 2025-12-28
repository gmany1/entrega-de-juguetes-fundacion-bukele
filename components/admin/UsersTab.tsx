import React, { useState } from 'react';
import { useAdmin } from '../../contexts/AdminContext';
import { useConfig } from '../../contexts/ConfigContext';
import { SystemUser } from '../../types';
import { saveSystemUser, deleteSystemUser } from '../../services/storageService';
import { User, Key, Check, X, ShieldCheck, Phone, RefreshCw } from 'lucide-react';

const UsersTab: React.FC = () => {
    const { users, refreshUsers, registrations } = useAdmin();
    const { config } = useConfig();
    const [isLoading, setIsLoading] = useState(false);

    // Form State
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState<Omit<SystemUser, 'id'>>({
        username: '',
        password: '',
        name: '',
        whatsapp: '',
        role: 'verifier',
        assignedDistributor: ''
    });

    const handleEdit = (user: SystemUser) => {
        setFormData({
            username: user.username,
            password: user.password,
            name: user.name,
            whatsapp: user.whatsapp || '',
            role: user.role,
            assignedDistributor: user.assignedDistributor || ''
        });
        setEditingId(user.id);
        setIsEditing(true);
    };

    const handleDeleteUser = async (id: string, name: string) => {
        if (confirm(`¿Eliminar usuario "${name}"?`)) {
            const res = await deleteSystemUser(id);
            if (res.success) {
                refreshUsers();
            } else {
                alert(res.message);
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.username || !formData.password || !formData.name) {
            alert("Todos los campos son obligatorios (excepto Distribuidor/WhatsApp)");
            return;
        }

        const payload = {
            ...formData,
            id: editingId || undefined
        };

        const res = await saveSystemUser(payload);
        if (res.success) {
            resetForm();
            refreshUsers();
            alert("Usuario guardado correctamente.");
        } else {
            alert(res.message || "Error al guardar.");
        }
    };

    const resetForm = () => {
        setIsEditing(false);
        setEditingId(null);
        setFormData({ username: '', password: '', name: '', whatsapp: '', role: 'verifier', assignedDistributor: '' });
    };

    const handleSyncDistributors = async () => {
        if (!confirm("Esto creará cuentas de usuario para todos los distribuidores configurados que aún no tengan cuenta. ¿Proceder?")) return;

        setIsLoading(true);
        let createdCount = 0;

        for (const dist of (config.ticketDistributors || [])) {
            const exists = users.find(u => u.role === 'verifier' && u.assignedDistributor === dist.name);
            if (!exists) {
                const firstName = (dist.name || '').split(' ')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
                const username = `distribuidor.${firstName}`;
                const password = "Navidad2025";
                await saveSystemUser({
                    username,
                    password,
                    name: dist.name,
                    role: 'verifier',
                    assignedDistributor: dist.name,
                    whatsapp: dist.phone
                });
                createdCount++;
            }
        }

        await refreshUsers();
        setIsLoading(false);
        alert(`Sincronización completada. Se crearon ${createdCount} nuevos usuarios.`);
    };

    // Calculate dynamic stats for verifiers (moved logic here or keep if context gives it)
    // The previous optimized useMemo logic can be reused here or we can rely on the context statistics.
    // The context gives us general stats, but here we want stats PER USER which is specific.
    // We'll reimplement the simple optimization here.

    return (
        <div className="space-y-6 animate-fade-in pb-20">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-bold text-slate-800">Usuarios del Sistema</h3>
                    <p className="text-sm text-slate-500">Gestiona quién tiene acceso al panel y escáner.</p>
                </div>
                {!isEditing && (
                    <button onClick={handleSyncDistributors} disabled={isLoading} className="flex items-center gap-2 text-sm bg-blue-50 text-blue-600 px-3 py-2 rounded-lg hover:bg-blue-100 transition-colors">
                        <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
                        Sincronizar Distribuidores
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Form */}
                <div className="lg:col-span-1">
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm sticky top-6">
                        <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                            {isEditing ? <User className="w-4 h-4 text-orange-500" /> : <ShieldCheck className="w-4 h-4 text-blue-500" />}
                            {isEditing ? 'Editar Usuario' : 'Nuevo Usuario'}
                        </h4>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1">Nombre Completo</label>
                                <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="Ej. Juan Pérez" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 mb-1">Usuario</label>
                                    <input type="text" value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="usuario123" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 mb-1">Contraseña</label>
                                    <div className="relative">
                                        <input type="text" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm pl-8" />
                                        <Key className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3" />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1">Rol</label>
                                <select
                                    value={formData.role}
                                    onChange={e => setFormData({ ...formData, role: e.target.value as any })}
                                    className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
                                >
                                    <option value="verifier">Verificador (Solo Escáner)</option>
                                    <option value="admin">Administrador Total</option>
                                    <option value="whatsapp_sender">Envíos WhatsApp</option>
                                </select>
                            </div>

                            {formData.role === 'verifier' && (
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 mb-1">Asignar a Distribuidor (Opcional)</label>
                                    <select
                                        value={formData.assignedDistributor}
                                        onChange={e => setFormData({ ...formData, assignedDistributor: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
                                    >
                                        <option value="">-- Sin asignar --</option>
                                        {config.ticketDistributors.map(d => (
                                            <option key={d.name} value={d.name}>{d.name} ({d.startRange}-{d.endRange})</option>
                                        ))}
                                    </select>
                                    <p className="text-[10px] text-slate-500 mt-1">Si se asigna, el usuario verá estadísticas de progreso para este rango.</p>
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1">WhatsApp (Opcional)</label>
                                <input type="text" value={formData.whatsapp} onChange={e => setFormData({ ...formData, whatsapp: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="503..." />
                            </div>

                            <div className="flex gap-2 pt-2">
                                {isEditing && (
                                    <button type="button" onClick={resetForm} className="flex-1 bg-slate-100 text-slate-600 py-2 rounded-lg text-sm font-medium">Cancelar</button>
                                )}
                                <button type="submit" className="flex-1 bg-slate-800 text-white py-2 rounded-lg text-sm font-bold hover:bg-slate-700 transition-colors">
                                    {isEditing ? 'Actualizar' : 'Crear Usuario'}
                                </button>
                            </div>

                        </form>
                    </div>
                </div>

                {/* List */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-slate-500 uppercase bg-slate-50">
                                <tr>
                                    <th className="px-6 py-3">Usuario</th>
                                    <th className="px-6 py-3">Rol</th>
                                    <th className="px-6 py-3">Detalles</th>
                                    <th className="px-6 py-3 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {users.map(u => (
                                    <tr key={u.id} className="hover:bg-slate-50/50 group">
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-slate-800">{u.name}</div>
                                            <div className="text-xs text-slate-500 font-mono">@{u.username}</div>
                                            <div className="text-xs text-slate-400 font-mono mt-0.5">pwd: {u.password}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${u.role === 'admin' ? 'bg-purple-50 text-purple-700 border-purple-100' :
                                                    u.role === 'verifier' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                                        'bg-green-50 text-green-700 border-green-100'
                                                }`}>
                                                {u.role === 'admin' ? 'Administrador' : u.role === 'verifier' ? 'Escáner / Monitor' : 'WhatsApp'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {u.assignedDistributor ? (
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-xs font-bold text-slate-700">{u.assignedDistributor}</span>
                                                    {u.whatsapp && (
                                                        <a href={`https://wa.me/${u.whatsapp.replace(/\D/g, '')}`} target="_blank" className="flex items-center gap-1 text-[10px] text-green-600 hover:underline">
                                                            <Phone size={10} /> {u.whatsapp}
                                                        </a>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-xs text-slate-400 italic">Sin asignación</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => handleEdit(u)} className="text-blue-500 hover:bg-blue-50 p-1.5 rounded-md">Editar</button>
                                                <button onClick={() => handleDeleteUser(u.id, u.name)} className="text-red-500 hover:bg-red-50 p-1.5 rounded-md">Eliminar</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UsersTab;
