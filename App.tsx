import React, { useEffect, useState } from 'react';
import './index.css';
import Hero from './components/Hero';
import InfoSection from './components/InfoSection';
import RegistrationForm from './components/RegistrationForm';
import AdminPanel from './components/AdminPanel';

import QRDisplay from './components/QRDisplay';
import { waitForAuth } from './services/firebaseConfig';
import { Loader2 } from 'lucide-react';

const App: React.FC = () => {
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    waitForAuth.then(() => setAuthReady(true));
  }, []);

  // Check for QR view mode
  const params = new URLSearchParams(window.location.search);
  if (params.get('view') === 'qr') {
    return <QRDisplay />;
  }

  if (!authReady) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-500 font-medium">Iniciando aplicación...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Hero />
      <main className="flex-grow">
        <InfoSection />
        <RegistrationForm />
      </main>
      <AdminPanel />
    </div>
  );
};

export default App;