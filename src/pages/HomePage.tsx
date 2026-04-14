import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase"; 
import { Button } from "../../src/components/ui/button";
import { Card } from "../../src/components/ui/card";
import { 
  BookOpen, FileText, ClipboardList, Users, 
  GraduationCap, Calendar, MapPin, ImageIcon, ArrowRight 
} from "lucide-react";

interface HomePageProps {
  onNavigate: (page: "Home" | "Programs" | "Materials" | "Surveys" | "About") => void;
}

interface Program {
  id: number;
  title: string;
  category: string;
  location: string;
  date: string;
  image_url?: string;
}

const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activePage, setActivePage] = useState("home");
  
  const youtubeVideoId = "A2JuNCYrUHE";

  const features = [
    {
      icon: BookOpen,
      title: "Guidance Programs",
      description: "Access comprehensive guidance and counseling programs tailored to student needs.",
      action: () => handleNavigation("Programs"),
    },
    {
      icon: FileText,
      title: "IEC Materials",
      description: "Browse information, education, and communication materials for student awareness.",
      action: () => handleNavigation("Materials"),
    },
    {
      icon: ClipboardList,
      title: "Surveys & Feedback",
      description: "Participate in surveys to help improve guidance services and programs.",
      action: () => handleNavigation("Surveys"),
    },
    {
      icon: Users,
      title: "About Us",
      description: "Learn more about OMSC Guidance services and our commitment to student development.",
      action: () => handleNavigation("About"),
    },
  ];

  const handleNavigation = (page: any) => {
    setActivePage(page);
    onNavigate(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    const fetchPrograms = async () => {
      try {
        const { data, error } = await supabase
          .from('programs')
          .select('*')
          .order('id', { ascending: false })
          .limit(4);
        if (error) throw error;
        if (data) setPrograms(data);
      } catch (err) {
        console.error("Error fetching programs:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPrograms();
  }, []);

  return (
    <div className="w-full min-h-screen bg-white">
      {/* --- NAVBAR (image_040be5.png Style) --- */}
      <header className="fixed top-0 left-0 right-0 h-[80px] bg-[#0066cc] z-50 shadow-lg">
        <div className="max-w-[1440px] mx-auto px-6 h-full flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer group" onClick={() => handleNavigation("home")}>
            <GraduationCap className="w-9 h-9 text-white group-hover:rotate-12 transition-transform" />
            <h1 className="font-black text-xl uppercase tracking-tighter text-white">
              OMSC Guidance
            </h1>
          </div>

          <nav className="hidden md:flex items-center gap-2 font-bold text-[11px] uppercase tracking-wider">
            {['home', 'programs', 'materials', 'surveys', 'about'].map((item) => (
              <button 
                key={item}
                onClick={() => handleNavigation(item)}
                className="relative px-6 py-2 transition-all duration-300 group"
              >
                <span className={`relative z-10 transition-colors duration-300 ${
                  activePage === item ? "text-white" : "text-white/70 hover:text-white"
                }`}>
                  {item === 'materials' ? 'IEC Materials' : item}
                </span>

                {activePage === item && (
                  <div className="absolute inset-0 z-0">
                    <div className="absolute inset-0 border-2 border-white rounded-xl" />
                    <div className="absolute bottom-1 left-1.5 right-1.5 h-1.5 bg-white/90 rounded-b-lg blur-[0.5px]" />
                  </div>
                )}
              </button>
            ))}
          </nav>

          <Button onClick={() => window.location.href = '/login'} className="bg-white text-[#0066cc] hover:bg-slate-100 font-black uppercase text-[10px] px-8 rounded-xl shadow-md transition-all active:scale-95">
            Login
          </Button>
        </div>
      </header>

      {/* --- HERO SECTION --- */}
      <section className="relative h-[600px] md:h-[700px] overflow-hidden mt-[80px] bg-black">
        <div className="absolute inset-0 z-0 pointer-events-none">
          <iframe
            className="absolute top-0 left-0 w-full h-full scale-[1.35]"
            src={`https://www.youtube.com/embed/${youtubeVideoId}?autoplay=1&mute=1&loop=1&playlist=${youtubeVideoId}&controls=0&modestbranding=1`}
            frameBorder="0"
            allow="autoplay; encrypted-media"
            style={{ width: '100vw', height: '56.25vw', minHeight: '100%', minWidth: '177.77vh' }}
          ></iframe>
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/80 to-transparent z-10" />
        <div className="relative max-w-[1200px] mx-auto px-6 h-full flex items-center z-20">
          <div className="max-w-2xl space-y-6 text-left animate-in fade-in slide-in-from-left-10 duration-1000">
            <h1 className="text-5xl md:text-7xl font-black uppercase text-white leading-none tracking-tighter">
              Empowering Students, <br/> <span className="text-blue-400">Enriching Lives.</span>
            </h1>
            <p className="text-lg md:text-xl text-white/90 leading-relaxed font-medium">
              Supporting student development through comprehensive guidance programs and educational materials aligned with CHED standards.
            </p>
            <div className="flex gap-4">
              <Button onClick={() => handleNavigation("programs")} className="bg-white text-blue-700 font-black uppercase h-14 px-10 rounded-2xl hover:bg-slate-100 transition-all shadow-2xl">
                Explore Programs
              </Button>
              <Button onClick={() => handleNavigation("about")} className="bg-transparent text-white border-2 border-white font-black uppercase h-14 px-10 rounded-2xl hover:bg-white/10 transition-all">
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* --- SERVICES/FEATURES SECTION --- */}
      <section className="py-24 bg-white border-b border-slate-100">
        <div className="max-w-[1200px] mx-auto px-6 text-center">
          <div className="mb-16 space-y-2">
            <h2 className="text-4xl font-black uppercase text-slate-900 tracking-tighter">Our Guidance Services</h2>
            <p className="text-slate-500 font-bold uppercase text-xs tracking-[0.2em]">Helping you navigate your academic journey</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="p-8 bg-slate-50 border-none shadow-sm hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 cursor-pointer group rounded-[2.5rem]"
                onClick={feature.action}
              >
                <div className="flex flex-col items-center text-center space-y-5">
                  <div className="w-20 h-20 bg-white rounded-[2rem] flex items-center justify-center shadow-lg group-hover:bg-blue-600 transition-colors duration-500">
                    <feature.icon className="h-10 w-10 text-blue-600 group-hover:text-white" strokeWidth={1.5} />
                  </div>
                  <h3 className="text-xl font-black uppercase tracking-tighter text-slate-800">{feature.title}</h3>
                  <p className="text-sm text-slate-500 font-medium leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* --- LATEST PROGRAMS (Swak Display) --- */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="flex justify-between items-end mb-16">
            <div>
              <h2 className="text-4xl font-black uppercase text-slate-900 tracking-tighter">Latest Programs</h2>
              <div className="h-1.5 w-24 bg-blue-600 mt-3 rounded-full" />
            </div>
            <button onClick={() => handleNavigation("programs")} className="flex items-center gap-2 text-blue-600 font-black uppercase text-xs tracking-widest hover:gap-4 transition-all">
              View All Programs <ArrowRight size={16} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {isLoading ? (
              [1, 2, 3, 4].map((n) => <div key={n} className="aspect-[4/3] bg-slate-200 animate-pulse rounded-[2.5rem]" />)
            ) : (
              programs.map((program, index) => (
                <Card 
                  key={program.id} 
                  className="hover:shadow-[0_40px_80px_-15px_rgba(0,0,0,0.1)] transition-all duration-700 rounded-[2.5rem] border-none group bg-white overflow-hidden flex flex-col"
                  onClick={() => handleNavigation("programs")}
                >
                  {/* IMAGE - SWAK NO CROP */}
                  <div className="aspect-[4/3] bg-[#0f172a] relative overflow-hidden">
                    {program.image_url ? (
                      <img 
                        src={program.image_url} 
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-700" 
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-slate-700 bg-slate-100">
                        <ImageIcon size={40} strokeWidth={1} />
                      </div>
                    )}
                  </div>

                  <div className="p-8 flex flex-col flex-1">
                    <h3 className="text-lg font-black uppercase tracking-tighter leading-tight group-hover:text-blue-600 transition-colors line-clamp-2 mb-4">
                      {program.title}
                    </h3>
                    <div className="mt-auto space-y-3 pt-4 border-t border-slate-50">
                      <div className="flex items-center gap-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        <Calendar size={14} className="text-blue-500" /> 
                        {new Date(program.date).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        <MapPin size={14} className="text-blue-500" /> {program.location}
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      </section>

      {/* --- CTA SECTION --- */}
      <section className="py-24 bg-white">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="bg-[#0066cc] rounded-[3rem] p-12 md:p-20 text-center relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl" />
            <div className="relative z-10 space-y-8">
              <h2 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter">
                Ready to level up your <br/> student life?
              </h2>
              <p className="text-blue-100 text-lg md:text-xl max-w-2xl mx-auto font-medium opacity-90">
                Login to access your personalized dashboard and explore all the guidance resources available to you.
              </p>
              <Button onClick={() => window.location.href = '/login'} className="bg-white text-blue-700 hover:bg-slate-100 font-black uppercase h-16 px-12 rounded-2xl shadow-xl active:scale-95 transition-all">
                Login to Dashboard
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;