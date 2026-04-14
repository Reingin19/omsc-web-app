import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { ClipboardList, CheckCircle2, Clock, PlayCircle, Loader2, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function QuizzesSurveys() {
  const [surveys, setSurveys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadNotifs, setUnreadNotifs] = useState(0); // Para sa Bell indicator
  const navigate = useNavigate();

  useEffect(() => {
    fetchActiveSurveys();
    fetchUnreadNotifications();
  }, []);

  // --- FETCH UNREAD NOTIFS PARA SA INDICATOR ---
  async function fetchUnreadNotifications() {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;

    const { count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userData.user.id)
      .eq('is_read', false);
    
    setUnreadNotifs(count || 0);
  }

  async function fetchActiveSurveys() {
    try {
      setLoading(true);
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      // 1. Kunin ang active surveys
      const { data: surveysData, error: surveyError } = await supabase
        .from('surveys')
        .select('*')
        .eq('status', 'active') 
        .order('created_at', { ascending: false });

      if (surveyError) throw surveyError;

      // 2. Kunin ang surveys na nasagutan na ng current student (sa survey_responses table)
      const { data: responsesData } = await supabase
        .from('survey_responses')
        .select('survey_id')
        .eq('user_id', userData.user.id);

      const completedIds = responsesData?.map(r => r.survey_id) || [];

      // 3. I-tag ang bawat survey kung completed na
      const formattedSurveys = surveysData?.map(survey => ({
        ...survey,
        is_completed: completedIds.includes(survey.id)
      }));

      setSurveys(formattedSurveys || []);
    } catch (err) {
      console.error("Error fetching surveys:", err);
    } finally {
      setLoading(false);
    }
  }

  const getStatusBadge = (isCompleted: boolean) => {
    if (isCompleted) {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded-full border border-emerald-100 uppercase tracking-widest">
          <CheckCircle2 className="w-3 h-3" />
          Completed
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-bold rounded-full border border-indigo-100 uppercase tracking-widest">
        <PlayCircle className="w-3 h-3" />
        Available
      </span>
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 p-6 font-sans max-w-7xl mx-auto">
      {/* HEADER WITH NOTIFICATION BELL */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter mb-2 uppercase italic leading-none">
            Assessments <span className="text-indigo-600">&</span> Surveys
          </h1>
          <p className="text-slate-500 font-medium max-w-md">
            Help us improve OMSC services by completing these quick assessments.
          </p>
        </div>
        
        {/* BELL ICON */}
        <div className="relative cursor-pointer group" onClick={() => navigate('/notifications')}>
          <div className="p-4 bg-white rounded-2xl shadow-sm border border-slate-100 group-hover:bg-slate-50 transition-all">
            <Bell className="w-6 h-6 text-slate-600" />
            {unreadNotifs > 0 && (
              <span className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-4 ring-white">
                {unreadNotifs}
              </span>
            )}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center py-32 gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-indigo-500" />
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em]">Syncing Data...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {surveys.map((survey) => (
            <Card
              key={survey.id}
              className="p-10 rounded-[3.5rem] border-none shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 bg-white group relative overflow-hidden"
            >
              {/* Decorative Circle BG */}
              <div className="absolute -right-8 -top-8 w-32 h-32 bg-slate-50 rounded-full group-hover:scale-150 transition-transform duration-700 opacity-50" />

              <div className="relative z-10">
                <div className="flex items-start justify-between mb-8">
                  <div className="w-16 h-16 bg-slate-900 rounded-[1.5rem] flex items-center justify-center flex-shrink-0 group-hover:rotate-6 transition-transform">
                    <ClipboardList className="w-8 h-8 text-white" strokeWidth={1.5} />
                  </div>
                  {getStatusBadge(survey.is_completed)}
                </div>

                <h3 className="text-2xl font-black text-slate-900 mb-3 uppercase tracking-tighter leading-tight">
                  {survey.title}
                </h3>
                
                <p className="text-sm text-slate-400 mb-8 font-medium leading-relaxed">
                  Participation in this {survey.title} is vital for our academic evaluation and student support.
                </p>

                <div className="flex items-center gap-6 text-[10px] font-black uppercase tracking-widest text-slate-400 mb-10">
                  <span className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl text-indigo-600">
                      {survey.questions_data?.length || 0} Questions
                  </span>
                  <span className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5" />
                      ~{Math.ceil((survey.questions_data?.length || 0) * 0.5)} Mins
                  </span>
                </div>

                <Button
                  onClick={() => navigate(`/take-survey/${survey.id}`)} 
                  disabled={survey.is_completed}
                  className={`w-full h-16 rounded-[2rem] font-black uppercase text-xs tracking-[0.2em] transition-all shadow-xl ${
                    survey.is_completed
                      ? 'bg-slate-100 text-slate-400 border-none shadow-none cursor-not-allowed'
                      : 'bg-indigo-600 text-white hover:bg-slate-900 shadow-indigo-100 active:scale-95'
                  }`}
                >
                  {survey.is_completed ? 'Already Submitted' : 'Start Assessment'}
                </Button>
              </div>
            </Card>
          ))}

          {surveys.length === 0 && (
            <div className="col-span-full py-32 text-center bg-slate-50 rounded-[4rem] border-4 border-dashed border-slate-100">
                <div className="flex flex-col items-center gap-4 opacity-20">
                  <ClipboardList className="w-16 h-16" />
                  <p className="font-black uppercase text-xs tracking-[0.3em]">No assessments available</p>
                </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}