import React, { useEffect, useState } from "react";
import { Card } from "../../src/components/ui/card";
import { Badge } from "../../src/components/ui/badge";
import { FileText, Video, Image as ImageIcon, Download, Loader2, Search } from "lucide-react";
import { Input } from "../../src/components/ui/input";

interface Material {
  id: number;
  title: string;
  type: string;
  description: string;
  thumbnail: string;
  url: string;
  downloads?: number;
}

const MaterialsPage: React.FC = () => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        const res = await fetch('http://localhost:3001/api/materials');
        if (res.ok) {
          const data = await res.json();
          setMaterials(data);
        }
      } catch (err) {
        console.error("Error fetching materials:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMaterials();
  }, []);

  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "document": return FileText;
      case "video": return Video;
      case "image": return ImageIcon;
      default: return FileText;
    }
  };

  const getTypeBadgeClass = (type: string) => {
    switch (type.toLowerCase()) {
      case "document": return "bg-blue-100 text-blue-600";
      case "video": return "bg-red-100 text-red-600";
      case "image": return "bg-emerald-100 text-emerald-600";
      default: return "bg-slate-100 text-slate-600";
    }
  };

  const filteredMaterials = materials.filter(m =>
    m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-full py-12 md:py-20 bg-slate-50 min-h-screen">
      <div className="max-w-[1200px] mx-auto px-6">
        
        {/* --- HEADER --- */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div className="space-y-2">
            <Badge className="bg-indigo-100 text-indigo-600 border-none font-black px-4 py-1 rounded-full uppercase italic text-[10px] tracking-widest">
              Resources Library
            </Badge>
            <h1 className="text-4xl md:text-6xl font-black italic uppercase text-slate-900 tracking-tighter leading-none">
              IEC <br /> Materials
            </h1>
            <p className="text-slate-500 font-medium max-w-md italic">
              Access educational and information materials for your personal development.
            </p>
          </div>

          <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input 
              placeholder="Search materials..." 
              className="pl-12 h-14 rounded-2xl border-none shadow-sm font-bold italic focus:ring-2 focus:ring-indigo-500/20 bg-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* --- CONTENT GRID --- */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-64 space-y-4">
            <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
            <p className="text-xs font-black uppercase italic text-slate-400 tracking-widest">Fetching Library...</p>
          </div>
        ) : filteredMaterials.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredMaterials.map((material) => {
              const TypeIcon = getTypeIcon(material.type);
              return (
                <a 
                  key={material.id} 
                  href={material.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="group block no-underline"
                >
                  <Card className="overflow-hidden bg-white rounded-[2.5rem] border-none shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-indigo-100 transition-all duration-500 hover:-translate-y-2 h-full flex flex-col">
                    <div className="relative h-52 overflow-hidden">
                      <img
                        src={material.thumbnail || "https://i.ibb.co/2YNYzpwt/OMSC.png"}
                        alt={material.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        loading="lazy"
                      />
                      <div className="absolute top-4 right-4">
                        <Badge className={`border-none font-black italic uppercase text-[9px] px-3 py-1 rounded-lg shadow-lg ${getTypeBadgeClass(material.type)}`}>
                          <TypeIcon className="h-3 w-3 mr-1" strokeWidth={3} />
                          {material.type}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="p-8 flex flex-col flex-grow space-y-4">
                      <h3 className="text-2xl font-black italic uppercase tracking-tighter leading-tight text-slate-900 group-hover:text-indigo-600 transition-colors">
                        {material.title}
                      </h3>
                      <p className="text-sm font-medium text-slate-500 leading-relaxed italic line-clamp-3">
                        {material.description}
                      </p>
                      
                      <div className="pt-6 mt-auto border-t border-slate-50 flex items-center justify-between">
                        <div className="flex items-center space-x-2 text-[11px] font-black uppercase italic text-slate-400">
                          <Download className="h-4 w-4 text-indigo-600" />
                          <span>{material.downloads || 0} views</span>
                        </div>
                        <span className="text-indigo-600 text-[11px] font-black uppercase italic group-hover:translate-x-2 transition-transform">
                          Open File →
                        </span>
                      </div>
                    </div>
                  </Card>
                </a>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-[3rem] shadow-inner">
            <p className="text-slate-400 font-black italic uppercase tracking-[0.2em]">No materials found.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MaterialsPage;