import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  iconContainerClass?: string;
  footerText?: string;
  footerDotClass?: string;
}

export function StatCard({ 
  title, 
  value, 
  icon, 
  iconContainerClass = "bg-white/5",
  footerText,
  footerDotClass = "bg-primary" 
}: StatCardProps) {
  return (
    <div className="bg-[#121214] border border-white/5 rounded-xl p-5 hover:bg-[#18181b] transition-colors flex flex-col justify-between h-full min-h-[160px]">
      <div>
        <div className="flex justify-between items-start mb-4">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${iconContainerClass}`}>
            {icon}
          </div>
        </div>
        <div className="text-sm text-slate-500 mb-1">{title}</div>
        <div className="text-2xl font-bold text-white mb-6">{value}</div>
      </div>
      {footerText && (
        <div className="flex items-center justify-between text-xs pt-4 border-t border-white/5 mt-auto">
          <div className="flex items-center gap-1.5 text-slate-400">
            <div className={`w-1.5 h-1.5 rounded-full ${footerDotClass}`}></div>
            {footerText}
          </div>
        </div>
      )}
    </div>
  );
}
