import React from 'react';

interface CardContainerProps {
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
}

export function CardContainer({ children, className = '', noPadding = false }: CardContainerProps) {
  return (
    <div className={`bg-[#18181b] border border-white/5 rounded-xl ${noPadding ? 'overflow-hidden' : 'p-6'} ${className}`}>
      {children}
    </div>
  );
}
