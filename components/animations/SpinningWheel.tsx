'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface SpinningWheelProps {
  imageSrc?: string;
  size?: number;
  autoSpin?: boolean;
  spinDuration?: number;
  className?: string;
}

export function SpinningWheel({ 
  imageSrc = '/spin-2.png',
  size = 400,
  autoSpin = true,
  spinDuration = 8000,
  className = ''
}: SpinningWheelProps) {
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);

  useEffect(() => {
    if (autoSpin) {
      const interval = setInterval(() => {
        setIsSpinning(true);
        setRotation(prev => prev + 360);
        setTimeout(() => setIsSpinning(false), spinDuration);
      }, spinDuration + 2000);

      return () => clearInterval(interval);
    }
  }, [autoSpin, spinDuration]);

  const handleClick = () => {
    if (!isSpinning) {
      setIsSpinning(true);
      const randomRotation = 360 * 5 + Math.random() * 360;
      setRotation(prev => prev + randomRotation);
      setTimeout(() => setIsSpinning(false), 3000);
    }
  };

  return (
    <div 
      className={`relative cursor-pointer ${className}`}
      style={{ width: size, height: size }}
      onClick={handleClick}
    >
      {/* Glow effect */}
      <div 
        className="absolute inset-0 rounded-full blur-2xl opacity-50 transition-opacity duration-300"
        style={{
          background: 'radial-gradient(circle, rgba(255,107,107,0.4) 0%, rgba(45,106,79,0.2) 100%)',
          animation: isSpinning ? 'pulse 1s ease-in-out infinite' : 'none'
        }}
      />
      
      {/* Wheel container */}
      <div
        className="relative w-full h-full transition-transform ease-out"
        style={{
          transform: `rotate(${rotation}deg)`,
          transitionDuration: isSpinning ? `${spinDuration}ms` : '0ms'
        }}
      >
        {/* Actual wheel image */}
        <Image
          src={imageSrc}
          alt="Spinning Wheel"
          width={size}
          height={size}
          className="w-full h-full object-contain drop-shadow-2xl"
          style={{
            mixBlendMode: 'multiply',
            filter: 'drop-shadow(0 25px 50px rgba(0,0,0,0.5))'
          }}
          priority
        />
      </div>

      {/* Center pin */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-white rounded-full shadow-xl flex items-center justify-center z-10">
        <div className="w-8 h-8 bg-gradient-to-br from-[#FF6B6B] to-[#FF5252] rounded-full" />
      </div>

      {/* Pointer */}
      <div className="absolute -top-8 left-1/2 -translate-x-1/2 z-20">
        <div className="w-0 h-0 border-l-[20px] border-l-transparent border-r-[20px] border-r-transparent border-t-[40px] border-t-[#FFD700]" 
          style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.3))' }}
        />
      </div>
    </div>
  );
}
