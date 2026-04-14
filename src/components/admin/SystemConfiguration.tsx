import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { useToast } from '../../hooks/use-toast';
import { 
  Save, 
  Loader2, 
  Globe, 
  User, 
  Key, 
  Camera, 
  History, 
  LogOut,
  Mail,
  ShieldCheck
} from 'lucide-react';

export default function SystemConfiguration() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // --- DYNAMIC STATES ---
  const [adminProfile, setAdminProfile] = useState({
    id: '',
    name: '',
    email: '',
    role: '',
    student_id: '', // or employee_id
    avatar_url: 'https://github.com/shadcn.png'
  });

  const [siteConfig, setSiteConfig] = useState({
    system_name: '',
    abbreviation: '',
    official_email: '',
    contact_number: '',
    maintenance_mode: false
  });

  const [logs, setLogs] = useState<any[]>([]);

  // --- FETCH DATA FROM BACKEND ---
  const fetchData = async () => {
    setLoading(true);
    try {
      // Kunin ang Admin Profile (I-assume natin na may session ka o fixed ID muna)
      const profileRes = await fetch('http://localhost:3001/admin/profile');
      const profileData = await profileRes.json();
      setAdminProfile(profileData);

      // Kunin ang System Settings
      const settingsRes = await fetch('http://localhost:3001/admin/settings');
      const settingsData = await settingsRes.json();
      setSiteConfig(settingsData);

      // Kunin ang Audit Logs
      const logsRes = await fetch('http://localhost:3001/admin/logs');
      const logsData = await logsRes.json();
      setLogs(logsData);

    } catch (err) {
      console.error("Failed to fetch data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- UPDATE HANDLERS ---
  const handleUpdateProfile = async () => {
    setSaving(true);
    try {
      const res = await fetch(`http://localhost:3001/admin/profile/${adminProfile.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(adminProfile)
      });
      if (res.ok) {
        toast({ title: "PROFILE UPDATED", description: "Your changes have been saved to the database." });
      }
    } catch (err) {
      toast({ variant: "destructive", title: "ERROR", description: "Failed to update profile." });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateSettings = async () => {
    setSaving(true);
    try {
      const res = await fetch('http://localhost:3001/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(siteConfig)
      });
      if (res.ok) {
        toast({ 
            title: "SYSTEM SETTINGS SAVED", 
            description: "Global configuration updated.",
            className: "bg-indigo-600 text-white font-black rounded-2xl"
        });
      }
    } catch (err) {
      toast({ variant: "destructive", title: "ERROR", description: "Failed to update system settings." });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
        <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest">Synchronizing Data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 p-2">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase mb-2">
            Admin <span className="text-indigo-600">Console</span>
          </h1>
          <p className="text-slate-500 font-medium tracking-tight uppercase text-xs">Real-time system and profile control</p>
        </div>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-white p-1 h-14 rounded-[1.5rem] shadow-sm border border-slate-100">
          <TabsTrigger value="profile" className="rounded-xl font-black uppercase text-[10px] data-[state=active]:bg-indigo-600 data-[state=active]:text-white">Profile</TabsTrigger>
          <TabsTrigger value="branding" className="rounded-xl font-black uppercase text-[10px] data-[state=active]:bg-indigo-600 data-[state=active]:text-white">Settings</TabsTrigger>
          <TabsTrigger value="security" className="rounded-xl font-black uppercase text-[10px] data-[state=active]:bg-indigo-600 data-[state=active]:text-white">Security</TabsTrigger>
          <TabsTrigger value="logs" className="rounded-xl font-black uppercase text-[10px] data-[state=active]:bg-indigo-600 data-[state=active]:text-white">Logs</TabsTrigger>
        </TabsList>

        {/* PROFILE TAB */}
        <TabsContent value="profile" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="p-8 rounded-[2.5rem] border-none shadow-sm bg-white flex flex-col items-center text-center">
                <div className="relative group">
                    <img src={adminProfile.avatar_url} className="w-32 h-32 rounded-[2.5rem] object-cover ring-4 ring-indigo-50" alt="Admin" />
                    <label className="absolute inset-0 bg-indigo-600/60 rounded-[2.5rem] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer">
                        <Camera className="text-white w-8 h-8" />
                        <input type="file" className="hidden" />
                    </label>
                </div>
                <h2 className="mt-6 font-black text-xl text-slate-800 uppercase tracking-tight">{adminProfile.name}</h2>
                <p className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-4 py-1 rounded-full uppercase mt-2 tracking-widest">{adminProfile.role}</p>
                <div className="w-full border-t border-slate-50 mt-8 pt-8 space-y-4 text-[10px] font-black uppercase">
                    <div className="flex justify-between"><span className="text-slate-400">ID Number</span><span className="text-slate-700">{adminProfile.student_id}</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">Database Status</span><span className="text-emerald-500">Connected</span></div>
                </div>
            </Card>

            <Card className="lg:col-span-2 p-8 rounded-[2.5rem] border-none shadow-sm bg-white">
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center"><User className="text-indigo-600 w-5 h-5" /></div>
                    <h2 className="text-lg font-black uppercase tracking-tight">Account Details</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase ml-2 text-slate-400">Full Name</Label>
                        <Input 
                          value={adminProfile.name} 
                          onChange={(e) => setAdminProfile({...adminProfile, name: e.target.value})}
                          className="rounded-2xl h-12 bg-slate-50 border-none font-bold" 
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase ml-2 text-slate-400">Email Address</Label>
                        <Input 
                          value={adminProfile.email} 
                          onChange={(e) => setAdminProfile({...adminProfile, email: e.target.value})}
                          className="rounded-2xl h-12 bg-slate-50 border-none font-bold" 
                        />
                    </div>
                </div>
                <Button onClick={handleUpdateProfile} disabled={saving} className="mt-8 bg-indigo-600 rounded-2xl h-12 px-8 font-black uppercase text-[10px]">
                    {saving ? <Loader2 className="animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />} Save Personal Changes
                </Button>
            </Card>
          </div>
        </TabsContent>

        {/* SYSTEM SETTINGS TAB */}
        <TabsContent value="branding" className="mt-6">
          <Card className="p-8 rounded-[2.5rem] border-none shadow-sm bg-white">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center"><Globe className="text-indigo-600 w-6 h-6" /></div>
              <h2 className="text-xl font-black uppercase tracking-tight text-slate-800">Site Configuration</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase ml-2 text-slate-400">System Name</Label>
                        <Input 
                          value={siteConfig.system_name} 
                          onChange={(e) => setSiteConfig({...siteConfig, system_name: e.target.value})}
                          className="rounded-2xl h-12 bg-slate-50 border-none font-bold" 
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase ml-2 text-slate-400">Official Contact</Label>
                        <Input 
                          value={siteConfig.contact_number} 
                          onChange={(e) => setSiteConfig({...siteConfig, contact_number: e.target.value})}
                          className="rounded-2xl h-12 bg-slate-50 border-none font-bold" 
                        />
                    </div>
                </div>
                <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 flex items-center justify-between">
                    <div>
                        <h4 className="font-black text-slate-800 uppercase text-xs tracking-widest">Maintenance Mode</h4>
                        <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Restrict student access</p>
                    </div>
                    <div 
                      onClick={() => setSiteConfig({...siteConfig, maintenance_mode: !siteConfig.maintenance_mode})}
                      className={`w-14 h-8 rounded-full p-1 cursor-pointer transition-colors ${siteConfig.maintenance_mode ? 'bg-rose-500' : 'bg-slate-300'}`}
                    >
                        <div className={`bg-white w-6 h-6 rounded-full shadow-md transition-transform ${siteConfig.maintenance_mode ? 'translate-x-6' : 'translate-x-0'}`} />
                    </div>
                </div>
            </div>
            <Button onClick={handleUpdateSettings} disabled={saving} className="mt-8 bg-slate-900 rounded-2xl h-12 px-8 font-black uppercase text-[10px] tracking-widest">
                {saving ? <Loader2 className="animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />} Push Global Updates
            </Button>
          </Card>
        </TabsContent>

        {/* AUDIT LOGS TAB (Dynamic) */}
        <TabsContent value="logs" className="mt-6">
          <Card className="p-8 rounded-[2.5rem] border-none shadow-sm bg-white">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center"><History className="text-slate-600 w-6 h-6" /></div>
              <h2 className="text-xl font-black uppercase tracking-tight text-slate-800">System Audit Logs</h2>
            </div>
            <div className="space-y-3">
                {logs.length > 0 ? logs.map((log, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="flex items-center gap-4">
                            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-indigo-600 shadow-sm"><ShieldCheck size={14}/></div>
                            <span className="font-black uppercase text-[10px] text-slate-600 tracking-tight">{log.action_name || log.action}</span>
                        </div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{new Date(log.created_at).toLocaleString()}</span>
                    </div>
                )) : (
                    <p className="text-center text-slate-400 font-black uppercase text-[10px] py-10">No recent activity logs.</p>
                )}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}