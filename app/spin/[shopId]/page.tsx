'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Prize } from '@/lib/types/database';
import { useTranslation } from 'react-i18next';
import '@/lib/i18n/config';

export default function SpinPage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useTranslation();
  const shopId = params.shopId as string;

  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [merchant, setMerchant] = useState<any>(null);
  const [hasSpun, setHasSpun] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [result, setResult] = useState<string>('');
  const wheelRef = useRef<HTMLDivElement>(null);
  const currentRotationRef = useRef(0);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    const checkSpinEligibility = async () => {
      const userToken = localStorage.getItem('user_token');
      
      if (userToken) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const { data } = await supabase
          .from('spins')
          .select('*')
          .eq('merchant_id', shopId)
          .eq('user_token', userToken)
          .gte('created_at', today.toISOString())
          .single();

        if (data) {
          setHasSpun(true);
        }
      }

      const { data: merchantData } = await supabase
        .from('merchants')
        .select('*')
        .eq('id', shopId)
        .single();

      const { data: prizesData } = await supabase
        .from('prizes')
        .select('*')
        .eq('merchant_id', shopId);

      setMerchant(merchantData);
      setPrizes(prizesData || []);
      setLoading(false);
    };

    checkSpinEligibility();
  }, [shopId]);

  // Create interleaved segments: Prize -> UNLUCKY -> Prize -> UNLUCKY...
  const allSegments: Array<{ type: 'prize' | 'unlucky'; prize?: Prize; index: number }> = prizes.flatMap((prize, i) => [
    { type: 'prize' as const, prize, index: i },
    { type: 'unlucky' as const, index: i }
  ]);

  const totalSegments = allSegments.length;
  const segmentAngle = totalSegments > 0 ? 360 / totalSegments : 0;
  const skewAngle = 90 - segmentAngle;

  const selectWinningSegment = () => {
    // Select based on prize probability, return the index in allSegments (prize index * 2)
    const totalProbability = prizes.reduce((sum, prize) => sum + (prize.probability || 0), 0);
    let random = Math.random() * totalProbability;
    
    for (let i = 0; i < prizes.length; i++) {
      random -= (prizes[i].probability || 0);
      if (random <= 0) return i * 2; // Return allSegments index (prize segments are at even indices)
    }
    return 0;
  };

  const spinWheel = async () => {
    if (isSpinning || prizes.length === 0) return;
    
    setIsSpinning(true);
    setResult('');

    const winningSegmentIndex = selectWinningSegment();
    const winningPrizeIndex = Math.floor(winningSegmentIndex / 2);
    
    // Calculate segment center for alignment
    // Each segment spans segmentAngle degrees
    // Segment i starts at i * segmentAngle
    // Center is at i * segmentAngle + segmentAngle / 2
    const segmentCenter = (winningSegmentIndex * segmentAngle) + (segmentAngle / 2);

    // Target is Top (270 degrees)
    const currentRot = currentRotationRef.current;
    const baseTarget = 270 - segmentCenter;
    
    // Calculate smallest positive delta to reach target
    const distToTarget = (baseTarget - (currentRot % 360) + 360) % 360;
    
    // Add 5 full spins (1800 deg) + distance
    const totalRotation = currentRot + 1800 + distToTarget;

    if (wheelRef.current) {
      wheelRef.current.style.transform = `rotate(${totalRotation}deg)`;
      currentRotationRef.current = totalRotation;
    }

    setTimeout(async () => {
      await handleSpinComplete(prizes[winningPrizeIndex]);
      setIsSpinning(false);
    }, 5000);
  };

  const handleSpinComplete = async (prize: Prize) => {
    const userToken = localStorage.getItem('user_token') || crypto.randomUUID();
    localStorage.setItem('user_token', userToken);

    // Show result
    setResult(prize.name);

    // Confetti effect
    if (typeof window !== 'undefined' && (window as any).confetti) {
      (window as any).confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.6 },
        colors: ['#ffd700', '#2d8a3e', '#ffb700', '#ff9500']
      });
    }

    const { data: spinData } = await supabase
      .from('spins')
      .insert({
        merchant_id: shopId,
        prize_id: prize.id,
        user_token: userToken,
      })
      .select()
      .single();

    if (spinData) {
      const couponCode = `${merchant.business_name?.substring(0, 3).toUpperCase()}-${crypto.randomUUID().substring(0, 8).toUpperCase()}`;
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      await supabase.from('coupons').insert({
        spin_id: spinData.id,
        merchant_id: shopId,
        code: couponCode,
        prize_name: prize.name,
        expires_at: expiresAt.toISOString(),
      });

      setTimeout(() => {
        router.push(`/coupon/${shopId}?code=${couponCode}`);
      }, 3000);
    }
  };

  if (!isClient || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-600 to-teal-700">
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl p-8">
          <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  if (hasSpun) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
        {merchant?.background_url ? (
          <>
            <div 
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${merchant.background_url})` }}
            />
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-teal-600 to-teal-700"></div>
        )}
        <div className="relative z-10 bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {t('wheel.alreadySpun')}
          </h1>
          <p className="text-gray-600">{t('wheel.tryAgainTomorrow')}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <style jsx global>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(100vh);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }

        .game-container {
          animation: slideUp 1s ease-out;
        }

        .wheel {
          transition: transform 5s cubic-bezier(0.17, 0.67, 0.12, 0.99);
        }

        .segment {
          position: absolute;
          width: 100%;
          height: 100%;
          top: 0;
          left: 0;
          overflow: hidden;
        }

        .segment-content {
          position: absolute;
          width: 100%;
          height: 100%;
          display: flex;
          align-items: flex-start;
          justify-content: center;
          padding-top: 8%;
        }

        .segment-content.green {
          background: linear-gradient(180deg, #2d8a3e 0%, #1e6b2f 100%);
        }

        .segment-content.black {
          background: linear-gradient(180deg, #2a2a2a 0%, #1a1a1a 100%);
        }

        .segment-content.yellow {
          background: linear-gradient(180deg, #ffd700 0%, #e6a800 100%);
        }

        .segment-text {
          color: #ffd700;
          font-family: 'Arial Black', Arial, sans-serif;
          font-size: clamp(0.5rem, 1.8vw, 0.85rem);
          font-weight: 900;
          text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.9);
          white-space: nowrap;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .segment-text.yellow-text {
          color: #1a1a1a;
          text-shadow: none;
        }

        .dot {
          position: absolute;
          width: 3%;
          height: 3%;
          background: radial-gradient(circle, #ffd700 0%, #ffb700 50%, #ff9500 100%);
          border-radius: 50%;
          top: 0;
          left: 50%;
          transform-origin: 0 calc(50vw * 0.47);
          box-shadow: 0 2px 8px rgba(255, 215, 0, 0.6), inset 0 1px 3px rgba(255, 255, 255, 0.5);
        }
      `}</style>

      <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
        {/* Background */}
        {merchant?.background_url ? (
          <>
            <div 
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${merchant.background_url})` }}
            />
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>
          </>
        ) : (
          <div className="absolute inset-0 bg-[#1a1a2e]"></div>
        )}

        {/* Game Container */}
        <div className="game-container relative z-10 text-center w-full max-w-[500px]">
          
          {/* Wheel Wrapper */}
          <div className="relative w-full aspect-square max-w-[450px] mx-auto">
            {/* Pointer */}
            <div className="absolute top-[-160px] left-1/2 -translate-x-1/2 z-[100]" style={{ filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.5))' }}>
              {merchant?.logo_url ? (
                <div className="relative">
                  <div className="w-40 h-40 bg-white rounded-full p-2 shadow-xl flex items-center justify-center border-4 border-[#ffd700]">
                    <img 
                      src={merchant.logo_url} 
                      alt="Merchant Logo" 
                      className="w-full h-full object-contain rounded-full"
                    />
                  </div>
                  <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[30px] border-l-transparent border-r-[30px] border-r-transparent border-t-[40px] border-t-[#ffd700]"></div>
                </div>
              ) : (
                <>
                  <div className="absolute top-[-25px] left-1/2 -translate-x-1/2 w-[18px] h-[18px] bg-[#1a1a1a] rounded-full" style={{ boxShadow: '0 2px 5px rgba(0, 0, 0, 0.5), inset 0 1px 2px rgba(255, 255, 255, 0.2)' }}></div>
                  <div className="absolute top-[-55px] left-[-18px] w-[36px] h-[22px] rounded-t-[18px]" style={{ background: 'linear-gradient(180deg, #ffb84d 0%, #ffa500 100%)', boxShadow: 'inset 0 2px 4px rgba(255, 255, 255, 0.3)' }}></div>
                  <div className="w-0 h-0 border-l-[22px] border-l-transparent border-r-[22px] border-r-transparent border-t-[45px] border-t-[#ffa500] relative" style={{ filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))' }}></div>
                </>
              )}
            </div>

            {/* Wheel Container */}
            <div className="w-full h-full rounded-full relative p-[3%]" style={{ background: 'linear-gradient(145deg, #2a2a2a, #1a1a1a)', boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8), inset 0 2px 15px rgba(255, 255, 255, 0.15)' }}>
              {/* Decorative Dots */}
              <div className="absolute inset-[3%] rounded-full">
                {allSegments.map((_, i) => (
                  <div
                    key={i}
                    className="dot"
                    style={{ transform: `rotate(${i * segmentAngle + segmentAngle / 2}deg) translateX(-50%)` }}
                  />
                ))}
              </div>

              {/* Wheel */}
              <div
                ref={wheelRef}
                className="wheel w-full h-full rounded-full relative overflow-hidden"
                style={{ boxShadow: 'inset 0 0 30px rgba(0, 0, 0, 0.5)' }}
              >
                {allSegments.map((segment, index) => {
                  const isUnlucky = segment.type === 'unlucky';
                  const prize = segment.prize;
                  const isHighValue = prize && (prize.probability || 0) <= 10;
                  
                  // Color logic: UNLUCKY = black, high value prize = yellow, normal prize = green
                  let segmentColor = 'green';
                  if (isUnlucky) {
                    segmentColor = 'black';
                  } else if (isHighValue) {
                    segmentColor = 'yellow';
                  }
                  
                  const segmentText = isUnlucky ? 'Réessayez' : (prize?.name || '');
                  
                  // Calculate clip-path for pie slice
                  // Each segment is a triangle from center to edge
                  const startAngle = index * segmentAngle - 90; // -90 to start from top
                  const endAngle = startAngle + segmentAngle;
                  const midAngle = startAngle + segmentAngle / 2;
                  
                  // Convert angles to radians for calculation
                  const startRad = (startAngle * Math.PI) / 180;
                  const endRad = (endAngle * Math.PI) / 180;
                  const midRad = (midAngle * Math.PI) / 180;
                  
                  // Calculate points for clip-path polygon (center + arc approximation)
                  const r = 50; // radius percentage
                  const cx = 50; // center x
                  const cy = 50; // center y
                  
                  // For small angles, we can use a simple triangle
                  // For larger angles, add intermediate points
                  const points = [`${cx}% ${cy}%`]; // center point
                  
                  // Add points along the arc
                  const numArcPoints = Math.max(2, Math.ceil(segmentAngle / 30));
                  for (let i = 0; i <= numArcPoints; i++) {
                    const angle = startRad + (endRad - startRad) * (i / numArcPoints);
                    const x = cx + r * Math.cos(angle);
                    const y = cy + r * Math.sin(angle);
                    points.push(`${x}% ${y}%`);
                  }
                  
                  const clipPath = `polygon(${points.join(', ')})`;
                  
                  // Text rotation to point outward from center
                  const textRotation = midAngle + 90; // +90 to make text radial

                  return (
                    <div
                      key={`${segment.type}-${index}`}
                      className="segment"
                      style={{ 
                        clipPath: clipPath
                      }}
                    >
                      <div 
                        className={`segment-content ${segmentColor}`}
                      >
                        <div 
                          className={`segment-text ${isHighValue ? 'yellow-text' : ''}`}
                          style={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: `rotate(${midAngle + 90}deg) translateX(15%)`,
                            transformOrigin: 'left center'
                          }}
                        >
                          {segmentText}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Center SPIN Button */}
              <div
                onClick={spinWheel}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[28%] h-[28%] rounded-full flex items-center justify-center cursor-pointer z-10 border-[3px] border-[#1a1a1a] transition-transform hover:scale-105 active:scale-95"
                style={{
                  background: 'radial-gradient(circle at 30% 30%, #3a3a3a, #2a2a2a 40%, #1a1a1a)',
                  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.8), inset 0 3px 15px rgba(255, 255, 255, 0.15), inset 0 -3px 10px rgba(0, 0, 0, 0.5)'
                }}
              >
                <div className="absolute inset-[-6px] rounded-full -z-10" style={{ background: 'linear-gradient(145deg, #2a2a2a, #1a1a1a)' }}></div>
                <div className="text-2xl md:text-4xl font-black text-[#ffd700]" style={{ textShadow: '2px 2px 6px rgba(0, 0, 0, 0.9), 0 0 15px rgba(255, 215, 0, 0.5)', letterSpacing: '0.1em' }}>
                  SPIN
                </div>
              </div>
            </div>
          </div>

          {/* Result */}
          {result && (
            <div className="mt-8" style={{ animation: 'fadeIn 0.5s ease' }}>
              <div className="inline-block bg-black/80 px-8 py-5 rounded-2xl backdrop-blur-lg border-2 border-[#ffd700]/50" style={{ boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)' }}>
                <div className="text-xl text-[#ffd700] mb-2">🎊 FÉLICITATIONS ! 🎊</div>
                <div className="text-2xl text-white font-bold">{result}</div>
              </div>
            </div>
          )}
        </div>
      </div>

    </>
  );
}
