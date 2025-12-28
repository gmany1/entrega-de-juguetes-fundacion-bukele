import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import SaaSLogin from '../../components/SaaSLogin';
import { authenticateUser } from '../../services/storageService';

const LoginPage: React.FC = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const navigate = useNavigate();
    const location = useLocation();

    // Default redirect to admin, or to the page they tried to visit
    // const from = location.state?.from?.pathname || '/admin';
    // Simplified: always go to admin for now
    const from = '/admin';

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const user = await authenticateUser(username, password);
            if (user) {
                // Auth success - Service handles persistence usually
                // But authenticateUser in storageService returns the user object
                // We might need to manually set session if storageService doesn't do it for "session" persistence
                // storageService uses signInWithEmailAndPassword so firebase handles session.
                navigate(from, { replace: true });
            } else {
                setError('Credenciales incorrectas');
            }
        } catch (err) {
            setError('Error al iniciar sesión');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SaaSLogin
            username={username}
            setUsername={setUsername}
            password={password}
            setPassword={setPassword}
            onLogin={handleLogin}
            isLoading={isLoading}
            error={error}
        />
    );
};

export default LoginPage;
