import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { 
  Plus, Edit, Trash2, Save, Loader2, 
  ChevronLeft, ClipboardList, Trash, Type, List, X, Hash, Rocket, EyeOff, Bell
} from 'lucide-react';
import { useToast } from '../../hooks/use-toast';
import { Input } from "../../components/ui/input";
import { 
  Dialog, DialogContent, DialogHeader, 
  DialogTitle, DialogTrigger, DialogFooter 
} from "../../components/ui/dialog";

export default function SurveyBuilder() {
  const { toast } = useToast();
  const [surveys, setSurveys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [editingSurvey, setEditingSurvey] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const [newTitle, setNewTitle] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

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
      toast({ title: "Database Error", description: "Check if 'surveys' table exists.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  // --- TOGGLE PUBLISH WITH REAL-TIME NOTIFICATION ---
  const togglePublish = async (survey: any) => {
    const newStatus = survey.status === 'active' ? 'draft' : 'active';
    try {
      // 1. Update Survey Status
      const { error: updateError } = await supabase
        .from('surveys')
        .update({ status: newStatus })
        .eq('id', survey.id);

      if (updateError) throw updateError;

      // 2. If Published, send notification to all students
      if (newStatus === 'active') {
        // Kunin lahat ng students
        const { data: students } = await supabase
          .from('users')
          .select('id')
          .eq('role', 'student');

        if (students && students.length > 0) {
          const notifications = students.map(s => ({
            user_id: s.id,
            title: 'New Survey Available 📝',
            message: `Counselor published a new survey: ${survey.title}. Please provide your feedback.`,
            is_read: false
          }));

          const { error: notifError } = await supabase
            .from('notifications')
            .insert(notifications);
          
          if (notifError) console.error("Notification Error:", notifError);
        }
      }

      toast({ 
        title: newStatus === 'active' ? "Published & Notified!" : "Back to Draft", 
        description: newStatus === 'active' ? "Students received a notification." : "Hidden from students.",
        variant: "default"
      });
      fetchSurveys();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleCreateNew = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      const { error } = await supabase
        .from('surveys')
        .insert([{ title: newTitle, status: 'draft', response_count: 0, questions_data: [] }]);

      if (error) throw error;
      toast({ title: "Survey Created", description: "Status set to Draft." });
      setIsModalOpen(false);
      setNewTitle('');
      fetchSurveys();
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
      toast({ title: "Saved!", description: "Questions updated successfully." });
      setEditingSurvey(null);
      fetchSurveys();
    } catch (err: any) {
      toast({ title: "Save Error", description: err.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const deleteSurvey = async (id: number) => {
    if (!confirm("Are you sure you want to delete this survey?")) return;
    await supabase.from('surveys').delete().eq('id', id);
    fetchSurveys();
    toast({ title: "Deleted", description: "Survey removed." });
  };

  // --- EDITOR VIEW ---
  if (editingSurvey) {
    return (
      <div className="p-6 max-w-5xl mx-auto space-y-6 animate-in slide-in-from-bottom-4 duration-300 font-sans">
        <div className="flex items-center justify-between bg-white p-5 rounded-[2.5rem] border border-slate-100 shadow-sm sticky top-4 z-10">
          <Button variant="ghost" onClick={() => setEditingSurvey(null)} className="rounded-2xl font-bold uppercase text-[10px] tracking-widest">
            <ChevronLeft className="mr-2 h-4 w-4" /> Back to Dashboard
          </Button>
          <Button onClick={saveSurveyContent} disabled={isSaving} className="bg-slate-900 hover:bg-slate-800 rounded-2xl h-12 px-8 font-black uppercase text-xs tracking-widest text-white transition-all shadow-lg">
            {isSaving ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />}
            Save Progress
          </Button>
        </div>

        <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm flex justify-between items-end">
          <div>
            <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tighter leading-none">{editingSurvey.title}</h2>
            <div className="flex items-center gap-2 mt-4">
               <span className={`px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${editingSurvey.status === 'active' ? 'bg-emerald-500 text-white' : 'bg-amber-400 text-white'}`}>
                 Current Status: {editingSurvey.status}
               </span>
            </div>
          </div>
        </div>

        <div className="space-y-8 pb-20">
          {questions.map((q, qIdx) => (
            <Card key={q.id} className="p-10 rounded-[3.5rem] border-none shadow-xl shadow-slate-100/50 bg-white relative">
              <div className="flex justify-between items-center mb-8">
                <div className="flex gap-2 bg-slate-50 p-1.5 rounded-2xl">
                    <Button 
                        variant={q.type === 'mcq' ? 'secondary' : 'ghost'} 
                        size="sm" 
                        className={`rounded-xl text-[10px] font-black uppercase ${q.type === 'mcq' ? 'bg-white shadow-sm' : ''}`}
                        onClick={() => {
                            const newQ = [...questions];
                            newQ[qIdx].type = 'mcq';
                            if (!newQ[qIdx].options) newQ[qIdx].options = ['Option 1'];
                            setQuestions(newQ);
                        }}
                    >
                        <List className="w-3 h-3 mr-2" /> MCQ
                    </Button>
                    <Button 
                        variant={q.type === 'scale' ? 'secondary' : 'ghost'} 
                        size="sm" 
                        className={`rounded-xl text-[10px] font-black uppercase ${q.type === 'scale' ? 'bg-white shadow-sm' : ''}`}
                        onClick={() => {
                            const newQ = [...questions];
                            newQ[qIdx].type = 'scale';
                            newQ[qIdx].minLabel = newQ[qIdx].minLabel || 'Disagree';
                            newQ[qIdx].maxLabel = newQ[qIdx].maxLabel || 'Agree';
                            setQuestions(newQ);
                        }}
                    >
                        <Hash className="w-3 h-3 mr-2" /> Scale
                    </Button>
                    <Button 
                        variant={q.type === 'text' ? 'secondary' : 'ghost'} 
                        size="sm" 
                        className={`rounded-xl text-[10px] font-black uppercase ${q.type === 'text' ? 'bg-white shadow-sm' : ''}`}
                        onClick={() => {
                            const newQ = [...questions];
                            newQ[qIdx].type = 'text';
                            setQuestions(newQ);
                        }}
                    >
                        <Type className="w-3 h-3 mr-2" /> Text
                    </Button>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setQuestions(questions.filter(item => item.id !== q.id))} className="text-red-300 hover:text-red-500 hover:bg-red-50 rounded-full">
                  <Trash className="h-5 w-5" />
                </Button>
              </div>

              <Input 
                value={q.text}
                onChange={(e) => {
                  const newQ = [...questions];
                  newQ[qIdx].text = e.target.value;
                  setQuestions(newQ);
                }}
                className="text-2xl font-black mb-8 border-none bg-slate-50 h-16 rounded-2xl px-8 placeholder:text-slate-300 focus-visible:ring-2 focus-visible:ring-indigo-100"
                placeholder="Question Text..."
              />

              {q.type === 'mcq' && (
                <div className="space-y-4 ml-4">
                  {q.options?.map((opt: string, oIdx: number) => (
                    <div key={oIdx} className="flex items-center gap-4 group">
                      <div className="w-6 h-6 rounded-full border-4 border-slate-100 flex-shrink-0" />
                      <Input value={opt} onChange={(e) => {
                          const newQ = [...questions];
                          newQ[qIdx].options[oIdx] = e.target.value;
                          setQuestions(newQ);
                        }}
                        className="border-none bg-transparent shadow-none focus-visible:ring-0 text-slate-700 font-bold text-lg p-0 h-auto"
                      />
                      <button onClick={() => {
                          const newQ = [...questions];
                          newQ[qIdx].options.splice(oIdx, 1);
                          setQuestions(newQ);
                      }} className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-all"><X className="w-5 h-5"/></button>
                    </div>
                  ))}
                  <Button variant="ghost" size="sm" className="text-indigo-600 font-black uppercase text-[10px] mt-4" 
                    onClick={() => {
                      const newQ = [...questions];
                      newQ[qIdx].options.push(`New Option`);
                      setQuestions(newQ);
                    }}>+ Add Option</Button>
                </div>
              )}

              {q.type === 'scale' && (
                <div className="ml-4 space-y-6">
                  <div className="flex flex-col md:flex-row justify-between items-center bg-slate-50 p-8 rounded-[2.5rem] gap-6">
                    <div className="w-full md:w-1/3 space-y-2">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Label 1</p>
                      <Input value={q.minLabel} onChange={(e) => {
                          const newQ = [...questions];
                          newQ[qIdx].minLabel = e.target.value;
                          setQuestions(newQ);
                        }} className="bg-white rounded-xl font-bold border-none" />
                    </div>
                    <div className="flex gap-2">
                      {[1,2,3,4,5].map(n => <div key={n} className="w-10 h-10 rounded-full bg-white border-2 border-slate-100 flex items-center justify-center text-slate-300 font-black text-xs">{n}</div>)}
                    </div>
                    <div className="w-full md:w-1/3 space-y-2 text-right">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mr-2">Label 5</p>
                      <Input value={q.maxLabel} onChange={(e) => {
                          const newQ = [...questions];
                          newQ[qIdx].maxLabel = e.target.value;
                          setQuestions(newQ);
                        }} className="bg-white rounded-xl font-bold border-none text-right" />
                    </div>
                  </div>
                </div>
              )}

              {q.type === 'text' && (
                <div className="ml-4 p-8 border-4 border-dashed border-slate-50 rounded-[2rem] flex flex-col items-center justify-center bg-slate-50/30">
                    <p className="text-slate-300 font-black uppercase text-[10px] tracking-widest">Text Response Field</p>
                </div>
              )}
            </Card>
          ))}
          
          <Button 
            variant="outline" 
            onClick={() => setQuestions([...questions, { id: Date.now(), text: '', type: 'mcq', options: ['Option 1'] }])}
            className="w-full h-24 border-dashed border-4 rounded-[3.5rem] border-slate-100 text-slate-300 hover:text-indigo-500 hover:border-indigo-100 transition-all font-black uppercase text-xs"
          >
            <Plus className="mr-3 h-6 w-6" /> Add Question
          </Button>
        </div>
      </div>
    );
  }

  // --- LIST VIEW ---
  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-900 p-12 rounded-[4rem] text-white shadow-2xl relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-6xl font-black tracking-tighter italic leading-none">SURVEY HUB</h1>
          <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.4em] mt-4 ml-1">Admin Dashboard & Management</p>
        </div>

        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-indigo-600 text-white hover:bg-indigo-500 h-20 px-12 rounded-[2.5rem] font-black uppercase text-xs tracking-widest shadow-xl transition-all active:scale-95 relative z-10">
              <Plus className="mr-3 h-6 w-6" /> Create New Survey
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-[3rem] p-12 border-none shadow-2xl">
            <DialogHeader><DialogTitle className="text-3xl font-black uppercase text-slate-900 italic">New Survey</DialogTitle></DialogHeader>
            <form onSubmit={handleCreateNew} className="space-y-8 pt-6">
              <Input placeholder="Enter Survey Title..." value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className="h-16 rounded-2xl bg-slate-50 border-none px-8 font-bold text-xl" required />
              <DialogFooter><Button type="submit" className="w-full bg-slate-900 hover:bg-indigo-600 rounded-2xl h-16 font-black uppercase text-white shadow-lg transition-all">Start Building</Button></DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex flex-col items-center py-24 gap-4"><Loader2 className="h-12 w-12 animate-spin text-indigo-500" /></div>
      ) : (
        <div className="grid grid-cols-1 gap-8">
          {surveys.map(survey => (
            <Card key={survey.id} className={`p-12 rounded-[4rem] border-none shadow-sm hover:shadow-2xl transition-all duration-500 bg-white relative border-2 ${survey.status === 'active' ? 'border-emerald-100 shadow-emerald-50' : 'border-slate-50'}`}>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-10">
                <div className="space-y-4">
                  <div className="flex items-center gap-4 flex-wrap">
                    <h3 className="text-4xl font-black text-slate-900 uppercase tracking-tighter leading-none">{survey.title}</h3>
                    <div className={`px-5 py-1.5 text-[9px] font-black uppercase tracking-[0.2em] rounded-full flex items-center gap-2 ${survey.status === 'active' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200' : 'bg-amber-400 text-white shadow-lg shadow-amber-200'}`}>
                      {survey.status === 'active' ? <Rocket className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                      {survey.status}
                    </div>
                  </div>
                  <div className="flex items-center gap-8 text-slate-400 font-bold text-[11px] uppercase tracking-widest">
                    <span className="flex items-center gap-2.5 bg-slate-50 px-4 py-2 rounded-2xl"><ClipboardList className="h-4 w-4 text-indigo-500" /> Responses: {survey.response_count || 0}</span>
                    <span>Created: {new Date(survey.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 w-full md:w-auto">
                  <Button 
                    onClick={() => togglePublish(survey)}
                    className={`rounded-2xl h-16 px-10 font-black uppercase text-[10px] tracking-widest transition-all shadow-sm ${survey.status === 'active' ? 'bg-amber-50 text-amber-600 hover:bg-amber-100' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}
                  >
                    {survey.status === 'active' ? <EyeOff className="h-4 w-4 mr-3" /> : <Rocket className="h-4 w-4 mr-3" />}
                    {survey.status === 'active' ? 'Unpublish' : 'Publish & Notify'}
                  </Button>

                  <Button 
                    variant="outline" 
                    onClick={() => { setEditingSurvey(survey); setQuestions(survey.questions_data || []); }}
                    className="rounded-2xl h-16 px-10 border-slate-100 font-black uppercase text-[10px] tracking-widest hover:bg-slate-50"
                  >
                    <Edit className="h-4 w-4 mr-3" /> Build
                  </Button>

                  <Button variant="outline" onClick={() => deleteSurvey(survey.id)} className="rounded-2xl h-16 px-8 border-red-50 text-red-300 hover:text-red-500 hover:bg-red-50 transition-colors">
                    <Trash2 className="h-6 w-6" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
          
          {surveys.length === 0 && (
            <div className="text-center py-32 bg-slate-50 rounded-[4rem] border-4 border-dashed border-slate-100">
               <h4 className="text-slate-300 font-black uppercase tracking-widest text-xs">No Surveys Found</h4>
            </div>
          )}
        </div>
      )}
    </div>
  );
}