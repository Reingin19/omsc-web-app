import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { useToast } from '../../hooks/use-toast';
import { Textarea } from '../../components/ui/textarea';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '../../components/ui/dialog';
import { Label } from '../../components/ui/label';
import { 
  Plus, Search, Edit, Trash2, Calendar, MapPin, 
  Loader2, Camera, FileText, ChevronDown, ChevronUp, Download, Clock, AlertCircle
} from 'lucide-react';

export default function ProgramManagement() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const materialRef = useRef<HTMLInputElement>(null);
  
  const [programs, setPrograms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // File States
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [materialFile, setMaterialFile] = useState<File | null>(null);

  // Time States
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('17:00');

  const [formData, setFormData] = useState({
    title: '', 
    date: '', 
    location: '', 
    category: 'General', 
    capacity: 0, 
    status: 'upcoming', 
    image_url: '',
    content: '' 
  });

  // --- NEW LOGIC: SYSTEM LOCK & CONFLICT CHECK ---
  // 1. Lock ang system kung may kahit isang 'ongoing' program
  const isSystemLocked = programs.some(p => p.status === 'ongoing');

  // 2. Check kung ang napiling date ay occupied na ng ibang program (na hindi tapos)
  const isDateOccupied = programs.some(p => 
    p.date === formData.date && 
    p.status !== 'completed' && 
    p.id !== editingId
  );
  // ----------------------------------------------

  const fetchPrograms = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('programs')
        .select(`*, materials (*)`)
        .order('created_at', { ascending: false }); 

      if (error) throw error;
      setPrograms(data || []);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPrograms(); }, []);

  const formatTo12h = (time24: string) => {
    if (!time24) return "";
    const [hour, minute] = time24.split(':');
    const h = parseInt(hour);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 || 12;
    return `${hour12}:${minute} ${ampm}`;
  };

  const handleOpenDialog = (program?: any) => {
    if (program) {
      setEditingId(program.id);
      setFormData({
        title: program.title, date: program.date,
        location: program.location, category: program.category || 'General',
        capacity: program.capacity, status: program.status,
        image_url: program.image_url, content: program.content || ''
      });
      setPreviewUrl(program.image_url || '');
    } else {
      setEditingId(null);
      setFormData({ 
        title: '', date: '', location: '', category: 'General', 
        capacity: 0, status: 'upcoming', image_url: '', content: ''
      });
      setPreviewUrl('');
    }
    setMaterialFile(null);
    setSelectedFile(null);
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    // Final Guard Clause
    if (!editingId && isSystemLocked) {
        toast({ variant: "destructive", title: "Action Blocked", description: "Close the ongoing program first." });
        return;
    }

    try {
      setLoading(true);
      let finalImageUrl = formData.image_url;

      if (selectedFile) {
        const path = `posters/${Date.now()}_${selectedFile.name}`;
        const { error: uploadError } = await supabase.storage.from('program-posters').upload(path, selectedFile);
        if (uploadError) throw uploadError;
        const { data } = supabase.storage.from('program-posters').getPublicUrl(path);
        finalImageUrl = data.publicUrl;
      }

      const combinedTime = `${formatTo12h(startTime)} - ${formatTo12h(endTime)}`;
      const payload = { 
        ...formData, 
        time_range: combinedTime, 
        image_url: finalImageUrl 
      };

      let currentProgramId = editingId;

      if (editingId) {
        const { error } = await supabase.from('programs').update(payload).eq('id', editingId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from('programs').insert([payload]).select().single();
        if (error) throw error;
        currentProgramId = data.id;
      }

      if (materialFile && currentProgramId) {
        const matPath = `${currentProgramId}/${Date.now()}_${materialFile.name}`;
        const { error: storageError } = await supabase.storage.from('materials').upload(matPath, materialFile);
        if (storageError) throw storageError;
        const { data: matUrl } = supabase.storage.from('materials').getPublicUrl(matPath);
        const { error: dbError } = await supabase.from('materials').insert([{
          program_id: currentProgramId,
          title: materialFile.name,
          file_url: matUrl.publicUrl
        }]);
        if (dbError) throw dbError;
      }

      toast({ title: "Success", description: "Program and Content Published Successfully." });
      setIsDialogOpen(false);
      fetchPrograms();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Save Error", description: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 p-6 pb-20 max-w-[1400px] mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase">Programs <span className="text-indigo-600">Portal</span></h1>
          <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest mt-1">Counselor Interface</p>
        </div>
        
        {/* UPDATED CREATE BUTTON: Naka-disable kung may ongoing */}
        <Button 
            onClick={() => handleOpenDialog()} 
            disabled={isSystemLocked}
            className={`rounded-2xl h-12 px-8 font-black uppercase text-[10px] transition-all ${
                isSystemLocked ? "bg-slate-300 text-slate-500 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700"
            }`}
        >
          {isSystemLocked ? (
            <> <Clock className="w-4 h-4 mr-2" /> System Locked (Ongoing Event) </>
          ) : (
            <> <Plus className="w-4 h-4 mr-2" /> Create New Program </>
          )}
        </Button>
      </div>

      {/* Search and List components remain the same... */}
      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <Input 
            placeholder="Search programs or content..." 
            className="pl-12 h-14 rounded-2xl bg-white border-none shadow-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 gap-6">
        {programs.filter(p => p.title.toLowerCase().includes(searchQuery.toLowerCase())).map((program) => (
          <Card key={program.id} className="overflow-hidden rounded-[2rem] border-none shadow-sm bg-white transition-all">
            <div className="flex flex-col md:flex-row">
              <div className="md:w-72 h-48 md:h-auto bg-slate-900 relative">
                <img src={program.image_url || '/placeholder.png'} className="w-full h-full object-cover" alt="" />
                <div className="absolute top-4 left-4">
                    <span className={`text-white text-[8px] font-black px-3 py-1 rounded-full uppercase ${
                        program.status === 'ongoing' ? 'bg-emerald-500 animate-pulse' : 'bg-indigo-600'
                    }`}>
                        {program.status}
                    </span>
                </div>
              </div>

              <div className="p-8 flex-1">
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="text-2xl font-black text-slate-800 uppercase leading-none mb-2">{program.title}</h3>
                        <div className="flex flex-wrap gap-4 text-slate-400 text-[10px] font-bold uppercase">
                            <span className="flex items-center gap-1"><Calendar className="w-3 h-3 text-indigo-500" /> {program.date}</span>
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-indigo-500" /> {program.time_range}</span>
                            <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-indigo-500" /> {program.location}</span>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button size="icon" variant="ghost" onClick={() => handleOpenDialog(program)}><Edit className="w-4 h-4"/></Button>
                        <Button size="icon" variant="ghost" className="text-rose-500"><Trash2 className="w-4 h-4"/></Button>
                    </div>
                </div>

                <Button 
                    variant="ghost" 
                    className="mt-6 w-full border-t border-dashed rounded-none justify-between text-indigo-600 font-black text-[10px] uppercase"
                    onClick={() => setExpandedId(expandedId === program.id ? null : program.id)}
                >
                    {expandedId === program.id ? 'Hide Details' : 'View Details & Materials'}
                    {expandedId === program.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </Button>

                {expandedId === program.id && (
                  <div className="mt-4 space-y-4 animate-in slide-in-from-top-2 duration-300">
                    <div className="bg-slate-50 p-6 rounded-2xl text-slate-600 text-sm leading-relaxed">
                        <Label className="text-[9px] font-black uppercase text-indigo-500 block mb-2">Description</Label>
                        {program.content || "No details provided for this program."}
                    </div>
                    {/* Materials section remains same... */}
                    <div className="space-y-2">
                        <Label className="text-[9px] font-black uppercase text-indigo-500 block mb-2">Attached Materials</Label>
                        {program.materials?.length > 0 ? (
                            program.materials.map((mat: any) => (
                                <a key={mat.id} href={mat.file_url} target="_blank" rel="noreferrer" className="flex items-center justify-between p-4 bg-white border rounded-xl hover:border-indigo-500 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <FileText className="w-5 h-5 text-indigo-500" />
                                        <span className="text-xs font-bold text-slate-700">{mat.title}</span>
                                    </div>
                                    <Download className="w-4 h-4 text-slate-400" />
                                </a>
                            ))
                        ) : <p className="text-[10px] text-slate-400 font-bold italic">No downloadable materials available.</p>}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl bg-white rounded-[2.5rem] p-8 max-h-[95vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="text-3xl font-black uppercase italic">Setup Program</DialogTitle></DialogHeader>
          
          <div className="grid gap-6 mt-4">
            <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase ml-2 text-slate-400">Poster Image</Label>
                        <div onClick={() => fileInputRef.current?.click()} className="aspect-video bg-slate-100 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer overflow-hidden relative">
                            {previewUrl ? <img src={previewUrl} className="w-full h-full object-cover" alt="Preview" /> : <div className="text-center"><Camera className="mx-auto text-slate-300"/><span className="text-[8px] font-black uppercase text-slate-400">Upload Poster</span></div>}
                            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => {
                                const file = e.target.files?.[0];
                                if(file) { setSelectedFile(file); setPreviewUrl(URL.createObjectURL(file)); }
                            }} />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase ml-2 text-slate-400">Title</Label>
                        <Input value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} className="rounded-xl bg-slate-50 border-none h-12 font-bold" />
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase ml-2 text-slate-400">Full Content/Details</Label>
                        <Textarea 
                            value={formData.content} 
                            onChange={(e) => setFormData({...formData, content: e.target.value})}
                            placeholder="Write the full details of the program here..."
                            className="h-[180px] rounded-2xl bg-slate-50 border-none font-medium text-sm"
                        />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                    <Label className={`text-[10px] font-black uppercase text-slate-400 ${isDateOccupied ? 'text-rose-500' : ''}`}>Date</Label>
                    <Input 
                        type="date" 
                        value={formData.date} 
                        onChange={(e) => setFormData({...formData, date: e.target.value})} 
                        className={`rounded-xl bg-slate-50 border-none h-12 font-bold text-[11px] transition-all ${
                            isDateOccupied ? 'ring-2 ring-rose-500 bg-rose-50' : ''
                        }`} 
                    />
                    {isDateOccupied && (
                        <p className="text-[8px] text-rose-500 font-bold uppercase flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> Date occupied
                        </p>
                    )}
                </div>
                {/* Materials input remains same... */}
                <div className="space-y-2 col-span-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400">Attachment (PDF/Docs)</Label>
                    <div onClick={() => materialRef.current?.click()} className="h-12 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center px-4 cursor-pointer">
                        <FileText className="w-4 h-4 text-indigo-500 mr-2" />
                        <span className="text-[10px] font-black text-indigo-700 uppercase truncate">
                            {materialFile ? materialFile.name : 'Click to select material file'}
                        </span>
                        <input type="file" ref={materialRef} className="hidden" onChange={(e) => setMaterialFile(e.target.files?.[0] || null)} />
                    </div>
                </div>
            </div>

            {/* STATUS DROPDOWN (Dito nila ise-set ang 'Completed' para ma-unlock ang system) */}
            <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400">Update Status</Label>
                <select 
                    value={formData.status} 
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    className="w-full h-12 rounded-xl bg-slate-50 border-none px-4 font-bold text-xs uppercase"
                >
                    <option value="upcoming">Upcoming</option>
                    <option value="ongoing">Ongoing</option>
                    <option value="completed">Completed</option>
                </select>
            </div>

            {/* UPDATED SAVE BUTTON: Disable kung may Date Conflict */}
            <Button 
                onClick={handleSave} 
                disabled={loading || isDateOccupied} 
                className={`w-full h-16 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl transition-all ${
                    isDateOccupied ? "bg-rose-100 text-rose-400 cursor-not-allowed" : "bg-indigo-600 text-white"
                }`}
            >
                {loading ? <Loader2 className="animate-spin" /> : 
                 isDateOccupied ? 'Date Unavailable' : 
                 (editingId ? 'Update Everything' : 'Confirm & Publish')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}