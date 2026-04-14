import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../hooks/use-toast';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Search, Calendar, MapPin, Users, Loader2, Clock, CheckCircle2 } from 'lucide-react';

interface Program {
  id: number;
  title: string;
  date: string;
  time_range: string;
  location: string;
  category: string;
  capacity: number;
  registered: number;
  status: string;
}

export default function ProgramsActivities() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRegistrations, setUserRegistrations] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<number | null>(null);
  
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  const getUserIdFromStorage = () => {
    const id = localStorage.getItem("userId");
    // Ginawang Number dahil integer ang ID sa database mo
    return (id && id !== "undefined" && id !== "null") ? Number(id) : null;
  };

  useEffect(() => {
    setCurrentUserId(getUserIdFromStorage());
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const userId = getUserIdFromStorage();
    
    try {
      const { data: programsData, error: programsError } = await supabase
        .from('programs')
        .select('*')
        .order('date', { ascending: true });

      if (programsError) throw programsError;
      if (programsData) setPrograms(programsData);

      // Integer check para sa user registrations
      if (userId && !isNaN(userId)) {
        const { data: regs, error: regError } = await supabase
          .from('program_registrations')
          .select('program_id')
          .eq('user_id', userId);
        
        if (regError) throw regError;
        if (regs) setUserRegistrations(regs.map(r => Number(r.program_id)));
      }
    } catch (err: any) {
      console.error('Error fetching data:', err);
      toast({
        variant: "destructive",
        title: "SYNC ERROR",
        description: err.message || "Failed to connect to database.",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { 
    fetchData(); 
  }, [fetchData]);

  const handleRegister = async (programId: number) => {
    const userIdForAction = getUserIdFromStorage();

    // Check kung valid number ang ID
    if (!userIdForAction || isNaN(userIdForAction)) {
      toast({ 
        variant: "destructive", 
        title: "AUTHENTICATION ERROR", 
        description: "Invalid user session. Please log out and log in again.",
        className: "bg-red-600 text-white font-black rounded-2xl" 
      });
      return;
    }

    setIsSubmitting(programId);
    try {
      const { error } = await supabase
        .from('program_registrations')
        .insert([{ 
          program_id: programId, 
          user_id: userIdForAction // Integer na ang ipinapasa rito
        }]);

      if (error) {
        if (error.code === '23505') throw new Error("You're already registered!");
        throw error;
      }

      toast({
        title: "SUCCESSFULLY REGISTERED",
        description: "Your slot has been reserved. See you there!",
        className: "bg-emerald-600 text-white font-black border-none rounded-2xl shadow-2xl",
      });

      setUserRegistrations(prev => [...prev, programId]);
      fetchData(); 
      
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "REGISTRATION FAILED",
        description: err.message,
      });
    } finally {
      setIsSubmitting(null);
    }
  };

  const filteredPrograms = programs.filter((program) => {
    const title = program.title?.toLowerCase() || '';
    const query = searchQuery.toLowerCase();
    const matchesSearch = title.includes(query);
    const matchesCategory = categoryFilter === 'all' || program.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
        <p className="text-slate-500 font-bold animate-pulse text-[10px] uppercase tracking-widest">Syncing with Supabase Cloud...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 p-2">
      <div>
        <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase mb-2">
          Programs & <span className="text-indigo-600">Activities</span>
        </h1>
        <p className="text-slate-500 font-medium tracking-tight">Guidance events for OMSC Students</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-[2rem] shadow-sm border border-slate-100">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input
            placeholder="Search programs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 h-12 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 font-bold"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full md:w-64 h-12 bg-slate-50 border-none rounded-2xl font-bold text-slate-600 uppercase text-[10px] tracking-widest">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent className="rounded-2xl border-none shadow-xl">
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="Career">Career</SelectItem>
            <SelectItem value="Wellness">Wellness</SelectItem>
            <SelectItem value="Academic">Academic</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {filteredPrograms.length > 0 ? (
          filteredPrograms.map((program) => {
            const isRegistered = userRegistrations.includes(Number(program.id));
            const isFull = program.registered >= program.capacity;

            return (
              <Card key={program.id} className="p-8 rounded-[2.5rem] border-none shadow-sm bg-white hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 group relative overflow-hidden">
                <div className={`absolute top-0 right-0 px-6 py-2 rounded-bl-[1.5rem] text-[10px] font-black uppercase tracking-widest
                  ${program.status === 'upcoming' ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-white'}`}>
                  {program.status}
                </div>

                <div className="space-y-4">
                  <span className="px-4 py-1.5 bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest rounded-full inline-block">
                    {program.category || 'General'}
                  </span>
                  <h3 className="text-2xl font-black text-slate-800 tracking-tight uppercase leading-none">
                    {program.title}
                  </h3>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-6 mb-8">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-600 bg-slate-50 p-3 rounded-2xl">
                    <Calendar className="w-4 h-4 text-indigo-600" />
                    <span>{new Date(program.date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-600 bg-slate-50 p-3 rounded-2xl">
                    <Clock className="w-4 h-4 text-indigo-600" />
                    <span>{program.time_range}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-600 bg-slate-50 p-3 rounded-2xl col-span-2">
                    <MapPin className="w-4 h-4 text-indigo-600" />
                    <span className="truncate">{program.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-600 bg-slate-50 p-3 rounded-2xl col-span-2">
                    <Users className="w-4 h-4 text-indigo-600" />
                    <span>{program.registered} / {program.capacity} Enrolled</span>
                  </div>
                </div>

                <Button 
                  onClick={() => handleRegister(Number(program.id))}
                  disabled={isFull || isRegistered || isSubmitting === program.id}
                  className={`w-full h-14 rounded-[1.5rem] font-black uppercase transition-all shadow-lg 
                    ${isRegistered 
                      ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-50 cursor-default shadow-none border border-emerald-100' 
                      : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
                >
                  {isSubmitting === program.id ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : isRegistered ? (
                    <span className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5" /> Registered</span>
                  ) : isFull ? (
                    'Full Capacity'
                  ) : (
                    'Register Now'
                  )}
                </Button>
              </Card>
            );
          })
        ) : (
          <div className="col-span-full text-center py-20 bg-white rounded-[3rem] border-2 border-dashed border-slate-200">
            <p className="text-slate-400 font-black uppercase tracking-widest">No programs found.</p>
          </div>
        )}
      </div>
    </div>
  );
}