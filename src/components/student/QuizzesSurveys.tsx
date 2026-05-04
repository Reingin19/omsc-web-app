import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { ClipboardList, CheckCircle2, PlayCircle, Loader2, X } from 'lucide-react';
import { useToast } from '../../hooks/use-toast';

export default function QuizzesSurveys() {
  const [surveys, setSurveys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSurveyId, setActiveSurveyId] = useState<string | null>(null); 
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  // MANUAL CONFIG: Dahil nire-create mo ang users table as int8/text
  const CURRENT_USER_ID = "3"; // Angela Malutao base sa screenshot mo

  useEffect(() => {
    fetchActiveSurveys();
  }, []);

  async function fetchActiveSurveys() {
    try {
      setLoading(true);
      
      // 1. Fetch Active Surveys
      const { data: surveysData, error: surveyError } = await supabase
        .from('surveys')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (surveyError) throw surveyError;

      // 2. Fetch Responses gamit ang Manual ID para sa 'Completed' status
      const { data: responsesData } = await supabase
        .from('survey_responses')
        .select('survey_id')
        .eq('user_id', CURRENT_USER_ID);
      
      const completedIds = responsesData?.map(r => String(r.survey_id)) || [];

      // 3. Map the data to include completion status
      const formattedSurveys = surveysData?.map(survey => ({
        ...survey,
        is_completed: completedIds.includes(String(survey.id))
      }));

      setSurveys(formattedSurveys || []);
    } catch (err: any) {
      console.error("Fetch Error:", err);
      toast({ title: "Error", description: "Failed to load assessments.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  const handleSubmit = async (surveyId: string) => {
    try {
      setSubmitting(true);
      
      // 1. Prepare data (Gagamit ng Manual ID para mag-match sa bago mong table)
      const responsePayload = {
        survey_id: surveyId,
        user_id: CURRENT_USER_ID, // Ginawang string/text para sa bagong table column
        answers: answers
      };

      // 2. Insert to the newly created survey_responses table
      const { error: resError } = await supabase
        .from('survey_responses')
        .insert([responsePayload]);

      if (resError) throw resError;

      // 3. UI Success Feedback
      toast({ 
        title: "SUCCESS!", 
        description: "Assessment submitted successfully to the new database.", 
        className: "bg-emerald-600 text-white font-black" 
      });
      
      // 4. Reset states
      setActiveSurveyId(null);
      setAnswers({});
      fetchActiveSurveys(); 

    } catch (err: any) {
      console.error("Submission Error Detail:", err);
      toast({ 
        title: "SUBMISSION ERROR", 
        description: err.message || "Failed to submit. Please check your database connection.", 
        variant: "destructive" 
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 p-6 font-sans max-w-7xl mx-auto">
      {/* HEADER */}
      <div className="mb-10">
        <h1 className="text-4xl font-black text-slate-900 tracking-tighter mb-2 uppercase italic leading-none">
          Assessments <span className="text-indigo-600">&</span> Surveys
        </h1>
        <p className="text-slate-500 font-medium max-w-md">Database Mode: Manual ID Sync ({CURRENT_USER_ID})</p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center py-32">
            <Loader2 className="h-12 w-12 animate-spin text-indigo-500" />
            <p className="mt-4 text-slate-400 font-bold uppercase text-[10px] tracking-widest">Loading Assessments...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {surveys.length === 0 ? (
            <div className="lg:col-span-2 text-center py-24 bg-slate-50 rounded-[3.5rem] border-4 border-dashed border-slate-100">
               <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-xs italic">No active assessments available.</p>
            </div>
          ) : (
            surveys.map((survey) => (
              <Card 
                key={survey.id} 
                className={`p-10 rounded-[3.5rem] border-none shadow-sm transition-all duration-500 bg-white relative overflow-hidden ${
                    activeSurveyId === survey.id ? 'lg:col-span-2 shadow-2xl ring-8 ring-indigo-50' : 'hover:shadow-xl'
                }`}
              >
                {activeSurveyId !== survey.id ? (
                  <div className="relative z-10 animate-in fade-in duration-500">
                    <div className="flex items-start justify-between mb-8">
                      <div className="w-16 h-16 bg-slate-900 rounded-[1.5rem] flex items-center justify-center">
                        <ClipboardList className="w-8 h-8 text-white" />
                      </div>
                      <span className={`inline-flex items-center gap-1 px-4 py-1.5 text-[10px] font-black rounded-full border uppercase tracking-widest ${
                        survey.is_completed ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-indigo-50 text-indigo-600 border-indigo-100'
                      }`}>
                        {survey.is_completed ? <CheckCircle2 className="w-3 h-3" /> : <PlayCircle className="w-3 h-3" />}
                        {survey.is_completed ? 'Completed' : 'Available'}
                      </span>
                    </div>
                    <h3 className="text-3xl font-black text-slate-900 mb-3 uppercase tracking-tighter leading-tight italic">{survey.title}</h3>
                    <p className="text-sm text-slate-400 mb-8 font-medium">Click to open the assessment form.</p>
                    <Button
                      onClick={() => setActiveSurveyId(survey.id)}
                      disabled={survey.is_completed}
                      className={`w-full h-16 rounded-[2rem] font-black uppercase text-xs tracking-[0.2em] transition-all ${
                        survey.is_completed ? 'bg-slate-100 text-slate-300' : 'bg-indigo-600 text-white hover:bg-slate-900 shadow-lg'
                      }`}
                    >
                      {survey.is_completed ? 'Already Submitted' : 'Start Assessment'}
                    </Button>
                  </div>
                ) : (
                  <div className="relative z-10 animate-in slide-in-from-top-4 duration-500">
                    <div className="flex justify-between items-center mb-10 border-b pb-8">
                      <h3 className="text-3xl font-black text-slate-900 uppercase italic tracking-tighter leading-none">{survey.title}</h3>
                      <button 
                        onClick={() => setActiveSurveyId(null)} 
                        className="p-3 bg-slate-50 rounded-full text-slate-400 hover:text-red-500 transition-colors"
                      >
                        <X className="w-6 h-6" />
                      </button>
                    </div>

                    <div className="space-y-16 max-w-4xl mx-auto py-4">
                      {survey.questions_data?.map((q: any, qIdx: number) => (
                        <div key={q.id} className="space-y-8">
                          <div className="flex gap-6">
                             <span className="flex-shrink-0 w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-sm shadow-indigo-200 shadow-lg">
                                {qIdx + 1}
                             </span>
                             <h4 className="text-2xl font-black text-slate-800 uppercase tracking-tight pt-1 leading-tight">{q.text}</h4>
                          </div>

                          <div className="ml-16">
                            {q.type === 'mcq' && (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {q.options.map((opt: string) => (
                                  <label 
                                    key={opt} 
                                    className={`flex items-center p-6 rounded-[2rem] border-4 transition-all cursor-pointer ${
                                        answers[q.id] === opt ? 'border-indigo-600 bg-indigo-50 shadow-md' : 'border-slate-50 bg-white hover:border-slate-100'
                                    }`}
                                  >
                                    <input 
                                      type="radio" 
                                      name={q.id} 
                                      value={opt} 
                                      className="hidden" 
                                      onChange={(e) => setAnswers({...answers, [q.id]: e.target.value})}
                                    />
                                    <div className={`w-6 h-6 rounded-full border-4 mr-4 flex items-center justify-center ${
                                        answers[q.id] === opt ? 'border-indigo-600' : 'border-slate-200'
                                    }`}>
                                      {answers[q.id] === opt && <div className="w-2.5 h-2.5 rounded-full bg-indigo-600" />}
                                    </div>
                                    <span className={`font-black text-lg ${answers[q.id] === opt ? 'text-indigo-900' : 'text-slate-500'}`}>{opt}</span>
                                  </label>
                                ))}
                              </div>
                            )}

                            {q.type === 'scale' && (
                              <div className="flex gap-3">
                                {[1, 2, 3, 4, 5].map(n => (
                                  <button 
                                    key={n} 
                                    onClick={() => setAnswers({...answers, [q.id]: n})}
                                    className={`flex-1 h-20 rounded-[1.5rem] font-black text-xl transition-all ${
                                        answers[q.id] === n ? 'bg-indigo-600 text-white shadow-xl scale-105' : 'bg-slate-50 text-slate-300 hover:bg-slate-100'
                                    }`}
                                  >
                                    {n}
                                  </button>
                                ))}
                              </div>
                            )}

                            {q.type === 'text' && (
                              <textarea 
                                className="w-full rounded-[2rem] bg-slate-50 border-none min-h-[160px] p-8 font-bold text-lg focus:ring-4 focus:ring-indigo-100 outline-none placeholder:text-slate-200 shadow-inner" 
                                placeholder="Write your response..." 
                                onChange={(e) => setAnswers({...answers, [q.id]: e.target.value})}
                              />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-20 flex gap-4 pt-10 border-t">
                      <Button 
                        variant="ghost" 
                        onClick={() => setActiveSurveyId(null)} 
                        className="h-20 px-12 rounded-[2.5rem] font-black uppercase text-[10px] tracking-widest"
                      >
                        Back
                      </Button>
                      <Button 
                        onClick={() => handleSubmit(survey.id)} 
                        disabled={submitting}
                        className="flex-1 h-20 rounded-[2.5rem] bg-slate-900 text-white font-black uppercase text-xs tracking-[0.3em] shadow-2xl hover:bg-indigo-600 transition-all"
                      >
                        {submitting ? <Loader2 className="animate-spin" /> : 'Confirm & Submit Response'}
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}