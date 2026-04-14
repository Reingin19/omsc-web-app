import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Textarea } from '../../components/ui/textarea';
import { Loader2, Send, CheckCircle, Clock, Trash2, User } from 'lucide-react';
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
      // In-adjust natin ang join para sa 'users' table base sa screenshot mo
      const { data, error } = await supabase
        .from('inquiries')
        .select(`
          *,
          users:student_id (
            full_name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInquiries(data || []);
    } catch (err: any) {
      console.error(err.message);
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
      
      toast({ title: "REPLY SENT", description: "The student has been notified." });
      setReplyText(prev => ({ ...prev, [id]: '' }));
      fetchInquiries();
    } catch (err: any) {
      toast({ variant: "destructive", title: "FAILED", description: err.message });
    } finally {
      setSubmitting(null);
    }
  };

  const deleteInquiry = async (id: string) => {
    if (!confirm("Delete this inquiry?")) return;
    try {
      await supabase.from('inquiries').delete().eq('id', id);
      fetchInquiries();
    } catch (err: any) {
      console.error(err.message);
    }
  };

  if (loading) return (
    <div className="h-[80vh] flex items-center justify-center">
      <Loader2 className="animate-spin text-indigo-600 w-10 h-10" />
    </div>
  );

  return (
    <div className="p-6 space-y-8 animate-in fade-in duration-700">
      <div>
        <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none">
          Student <span className="text-indigo-600">Inquiries</span>
        </h1>
        <p className="text-slate-400 font-black uppercase text-[10px] tracking-[0.3em] mt-2">Counselor Management Portal</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {inquiries.length > 0 ? inquiries.map((iq) => (
          <Card key={iq.id} className="p-8 rounded-[2.5rem] border-none shadow-sm bg-white overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Left Side: Inquiry Details */}
              <div className="lg:col-span-7 space-y-4">
                <div className="flex items-center gap-3">
                  <Badge className={`uppercase font-black text-[9px] px-3 py-1 rounded-full border-none ${
                    iq.status === 'pending' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'
                  }`}>
                    {iq.status}
                  </Badge>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {new Date(iq.created_at).toLocaleDateString()}
                  </span>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-indigo-500" />
                    <p className="text-xs font-black text-indigo-500 uppercase tracking-widest">
                      {iq.users?.full_name || 'Anonymous Student'}
                    </p>
                  </div>
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">{iq.subject}</h3>
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                    <p className="text-slate-600 font-medium leading-relaxed">{iq.message}</p>
                  </div>
                </div>
              </div>

              {/* Right Side: Reply Box */}
              <div className="lg:col-span-5 flex flex-col justify-between gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                    {iq.counselor_reply ? "Counselor Response" : "Write Response"}
                  </label>
                  <Textarea 
                    placeholder="Provide guidance or answer here..."
                    className="bg-slate-50 border-none rounded-2xl min-h-[120px] focus:ring-2 focus:ring-indigo-500/20 p-4 font-medium"
                    value={replyText[iq.id] !== undefined ? replyText[iq.id] : (iq.counselor_reply || '')}
                    onChange={(e) => setReplyText({ ...replyText, [iq.id]: e.target.value })}
                  />
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    onClick={() => handleReply(iq.id)}
                    disabled={submitting === iq.id || !replyText[iq.id]?.trim() && !iq.counselor_reply}
                    className="flex-1 bg-slate-900 hover:bg-indigo-600 text-white rounded-2xl h-12 font-black uppercase text-[10px] tracking-widest shadow-lg transition-all"
                  >
                    {submitting === iq.id ? <Loader2 className="animate-spin w-4 h-4" /> : <Send className="w-4 h-4 mr-2" />}
                    {iq.counselor_reply ? 'Update Reply' : 'Send Reply'}
                  </Button>
                  
                  <Button 
                    variant="outline"
                    onClick={() => deleteInquiry(iq.id)}
                    className="border-slate-100 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-2xl w-12 h-12 flex items-center justify-center"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        )) : (
          <div className="text-center py-20 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
            <p className="text-slate-400 font-black uppercase text-xs tracking-widest">No inquiries found.</p>
          </div>
        )}
      </div>
    </div>
  );
}