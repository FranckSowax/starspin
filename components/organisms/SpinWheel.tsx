'use client';

import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Prize } from '@/lib/types/database';

interface SpinWheelProps {
  prizes: Prize[];
  onSpinComplete: (prize: Prize) => void;
}

export const SpinWheel: React.FC<SpinWheelProps> = ({ prizes, onSpinComplete }) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const wheelRef = useRef<HTMLDivElement>(null);

  const selectPrize = (): Prize => {
    const totalProbability = prizes.reduce((sum, prize) => sum + prize.probability, 0);
    let random = Math.random() * totalProbability;
    
    for (const prize of prizes) {
      random -= prize.probability;
      if (random <= 0) {
        return prize;
      }
    }
    
    return prizes[0];
  };

  const handleSpin = () => {
    if (isSpinning) return;

    setIsSpinning(true);
    const selectedPrize = selectPrize();
    const prizeIndex = prizes.findIndex(p => p.id === selectedPrize.id);
    const segmentAngle = 360 / prizes.length;
    const targetAngle = 360 - (prizeIndex * segmentAngle + segmentAngle / 2);
    const spins = 5;
    const finalRotation = rotation + (360 * spins) + targetAngle;

    setRotation(finalRotation);

    setTimeout(() => {
      setIsSpinning(false);
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
      onSpinComplete(selectedPrize);
    }, 4000);
  };

  const segmentAngle = 360 / prizes.length;

  return (
    <div className="flex flex-col items-center gap-8">
      <div className="relative w-80 h-80">
        <motion.div
          ref={wheelRef}
          className="w-full h-full rounded-full border-8 border-[#FF6F61] shadow-2xl overflow-hidden"
          animate={{ rotate: rotation }}
          transition={{ duration: 4, ease: [0.17, 0.67, 0.12, 0.99] }}
        >
          {prizes.map((prize, index) => {
            const angle = index * segmentAngle;
            const colors = ['#FF6F61', '#4CAF50', '#FFC107', '#2196F3', '#9C27B0'];
            const color = colors[index % colors.length];

            return (
              <div
                key={prize.id}
                className="absolute w-full h-full"
                style={{
                  transform: `rotate(${angle}deg)`,
                  clipPath: `polygon(50% 50%, 50% 0%, ${50 + 50 * Math.sin((segmentAngle * Math.PI) / 180)}% ${50 - 50 * Math.cos((segmentAngle * Math.PI) / 180)}%)`,
                  backgroundColor: color,
                }}
              >
                <div
                  className="absolute top-8 left-1/2 -translate-x-1/2 text-white font-bold text-sm text-center"
                  style={{ transform: `rotate(${segmentAngle / 2}deg)` }}
                >
                  {prize.name}
                </div>
              </div>
            );
          })}
        </motion.div>

        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 w-0 h-0 border-l-[20px] border-r-[20px] border-t-[40px] border-l-transparent border-r-transparent border-t-[#1A202C] z-10" />
      </div>

      <motion.button
        onClick={handleSpin}
        disabled={isSpinning}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="px-8 py-4 bg-[#FF6F61] text-white text-xl font-bold rounded-full shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSpinning ? 'Spinning...' : 'SPIN THE WHEEL!'}
      </motion.button>
    </div>
  );
};
