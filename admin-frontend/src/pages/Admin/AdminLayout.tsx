import React from 'react';
import { Outlet, NavLink, Link } from 'react-router-dom';
import { LayoutDashboard, Database, Settings, ShieldCheck, CheckSquare } from 'lucide-react';

export default function AdminLayout() {
  const navItems = [
    { to: '/', label: 'Overview', icon: LayoutDashboard, exact: true },
    { to: '/kb', label: 'Knowledge Base', icon: Database },
    { to: '/settings', label: 'Settings', icon: Settings },
    { to: '/access', label: 'Access Control', icon: ShieldCheck },
    { to: '/rlhf', label: 'RLHF QA', icon: CheckSquare },
  ];

  return (
    <div className="flex h-screen bg-slate-50 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-[#0e0e10] text-slate-300 flex flex-col shrink-0">
        <div className="h-16 flex items-center px-6 bg-[#141416] border-b border-white/10">
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <span className="text-lg font-bold text-white tracking-tight">Sono Admin</span>
          </Link>
        </div>
        
        <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
          <div className="px-3 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            System Config
          </div>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive 
                    ? 'bg-brand-600/10 text-brand-500' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`
              }
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        
        <div className="p-4 border-t border-white/10 bg-[#141416]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
              <span className="text-sm font-bold text-white">AD</span>
            </div>
            <div>
              <div className="text-sm font-medium text-white">Admin User</div>
              <div className="text-xs text-slate-500">System Admin</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 flex items-center justify-between px-8 bg-white border-b border-slate-200 shrink-0">
          <div className="flex items-center text-sm text-slate-500">
            <span className="font-medium text-slate-800">Admin</span>
            <span className="mx-2">/</span>
            <span>Dashboard</span>
          </div>
          <div className="flex items-center gap-4">
             <a href="http://localhost:5173/chat" className="text-sm font-medium text-brand-600 hover:text-brand-700">Exit Admin Mode</a>
          </div>
        </header>
        
        <div className="flex-1 overflow-y-auto bg-slate-50 p-8">
          <div className="max-w-6xl mx-auto">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
