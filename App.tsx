import React from 'react';
import Hero from './components/Hero';
import InfoSection from './components/InfoSection';
import RegistrationForm from './components/RegistrationForm';
import AdminPanel from './components/AdminPanel';

const App: React.FC = () => {
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