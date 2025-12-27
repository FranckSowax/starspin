'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/atoms/Button';
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
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-gray-900">QR Code Generator</h1>
            <Button onClick={() => router.push('/dashboard')} variant="outline" size="sm">
              Back to Dashboard
            </Button>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Your QR Code
          </h2>

          <div className="flex justify-center mb-8">
            <div className="bg-white p-8 rounded-lg border-4 border-[#FF6F61]">
              {qrCodeUrl && (
                <img src={qrCodeUrl} alt="QR Code" className="w-80 h-80" />
              )}
              <canvas ref={canvasRef} className="hidden" />
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h3 className="font-semibold text-gray-900 mb-2">Your Rating Link:</h3>
            <code className="text-sm text-gray-700 break-all">
              {process.env.NEXT_PUBLIC_APP_URL}/rate/{user.id}
            </code>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button onClick={() => downloadQR('png')} className="w-full">
              Download PNG
            </Button>
            <Button onClick={() => downloadQR('svg')} variant="secondary" className="w-full">
              Download SVG
            </Button>
            <Button onClick={copyLink} variant="outline" className="w-full">
              Copy Link
            </Button>
          </div>

          <div className="mt-8 p-6 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">💡 Tips:</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-1">
              <li>Print this QR code and display it at your checkout counter</li>
              <li>Add it to table tents or receipts</li>
              <li>Share the link on social media</li>
              <li>Include it in email signatures</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
