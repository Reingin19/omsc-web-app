import React, { useState, useEffect } from "react";
import { supabase } from '../../lib/supabase';
import { Card } from '../../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Button } from '../../components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../../components/ui/dropdown-menu";
import { Download, TrendingUp, Users, Calendar, Target, LucideIcon, Loader2, FileText, Table as TableIcon, FileJson } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

// For Exporting
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { saveAs } from "file-saver";
import { Document, Packer, Paragraph, TextRun } from "docx";

interface StatCardProps {
  title: string;
  value: string | number;
  trend: string;
  icon: LucideIcon;
  color: string;
  bg: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, trend, icon: Icon, color, bg }) => {
  return (
    <Card className="p-6 rounded-[2rem] border-none shadow-lg shadow-slate-100 bg-white hover:scale-105 transition-transform duration-500">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{title}</p>
          <p className="text-3xl font-black text-slate-900">{value}</p>
          <p className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full inline-block">
            {trend} change
          </p>
        </div>
        <div className={`w-12 h-12 rounded-2xl ${bg} ${color} flex items-center justify-center`}>
          <Icon className="w-6 h-6" strokeWidth={2.5} />
        </div>
      </div>
    </Card>
  );
};

export default function AnalyticsDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalParticipants: 0,
    programsCount: 0,
    completionRate: 0,
    satisfaction: 4.8
  });
  
  const [participationData, setParticipationData] = useState<any[]>([]);
  const [programData, setProgramData] = useState<any[]>([]);
  const [selectedCampus, setSelectedCampus] = useState("all");
  const [selectedYear, setSelectedYear] = useState("2026");

  useEffect(() => {
    fetchAnalytics();
  }, [selectedCampus, selectedYear]);

  async function fetchAnalytics() {
    try {
      setLoading(true);
      const { count: regCount } = await supabase.from('program_registrations').select('*', { count: 'exact', head: true });
      const { count: progCount } = await supabase.from('programs').select('*', { count: 'exact', head: true });

      setParticipationData([
        { month: 'Jan', students: Math.floor(regCount! * 0.1) },
        { month: 'Feb', students: Math.floor(regCount! * 0.3) },
        { month: 'Mar', students: Math.floor(regCount! * 0.6) },
        { month: 'Apr', students: regCount },
      ]);

      setProgramData([
        { category: 'Career', count: 12 },
        { category: 'Wellness', count: 18 },
        { category: 'Academic', count: progCount || 0 },
        { category: 'Personal', count: 5 },
      ]);

      setStats(prev => ({
        ...prev,
        totalParticipants: regCount || 0,
        programsCount: progCount || 0,
        completionRate: 92
      }));
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  }

  // --- EXPORT FUNCTIONS ---

  const exportToCSV = () => {
    const headers = ["Category, Value\n"];
    const rows = [
      `Total Participants, ${stats.totalParticipants}\n`,
      `Programs Conducted, ${stats.programsCount}\n`,
      `Completion Rate, ${stats.completionRate}%\n`,
      `Avg Satisfaction, ${stats.satisfaction}\n`
    ];
    const blob = new Blob([...headers, ...rows], { type: "text/csv;charset=utf-8" });
    saveAs(blob, `OMSC_Analytics_${selectedYear}.csv`);
  };

  const exportToPDF = () => {
    const doc = new jsPDF() as any;
    doc.setFont("helvetica", "bold");
    doc.text("OMSC GUIDANCE ANALYTICS REPORT", 14, 20);
    doc.setFontSize(10);
    doc.text(`Academic Year: ${selectedYear} | Campus: ${selectedCampus.toUpperCase()}`, 14, 30);
    
    doc.autoTable({
      startY: 40,
      head: [['Metric', 'Value']],
      body: [
        ['Total Participants', stats.totalParticipants],
        ['Programs Conducted', stats.programsCount],
        ['Completion Rate', `${stats.completionRate}%`],
        ['Average Satisfaction', stats.satisfaction],
      ],
      theme: 'grid',
      headStyles: { fillStyle: [79, 70, 229] }
    });
    
    doc.save(`OMSC_Report_${selectedYear}.pdf`);
  };

  const exportToWord = async () => {
    const doc = new Document({
      sections: [{
        children: [
          new Paragraph({ children: [new TextRun({ text: "OMSC Guidance Analytics Report", bold: true, size: 32 })] }),
          new Paragraph({ text: `Academic Year: ${selectedYear}` }),
          new Paragraph({ text: `Total Participants: ${stats.totalParticipants}` }),
          new Paragraph({ text: `Programs Conducted: ${stats.programsCount}` }),
          new Paragraph({ text: `Completion Rate: ${stats.completionRate}%` }),
        ],
      }],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `OMSC_Report_${selectedYear}.docx`);
  };

  if (loading) return (
    <div className="h-screen flex items-center justify-center">
      <Loader2 className="animate-spin text-indigo-600 w-10 h-10" />
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10 px-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black uppercase text-slate-900 tracking-tighter">
            Analytics <span className="text-indigo-600">Dashboard</span>
          </h1>
          <p className="text-slate-500 font-medium">Monitor OMSC guidance impact and student engagement</p>
        </div>

        {/* DROPDOWN EXPORT BUTTON */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl font-bold h-12 shadow-lg shadow-indigo-100">
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="rounded-xl p-2 w-48">
            <DropdownMenuItem onClick={exportToPDF} className="cursor-pointer font-bold gap-2">
              <FileText className="w-4 h-4 text-red-500" /> Export as PDF
            </DropdownMenuItem>
            <DropdownMenuItem onClick={exportToWord} className="cursor-pointer font-bold gap-2">
              <FileJson className="w-4 h-4 text-blue-500" /> Export as Word
            </DropdownMenuItem>
            <DropdownMenuItem onClick={exportToCSV} className="cursor-pointer font-bold gap-2">
              <TableIcon className="w-4 h-4 text-emerald-500" /> Export as CSV
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* REST OF YOUR UI (Filters, Stats, Charts) */}
      <div className="flex flex-wrap gap-4 bg-white p-4 rounded-[2rem] shadow-sm border border-slate-100">
        <Select value={selectedCampus} onValueChange={setSelectedCampus}>
          <SelectTrigger className="w-full md:w-56 bg-slate-50 border-none rounded-xl font-bold h-12">
            <SelectValue placeholder="Select Campus" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Campuses</SelectItem>
            <SelectItem value="labangan">Labangan Campus</SelectItem>
            <SelectItem value="sanjose">San Jose Campus</SelectItem>
          </SelectContent>
        </Select>

        <Select value={selectedYear} onValueChange={setSelectedYear}>
          <SelectTrigger className="w-full md:w-56 bg-slate-50 border-none rounded-xl font-bold h-12">
            <SelectValue placeholder="Academic Year" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="2025">AY 2025-2026</SelectItem>
            <SelectItem value="2026">AY 2026-2027</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Participants" value={stats.totalParticipants} trend="+12%" icon={Users} color="text-blue-600" bg="bg-blue-50" />
        <StatCard title="Programs Conducted" value={stats.programsCount} trend="+4%" icon={Calendar} color="text-indigo-600" bg="bg-indigo-50" />
        <StatCard title="Completion Rate" value={`${stats.completionRate}%`} trend="+2%" icon={Target} color="text-emerald-600" bg="bg-emerald-50" />
        <StatCard title="Avg. Satisfaction" value={stats.satisfaction} trend="High" icon={TrendingUp} color="text-amber-600" bg="bg-amber-50" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="p-8 rounded-[2.5rem] border-none shadow-xl shadow-slate-200/50 bg-white">
          <h3 className="text-xl font-black uppercase tracking-tighter text-slate-900 mb-8 flex items-center">
            <div className="w-2 h-6 bg-indigo-600 mr-3 rounded-full" />
            Participation Trend
          </h3>
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={participationData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontWeight: 'bold', fontSize: 12}} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontWeight: 'bold', fontSize: 12}} />
              <Tooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
              <Line type="monotone" dataKey="students" stroke="#4f46e5" strokeWidth={4} dot={{ r: 6, fill: '#4f46e5', strokeWidth: 3, stroke: '#fff' }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-8 rounded-[2.5rem] border-none shadow-xl shadow-slate-200/50 bg-white">
          <h3 className="text-xl font-black uppercase tracking-tighter text-slate-900 mb-8 flex items-center">
            <div className="w-2 h-6 bg-purple-600 mr-3 rounded-full" />
            Programs by Category
          </h3>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={programData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="category" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontWeight: 'bold', fontSize: 12}} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontWeight: 'bold', fontSize: 12}} />
              <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
              <Bar dataKey="count" fill="#8b5cf6" radius={[10, 10, 0, 0]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}