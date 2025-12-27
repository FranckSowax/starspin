'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/atoms/Button';
import { Feedback } from '@/lib/types/database';

export default function FeedbackPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [filter, setFilter] = useState<'all' | 'positive' | 'negative'>('all');

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/auth/login');
        return;
      }

      setUser(user);
      fetchFeedback(user.id);
    };

    checkAuth();
  }, [router]);

  const fetchFeedback = async (merchantId: string) => {
    const { data } = await supabase
      .from('feedback')
      .select('*')
      .eq('merchant_id', merchantId)
      .order('created_at', { ascending: false });

    setFeedback(data || []);
  };

  const filteredFeedback = feedback.filter((f) => {
    if (filter === 'positive') return f.is_positive;
    if (filter === 'negative') return !f.is_positive;
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-gray-900">Customer Feedback</h1>
            <Button onClick={() => router.push('/dashboard')} variant="outline" size="sm">
              Back to Dashboard
            </Button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex gap-4">
          <Button
            onClick={() => setFilter('all')}
            variant={filter === 'all' ? 'primary' : 'outline'}
          >
            All ({feedback.length})
          </Button>
          <Button
            onClick={() => setFilter('positive')}
            variant={filter === 'positive' ? 'primary' : 'outline'}
          >
            Positive ({feedback.filter(f => f.is_positive).length})
          </Button>
          <Button
            onClick={() => setFilter('negative')}
            variant={filter === 'negative' ? 'primary' : 'outline'}
          >
            Negative ({feedback.filter(f => !f.is_positive).length})
          </Button>
        </div>

        <div className="space-y-4">
          {filteredFeedback.map((item) => (
            <div
              key={item.id}
              className={`bg-white rounded-lg shadow p-6 ${
                item.is_positive ? 'border-l-4 border-green-500' : 'border-l-4 border-red-500'
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">
                    {'⭐'.repeat(item.rating)}
                  </span>
                  <span className="text-gray-600">({item.rating}/5)</span>
                </div>
                <span className="text-sm text-gray-500">
                  {new Date(item.created_at).toLocaleDateString()}
                </span>
              </div>

              {item.comment && (
                <p className="text-gray-700">{item.comment}</p>
              )}
            </div>
          ))}
        </div>

        {filteredFeedback.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600">No feedback yet.</p>
          </div>
        )}
      </main>
    </div>
  );
}
