import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { auth } from '../../../services/firebaseConfig';
// TODO: Use a real AuthContext later
import { authenticateUser } from '../../../services/storageService';

interface RequireAuthProps {
    children: JSX.Element;
}

const RequireAuth: React.FC<RequireAuthProps> = ({ children }) => {
    const location = useLocation();
    const user = auth.currentUser;

    // Ideally check for custom claims or local storage persistence of the session 
    // For now, simple firebase check + maybe local storage fallback

    if (!user && !localStorage.getItem('wedding_session')) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return children;
};

export default RequireAuth;
