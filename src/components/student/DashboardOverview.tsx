import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Progress } from '../../components/ui/progress';
import { useNavigate } from 'react-router-dom'; // Para sa redirection
import { 
  BookOpen, ClipboardList, Calendar, 
  TrendingUp, Loader2, ArrowRight, MapPin 
} from 'lucide-react';

export default function DashboardOverview() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('Student');
  const [activeSurveys, setActiveSurveys] = useState<any[]>([]); // Gagamitin ang 'surveys' table
  const [programs, setPrograms] = useState<any[]>([]);
  const [stats, setStats] = useState([
    { label: 'Programs Available', value: '0', icon: Calendar, color: 'text-indigo-600' },
    { label: 'Surveys Published', value: '0', icon: ClipboardList, color: 'text-emerald-600' },
    { label: 'Materials Online', value: '0', icon: BookOpen, color: 'text-purple-600' },
    { label: 'Participation Rate', value: '0%', icon: TrendingUp, color: 'text-blue-600' },
  ]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  async function fetchDashboardData() {
    try {
      setLoading(true);
      
      // 1. Get Current User from Supabase Auth
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // I-fetch ang profile. Kung wala pang 'profiles' table, gagamit muna tayo ng metadata
        const { data: profile } = await supabase
          .from('profiles') 
          .select('full_name')
          .eq('id', user.id)
          .single();
        
        if (profile?.full_name) {
          setUserName(profile.full_name.split(' ')[0]);
        } else if (user.user_metadata?.full_name) {
          setUserName(user.user_metadata.full_name.split(' ')[0]);
        }
      }

      // 2. Parallel Fetching para sa Stats at Lists
      // Gagamit tayo ng 'surveys' table imbes na 'quizzes'
      const [progRes, surveyRes, matRes] = await Promise.all([
        supabase.from('programs').select('*', { count: 'exact' }).limit(3),
        supabase.from('surveys').select('*', { count: 'exact' }).eq('status', 'active').limit(2),
        supabase.from('materials').select('*', { count: 'exact', head: true }),
      ]);

      if (progRes.data) setPrograms(progRes.data);
      if (surveyRes.data) setActiveSurveys(surveyRes.data);

      // 3. Update Stats dynamic values
      setStats([
        { label: 'Programs Available', value: (progRes.count || 0).toString(), icon: Calendar, color: 'text-indigo-600' },
        { label: 'Surveys Published', value: (surveyRes.count || 0).toString(), icon: ClipboardList, color: 'text-emerald-600' },
        { label: 'Materials Online', value: (matRes.count || 0).toString(), icon: BookOpen, color: 'text-purple-600' },
        { label: 'Participation Rate', value: `85%`, icon: TrendingUp, color: 'text-blue-600' }, // Halimbawa muna
      ]);

    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-indigo-600" />
        <p className="text-slate-500 font-bold italic animate-pulse text-center uppercase tracking-widest text-xs">
          Syncing with OMSC Hub...
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-10 animate-in fade-in duration-700 font-sans">
      {/* Dynamic Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-6xl font-black text-slate-900 tracking-tighter italic uppercase leading-none">
            Mabuhay, <span className="text-indigo-600">{userName}!</span>
          </h1>
          <p className="text-slate-400 text-sm font-black uppercase tracking-[0.3em] flex items-center gap-2 mt-4">
            <MapPin className="h-4 w-4 text-red-500 animate-bounce" /> San Jose Campus Student Portal
          </p>
        </div>
        <div className="bg-slate-900 p-6 rounded-[2.5rem] shadow-xl text-white min-w-[200px]">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Academic Year</p>
          <p className="text-xl font-black italic">2025 - 2026</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Card key={stat.label} className="p-8 border-none shadow-sm bg-white rounded-[3rem] hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 group">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">{stat.label}</p>
                <p className="text-4xl font-black text-slate-900">{stat.value}</p>
              </div>
              <div className={`w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white transition-all duration-500 ${stat.color}`}>
                <stat.icon className="w-7 h-7" strokeWidth={2.5} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Programs Section */}
        <Card className="lg:col-span-2 p-12 rounded-[4rem] border-none shadow-sm bg-white">
          <div className="flex items-center justify-between mb-10">
            <h2 className="text-3xl font-black text-slate-900 italic uppercase tracking-tight">Latest Programs</h2>
            <Button variant="ghost" onClick={() => navigate('/student/programs')} className="text-indigo-600 font-black uppercase text-[10px] tracking-widest">
              Explore All <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
          
          <div className="space-y-4">
            {programs.length > 0 ? (
              programs.map((program) => (
                <div key={program.id} className="p-8 bg-slate-50 rounded-[2.5rem] hover:bg-white hover:shadow-xl hover:ring-1 hover:ring-slate-100 transition-all duration-300 flex items-center justify-between group">
                  <div className="space-y-2">
                    <h3 className="text-xl font-black text-slate-800 group-hover:text-indigo-600 transition-colors uppercase italic">{program.title}</h3>
                    <div className="flex items-center gap-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                      <span className="flex items-center gap-1.5"><Calendar className="h-3 w-3" /> {new Date(program.date).toLocaleDateString()}</span>
                      <span>•</span>
                      <span>{program.campus || 'Main Campus'}</span>
                    </div>
                  </div>
                  <Button className="bg-slate-900 hover:bg-indigo-600 text-white rounded-2xl h-14 px-10 font-black uppercase text-xs tracking-widest shadow-lg shadow-slate-200 transition-all">
                    Join
                  </Button>
                </div>
              ))
            ) : (
              <div className="text-center py-10 bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-100">
                <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest">Checking for new programs...</p>
              </div>
            )}
          </div>
        </Card>

        {/* Survey/Assessment Card */}
        <Card className="p-12 rounded-[4rem] border-none shadow-2xl bg-indigo-600 text-white flex flex-col justify-between overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
          
          <div className="relative z-10 space-y-10">
            <h2 className="text-3xl font-black italic tracking-tight uppercase leading-none">Pending<br/>Surveys</h2>
            
            <div className="space-y-8">
              {activeSurveys.length > 0 ? (
                activeSurveys.map((survey) => (
                  <div key={survey.id} className="space-y-3 group cursor-pointer" onClick={() => navigate(`/student/take-survey/${survey.id}`)}>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-black uppercase tracking-widest text-indigo-100 group-hover:text-white transition-colors">{survey.title}</span>
                      <span className="text-[10px] font-black bg-white/20 px-2 py-1 rounded-lg">NEW</span>
                    </div>
                    <Progress value={0} className="h-1.5 bg-indigo-800" />
                  </div>
                ))
              ) : (
                <p className="text-indigo-200 text-[10px] font-black uppercase tracking-widest">You're all caught up!</p>
              )}
            </div>
          </div>

          <Button 
            onClick={() => navigate('/student/surveys')}
            className="w-full mt-10 h-16 bg-white text-indigo-600 font-black rounded-2xl hover:bg-slate-900 hover:text-white transition-all duration-500 uppercase tracking-widest text-xs relative z-10 shadow-2xl shadow-indigo-900/20"
          >
            All Assessments
          </Button>
        </Card>
      </div>

      {/* Bottom Banner */}
      <Card className="relative h-[450px] rounded-[5rem] border-none overflow-hidden group shadow-2xl">
        <img
          src="https://c.animaapp.com/mljmun0txvpkRP/img/ai_1.png"
          alt="OMSC Campus"
          className="absolute inset-0 w-full h-full object-cover scale-110 group-hover:scale-100 transition-transform duration-[2000ms]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
        <div className="absolute bottom-16 left-16 right-16 text-white">
          <p className="text-indigo-400 font-black uppercase tracking-[0.5em] text-[10px] mb-4">Community Highlight</p>
          <h2 className="text-6xl font-black italic uppercase leading-none mb-6">Campus Life<br/>at OMSC San Jose</h2>
          <Button className="bg-white text-slate-900 hover:bg-indigo-600 hover:text-white h-14 px-10 rounded-2xl font-black uppercase text-xs tracking-widest transition-all">
            See More Stories
          </Button>
        </div>
      </Card>
    </div>
  );
}