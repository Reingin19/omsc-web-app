import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select"; // Dagdag ito
import { useToast } from '../../hooks/use-toast';
import { 
  Save, 
  Loader2, 
  Globe, 
  User, 
  Key, 
  Camera, 
  History, 
  ShieldCheck,
  MapPin // Icon para sa Campus
} from 'lucide-react';

export default function SystemConfiguration() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [adminProfile, setAdminProfile] = useState({
    id: '',
    name: '',
    email: '',
    role: '',
    student_id: '',
    campus_id: '', // BAGO: Dito ise-save ang campus assignment
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

  const fetchData = async () => {
    setLoading(true);
    try {
      // Mock fetching or replace with your actual Supabase/API calls
      const profileRes = await fetch('http://localhost:3001/admin/profile');
      const profileData = await profileRes.json();
      setAdminProfile(profileData);

      const settingsRes = await fetch('http://localhost:3001/admin/settings');
      const settingsData = await settingsRes.json();
      setSiteConfig(settingsData);

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

  const handleUpdateProfile = async () => {
    setSaving(true);
    try {
      const res = await fetch(`http://localhost:3001/admin/profile/${adminProfile.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(adminProfile)
      });
      if (res.ok) {
        toast({ 
          title: "PROFILE UPDATED", 
          description: `Changes saved. Campus assigned: ${adminProfile.campus_id.toUpperCase()}`,
          className: "bg-emerald-600 text-white font-black rounded-2xl" 
        });
      }
    } catch (err) {
      toast({ variant: "destructive", title: "ERROR", description: "Failed to update profile." });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
        <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest">Synchronizing Configuration...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 p-2">
      <div>
        <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase mb-2">
          System <span className="text-indigo-600">Config</span>
        </h1>
        <p className="text-slate-500 font-medium tracking-tight uppercase text-xs">Manage Administrative Access and Campus Control</p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-white p-1 h-14 rounded-[1.5rem] shadow-sm border border-slate-100">
          <TabsTrigger value="profile" className="rounded-xl font-black uppercase text-[10px] data-[state=active]:bg-indigo-600 data-[state=active]:text-white">Profile</TabsTrigger>
          <TabsTrigger value="branding" className="rounded-xl font-black uppercase text-[10px] data-[state=active]:bg-indigo-600 data-[state=active]:text-white">Settings</TabsTrigger>
          <TabsTrigger value="security" className="rounded-xl font-black uppercase text-[10px] data-[state=active]:bg-indigo-600 data-[state=active]:text-white">Security</TabsTrigger>
          <TabsTrigger value="logs" className="rounded-xl font-black uppercase text-[10px] data-[state=active]:bg-indigo-600 data-[state=active]:text-white">Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* LEFT: Profile Overview Card */}
            <Card className="p-8 rounded-[2.5rem] border-none shadow-sm bg-white flex flex-col items-center text-center">
                <div className="relative group">
                    <img src={adminProfile.avatar_url} className="w-32 h-32 rounded-[2.5rem] object-cover ring-4 ring-indigo-50" alt="Admin" />
                </div>
                <h2 className="mt-6 font-black text-xl text-slate-800 uppercase tracking-tight">{adminProfile.name}</h2>
                <div className="flex flex-col gap-2 mt-3">
                  <p className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-4 py-1 rounded-full uppercase tracking-widest">{adminProfile.role}</p>
                  {/* BAGO: Campus Badge */}
                  <div className="flex items-center justify-center gap-1 text-[10px] font-black text-slate-500 bg-slate-100 px-4 py-1 rounded-full uppercase">
                    <MapPin size={10} />
                    {adminProfile.campus_id || 'No Campus Assigned'}
                  </div>
                </div>
                
                <div className="w-full border-t border-slate-50 mt-8 pt-8 space-y-4 text-[10px] font-black uppercase">
                    <div className="flex justify-between"><span className="text-slate-400">Employee ID</span><span className="text-slate-700">{adminProfile.student_id}</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">Security Access</span><span className="text-emerald-500">Tier 1 Admin</span></div>
                </div>
            </Card>

            {/* RIGHT: Edit Details Card */}
            <Card className="lg:col-span-2 p-8 rounded-[2.5rem] border-none shadow-sm bg-white">
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center"><User className="text-indigo-600 w-5 h-5" /></div>
                    <h2 className="text-lg font-black uppercase tracking-tight">Account & Campus Assignment</h2>
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

                    {/* BAGO: Campus Assignment Dropdown */}
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase ml-2 text-slate-400">Campus Assignment</Label>
                        <Select 
                          value={adminProfile.campus_id} 
                          onValueChange={(value) => setAdminProfile({...adminProfile, campus_id: value})}
                        >
                          <SelectTrigger className="rounded-2xl h-12 bg-slate-50 border-none font-bold">
                            <SelectValue placeholder="Select Campus" />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl border-none shadow-xl">
                            <SelectItem value="san-jose" className="font-bold uppercase text-[10px]">San Jose Campus</SelectItem>
                            <SelectItem value="sablayan" className="font-bold uppercase text-[10px]">Sablayan Campus</SelectItem>
                            <SelectItem value="mamburao" className="font-bold uppercase text-[10px]">Mamburao Campus</SelectItem>
                            <SelectItem value="labangan" className="font-bold uppercase text-[10px]">Labangan Campus</SelectItem>
                            <SelectItem value="lubang" className="font-bold uppercase text-[10px]">Lubang Campus</SelectItem>
                          </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2 md:col-span-2">
                        <Label className="text-[10px] font-black uppercase ml-2 text-slate-400">Email Address</Label>
                        <Input 
                          value={adminProfile.email} 
                          onChange={(e) => setAdminProfile({...adminProfile, email: e.target.value})}
                          className="rounded-2xl h-12 bg-slate-50 border-none font-bold" 
                        />
                    </div>
                </div>

                <Button onClick={handleUpdateProfile} disabled={saving} className="mt-8 bg-indigo-600 hover:bg-indigo-700 rounded-2xl h-14 px-10 font-black uppercase text-[11px] tracking-widest transition-all">
                    {saving ? <Loader2 className="animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />} Sync Account Configuration
                </Button>
            </Card>
          </div>
        </TabsContent>

        {/* ... (Keep other tabs same as your previous code) ... */}
      </Tabs>
    </div>
  );
}