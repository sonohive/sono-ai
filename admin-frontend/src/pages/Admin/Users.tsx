import React, { useState, useEffect } from 'react';
import { Users as UsersIcon, Search, MoreVertical, Trash2, Ban, CheckCircle, Shield, Download, Activity, FileText } from 'lucide-react';
import api from '../../api';
import { useAuth } from '../../contexts/AuthContext';

interface User {
  id: string;
  full_name: string | null;
  email: string;
  role: string;
  is_active: boolean;
  total_queries: number;
  created_at: string;
}

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  const { admin, token } = useAuth();
  const isSuperAdmin = admin?.role === 'superadmin';

  const fetchUsersAndStats = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        size: '10',
      });
      if (search) params.append('search', search);
      if (statusFilter !== 'all') params.append('status', statusFilter);

      const [usersRes, statsRes] = await Promise.all([
        api.get(`/admin/users?${params.toString()}`),
        api.get('/admin/overview/stats')
      ]);
      
      setUsers(usersRes.data.items);
      setTotal(usersRes.data.total);
      setTotalPages(usersRes.data.pages);
      setStats(statsRes.data);
    } catch (error) {
      console.error("Failed to fetch data", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsersAndStats();
  }, [page, search, statusFilter]);

  const toggleStatus = async (userId: string, currentStatus: boolean) => {
    try {
      await api.patch(`/admin/users/${userId}/status`, { is_active: !currentStatus });
      fetchUsersAndStats();
    } catch (error) {
      console.error("Failed to update status", error);
    }
  };

  const deleteUser = async (userId: string) => {
    if (!window.confirm("Are you sure you want to permanently delete this user? This action cannot be undone.")) {
      return;
    }
    try {
      await api.delete(`/admin/users/${userId}`);
      fetchUsersAndStats();
    } catch (error) {
      console.error("Failed to delete user", error);
      alert("Failed to delete user. Make sure you have Superadmin permissions.");
    }
  };

  const exportCSV = async () => {
    setIsExporting(true);
    try {
      const response = await fetch('http://localhost:8000/api/admin/users/export', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'users_export.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to export CSV", error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Users</h1>
          <p className="text-slate-400">Manage registered users, their roles, and access.</p>
        </div>
        <button 
          onClick={exportCSV}
          disabled={isExporting}
          className="flex items-center gap-2 px-4 py-2 bg-[#18181b] border border-white/10 hover:border-white/20 rounded-lg text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-all disabled:opacity-50"
        >
          {isExporting ? <div className="w-4 h-4 border-2 border-slate-300 border-t-transparent rounded-full animate-spin"></div> : <Download className="w-4 h-4" />}
          {isExporting ? 'Exporting...' : 'Export to CSV'}
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#121214] border border-white/5 rounded-xl p-5 hover:bg-[#18181b] transition-colors flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
                <UsersIcon className="w-5 h-5 text-blue-400" />
              </div>
            </div>
            <div className="text-sm text-slate-500 mb-1">Total Users</div>
            <div className="text-2xl font-bold text-white mb-6">{stats ? stats.total_users.toLocaleString() : '-'}</div>
          </div>
          <div className="flex items-center justify-between text-xs pt-4 border-t border-white/5">
             <div className="flex items-center gap-1.5 text-slate-400"><div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div> All Registered Accounts</div>
          </div>
        </div>
        
        <div className="bg-[#121214] border border-white/5 rounded-xl p-5 hover:bg-[#18181b] transition-colors flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
            <div className="text-sm text-slate-500 mb-1">Active Users (28d)</div>
            <div className="text-2xl font-bold text-white mb-6">{stats ? stats.active_users_28d.toLocaleString() : '-'}</div>
          </div>
          <div className="flex items-center justify-between text-xs pt-4 border-t border-white/5">
             <div className="flex items-center gap-1.5 text-slate-400"><div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div> Used platform recently</div>
          </div>
        </div>

        <div className="bg-[#121214] border border-white/5 rounded-xl p-5 hover:bg-[#18181b] transition-colors flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
                <Ban className="w-5 h-5 text-rose-400" />
              </div>
            </div>
            <div className="text-sm text-slate-500 mb-1">Suspended Users</div>
            <div className="text-2xl font-bold text-white mb-6">{stats ? stats.suspended_users.toLocaleString() : '-'}</div>
          </div>
          <div className="flex items-center justify-between text-xs pt-4 border-t border-white/5">
             <div className="flex items-center gap-1.5 text-slate-400"><div className="w-1.5 h-1.5 rounded-full bg-rose-400"></div> Access Revoked</div>
          </div>
        </div>

        <div className="bg-[#121214] border border-white/5 rounded-xl p-5 hover:bg-[#18181b] transition-colors flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
                <FileText className="w-5 h-5 text-slate-500" />
              </div>
            </div>
            <div className="text-sm text-slate-500 mb-1">Active Subscription</div>
            <div className="text-2xl font-bold text-slate-400 mb-6">Null</div>
          </div>
          <div className="flex items-center justify-between text-xs pt-4 border-t border-white/5">
             <div className="flex items-center gap-1.5 text-slate-500"><div className="w-1.5 h-1.5 rounded-full bg-slate-500"></div> Feature not yet available</div>
          </div>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between bg-[#121214] p-4 rounded-xl border border-white/5">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-11 pr-4 py-2.5 bg-[#09090b] border border-white/10 hover:border-white/20 rounded-lg text-sm text-white focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all placeholder:text-slate-500 font-sans"
          />
        </div>
        
        <div className="relative">
          <button 
            type="button"
            onClick={() => {
              const el = document.getElementById('status-dropdown-menu');
              if (el) el.classList.toggle('hidden');
            }}
            onBlur={(e) => {
              // Timeout to allow click on option to fire first
              setTimeout(() => {
                const el = document.getElementById('status-dropdown-menu');
                if (el) el.classList.add('hidden');
              }, 150);
            }}
            className="flex items-center justify-between w-40 bg-[#09090b] border border-white/10 hover:border-white/20 text-slate-300 text-sm rounded-lg focus:ring-1 focus:ring-primary/50 focus:border-primary/50 focus:outline-none px-4 py-2.5 transition-all cursor-pointer font-sans"
          >
            {statusFilter === 'all' ? 'All Statuses' : statusFilter === 'active' ? 'Active Only' : 'Suspended Only'}
            <svg className="w-4 h-4 text-slate-400 ml-2" fill="none" viewBox="0 0 20 20" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M6 8l4 4 4-4" />
            </svg>
          </button>

          <div id="status-dropdown-menu" className="absolute z-10 w-full mt-1 bg-[#09090b] border border-white/10 rounded-lg shadow-lg hidden overflow-hidden font-sans">
            <div 
              className={`px-4 py-2.5 text-sm cursor-pointer hover:bg-white/5 transition-colors ${statusFilter === 'all' ? 'text-white bg-white/5 font-medium' : 'text-slate-400'}`}
              onClick={() => { setStatusFilter('all'); setPage(1); }}
            >
              All Statuses
            </div>
            <div 
              className={`px-4 py-2.5 text-sm cursor-pointer hover:bg-white/5 transition-colors ${statusFilter === 'active' ? 'text-white bg-white/5 font-medium' : 'text-slate-400'}`}
              onClick={() => { setStatusFilter('active'); setPage(1); }}
            >
              Active Only
            </div>
            <div 
              className={`px-4 py-2.5 text-sm cursor-pointer hover:bg-white/5 transition-colors ${statusFilter === 'suspended' ? 'text-white bg-white/5 font-medium' : 'text-slate-400'}`}
              onClick={() => { setStatusFilter('suspended'); setPage(1); }}
            >
              Suspended Only
            </div>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-[#18181b] rounded-xl border border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs text-slate-400 uppercase bg-black/20 border-b border-white/5">
              <tr>
                <th className="px-6 py-4 font-medium">User</th>
                <th className="px-6 py-4 font-medium">Role</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Queries</th>
                <th className="px-6 py-4 font-medium">Joined</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    <div className="flex justify-center items-center gap-3">
                       <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                       Loading users...
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    No users found matching your filters.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                          {(user.full_name || user.email)[0].toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-white">{user.full_name || 'No Name'}</div>
                          <div className="text-xs text-slate-400">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-white/5 text-slate-300 border border-white/10">
                        {user.role === 'admin' && <Shield className="w-3 h-3 text-purple-400" />}
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {user.is_active ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <CheckCircle className="w-3 h-3" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
                          <Ban className="w-3 h-3" /> Suspended
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-300 font-mono">
                      {user.total_queries.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-slate-400">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => toggleStatus(user.id, user.is_active)}
                          className={`p-2 rounded-lg transition-colors ${user.is_active ? 'text-amber-400 hover:bg-amber-400/10' : 'text-emerald-400 hover:bg-emerald-400/10'}`}
                          title={user.is_active ? "Suspend User" : "Activate User"}
                        >
                          {user.is_active ? <Ban className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                        </button>
                        
                        {isSuperAdmin && (
                          <button 
                            onClick={() => deleteUser(user.id)}
                            className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                            title="Delete User"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="px-6 py-4 border-t border-white/5 flex items-center justify-between bg-black/20">
          <div className="text-sm text-slate-400">
            Showing <span className="text-white font-medium">{(page - 1) * 10 + 1}</span> to <span className="text-white font-medium">{Math.min(page * 10, total)}</span> of <span className="text-white font-medium">{total}</span> users
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1 || isLoading}
              className="px-3 py-1.5 text-sm bg-[#18181b] border border-white/10 rounded-md text-white hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || isLoading || total === 0}
              className="px-3 py-1.5 text-sm bg-[#18181b] border border-white/10 rounded-md text-white hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
