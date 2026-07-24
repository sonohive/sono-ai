import React from 'react';
import { Outlet } from 'react-router-dom';
import { SFTSidebar } from '../../components/SFT/SFTSidebar';

const SFTLayout = () => {
  return (
    <div className="min-h-screen bg-[#09090b] text-white">
      <SFTSidebar />
      <main className="ml-64 p-8 min-h-screen relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-purple-900/10 via-[#09090b] to-[#09090b] -z-10" />
        <div className="max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default SFTLayout;
