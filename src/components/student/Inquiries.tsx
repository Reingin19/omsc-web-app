import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from "../../components/ui/label";
import { Textarea } from '../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { useToast } from '../../hooks/use-toast';
import { MessageSquare, Send, Loader2, Info, Clock, Mail, Phone, BadgeCheck, MessageCircle } from 'lucide-react';

export default function Inquiries() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  
  // Form States
  const [category, setCategory] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  
  // Chat/History State
  const [myInquiries, setMyInquiries] = useState<any[]>([]);

  useEffect(() => {
    fetchMyInquiries();
  }, []);

  async function fetchMyInquiries() {
    try {
      setFetching(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('inquiries')
        .select('*')
        .eq('student_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMyInquiries(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setFetching(false);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { error } = await supabase
        .from('inquiries')
        .insert([
          {
            student_id: user.id,
            category,
            subject,
            message,
            campus: 'San Jose Campus',
            status: 'pending',
          }
        ]);

      if (error) throw error;

      toast({
        title: 'INQUIRY SUBMITTED',
        description: 'Your message has been sent. Check the history below for replies.',
      });

      setCategory('');
      setSubject('');
      setMessage('');
      fetchMyInquiries(); // Refresh list

    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "SUBMISSION FAILED",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700 p-2 pb-20">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">
          Guidance <span className="text-indigo-600">Inquiry</span>
        </h1>
        <p className="text-slate-500 font-medium">
          Direct communication line to the San Jose Campus Guidance Office
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Section */}
        <div className="lg:col-span-2 space-y-8">
          <Card className="p-8 border-none shadow-sm bg-white rounded-[2.5rem] relative overflow-hidden group">
            <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Category</Label>
                  <Select value={category} onValueChange={setCategory} required>
                    <SelectTrigger className="h-12 bg-slate-50 border-none rounded-2xl font-bold">
                      <SelectValue placeholder="Select Category" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-none shadow-xl">
                      <SelectItem value="academic">Academic Concerns</SelectItem>
                      <SelectItem value="career">Career Guidance</SelectItem>
                      <SelectItem value="wellness">Mental Health</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Subject</Label>
                  <Input
                    placeholder="Brief summary"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    required
                    className="h-12 bg-slate-50 border-none rounded-2xl font-bold"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Your Message</Label>
                <Textarea
                  placeholder="How can we help you today?"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  rows={4}
                  className="bg-slate-50 border-none rounded-[1.5rem] font-medium resize-none p-4"
                />
              </div>

              <Button 
                disabled={loading}
                className="w-full h-14 bg-slate-900 hover:bg-indigo-600 text-white rounded-2xl font-black uppercase transition-all shadow-lg active:scale-95"
              >
                {loading ? <Loader2 className="animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                Send Message
              </Button>
            </form>
          </Card>

          {/* Dynamic Conversation History */}
          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 ml-2 flex items-center gap-2">
              <MessageCircle className="w-4 h-4" /> Message History
            </h3>
            
            {fetching ? (
              <div className="flex justify-center p-10"><Loader2 className="animate-spin text-slate-300" /></div>
            ) : myInquiries.length > 0 ? (
              myInquiries.map((inq) => (
                <Card key={inq.id} className="p-6 border-none shadow-sm bg-white rounded-[2rem] space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-black bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-md uppercase mb-2 inline-block">
                        {inq.category}
                      </span>
                      <h4 className="font-black text-slate-800 uppercase tracking-tight">{inq.subject}</h4>
                      <p className="text-xs text-slate-400 font-bold">{new Date(inq.created_at).toLocaleDateString()}</p>
                    </div>
                    <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full ${
                      inq.status === 'pending' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'
                    }`}>
                      {inq.status}
                    </span>
                  </div>
                  
                  <div className="bg-slate-50 p-4 rounded-xl text-sm text-slate-600 font-medium">
                    {inq.message}
                  </div>

                  {/* Counselor Reply Section */}
                  {inq.counselor_reply ? (
                    <div className="mt-4 pl-4 border-l-4 border-indigo-500 space-y-2">
                      <div className="flex items-center gap-2">
                        <BadgeCheck className="w-4 h-4 text-indigo-500" />
                        <span className="text-[10px] font-black uppercase text-indigo-500 tracking-widest">Counselor Response</span>
                      </div>
                      <p className="text-sm text-slate-700 font-bold bg-indigo-50/50 p-4 rounded-xl">
                        {inq.counselor_reply}
                      </p>
                    </div>
                  ) : (
                    <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest text-center pt-2">
                      Waiting for counselor's response...
                    </p>
                  )}
                </Card>
              ))
            ) : (
              <div className="text-center py-10 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200">
                <p className="text-slate-400 font-black uppercase text-xs tracking-widest">No conversations yet.</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card className="p-8 border-none shadow-sm bg-indigo-600 text-white rounded-[2.5rem]">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
                <Info className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-black uppercase tracking-tighter">Office</h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-indigo-200" />
                <p className="font-bold text-sm">guidance.sj@omsc.edu.ph</p>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-indigo-200" />
                <p className="font-bold text-sm">(043) 456-7890</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}