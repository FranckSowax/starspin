'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface StarRatingProps {
  onRate: (rating: number) => void;
  maxStars?: number;
}

export const StarRating: React.FC<StarRatingProps> = ({ onRate, maxStars = 5 }) => {
  const [hoveredStar, setHoveredStar] = useState<number | null>(null);
  const [selectedStar, setSelectedStar] = useState<number | null>(null);

  const handleClick = (rating: number) => {
    setSelectedStar(rating);
    onRate(rating);
  };

  return (
    <div className="flex gap-2 justify-center">
      {[...Array(maxStars)].map((_, index) => {
        const starValue = index + 1;
        const isActive = hoveredStar ? starValue <= hoveredStar : selectedStar ? starValue <= selectedStar : false;

        return (
          <motion.button
            key={starValue}
            type="button"
            onClick={() => handleClick(starValue)}
            onMouseEnter={() => setHoveredStar(starValue)}
            onMouseLeave={() => setHoveredStar(null)}
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
            className="focus:outline-none"
          >
            <svg
              className={`w-12 h-12 md:w-16 md:h-16 transition-colors duration-200 ${
                isActive ? 'fill-[#FFC107] stroke-[#FFC107]' : 'fill-gray-300 stroke-gray-300'
              }`}
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                strokeWidth="1"
              />
            </svg>
          </motion.button>
        );
      })}
    </div>
  );
};
