import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { 
  Plus, Edit, Trash2, Save, Loader2, 
  ChevronLeft, ClipboardList, Trash, Type, List, X, Hash, Rocket, EyeOff, CheckCircle2
} from 'lucide-react';
import { useToast } from '../../hooks/use-toast';
import { Input } from "../../components/ui/input";
import { 
  Dialog, DialogContent, DialogHeader, 
  DialogTitle, DialogTrigger 
} from "../../components/ui/dialog";

export default function SurveyBuilder() {
  const { toast } = useToast();
  const [surveys, setSurveys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Editor States
  const [editingSurvey, setEditingSurvey] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Modal Creation States
  const [newTitle, setNewTitle] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Response Viewer States
  const [viewingResponses, setViewingResponses] = useState<any>(null);
  const [responses, setResponses] = useState<any[]>([]);
  const [loadingResponses, setLoadingResponses] = useState(false);

  useEffect(() => {
    fetchSurveys();
  }, []);

  async function fetchSurveys() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('surveys')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setSurveys(data || []);
    } catch (err: any) {
      toast({ title: "Database Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  const fetchResponses = async (survey: any) => {
    try {
      setLoadingResponses(true);
      setViewingResponses(survey);
      
      const { data: resData, error: resError } = await supabase
        .from('survey_responses')
        .select('*')
        .eq('survey_id', survey.id)
        .order('created_at', { ascending: false });

      if (resError) throw resError;

      const { data: userData } = await supabase.from('users').select('id, name');

      const mergedData = (resData || []).map(res => {
        const student = userData?.find(u => String(u.id) === String(res.user_id));
        return {
          ...res,
          studentName: student ? student.name : `Student ID: ${res.user_id}`
        };
      });

      setResponses(mergedData);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoadingResponses(false);
    }
  };

  const toggleSurveyStatus = async (survey: any) => {
    const newStatus = survey.status === 'active' ? 'draft' : 'active';
    try {
      const { error } = await supabase.from('surveys').update({ status: newStatus }).eq('id', survey.id);
      if (error) throw error;
      fetchSurveys();
      toast({ title: `Survey is now ${newStatus === 'active' ? 'Open' : 'Closed'}` });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const saveSurveyContent = async () => {
    try {
      setIsSaving(true);
      const { error } = await supabase
        .from('surveys')
        .update({ questions_data: questions })
        .eq('id', editingSurvey.id);
      if (error) throw error;
      toast({ title: "Survey Updated Successfully!" });
      setEditingSurvey(null);
      fetchSurveys();
    } finally {
      setIsSaving(false);
    }
  };

  const deleteSurvey = async (id: number) => {
    if (!confirm("Sigurado ka bang buburahin ito?")) return;
    await supabase.from('surveys').delete().eq('id', id);
    fetchSurveys();
  };

  // --- RE-STYLED EDITOR VIEW (Mas colorful, hindi puro puti) ---
  if (editingSurvey) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans animate-in fade-in duration-500">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Editor Header Card */}
          <div className="bg-gradient-to-r from-indigo-700 via-purple-700 to-indigo-800 p-10 rounded-[3rem] shadow-2xl text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -translate-y-10 translate-x-10" />
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <Button variant="ghost" onClick={() => setEditingSurvey(null)} className="text-indigo-100 hover:text-white hover:bg-white/10 rounded-xl mb-4 p-0 font-bold uppercase text-[10px] tracking-widest">
                  <ChevronLeft className="mr-2 h-4 w-4" /> Back to Dashboard
                </Button>
                <h2 className="text-4xl font-black uppercase italic tracking-tighter">{editingSurvey.title}</h2>
                <p className="text-indigo-200 text-[10px] font-black uppercase mt-2 tracking-[0.3em]">Editor Mode • Real-time Drafting</p>
              </div>
              <Button onClick={saveSurveyContent} disabled={isSaving} className="bg-white text-indigo-900 hover:bg-indigo-50 h-16 px-10 rounded-[2rem] font-black uppercase text-xs shadow-xl transition-all">
                {isSaving ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />}
                Save Survey
              </Button>
            </div>
          </div>

          {/* Questions Area */}
          <div className="space-y-6 pb-24">
            {questions.map((q, qIdx) => (
              <Card key={q.id} className="p-8 md:p-12 rounded-[3.5rem] border-none shadow-xl shadow-indigo-100/50 bg-white relative hover:ring-2 hover:ring-indigo-400/20 transition-all">
                <div className="flex justify-between items-center mb-8">
                  <div className="flex items-center gap-4">
                    <span className="w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center font-black">{qIdx + 1}</span>
                    <div className="flex gap-1 bg-slate-100 p-1.5 rounded-2xl">
                      {['mcq', 'scale', 'text'].map((type) => (
                        <Button 
                          key={type}
                          variant={q.type === type ? 'secondary' : 'ghost'} 
                          size="sm" 
                          className={`rounded-xl text-[10px] font-black uppercase h-8 ${q.type === type ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400'}`}
                          onClick={() => {
                            const newQ = [...questions];
                            newQ[qIdx].type = type;
                            if (type === 'mcq' && !newQ[qIdx].options) newQ[qIdx].options = ['Option 1'];
                            setQuestions(newQ);
                          }}
                        >
                          {type}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <Button variant="ghost" onClick={() => setQuestions(questions.filter(item => item.id !== q.id))} className="text-red-300 hover:text-red-500 rounded-full h-10 w-10 p-0">
                    <Trash2 className="h-5 w-5" />
                  </Button>
                </div>

                <Input 
                  value={q.text}
                  onChange={(e) => {
                    const newQ = [...questions];
                    newQ[qIdx].text = e.target.value;
                    setQuestions(newQ);
                  }}
                  className="text-xl md:text-2xl font-black mb-8 border-none bg-slate-50 h-16 md:h-20 rounded-3xl px-8 focus-visible:ring-4 focus-visible:ring-indigo-100"
                  placeholder="Isulat ang iyong katanungan dito..."
                />

                {q.type === 'mcq' && (
                  <div className="space-y-3 pl-4 border-l-4 border-indigo-100">
                    {q.options?.map((opt: string, oIdx: number) => (
                      <div key={oIdx} className="flex items-center gap-3 group">
                        <Input value={opt} onChange={(e) => {
                            const newQ = [...questions];
                            newQ[qIdx].options[oIdx] = e.target.value;
                            setQuestions(newQ);
                          }}
                          className="border-none bg-indigo-50/50 hover:bg-indigo-50 rounded-2xl h-12 px-6 font-bold text-slate-700 transition-colors"
                        />
                        <button onClick={() => {
                            const newQ = [...questions];
                            newQ[qIdx].options.splice(oIdx, 1);
                            setQuestions(newQ);
                        }} className="opacity-0 group-hover:opacity-100 text-red-400 hover:scale-110 transition-all"><X className="w-5 h-5"/></button>
                      </div>
                    ))}
                    <Button variant="ghost" className="text-indigo-600 font-black uppercase text-[10px] mt-4" 
                      onClick={() => {
                        const newQ = [...questions];
                        newQ[qIdx].options.push(`New Option`);
                        setQuestions(newQ);
                      }}>+ Add Option</Button>
                  </div>
                )}
                {q.type === 'scale' && <div className="p-6 bg-slate-50 rounded-3xl text-center font-black text-slate-400 uppercase text-[10px]">Scale 1-5 Enabled</div>}
                {q.type === 'text' && <div className="p-6 bg-slate-50 rounded-3xl text-center font-black text-slate-400 uppercase text-[10px]">Text Response Enabled</div>}
              </Card>
            ))}
            
            <Button 
              variant="outline" 
              onClick={() => setQuestions([...questions, { id: Date.now(), text: '', type: 'mcq', options: ['Option 1'] }])}
              className="w-full h-24 border-dashed border-4 rounded-[3.5rem] border-slate-200 text-slate-400 hover:border-indigo-300 hover:text-indigo-500 hover:bg-indigo-50 transition-all font-black uppercase text-xs"
            >
              <Plus className="mr-3 h-6 w-6" /> Magdagdag ng bagong katanungan
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // --- DASHBOARD VIEW ---
  return (
    <div className="p-6 md:p-12 max-w-7xl mx-auto space-y-10 font-sans animate-in fade-in duration-700">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 bg-white p-10 md:p-14 rounded-[4rem] border border-slate-100 shadow-sm">
        <div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-slate-900 uppercase italic leading-none">Survey <span className="text-indigo-600">Hub</span></h1>
          <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.4em] mt-4">Management & Response Tracking</p>
        </div>
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-indigo-600 text-white hover:bg-indigo-700 h-20 px-12 rounded-[2.5rem] font-black uppercase text-sm tracking-widest shadow-2xl shadow-indigo-200 transition-all active:scale-95">
              <Plus className="mr-3 h-6 w-6" /> Create New
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-[3rem] p-12 border-none">
            <DialogHeader><DialogTitle className="text-3xl font-black uppercase text-slate-900 italic">New Survey</DialogTitle></DialogHeader>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const title = formData.get('title') as string;
              if (title) {
                // handleCreate logic integrated
                supabase.from('surveys').insert([{ title, status: 'draft', questions_data: [] }]).then(() => {
                  fetchSurveys();
                  setIsModalOpen(false);
                });
              }
            }} className="space-y-6 pt-6">
              <Input name="title" placeholder="Anong pamagat ng survey?" className="h-16 rounded-2xl bg-slate-50 border-none px-8 font-bold text-xl" required />
              <Button type="submit" className="w-full bg-slate-900 hover:bg-indigo-600 rounded-2xl h-16 font-black uppercase text-white shadow-lg transition-all">Gawa na!</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {surveys.map(survey => (
          <Card key={survey.id} className="p-10 rounded-[4rem] border-none shadow-sm hover:shadow-2xl transition-all duration-500 bg-white relative group">
            <div className="flex justify-between items-start mb-8">
              <div className={`px-5 py-2 rounded-full text-[9px] font-black uppercase flex items-center gap-2 ${survey.status === 'active' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                {survey.status === 'active' ? <Rocket className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                {survey.status}
              </div>
              <div className="flex gap-2">
                <button onClick={() => fetchResponses(survey)} className="p-3 bg-slate-50 rounded-2xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all"><ClipboardList className="w-5 h-5"/></button>
                <button onClick={() => { setEditingSurvey(survey); setQuestions(survey.questions_data || []); }} className="p-3 bg-slate-50 rounded-2xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all"><Edit className="w-5 h-5"/></button>
                <button onClick={() => deleteSurvey(survey.id)} className="p-3 bg-slate-50 rounded-2xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"><Trash2 className="w-5 h-5"/></button>
              </div>
            </div>
            
            <h3 className="text-3xl font-black text-slate-900 uppercase italic tracking-tighter mb-8 leading-tight">{survey.title}</h3>
            
            <div className="flex items-center justify-between bg-slate-50 p-6 rounded-[2.5rem]">
              <div>
                <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Survey Status</p>
                <p className={`text-xs font-black uppercase ${survey.status === 'active' ? 'text-emerald-600' : 'text-slate-500'}`}>
                  {survey.status === 'active' ? 'Accepting Entries' : 'Closed'}
                </p>
              </div>
              
              {/* --- CUSTOM CSS TOGGLE (No external Switch needed) --- */}
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={survey.status === 'active'} 
                  onChange={() => toggleSurveyStatus(survey)}
                  className="sr-only peer" 
                />
                <div className="w-14 h-8 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>
          </Card>
        ))}
      </div>

      {/* --- RESPONSES MODAL (Proper Alignment per Person) --- */}
      <Dialog open={!!viewingResponses} onOpenChange={(open) => { if(!open) setViewingResponses(null); }}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden rounded-[4rem] p-0 border-none bg-slate-50">
          <div className="flex flex-col h-full">
            <div className="p-10 md:p-14 bg-white border-b border-slate-100 flex justify-between items-center">
              <div>
                <h2 className="text-4xl font-black uppercase italic tracking-tighter text-slate-900">{viewingResponses?.title}</h2>
                <p className="text-indigo-500 font-bold uppercase text-[10px] tracking-widest mt-2">Individual Submissions</p>
              </div>
              <div className="h-16 w-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-black text-2xl">
                {responses.length}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-10">
              {responses.length === 0 ? (
                <div className="text-center py-24 bg-white rounded-[3rem] border-4 border-dashed border-slate-100">
                  <p className="text-slate-300 font-black uppercase text-xs italic tracking-widest">No entries found yet.</p>
                </div>
              ) : (
                responses.map((res: any) => (
                  <Card key={res.id} className="overflow-hidden rounded-[3.5rem] border-none shadow-xl shadow-indigo-100/30 bg-white">
                    {/* Submission Header per Person */}
                    <div className="bg-slate-900 p-8 md:p-10 text-white flex flex-col md:flex-row justify-between md:items-center gap-6">
                      <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center text-3xl font-black italic">
                          {res.studentName[0]}
                        </div>
                        <div>
                          <h4 className="text-2xl font-black uppercase italic leading-none">{res.studentName}</h4>
                          <p className="text-indigo-400 font-bold text-[10px] uppercase tracking-widest mt-2">Submitted: {new Date(res.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="bg-white/10 px-6 py-3 rounded-2xl border border-white/10 text-right">
                        <p className="text-[9px] font-black uppercase text-indigo-300">Timestamp</p>
                        <p className="text-sm font-bold">{new Date(res.created_at).toLocaleTimeString()}</p>
                      </div>
                    </div>

                    {/* Answers Layout - Maayos na alignment */}
                    <div className="p-10 grid grid-cols-1 md:grid-cols-2 gap-8 bg-white">
                      {viewingResponses?.questions_data?.map((q: any) => (
                        <div key={q.id} className="flex flex-col">
                          <div className="flex items-start gap-3 mb-3">
                            <CheckCircle2 className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" />
                            <p className="text-[11px] font-black text-slate-500 uppercase leading-tight">{q.text}</p>
                          </div>
                          <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 flex-1">
                            <p className="text-slate-900 font-bold text-lg">
                              {res.answers?.[q.id] || <span className="text-slate-300 italic">No answer provided</span>}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}