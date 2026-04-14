import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import TopNavBar from '../components/layout/TopNavBar';
import CommandPalette from '../components/CommandPalette';
import DashboardOverview from '../components/student/DashboardOverview';
import ProgramsActivities from '../components/student/ProgramsActivities';
import IECMaterials from '../components/student/IECMaterials';
import QuizzesSurveys from '../components/student/QuizzesSurveys';
import ParticipationHistory from '../components/student/ParticipationHistory';
import Inquiries from '../components/student/Inquiries';
import VideoGenerator from '../components/student/VideoGenerator'; // 1. INIMPORT ANG VIDEO GENERATOR
import { useToast } from '../hooks/use-toast';

interface StudentDashboardProps {
  onLogout: () => void;
}

export default function StudentDashboard({ onLogout }: StudentDashboardProps) {
  const [commandOpen, setCommandOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  // --- DYNAMIC DATA FROM STORAGE ---
  const userName = localStorage.getItem("userName") || "Student User";
  const userCampus = localStorage.getItem("userCampus") || "San Jose Campus";

  const navigationItems = [
    { label: 'Dashboard', path: '/student', icon: 'Home' },
    { label: 'Programs', path: '/student/programs', icon: 'Calendar' },
    { label: 'Materials', path: '/student/materials', icon: 'BookOpen' },
    { label: 'AI Video Lab', path: '/student/ai-video', icon: 'Video' }, // 2. IDINAGDAG SA NAVBAR
    { label: 'Quizzes', path: '/student/quizzes', icon: 'ClipboardList' },
    { label: 'History', path: '/student/history', icon: 'History' },
    { label: 'Inquiries', path: '/student/inquiries', icon: 'MessageSquare' },
  ];

  const handleCommandSelect = (path: string) => {
    navigate(path);
    setCommandOpen(false);
  };

  const handleLogoutWithToast = () => {
    toast({
      title: "LOGOUT SUCCESSFULLY",
      description: "You have been signed out. Come back soon!",
      className: "bg-indigo-600 text-white font-black italic border-none rounded-2xl shadow-2xl py-6",
    });

    setTimeout(() => {
      onLogout();
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-background">
      <TopNavBar
        role="student"
        userName={userName}
        campus={userCampus}
        onLogout={handleLogoutWithToast}
        onCommandOpen={() => setCommandOpen(true)}
        navigationItems={navigationItems}
        currentPath={location.pathname}
      />

      <main className="max-w-[1440px] mx-auto px-6 py-8 mt-[72px]">
        <Routes>
          <Route path="/" element={<DashboardOverview />} />
          <Route path="/programs" element={<ProgramsActivities />} />
          <Route path="/materials" element={<IECMaterials />} />
          <Route path="/ai-video" element={<VideoGenerator />} /> {/* 3. ROUTE PARA SA AI VIDEO */}
          <Route path="/quizzes" element={<QuizzesSurveys />} />
          <Route path="/history" element={<ParticipationHistory />} />
          <Route path="/inquiries" element={<Inquiries />} />
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