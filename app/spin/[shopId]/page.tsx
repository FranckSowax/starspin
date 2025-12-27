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

  const selectWinningSegment = () => {
    const totalProbability = prizes.reduce((sum, prize) => sum + (prize.probability || 0), 0);
    let random = Math.random() * totalProbability;
    
    for (let i = 0; i < prizes.length; i++) {
      random -= (prizes[i].probability || 0);
      if (random <= 0) return i;
    }
    return 0;
  };

  const spinWheel = async () => {
    if (isSpinning || prizes.length === 0) return;
    
    setIsSpinning(true);
    setResult('');

    const winningIndex = selectWinningSegment();
    const segmentAngle = 360 / prizes.length;
    const randomOffset = Math.random() * (segmentAngle * 0.7) + (segmentAngle * 0.15);
    
    const targetRotation = (winningIndex * segmentAngle) + randomOffset;
    const totalRotation = currentRotationRef.current + 1800 + (360 - targetRotation);

    if (wheelRef.current) {
      wheelRef.current.style.transform = `rotate(${totalRotation}deg)`;
      currentRotationRef.current = totalRotation;
    }

    setTimeout(async () => {
      await handleSpinComplete(prizes[winningIndex]);
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

  const segmentAngle = prizes.length > 0 ? 360 / prizes.length : 0;

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
          width: 50%;
          height: 50%;
          transform-origin: 100% 100%;
          clip-path: polygon(0 0, 100% 0, 100% 100%);
        }

        .segment-content {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.3);
        }

        .segment-content.green {
          background: linear-gradient(135deg, #2d8a3e 0%, #1e6b2f 50%, #2d8a3e 100%);
        }

        .segment-content.yellow {
          background: linear-gradient(135deg, #ffd700 0%, #ffb700 50%, #ffa500 100%);
          box-shadow: inset 0 0 30px rgba(255, 215, 0, 0.3), 0 0 20px rgba(255, 215, 0, 0.4);
        }

        .segment-text {
          position: absolute;
          top: 25%;
          left: 42%;
          writing-mode: vertical-rl;
          text-orientation: mixed;
          color: #ffd700;
          font-size: clamp(0.7rem, 2vw, 1.1rem);
          font-weight: 900;
          text-align: center;
          text-shadow: 2px 2px 6px rgba(0, 0, 0, 0.9), 0 0 10px rgba(0, 0, 0, 0.5);
          letter-spacing: 0.05em;
          line-height: 1.1;
          transform: rotate(${segmentAngle / 2}deg);
        }

        .segment-text.yellow-text {
          color: #8b4513;
          text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5), 0 0 8px rgba(255, 215, 0, 0.3);
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
          <h1 className="text-white mb-8 text-3xl md:text-4xl font-black" style={{ textShadow: '2px 2px 8px rgba(0, 0, 0, 0.8)' }}>
            🎰 ROUE DE LA FORTUNE
          </h1>

          {/* Wheel Wrapper */}
          <div className="relative w-full aspect-square max-w-[450px] mx-auto">
            {/* Pointer */}
            <div className="absolute top-[-15px] left-1/2 -translate-x-1/2 z-[100]" style={{ filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.5))' }}>
              <div className="absolute top-[-25px] left-1/2 -translate-x-1/2 w-[18px] h-[18px] bg-[#1a1a1a] rounded-full" style={{ boxShadow: '0 2px 5px rgba(0, 0, 0, 0.5), inset 0 1px 2px rgba(255, 255, 255, 0.2)' }}></div>
              <div className="absolute top-[-55px] left-[-18px] w-[36px] h-[22px] rounded-t-[18px]" style={{ background: 'linear-gradient(180deg, #ffb84d 0%, #ffa500 100%)', boxShadow: 'inset 0 2px 4px rgba(255, 255, 255, 0.3)' }}></div>
              <div className="w-0 h-0 border-l-[22px] border-l-transparent border-r-[22px] border-r-transparent border-t-[45px] border-t-[#ffa500] relative" style={{ filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))' }}></div>
            </div>

            {/* Wheel Container */}
            <div className="w-full h-full rounded-full relative p-[3%]" style={{ background: 'linear-gradient(145deg, #2a2a2a, #1a1a1a)', boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8), inset 0 2px 15px rgba(255, 255, 255, 0.15)' }}>
              {/* Decorative Dots */}
              <div className="absolute inset-[3%] rounded-full">
                {[...Array(10)].map((_, i) => (
                  <div
                    key={i}
                    className="dot"
                    style={{ transform: `rotate(${i * 36}deg) translateX(-50%)` }}
                  />
                ))}
              </div>

              {/* Wheel */}
              <div
                ref={wheelRef}
                className="wheel w-full h-full rounded-full relative overflow-hidden"
                style={{ boxShadow: 'inset 0 0 30px rgba(0, 0, 0, 0.5)' }}
              >
                {prizes.map((prize, index) => {
                  const isHighValue = (prize.probability || 0) <= 10;
                  return (
                    <div
                      key={prize.id}
                      className="segment"
                      style={{ transform: `rotate(${index * segmentAngle}deg)` }}
                    >
                      <div className={`segment-content ${isHighValue ? 'yellow' : 'green'}`}>
                        <div className={`segment-text ${isHighValue ? 'yellow-text' : ''}`}>
                          {prize.name}
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
