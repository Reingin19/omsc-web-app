import { useState, useRef, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { ToastAction } from "../../components/ui/toast";
import { 
  Upload, Search, FileText, Trash2, Loader2, Calendar, 
  Download, Eye, Image as ImageIcon, Globe, TrendingUp, X, ArrowLeft, FileCheck, Youtube, Link as LinkIcon, Film
} from 'lucide-react';
import { useToast } from '../../hooks/use-toast';

export default function MaterialLibrary() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & States
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isYoutubeMode, setIsYoutubeMode] = useState(false);
  const [previewFile, setPreviewFile] = useState<any | null>(null);
  const [tempFile, setTempFile] = useState<File | null>(null);
  
  // Form States
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState('General Awareness');
  const [editDescription, setEditDescription] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');

  useEffect(() => {
    fetchMaterials();
  }, []);

  async function fetchMaterials() {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('materials').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setMaterials(data || []);
    } catch (error: any) {
      toast({ title: "SYNC ERROR", description: "Failed to load library.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  const onFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setTempFile(file);
      setIsYoutubeMode(false);
      setEditTitle(file.name.split('.')[0]);
      setIsUploadModalOpen(true);
    }
  };

  const handleFinalUpload = async () => {
    if (!isYoutubeMode && !tempFile) {
        toast({ title: "NO FILE SELECTED", variant: "destructive", className: "font-black uppercase" });
        return;
    }
    if (isYoutubeMode && !youtubeUrl) {
        toast({ title: "YOUTUBE LINK REQUIRED", variant: "destructive", className: "font-black uppercase" });
        return;
    }

    try {
      setUploading(true);
      let finalUrl = youtubeUrl;
      let fileExt = 'LINK';
      let size = '0 MB';
      let type = 'Video';

      if (!isYoutubeMode && tempFile) {
        fileExt = tempFile.name.split('.').pop()?.toLowerCase() || '';
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `public/${fileName}`;

        // Pag-upload sa Supabase Storage
        const { error: uploadError } = await supabase.storage.from('library').upload(filePath, tempFile);
        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage.from('library').getPublicUrl(filePath);
        finalUrl = publicUrl;
        
        // Dynamic Type Checking
        const videoExtensions = ['mp4', 'webm', 'ogg', 'mov'];
        const imageExtensions = ['webp', 'png', 'jpg', 'jpeg'];
        
        if (videoExtensions.includes(fileExt)) {
          type = 'Video';
        } else if (imageExtensions.includes(fileExt)) {
          type = 'Image';
        } else {
          type = tempFile.type.includes('pdf') ? 'PDF' : 'Document';
        }

        size = (tempFile.size / (1024 * 1024)).toFixed(1) + ' MB';
      }

      const { error: dbError } = await supabase.from('materials').insert([{
        title: editTitle,
        description: editDescription,
        category: editCategory,
        file_url: finalUrl,
        type: type,
        format: fileExt.toUpperCase(),
        size: size,
        campus: 'Universal',
        downloads: 0
      }]);

      if (dbError) throw dbError;

      toast({ 
        title: "CONTENT PUBLISHED", 
        description: isYoutubeMode ? "Video link is now live." : "Material added to library.",
        className: "bg-emerald-600 text-white font-black rounded-2xl"
      });
      
      setIsUploadModalOpen(false);
      setTempFile(null);
      setYoutubeUrl('');
      setEditTitle('');
      setEditDescription('');
      fetchMaterials();
    } catch (error: any) {
      toast({ title: "PUBLISH FAILED", description: error.message, variant: "destructive" });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const getEmbedUrl = (url: string) => {
    if (url.includes('youtube.com/watch?v=')) return url.replace('watch?v=', 'embed/');
    if (url.includes('youtu.be/')) return url.replace('youtu.be/', 'youtube.com/embed/');
    return url;
  };

  const handleAction = async (item: any, mode: 'view' | 'download') => {
    await supabase.from('materials').update({ downloads: (item.downloads || 0) + 1 }).eq('id', item.id);
    setMaterials(materials.map(m => m.id === item.id ? { ...m, downloads: (m.downloads || 0) + 1 } : m));

    if (mode === 'download' && item.format !== 'LINK') {
      toast({ title: "DOWNLOADING...", description: "Please wait while we fetch your file.", className: "font-black uppercase" });
      const link = document.createElement('a');
      link.href = item.file_url;
      link.setAttribute('download', `${item.title}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } else {
      setPreviewFile(item);
    }
  };

  const handleDelete = (id: number) => {
    toast({
      title: "DELETE THIS ITEM?",
      description: "This will permanently remove the material from the library.",
      variant: "destructive",
      className: "bg-slate-900 text-white font-black rounded-2xl border-none p-6 shadow-2xl",
      action: (
        <div className="flex gap-2">
          <ToastAction altText="No" className="bg-slate-700 text-white font-black rounded-xl text-[10px] uppercase">No</ToastAction>
          <ToastAction 
            altText="Yes"
            className="bg-red-600 text-white font-black rounded-xl px-4 py-2 text-[10px] uppercase shadow-lg shadow-red-500/20"
            onClick={async () => {
              try {
                const { error } = await supabase.from('materials').delete().eq('id', id);
                if (error) throw error;
                setMaterials(prev => prev.filter(m => m.id !== id));
                toast({ title: "DELETED", description: "Item removed from library.", className: "bg-slate-800 text-white font-black rounded-2xl" });
              } catch (error: any) {
                toast({ variant: "destructive", title: "DELETE FAILED", description: error.message });
              }
            }}
          >
            Yes, Delete
          </ToastAction>
        </div>
      ),
    });
  };

  if (loading) return (
    <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
      <Loader2 className="animate-spin text-indigo-600 w-12 h-12" />
      <p className="font-black uppercase text-[10px] tracking-[0.3em] text-slate-400">Syncing Materials...</p>
    </div>
  );

  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto relative min-h-screen font-sans">
      {/* File input accepting videos now */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={onFileSelect} 
        className="hidden" 
        accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.mp4,.webm,.mov" 
      />

      {/* --- PREVIEWER --- */}
      {previewFile && (
        <div className="fixed inset-0 z-[200] bg-slate-900 flex flex-col animate-in fade-in duration-300">
          <div className="h-20 bg-white/5 backdrop-blur-xl flex items-center justify-between px-8 border-b border-white/10">
            <div className="flex items-center gap-6 text-white">
              <button onClick={() => setPreviewFile(null)} className="p-3 hover:bg-white/10 rounded-2xl transition-all"><ArrowLeft /></button>
              <h2 className="font-black uppercase text-sm tracking-widest">{previewFile.title}</h2>
            </div>
          </div>
          <div className="flex-1 bg-slate-950 flex items-center justify-center p-6">
            {previewFile.type === 'Video' ? (
              previewFile.format === 'LINK' ? (
                <iframe src={getEmbedUrl(previewFile.file_url)} className="w-full max-w-5xl aspect-video rounded-3xl shadow-2xl border-none" allowFullScreen title="YouTube Video" />
              ) : (
                <video 
                  src={previewFile.file_url} 
                  controls 
                  className="w-full max-w-5xl aspect-video rounded-3xl shadow-2xl bg-black"
                  controlsList="nodownload"
                >
                  Your browser does not support the video tag.
                </video>
              )
            ) : previewFile.type === 'Image' ? (
              <img src={previewFile.file_url} className="max-w-full max-h-full object-contain rounded-xl shadow-2xl" />
            ) : (
              <iframe src={previewFile.file_url} className="w-full h-full rounded-2xl bg-white" title="Preview" />
            )}
          </div>
        </div>
      )}

      {/* --- UPLOAD MODAL --- */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-md animate-in zoom-in duration-300">
          <Card className="w-full max-w-lg bg-white rounded-[3rem] p-10 shadow-2xl border-none relative">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-black uppercase tracking-tighter">Publish Content</h2>
              <button onClick={() => setIsUploadModalOpen(false)} className="p-2 hover:bg-slate-50 rounded-full transition-all"><X /></button>
            </div>

            <div className="space-y-4">
              {isYoutubeMode ? (
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400">YouTube URL</Label>
                  <Input value={youtubeUrl} onChange={(e) => setYoutubeUrl(e.target.value)} placeholder="https://youtube.com/..." className="rounded-2xl h-14 bg-slate-50 border-none px-6 font-bold" />
                </div>
              ) : (
                <div className="p-4 bg-indigo-50 rounded-2xl flex items-center gap-3">
                    <FileCheck className="text-indigo-600" />
                    <span className="text-xs font-bold text-indigo-900 truncate">{tempFile?.name}</span>
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400">Title</Label>
                <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="rounded-2xl h-14 bg-slate-50 border-none px-6 font-bold" />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400">Category</Label>
                <select className="w-full h-14 rounded-2xl bg-slate-50 border-none px-6 font-bold text-sm" value={editCategory} onChange={(e) => setEditCategory(e.target.value)}>
                  <option value="General Awareness">General Awareness</option>
                  <option value="Academic Support">Academic Support</option>
                  <option value="Psychosocial Resource">Psychosocial Resource</option>
                  <option value="Policy/Manual">Policy / Manual</option>
                </select>
              </div>
              
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400">Description</Label>
                <textarea className="w-full rounded-2xl bg-slate-50 border-none p-6 font-medium text-sm min-h-[100px]" value={editDescription} onChange={(e) => setEditDescription(e.target.value)} />
              </div>
            </div>

            <Button onClick={handleFinalUpload} disabled={uploading} className="w-full h-16 bg-indigo-600 hover:bg-indigo-700 rounded-[2rem] font-black uppercase mt-8 text-white transition-all shadow-xl">
              {uploading ? <Loader2 className="animate-spin mr-2" /> : <Upload className="mr-2" />}
              Publish Now
            </Button>
          </Card>
        </div>
      )}

      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm">
        <div>
          <h1 className="text-5xl font-black tracking-tighter text-slate-900 uppercase leading-none">Material <span className="text-indigo-600">Hub</span></h1>
          <p className="text-slate-400 font-bold text-[10px] uppercase mt-2 tracking-widest">Digital Resource Library for Students</p>
        </div>
        <div className="flex gap-4">
            <Button onClick={() => { setIsYoutubeMode(true); setEditTitle(''); setIsUploadModalOpen(true); }} className="h-16 px-8 bg-red-600 hover:bg-red-700 rounded-3xl font-black uppercase text-[10px] text-white transition-all shadow-xl">
                <Youtube className="mr-2 w-5 h-5" /> Add YT Link
            </Button>
            <Button onClick={() => fileInputRef.current?.click()} className="h-16 px-8 bg-slate-900 hover:bg-indigo-600 rounded-3xl font-black uppercase text-[10px] text-white transition-all shadow-xl">
                <Upload className="mr-2 w-5 h-5" /> Upload File
            </Button>
        </div>
      </div>

      {/* --- SEARCH BAR --- */}
      <div className="relative">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <Input 
          placeholder="Search materials by title or category..."
          className="h-16 pl-16 rounded-[2rem] bg-white border-none shadow-sm font-bold text-lg"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* --- LIST GRID --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {materials.filter(m => m.title.toLowerCase().includes(searchQuery.toLowerCase())).map((item) => (
          <Card key={item.id} className="group p-10 border-none shadow-sm hover:shadow-2xl transition-all duration-500 bg-white rounded-[4rem] relative overflow-hidden">
            <div className="flex items-start gap-8">
              <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center group-hover:bg-indigo-600 group-hover:rotate-6 transition-all duration-500 shadow-inner">
                {item.type === 'Video' ? (
                  item.format === 'LINK' ? <Youtube className="h-12 w-12 text-red-600 group-hover:text-white" /> : <Film className="h-12 w-12 text-indigo-600 group-hover:text-white" />
                ) : item.type === 'Image' ? (
                  <ImageIcon className="h-12 w-12 text-indigo-600 group-hover:text-white" />
                ) : (
                  <FileText className="h-12 w-12 text-indigo-600 group-hover:text-white" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start mb-2">
                  <span className="px-5 py-2 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest">{item.category}</span>
                  <button onClick={() => handleDelete(item.id)} className="text-slate-200 hover:text-red-500 transition-colors p-2"><Trash2 className="w-6 h-6" /></button>
                </div>
                <h3 className="text-3xl font-black text-slate-800 uppercase tracking-tighter mb-2">{item.title}</h3>
                <p className="text-slate-400 text-sm font-medium line-clamp-2 mb-6 h-10">{item.description || 'No description provided.'}</p>
                
                <div className="grid grid-cols-2 gap-4">
                  <Button onClick={() => handleAction(item, 'view')} variant="outline" className="h-14 rounded-2xl border-2 border-slate-50 font-black uppercase text-[11px] tracking-widest hover:bg-slate-50 transition-all">
                    <Eye className="w-5 h-5 mr-3" /> {item.type === 'Video' ? 'Watch' : 'View'}
                  </Button>
                  {item.format !== 'LINK' ? (
                    <Button onClick={() => handleAction(item, 'download')} className="h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 font-black uppercase text-[11px] text-white transition-all shadow-lg shadow-indigo-200">
                        <Download className="w-5 h-5 mr-3" /> Save
                    </Button>
                  ) : (
                    <div className="flex items-center justify-center bg-slate-50 rounded-2xl px-4 py-2">
                       <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">YouTube Stream</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>
        ))}

        {materials.length === 0 && !loading && (
          <div className="col-span-full text-center py-20 bg-slate-50 rounded-[4rem] border-2 border-dashed border-slate-200">
             <FileText className="w-16 h-16 text-slate-200 mx-auto mb-4" />
             <p className="font-black uppercase text-slate-400 tracking-widest">The library is currently empty.</p>
          </div>
        )}
      </div>
    </div>
  );
}