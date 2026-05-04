import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase'; 
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from "../../components/ui/label";
import { Textarea } from '../../components/ui/textarea';
import { Badge } from "../../components/ui/badge";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '../../components/ui/select';
import { useToast } from '../../hooks/use-toast';
import { Send, Loader2, BadgeCheck, MessageCircle, History } from 'lucide-react';

interface InquiryData {
  id: string;
  created_at: string;
  category: string;
  subject: string;
  message: string;
  status: string;
  counselor_reply?: string;
  replied_at?: string;
}

async function getCurrentUserId(): Promise<string | null> {
  // 1. Supabase Auth session (pinaka-reliable — set na ito ng bagong LoginPage)
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.id) return session.user.id;
  } catch (e) {
    console.warn("[Auth] getSession failed:", e);
  }

  // 2. localStorage 'user' object fallback
  try {
    const saved = localStorage.getItem('user');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed?.id) return parsed.id;
    }
  } catch (e) {}

  // 3. localStorage 'userId' direct key fallback
  const directId = localStorage.getItem('userId');
  if (directId) return directId;

  return null;
}

export default function Inquiries() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  
  const [category, setCategory] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [myInquiries, setMyInquiries] = useState<InquiryData[]>([]);

  useEffect(() => {
    async function init() {
      const id = await getCurrentUserId();
      setCurrentUserId(id);
      if (!id) { setFetching(false); return; }
      fetchMyInquiries(id);
    }
    init();
  }, []);

  async function fetchMyInquiries(userId: string) {
    try {
      setFetching(true);
      const { data, error } = await supabase
        .from('inquiries')
        .select('*')
        .eq('student_id', userId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setMyInquiries(data || []);
    } catch (error: any) {
      console.error('Error fetching history:', error.message);
    } finally {
      setFetching(false);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!category || !subject || !message) {
      toast({ title: "Validation Error", description: "Please fill up all fields.", variant: "destructive" });
      return;
    }

    if (!currentUserId) {
      toast({ variant: "destructive", title: "SESSION EXPIRED", description: "Please login again to continue." });
      return;
    }

    setLoading(true);
    try {
      const savedUser = localStorage.getItem('user');
      const userObj = savedUser ? JSON.parse(savedUser) : null;
      const userCampus = userObj?.campus || localStorage.getItem('userCampus') || 'San Jose Campus';

      const { error } = await supabase.from('inquiries').insert([{
        student_id: currentUserId,
        category,
        subject,
        message,
        campus: userCampus,
        status: 'pending',
      }]);

      if (error) throw error;

      toast({ title: 'INQUIRY SUBMITTED', description: 'Guidance Counselor will review this soon.' });
      setCategory('');
      setSubject('');
      setMessage('');
      fetchMyInquiries(currentUserId);
    } catch (error: any) {
      toast({ variant: "destructive", title: "SUBMISSION FAILED", description: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-12 animate-in fade-in duration-700 font-sans">
      <div className="border-b-4 border-slate-900 pb-8">
        <h1 className="text-6xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">
          Guidance <span className="text-indigo-600">Line</span>
        </h1>
        <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.4em] mt-4 ml-1 flex items-center gap-2">
          <BadgeCheck className="w-4 h-4 text-emerald-500" /> Direct Communication to San Jose Office
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-5 space-y-8">
          <Card className="p-10 border-none shadow-2xl shadow-indigo-100/50 bg-white rounded-[3.5rem] relative overflow-hidden">
            <div className="relative z-10 space-y-8">
              <div className="flex items-center gap-3 mb-2">
                <MessageCircle className="text-indigo-600 w-6 h-6" />
                <h2 className="text-2xl font-black uppercase italic tracking-tight">New Inquiry</h2>
              </div>

              {!currentUserId && !fetching && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center">
                  <p className="text-red-600 font-black text-xs uppercase tracking-widest">
                    ⚠️ Session not found. Please logout and login again.
                  </p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Category</Label>
                  <Select value={category} onValueChange={setCategory} required>
                    <SelectTrigger className="h-14 bg-slate-50 border-none rounded-2xl font-bold px-6 text-slate-700">
                      <SelectValue placeholder="What is this about?" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-none shadow-2xl">
                      <SelectItem value="Academic">Academic Concerns</SelectItem>
                      <SelectItem value="Career">Career Guidance</SelectItem>
                      <SelectItem value="Mental Health">Mental Health / Wellness</SelectItem>
                      <SelectItem value="Other">Other Concerns</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Subject</Label>
                  <Input placeholder="Short Title..." value={subject} onChange={(e) => setSubject(e.target.value)} required className="h-14 bg-slate-50 border-none rounded-2xl font-bold px-6 focus-visible:ring-2 focus-visible:ring-indigo-100" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Detail</Label>
                  <Textarea placeholder="Describe how we can help..." value={message} onChange={(e) => setMessage(e.target.value)} required className="bg-slate-50 border-none rounded-[2rem] font-medium min-h-[150px] p-6 focus-visible:ring-2 focus-visible:ring-indigo-100 resize-none" />
                </div>
                <Button disabled={loading || !currentUserId} className="w-full h-16 bg-slate-900 hover:bg-indigo-600 text-white rounded-[1.5rem] font-black uppercase text-xs tracking-widest transition-all shadow-xl active:scale-95 disabled:opacity-40">
                  {loading ? <Loader2 className="animate-spin mr-2" /> : <Send className="w-4 h-4 mr-3" />}
                  Submit Request
                </Button>
              </form>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-7 space-y-6">
          <div className="flex items-center gap-3 mb-2 ml-4">
            <History className="text-slate-400 w-5 h-5" />
            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Request History</h3>
          </div>
          <div className="space-y-6 max-h-[800px] overflow-y-auto pr-4 custom-scrollbar">
            {fetching ? (
              <div className="flex flex-col items-center py-20 bg-slate-50 rounded-[3rem]">
                <Loader2 className="animate-spin text-indigo-600 w-8 h-8" />
                <p className="mt-4 text-[10px] font-black uppercase tracking-widest text-slate-300">Syncing History...</p>
              </div>
            ) : myInquiries.length > 0 ? (
              myInquiries.map((inq) => (
                <Card key={inq.id} className="p-8 border-none shadow-sm bg-white rounded-[2.5rem] space-y-6 hover:shadow-xl transition-all border-l-8 border-l-slate-100">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <Badge className="bg-indigo-50 text-indigo-600 hover:bg-indigo-50 border-none rounded-lg px-3 py-1 font-black text-[9px] uppercase tracking-wider">{inq.category}</Badge>
                      <h4 className="text-2xl font-black text-slate-800 uppercase italic tracking-tighter">{inq.subject}</h4>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">Submitted: {new Date(inq.created_at).toLocaleDateString()}</p>
                    </div>
                    <Badge className={`uppercase font-black text-[9px] px-4 py-1.5 rounded-full border-none shadow-sm ${inq.status === 'pending' ? 'bg-amber-400 text-white' : 'bg-emerald-500 text-white'}`}>
                      {inq.status}
                    </Badge>
                  </div>
                  <div className="bg-slate-50 p-6 rounded-[1.5rem] text-slate-600 font-bold leading-relaxed shadow-inner">{inq.message}</div>
                  {inq.counselor_reply ? (
                    <div className="mt-4 pt-6 border-t-2 border-dashed border-slate-100 animate-in slide-in-from-top-2">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center shadow-lg">
                          <BadgeCheck className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-[10px] font-black uppercase text-indigo-600 tracking-[0.2em]">Counselor Feedback</span>
                      </div>
                      <div className="bg-indigo-600 p-6 rounded-[2rem] rounded-tl-none shadow-xl shadow-indigo-100">
                        <p className="text-white font-bold leading-relaxed italic">"{inq.counselor_reply}"</p>
                        {inq.replied_at && (
                          <p className="text-[8px] text-indigo-200 mt-2 uppercase font-black tracking-widest text-right">{new Date(inq.replied_at).toLocaleString()}</p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-slate-50/50 p-4 rounded-2xl flex items-center justify-center gap-3 border border-dashed border-slate-200">
                      <Loader2 className="w-3 h-3 animate-spin text-slate-300" />
                      <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.3em]">Awaiting Counselor Review</p>
                    </div>
                  )}
                </Card>
              ))
            ) : (
              <div className="text-center py-24 bg-slate-50 rounded-[4rem] border-4 border-dashed border-slate-200">
                <MessageCircle className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest italic">No inquiries submitted yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}