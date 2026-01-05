'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Play, Pause, Volume2, VolumeX, Maximize } from 'lucide-react';

interface DemoVideoPlayerProps {
  className?: string;
}

export function DemoVideoPlayer({ className = '' }: DemoVideoPlayerProps) {
  const { i18n } = useTranslation();
  const [mounted, setMounted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [videoRef, setVideoRef] = useState<HTMLVideoElement | null>(null);
  const [currentLanguage, setCurrentLanguage] = useState<'fr' | 'en' | 'th'>('fr');

  useEffect(() => {
    setMounted(true);
  }, []);

  // Update video source when language changes
  useEffect(() => {
    if (!mounted) return;
    const lang = i18n.language?.toLowerCase() || 'fr';
    if (lang.startsWith('fr')) {
      setCurrentLanguage('fr');
    } else if (lang.startsWith('th')) {
      setCurrentLanguage('en'); // Use EN for Thai since no TH video
    } else {
      setCurrentLanguage('en');
    }
  }, [i18n.language, mounted]);

  if (!mounted) {
    return (
      <div className={`relative group ${className} bg-slate-100 rounded-2xl animate-pulse aspect-video`} />
    );
  }

  // Get video URL from Supabase Storage
  const getVideoUrl = (language: 'fr' | 'en' | 'th') => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    return `${supabaseUrl}/storage/v1/object/public/demo-videos/demo-${language}.mp4`;
  };

  const togglePlay = () => {
    if (!videoRef) return;
    
    if (isPlaying) {
      videoRef.pause();
    } else {
      videoRef.play();
    }
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    if (!videoRef) return;
    videoRef.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const toggleFullscreen = () => {
    if (!videoRef) return;
    if (videoRef.requestFullscreen) {
      videoRef.requestFullscreen();
    }
  };

  return (
    <div className={`relative group ${className}`}>
      {/* Video Element */}
      <video
        ref={setVideoRef}
        className="w-full h-full rounded-2xl shadow-2xl object-cover"
        src={getVideoUrl(currentLanguage)}
        poster="/BANNER-SPIN-HERO-.png"
        playsInline
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
      >
        Your browser does not support the video tag.
      </video>

      {/* Custom Controls Overlay - Always visible */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent rounded-2xl flex items-end pointer-events-none">
        <div className="w-full p-4 md:p-6 flex items-center justify-between pointer-events-auto">
          {/* Play/Pause Button */}
          <button
            onClick={togglePlay}
            className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/90 hover:bg-white flex items-center justify-center transition-all transform hover:scale-110 shadow-lg"
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 md:w-6 md:h-6 text-[#2D6A4F]" />
            ) : (
              <Play className="w-5 h-5 md:w-6 md:h-6 text-[#2D6A4F] ml-0.5" />
            )}
          </button>

          {/* Right Controls */}
          <div className="flex items-center gap-2 md:gap-3">
            {/* Mute/Unmute */}
            <button
              onClick={toggleMute}
              className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-white/30 hover:bg-white/40 backdrop-blur-sm flex items-center justify-center transition-all"
              aria-label={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? (
                <VolumeX className="w-4 h-4 md:w-5 md:h-5 text-white" />
              ) : (
                <Volume2 className="w-4 h-4 md:w-5 md:h-5 text-white" />
              )}
            </button>

            {/* Fullscreen */}
            <button
              onClick={toggleFullscreen}
              className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-white/30 hover:bg-white/40 backdrop-blur-sm flex items-center justify-center transition-all"
              aria-label="Fullscreen"
            >
              <Maximize className="w-4 h-4 md:w-5 md:h-5 text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* Large Play Button Overlay (when paused and not started) */}
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <button
            onClick={togglePlay}
            className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-white/90 hover:bg-white flex items-center justify-center transition-all transform hover:scale-110 shadow-2xl pointer-events-auto"
            aria-label="Play video"
          >
            <Play className="w-8 h-8 md:w-10 md:h-10 text-[#2D6A4F] ml-1 md:ml-2" />
          </button>
        </div>
      )}

      {/* Language Indicator */}
      <div className="absolute top-4 right-4 px-3 py-1 bg-black/60 backdrop-blur-sm rounded-full text-white text-xs font-semibold uppercase">
        {currentLanguage === 'fr' ? '🇫🇷 FR' : '🇬🇧 EN'}
      </div>
    </div>
  );
}
