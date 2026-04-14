import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { 
  Loader2, Users, Calendar, Clock, AlertCircle, 
  Search, CheckCircle, XCircle, Trash2, Filter 
} from 'lucide-react';

export default function ProgramRegistrations() {
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchRegistrations();
  }, []);

  async function fetchRegistrations() {
    try {
      setLoading(true);
      setErrorMsg(null);
      
      const { data, error } = await supabase
        .from('program_registrations')
        .select(`
          id,
          created_at,
          status,
          programs ( title, date, time_range, location ),
          users ( name, email, student_id )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRegistrations(data || []);
    } catch (err: any) {
      console.error("Fetch Error:", err);
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Handle Attendance Status Update
  const updateStatus = async (id: number, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('program_registrations')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;
      
      // Local State Update para mabilis ang UI
      setRegistrations(prev => prev.map(reg => 
        reg.id === id ? { ...reg, status: newStatus } : reg
      ));
    } catch (err: any) {
      alert("Failed to update status: " + err.message);
    }
  };

  // Handle Delete Registration
  const deleteRegistration = async (id: number) => {
    if (!window.confirm("Are you sure you want to remove this registrant?")) return;
    
    try {
      const { error } = await supabase
        .from('program_registrations')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setRegistrations(prev => prev.filter(reg => reg.id !== id));
    } catch (err: any) {
      alert("Delete failed: " + err.message);
    }
  };

  const filteredRegistrations = registrations.filter(reg => 
    reg.users?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    reg.programs?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    reg.users?.student_id?.includes(searchTerm)
  );

  if (loading) return (
    <div className="h-[60vh] flex items-center justify-center">
      <Loader2 className="animate-spin text-indigo-600 w-10 h-10" />
    </div>
  );

  return (
    <div className="p-6 space-y-8 animate-in fade-in duration-700 font-sans">
      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none">
            Event <span className="text-indigo-600">Registrants</span>
          </h1>
          <p className="text-slate-400 font-black uppercase text-[10px] tracking-[0.3em] mt-2 italic">
            OMSC Attendance Management
          </p>
        </div>
        <div className="flex items-center gap-3">
            <div className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-black uppercase text-xs shadow-xl">
            Total: {filteredRegistrations.length}
            </div>
        </div>
      </div>

      {/* --- SEARCH & FILTERS --- */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input 
            placeholder="Search student name, ID, or program..."
            className="pl-12 h-14 bg-white border-none rounded-2xl shadow-sm font-bold"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {errorMsg && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-xl flex items-center gap-3">
          <AlertCircle className="text-red-500 w-5 h-5" />
          <p className="text-red-700 text-sm font-bold uppercase tracking-tight">Error: {errorMsg}</p>
        </div>
      )}

      {/* --- REGISTRANTS TABLE --- */}
      <Card className="rounded-[2.5rem] border-none shadow-xl overflow-hidden bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="p-6 font-black uppercase text-[10px] tracking-widest text-slate-400">Student Details</th>
                <th className="p-6 font-black uppercase text-[10px] tracking-widest text-slate-400">Program Info</th>
                <th className="p-6 font-black uppercase text-[10px] tracking-widest text-slate-400">Status</th>
                <th className="p-6 font-black uppercase text-[10px] tracking-widest text-slate-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredRegistrations.length > 0 ? (
                filteredRegistrations.map((reg) => (
                  <tr key={reg.id} className="hover:bg-slate-50/50 transition-all group">
                    <td className="p-6">
                      <div className="flex flex-col">
                        <span className="font-black text-slate-900 uppercase tracking-tight text-sm">
                          {reg.users?.name || 'Unknown Student'}
                        </span>
                        <span className="text-[10px] text-indigo-600 font-black uppercase mt-0.5">
                          ID: {reg.users?.student_id || 'N/A'}
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold">{reg.users?.email}</span>
                      </div>
                    </td>

                    <td className="p-6">
                      <div className="flex flex-col gap-1">
                        <span className="font-black text-slate-700 text-xs uppercase tracking-tight">
                          {reg.programs?.title}
                        </span>
                        <div className="flex items-center gap-2 text-[9px] font-bold text-slate-400 uppercase">
                          <Calendar className="w-3 h-3" /> {reg.programs?.date}
                          <Clock className="w-3 h-3 ml-1" /> {reg.programs?.time_range}
                        </div>
                      </div>
                    </td>

                    <td className="p-6">
                      <Badge className={`rounded-lg px-3 py-1 font-black uppercase text-[9px] border-none shadow-sm ${
                        reg.status === 'attended' 
                        ? 'bg-emerald-100 text-emerald-600' 
                        : 'bg-amber-100 text-amber-600'
                      }`}>
                        {reg.status || 'pending'}
                      </Badge>
                    </td>

                    <td className="p-6 text-right">
                      <div className="flex justify-end items-center gap-2">
                        {reg.status !== 'attended' ? (
                          <Button 
                            onClick={() => updateStatus(reg.id, 'attended')}
                            className="bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-xl h-10 w-10 p-0 transition-all shadow-none"
                          >
                            <CheckCircle className="w-5 h-5" />
                          </Button>
                        ) : (
                          <Button 
                            onClick={() => updateStatus(reg.id, 'pending')}
                            className="bg-amber-50 text-amber-600 hover:bg-amber-600 hover:text-white rounded-xl h-10 w-10 p-0 transition-all shadow-none"
                          >
                            <XCircle className="w-5 h-5" />
                          </Button>
                        )}
                        <Button 
                          onClick={() => deleteRegistration(reg.id)}
                          className="bg-red-50 text-red-500 hover:bg-red-500 hover:text-white rounded-xl h-10 w-10 p-0 transition-all shadow-none"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 opacity-30">
                        <Users className="w-12 h-12" />
                        <p className="font-black uppercase text-xs tracking-[0.2em]">No results found</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}