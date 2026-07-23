import React, { useState, useRef, useEffect } from 'react';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
}

export function Select({ value, onChange, options, placeholder = "Select an option" }: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div className="relative font-sans" ref={containerRef}>
      <button 
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full bg-[#09090b] border border-white/10 hover:border-white/20 text-white text-sm rounded-lg focus:ring-1 focus:ring-primary/50 focus:border-primary/50 focus:outline-none px-4 py-2.5 transition-all cursor-pointer"
      >
        <span className={!selectedOption ? "text-slate-500" : ""}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <svg className="w-4 h-4 text-slate-400 ml-2 shrink-0" fill="none" viewBox="0 0 20 20" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M6 8l4 4 4-4" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-[#09090b] border border-white/10 rounded-lg shadow-lg overflow-hidden py-1">
          {options.map((opt) => (
            <div 
              key={opt.value}
              className={`px-4 py-2.5 text-sm cursor-pointer transition-colors ${
                value === opt.value 
                  ? 'text-white bg-white/10 font-medium' 
                  : 'text-slate-300 hover:bg-white/5 hover:text-white'
              }`}
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
