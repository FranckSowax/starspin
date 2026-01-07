'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Prize } from '@/lib/types/database';
import { useTranslation } from 'react-i18next';
import '@/lib/i18n/config';

export default function SpinPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, i18n } = useTranslation();
  const shopId = params.shopId as string;

  // Get phone number and language from URL params (passed from redirect page)
  const phoneFromUrl = searchParams.get('phone');
  const langFromUrl = searchParams.get('lang');
  const currentLang = langFromUrl || i18n.language || 'en';

  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [merchant, setMerchant] = useState<any>(null);
  const [hasSpun, setHasSpun] = useState(false);
  const [spinsRemaining, setSpinsRemaining] = useState(1); // Start with 1 spin, can increase with RETRY
  const [loading, setLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [result, setResult] = useState<string>('');
  const [resultType, setResultType] = useState<'win' | 'retry' | 'lost' | null>(null);
  const [couponCode, setCouponCode] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [unluckyProbability, setUnluckyProbability] = useState(20);
  const [retryProbability, setRetryProbability] = useState(10);
  const wheelRef = useRef<HTMLDivElement>(null);
  const currentRotationRef = useRef(0);

  // Segment types
  type SegmentType = 'prize' | 'unlucky' | 'retry';
  interface WheelSegment {
    type: SegmentType;
    prize?: Prize;
    label: string;
  }

  useEffect(() => {
    setIsClient(true);
    // Apply language from URL if provided
    if (langFromUrl && i18n.language !== langFromUrl) {
      i18n.changeLanguage(langFromUrl);
    }
  }, [langFromUrl, i18n]);

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

      if (merchantData) {
        setMerchant(merchantData);
        // Load special segment probabilities
        if (merchantData.unlucky_probability !== undefined) {
          setUnluckyProbability(merchantData.unlucky_probability);
        }
        if (merchantData.retry_probability !== undefined) {
          setRetryProbability(merchantData.retry_probability);
        }
      }

      const { data: prizesData } = await supabase
        .from('prizes')
        .select('*')
        .eq('merchant_id', shopId)
        .order('id', { ascending: true });

      if (prizesData) {
        setPrizes(prizesData);
      }
      setLoading(false);
    };

    checkSpinEligibility();
  }, [shopId]);

  // Generate wheel segments with 6-8 segments total
  // Rules:
  // 1. Always include #UNLUCKY# and #REESSAYER# segments
  // 2. If merchant has <3 prizes, duplicate them to fill
  // 3. Total segments should be between 6-8
  const generateWheelSegments = (): WheelSegment[] => {
    const segments: WheelSegment[] = [];
    
    // Always add UNLUCKY and RETRY segments
    segments.push({ type: 'unlucky', label: '#UNLUCKY#' });
    segments.push({ type: 'retry', label: '#REESSAYER#' });
    
    if (prizes.length === 0) {
      // No prizes - fill with more unlucky/retry
      segments.push({ type: 'unlucky', label: '#UNLUCKY#' });
      segments.push({ type: 'retry', label: '#REESSAYER#' });
      segments.push({ type: 'unlucky', label: '#UNLUCKY#' });
      segments.push({ type: 'retry', label: '#REESSAYER#' });
      return segments;
    }
    
    // Add prize segments
    let prizeSegments: WheelSegment[] = prizes.map(prize => ({
      type: 'prize' as const,
      prize,
      label: prize.name
    }));
    
    // If less than 3 prizes, duplicate them
    if (prizes.length < 3) {
      const duplicated = [...prizeSegments];
      while (duplicated.length < 4) {
        duplicated.push(...prizeSegments.slice(0, Math.min(prizeSegments.length, 4 - duplicated.length)));
      }
      prizeSegments = duplicated;
    }
    
    // Add prize segments
    segments.push(...prizeSegments);
    
    // Ensure we have between 6-8 segments
    // If we have more than 8, trim prizes (keep special segments)
    if (segments.length > 8) {
      const specialSegments = segments.filter(s => s.type !== 'prize');
      const prizeSegs = segments.filter(s => s.type === 'prize').slice(0, 8 - specialSegments.length);
      return [...specialSegments, ...prizeSegs];
    }
    
    // If we have less than 6, add more unlucky segments
    while (segments.length < 6) {
      segments.push({ type: 'unlucky', label: '#UNLUCKY#' });
    }
    
    // Shuffle segments to distribute them evenly (but keep some structure)
    // Interleave: prize, special, prize, special...
    const prizeSegs = segments.filter(s => s.type === 'prize');
    const specialSegs = segments.filter(s => s.type !== 'prize');
    const interleaved: WheelSegment[] = [];
    
    const maxLen = Math.max(prizeSegs.length, specialSegs.length);
    for (let i = 0; i < maxLen; i++) {
      if (i < prizeSegs.length) interleaved.push(prizeSegs[i]);
      if (i < specialSegs.length) interleaved.push(specialSegs[i]);
    }
    
    return interleaved;
  };

  const allSegments = generateWheelSegments();
  const totalSegments = allSegments.length;
  const segmentAngle = totalSegments > 0 ? 360 / totalSegments : 0;
  
  const selectWinningSegment = () => {
    // Calculate total probability
    const totalPrizeProbability = prizes.reduce((sum, prize) => sum + (prize.probability || 0), 0);
    const totalProbability = totalPrizeProbability + unluckyProbability + retryProbability;
    
    // Random number between 0 and total probability
    const random = Math.random() * totalProbability;
    
    // Check if landed on a prize
    let currentProb = 0;
    for (let i = 0; i < allSegments.length; i++) {
      const segment = allSegments[i];
      
      if (segment.type === 'prize' && segment.prize) {
        currentProb += (segment.prize.probability || 0);
        if (random <= currentProb) return i;
      } else if (segment.type === 'unlucky') {
        // Distribute unlucky probability among unlucky segments
        const unluckyCount = allSegments.filter(s => s.type === 'unlucky').length;
        currentProb += unluckyProbability / unluckyCount;
        if (random <= currentProb) return i;
      } else if (segment.type === 'retry') {
        // Distribute retry probability among retry segments
        const retryCount = allSegments.filter(s => s.type === 'retry').length;
        currentProb += retryProbability / retryCount;
        if (random <= currentProb) return i;
      }
    }
    
    // Fallback to first segment
    return 0;
  };

  const spinWheel = async () => {
    if (isSpinning || spinsRemaining <= 0) return;
    
    setIsSpinning(true);
    setSpinsRemaining(prev => prev - 1); // Consume one spin
    setResult('');
    setResultType(null);
    setCouponCode('');

    const winningSegmentIndex = selectWinningSegment();
    const winningSegment = allSegments[winningSegmentIndex];
    
    // Determine result type based on segment
    let type: 'win' | 'retry' | 'lost' = 'lost';
    let selectedPrize: Prize | undefined = undefined;
    
    if (winningSegment.type === 'prize' && winningSegment.prize) {
      type = 'win';
      selectedPrize = winningSegment.prize;
    } else if (winningSegment.type === 'retry') {
      type = 'retry';
    } else {
      type = 'lost';
    }

    // Calculate segment center for alignment
    // Segments are rendered with -90 offset (starting from top)
    const segmentVisualCenter = (winningSegmentIndex * segmentAngle) + (segmentAngle / 2) - 90;
    
    // Add random offset within the segment
    const randomOffset = (Math.random() - 0.5) * segmentAngle * 0.6;

    // Target rotation
    // Align segment center to -90 (Top)
    // We use a clean geometric calculation: Target = Top(-90) - Center - Random
    // Note: extraSpins must be a multiple of 360 to preserve this alignment.
    const currentRot = currentRotationRef.current;
    const targetAngle = -90 - segmentVisualCenter - randomOffset;
    
    // Normalize to find the delta needed
    const currentNormalized = currentRot % 360;
    const distToTarget = ((targetAngle - currentNormalized) % 360 + 360) % 360;
    
    // Add 5-7 full spins for variety
    const minSpins = 5;
    const extraSpins = 360 * minSpins + Math.floor(Math.random() * 3) * 360; // 5 to 7 full spins
    const totalRotation = currentRot + extraSpins + distToTarget;

    if (wheelRef.current) {
      wheelRef.current.style.transform = `rotate(${totalRotation}deg)`;
      currentRotationRef.current = totalRotation;
    }

    setTimeout(async () => {
      await handleSpinComplete(selectedPrize, type);
      setIsSpinning(false);
    }, 5000);
  };

  const handleSpinComplete = async (prize: Prize | undefined, type: 'win' | 'retry' | 'lost') => {
    setResultType(type);
    
    if (type === 'win' && prize) {
      setIsSaving(true);
      setSaveError(false);
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

      try {
        const userToken = localStorage.getItem('user_token') || crypto.randomUUID();
        localStorage.setItem('user_token', userToken);

        const { data: spinData, error: spinError } = await supabase
          .from('spins')
          .insert({
            merchant_id: shopId,
            prize_id: prize.id,
            user_token: userToken,
          })
          .select()
          .single();

        if (spinError) throw spinError;

        if (spinData) {
          const generatedCode = `${merchant.business_name?.substring(0, 3).toUpperCase()}-${crypto.randomUUID().substring(0, 8).toUpperCase()}`;
          const expiresAt = new Date();
          expiresAt.setHours(expiresAt.getHours() + 24);

          const { error: couponError } = await supabase.from('coupons').insert({
            spin_id: spinData.id,
            merchant_id: shopId,
            code: generatedCode,
            prize_name: prize.name,
            expires_at: expiresAt.toISOString(),
          });

          if (couponError) throw couponError;

          setCouponCode(generatedCode);

          // Send spin notification to merchant
          fetch('/api/notifications', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              merchantId: shopId,
              type: 'spin',
              title: '🎰 Nouveau gain !',
              message: `Un client a gagné "${prize.name}" !`,
              data: { prizeName: prize.name, couponCode: generatedCode },
            }),
          }).catch(() => {}); // Fire and forget

          // Send WhatsApp congratulation message if phone number is available (WhatsApp workflow)
          if (phoneFromUrl && merchant?.workflow_mode === 'whatsapp') {
            fetch('/api/whatsapp/congratulate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                merchantId: shopId,
                phoneNumber: phoneFromUrl,
                prizeName: prize.name,
                couponCode: generatedCode,
                language: currentLang,
              }),
            }).catch(() => {}); // Fire and forget
          }
        }
      } catch {
        setSaveError(true);
      } finally {
        setIsSaving(false);
      }
    } else if (type === 'retry') {
      setResult(t('wheel.retry'));
      // Grant an extra spin for RETRY
      setSpinsRemaining(prev => prev + 1);
    } else {
      setResult(t('wheel.unlucky'));
      // UNLUCKY is eliminatory - mark as spun to prevent further spins
      setHasSpun(true);
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
        @import url('https://fonts.googleapis.com/css2?family=Russo+One&display=swap');

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
          font-family: 'Arial Black', 'Helvetica Neue', Arial, sans-serif;
          font-size: clamp(0.55rem, 2.2vw, 0.9rem);
          font-weight: 900;
          text-shadow: 1px 1px 3px rgba(0, 0, 0, 1), 0 0 8px rgba(0, 0, 0, 0.9);
          white-space: nowrap;
          text-transform: uppercase;
          letter-spacing: 1px;
          -webkit-text-stroke: 0.3px rgba(0, 0, 0, 0.5);
        }

        .segment-text.yellow-text {
          color: #1a1a1a;
          text-shadow: 1px 1px 2px rgba(255, 255, 255, 0.5);
          -webkit-text-stroke: 0.5px rgba(0, 0, 0, 0.3);
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
            <div className="absolute top-[-15%] left-1/2 -translate-x-1/2 z-[100] flex flex-col items-center" style={{ filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.5))' }}>
              {merchant?.logo_url ? (
                <>
                  <div
                    className="w-24 h-24 rounded-full p-2 shadow-xl flex items-center justify-center border-4 border-[#ffd700] mb-[-15px] relative z-10"
                    style={{ backgroundColor: merchant.logo_background_color || '#FFFFFF' }}
                  >
                    <img
                      src={merchant.logo_url}
                      alt="Merchant Logo"
                      className="w-full h-full object-contain rounded-full"
                    />
                  </div>
                  <div className="w-0 h-0 border-l-[25px] border-l-transparent border-r-[25px] border-r-transparent border-t-[40px] border-t-[#ffd700] relative z-0"></div>
                </>
              ) : (
                <>
                  <div className="w-[18px] h-[18px] bg-[#1a1a1a] rounded-full mb-[-8px] relative z-10" style={{ boxShadow: '0 2px 5px rgba(0, 0, 0, 0.5), inset 0 1px 2px rgba(255, 255, 255, 0.2)' }}></div>
                  <div className="w-[36px] h-[22px] rounded-t-[18px] mb-[-1px]" style={{ background: 'linear-gradient(180deg, #ffb84d 0%, #ffa500 100%)', boxShadow: 'inset 0 2px 4px rgba(255, 255, 255, 0.3)' }}></div>
                  <div className="w-0 h-0 border-l-[22px] border-l-transparent border-r-[22px] border-r-transparent border-t-[45px] border-t-[#ffa500]" style={{ filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))' }}></div>
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
                  // New color logic: alternate yellow/black for ALL segments
                  // Start with yellow (index 0 = yellow, index 1 = black, etc.)
                  // UNLUCKY segments are always black
                  let segmentColor = index % 2 === 0 ? 'yellow' : 'black';

                  // Override: UNLUCKY is always black
                  if (segment.type === 'unlucky') {
                    segmentColor = 'black';
                  }
                  
                  // Use segment label directly
                  const segmentText = segment.label;
                  
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
                  
                  // Text position: start from near center, extend toward edge
                  // Text should be readable from center outward (vertical orientation)
                  const textDistance = 22; // % from center where text starts (moved further from SPIN button)
                  const textX = cx + textDistance * Math.cos(midRad);
                  const textY = cy + textDistance * Math.sin(midRad);

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
                          className={`segment-text ${segmentColor === 'yellow' ? 'yellow-text' : ''}`}
                          style={{
                            position: 'absolute',
                            top: `${textY}%`,
                            left: `${textX}%`,
                            transform: `rotate(${midAngle}deg)`,
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
              <div className="inline-block bg-black/90 px-8 py-6 rounded-2xl backdrop-blur-lg border-2 border-[#ffd700]" style={{ boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5), 0 0 20px rgba(255, 215, 0, 0.3)' }}>
                {resultType === 'win' ? (
                  <>
                    <div className="text-xl text-[#ffd700] mb-3">🎊 FÉLICITATIONS ! 🎊</div>
                    <div className="text-2xl text-white font-bold mb-4">{result}</div>
                    <button
                      disabled={isSaving || !couponCode}
                      onClick={() => router.push(`/coupon/${shopId}?code=${couponCode}&lang=${currentLang}`)}
                      className={`w-full py-3 px-6 font-bold rounded-xl transition-colors text-lg ${
                        isSaving || !couponCode 
                          ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
                          : 'bg-[#ffd700] text-black hover:bg-[#ffb700]'
                      }`}
                      style={!(isSaving || !couponCode) ? { boxShadow: '0 4px 15px rgba(255, 215, 0, 0.4)' } : {}}
                    >
                      {isSaving ? 'Génération du coupon...' : 'Récupérer mon prix →'}
                    </button>
                    {saveError && (
                      <p className="text-red-500 mt-2 text-sm font-bold">Erreur de connexion. Veuillez contacter le support.</p>
                    )}
                  </>
                ) : resultType === 'retry' ? (
                  <>
                    <div className="text-xl text-[#ffd700] mb-3">😬 PAS DE CHANCE... 😬</div>
                    <div className="text-2xl text-white font-bold mb-4">Réessayez !</div>
                    <button
                      onClick={() => setResult('')}
                      className="w-full py-3 px-6 bg-[#ffd700] text-black font-bold rounded-xl hover:bg-[#ffb700] transition-colors text-lg"
                      style={{ boxShadow: '0 4px 15px rgba(255, 215, 0, 0.4)' }}
                    >
                      Tourner encore ↻
                    </button>
                  </>
                ) : (
                  <>
                    <div className="text-xl text-red-500 mb-3">😢 PERDU... 😢</div>
                    <div className="text-xl text-white font-bold mb-4">Meilleure chance la prochaine fois !</div>
                    <button
                      onClick={() => router.push('/')}
                      className="w-full py-3 px-6 bg-gray-600 text-white font-bold rounded-xl hover:bg-gray-500 transition-colors text-lg"
                    >
                      Retour
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

    </>
  );
}
