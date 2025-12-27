'use client';

import { ReactNode } from 'react';

interface GradientTextProps {
  children: ReactNode;
  colors?: string[];
  animate?: boolean;
  className?: string;
}

export function GradientText({
  children,
  colors = ['#FF1B8D', '#00D9FF', '#FFB703'],
  animate = true,
  className = ''
}: GradientTextProps) {
  const gradientStyle = {
    background: `linear-gradient(90deg, ${colors.join(', ')})`,
    backgroundSize: animate ? '200% 200%' : '100% 100%',
    backgroundClip: 'text',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    animation: animate ? 'gradient 3s ease infinite' : 'none'
  };

  return (
    <span className={className} style={gradientStyle}>
      {children}
    </span>
  );
}
