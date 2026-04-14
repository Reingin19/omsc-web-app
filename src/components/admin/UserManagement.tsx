import { useState, useEffect } from 'react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Search, Trash2, Loader2, Save, X, Shield, Users } from 'lucide-react';
import { useToast } from '../../hooks/use-toast';

export default function UserManagement() {
  const { toast } = useToast();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editStatus, setEditStatus] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3001/admin/users');
      if (!res.ok) throw new Error();
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleUpdateStatus = async (id: number) => {
    try {
      const res = await fetch(`http://localhost:3001/admin/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: editStatus }) 
      });
      if (!res.ok) throw new Error();
      
      toast({ 
        title: "STATUS UPDATED", 
        description: `User account is now ${editStatus}.`,
        className: "bg-indigo-600 text-white font-black rounded-2xl"
      });
      setEditingId(null);
      fetchUsers();
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "Failed to update status." });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    try {
      const res = await fetch(`http://localhost:3001/admin/users/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast({ title: "DELETED", description: "User removed successfully." });
        fetchUsers();
      }
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "Delete failed." });
    }
  };

  const filteredUsers = users.filter((user) => {
    const name = user.name?.toLowerCase() || '';
    const email = user.email?.toLowerCase() || '';
    const sid = user.student_id?.toLowerCase() || '';
    const query = searchQuery.toLowerCase();
    
    const matchesSearch = name.includes(query) || email.includes(query) || sid.includes(query);
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
        <p className="text-slate-500 font-black uppercase text-[10px] tracking-widest">Loading Users...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-2 animate-in fade-in duration-500">
      <div>
        <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase mb-2">
          User <span className="text-indigo-600">Management</span>
        </h1>
        <p className="text-slate-500 font-medium tracking-tight uppercase text-xs">Manage system access (Roles are fixed)</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-[2rem] shadow-sm border border-slate-100">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input 
            placeholder="Search name or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 h-12 bg-slate-50 border-none rounded-2xl font-bold"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-full md:w-48 h-12 bg-slate-50 border-none rounded-2xl font-black uppercase text-[10px]">
            <SelectValue placeholder="All Roles" />
          </SelectTrigger>
          <SelectContent className="rounded-2xl border-none shadow-xl">
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="admin">Admins</SelectItem>
            <SelectItem value="counselor">Counselors</SelectItem>
            <SelectItem value="student">Students</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredUsers.map((user) => (
          <Card key={user.id} className="p-6 rounded-[2.5rem] border-none shadow-sm bg-white group">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4 w-full md:w-auto">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center 
                  ${user.role === 'admin' ? 'bg-rose-50 text-rose-600' : 'bg-indigo-50 text-indigo-600'}`}>
                  {user.role === 'admin' ? <Shield className="w-6 h-6" /> : <Users className="w-6 h-6" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-slate-800 uppercase tracking-tight leading-none">{user.name}</h3>
                    <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase 
                      ${user.status === 'active' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                      {user.status || 'active'}
                    </span>
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase mt-1 tracking-widest">{user.email}</p>
                  <p className="text-[9px] font-black text-indigo-600 uppercase mt-1 tracking-tighter bg-indigo-50 inline-block px-2 rounded-md">{user.role}</p>
                </div>
              </div>

              <div className="flex gap-2 w-full md:w-auto justify-end">
                {editingId === user.id ? (
                  <div className="flex gap-2 items-center">
                    <Select defaultValue={user.status || 'active'} onValueChange={setEditStatus}>
                      <SelectTrigger className="w-32 h-10 border-none bg-slate-50 rounded-xl font-black uppercase text-[10px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button size="sm" className="h-10 w-10 bg-indigo-600 rounded-xl" onClick={() => handleUpdateStatus(user.id)}><Save className="w-4 h-4" /></Button>
                    <Button size="sm" variant="ghost" className="h-10 w-10 rounded-xl" onClick={() => setEditingId(null)}><X className="w-4 h-4" /></Button>
                  </div>
                ) : (
                  <>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => { setEditingId(user.id); setEditStatus(user.status || 'active'); }}
                      className="rounded-2xl font-black uppercase text-[10px] tracking-widest h-10 border-slate-100 hover:bg-slate-50 transition-all"
                    >
                      Status
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      onClick={() => handleDelete(user.id)}
                      className="rounded-2xl font-black uppercase text-[10px] tracking-widest h-10 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white border-none transition-all shadow-none"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}