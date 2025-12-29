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

export interface PrizeWithQuantity {
  prize: Prize;
  quantity: number;
}

interface WheelPreviewProps {
  prizeQuantities: PrizeWithQuantity[];
  unluckyQuantity: number;
  retryQuantity: number;
  size?: number;
  maxSegments?: number;
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

// Distribute segments evenly so same-type segments are not adjacent
function distributeSegments(segments: WheelSegment[]): WheelSegment[] {
  if (segments.length <= 2) return segments;
  
  // Group segments by their base ID (without the index suffix)
  const groups: Map<string, WheelSegment[]> = new Map();
  segments.forEach(seg => {
    // Extract base ID (e.g., "prize-abc" from "prize-abc-0")
    const baseId = seg.id.replace(/-\d+$/, '');
    if (!groups.has(baseId)) {
      groups.set(baseId, []);
    }
    groups.get(baseId)!.push(seg);
  });
  
  // Sort groups by size (largest first) for better distribution
  const sortedGroups = Array.from(groups.values()).sort((a, b) => b.length - a.length);
  
  // Interleave segments from different groups
  const result: WheelSegment[] = [];
  const totalSegments = segments.length;
  const groupPointers = sortedGroups.map(() => 0);
  
  for (let i = 0; i < totalSegments; i++) {
    // Find a group that has remaining segments and won't create adjacency
    let placed = false;
    
    for (let g = 0; g < sortedGroups.length; g++) {
      const group = sortedGroups[g];
      const pointer = groupPointers[g];
      
      if (pointer >= group.length) continue;
      
      // Check if placing this segment would create adjacency
      const lastSegment = result[result.length - 1];
      const candidateBaseId = group[pointer].id.replace(/-\d+$/, '');
      const lastBaseId = lastSegment?.id.replace(/-\d+$/, '');
      
      if (!lastSegment || candidateBaseId !== lastBaseId) {
        result.push(group[pointer]);
        groupPointers[g]++;
        placed = true;
        break;
      }
    }
    
    // If no non-adjacent placement found, just place the next available
    if (!placed) {
      for (let g = 0; g < sortedGroups.length; g++) {
        if (groupPointers[g] < sortedGroups[g].length) {
          result.push(sortedGroups[g][groupPointers[g]]);
          groupPointers[g]++;
          break;
        }
      }
    }
  }
  
  return result;
}

export function WheelPreview({ 
  prizeQuantities, 
  unluckyQuantity, 
  retryQuantity, 
  size = 300,
  maxSegments = 8
}: WheelPreviewProps) {
  
  // Build segments array based on quantities
  const segments = useMemo(() => {
    const allSegments: WheelSegment[] = [];
    let colorIndex = 0;
    
    // Add prize segments based on quantity
    prizeQuantities.forEach(({ prize, quantity }) => {
      for (let i = 0; i < quantity; i++) {
        allSegments.push({
          id: `${prize.id}-${i}`,
          name: prize.name.length > 10 ? prize.name.substring(0, 10) + '...' : prize.name,
          color: PRIZE_COLORS[colorIndex % PRIZE_COLORS.length],
          textColor: '#FFFFFF',
          type: 'prize',
        });
      }
      if (quantity > 0) colorIndex++;
    });
    
    // Add UNLUCKY segments based on quantity
    for (let i = 0; i < unluckyQuantity; i++) {
      allSegments.push({
        id: `unlucky-${i}`,
        name: '#UNLUCKY#',
        color: '#DC2626', // Red
        textColor: '#FFFFFF',
        type: 'unlucky',
      });
    }
    
    // Add RETRY segments based on quantity
    for (let i = 0; i < retryQuantity; i++) {
      allSegments.push({
        id: `retry-${i}`,
        name: '#RÉESSAYER#',
        color: '#F59E0B', // Yellow/Amber
        textColor: '#1F2937',
        type: 'retry',
      });
    }
    
    // Distribute segments to avoid adjacency of same types
    return distributeSegments(allSegments);
  }, [prizeQuantities, unluckyQuantity, retryQuantity]);

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
