import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Sword, FlaskConical, LogOut, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export function SFTSidebar() {
  const { logout, admin } = useAuth();

  const links = [
    { to: '/sft/dashboard', icon: LayoutDashboard, label: 'Queue' },
    { to: '/sft/arena', icon: Sword, label: 'The Arena' },
    { to: '/sft/playground', icon: FlaskConical, label: 'Playground' },
  ];

  return (
    <div className="w-64 bg-[#09090b] border-r border-white/10 flex flex-col h-screen fixed left-0 top-0">
      <div className="p-6">
        <h1 className="text-xl font-bold text-white tracking-tight">Sono AI</h1>
        <p className="text-xs font-medium text-purple-400 mt-1 tracking-widest uppercase">SFT Portal</p>
      </div>

      <nav className="flex-1 px-4 space-y-2 mt-4">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-purple-500/10 text-purple-400 shadow-sm border border-purple-500/20'
                  : 'text-slate-400 hover:bg-white/5 hover:text-white border border-transparent'
              }`
            }
          >
            <link.icon className="w-5 h-5" />
            {link.label}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-white/10 space-y-2">
        {admin?.role !== 'sft_reviewer' && (
          <NavLink
            to="/"
            className="flex items-center gap-3 px-4 py-3 w-full text-slate-400 hover:text-emerald-400 hover:bg-emerald-400/10 rounded-lg text-sm font-medium transition-all"
          >
            <ShieldCheck className="w-5 h-5" />
            Admin Dashboard
          </NavLink>
        )}
        <button
          onClick={logout}
          className="flex items-center gap-3 px-4 py-3 w-full text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg text-sm font-medium transition-all"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>
    </div>
  );
}
