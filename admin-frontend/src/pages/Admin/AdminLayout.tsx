import React, { useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { LayoutDashboard, Database, Settings, ShieldCheck, CheckSquare, Search, ChevronLeft, ChevronRight } from 'lucide-react';

export default function AdminLayout() {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    { to: '/users', label: 'Users', icon: ShieldCheck },
    { to: '/rlhf', label: 'RLHF QA', icon: CheckSquare },
    { to: '/kb', label: 'Knowledge Base', icon: Database },
    { to: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-[#09090b] font-sans text-slate-200">
      {/* Sidebar */}
      <aside className={`${isCollapsed ? 'w-[80px]' : 'w-[260px]'} transition-all duration-300 bg-[#09090b] flex flex-col shrink-0 border-r border-white/5 relative`}>
        
        {/* Collapse Toggle Button */}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-6 w-6 h-6 bg-[#18181b] border border-white/10 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-primary/20 z-10 transition-colors"
        >
          {isCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>

        <div className="h-16 flex items-center px-6 mt-2">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-purple-800 flex items-center justify-center shadow-lg shadow-primary/20 shrink-0">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            {!isCollapsed && <span className="text-xl font-bold text-white tracking-tight animate-fade-in whitespace-nowrap">Sono Admin</span>}
          </div>
        </div>

        {/* Search */}
        <div className={`px-6 py-4 ${isCollapsed ? 'hidden' : 'block'}`}>
           <div className="relative">
             <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
             <input type="text" placeholder="Search" className="w-full bg-[#18181b] border border-white/5 rounded-lg py-2 pl-9 pr-4 text-sm text-slate-300 focus:outline-none focus:ring-1 focus:ring-primary/50" />
             <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center bg-white/5 rounded border border-white/10 px-1.5 h-5">
                <span className="text-[10px] text-slate-400 font-mono">⌘F</span>
             </div>
           </div>
        </div>
        
        <nav className="flex-1 py-2 px-4 space-y-1 overflow-y-auto mt-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              className={({ isActive }) =>
                `flex items-center gap-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${isCollapsed ? 'px-0 justify-center' : 'px-3'} ${
                  isActive 
                    ? 'bg-white/10 text-white shadow-sm' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`
              }
              title={isCollapsed ? item.label : undefined}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!isCollapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>
        
        <div className="p-4 border-t border-white/5">
          <button
            onClick={() => {
              localStorage.removeItem('admin_token');
              window.location.href = '/login';
            }}
            className={`w-full flex items-center gap-3 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:text-red-300 hover:bg-white/5 transition-colors ${isCollapsed ? 'justify-center px-0' : 'px-3'}`}
            title={isCollapsed ? 'Log out' : undefined}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
            {!isCollapsed && <span>Log Out</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#09090b]">
        {/* Header (Top Nav Replacement in the design) */}
        
        <div className="flex-1 overflow-y-auto p-8 pt-10">
          <div className="max-w-[1400px] mx-auto">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
