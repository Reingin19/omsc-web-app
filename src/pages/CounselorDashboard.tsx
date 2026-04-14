import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import TopNavBar from '../components/layout/TopNavBar';
import CommandPalette from '../components/CommandPalette';
import ProgramManagement from '../components/counselor/ProgramManager';
import MaterialLibrary from '../components/counselor/MaterialLibrary';
import QuizBuilder from '../components/counselor/QuizBuilder';
import AnalyticsDashboard from '../components/counselor/AnalyticsDashboard';
import ProgramRegistrations from '../components/counselor/ProgramRegistrations'; // Bago ito
import InquiryManager from '../components/counselor/InquiryManager'; 
import { useToast } from '../hooks/use-toast';

interface CounselorDashboardProps {
  onLogout: () => void;
}

export default function CounselorDashboard({ onLogout }: CounselorDashboardProps) {
  const [commandOpen, setCommandOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const userName = localStorage.getItem("userName") || "Counselor User";
  const userCampus = localStorage.getItem("userCampus") || "Main Campus";

  // --- NAVIGATION ITEMS UPDATED ---
  const navigationItems = [
    { label: 'Programs', path: '/counselor', icon: 'Calendar' },
    { label: 'Registrants', path: '/counselor/registrations', icon: 'Users' }, // Bago: Para sa listahan ng students
    { label: 'Materials', path: '/counselor/materials', icon: 'FolderOpen' },
    { label: 'Quizzes', path: '/counselor/quizzes', icon: 'FileQuestion' },
    { label: 'Analytics', path: '/counselor/analytics', icon: 'BarChart3' },
    { label: 'Inquiries', path: '/counselor/inquiries', icon: 'MessageSquare' },
  ];

  const handleCommandSelect = (path: string) => {
    navigate(path);
    setCommandOpen(false);
  };

  const handleLogoutWithToast = () => {
    toast({
      title: "LOGOUT SUCCESSFULLY",
      description: "You have been logged out from the counselor portal.",
      className: "bg-indigo-600 text-white font-black italic border-none rounded-2xl shadow-2xl py-6",
    });

    setTimeout(() => {
      onLogout();
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-background">
      <TopNavBar
        role="counselor"
        userName={userName}
        campus={userCampus}
        onLogout={handleLogoutWithToast}
        onCommandOpen={() => setCommandOpen(true)}
        navigationItems={navigationItems}
        currentPath={location.pathname}
      />

      <main className="max-w-[1440px] mx-auto px-6 py-8 mt-[72px]">
        <Routes>
          <Route path="/" element={<ProgramManagement />} />
          
          {/* --- ROUTE PARA SA REGISTRANTS --- */}
          <Route path="/registrations" element={<ProgramRegistrations />} /> 
          
          <Route path="/materials" element={<MaterialLibrary />} />
          <Route path="/quizzes" element={<QuizBuilder />} />
          <Route path="/analytics" element={<AnalyticsDashboard />} />
          <Route path="/inquiries" element={<InquiryManager />} /> 
        </Routes>
      </main>

      <CommandPalette
        open={commandOpen}
        onOpenChange={setCommandOpen}
        items={navigationItems}
        onSelect={handleCommandSelect}
      />
    </div>
  );
}