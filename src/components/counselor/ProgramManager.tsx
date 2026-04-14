import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { useToast } from '../../hooks/use-toast';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '../../components/ui/dialog';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '../../components/ui/select';
import { Label } from '../../components/ui/label';
import { 
  Plus, Search, Edit, Trash2, Calendar, MapPin, 
  Users, Loader2, Camera, X, ImageIcon, Clock 
} from 'lucide-react';

export default function ProgramManagement() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [programs, setPrograms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');

  // TIME PICKER STATES
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('17:00');

  const [formData, setFormData] = useState({
    title: '', date: '', time_range: '', // IBALIK SA time_range PARA MAG-MATCH SA DB
    location: '', category: '', capacity: 0, 
    registered: 0, status: 'upcoming', image_url: '' 
  });

  const fetchPrograms = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('programs')
        .select('*')
        .order('date', { ascending: true });
      if (error) throw error;
      setPrograms(data || []);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPrograms(); }, []);

  // Helper: Convert 24h to 12h AM/PM
  const formatTo12h = (time24: string) => {
    if (!time24) return "";
    const [hour, minute] = time24.split(':');
    const h = parseInt(hour);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 || 12;
    return `${hour12}:${minute} ${ampm}`;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({ variant: "destructive", title: "File too large", description: "Max 5MB only." });
        return;
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleOpenDialog = (program?: any) => {
    if (program) {
      setEditingId(program.id);
      setFormData({
        title: program.title || '', 
        date: program.date || '',
        time_range: program.time_range || '', // Gamitin ang time_range
        location: program.location || '',
        category: program.category || '', 
        capacity: program.capacity || 0,
        registered: program.registered || 0, 
        status: program.status || 'upcoming',
        image_url: program.image_url || ''
      });
      setPreviewUrl(program.image_url || '');
    } else {
      setEditingId(null);
      setFormData({ 
        title: '', date: '', time_range: '', location: '', category: '', 
        capacity: 0, registered: 0, status: 'upcoming', image_url: ''
      });
      setPreviewUrl('');
    }
    setStartTime('08:00');
    setEndTime('17:00');
    setSelectedFile(null);
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.title || !formData.date) {
      toast({ variant: "destructive", title: "Required", description: "Title and Date are mandatory." });
      return;
    }

    try {
      let finalImageUrl = formData.image_url;
      if (selectedFile) {
        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `posters/${fileName}`;
        const { error: uploadError } = await supabase.storage.from('program-posters').upload(filePath, selectedFile);
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from('program-posters').getPublicUrl(filePath);
        finalImageUrl = urlData.publicUrl;
      }

      // PINAGSAMA NA START AT END TIME
      const combinedTime = `${formatTo12h(startTime)} - ${formatTo12h(endTime)}`;

      // Dito natin sinisigurado na 'time_range' ang ise-save sa DB
      const payload = { 
        ...formData, 
        time_range: combinedTime, 
        image_url: finalImageUrl 
      };

      if (editingId) {
        const { error } = await supabase.from('programs').update(payload).eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('programs').insert([payload]);
        if (error) throw error;
      }

      toast({ title: "SUCCESS", description: "Program saved." });
      setIsDialogOpen(false);
      fetchPrograms();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Save Error", description: err.message });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this program?")) return;
    try {
      const { error } = await supabase.from('programs').delete().eq('id', id);
      if (error) throw error;
      fetchPrograms();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    }
  };

  return (
    <div className="space-y-8 p-6 pb-20 animate-in fade-in duration-700 max-w-[1400px] mx-auto">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase">
            Programs <span className="text-indigo-600">Portal</span>
          </h1>
          <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest mt-1">
            OMSC Guidance Management System
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl h-12 px-8 font-black uppercase text-[10px] tracking-widest shadow-lg transition-all">
          <Plus className="w-4 h-4 mr-2" /> Add New Program
        </Button>
      </div>

      {/* SEARCH BOX */}
      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
        <Input
          placeholder="Search programs..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-12 h-14 rounded-2xl bg-white border-none shadow-sm font-bold text-slate-700"
        />
      </div>

      {/* GRID LIST */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-20 space-y-4">
            <Loader2 className="animate-spin w-10 h-10 text-indigo-600" />
            <p className="text-[10px] font-black uppercase text-slate-400">Loading...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {programs.filter(p => p.title?.toLowerCase().includes(searchQuery.toLowerCase())).map((program) => (
            <Card key={program.id} className="overflow-hidden rounded-[2.5rem] border-none shadow-sm bg-white group hover:shadow-2xl transition-all duration-500 flex flex-col">
              
              <div className="aspect-[4/3] w-full bg-slate-900 relative overflow-hidden">
                {program.image_url ? (
                  <img src={program.image_url} alt={program.title} className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-700" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-700">
                    <ImageIcon size={48} strokeWidth={1} />
                  </div>
                )}
                <div className="absolute top-5 right-5">
                    <span className={`px-4 py-2 text-[9px] font-black rounded-full uppercase shadow-xl backdrop-blur-md border ${program.status === 'upcoming' ? 'bg-indigo-500/90 text-white' : 'bg-emerald-500/90 text-white'}`}>
                        {program.status}
                    </span>
                </div>
              </div>

              <div className="p-8 space-y-4 flex-1 flex flex-col">
                <h3 className="text-xl font-black text-slate-800 uppercase line-clamp-2">{program.title}</h3>
                <div className="space-y-3 flex-1">
                    <div className="flex items-center gap-3 text-[10px] font-black uppercase text-slate-400">
                        <Calendar className="w-4 h-4 text-indigo-500" /> {new Date(program.date).toLocaleDateString()}
                    </div>
                    {/* DISPLAY TIME RANGE SA CARD */}
                    <div className="flex items-center gap-3 text-[10px] font-black uppercase text-slate-400">
                        <Clock className="w-4 h-4 text-indigo-500" /> {program.time_range || 'No Schedule'}
                    </div>
                    <div className="flex items-center gap-3 text-[10px] font-black uppercase text-slate-400">
                        <MapPin className="w-4 h-4 text-indigo-500" /> {program.location}
                    </div>
                </div>

                <div className="flex items-center justify-between pt-6 border-t border-slate-50 mt-4">
                    <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-indigo-600" />
                        <span className="text-[11px] font-black text-slate-700">{program.registered} / {program.capacity} Enrolled</span>
                    </div>
                    <div className="flex gap-1">
                        <Button size="icon" variant="ghost" className="rounded-xl" onClick={() => handleOpenDialog(program)}><Edit className="w-4 h-4" /></Button>
                        <Button size="icon" variant="ghost" className="rounded-xl text-rose-600" onClick={() => handleDelete(program.id)}><Trash2 className="w-4 h-4" /></Button>
                    </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* MODAL DIALOG */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-xl bg-white border-none rounded-[3rem] p-10 shadow-2xl overflow-y-auto max-h-[90vh]">
          <DialogHeader><DialogTitle className="text-3xl font-black uppercase tracking-tighter">{editingId ? 'Edit Program' : 'New Program'}</DialogTitle></DialogHeader>
          
          <div className="grid grid-cols-1 gap-6 mt-6">
            {/* POSTER SECTION */}
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400 ml-2">Poster</Label>
              <div onClick={() => fileInputRef.current?.click()} className="relative aspect-video w-full rounded-[2rem] border-2 border-dashed border-slate-200 bg-slate-900 flex items-center justify-center cursor-pointer overflow-hidden">
                {previewUrl ? (
                  <>
                    <img src={previewUrl} className="w-full h-full object-contain" />
                    <Button onClick={(e) => { e.stopPropagation(); setPreviewUrl(''); setSelectedFile(null); }} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-rose-500 p-0 shadow-lg"><X className="w-4 h-4" /></Button>
                  </>
                ) : (
                  <div className="text-center"><Camera className="w-6 h-6 text-indigo-400 mx-auto" /><p className="text-[9px] font-black uppercase mt-2">Upload Poster</p></div>
                )}
                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400 ml-2">Event Title</Label>
              <Input value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} className="rounded-2xl h-14 bg-slate-50 border-none font-bold" />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400 ml-2">Date</Label>
                <Input type="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} className="rounded-2xl h-14 bg-slate-50 border-none font-bold" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400 ml-2">Status</Label>
                <Select value={formData.status} onValueChange={(v) => setFormData({...formData, status: v})}>
                  <SelectTrigger className="rounded-2xl h-14 bg-slate-50 border-none font-bold"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="upcoming">Upcoming</SelectItem>
                    <SelectItem value="ongoing">Ongoing</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* TIME PICKER SECTION (START & END) */}
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400 ml-2">Schedule (Select Range)</Label>
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl">
                <div className="space-y-1">
                    <span className="text-[8px] font-black text-indigo-600 ml-1 uppercase">Start</span>
                    <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="bg-white border-none rounded-xl font-bold" />
                </div>
                <div className="space-y-1">
                    <span className="text-[8px] font-black text-indigo-600 ml-1 uppercase">End</span>
                    <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="bg-white border-none rounded-xl font-bold" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400 ml-2">Location</Label>
                <Input value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} className="rounded-2xl h-14 bg-slate-50 border-none font-bold" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400 ml-2">Capacity</Label>
                <Input type="number" value={formData.capacity} onChange={(e) => setFormData({...formData, capacity: Number(e.target.value)})} className="rounded-2xl h-14 bg-slate-50 border-none font-bold" />
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-10">
            <Button variant="ghost" className="flex-1 h-14 rounded-2xl font-black uppercase text-[10px]" onClick={() => setIsDialogOpen(false)}>Discard</Button>
            <Button className="flex-[2] h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black uppercase text-[10px] shadow-xl" onClick={handleSave}>
              {editingId ? 'Update Information' : 'Confirm & Publish'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}