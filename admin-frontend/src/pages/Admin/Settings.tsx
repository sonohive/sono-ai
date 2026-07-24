import React from 'react';
import { Save } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { CardContainer } from '../../components/ui/CardContainer';

export default function Settings() {
  const inputClass = "w-full bg-[#09090b] border border-white/10 hover:border-white/20 rounded-lg text-sm text-white focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all placeholder:text-slate-500 font-sans px-4 py-2.5";

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <PageHeader 
        title="System Configuration" 
        description="Manage system-wide variables, API keys, and RAG thresholds. These settings affect the entire Sono AI infrastructure."
      />

      <CardContainer noPadding>
        <div className="p-6 border-b border-white/5 bg-black/20">
          <h2 className="text-lg font-semibold text-white">Retrieval-Augmented Generation (RAG)</h2>
          <p className="text-sm text-slate-400 mt-1">Configure how the AI searches and retrieves knowledge base context.</p>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-400 mb-2">Top-K Results Limit</label>
              <input 
                type="number" 
                defaultValue={5}
                className={inputClass}
              />
              <p className="text-xs text-slate-500 mt-2">Number of chunks to inject into the system prompt.</p>
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-400 mb-2">Similarity Distance Threshold</label>
              <input 
                type="number" 
                step="0.01"
                defaultValue={0.25}
                className={inputClass}
              />
              <p className="text-xs text-slate-500 mt-2">Maximum L2 distance for a chunk to be considered relevant.</p>
            </div>
          </div>
        </div>

        <div className="p-6 bg-black/20 border-t border-white/5 flex justify-end">
          <button className="flex items-center gap-2 px-6 py-2.5 bg-white text-black hover:bg-slate-200 rounded-lg text-sm font-medium transition-all">
            <Save className="w-4 h-4" />
            Save Configuration
          </button>
        </div>
      </CardContainer>
    </div>
  );
}
