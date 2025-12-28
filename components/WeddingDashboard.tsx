import React, { useState, useEffect } from 'react';
import { SystemUser } from '../types';
import { authenticateUser } from '../services/storageService';
import { waitForAuth, auth } from '../services/firebaseConfig';
import { Loader2, Lock, ArrowRight } from 'lucide-react';
import { AdminProvider } from '../contexts/AdminContext';
import AdminLayout from './admin/AdminLayout';
import SaaSLogin from './SaaSLogin';

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
            <SaaSLogin
                onLogin={handleLogin}
                username={username}
                setUsername={setUsername}
                password={password}
                setPassword={setPassword}
                isLoading={isLoggingIn}
                error={loginError}
            />
        );
    }

    return (
        <AdminProvider>
            <AdminLayout user={currentUser} onLogout={handleLogout} />
        </AdminProvider>
    );
};

export default AdminPanel;