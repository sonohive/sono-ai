import React from 'react';
import { Search, X } from 'lucide-react';
import { Select } from './ui/Select';

interface KBFilterBarProps {
  filterTopic: string;
  setFilterTopic: (v: string) => void;
  filterCountry: string;
  setFilterCountry: (v: string) => void;
  filterMode: string;
  setFilterMode: (v: string) => void;
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  topicOptions: { value: string; label: string }[];
  onClear: () => void;
}

export function KBFilterBar({
  filterTopic, setFilterTopic,
  filterCountry, setFilterCountry,
  filterMode, setFilterMode,
  searchQuery, setSearchQuery,
  topicOptions,
  onClear
}: KBFilterBarProps) {
  const inputClass = "bg-[#09090b] border border-white/10 hover:border-white/20 rounded-lg text-sm text-white focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all placeholder:text-slate-500 px-4 py-2.5 w-full";

  const tabs = [
    { id: '', label: 'All Modes' },
    { id: 'guideline', label: 'Guideline' },
    { id: 'research', label: 'Research' }
  ];

  return (
    <div className="bg-[#121214] border border-white/5 rounded-xl p-4 mb-6 space-y-4">
      <div className="flex items-center">
        <div className="flex p-1 bg-black/40 rounded-lg border border-white/5">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterMode(tab.id)}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                filterMode === tab.id 
                  ? 'bg-[#27272a] text-white shadow-sm border border-white/10' 
                  : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        <div className="md:col-span-2">
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Search Source Name</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className={`${inputClass} pl-10`}
            />
          </div>
        </div>
        
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Topic</label>
          <Select
            value={filterTopic}
            onChange={setFilterTopic}
            options={topicOptions}
            className="w-full"
          />
        </div>

        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Country</label>
            <input
              type="text"
              value={filterCountry}
              onChange={(e) => setFilterCountry(e.target.value)}
              placeholder="e.g. UK"
              className={inputClass}
            />
          </div>
          <button
            onClick={onClear}
            title="Clear Filters"
            className="h-[42px] px-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-slate-400 hover:text-white transition-colors flex items-center justify-center shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
