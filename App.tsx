import React, { useEffect, useState } from 'react';
import './index.css';

import WeddingDashboard from './components/WeddingDashboard';
import LandingV2 from './components/LandingV2';
import EventosLayout from './components/eventossv/EventosLayout';
import LandingPage from './components/eventossv/LandingPage';
import EventDemoPage from './components/EventDemoPage';

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

  // Check for Event Demo Mode
  if (params.get('demo') === 'event') {
    return <EventDemoPage />;
  }

  // Check for New Landing Version
  if (params.get('v') === '2') {
    return <LandingV2 />;
  }

  // Check for EventosSV SaaS Dashboard
  if (params.get('app') === 'eventossv') {
    return <EventosLayout />;
  }

  // Check for EventosSV SaaS Landing Page
  if (params.get('app') === 'eventossv_landing') {
    return <LandingPage />;
  }

  if (!authReady) {
    return (
      <div className="min-h-screen bg-[#fcfbf9] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-[#c5a059] animate-spin mx-auto mb-4" />
          <p className="text-slate-500 font-serif italic">Cargando...</p>
        </div>
      </div>
    );
  }

  // Default: Show the SaaS Admin/Login Dashboard
  return (
    <div className="min-h-screen bg-[#fcfbf9] font-sans text-slate-800">
      <WeddingDashboard />
    </div>
  );
};

export default App;