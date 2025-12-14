import React from 'react';
import './index.css';
import Hero from './components/Hero';
import InfoSection from './components/InfoSection';
import RegistrationForm from './components/RegistrationForm';
import AdminPanel from './components/AdminPanel';

import QRDisplay from './components/QRDisplay';

const App: React.FC = () => {
  // Check for QR view mode
  const params = new URLSearchParams(window.location.search);
  if (params.get('view') === 'qr') {
    return <QRDisplay />;
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