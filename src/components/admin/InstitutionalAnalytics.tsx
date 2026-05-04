import React, { useState, useEffect } from "react";
import { Card } from "../ui/card";
import { Button } from '../ui/button';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, PieChart, Pie, Cell, LineChart, Line 
} from 'recharts';
import { Users, Building2, TrendingUp, Loader2, RefreshCw, Layers, Download, FileText, FileSpreadsheet, Printer, ArrowUpRight } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "../ui/dropdown-menu";
import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const COLORS = ['#4F46E5', '#A855F7', '#10B981', '#F59E0B', '#F43F5E', '#EC4899'];

export default function InstitutionalAnalytics() {
  const [campusData, setCampusData] = useState<any[]>([]);
  const [trendData, setTrendData] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalStudents: 0, activeCampuses: 0, totalPrograms: 0, engagement: 0 });
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3001/admin/analytics');
      const data = await response.json();
      
      console.log("Supabase Data:", data.campusData); // Tingnan mo ito sa F12 console!

      // 1. MAS MALUWAG NA MAPPING (Tinatanggal ang filter na pumapatay sa data mo)
      const mappedData = (data.campusData || []).map((c: any) => {
        // Linisin ang pangalan (tanggalin spaces)
        let cleanName = String(c.name || "Unknown").trim();
        
        // I-convert ang "Main" to "Labangan"
        if (cleanName.toLowerCase().includes("main")) {
          cleanName = "Labangan";
        }

        return {
          name: cleanName,
          students: Number(c.students || c.student_count || 0),
          programs: Number(c.programs || c.program_count || 0)
        };
      });

      setCampusData(mappedData);
      setTrendData(data.trendData || []);
      
      setStats({
        totalStudents: Number(data.totalStudents) || 0,
        activeCampuses: mappedData.length, // Bilang kung ilang campuses ang pumasok
        totalPrograms: Number(data.totalPrograms) || 0, 
        engagement: Number(data.engagementRate) || 0
      });

    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAnalytics(); }, []);

  // --- EXPORTS ---
  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("INSTITUTIONAL ANALYTICS", 14, 20);
    autoTable(doc, {
      head: [["CAMPUS", "STUDENTS", "PROGRAMS"]],
      body: campusData.map(c => [c.name, c.students, c.programs]),
      startY: 30
    });
    doc.save("OMSC_Report.pdf");
  };

  return (
    <div className="space-y-8 p-4 md:p-8 min-h-screen bg-slate-50/30">
      
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase">
            Data <span className="text-indigo-600">Intelligence</span>
          </h1>
          <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1">Real-time Insights</p>
        </div>
        
        <div className="flex gap-3">
          <Button variant="ghost" onClick={fetchAnalytics} className="rounded-2xl h-12 w-12 border border-slate-200">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="bg-slate-950 text-white rounded-2xl h-12 px-8 font-black uppercase text-[10px]">
                <Download className="w-4 h-4 mr-2" /> Download Report
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="rounded-2xl p-2 bg-white shadow-2xl border-none">
               <DropdownMenuItem onClick={exportPDF} className="font-bold text-[10px] p-3 uppercase">PDF Format</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="Total Enrollment" value={stats.totalStudents} icon={Users} color="text-indigo-600" loading={loading} />
        <StatCard label="Active Campuses" value={stats.activeCampuses} icon={Building2} color="text-orange-600" loading={loading} />
        <StatCard label="Total Programs" value={stats.totalPrograms} icon={Layers} color="text-cyan-600" loading={loading} />
        <StatCard label="Engagement" value={`${stats.engagement}%`} icon={TrendingUp} color="text-emerald-600" loading={loading} />
      </div>

      {/* CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* BAR CHART */}
        <Card className="lg:col-span-2 p-8 rounded-[2.5rem] border-none shadow-sm bg-white">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-8">Campus Comparative Analysis</h3>
          {loading ? <ChartLoader /> : (
            <div className="h-[350px] w-full">
               {campusData.length > 0 ? (
                 <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={campusData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                      <Tooltip cursor={{ fill: '#F8FAFC' }} contentStyle={{ borderRadius: '20px', border: 'none' }} />
                      <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ paddingBottom: '20px', fontSize: '10px', fontWeight: '900' }} />
                      <Bar name="Students" dataKey="students" fill="#4F46E5" radius={[10, 10, 0, 0]} barSize={40} />
                      <Bar name="Programs" dataKey="programs" fill="#C7D2FE" radius={[10, 10, 0, 0]} barSize={40} />
                    </BarChart>
                 </ResponsiveContainer>
               ) : (
                 <div className="h-full flex items-center justify-center text-slate-400 font-bold uppercase text-xs border-2 border-dashed rounded-3xl">No campus data matched the filters</div>
               )}
            </div>
          )}
        </Card>

        {/* PIE CHART */}
        <Card className="p-8 rounded-[2.5rem] border-none shadow-sm bg-white">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-8">Enrollment Split</h3>
          {loading ? <ChartLoader /> : (
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={campusData} innerRadius={80} outerRadius={110} paddingAngle={5} dataKey="students">
                    {campusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

// HELPERS
function StatCard({ label, value, icon: Icon, color, loading }: any) {
  return (
    <Card className="p-7 rounded-[2.2rem] border-none shadow-sm bg-white">
      <div className={`p-4 w-fit rounded-2xl bg-slate-50 ${color} mb-6`}><Icon className="w-6 h-6" /></div>
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{label}</p>
      <div className="text-4xl font-black text-slate-900">
        {loading ? <Loader2 className="w-6 h-6 animate-spin text-indigo-600" /> : value}
      </div>
    </Card>
  );
}

function ChartLoader() {
  return (
    <div className="h-[350px] flex flex-col items-center justify-center space-y-4">
      <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Loading charts...</p>
    </div>
  );
}