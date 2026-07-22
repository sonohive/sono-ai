import React from 'react';
import { Save } from 'lucide-react';

export default function Settings() {
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Admin Hero Header with Deep Gradient */}
      <div className="bg-gradient-to-br from-[#0a1628] to-[#1a3a8f] rounded-2xl p-8 text-white shadow-xl">
        <h1 className="text-3xl font-bold">System Configuration</h1>
        <p className="text-blue-100 mt-2 max-w-2xl text-sm leading-relaxed">
          Manage system-wide variables, API keys, and RAG thresholds. These settings affect the entire Sono AI infrastructure.
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-lg font-semibold text-slate-800">Retrieval-Augmented Generation (RAG)</h2>
          <p className="text-sm text-slate-500">Configure how the AI searches and retrieves knowledge base context.</p>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">Top-K Results Limit</label>
              <input 
                type="number" 
                defaultValue={5}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none text-slate-700"
              />
              <p className="text-xs text-slate-500">Number of chunks to inject into the system prompt.</p>
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">Similarity Distance Threshold</label>
              <input 
                type="number" 
                step="0.01"
                defaultValue={0.25}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none text-slate-700"
              />
              <p className="text-xs text-slate-500">Maximum L2 distance for a chunk to be considered relevant.</p>
            </div>
          </div>
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-5 py-2.5 rounded-lg font-medium text-sm transition-colors shadow-sm">
            <Save className="w-4 h-4" />
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
}
