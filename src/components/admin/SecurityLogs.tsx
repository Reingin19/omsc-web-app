import { useState, useEffect } from 'react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { 
  Search, 
  Download, 
  Shield, 
  AlertTriangle, 
  CheckCircle2, 
  Loader2, 
  User, 
  FileUp, 
  FileDown,
  Trash2, 
  Edit3, 
  PlusCircle, 
  Database,
  Key,
  ClipboardCheck
} from 'lucide-react';
import { useToast } from '../../hooks/use-toast';

interface SecurityLog {
  id: number;
  action: string;
  user: string;
  status: 'success' | 'warning' | 'danger' | string;
  details: string;
  ip_address: string;
  created_at: string;
}

export default function SecurityLogs() {
  const { toast } = useToast();
  const [logs, setLogs] = useState<SecurityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchLogs = async () => {
    try {
      const res = await fetch('http://localhost:3001/admin/security-logs');
      if (!res.ok) throw new Error();
      const data = await res.json();
      setLogs(data);
    } catch (err) {
      toast({ variant: "destructive", title: "Sync Error", description: "Could not sync activity logs." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter((log) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = 
      log.action?.toLowerCase().includes(query) || 
      log.user?.toLowerCase().includes(query) ||
      log.details?.toLowerCase().includes(query);
    
    const matchesStatus = statusFilter === 'all' || log.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // MAS DETALYADONG ICON DETECTION PARA SA LAHAT NG ACTIONS
  const getLogConfig = (action: string) => {
    const act = action.toLowerCase();
    if (act.includes('upload')) return { icon: <FileUp className="w-4 h-4 text-blue-500" />, label: 'Upload' };
    if (act.includes('download') || act.includes('export')) return { icon: <FileDown className="w-4 h-4 text-indigo-500" />, label: 'Download' };
    if (act.includes('delete') || act.includes('remove')) return { icon: <Trash2 className="w-4 h-4 text-rose-500" />, label: 'Deletion' };
    if (act.includes('update') || act.includes('edit') || act.includes('modify')) return { icon: <Edit3 className="w-4 h-4 text-amber-500" />, label: 'Update' };
    if (act.includes('create') || act.includes('add') || act.includes('new')) return { icon: <PlusCircle className="w-4 h-4 text-emerald-500" />, label: 'Creation' };
    if (act.includes('quiz') || act.includes('test')) return { icon: <ClipboardCheck className="w-4 h-4 text-purple-500" />, label: 'Quiz Action' };
    if (act.includes('login') || act.includes('password')) return { icon: <Key className="w-4 h-4 text-orange-500" />, label: 'Security' };
    return { icon: <Database className="w-4 h-4 text-slate-500" />, label: 'System' };
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'success': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'warning': return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'danger': return 'bg-rose-50 text-rose-700 border-rose-100';
      default: return 'bg-slate-50 text-slate-700 border-slate-100';
    }
  };

  const exportToCSV = () => {
    const headers = ["Timestamp", "User", "Action", "Status", "Details", "IP Address"];
    const csvContent = [
      headers.join(','),
      ...filteredLogs.map(l => [
        `"${new Date(l.created_at).toLocaleString()}"`,
        `"${l.user}"`,
        `"${l.action}"`,
        `"${l.status}"`,
        `"${l.details.replace(/"/g, '""')}"`,
        `"${l.ip_address}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Audit_Trail_${new Date().getTime()}.csv`;
    link.click();
  };

  return (
    <div className="space-y-8 p-2 animate-in fade-in duration-500">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase mb-2">
            System <span className="text-indigo-600">Audit Trail</span>
          </h1>
          <p className="text-slate-500 font-medium tracking-tight uppercase text-xs">Complete record of uploads, downloads, creations, and modifications</p>
        </div>
        <Button 
          onClick={exportToCSV} 
          className="bg-slate-900 hover:bg-indigo-600 rounded-2xl h-12 px-8 font-black uppercase text-[10px] tracking-widest transition-all shadow-xl shadow-slate-200"
        >
          <Download className="w-4 h-4 mr-2" /> Export Logs
        </Button>
      </div>

      {/* FILTERS */}
      <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-[2rem] shadow-sm border border-slate-100">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input 
            placeholder="Search by user, action (e.g. 'quiz', 'upload')..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 h-12 bg-slate-50 border-none rounded-2xl font-bold"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-48 h-12 bg-slate-50 border-none rounded-2xl font-black uppercase text-[10px]">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent className="rounded-2xl border-none shadow-xl">
            <SelectItem value="all">All Logs</SelectItem>
            <SelectItem value="success">Successful</SelectItem>
            <SelectItem value="warning">Warnings</SelectItem>
            <SelectItem value="danger">Critical Errors</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* LOGS LIST */}
      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
          <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest">Loading Audit Data...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredLogs.length > 0 ? filteredLogs.map((log) => {
            const { icon, label } = getLogConfig(log.action);
            return (
              <Card key={log.id} className="p-6 rounded-[2.5rem] border-none shadow-sm bg-white group hover:shadow-md transition-all">
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                  <div className="flex items-start gap-4 w-full">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border ${getStatusStyle(log.status)}`}>
                      {log.status === 'danger' ? <AlertTriangle className="w-6 h-6 text-rose-500" /> : icon}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200 tracking-tighter">
                          {label}
                        </span>
                        <h3 className="font-black text-slate-800 uppercase tracking-tight text-sm truncate">
                          {log.action}
                        </h3>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                        <div className="flex items-center gap-1.5">
                          <User className="w-3 h-3 text-indigo-600" />
                          <span className="text-[11px] font-black text-indigo-600 uppercase tracking-tight">{log.user}</span>
                        </div>
                        <span className="text-slate-200 hidden md:inline">|</span>
                        <p className="text-[11px] font-medium text-slate-500 truncate max-w-md">{log.details}</p>
                      </div>

                      <div className="mt-3 pt-3 border-t border-slate-50 flex items-center justify-between">
                         <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Terminal: {log.ip_address}</span>
                         <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Logged: {new Date(log.created_at).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className={`hidden lg:block px-4 py-2 rounded-2xl font-black text-[9px] uppercase tracking-widest border ${getStatusStyle(log.status)}`}>
                    {log.status}
                  </div>
                </div>
              </Card>
            );
          }) : (
            <div className="p-20 text-center bg-white rounded-[3rem] border border-dashed border-slate-200">
               <Shield className="w-12 h-12 text-slate-200 mx-auto mb-4" />
               <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest">No matching activity found in audit trail</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}