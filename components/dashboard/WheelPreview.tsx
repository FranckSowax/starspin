'use client';

import React, { useMemo } from 'react';
import { Prize } from '@/lib/types/database';

interface WheelSegment {
  id: string;
  name: string;
  color: string;
  textColor: string;
  type: 'prize' | 'unlucky' | 'retry';
}

interface WheelPreviewProps {
  prizes: Prize[];
  unluckyProbability: number;
  retryProbability: number;
  size?: number;
}

// Color palette for prize segments
const PRIZE_COLORS = [
  '#2D6A4F', // Teal
  '#40916C', // Green
  '#52B788', // Light Green
  '#74C69D', // Mint
  '#95D5B2', // Pale Green
  '#1E88E5', // Blue
  '#42A5F5', // Light Blue
  '#64B5F6', // Sky Blue
  '#7E57C2', // Purple
  '#9575CD', // Light Purple
];

export function WheelPreview({ 
  prizes, 
  unluckyProbability, 
  retryProbability, 
  size = 300 
}: WheelPreviewProps) {
  
  // Build segments array with all prizes + special segments
  const segments = useMemo(() => {
    const allSegments: WheelSegment[] = [];
    
    // Add prize segments
    prizes.forEach((prize, index) => {
      allSegments.push({
        id: prize.id,
        name: prize.name.length > 12 ? prize.name.substring(0, 12) + '...' : prize.name,
        color: PRIZE_COLORS[index % PRIZE_COLORS.length],
        textColor: '#FFFFFF',
        type: 'prize',
      });
    });
    
    // Add UNLUCKY segment
    allSegments.push({
      id: 'unlucky',
      name: '#UNLUCKY#',
      color: '#DC2626', // Red
      textColor: '#FFFFFF',
      type: 'unlucky',
    });
    
    // Add RETRY segment
    allSegments.push({
      id: 'retry',
      name: '#RÉESSAYER#',
      color: '#F59E0B', // Yellow/Amber
      textColor: '#1F2937',
      type: 'retry',
    });
    
    return allSegments;
  }, [prizes]);

  const totalSegments = segments.length;
  const segmentAngle = 360 / totalSegments;
  const radius = size / 2;
  const centerX = radius;
  const centerY = radius;

  // Convert degrees to radians
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

  // Generate SVG path for a segment
  const getSegmentPath = (index: number) => {
    const startAngle = index * segmentAngle - 90; // Start from top
    const endAngle = startAngle + segmentAngle;
    
    const startRad = toRadians(startAngle);
    const endRad = toRadians(endAngle);
    
    const x1 = centerX + radius * Math.cos(startRad);
    const y1 = centerY + radius * Math.sin(startRad);
    const x2 = centerX + radius * Math.cos(endRad);
    const y2 = centerY + radius * Math.sin(endRad);
    
    const largeArcFlag = segmentAngle > 180 ? 1 : 0;
    
    return `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
  };

  // Get text position for a segment
  const getTextPosition = (index: number) => {
    const midAngle = index * segmentAngle + segmentAngle / 2 - 90;
    const textRadius = radius * 0.65;
    const x = centerX + textRadius * Math.cos(toRadians(midAngle));
    const y = centerY + textRadius * Math.sin(toRadians(midAngle));
    return { x, y, rotation: midAngle + 90 };
  };

  if (totalSegments === 0) {
    return (
      <div 
        className="flex items-center justify-center bg-gray-100 rounded-full"
        style={{ width: size, height: size }}
      >
        <p className="text-gray-500 text-sm text-center px-4">
          Ajoutez des prix pour voir la roue
        </p>
      </div>
    );
  }

  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* Wheel SVG */}
      <svg 
        width={size} 
        height={size} 
        viewBox={`0 0 ${size} ${size}`}
        className="drop-shadow-xl"
      >
        {/* Outer ring */}
        <circle 
          cx={centerX} 
          cy={centerY} 
          r={radius - 2} 
          fill="none" 
          stroke="#1F2937" 
          strokeWidth="4"
        />
        
        {/* Segments */}
        {segments.map((segment, index) => (
          <g key={segment.id}>
            <path
              d={getSegmentPath(index)}
              fill={segment.color}
              stroke="#1F2937"
              strokeWidth="1"
              className="transition-all duration-200 hover:brightness-110"
            />
            {/* Segment text */}
            <text
              x={getTextPosition(index).x}
              y={getTextPosition(index).y}
              fill={segment.textColor}
              fontSize={totalSegments > 8 ? 8 : totalSegments > 5 ? 10 : 12}
              fontWeight="bold"
              textAnchor="middle"
              dominantBaseline="middle"
              transform={`rotate(${getTextPosition(index).rotation}, ${getTextPosition(index).x}, ${getTextPosition(index).y})`}
              style={{ 
                textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
                pointerEvents: 'none'
              }}
            >
              {segment.name}
            </text>
          </g>
        ))}
        
        {/* Center circle */}
        <circle 
          cx={centerX} 
          cy={centerY} 
          r={radius * 0.15} 
          fill="#1F2937"
          stroke="#374151"
          strokeWidth="2"
        />
        
        {/* Center decoration */}
        <circle 
          cx={centerX} 
          cy={centerY} 
          r={radius * 0.08} 
          fill="#4B5563"
        />
      </svg>
      
      {/* Pointer/Arrow at top */}
      <div 
        className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1"
        style={{ zIndex: 10 }}
      >
        <div 
          className="w-0 h-0 border-l-[12px] border-r-[12px] border-t-[20px] border-l-transparent border-r-transparent border-t-red-600"
          style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}
        />
      </div>
    </div>
  );
}
