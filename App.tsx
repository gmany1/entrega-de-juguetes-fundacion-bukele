import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './index.css';

// Layouts
import PublicLayout from './src/layouts/PublicLayout';
import AdminLayout from './src/layouts/AdminLayout';
import ScannerLayout from './src/layouts/ScannerLayout';

// Pages & Components
import LandingV2 from './components/LandingV2';
import LoginPage from './src/pages/LoginPage';
import RequireAuth from './src/components/auth/RequireAuth';
import WeddingHome from './src/pages/public/WeddingHome';
import RSVPPage from './src/pages/public/RSVPPage';
import ScannerPage from './src/pages/scanner/ScannerPage';

// Admin Tabs / EventosSV Components
import DashboardHome from './components/eventossv/DashboardHome';
import CRMPipeline from './components/eventossv/CRMPipeline';
import EventHub from './components/eventossv/EventHub';
import QuoteScreen from './components/eventossv/QuoteScreen';
import InventoryScreen from './components/eventossv/InventoryScreen';
import FiscalComplianceScreen from './components/eventossv/FiscalComplianceScreen';
import RegistrationsTab from './components/admin/RegistrationsTab';
import ScannerTab from './components/admin/ScannerTab';
import VendorDashboard from './src/pages/admin/vendors/VendorDashboard';
import StatsReport from './src/pages/admin/post-event/StatsReport';
import GalleryManager from './src/pages/admin/post-event/GalleryManager';
import UsersPage from './src/pages/admin/config/UsersPage';
import DataPage from './src/pages/admin/config/DataPage';
import SettingsPage from './src/pages/admin/config/SettingsPage';
import CRMDashboard from './src/pages/admin/crm/CRMDashboard';
import VendorPortal from './src/pages/portal/VendorPortal';

import { waitForAuth, auth } from './services/firebaseConfig';
import { Loader2 } from 'lucide-react';

const App: React.FC = () => {
  const [authInitialized, setAuthInitialized] = useState(false);

  useEffect(() => {
    waitForAuth.then(() => setAuthInitialized(true));
  }, []);

  if (!authInitialized) {
    return (
      <div className="min-h-screen bg-[#fcfbf9] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-[#c5a059] animate-spin" />
      </div>
    );
  }

  // Get current user for props - in a real app use Context
  // AdminLayout handles undefined user gracefully
  // Type casting mainly for prop compatibility if needed
  const currentUser = auth.currentUser as any;

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingV2 />} />
        <Route path="/login" element={<LoginPage />} />

        {/* Wedding Website Routes (Future Phase) */}
        <Route path="/boda/:eventId" element={<PublicLayout />}>
          <Route index element={<WeddingHome />} />
          <Route path="rsvp" element={<RSVPPage />} />
        </Route>

        {/* Scanner App Routes */}
        <Route path="/scanner" element={<ScannerLayout />}>
          <Route index element={<ScannerPage />} />
        </Route>

        {/* Admin / Planner Routes */}
        <Route path="/admin" element={
          <RequireAuth>
            <AdminLayout user={currentUser} onLogout={() => auth.signOut()} />
          </RequireAuth>
        }>
          <Route index element={<DashboardHome />} />
          <Route path="dashboard" element={<Navigate to="/admin" replace />} />

          <Route path="crm" element={<CRMPipeline />} />
          <Route path="eventhub" element={<EventHub />} />
          <Route path="quotes" element={<QuoteScreen />} />
          <Route path="inventory" element={<InventoryScreen />} />
          <Route path="fiscal" element={<FiscalComplianceScreen />} />

          <Route path="registrations" element={<RegistrationsTab />} />
          <Route path="scanner" element={<ScannerTab />} />

          <Route path="users" element={<UsersPage />} />
          <Route path="vendors" element={<VendorDashboard />} />
          <Route path="audit" element={<StatsReport />} />
          <Route path="gallery" element={<GalleryManager />} />
          <Route path="data" element={<DataPage />} />
          <Route path="crm" element={<CRMDashboard />} />
          <Route path="settings" element={<SettingsPage />} />

          {/* Fallback for unknown admin routes */}
          <Route path="portal/:id" element={<VendorPortal />} />
          <Route path="*" element={<div>Página no encontrada</div>} />
        </Route>

        {/* Global Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;