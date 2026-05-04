import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../hooks/use-toast';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { ToastAction } from "../../components/ui/toast";
import { 
  Loader2, Users, Calendar, AlertCircle, 
  Search, CheckCircle, XCircle, Trash2 
} from 'lucide-react';

export default function ProgramRegistrations() {
  const { toast } = useToast();
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
          programs!rel_program_id ( title, date, time_range ),
          users!rel_user_id ( name, email, student_id )
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

  // Toggle Attendance with Yes/No Toast Confirmation
  const toggleStatus = (id: number, currentStatus: string) => {
    const isAttended = currentStatus === 'attended';
    const newStatus = isAttended ? 'pending' : 'attended';
    const actionLabel = isAttended ? 'PENDING' : 'ATTENDED';

    toast({
      title: `MARK AS ${actionLabel}?`,
      description: `Change this student's status to ${newStatus.toUpperCase()}?`,
      className: "bg-slate-900 text-white font-black rounded-2xl border-none p-6 shadow-2xl",
      action: (
        <div className="flex gap-2">
          <ToastAction 
            altText="No" 
            className="bg-slate-700 hover:bg-slate-600 text-white border-none font-black rounded-xl px-4 py-2 text-[10px] uppercase"
          >
            No
          </ToastAction>
          <ToastAction 
            altText="Yes"
            className="bg-indigo-600 hover:bg-indigo-700 text-white border-none font-black rounded-xl px-4 py-2 text-[10px] uppercase"
            onClick={async () => {
              try {
                const { error } = await supabase
                  .from('program_registrations')
                  .update({ status: newStatus })
                  .eq('id', id);

                if (error) throw error;
                
                setRegistrations(prev => prev.map(reg => 
                  reg.id === id ? { ...reg, status: newStatus } : reg
                ));

                toast({
                  title: "STATUS UPDATED",
                  description: `Success! Marked as ${newStatus.toUpperCase()}.`,
                  className: "bg-emerald-600 text-white font-black border-none rounded-2xl",
                });
              } catch (err: any) {
                toast({
                  variant: "destructive",
                  title: "UPDATE FAILED",
                  description: err.message,
                });
              }
            }}
          >
            Yes, Update
          </ToastAction>
        </div>
      ),
    });
  };

  // Delete Registrant with Yes/No Toast Confirmation
  const deleteRegistration = async (id: number) => {
    toast({
      title: "REMOVE REGISTRANT?",
      description: "Are you sure? This student will be removed from the list.",
      variant: "destructive",
      className: "bg-slate-900 text-white font-black rounded-2xl border-none p-6 shadow-2xl",
      action: (
        <div className="flex gap-2">
          <ToastAction 
            altText="No" 
            className="bg-slate-700 hover:bg-slate-600 text-white border-none font-black rounded-xl px-4 py-2 text-[10px] uppercase"
          >
            No
          </ToastAction>
          <ToastAction 
            altText="Yes"
            className="bg-red-600 hover:bg-red-700 text-white border-none font-black rounded-xl px-4 py-2 text-[10px] uppercase"
            onClick={async () => {
              try {
                const { error } = await supabase
                  .from('program_registrations')
                  .delete()
                  .eq('id', id);

                if (error) throw error;
                setRegistrations(prev => prev.filter(reg => reg.id !== id));
                
                toast({
                  title: "REMOVED",
                  description: "Registrant successfully deleted.",
                  className: "bg-slate-800 text-white font-black border-none rounded-2xl",
                });
              } catch (err: any) {
                toast({
                  variant: "destructive",
                  title: "DELETE FAILED",
                  description: err.message,
                });
              }
            }}
          >
            Yes, Remove
          </ToastAction>
        </div>
      ),
    });
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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none">
            Event <span className="text-indigo-600">Registrants</span>
          </h1>
          <p className="text-slate-400 font-black uppercase text-[10px] tracking-[0.3em] mt-2 italic">
            OMSC Attendance Management
          </p>
        </div>
        <div className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-black uppercase text-xs shadow-xl">
          Total: {filteredRegistrations.length}
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input 
          placeholder="Search student or program..."
          className="pl-12 h-14 bg-white border-none rounded-2xl shadow-sm font-bold"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {errorMsg && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-xl flex items-center gap-3">
          <AlertCircle className="text-red-500 w-5 h-5" />
          <p className="text-red-700 text-sm font-bold uppercase">Error: {errorMsg}</p>
        </div>
      )}

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
                      </div>
                    </td>

                    <td className="p-6">
                      <div className="flex flex-col">
                        <span className="font-black text-slate-700 text-xs uppercase tracking-tight">
                          {reg.programs?.title || 'Unknown Program'}
                        </span>
                        <div className="flex items-center gap-2 text-[9px] font-bold text-slate-400 uppercase mt-1">
                          <Calendar className="w-3 h-3" /> {reg.programs?.date}
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
                        <Button 
                          onClick={() => toggleStatus(reg.id, reg.status)}
                          className={`rounded-xl h-10 w-10 p-0 transition-all shadow-none ${
                            reg.status === 'attended' 
                            ? 'bg-amber-50 text-amber-600 hover:bg-amber-600 hover:text-white' 
                            : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white'
                          }`}
                        >
                          {reg.status === 'attended' ? <XCircle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
                        </Button>

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
                      <p className="font-black uppercase text-xs tracking-widest">No results found</p>
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