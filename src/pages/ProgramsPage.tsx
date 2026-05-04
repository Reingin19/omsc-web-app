import React, { useEffect, useState } from "react";
import { Card } from "../../src/components/ui/card";
import { Badge } from "../../src/components/ui/badge";
import { Calendar, MapPin, Users, Loader2, Search } from "lucide-react";
import { Input } from "../../src/components/ui/input";

interface Program {
  id: number;
  title: string;
  description: string;
  location: string;
  date: string;
  participants?: number;
  status: string;
}

const ProgramsPage: React.FC = () => {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchPrograms = async () => {
      try {
        const res = await fetch('http://localhost:3001/api/programs');
        if (res.ok) {
          const data = await res.json();
          setPrograms(data.sort((a: any, b: any) => b.id - a.id));
        }
      } catch (err) {
        console.error("Error fetching programs:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPrograms();
  }, []);

  const filteredPrograms = programs.filter(p =>
    p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-full py-12 md:py-20 bg-slate-50 min-h-screen">
      <div className="max-w-[1200px] mx-auto px-6">

        {/* --- HEADER --- */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div className="space-y-2">
            <Badge className="bg-indigo-100 text-indigo-600 border-none font-black px-4 py-1 rounded-full uppercase text-[10px] tracking-widest">
              OMSC Guidance
            </Badge>
            <h1 className="text-4xl md:text-6xl font-black uppercase text-slate-900 tracking-tighter leading-none">
              Guidance <br /> Programs
            </h1>
            <p className="text-slate-500 font-medium max-w-md">
              Explore events and seminars designed for the growth of OMSC students.
            </p>
          </div>

          <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input
              placeholder="Search programs or campus..."
              className="pl-12 h-14 rounded-2xl border-none shadow-sm font-bold focus:ring-2 focus:ring-indigo-500/20 bg-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* --- CONTENT GRID --- */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-64 space-y-4">
            <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
            <p className="text-xs font-black uppercase text-slate-400 tracking-widest">Loading Programs...</p>
          </div>
        ) : filteredPrograms.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPrograms.map((program) => (
              <Card
                key={program.id}
                className="group p-8 bg-white rounded-[2.5rem] border-none shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-indigo-100 transition-all duration-500 hover:-translate-y-2 cursor-pointer relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-2 h-full bg-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity" />

                <div className="space-y-6">
                  <div className="flex items-start justify-between">
                    <Badge className={`rounded-lg px-3 py-1 font-black uppercase text-[9px] tracking-wider border-none ${
                      new Date(program.date) > new Date()
                        ? "bg-emerald-100 text-emerald-600"
                        : "bg-slate-100 text-slate-400"
                    }`}>
                      {new Date(program.date) > new Date() ? "● Upcoming" : "Completed"}
                    </Badge>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-2xl font-black uppercase tracking-tighter leading-tight text-slate-900 group-hover:text-indigo-600 transition-colors">
                      {program.title}
                    </h3>
                    <p className="text-sm font-medium text-slate-500 leading-relaxed line-clamp-3">
                      {program.description || "No description provided for this guidance program."}
                    </p>
                  </div>

                  <div className="space-y-3 pt-4 border-t border-slate-50">
                    <div className="flex items-center space-x-3 text-[11px] font-black uppercase text-slate-400">
                      <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center group-hover:bg-indigo-50 transition-colors">
                        <MapPin className="h-4 w-4 text-indigo-600" />
                      </div>
                      <span>{program.location}</span>
                    </div>

                    <div className="flex items-center space-x-3 text-[11px] font-black uppercase text-slate-400">
                      <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center group-hover:bg-indigo-50 transition-colors">
                        <Calendar className="h-4 w-4 text-indigo-600" />
                      </div>
                      <span>{new Date(program.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                    </div>

                    <div className="flex items-center space-x-3 text-[11px] font-black uppercase text-slate-400">
                      <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center group-hover:bg-indigo-50 transition-colors">
                        <Users className="h-4 w-4 text-indigo-600" />
                      </div>
                      <span>{program.participants || "Open to all"} Participants</span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-[3rem] shadow-inner">
            <p className="text-slate-400 font-black uppercase tracking-[0.2em]">No programs found matching your search.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProgramsPage;