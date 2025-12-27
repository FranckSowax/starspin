'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Download, Copy, Share2 } from 'lucide-react';
import QRCode from 'qrcode';

export default function QRCodePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [merchant, setMerchant] = useState<any>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
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

      const url = `${process.env.NEXT_PUBLIC_APP_URL}/rate/${user.id}`;
      const qr = await QRCode.toDataURL(url, {
        width: 400,
        margin: 2,
        color: {
          dark: '#1A202C',
          light: '#FFFFFF',
        },
      });

      setQrCodeUrl(qr);
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
    alert('Link copied to clipboard!');
  };

  if (!user || !merchant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#2D6A4F] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout merchant={merchant}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">QR Code Generator</h1>
          <p className="text-gray-600">Download and share your QR code to collect customer reviews</p>
        </div>

        <Card className="p-8">
          <div className="flex justify-center mb-8">
            <div className="bg-white p-8 rounded-lg border-4 border-[#2D6A4F] shadow-lg">
              {qrCodeUrl && (
                <img src={qrCodeUrl} alt="QR Code" className="w-80 h-80" />
              )}
              <canvas ref={canvasRef} className="hidden" />
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-gray-50 rounded-lg p-6 border-2 border-gray-200">
              <p className="text-sm font-medium text-gray-700 mb-3">Your Review Link:</p>
              <code className="text-sm break-all text-gray-900 font-mono bg-white px-4 py-3 rounded border border-gray-300 block">
                {`${process.env.NEXT_PUBLIC_APP_URL}/rate/${user.id}`}
              </code>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button onClick={copyLink} variant="outline" className="w-full gap-2">
                <Copy className="w-4 h-4" />
                Copy Link
              </Button>
              <Button onClick={() => downloadQR('png')} className="w-full gap-2 bg-[#2D6A4F] hover:bg-[#1B4332]">
                <Download className="w-4 h-4" />
                Download PNG
              </Button>
              <Button onClick={() => downloadQR('svg')} variant="outline" className="w-full gap-2">
                <Share2 className="w-4 h-4" />
                Share
              </Button>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <h3 className="font-bold text-gray-900 mb-4 text-lg">💡 How to use your QR Code</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">1</div>
              <div>
                <p className="font-semibold text-gray-900">Print & Display</p>
                <p className="text-sm text-gray-700">Place the QR code at your checkout or tables</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">2</div>
              <div>
                <p className="font-semibold text-gray-900">Customers Scan</p>
                <p className="text-sm text-gray-700">They scan and rate their experience</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">3</div>
              <div>
                <p className="font-semibold text-gray-900">Smart Routing</p>
                <p className="text-sm text-gray-700">Positive reviews go to Google automatically</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">4</div>
              <div>
                <p className="font-semibold text-gray-900">Private Feedback</p>
                <p className="text-sm text-gray-700">Negative feedback stays private for improvement</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
