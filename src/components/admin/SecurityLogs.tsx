import { useState, useEffect } from 'react';
import { Card } from '../../components/ui/card';
import { 
  Search, Loader2, Activity, LogIn, Calendar, 
  ClipboardCheck, UserPlus, GraduationCap, Trash2, Monitor
} from 'lucide-react';

const getActionConfig = (action: string = "") => {
  const act = action.toLowerCase();
  
  // Login/Security
  if (act.includes('login') || act.includes('session')) 
    return { icon: <LogIn className="text-blue-600" />, label: 'Auth', color: 'bg-blue-50' };
  
  // Academic & Quizzes
  if (act.includes('quiz')) 
    return { icon: <ClipboardCheck className="text-purple-500" />, label: 'Quiz', color: 'bg-purple-50' };
  
  // Programs & Enrollment
  if (act.includes('enroll') || act.includes('join') || act.includes('registration')) 
    return { icon: <UserPlus className="text-indigo-500" />, label: 'Registration', color: 'bg-indigo-50' };
  
  // Events & Programs Creation
  if (act.includes('event') || act.includes('program create')) 
    return { icon: <Calendar className="text-rose-500" />, label: 'Management', color: 'bg-rose-50' };
  
  // Academic Grading
  if (act.includes('grade')) 
    return { icon: <GraduationCap className="text-emerald-500" />, label: 'Grading', color: 'bg-emerald-50' };

  // System Changes / Deletion
  if (act.includes('delete') || act.includes('remove')) 
    return { icon: <Trash2 className="text-rose-600" />, label: 'Critical', color: 'bg-rose-100' };
  
  return { icon: <Activity className="text-slate-500" />, label: 'Activity', color: 'bg-slate-50' };
};

export default function SecurityLogs() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchLogs = () => {
    setLoading(true);
    fetch('http://localhost:3001/admin/security-logs')
      .then(res => res.json())
      .then(data => {
        // Siguraduhin na Array ang data para hindi mag-error ang .filter()
        setLogs(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        console.error("Fetch error:", err);
        setLoading(false);
      });
  };

  useEffect(() => { fetchLogs(); }, []);

  // Updated filter: gumagamit na ng 'user_email' imbes na 'user'
  const filteredLogs = logs.filter(l => 
    (l.action?.toLowerCase() || "").includes(search.toLowerCase()) || 
    (l.user_email?.toLowerCase() || "").includes(search.toLowerCase()) ||
    (l.details?.toLowerCase() || "").includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
      {/* Header Section */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tighter text-slate-900">
            System <span className="text-indigo-600">Omni-Audit</span>
          </h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
            Real-time Visibility: Logins, Enrollments, & System Events
          </p>
        </div>
        <button 
          onClick={fetchLogs} 
          disabled={loading}
          className="p-3 bg-white rounded-2xl shadow-sm border border-slate-200 hover:bg-slate-50 transition-all active:scale-95 disabled:opacity-50"
        >
           <Monitor className={`w-5 h-5 text-indigo-600 ${loading ? 'animate-pulse' : ''}`} />
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
        <input 
          type="text"
          placeholder="Trace email, action, or specific details..."
          className="w-full pl-16 pr-6 py-5 bg-white rounded-[2rem] border-none shadow-md font-bold text-slate-700 focus:ring-2 ring-indigo-500 transition-all outline-none"
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Logs List */}
      <div className="space-y-4">
        {loading ? (
           <div className="flex flex-col items-center justify-center p-20 space-y-4">
             <Loader2 className="animate-spin text-indigo-600 w-10 h-10" />
             <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Syncing with Cloud...</p>
           </div>
        ) : filteredLogs.length === 0 ? (
          <div className="text-center p-20 bg-white rounded-[2rem] shadow-sm">
            <p className="text-slate-400 font-bold uppercase text-sm">No activity found matching your search.</p>
          </div>
        ) : filteredLogs.map((log) => {
          const config = getActionConfig(log.action);
          return (
            <Card key={log.id} className="p-6 border-none shadow-sm rounded-[2.5rem] bg-white hover:shadow-xl transition-all border-l-4 border-l-transparent hover:border-l-indigo-500 overflow-hidden group">
              <div className="flex items-center gap-6">
                {/* Action Icon */}
                <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 ${config.color}`}>
                  {config.icon}
                </div>

                {/* Log Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="px-3 py-1 rounded-xl bg-slate-100 text-[9px] font-black uppercase text-slate-600 tracking-widest">
                      {config.label}
                    </span>
                    <h2 className="font-black text-slate-800 uppercase text-sm truncate">
                      {log.action || "Undefined Action"}
                    </h2>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-y-1 gap-x-4">
                    <div className="flex items-center gap-2">
                       <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center font-black text-[10px] text-indigo-600">
                         {(log.user_email || "?").charAt(0).toUpperCase()}
                       </div>
                       <span className="text-xs font-black text-slate-900 uppercase">
                         @{log.user_email ? log.user_email.split('@')[0] : 'anonymous'}
                       </span>
                    </div>
                    <span className="text-slate-300 hidden md:block">•</span>
                    <p className="text-xs font-medium text-slate-500 italic truncate max-w-md">
                      "{log.details || "No additional details provided."}"
                    </p>
                  </div>
                </div>

                {/* Timestamp & Meta */}
                <div className="text-right shrink-0 hidden sm:block">
                  <p className="text-[11px] font-black text-slate-900">
                    {log.created_at ? new Date(log.created_at).toLocaleTimeString() : '--:--'}
                  </p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">
                    {log.created_at ? new Date(log.created_at).toLocaleDateString() : 'N/A'}
                  </p>
                  <div className="flex items-center justify-end gap-1 mt-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <p className="text-[8px] font-mono text-slate-300">
                      {log.ip_address || '0.0.0.0'}
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}