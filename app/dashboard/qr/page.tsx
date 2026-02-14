'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Download, Copy, Share2, QrCode, Printer, ArrowRight, CheckCircle2 } from 'lucide-react';
import QRCode from 'qrcode';

export default function QRCodePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [merchant, setMerchant] = useState<any>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/auth/login');
        return;
      }

      setUser(user);

      const { data: merchantData } = await supabase
        .from('merchants')
        .select('*')
        .eq('id', user.id)
        .single();

      setMerchant(merchantData);

      // Check if QR code already exists in storage
      if (merchantData?.qr_code_url) {
        setQrCodeUrl(merchantData.qr_code_url);
      } else {
        // Generate new QR code
        const url = `${process.env.NEXT_PUBLIC_APP_URL}/rate/${user.id}`;
        const qr = await QRCode.toDataURL(url, {
          width: 400,
          margin: 2,
          color: {
            dark: '#2D6A4F',
            light: '#FFFFFF',
          },
        });

        setQrCodeUrl(qr);
      }
    };

    checkAuth();
  }, [router]);

  const downloadQR = (format: 'png' | 'svg') => {
    if (!canvasRef.current || !qrCodeUrl) return;

    const link = document.createElement('a');
    link.download = `starspin-qr-${merchant?.business_name || 'code'}.${format}`;
    link.href = qrCodeUrl;
    link.click();
  };

  const copyLink = () => {
    if (!user) return;
    const url = `${process.env.NEXT_PUBLIC_APP_URL}/rate/${user.id}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const reviewUrl = user ? `${process.env.NEXT_PUBLIC_APP_URL}/rate/${user.id}` : '';

  if (!user || !merchant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout merchant={merchant}>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">QR Code</h1>
          <p className="text-sm text-gray-500 mt-1">Partagez votre QR code pour collecter les avis clients</p>
        </div>

        {/* QR Code Card */}
        <div className="group relative border border-gray-200 rounded-xl overflow-hidden transition-all duration-300 hover:border-gray-300 hover:shadow-md bg-white">
          <span className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-teal-500 to-emerald-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />

          <div className="p-8 flex flex-col items-center">
            {merchant?.qr_code_url && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-teal-50 text-teal-700 rounded-full text-xs font-medium mb-4">
                <CheckCircle2 className="w-3.5 h-3.5" />
                QR Code actif
              </span>
            )}

            <div className="bg-white p-4 rounded-xl border-2 border-gray-100 shadow-sm">
              {qrCodeUrl && (
                <img src={qrCodeUrl} alt="QR Code" className="w-56 h-56" />
              )}
              <canvas ref={canvasRef} className="hidden" />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 mt-6">
              <Button
                onClick={() => downloadQR('png')}
                size="sm"
                className="gap-1.5 bg-teal-600 hover:bg-teal-700 text-sm"
              >
                <Download className="w-3.5 h-3.5" />
                PNG
              </Button>
              <Button
                onClick={() => downloadQR('svg')}
                variant="outline"
                size="sm"
                className="gap-1.5 text-sm"
              >
                <Download className="w-3.5 h-3.5" />
                SVG
              </Button>
              <Button
                onClick={() => window.print()}
                variant="outline"
                size="sm"
                className="gap-1.5 text-sm"
              >
                <Printer className="w-3.5 h-3.5" />
                Print
              </Button>
              <Button
                onClick={copyLink}
                variant="outline"
                size="sm"
                className="gap-1.5 text-sm"
              >
                <Share2 className="w-3.5 h-3.5" />
                Share
              </Button>
            </div>
          </div>
        </div>

        {/* Copy Link Card */}
        <div className="group relative border border-gray-200 rounded-xl overflow-hidden transition-all duration-300 hover:border-gray-300 hover:shadow-md bg-white">
          <span className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-teal-500 to-emerald-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
          <div className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
                <Copy className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Lien de review</p>
                <p className="text-xs text-gray-500">Copiez et partagez directement</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs font-mono text-gray-600 truncate">
                {reviewUrl}
              </div>
              <Button
                onClick={copyLink}
                size="sm"
                variant={copied ? 'default' : 'outline'}
                className={`shrink-0 gap-1.5 text-sm ${copied ? 'bg-teal-600 hover:bg-teal-700 text-white' : ''}`}
              >
                {copied ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Copie !
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Copier
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* How to Use - Stepper */}
        <div className="group relative border border-gray-200 rounded-xl overflow-hidden transition-all duration-300 hover:border-gray-300 hover:shadow-md bg-white">
          <span className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-teal-500 to-emerald-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
          <div className="p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
                <QrCode className="w-5 h-5" />
              </div>
              <p className="text-sm font-semibold text-gray-900">Comment utiliser votre QR Code</p>
            </div>

            <div className="space-y-4">
              {[
                { step: 1, title: 'Imprimez & Affichez', desc: 'Placez le QR code en caisse ou sur les tables' },
                { step: 2, title: 'Les clients scannent', desc: 'Ils scannent et notent leur experience' },
                { step: 3, title: 'Routage intelligent', desc: 'Les avis positifs vont directement sur Google' },
                { step: 4, title: 'Feedback prive', desc: 'Les avis negatifs restent prives pour ameliorer votre service' },
              ].map((item, idx) => (
                <div key={item.step} className="flex items-start gap-3">
                  <div className="relative flex flex-col items-center">
                    <div className="w-7 h-7 rounded-full bg-teal-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                      {item.step}
                    </div>
                    {idx < 3 && (
                      <div className="w-px h-4 bg-teal-200 mt-1" />
                    )}
                  </div>
                  <div className="pt-0.5">
                    <p className="text-sm font-medium text-gray-900">{item.title}</p>
                    <p className="text-xs text-gray-500">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
