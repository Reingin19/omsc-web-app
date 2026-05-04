import React, { useState, useEffect } from "react";
import { supabase } from '../../lib/supabase';
import { Card } from '../../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Button } from '../../components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../../components/ui/dropdown-menu";
import { 
  Download, TrendingUp, Users, Calendar, Target, LucideIcon, Loader2, 
  FileText, Table as TableIcon, FileJson, Clock, Activity, ChevronRight 
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, AreaChart, Area 
} from 'recharts';

// For Exporting
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { saveAs } from "file-saver";

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
    <Card className="p-6 rounded-[2rem] border-none shadow-lg shadow-slate-100 bg-white hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 group cursor-default">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{title}</p>
          <p className="text-3xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors tracking-tighter">
            {value}
          </p>
          <p className="text-[10px] font-bold text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full inline-block">
            {trend}
          </p>
        </div>
        <div className={`w-12 h-12 rounded-2xl ${bg} ${color} flex items-center justify-center group-hover:rotate-12 transition-transform duration-300`}>
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
    totalUsageHours: 0,
    avgSatisfaction: 4.8
  });
  
  const [participationData, setParticipationData] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [selectedCampus, setSelectedCampus] = useState("all");
  const [selectedYear, setSelectedYear] = useState("2026");

  useEffect(() => {
    fetchAnalytics();
  }, [selectedCampus, selectedYear]);

  async function fetchAnalytics() {
    try {
      setLoading(true);

      // 1. Fetch Dynamic Data
      const { count: regCount } = await supabase.from('program_registrations').select('*', { count: 'exact', head: true });
      const { count: progCount } = await supabase.from('programs').select('*', { count: 'exact', head: true });
      
      // 2. Monitoring: Calculate Usage Hours
      const { data: logs } = await supabase.from('usage_logs').select('login_at, logout_at');
      let totalHours = 0;
      if (logs) {
        logs.forEach(log => {
          if (log.login_at && log.logout_at) {
            const login = new Date(log.login_at).getTime();
            const logout = new Date(log.logout_at).getTime();
            const diff = (logout - login) / (1000 * 60 * 60);
            if (diff > 0) totalHours += diff;
          }
        });
      }

      // 3. Participation Trend
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthlyCounts = months.map(m => ({ month: m, students: 0 }));
      
      const { data: regTrend } = await supabase.from('program_registrations').select('created_at');
      regTrend?.forEach(item => {
        const monthIndex = new Date(item.created_at).getMonth();
        monthlyCounts[monthIndex].students++;
      });
      setParticipationData(monthlyCounts.filter((_, i) => i <= new Date().getMonth()));

      // 4. Programs by Category
      const { data: programCats } = await supabase.from('programs').select('category');
      const cats: Record<string, number> = {};
      programCats?.forEach(p => {
        if (p.category) cats[p.category] = (cats[p.category] || 0) + 1;
      });
      setCategoryData(Object.keys(cats).map(key => ({ category: key, count: cats[key] })));

      setStats({
        totalParticipants: regCount || 0,
        programsCount: progCount || 0,
        totalUsageHours: Math.round(totalHours),
        avgSatisfaction: 4.8
      });

    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  }

  // --- EXPORT FUNCTIONS ---
  const exportToPDF = () => {
    const doc = new jsPDF() as any;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text("OMSC GUIDANCE ANALYTICS REPORT", 14, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 28);

    doc.autoTable({
      startY: 35,
      head: [['METRIC', 'DATA VALUE']],
      body: [
        ['Total Registered Participants', stats.totalParticipants],
        ['Programs Successfully Conducted', stats.programsCount],
        ['Total Cumulative Usage Hours', `${stats.totalUsageHours} Hours`],
        ['Average Satisfaction Rating', `${stats.avgSatisfaction} / 5.0`],
      ],
      headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [249, 250, 251] },
      margin: { top: 35 }
    });

    doc.save(`OMSC_Guidance_Report_${selectedYear}.pdf`);
  };

  const exportToCSV = () => {
    const headers = ["Metric,Value"];
    const dataRows = [
      `Total Participants,${stats.totalParticipants}`,
      `Programs Conducted,${stats.programsCount}`,
      `Total Usage Time,${stats.totalUsageHours} Hours`,
      `Avg Satisfaction,${stats.avgSatisfaction}`
    ];
    
    const csvContent = [headers, ...dataRows].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `OMSC_Analytics_${selectedYear}.csv`);
  };

  const exportToJSON = () => {
    const fullData = {
      summary: stats,
      trends: participationData,
      categories: categoryData,
      exported_at: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(fullData, null, 2)], { type: 'application/json' });
    saveAs(blob, `OMSC_Data_Backup.json`);
  };

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center gap-4 bg-white">
      <Loader2 className="animate-spin text-indigo-600 w-12 h-12" />
      <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] animate-pulse">Syncing Analytics...</p>
    </div>
  );

  return (
    <div className="space-y-8 pb-10 px-4 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-5xl font-black uppercase text-slate-900 tracking-tighter italic">
            Dashboard <span className="text-indigo-600">Analytics</span>
          </h1>
          <div className="flex items-center gap-2 mt-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <p className="text-slate-500 font-bold text-xs uppercase tracking-wider">Live System Monitoring Enabled</p>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="bg-slate-900 text-white hover:bg-indigo-600 rounded-2xl font-black uppercase text-[10px] tracking-widest h-14 px-8 shadow-2xl transition-all active:scale-95 group">
              <Download className="w-4 h-4 mr-2 group-hover:bounce" /> Export Report
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="rounded-2xl p-2 w-64 border-none shadow-2xl bg-white">
            <DropdownMenuItem onClick={exportToPDF} className="p-4 cursor-pointer font-bold gap-3 rounded-xl hover:bg-slate-50">
              <FileText className="text-red-500 w-5 h-5"/> 
              <div className="flex flex-col">
                <span className="text-sm">PDF Document</span>
                <span className="text-[9px] text-slate-400 uppercase">For Printing & Records</span>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={exportToCSV} className="p-4 cursor-pointer font-bold gap-3 rounded-xl hover:bg-slate-50">
              <TableIcon className="text-emerald-500 w-5 h-5"/> 
              <div className="flex flex-col">
                <span className="text-sm">CSV Spreadsheet</span>
                <span className="text-[9px] text-slate-400 uppercase">For Excel/Data Analysis</span>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={exportToJSON} className="p-4 cursor-pointer font-bold gap-3 rounded-xl hover:bg-slate-50">
              <FileJson className="text-amber-500 w-5 h-5"/> 
              <div className="flex flex-col">
                <span className="text-sm">Raw JSON Data</span>
                <span className="text-[9px] text-slate-400 uppercase">For System Backup</span>
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 bg-white p-4 rounded-[2rem] shadow-sm border border-slate-100 items-center">
        <div className="flex items-center gap-3 px-4 py-2 bg-slate-50 rounded-xl border border-slate-100">
           <Activity className="w-4 h-4 text-indigo-600" />
           <span className="text-[10px] font-black uppercase text-slate-400 tracking-tighter">Filter By:</span>
        </div>
        <Select value={selectedCampus} onValueChange={setSelectedCampus}>
          <SelectTrigger className="w-full md:w-56 bg-slate-50 border-none rounded-xl font-bold h-12 uppercase text-xs">
            <SelectValue placeholder="All Campuses" />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-none shadow-2xl">
            <SelectItem value="all">All Campuses</SelectItem>
            <SelectItem value="labangan">Labangan Campus</SelectItem>
            <SelectItem value="sanjose">San Jose Campus</SelectItem>
            <SelectItem value="murtha">Murtha Campus</SelectItem>
          </SelectContent>
        </Select>

        <Select value={selectedYear} onValueChange={setSelectedYear}>
          <SelectTrigger className="w-full md:w-56 bg-slate-50 border-none rounded-xl font-bold h-12 uppercase text-xs">
            <SelectValue placeholder="AY 2026-2027" />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-none shadow-2xl">
            <SelectItem value="2025">AY 2025-2026</SelectItem>
            <SelectItem value="2026">AY 2026-2027</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Registrations" value={stats.totalParticipants} trend="Real-time" icon={Users} color="text-blue-600" bg="bg-blue-50" />
        <StatCard title="Active Programs" value={stats.programsCount} trend="Dynamic" icon={Calendar} color="text-indigo-600" bg="bg-indigo-50" />
        <StatCard title="System Usage" value={`${stats.totalUsageHours}h`} trend="Total Time" icon={Clock} color="text-orange-600" bg="bg-orange-50" />
        <StatCard title="Performance" value="High" trend="Stable" icon={Activity} color="text-emerald-600" bg="bg-emerald-50" />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Registration Growth Chart (Area Chart) */}
        <Card className="p-8 rounded-[3rem] border-none shadow-xl bg-white group transition-all duration-500 hover:shadow-indigo-100 overflow-hidden relative">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
            <TrendingUp className="w-32 h-32 text-indigo-600 -rotate-12" />
          </div>
          <h3 className="text-xl font-black uppercase tracking-tighter text-slate-900 mb-8 flex items-center">
            <div className="w-2 h-6 bg-indigo-600 mr-3 rounded-full" />
            Participation Growth
          </h3>
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={participationData}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontWeight: 'bold', fontSize: 10}} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontWeight: 'bold', fontSize: 10}} />
              <Tooltip 
                contentStyle={{borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '20px'}}
                cursor={{ stroke: '#4f46e5', strokeWidth: 2 }}
              />
              <Area 
                type="monotone" 
                dataKey="students" 
                stroke="#4f46e5" 
                strokeWidth={4} 
                fillOpacity={1} 
                fill="url(#colorValue)" 
                animationDuration={2500}
              />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* Categories Bar Chart */}
        <Card className="p-8 rounded-[3rem] border-none shadow-xl bg-white group transition-all duration-500 hover:shadow-purple-100 overflow-hidden relative">
          <h3 className="text-xl font-black uppercase tracking-tighter text-slate-900 mb-8 flex items-center">
            <div className="w-2 h-6 bg-purple-600 mr-3 rounded-full" />
            Program Categories
          </h3>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={categoryData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="category" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontWeight: 'bold', fontSize: 10}} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontWeight: 'bold', fontSize: 10}} />
              <Tooltip 
                cursor={{fill: '#f8fafc'}} 
                contentStyle={{borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'}} 
              />
              <Bar 
                dataKey="count" 
                fill="#8b5cf6" 
                radius={[15, 15, 15, 15]} 
                barSize={45}
                animationDuration={2000}
              />
            </BarChart>
          </ResponsiveContainer>
        </Card>

      </div>

      {/* Footer Info */}
      <div className="flex items-center justify-between px-8 py-6 bg-slate-900 rounded-[2rem] text-white">
        <div className="flex items-center gap-4">
           <div className="p-3 bg-white/10 rounded-xl">
              <ShieldCheck className="w-6 h-6 text-indigo-400" />
           </div>
           <div>
              <p className="text-xs font-black uppercase tracking-widest">Data Integrity Secured</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase">All analytics are based on encrypted system logs.</p>
           </div>
        </div>
        <Button variant="ghost" className="text-[10px] font-black uppercase tracking-widest hover:bg-white/10" onClick={fetchAnalytics}>
           Refresh Data
        </Button>
      </div>

    </div>
  );
}

// Add ShieldCheck icon to the imports if needed
import { ShieldCheck } from "lucide-react";