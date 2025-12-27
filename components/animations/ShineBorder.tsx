'use client';

import { ReactNode } from 'react';

interface ShineBorderProps {
  children: ReactNode;
  color?: string;
  borderRadius?: number;
  borderWidth?: number;
  duration?: number;
  className?: string;
}

export function ShineBorder({
  children,
  color = '#FF6B6B',
  borderRadius = 12,
  borderWidth = 2,
  duration = 3,
  className = ''
}: ShineBorderProps) {
  return (
    <div
      className={`relative ${className}`}
      style={{
        borderRadius: `${borderRadius}px`,
        padding: `${borderWidth}px`
      }}
    >
      {/* Animated border */}
      <div
        className="absolute inset-0 rounded-inherit"
        style={{
          borderRadius: `${borderRadius}px`,
          background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
          backgroundSize: '200% 100%',
          animation: `shine ${duration}s linear infinite`,
          padding: `${borderWidth}px`,
          WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'xor',
          maskComposite: 'exclude'
        }}
      />
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>

      <style jsx>{`
        @keyframes shine {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }
      `}</style>
    </div>
  );
}
