import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Textarea } from '../../components/ui/textarea';
import { Loader2, Send, Clock, Trash2, User, MessageCircle } from 'lucide-react';
import { useToast } from '../../hooks/use-toast';

export default function InquiryManager() {
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState<{ [key: string]: string }>({});
  const [submitting, setSubmitting] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchInquiries();
  }, []);

  async function fetchInquiries() {
    try {
      setLoading(true);
      
      // 1. Kunin ang inquiries
      const { data: inqData, error: inqError } = await supabase
        .from('inquiries')
        .select('*')
        .order('created_at', { ascending: false });

      if (inqError) throw inqError;

      // 2. Kunin ang users para sa manual merging (iwas data-type mismatch error)
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, name');

      if (userError) throw userError;

      // 3. Merge data
      const merged = (inqData || []).map(iq => {
        const student = userData?.find(u => String(u.id) === String(iq.student_id));
        return {
          ...iq,
          studentName: student ? student.name : `ID: ${iq.student_id}`
        };
      });

      setInquiries(merged);
    } catch (err: any) {
      console.error(err.message);
      toast({ variant: "destructive", title: "Error", description: "Could not load inquiries." });
    } finally {
      setLoading(false);
    }
  }

  const handleReply = async (id: string) => {
    if (!replyText[id]?.trim()) return;

    try {
      setSubmitting(id);
      const { error } = await supabase
        .from('inquiries')
        .update({ 
          counselor_reply: replyText[id],
          status: 'resolved',
          replied_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
      
      toast({ title: "REPLY SENT", description: "The student has been answered." });
      setReplyText(prev => ({ ...prev, [id]: '' }));
      fetchInquiries();
    } catch (err: any) {
      toast({ variant: "destructive", title: "FAILED", description: err.message });
    } finally {
      setSubmitting(null);
    }
  };

  const deleteInquiry = async (id: string) => {
    if (!confirm("Delete this conversation?")) return;
    try {
      await supabase.from('inquiries').delete().eq('id', id);
      fetchInquiries();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: "Delete failed." });
    }
  };

  if (loading) return (
    <div className="h-[80vh] flex flex-col items-center justify-center">
      <Loader2 className="animate-spin text-indigo-600 w-12 h-12" />
      <p className="mt-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Loading Conversations...</p>
    </div>
  );

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-10 animate-in fade-in duration-700 font-sans">
      {/* Header Section */}
      <div className="flex justify-between items-end border-b-4 border-slate-900 pb-6">
        <div>
          <h1 className="text-6xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">
            Inquiry <span className="text-indigo-600">Inbox</span>
          </h1>
          <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.4em] mt-3 ml-1">Student Guidance Messaging</p>
        </div>
        <div className="hidden md:block">
            <Badge className="bg-slate-900 text-white px-4 py-2 rounded-xl font-black text-xs">
                {inquiries.filter(i => i.status === 'pending').length} PENDING
            </Badge>
        </div>
      </div>

      <div className="space-y-6">
        {inquiries.length > 0 ? inquiries.map((iq) => (
          <Card key={iq.id} className="p-0 rounded-[3rem] border-none shadow-2xl shadow-slate-200/50 bg-white overflow-hidden group transition-all hover:scale-[1.01]">
            <div className="flex flex-col">
              
              {/* Header: Student Info */}
              <div className="bg-slate-900 p-6 flex justify-between items-center text-white">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-500 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                    <User className="text-white w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-lg font-black uppercase italic tracking-tight">{iq.studentName}</h4>
                    <p className="text-[9px] font-bold text-indigo-300 uppercase tracking-widest flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {new Date(iq.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                <Badge className={`uppercase font-black text-[9px] px-4 py-1.5 rounded-full border-none shadow-sm ${
                  iq.status === 'pending' ? 'bg-amber-400 text-white' : 'bg-emerald-500 text-white'
                }`}>
                  {iq.status}
                </Badge>
              </div>

              <div className="p-8 space-y-6">
                {/* Student's Message (Left Bubble Style) */}
                <div className="space-y-2 max-w-[85%]">
                  <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">
                    <MessageCircle className="w-3 h-3" /> Subject: {iq.subject}
                  </div>
                  <div className="bg-slate-50 p-6 rounded-[2rem] rounded-tl-none border border-slate-100 shadow-inner">
                    <p className="text-slate-700 font-bold leading-relaxed">{iq.message}</p>
                  </div>
                </div>

                {/* Counselor's Reply Section */}
                <div className="space-y-4 pt-4 border-t border-dashed border-slate-100">
                  <div className="flex flex-col gap-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-indigo-600 flex items-center gap-2 ml-2">
                      <div className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse" />
                      {iq.counselor_reply ? "Current Response" : "Your Guidance"}
                    </label>
                    <Textarea 
                      placeholder="Type your response to the student..."
                      className="bg-white border-2 border-slate-100 rounded-[2rem] min-h-[100px] focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 p-6 font-bold text-slate-800 transition-all"
                      value={replyText[iq.id] !== undefined ? replyText[iq.id] : (iq.counselor_reply || '')}
                      onChange={(e) => setReplyText({ ...replyText, [iq.id]: e.target.value })}
                    />
                  </div>
                  
                  <div className="flex gap-3">
                    <Button 
                      onClick={() => handleReply(iq.id)}
                      disabled={submitting === iq.id || (!replyText[iq.id]?.trim() && !iq.counselor_reply)}
                      className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl h-14 font-black uppercase text-xs tracking-widest shadow-xl shadow-indigo-200 transition-all active:scale-95"
                    >
                      {submitting === iq.id ? <Loader2 className="animate-spin w-5 h-5" /> : <Send className="w-4 h-4 mr-3" />}
                      {iq.counselor_reply ? 'Update Guidance' : 'Send Guidance'}
                    </Button>
                    
                    <Button 
                      variant="outline"
                      onClick={() => deleteInquiry(iq.id)}
                      className="border-slate-100 text-slate-300 hover:text-red-500 hover:bg-red-50 hover:border-red-100 rounded-2xl w-14 h-14 transition-all"
                    >
                      <Trash2 className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              </div>

            </div>
          </Card>
        )) : (
          <div className="text-center py-32 bg-slate-50 rounded-[4rem] border-4 border-dashed border-slate-200">
            <MessageCircle className="w-16 h-16 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-400 font-black uppercase text-sm tracking-widest italic">Your inbox is empty.</p>
          </div>
        )}
      </div>
    </div>
  );
}