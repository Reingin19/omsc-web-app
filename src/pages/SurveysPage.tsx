import React, { useEffect, useState } from "react";
import { Card } from "../../src/components/ui/card";
import { Button } from "../../src/components/ui/button";
import { Badge } from "../../src/components/ui/badge";
import { ClipboardList, Clock, CheckCircle2, Loader2, Calendar } from "lucide-react";

interface Survey {
  id: number;
  title: string;
  description: string;
  status: string;
  deadline: string;
  responses?: number;
  estimatedTime?: string;
  url: string;
}

const SurveysPage: React.FC = () => {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSurveys = async () => {
      try {
        const res = await fetch('http://localhost:3001/api/surveys');
        if (res.ok) {
          const data = await res.json();
          setSurveys(data);
        }
      } catch (err) {
        console.error("Error fetching surveys:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSurveys();
  }, []);

  return (
    <div className="w-full py-12 md:py-20 bg-slate-50 min-h-screen">
      <div className="max-w-[1200px] mx-auto px-6">
        
        {/* --- HEADER --- */}
        <div className="mb-12 space-y-4">
          <Badge className="bg-indigo-100 text-indigo-600 border-none font-black px-4 py-1 rounded-full uppercase italic text-[10px] tracking-widest">
            Feedback System
          </Badge>
          <h1 className="text-4xl md:text-6xl font-black italic uppercase text-slate-900 tracking-tighter leading-none">
            Surveys & <br /> Feedback
          </h1>
          <p className="text-slate-500 font-medium max-w-2xl italic leading-relaxed">
            Your voice matters. Participate in our active surveys to help us improve the OMSC guidance programs and support systems.
          </p>
        </div>

        {/* --- CONTENT GRID --- */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-64 space-y-4">
            <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
            <p className="text-xs font-black uppercase italic text-slate-400 tracking-widest">Loading active surveys...</p>
          </div>
        ) : surveys.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {surveys.map((survey) => (
              <Card
                key={survey.id}
                className="p-8 bg-white rounded-[2.5rem] border-none shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-indigo-100 transition-all duration-500 flex flex-col justify-between group overflow-hidden relative"
              >
                {/* Visual Accent */}
                <div className={`absolute top-0 right-0 w-32 h-32 -mr-16 -mt-16 rounded-full opacity-10 transition-transform group-hover:scale-110 ${
                  survey.status === "active" ? "bg-indigo-600" : "bg-slate-600"
                }`} />

                <div className="space-y-6 relative z-10">
                  <div className="flex items-start justify-between">
                    <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center group-hover:bg-indigo-600 transition-colors duration-500">
                      <ClipboardList className="h-7 w-7 text-indigo-600 group-hover:text-white transition-colors" />
                    </div>
                    <Badge
                      className={`rounded-lg px-4 py-1 font-black italic uppercase text-[10px] tracking-wider border-none ${
                        survey.status === "active"
                          ? "bg-emerald-100 text-emerald-600 shadow-sm shadow-emerald-100"
                          : "bg-slate-100 text-slate-400"
                      }`}
                    >
                      {survey.status === "active" ? "● Active" : "Closed"}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-2xl font-black italic uppercase tracking-tighter leading-tight text-slate-900 group-hover:text-indigo-600 transition-colors">
                      {survey.title}
                    </h3>
                    <p className="text-sm font-medium text-slate-500 leading-relaxed italic">
                      {survey.description}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 py-4 border-y border-slate-50">
                    <div className="flex items-center space-x-2 text-[11px] font-black uppercase italic text-slate-400">
                      <Clock className="h-4 w-4 text-indigo-600" />
                      <span>{survey.estimatedTime || "5-10 mins"}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-[11px] font-black uppercase italic text-slate-400">
                      <CheckCircle2 className="h-4 w-4 text-indigo-600" />
                      <span>{survey.responses || 0} Responses</span>
                    </div>
                    <div className="flex items-center space-x-2 text-[11px] font-black uppercase italic text-slate-400 col-span-2">
                      <Calendar className="h-4 w-4 text-indigo-600" />
                      <span>Deadline: <span className="text-slate-900">{survey.deadline}</span></span>
                    </div>
                  </div>
                </div>

                <div className="mt-8 relative z-10">
                  {survey.status === "active" ? (
                    <a 
                      href={survey.url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="block w-full"
                    >
                      <Button className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black italic uppercase tracking-widest shadow-lg shadow-indigo-100 transition-all hover:-translate-y-1">
                        Take Survey Now
                      </Button>
                    </a>
                  ) : (
                    <Button disabled className="w-full h-14 bg-slate-100 text-slate-400 rounded-2xl font-black italic uppercase tracking-widest cursor-not-allowed border-none">
                      Survey Closed
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-[3rem] shadow-inner border-none">
            <p className="text-slate-400 font-black italic uppercase tracking-[0.2em]">No surveys available at the moment.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SurveysPage;