import { useState, useRef, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { 
  Upload, Search, FileText, Trash2, Loader2, Calendar, 
  Download, Eye, Image as ImageIcon, Globe, TrendingUp, X, ArrowLeft, FileCheck
} from 'lucide-react';
import { useToast } from '../../hooks/use-toast';

export default function MaterialLibrary() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & Preview States
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState<any | null>(null);
  const [tempFile, setTempFile] = useState<File | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState('General Awareness');
  const [editDescription, setEditDescription] = useState('');

  useEffect(() => {
    fetchMaterials();
  }, []);

  async function fetchMaterials() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('materials')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setMaterials(data || []);
    } catch (error: any) {
      toast({ title: "Error", description: "Failed to load library.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this file?")) return;
    try {
      const { error } = await supabase.from('materials').delete().eq('id', id);
      if (error) throw error;
      setMaterials(materials.filter(m => m.id !== id));
      toast({ title: "DELETED", description: "File removed from library." });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    }
  };

  // --- STEP 1: PAGPILI NG FILE ---
  const onFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      console.log("File selected:", file.name); // Para ma-check sa console
      setTempFile(file);
      setEditTitle(file.name.split('.')[0]); // Default name
      setIsUploadModalOpen(true); // DAPAT LALABAS NA YUNG MODAL DITO
    }
  };

  // --- STEP 2: ACTUAL UPLOAD PAGKATAPOS MAG-ADD NG DETAILS ---
  const handleFinalUpload = async () => {
    if (!tempFile) {
        toast({ title: "No file selected", variant: "destructive" });
        return;
    }

    try {
      setUploading(true);
      const fileExt = tempFile.name.split('.').pop()?.toLowerCase();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `public/${fileName}`;

      const { error: uploadError } = await supabase.storage.from('library').upload(filePath, tempFile);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('library').getPublicUrl(filePath);
      const isImage = ['webp', 'png', 'jpg', 'jpeg'].includes(fileExt || '');

      const { error: dbError } = await supabase.from('materials').insert([{
        title: editTitle,
        description: editDescription,
        category: editCategory,
        file_url: publicUrl,
        type: isImage ? 'Image' : (tempFile.type.includes('pdf') ? 'PDF' : 'Document'),
        format: fileExt?.toUpperCase(),
        size: (tempFile.size / (1024 * 1024)).toFixed(1) + ' MB',
        campus: 'Universal',
        downloads: 0
      }]);

      if (dbError) throw dbError;

      toast({ title: "SUCCESS", description: "File published!" });
      
      // Reset everything
      setIsUploadModalOpen(false);
      setTempFile(null);
      setEditTitle('');
      setEditDescription('');
      fetchMaterials();
    } catch (error: any) {
      toast({ title: "Upload Failed", description: error.message, variant: "destructive" });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleAction = async (item: any, mode: 'view' | 'download') => {
    await supabase.from('materials').update({ downloads: (item.downloads || 0) + 1 }).eq('id', item.id);
    setMaterials(materials.map(m => m.id === item.id ? { ...m, downloads: (m.downloads || 0) + 1 } : m));

    if (mode === 'download') {
      const link = document.createElement('a');
      link.href = item.file_url;
      link.setAttribute('download', `${item.title}.${item.format.toLowerCase()}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } else {
      setPreviewFile(item);
    }
  };

  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto relative min-h-screen font-sans">
      {/* Hidden File Input */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={onFileSelect} 
        className="hidden" 
        accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
      />

      {/* --- IN-APP PREVIEWER --- */}
      {previewFile && (
        <div className="fixed inset-0 z-[200] bg-slate-900 flex flex-col animate-in fade-in duration-300">
          <div className="h-20 bg-white/5 backdrop-blur-xl flex items-center justify-between px-8 border-b border-white/10">
            <div className="flex items-center gap-6 text-white">
              <button onClick={() => setPreviewFile(null)} className="p-3 hover:bg-white/10 rounded-2xl transition-all">
                <ArrowLeft className="w-6 h-6" />
              </button>
              <h2 className="font-black uppercase text-sm tracking-widest">{previewFile.title}</h2>
            </div>
            <Button onClick={() => handleAction(previewFile, 'download')} className="bg-indigo-600 font-black uppercase text-xs h-12 px-8 rounded-2xl shadow-xl">
              <Download className="w-4 h-4 mr-2" /> Download
            </Button>
          </div>
          <div className="flex-1 bg-slate-950 flex items-center justify-center p-6">
            {previewFile.type === 'Image' ? (
              <img src={previewFile.file_url} className="max-w-full max-h-full object-contain rounded-xl shadow-2xl" />
            ) : (
              <iframe src={previewFile.file_url} className="w-full h-full rounded-2xl bg-white border-none" title="Preview" />
            )}
          </div>
        </div>
      )}

      {/* --- MODAL PARA SA DETAILS (DAPAT LUMALABAS ITO) --- */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-md">
          <Card className="w-full max-w-lg bg-white rounded-[3rem] p-10 shadow-2xl border-none animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-3xl font-black uppercase tracking-tighter text-slate-900">File Details</h2>
                {tempFile && (
                    <p className="text-[10px] font-bold text-indigo-500 uppercase mt-1 flex items-center gap-1">
                        <FileCheck className="w-3 h-3" /> Selected: {tempFile.name}
                    </p>
                )}
              </div>
              <button onClick={() => setIsUploadModalOpen(false)} className="text-slate-300 hover:text-slate-900 transition-all"><X /></button>
            </div>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Title / Name</Label>
                <Input 
                  value={editTitle} 
                  onChange={(e) => setEditTitle(e.target.value)} 
                  className="rounded-2xl h-14 font-bold bg-slate-50 border-none px-6 focus:ring-2 focus:ring-indigo-500 shadow-inner" 
                  placeholder="Enter file name..."
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Category</Label>
                <select 
                  className="w-full h-14 rounded-2xl bg-slate-50 border-none px-6 font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-500 shadow-inner" 
                  value={editCategory} 
                  onChange={(e) => setEditCategory(e.target.value)}
                >
                  <option value="General Awareness">General Awareness</option>
                  <option value="Academic Support">Academic Support</option>
                  <option value="Psychosocial Resource">Psychosocial Resource</option>
                  <option value="Policy/Manual">Policy / Manual</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Description</Label>
                <textarea 
                  className="w-full rounded-2xl bg-slate-50 border-none p-6 font-medium text-sm min-h-[120px] outline-none focus:ring-2 focus:ring-indigo-500 shadow-inner" 
                  value={editDescription} 
                  onChange={(e) => setEditDescription(e.target.value)} 
                  placeholder="What is this file about?" 
                />
              </div>
            </div>

            <Button 
                onClick={handleFinalUpload} 
                disabled={uploading} 
                className="w-full h-16 bg-indigo-600 hover:bg-indigo-700 rounded-[2rem] font-black uppercase mt-10 text-white shadow-xl shadow-indigo-200 tracking-widest transition-all active:scale-95"
            >
              {uploading ? <Loader2 className="animate-spin mr-2 h-6 w-6" /> : <Upload className="mr-2 h-6 w-6" />}
              {uploading ? 'Uploading...' : 'Confirm & Publish'}
            </Button>
          </Card>
        </div>
      )}

      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm">
        <div>
          <h1 className="text-5xl font-black tracking-tighter text-slate-900 uppercase leading-none">Material Hub</h1>
          <p className="text-slate-400 flex items-center gap-3 font-bold text-[10px] uppercase mt-4 tracking-[0.2em]"><Globe className="w-4 h-4 text-indigo-500" /> OMSC Global Library</p>
        </div>
        <Button 
            onClick={() => fileInputRef.current?.click()} 
            className="h-20 px-12 bg-slate-900 hover:bg-indigo-600 rounded-[2.5rem] font-black uppercase text-xs tracking-widest text-white transition-all active:scale-95 shadow-2xl"
        >
          <Upload className="mr-4 h-6 w-6" /> Upload File
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-7 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-300" />
        <Input 
            placeholder="Search resources..." 
            value={searchQuery} 
            onChange={(e) => setSearchQuery(e.target.value)} 
            className="pl-16 h-16 bg-white border-none rounded-[2rem] shadow-sm font-bold text-lg focus:ring-2 focus:ring-indigo-100" 
        />
      </div>

      {/* --- LIST GRID --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {materials.filter(m => m.title.toLowerCase().includes(searchQuery.toLowerCase())).map((item) => (
          <Card key={item.id} className="group p-10 border-none shadow-sm hover:shadow-2xl transition-all duration-500 bg-white rounded-[4rem] relative">
            <div className="flex items-start gap-8">
              <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center group-hover:bg-indigo-600 group-hover:rotate-6 transition-all duration-500 shadow-inner">
                {item.type === 'Image' ? <ImageIcon className="h-12 w-12 text-indigo-600 group-hover:text-white" /> : <FileText className="h-12 w-12 text-indigo-600 group-hover:text-white" />}
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <span className="px-5 py-2 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase mb-4 inline-block tracking-widest">{item.category}</span>
                  <button onClick={() => handleDelete(item.id)} className="text-slate-200 hover:text-red-500 transition-colors p-2 rounded-full hover:bg-red-50" title="Delete Material">
                    <Trash2 className="w-6 h-6" />
                  </button>
                </div>
                <h3 className="text-3xl font-black text-slate-800 uppercase tracking-tighter mb-2 leading-none">{item.title}</h3>
                <p className="text-slate-400 text-sm font-medium line-clamp-2 mb-6 leading-relaxed">{item.description || 'No additional details provided.'}</p>
                
                <div className="flex flex-wrap gap-6 mb-8 pt-6 border-t border-slate-50">
                  <div className="flex items-center gap-2 text-[11px] font-black uppercase text-slate-400"><Calendar className="w-5 h-5" /> {new Date(item.created_at).toLocaleDateString()}</div>
                  <div className="flex items-center gap-2 text-[11px] font-black uppercase text-indigo-600 bg-indigo-50/50 px-4 py-1.5 rounded-xl"><TrendingUp className="w-5 h-5" /> {item.downloads || 0} Hits</div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Button onClick={() => handleAction(item, 'view')} variant="outline" className="h-14 rounded-2xl border-2 border-slate-50 font-black uppercase text-[11px] tracking-widest hover:bg-slate-50 hover:border-indigo-100 transition-all shadow-sm">
                    <Eye className="w-5 h-5 mr-3" /> View
                  </Button>
                  <Button onClick={() => handleAction(item, 'download')} className="h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 font-black uppercase text-[11px] tracking-widest text-white shadow-xl shadow-indigo-100 transition-all">
                    <Download className="w-5 h-5 mr-3" /> Download
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}