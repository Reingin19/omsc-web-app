import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { 
  FileText, 
  Image as ImageIcon, 
  Video, 
  Download, 
  Eye, 
  Loader2, 
  HardDrive,
  Search,
  Calendar,
  ExternalLink
} from 'lucide-react';

export default function IECMaterials() {
  const [activeTab, setActiveTab] = useState('articles');
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // 1. FETCH DATA FROM SUPABASE
  useEffect(() => {
    fetchMaterials();
  }, []);

  async function fetchMaterials() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('materials')
        .select('*')
        .eq('campus', 'San Jose Campus') // Dito mag-ma-match sa in-upload ni Counselor
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMaterials(data || []);
    } catch (error) {
      console.error('Error fetching materials:', error);
    } finally {
      setLoading(false);
    }
  }

  // 2. DOWNLOAD LOGIC (Force download instead of just opening tab)
  const downloadFile = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      window.open(url, '_blank'); // Fallback
    }
  };

  // 3. FILTERING LOGIC
  const filteredData = materials.filter(m => 
    m.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const articles = filteredData.filter(m => m.type?.toUpperCase() === 'PDF' || m.type?.toUpperCase() === 'DOCUMENT');
  const infographics = filteredData.filter(m => m.type?.toUpperCase() === 'IMAGE');
  const videos = filteredData.filter(m => m.type?.toUpperCase() === 'VIDEO' || m.type?.toUpperCase() === 'MP4');

  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto animate-in fade-in duration-700">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <div className="space-y-1">
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter italic uppercase">
            IEC <span className="text-indigo-600">Materials</span>
          </h1>
          <p className="text-slate-500 font-medium flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-400" />
            Resources for San Jose Campus • Updated Today
          </p>
        </div>

        <div className="relative w-full md:w-80 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500" />
          <Input
            placeholder="Search resources..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-11 h-12 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-slate-100/50 p-1.5 rounded-2xl mb-8 border border-slate-100">
          <TabsTrigger value="articles" className="px-8 rounded-xl font-bold data-[state=active]:bg-white data-[state=active]:text-indigo-600">
            Articles
          </TabsTrigger>
          <TabsTrigger value="infographics" className="px-8 rounded-xl font-bold data-[state=active]:bg-white data-[state=active]:text-indigo-600">
            Infographics
          </TabsTrigger>
          <TabsTrigger value="videos" className="px-8 rounded-xl font-bold data-[state=active]:bg-white data-[state=active]:text-indigo-600">
            Videos
          </TabsTrigger>
        </TabsList>

        {loading ? (
          <div className="h-64 flex flex-col items-center justify-center gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
            <p className="text-slate-400 font-bold italic animate-pulse uppercase text-xs tracking-widest">Syncing Library</p>
          </div>
        ) : (
          <>
            {/* ARTICLES TAB */}
            <TabsContent value="articles" className="grid grid-cols-1 md:grid-cols-2 gap-6 outline-none">
              {articles.length > 0 ? articles.map((item) => (
                <Card key={item.id} className="p-6 bg-white border-none shadow-sm rounded-[2rem] hover:shadow-xl hover:shadow-indigo-500/5 transition-all group">
                  <div className="flex gap-5">
                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-50 transition-colors">
                      <FileText className="w-8 h-8 text-indigo-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl font-black text-slate-800 truncate uppercase italic leading-none mb-1">{item.title}</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">
                        Uploaded: {new Date(item.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                      </p>
                      
                      <div className="flex gap-2">
                        <Button 
                          onClick={() => window.open(item.file_url, '_blank')}
                          className="flex-1 h-11 bg-slate-900 hover:bg-indigo-600 rounded-xl font-black italic uppercase text-xs tracking-tighter"
                        >
                          <Eye className="w-3 h-3 mr-2" /> View
                        </Button>
                        <Button 
                          onClick={() => downloadFile(item.file_url, `${item.title}.${item.format}`)}
                          variant="outline"
                          className="flex-1 h-11 border-slate-200 rounded-xl font-black italic uppercase text-xs tracking-tighter"
                        >
                          <Download className="w-3 h-3 mr-2" /> Save
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              )) : <EmptyState message="No articles found" />}
            </TabsContent>

            {/* INFOGRAPHICS TAB */}
            <TabsContent value="infographics" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 outline-none">
              {infographics.length > 0 ? infographics.map((item) => (
                <Card key={item.id} className="overflow-hidden bg-white border-none shadow-sm rounded-[2.5rem] group hover:shadow-2xl transition-all duration-500">
                  <div className="relative h-56 bg-slate-100 overflow-hidden">
                    <img src={item.file_url} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                       <Button onClick={() => window.open(item.file_url, '_blank')} className="rounded-full bg-white/20 backdrop-blur text-white border-white/50 border h-12 w-12 p-0">
                          <ExternalLink className="w-5 h-5" />
                       </Button>
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="font-black text-slate-800 truncate uppercase italic mb-1">{item.title}</h3>
                    <p className="text-[10px] font-bold text-slate-400 mb-4 tracking-tighter italic">
                      {new Date(item.created_at).toDateString()} • {item.size}
                    </p>
                    <Button 
                      onClick={() => downloadFile(item.file_url, `${item.title}.${item.format}`)}
                      className="w-full h-12 bg-slate-900 hover:bg-indigo-600 rounded-2xl font-black italic uppercase text-xs"
                    >
                      <Download className="w-4 h-4 mr-2" /> Download Image
                    </Button>
                  </div>
                </Card>
              )) : <EmptyState message="No infographics found" />}
            </TabsContent>

            {/* VIDEOS TAB */}
            <TabsContent value="videos" className="grid grid-cols-1 md:grid-cols-2 gap-6 outline-none">
              {videos.length > 0 ? videos.map((item) => (
                <Card key={item.id} className="p-8 bg-white border-none shadow-sm rounded-[2.5rem] group">
                  <div className="flex items-center gap-6">
                    <div className="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center">
                      <Video className="w-10 h-10 text-indigo-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-black text-slate-800 uppercase italic leading-none mb-1">{item.title}</h3>
                      <p className="text-xs font-bold text-slate-400 mb-5 tracking-widest">{new Date(item.created_at).toLocaleDateString()} • {item.size}</p>
                      <Button 
                        onClick={() => window.open(item.file_url, '_blank')}
                        className="bg-indigo-600 hover:bg-indigo-700 h-12 px-8 rounded-2xl font-black italic uppercase text-xs shadow-lg shadow-indigo-100"
                      >
                        Watch Resource
                      </Button>
                    </div>
                  </div>
                </Card>
              )) : <EmptyState message="Video library is empty" />}
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="col-span-full py-32 text-center bg-slate-50/50 rounded-[3rem] border-4 border-dashed border-slate-100">
      <HardDrive className="w-16 h-16 text-slate-200 mx-auto mb-4" />
      <p className="text-slate-400 font-black italic uppercase text-xl tracking-tighter">{message}</p>
    </div>
  );
}