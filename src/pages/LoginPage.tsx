import { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { 
  GraduationCap, Loader2, UserPlus, ArrowLeft, ShieldCheck, 
  X, Check, Mail, Lock, Fingerprint, 
  MapPin, BookOpen, UserCircle 
} from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import { supabase } from '../lib/supabase';

type UserRole = 'student' | 'counselor' | 'admin';

interface LoginPageProps {
  onLogin: (role: UserRole, name: string) => void;
  onBackToHome: () => void;
}

export default function LoginPage({ onLogin, onBackToHome }: LoginPageProps) {
  const [isRegister, setIsRegister] = useState(false);
  const [showTerms, setShowTerms] = useState(false); 
  const [agreed, setAgreed] = useState(false); 
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [studentId, setStudentId] = useState(''); 
  const [campus, setCampus] = useState('San Jose Campus');
  const [program, setProgram] = useState('');
  const [yearLevel, setYearLevel] = useState('1');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('Male');
  const [isIndigenous, setIsIndigenous] = useState('No');
  const [isPwd, setIsPwd] = useState('No');
  
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('logout') === 'success') {
      toast({
        title: "LOGOUT SUCCESSFULLY",
        description: "You have been securely signed out of your account.",
        className: "bg-indigo-600 text-white font-black border-none rounded-2xl shadow-2xl py-6",
      });
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }
  }, [toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!agreed) {
      toast({ variant: "destructive", title: "ACTION REQUIRED", description: "Please agree to the Terms and Conditions to proceed." });
      return;
    }

    if (isRegister && password !== confirmPassword) {
      toast({ variant: "destructive", title: "Error", description: "Passwords do not match" });
      return;
    }

    setIsLoading(true);
    
    const endpoint = isRegister ? 'http://localhost:3001/register' : 'http://localhost:3001/login';
    
    const payload = isRegister 
      ? { 
          name, email, password, 
          role: 'student' as UserRole,
          campus, studentId, program, yearLevel, age, gender, isIndigenous, isPwd,
          status: 'active'
        } 
      : { email, password };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      
      if (response.ok) {
        if (isRegister) {
          toast({ title: "SUCCESS", description: "Student account created! You can now login.", className: "bg-emerald-600 text-white font-black rounded-2xl" });
          setIsRegister(false);
          setAgreed(false);
        } else {
          // ─── BAGONG STEP: I-set ang Supabase Auth session ─────────────────
          // Ibinabalik na ng Express ang access_token at refresh_token
          if (data.access_token && data.refresh_token) {
            const { error: sessionError } = await supabase.auth.setSession({
              access_token: data.access_token,
              refresh_token: data.refresh_token,
            });

            if (sessionError) {
              console.warn("⚠️ Could not set Supabase session:", sessionError.message);
              // Hindi i-block ang login kahit may session error
            } else {
              console.log("✅ Supabase Auth session set successfully");
            }
          } else {
            console.warn("⚠️ No tokens returned from server — Supabase session not set.");
          }

          // I-save sa localStorage (same as before)
          localStorage.setItem("userId", data.id);
          localStorage.setItem("userName", data.name);
          localStorage.setItem("userRole", data.role);
          localStorage.setItem("userCampus", data.campus || "San Jose Campus");
          localStorage.setItem('user', JSON.stringify({
            id: data.id, 
            email: data.email,
            name: data.name,
            role: data.role,
            campus: data.campus || campus
          }));

          // Log usage
          try {
            const { data: logEntry, error } = await supabase
              .from('usage_logs')
              .insert([{ 
                user_id: data.id, 
                login_at: new Date().toISOString() 
              }])
              .select()
              .single();

            if (logEntry) {
              localStorage.setItem("currentSessionLogId", logEntry.id);
            }
            if (error) console.error("Usage log error:", error.message);
          } catch (err) { 
            console.error("Critical: Failed to initialize usage log", err); 
          }

          toast({ 
            title: "WELCOME", 
            description: `Access Granted! Hello, ${data.name}.`, 
            className: "bg-indigo-600 text-white font-black rounded-2xl shadow-2xl" 
          });
          
          onLogin(data.role, data.name);
        }
      } else {
        toast({ variant: "destructive", title: "ERROR", description: data.message });
      }
    } catch (error) {
      toast({ variant: "destructive", title: "SERVER ERROR", description: "Backend is unreachable." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 overflow-y-auto relative py-12">
      
      {showTerms && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowTerms(false)} />
          <Card className="relative w-full max-w-lg bg-white rounded-[3rem] shadow-2xl overflow-hidden border-none animate-in zoom-in-95 duration-300">
            <div className="p-8 md:p-10">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-50 rounded-2xl flex items-center justify-center">
                    <ShieldCheck className="text-indigo-600 w-6 h-6" />
                  </div>
                  <h2 className="text-2xl font-black uppercase tracking-tighter text-slate-800">Legal Policy</h2>
                </div>
                <button onClick={() => setShowTerms(false)} className="text-slate-300 hover:text-slate-600 transition-colors"><X className="w-6 h-6" /></button>
              </div>
              <div className="space-y-4 text-sm font-medium text-slate-500 max-h-[300px] overflow-y-auto pr-2 mb-8 leading-relaxed custom-scrollbar">
                <p><span className="text-indigo-600 font-black">01. CONFIDENTIALITY:</span> All information shared within the OMSC Guidance System is strictly confidential under the Data Privacy Act of 2012.</p>
                <p><span className="text-indigo-600 font-black">02. ROLE ACCESS:</span> Counselors and Admins must handle student data with integrity.</p>
                <p><span className="text-indigo-600 font-black">03. ACCURACY:</span> You certify that all details provided are true and correct.</p>
              </div>
              <Button onClick={() => { setAgreed(true); setShowTerms(false); }} className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black uppercase transition-all">
                I Agree to Terms
              </Button>
            </div>
          </Card>
        </div>
      )}

      <Card className="w-full max-w-lg p-10 shadow-2xl bg-white rounded-[3.5rem] border-none relative overflow-hidden group">
        
        <button onClick={onBackToHome} className="absolute left-10 top-10 flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 hover:text-indigo-600 transition-colors z-20">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </button>

        <div className="flex flex-col items-center mb-8 mt-10">
          <div className="w-20 h-20 bg-indigo-600 rounded-[2rem] flex items-center justify-center mb-4 shadow-xl shadow-indigo-100">
            {isRegister ? <UserPlus className="w-10 h-10 text-white" /> : <GraduationCap className="w-10 h-10 text-white" />}
          </div>
          <h1 className="text-3xl font-black uppercase tracking-tighter text-slate-900 leading-none text-center">
            {isRegister ? "Student Registration" : "Portal Sign In"}
          </h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase mt-2 tracking-widest text-center">
            {isRegister ? "Create your student account" : "Unified access for Students, Counselors & Admins"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister ? (
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar p-1">
              <div className="space-y-1">
                <Label className="text-[10px] font-black uppercase ml-2 text-slate-400">Full Name (FN, MI, LN)</Label>
                <div className="relative">
                  <UserCircle className="absolute left-4 top-3.5 w-5 h-5 text-slate-300" />
                  <Input className="pl-12 rounded-2xl bg-slate-50 border-none h-12 font-bold" placeholder="Juan Dela Cruz" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-black uppercase ml-2 text-slate-400">Student ID Number</Label>
                <div className="relative">
                  <Fingerprint className="absolute left-4 top-3.5 w-5 h-5 text-slate-300" />
                  <Input className="pl-12 rounded-2xl bg-slate-50 border-none h-12 font-bold" placeholder="2024-XXXXX" value={studentId} onChange={(e) => setStudentId(e.target.value)} required />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-black uppercase ml-2 text-slate-400">Institutional Email</Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-3.5 w-5 h-5 text-slate-300" />
                  <Input className="pl-12 rounded-2xl bg-slate-50 border-none h-12 font-bold" type="email" placeholder="user@omsc.edu.ph" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-black uppercase ml-2 text-slate-400">Primary Campus</Label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-3.5 w-5 h-5 text-slate-300 z-10" />
                  <Select value={campus} onValueChange={setCampus}>
                    <SelectTrigger className="pl-12 rounded-2xl bg-slate-50 border-none h-12 font-black uppercase text-xs tracking-tighter"><SelectValue /></SelectTrigger>
                    <SelectContent className="rounded-2xl border-none shadow-2xl">
                      <SelectItem value="San Jose Campus">San Jose Campus</SelectItem>
                      <SelectItem value="Labangan Campus">Labangan Campus</SelectItem>
                      <SelectItem value="Murtha Campus">Murtha Campus</SelectItem>
                      <SelectItem value="Mamburao Campus">Mamburao Campus</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-[10px] font-black uppercase ml-2 text-slate-400 tracking-tighter">Academic Program</Label>
                  <div className="relative">
                    <BookOpen className="absolute left-4 top-3.5 w-5 h-5 text-slate-300" />
                    <Input className="pl-12 rounded-2xl bg-slate-50 border-none h-12 font-bold uppercase text-[10px]" placeholder="BSIT" value={program} onChange={(e) => setProgram(e.target.value)} required />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-black uppercase ml-2 text-slate-400 tracking-tighter">Year Level</Label>
                  <Select value={yearLevel} onValueChange={setYearLevel}>
                    <SelectTrigger className="rounded-2xl bg-slate-50 border-none h-12 font-bold uppercase text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent className="rounded-xl border-none shadow-xl">
                      <SelectItem value="1">1st Year</SelectItem>
                      <SelectItem value="2">2nd Year</SelectItem>
                      <SelectItem value="3">3rd Year</SelectItem>
                      <SelectItem value="4">4th Year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-[10px] font-black uppercase ml-2 text-slate-400">Age</Label>
                  <Input className="rounded-2xl bg-slate-50 border-none h-12 font-bold" type="number" value={age} onChange={(e) => setAge(e.target.value)} required />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-black uppercase ml-2 text-slate-400">Gender</Label>
                  <Select value={gender} onValueChange={setGender}>
                    <SelectTrigger className="rounded-2xl bg-slate-50 border-none h-12 font-black uppercase text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent className="rounded-xl"><SelectItem value="Male">Male</SelectItem><SelectItem value="Female">Female</SelectItem></SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-[10px] font-black uppercase ml-2 text-slate-400 tracking-tighter">Indigenous Group?</Label>
                  <Select value={isIndigenous} onValueChange={setIsIndigenous}>
                    <SelectTrigger className="rounded-2xl bg-slate-50 border-none h-12 font-bold uppercase text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="Yes">Yes</SelectItem><SelectItem value="No">No</SelectItem></SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-black uppercase ml-2 text-slate-400 tracking-tighter">Person with Disability?</Label>
                  <Select value={isPwd} onValueChange={setIsPwd}>
                    <SelectTrigger className="rounded-2xl bg-slate-50 border-none h-12 font-bold uppercase text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="Yes">Yes</SelectItem><SelectItem value="No">No</SelectItem></SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-black uppercase ml-2 text-slate-400">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-3.5 w-5 h-5 text-slate-300" />
                  <Input className="pl-12 rounded-2xl bg-slate-50 border-none h-12" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-black uppercase ml-2 text-slate-400">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-3.5 w-5 h-5 text-slate-300" />
                  <Input className="pl-12 rounded-2xl bg-slate-50 border-none h-12" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="space-y-1">
                <Label className="text-[10px] font-black uppercase ml-2 text-slate-400 tracking-[0.2em]">Institutional Email</Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-4 w-6 h-6 text-slate-300" />
                  <Input className="pl-14 rounded-2xl bg-slate-50 border-none h-16 font-bold text-lg" type="email" placeholder="email@omsc.edu.ph" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-black uppercase ml-2 text-slate-400 tracking-[0.2em]">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-4 w-6 h-6 text-slate-300" />
                  <Input className="pl-14 rounded-2xl bg-slate-50 border-none h-16 font-bold text-lg" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center space-x-3 p-4 bg-slate-50 rounded-[1.5rem] border border-slate-100 mt-2">
            <div className="relative flex items-center">
              <input id="terms" type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="peer h-6 w-6 cursor-pointer appearance-none rounded-lg border-2 border-slate-300 bg-white checked:bg-indigo-600 checked:border-indigo-600 transition-all duration-300" />
              <Check className="absolute h-4 w-4 text-white opacity-0 peer-checked:opacity-100 pointer-events-none top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transition-opacity font-black" />
            </div>
            <label htmlFor="terms" className="text-[10px] font-black text-slate-500 uppercase cursor-pointer select-none">
              I agree to the <button type="button" onClick={() => setShowTerms(true)} className="text-indigo-600 hover:underline">Guidance Terms & Policy</button>
            </label>
          </div>

          <Button type="submit" className="w-full h-16 bg-slate-900 hover:bg-indigo-600 text-white rounded-[1.5rem] font-black uppercase tracking-widest transition-all shadow-xl shadow-slate-200 hover:shadow-indigo-100 active:scale-95 disabled:opacity-50" disabled={isLoading}>
            {isLoading ? <Loader2 className="animate-spin" /> : (isRegister ? `Register Student` : `Login to Portal`)}
          </Button>
        </form>

        <p className="mt-8 text-center text-[10px] font-black uppercase tracking-widest text-slate-400">
          {isRegister ? "Already have a student account? " : "New student? "}
          <button onClick={() => { setIsRegister(!isRegister); setAgreed(false); }} className="text-indigo-600 hover:underline ml-1 uppercase">
            {isRegister ? "Login here" : "Register here"}
          </button>
        </p>
      </Card>
    </div>
  );
}