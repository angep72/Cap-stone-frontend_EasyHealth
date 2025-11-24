import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LandingPage } from './pages/LandingPage';
import { Login } from './components/auth/Login';
import { Register } from './components/auth/Register';
import { PatientDashboard } from './pages/PatientDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { DoctorDashboard } from './pages/DoctorDashboard';
import { NurseDashboard } from './pages/NurseDashboard';
import { LabTechnicianDashboard } from './pages/LabTechnicianDashboard';
import { PharmacistDashboard } from './pages/PharmacistDashboard';
import { Loader } from './components/ui/Loader';

type AuthView = 'landing' | 'login' | 'register';

function AppContent() {
  const { user, profile, loading } = useAuth();
  const [authView, setAuthView] = useState<AuthView>('landing');

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <Loader label="Loading your workspace..." fullHeight />
      </div>
    );
  }

  if (!user || !profile) {
    if (authView === 'landing') {
      return (
        <LandingPage
          onNavigateToLogin={() => setAuthView('login')}
          onNavigateToRegister={() => setAuthView('register')}
        />
      );
    }
    
    if (authView === 'register') {
      return (
        <Register
          onToggleLogin={() => setAuthView('login')}
          onNavigateToLanding={() => setAuthView('landing')}
        />
      );
    }
    
    return (
      <Login
        onToggleRegister={() => setAuthView('register')}
        onNavigateToLanding={() => setAuthView('landing')}
      />
    );
  }

  switch (profile.role) {
    case 'patient':
      return <PatientDashboard />;
    case 'admin':
      return <AdminDashboard />;
    case 'doctor':
      return <DoctorDashboard />;
    case 'nurse':
      return <NurseDashboard />;
    case 'lab_technician':
      return <LabTechnicianDashboard />;
    case 'pharmacist':
      return <PharmacistDashboard />;
    default:
      return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
          <p className="text-gray-600">Unknown Role</p>
        </div>
      );
  }
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
