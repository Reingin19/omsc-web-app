import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Toaster } from './components/ui/toaster';

// Layout
import Layout from "./components/layout/Layout";

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import StudentDashboard from './pages/StudentDashboard';
import CounselorDashboard from './pages/CounselorDashboard';
import AdminDashboard from './pages/AdminDashboard';

// Sub-pages
import ProgramsPage from './pages/ProgramsPage';
import MaterialsPage from './pages/MaterialsPage';
import SurveysPage from './pages/SurveysPage';
import AboutPage from './pages/AboutPage';
import VideoGenerator from './components/student/VideoGenerator'; 

// --- BAGONG IMPORT PARA SA PAGSAGOT NG SURVEY ---
import TakeSurvey from './pages/SurveysPage'; 

type UserRole = 'student' | 'counselor' | 'admin' | null;

function AppContent() {
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState<UserRole>(() => localStorage.getItem('userRole') as UserRole);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => !!localStorage.getItem('isAuthenticated'));

  const handleLogin = (role: string, name: string) => {
    setUserRole(role as UserRole);
    setIsAuthenticated(true);
    localStorage.setItem('userRole', role);
    localStorage.setItem('isAuthenticated', 'true');
    navigate(`/${role}`);
  };

  const handleLogout = () => {
    setUserRole(null);
    setIsAuthenticated(false);
    localStorage.removeItem('userRole');
    localStorage.removeItem('isAuthenticated');
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Routes>
        {/* 1. PUBLIC ROUTES */}
        <Route path="/" element={<Layout><HomePage onNavigate={(page) => navigate(`/${page}`)} /></Layout>} />
        <Route path="/programs" element={<Layout><ProgramsPage /></Layout>} />
        <Route path="/materials" element={<Layout><MaterialsPage /></Layout>} />
        <Route path="/surveys" element={<Layout><SurveysPage /></Layout>} />
        <Route path="/about" element={<Layout><AboutPage /></Layout>} />
        <Route path="/ai-video" element={<Layout><VideoGenerator /></Layout>} />

        {/* --- BAGONG ROUTE: DITO PUPUNTA ANG STUDENT PAG-CLICK NG START ASSESSMENT --- */}
        <Route path="/take-survey/:id" element={<Layout><TakeSurvey /></Layout>} />

        {/* 2. LOGIN PAGE */}
        <Route 
          path="/login" 
          element={
            isAuthenticated ? (
              <Navigate to={`/${userRole}`} replace />
            ) : (
              <LoginPage 
                onLogin={handleLogin} 
                onBackToHome={() => navigate('/')} 
              />
            )
          } 
        />

        {/* 3. PROTECTED ROUTES */}
        <Route 
          path="/student/*" 
          element={isAuthenticated && userRole === 'student' ? <StudentDashboard onLogout={handleLogout} /> : <Navigate to="/login" replace />} 
        />
        <Route 
          path="/counselor/*" 
          element={isAuthenticated && userRole === 'counselor' ? <CounselorDashboard onLogout={handleLogout} /> : <Navigate to="/login" replace />} 
        />
        <Route 
          path="/admin/*" 
          element={isAuthenticated && userRole === 'admin' ? <AdminDashboard onLogout={handleLogout} /> : <Navigate to="/login" replace />} 
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster />
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}