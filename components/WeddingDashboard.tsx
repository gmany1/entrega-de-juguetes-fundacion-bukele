import React, { useState, useEffect } from 'react';
import { SystemUser } from '../types';
import { authenticateUser } from '../services/storageService';
import { waitForAuth, auth } from '../services/firebaseConfig';
import { Loader2, Lock, ArrowRight } from 'lucide-react';
import { AdminProvider } from '../contexts/AdminContext';
import AdminLayout from './admin/AdminLayout';

const AdminPanel: React.FC = () => {
    const [currentUser, setCurrentUser] = useState<SystemUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Login Form State
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loginError, setLoginError] = useState('');
    const [isLoggingIn, setIsLoggingIn] = useState(false);

    useEffect(() => {
        // Check local persistence
        const checkAuth = async () => {
            try {
                await waitForAuth;
                if (auth.currentUser) {
                    // We rely on AdminContext to fetch the full user details if needed, 
                    // but we need the Role to route initially if we weren't using the AdminLayout.
                    // However, we simplified: AdminLayout handles everything.
                    // We just need a dummy user object or fetch it? 
                    // Ideally we should fetch the SystemUser profile associated with this uid.
                    // But for now, we might fall back to the login screen if we don't have the profile in memory.
                    // Actually, let's try to just let them login if we don't have the user object.
                    // OR: Use a simple listener.

                    // QUICK FIX: For now, if firebase auth is missing the custom claim or we don't have the user data locally,
                    // we force re-login to ensure we have the SystemUser object (role, name, etc).
                    // This is safer than desync.
                    setIsLoading(false);
                } else {
                    setIsLoading(false);
                }
            } catch (e) {
                console.error("Auth check failed", e);
                setIsLoading(false);
            }
        };
        checkAuth();
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoginError('');
        setIsLoggingIn(true);

        try {
            const user = await authenticateUser(username, password);
            if (user) {
                setCurrentUser(user);
            } else {
                setLoginError('Credenciales incorrectas.');
            }
        } catch (error) {
            setLoginError('Error de conexión.');
        } finally {
            setIsLoggingIn(false);
        }
    };

    const handleLogout = async () => {
        try {
            await auth.signOut();
            setCurrentUser(null);
            setUsername('');
            setPassword('');
        } catch (e) {
            console.error("Logout error", e);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
        );
    }

    if (!currentUser) {
        return (
            <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
                <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-200">
                    <div className="text-center mb-8">
                        <div className="bg-[#1e293b] w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg border border-[#c5a059]">
                            <Lock className="text-[#c5a059] w-8 h-8" />
                        </div>
                        <h2 className="text-2xl font-serif text-slate-800">Wedding Planner</h2>
                        <p className="text-slate-500 text-sm">Acceso Administrativo</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div>
                            <label className="block text-xs uppercase font-bold text-slate-500 mb-2 tracking-wider">Usuario</label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full px-4 py-3 rounded-sm border border-slate-300 focus:border-[#c5a059] outline-none transition-all"
                                placeholder="Usuario"
                                autoFocus
                            />
                        </div>

                        <div>
                            <label className="block text-xs uppercase font-bold text-slate-500 mb-2 tracking-wider">Contraseña</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 rounded-sm border border-slate-300 focus:border-[#c5a059] outline-none transition-all"
                                placeholder="••••••••"
                            />
                        </div>

                        {loginError && (
                            <div className="p-3 bg-red-50 text-red-600 text-sm border-l-2 border-red-500 font-medium">
                                {loginError}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoggingIn}
                            className="w-full bg-[#1e293b] text-white font-bold py-3.5 rounded-sm hover:bg-black transition-all transform flex items-center justify-center gap-2 shadow-lg uppercase tracking-widest text-sm"
                        >
                            {isLoggingIn ? <Loader2 className="animate-spin" /> : <>Ingresar <ArrowRight size={16} /></>}
                        </button>
                    </form>

                    <div className="mt-8 text-center text-[#c5a059]">
                        <p className="text-[10px] uppercase tracking-widest">Wedding Manager System v1.0</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <AdminProvider>
            <AdminLayout user={currentUser} onLogout={handleLogout} />
        </AdminProvider>
    );
};

export default AdminPanel;