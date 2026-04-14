import React, { useState, useEffect } from "react";
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Sparkles, Video, Loader2, Cpu, Zap, Layers, Info, Terminal, Activity } from "lucide-react";
import { useToast } from "../../hooks/use-toast";

const VideoGenerator: React.FC = () => {
  const { toast } = useToast();
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedVideo, setGeneratedVideo] = useState<string | null>(null);
  const [loadingText, setLoadingText] = useState("Initializing AI Engine...");
  const [progress, setProgress] = useState(0);

  const loadingSteps = [
    "Analyzing prompt semantics...",
    "Connecting to OMSC Neural Grid...",
    "Injecting guidance datasets...",
    "Building cinematic visual mood...",
    "Synthesizing guidance-aligned frames...",
    "Applying lighting + aura effects...",
    "Synchronizing spatial audio layers...",
    "Compiling neural render output...",
    "Optimizing for OMSC portal...",
    "Finalizing AI experience..."
  ];

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isGenerating) {
      let step = 0;
      interval = setInterval(() => {
        setLoadingText(loadingSteps[step % loadingSteps.length]);
        step++;
        // Simulation of non-linear progress for realism
        setProgress((prev) => {
          if (prev >= 98) return 98;
          const jump = Math.random() * 5;
          return prev + jump;
        });
      }, 2800);
    } else {
      setProgress(0);
    }
    return () => clearInterval(interval);
  }, [isGenerating]);

  const handleGenerate = async () => {
    if (!prompt) return;

    setIsGenerating(true);
    setGeneratedVideo(null);
    setProgress(0);

    // 30 Seconds simulation
    setTimeout(() => {
      // NOTE: Replace this with your actual Supabase URL
      setGeneratedVideo("https://iyong-project.supabase.co/storage/v1/object/public/videos/cyberbullying_awareness.mp4");
      setIsGenerating(false);
      setProgress(100);
      toast({
        title: "AI SYNTHESIS COMPLETE",
        description: "The educational resource has been successfully generated.",
        className: "bg-[#0066cc] text-white font-black rounded-2xl border-none shadow-2xl",
      });
    }, 30000);
  };

  return (
    <div className="w-full py-24 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-blue-50 via-white to-orange-50 min-h-screen mt-[80px]">
      <div className="max-w-[1100px] mx-auto px-6">

        {/* --- HEADER --- */}
        <div className="text-center mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-6 py-2 bg-white/80 backdrop-blur-md text-[#0066cc] rounded-full font-black text-[11px] uppercase tracking-[0.3em] shadow-sm border border-blue-100 animate-pulse">
            <Sparkles size={14} /> OMSC Veo-Guidance System v2.0
          </div>
          <h1 className="text-6xl md:text-8xl font-black text-slate-900 uppercase italic tracking-tighter leading-none">
            AI Video <span className="text-[#0066cc]">Lab</span>
          </h1>
          <p className="text-slate-500 font-bold max-w-lg mx-auto uppercase text-[10px] tracking-[0.2em] leading-relaxed">
            Transform text prompts into high-fidelity educational awareness resources instantly.
          </p>
        </div>

        {/* --- MAIN INTERFACE --- */}
        <Card className="p-2 md:p-10 rounded-[4rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.1)] bg-white/40 backdrop-blur-2xl border border-white/60 overflow-hidden">
          <div className="space-y-8">
            
            {/* INPUT AREA */}
            <div className="p-4 bg-white/60 rounded-[2.5rem] shadow-inner border border-white/80">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Terminal className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                  <input
                    value={prompt}
                    disabled={isGenerating}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe topic (e.g., Cyberbullying Awareness for Freshmen)..."
                    className="w-full h-20 pl-16 pr-8 rounded-[2rem] bg-white border-none shadow-sm text-lg font-bold focus:ring-4 focus:ring-blue-100 outline-none transition-all placeholder:text-slate-300"
                  />
                </div>
                <Button 
                  onClick={handleGenerate} 
                  disabled={isGenerating || !prompt}
                  className="h-20 px-12 rounded-[2rem] bg-[#0066cc] hover:bg-blue-700 text-white font-black uppercase italic tracking-tighter transition-all active:scale-95 shadow-lg disabled:opacity-70 group"
                >
                  {isGenerating ? <Loader2 className="animate-spin mr-2" size={24} /> : <Zap className="mr-2 group-hover:animate-pulse" size={20} />}
                  {isGenerating ? "Synthesizing..." : "Generate AI Video"}
                </Button>
              </div>
            </div>

            {/* DISPLAY WINDOW */}
            <div className="relative aspect-video bg-slate-950 rounded-[3rem] shadow-2xl overflow-hidden border-[8px] border-white flex flex-col items-center justify-center">
              
              {generatedVideo ? (
                <video src={generatedVideo} controls autoPlay className="w-full h-full object-cover animate-in fade-in duration-1000" />
              ) : (
                <div className="relative z-10 text-center w-full px-12">
                  {isGenerating ? (
                    <div className="space-y-10">
                      
                      {/* ENHANCED AI CORE ANIMATION */}
                      <div className="relative w-32 h-32 mx-auto">
                        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-blue-600 via-cyan-400 to-yellow-300 blur-2xl animate-spin opacity-50" />
                        <div className="absolute inset-0 rounded-full border-2 border-white/20 border-dashed animate-reverse-spin" style={{ animation: 'spin 10s linear infinite reverse' }} />
                        <div className="relative h-full w-full rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/20">
                          <Cpu className="w-14 h-14 text-blue-400 animate-pulse" />
                        </div>
                      </div>

                      {/* LOADING TEXTS */}
                      <div className="space-y-6">
                        <div className="flex flex-col items-center gap-2">
                          <p className="text-cyan-400 font-black uppercase tracking-[0.5em] text-[10px]">
                            Neural Synthesis in Progress
                          </p>
                          <h3 className="text-white text-xl font-bold italic tracking-tight h-8">
                            {loadingText}
                          </h3>
                        </div>

                        {/* CUSTOM PROGRESS BAR */}
                        <div className="w-full max-w-md mx-auto space-y-2">
                          <div className="h-3 w-full bg-white/5 rounded-full p-1 border border-white/10">
                            <div
                              className="h-full bg-gradient-to-r from-blue-600 via-cyan-400 to-yellow-300 rounded-full transition-all duration-500 shadow-[0_0_15px_rgba(37,99,235,0.5)]"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <div className="flex justify-between px-2 text-[10px] font-black uppercase tracking-widest text-white/30">
                            <span>Engine Load: 94.2%</span>
                            <span>{Math.floor(progress)}% Optimized</span>
                          </div>
                        </div>
                      </div>

                      {/* TECHNICAL STATUS GRID */}
                      <div className="grid grid-cols-3 gap-6 max-w-lg mx-auto pt-6 border-t border-white/5">
                         {[
                           { label: "Neural Sync", val: "Active", color: "text-emerald-400" },
                           { label: "Render Engine", val: "Veo v2", color: "text-blue-400" },
                           { label: "Data Pipeline", val: "Secure", color: "text-yellow-400" }
                         ].map((s, idx) => (
                           <div key={idx} className="space-y-1 text-center">
                              <p className="text-[9px] font-black uppercase text-white/20 tracking-tighter">{s.label}</p>
                              <p className={`text-[10px] font-bold uppercase ${s.color} animate-pulse`}>{s.val}</p>
                           </div>
                         ))}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6 opacity-40 group hover:opacity-100 transition-opacity">
                      <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto border border-white/10 group-hover:scale-110 transition-transform">
                        <Video className="w-12 h-12 text-white/20" />
                      </div>
                      <div className="space-y-2">
                        <p className="text-white/40 font-black uppercase text-[10px] tracking-[0.4em]">System Idle</p>
                        <p className="text-white/20 text-[9px] font-bold italic uppercase">Awaiting instruction to begin generation...</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* CRT / SCANLINE OVERLAY */}
              {isGenerating && (
                <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]" />
              )}
            </div>
          </div>
        </Card>

        {/* --- FOOTER SPECS --- */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 px-10">
          {[
            { icon: Activity, label: "Processing Speed", val: "2.4 Teraflops", desc: "Optimized for visual rendering" },
            { icon: Layers, label: "AI Architecture", val: "Google Veo", desc: "Guidance-Specific training" },
            { icon: Zap, label: "Power Mode", val: "Max Efficiency", desc: "OMSC Cloud-Powered sync" }
          ].map((spec, i) => (
            <div key={i} className="flex items-center gap-5 p-6 bg-white rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
               <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-[#0066cc]">
                  <spec.icon size={24} />
               </div>
               <div>
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none mb-1">{spec.label}</p>
                  <p className="text-sm font-black text-slate-800 leading-none mb-1">{spec.val}</p>
                  <p className="text-[9px] font-bold text-slate-400 italic">{spec.desc}</p>
               </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};

export default VideoGenerator;