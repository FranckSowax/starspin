import Link from 'next/link';
import { Button } from '@/components/atoms/Button';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FF6F61] via-[#FFC107] to-[#4CAF50]">
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-4xl w-full">
          <div className="text-center mb-12">
            <h1 className="text-6xl font-bold text-white mb-4">
              StarSpin
            </h1>
            <p className="text-2xl text-white/90 mb-2">
              Turn Customer Feedback into Fun Rewards
            </p>
            <p className="text-lg text-white/80">
              Gamify your customer reviews and boost your online reputation
            </p>
          </div>

          <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12">
            <div className="grid md:grid-cols-2 gap-8 mb-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">For Customers</h2>
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-start">
                    <span className="text-2xl mr-3">📱</span>
                    <span>Scan QR code at your favorite shop</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-2xl mr-3">⭐</span>
                    <span>Rate your experience with stars</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-2xl mr-3">🎡</span>
                    <span>Spin the wheel to win rewards</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-2xl mr-3">🎁</span>
                    <span>Get instant digital coupons</span>
                  </li>
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">For Merchants</h2>
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-start">
                    <span className="text-2xl mr-3">📊</span>
                    <span>Track customer satisfaction in real-time</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-2xl mr-3">🔒</span>
                    <span>Keep negative feedback private</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-2xl mr-3">🚀</span>
                    <span>Boost positive online reviews</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-2xl mr-3">🎯</span>
                    <span>Customize prizes and probabilities</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/signup">
                <Button size="lg" className="w-full sm:w-auto">
                  Get Started - Free Trial
                </Button>
              </Link>
              <Link href="/auth/login">
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  Merchant Login
                </Button>
              </Link>
            </div>

            <div className="mt-8 pt-8 border-t border-gray-200">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-3xl font-bold text-[#FF6F61]">€15</p>
                  <p className="text-sm text-gray-600">Starter Plan</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-[#FF6F61]">€59</p>
                  <p className="text-sm text-gray-600">Pro Plan</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-[#FF6F61]">€99</p>
                  <p className="text-sm text-gray-600">Multi-Shop</p>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center mt-8 text-white/80 text-sm">
            <p>Trusted by cafés, restaurants, boutiques, and service shops worldwide</p>
          </div>
        </div>
      </div>
    </div>
  );
}
