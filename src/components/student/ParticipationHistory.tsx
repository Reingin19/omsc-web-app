import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { 
  Calendar, 
  MapPin, 
  CheckCircle2, 
  FileText, 
  Loader2, 
  Star,
  Award,
  AlertCircle,
  TrendingUp
} from 'lucide-react';

export default function ParticipationHistory() {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    rate: 0,
    avgRating: 0
  });

  useEffect(() => {
    fetchHistory();
  }, []);

  async function fetchHistory() {
    try {
      setLoading(true);
      setErrorMsg(null);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // Inayos ang join: tinitiyak na tama ang relation name (dapat 'programs' ay plural o singular base sa foreign key mo)
      const { data, error } = await supabase
        .from('attendance')
        .select(`
          id,
          status,
          rating,
          feedback,
          date,
          programs (
            title,
            location,
            category
          )
        `)
        .eq('student_id', user.id)
        .order('date', { ascending: false });

      if (error) throw error;

      if (data) {
        setHistory(data);
        calculateStats(data);
      }
    } catch (error: any) {
      console.error('Error fetching history:', error);
      setErrorMsg(error.message);
    } finally {
      setLoading(false);
    }
  }

  const calculateStats = (data: any[]) => {
    // Mas safe na filter logic
    const attended = data.filter(item => item.status?.toLowerCase() === 'attended').length;
    const totalPossible = data.length;
    const attendanceRate = totalPossible > 0 ? (attended / totalPossible) * 100 : 0;
    
    // Average rating logic
    const ratings = data.filter(item => item.rating && item.rating > 0);
    const avg = ratings.length > 0 
      ? ratings.reduce((acc, curr) => acc + curr.rating, 0) / ratings.length 
      : 0;

    setStats({
      total: attended,
      rate: Math.round(attendanceRate),
      avgRating: Number(avg.toFixed(1))
    });
  };

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-6 animate-pulse">
        <div className="relative">
          <Loader2 className="h-14 w-14 animate-spin text-indigo-600" />
          <TrendingUp className="h-6 w-6 text-indigo-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </div>
        <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-[10px]">Retrieving Records...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 p-4 font-sans">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-900 p-10 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-5xl font-black tracking-tighter uppercase italic leading-none">
            My <span className="text-indigo-400">Journey</span>
          </h1>
          <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.4em] mt-4 ml-1">
            Student Participation & Achievements
          </p>
        </div>
        <Award className="absolute right-[-20px] top-[-20px] h-48 w-48 text-white/5 -rotate-12" />
      </div>

      {errorMsg && (
        <div className="bg-red-50 border-2 border-red-100 p-6 rounded-[2rem] flex items-center gap-4 animate-bounce">
          <AlertCircle className="text-red-500 w-6 h-6" />
          <p className="text-red-700 text-xs font-black uppercase tracking-widest">System Alert: {errorMsg}</p>
        </div>
      )}

      {/* STATS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-8 border-none shadow-xl shadow-indigo-100/50 bg-white rounded-[3rem] group hover:bg-indigo-600 transition-all duration-500">
          <div className="space-y-2">
            <p className="text-5xl font-black text-indigo-600 group-hover:text-white transition-colors tracking-tighter">{stats.total}</p>
            <p className="text-[10px] font-black text-slate-400 group-hover:text-indigo-200 uppercase tracking-[0.2em]">Events Attended</p>
          </div>
        </Card>
        <Card className="p-8 border-none shadow-xl shadow-emerald-100/50 bg-white rounded-[3rem] group hover:bg-emerald-500 transition-all duration-500">
          <div className="space-y-2">
            <p className="text-5xl font-black text-emerald-500 group-hover:text-white transition-colors tracking-tighter">{stats.rate}%</p>
            <p className="text-[10px] font-black text-slate-400 group-hover:text-emerald-100 uppercase tracking-[0.2em]">Attendance Rate</p>
          </div>
        </Card>
        <Card className="p-8 border-none shadow-xl shadow-orange-100/50 bg-white rounded-[3rem] group hover:bg-orange-500 transition-all duration-500">
          <div className="space-y-2">
            <p className="text-5xl font-black text-orange-500 group-hover:text-white transition-colors tracking-tighter">{stats.avgRating}</p>
            <p className="text-[10px] font-black text-slate-400 group-hover:text-orange-100 uppercase tracking-[0.2em]">Avg. Feedback Score</p>
          </div>
        </Card>
      </div>

      {/* HISTORY LIST */}
      <div className="space-y-8">
        <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.5em] ml-4">Detailed Records</h2>
        {history.length > 0 ? history.map((item) => (
          <Card
            key={item.id}
            className="p-10 border-none shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 rounded-[3.5rem] bg-white group relative overflow-hidden"
          >
            {/* Status Indicator Bar */}
            <div className={`absolute left-0 top-0 bottom-0 w-2 ${
              item.status?.toLowerCase() === 'attended' ? 'bg-emerald-500' : 'bg-slate-200'
            }`} />

            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
              <div className="flex-1 space-y-6">
                <div className="flex flex-wrap items-center gap-4">
                  <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">
                    {item.programs?.title || 'Unknown Event'}
                  </h3>
                  <div className={`px-5 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-full ${
                    item.status?.toLowerCase() === 'attended' 
                    ? 'bg-emerald-100 text-emerald-600' 
                    : 'bg-slate-100 text-slate-400'
                  }`}>
                    {item.status || 'Pending'}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-6 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                  <span className="flex items-center gap-2.5 bg-slate-50 px-4 py-2 rounded-2xl">
                    <Calendar className="w-4 h-4 text-indigo-500" />
                    {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                  <span className="flex items-center gap-2.5 bg-slate-50 px-4 py-2 rounded-2xl">
                    <MapPin className="w-4 h-4 text-indigo-500" />
                    {item.programs?.location || 'Campus Center'}
                  </span>
                  <span className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-2xl">
                    {item.programs?.category || 'Guidance'}
                  </span>
                </div>
              </div>
              
              {/* Rating Section */}
              <div className="flex flex-col items-center lg:items-end gap-3">
                <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Session Rating</p>
                <div className="flex items-center gap-1.5 bg-slate-50 p-4 rounded-[1.5rem] border border-slate-100">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 transition-all duration-500 ${
                        i < (item.rating || 0) 
                          ? 'fill-orange-400 text-orange-400 scale-110' 
                          : 'text-slate-200'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Feedback Bubble */}
            {item.feedback && (
              <div className="mt-10 bg-indigo-50/40 p-8 rounded-[2.5rem] border border-indigo-100 relative">
                <div className="absolute -top-3 left-10 bg-white px-4 py-1 rounded-full border border-indigo-100">
                  <p className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">Counselor's Note</p>
                </div>
                <div className="flex items-start gap-5">
                  <div className="bg-white p-3 rounded-2xl shadow-sm">
                    <FileText className="w-6 h-6 text-indigo-600" />
                  </div>
                  <p className="text-slate-600 font-bold italic leading-relaxed text-lg">"{item.feedback}"</p>
                </div>
              </div>
            )}

            <div className="mt-10 flex gap-4">
              <Button className="h-16 px-10 bg-slate-900 hover:bg-indigo-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest transition-all shadow-xl active:scale-95">
                <Award className="w-5 h-5 mr-3" /> Get Certificate
              </Button>
            </div>
          </Card>
        )) : (
          <div className="text-center py-32 bg-slate-50 rounded-[4rem] border-4 border-dashed border-slate-100">
              <div className="flex flex-col items-center gap-6 opacity-20">
                <Calendar className="w-20 h-20" />
                <p className="font-black uppercase text-xs tracking-[0.4em]">No Records Found</p>
              </div>
          </div>
        )}
      </div>
    </div>
  );
}