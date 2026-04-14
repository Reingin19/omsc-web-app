import { useState } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import TopNavBar from '../components/layout/TopNavBar';
import CommandPalette from '../components/CommandPalette';
import SystemConfiguration from '../components/admin/SystemConfiguration';
import UserManagement from '../components/admin/UserManagement';
import InstitutionalAnalytics from '../components/admin/InstitutionalAnalytics';
import SecurityLogs from '../components/admin/SecurityLogs';
import { useToast } from '../hooks/use-toast'; // Import ang useToast

interface AdminDashboardProps {
  onLogout: () => void;
}

export default function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const [commandOpen, setCommandOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast(); // Initialize toast

  const navigationItems = [
    { label: 'Configuration', path: '/admin', icon: 'Settings' },
    { label: 'Users', path: '/admin/users', icon: 'Users' },
    { label: 'Analytics', path: '/admin/analytics', icon: 'TrendingUp' },
    { label: 'Security', path: '/admin/security', icon: 'Shield' },
  ];

  const handleCommandSelect = (path: string) => {
    navigate(path);
    setCommandOpen(false);
  };

  // Wrapper function para sa Logout na may Toast
  const handleLogoutWithToast = () => {
    toast({
      title: "Logout Successful",
      description: "You have been logged out.",
      className: "bg-green-600 text-white border-none", // Green color
    });
    onLogout();
  };

  return (
    <div className="min-h-screen bg-background">
      <TopNavBar
        role="admin"
        userName="Admin User"
        campus="System Wide"
        onLogout={handleLogoutWithToast} // Pinalitan ang original onLogout
        onCommandOpen={() => setCommandOpen(true)}
        navigationItems={navigationItems}
        currentPath={location.pathname}
      />

      <main className="max-w-[1440px] mx-auto px-6 py-8 mt-[72px]">
        <Routes>
          <Route path="/" element={<SystemConfiguration />} />
          <Route path="/users" element={<UserManagement />} />
          <Route path="/analytics" element={<InstitutionalAnalytics />} />
          <Route path="/security" element={<SecurityLogs />} />
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