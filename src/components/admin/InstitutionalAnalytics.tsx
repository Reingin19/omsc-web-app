import React, { useState, useEffect } from "react";
import { Card } from "../ui/card";
import { Button } from '../ui/button';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, LineChart, Line, Legend 
} from 'recharts';
import { 
  Activity, Users, Building2, TrendingUp, Loader2, 
  Download, FileText, FileSpreadsheet, File as FileIcon 
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

// Export Libraries
import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable';
import { saveAs } from 'file-saver';

interface CampusData {
  name: string;
  students: number;
  programs: number;
}

export default function InstitutionalAnalytics() {
  const [campusData, setCampusData] = useState<CampusData[]>([]);
  const [trendData, setTrendData] = useState<any[]>([]);
  const [stats, setStats] = useState({ 
    totalStudents: 0, 
    activeCampuses: 0, 
    totalPrograms: 0, 
    engagement: 0 
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:3001/admin/analytics');
        const data = await response.json();
        
        const filteredData = (data.campusData || [])
          .map((c: any) => ({
            ...c,
            name: c.name === "Main" || c.name === "Main Campus" ? "Labangan" : c.name
          }))
          .filter((c: any) => ["Labangan", "San Jose", "Murtha"].includes(c.name));

        setCampusData(filteredData);
        setTrendData(data.trendData || []);
        setStats({
            totalStudents: Number(data.totalStudents) || 0,
            activeCampuses: 3,
            totalPrograms: Number(data.totalPrograms) || 0, 
            engagement: Number(data.engagementRate) || 0 
        });
      } catch (error) {
        console.error("Error fetching analytics:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  // --- EXPORT LOGIC ---

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("INSTITUTIONAL ANALYTICS REPORT", 14, 22);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`DATE GENERATED: ${new Date().toLocaleString().toUpperCase()}`, 14, 30);

    const tableColumn = ["CAMPUS NAME", "TOTAL STUDENTS", "ACTIVE PROGRAMS"];
    const tableRows = campusData.map(c => [c.name.toUpperCase(), c.students, c.programs]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 40,
      theme: 'grid',
      headStyles: { 
        fillColor: [79, 70, 229], 
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9
      },
      styles: { fontSize: 9, cellPadding: 5 }
    });

    doc.save(`OMSC_ANALYTICS_${new Date().getTime()}.pdf`);
  };

  const exportCSV = () => {
    const headers = ["CAMPUS NAME", "TOTAL STUDENTS", "ACTIVE PROGRAMS"].join(",");
    const rows = campusData.map(c => `${c.name},${c.students},${c.programs}`).join("\n");
    const csvContent = `${headers}\n${rows}`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `OMSC_DATA_${new Date().getTime()}.csv`);
  };

  const exportWord = () => {
    const header = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
                    <head><meta charset='utf-8'><style>
                      table { border-collapse: collapse; width: 100%; font-family: sans-serif; }
                      th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
                      th { background-color: #4f46e5; color: white; text-transform: uppercase; font-size: 12px; }
                    </style></head><body>`;
    const footer = "</body></html>";
    
    let content = `<h2>INSTITUTIONAL ANALYTICS SUMMARY</h2>
                   <p>DATE: ${new Date().toLocaleDateString()}</p>
                   <table>
                    <thead>
                      <tr><th>CAMPUS</th><th>STUDENTS</th><th>PROGRAMS</th></tr>
                    </thead>
                    <tbody>`;
    
    campusData.forEach(c => {
      content += `<tr><td>${c.name.toUpperCase()}</td><td>${c.students}</td><td>${c.programs}</td></tr>`;
    });
    content += "</tbody></table>";

    const blob = new Blob(['\ufeff', header + content + footer], { type: 'application/msword' });
    saveAs(blob, `OMSC_REPORT_${new Date().getTime()}.doc`);
  };

  return (
    <div className="space-y-8 p-4 md:p-8 animate-in fade-in duration-500">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase">
            Institutional <span className="text-indigo-600">Analytics</span>
          </h1>
          <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest mt-1">
            Comparative Overview: Labangan, San Jose, & Murtha
          </p>
        </div>
        
        <div className="flex gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="bg-slate-900 hover:bg-indigo-600 text-white rounded-2xl h-12 px-6 font-black uppercase text-[10px] tracking-widest transition-all shadow-xl shadow-slate-200">
                <Download className="w-4 h-4 mr-2" /> Export Data
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-2xl p-2 border-none shadow-2xl bg-white min-w-[180px]">
              <DropdownMenuItem onClick={exportPDF} className="rounded-xl cursor-pointer font-black uppercase text-[9px] p-3 hover:bg-slate-50">
                <FileText className="w-4 h-4 mr-2 text-rose-500" /> Save as PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={exportCSV} className="rounded-xl cursor-pointer font-black uppercase text-[9px] p-3 hover:bg-slate-50">
                <FileSpreadsheet className="w-4 h-4 mr-2 text-emerald-500" /> Save as CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={exportWord} className="rounded-xl cursor-pointer font-black uppercase text-[9px] p-3 hover:bg-slate-50">
                <FileIcon className="w-4 h-4 mr-2 text-blue-500" /> Save as Word
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="outline" onClick={() => window.print()} className="rounded-2xl h-12 px-6 border-slate-200 font-black uppercase text-[10px] tracking-widest hover:bg-slate-50">
            Print
          </Button>
        </div>
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard label="Total Students" value={stats.totalStudents} icon={Users} color="text-blue-600" loading={loading} />
        <StatCard label="Target Campuses" value="3" icon={Building2} color="text-orange-600" loading={loading} />
        <StatCard label="Total Programs" value={stats.totalPrograms} icon={Activity} color="text-cyan-600" loading={loading} />
        <StatCard label="Engagement" value={`${stats.engagement}%`} icon={TrendingUp} color="text-emerald-600" loading={loading} />
      </div>

      {/* CHARTS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-8 rounded-[2.5rem] border-none shadow-sm bg-white">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-8">Campus Activity Comparison</h3>
          {loading ? <ChartLoader /> : (
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={campusData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }} barGap={8}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 10, fontWeight: 900 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 10 }} />
                <Tooltip cursor={{ fill: '#F8FAFC' }} contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }} />
                <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ paddingBottom: '30px', textTransform: 'uppercase', fontSize: '9px', fontWeight: '900' }} />
                <Bar name="Students" dataKey="students" fill="#4F46E5" radius={[6, 6, 0, 0]} barSize={35} />
                <Bar name="Programs" dataKey="programs" fill="#A855F7" radius={[6, 6, 0, 0]} barSize={35} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card className="p-8 rounded-[2.5rem] border-none shadow-sm bg-white">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-8">Monthly Growth Trend</h3>
          {loading ? <ChartLoader /> : (
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 800, fill: '#64748B' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94A3B8' }} />
                <Tooltip contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }} />
                <Line name="Users" type="monotone" dataKey="count" stroke="#10B981" strokeWidth={4} dot={{ r: 6, fill: '#10B981', strokeWidth: 3, stroke: '#fff' }} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>
    </div>
  );
}

// --- HELPER COMPONENTS ---

function StatCard({ label, value, icon: Icon, color, loading }: any) {
  return (
    <Card className="p-6 rounded-[2rem] border-none shadow-sm bg-white hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
          <div className="text-3xl font-black mt-1 text-slate-900 tracking-tighter">
            {loading ? <Loader2 className="w-5 h-5 animate-spin text-indigo-600" /> : value}
          </div>
        </div>
        <div className={`p-4 rounded-2xl bg-slate-50 ${color}`}><Icon className="w-6 h-6" /></div>
      </div>
    </Card>
  );
}

function ChartLoader() {
  return (
    <div className="h-[350px] flex flex-col items-center justify-center space-y-2">
      <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-4">Syncing Campus Data...</p>
    </div>
  );
}