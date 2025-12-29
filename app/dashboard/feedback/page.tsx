'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Pagination, PaginationInfo } from '@/components/ui/pagination';
import { usePagination } from '@/hooks/usePagination';
import { Feedback } from '@/lib/types/database';
import { ThumbsUp, ThumbsDown, MessageSquare, Calendar } from 'lucide-react';

const PAGE_SIZE = 10;

export default function FeedbackPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [merchant, setMerchant] = useState<any>(null);
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

      const { data: merchantData } = await supabase
        .from('merchants')
        .select('*')
        .eq('id', user.id)
        .single();

      setMerchant(merchantData);
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

  // Pagination
  const {
    currentPage,
    totalPages,
    paginatedData,
    setPage,
    totalItems,
    pageSize,
  } = usePagination(filteredFeedback, { pageSize: PAGE_SIZE });

  // Reset to page 1 when filter changes
  useEffect(() => {
    setPage(1);
  }, [filter, setPage]);

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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Customer Feedback</h1>
          <p className="text-gray-600">View and manage all customer reviews and feedback</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={() => setFilter('all')}
            variant={filter === 'all' ? 'default' : 'outline'}
            className="gap-2"
          >
            <MessageSquare className="w-4 h-4" />
            All ({feedback.length})
          </Button>
          <Button
            onClick={() => setFilter('positive')}
            variant={filter === 'positive' ? 'default' : 'outline'}
            className={`gap-2 ${filter === 'positive' ? 'bg-green-600 hover:bg-green-700' : ''}`}
          >
            <ThumbsUp className="w-4 h-4" />
            Positive ({feedback.filter(f => f.is_positive).length})
          </Button>
          <Button
            onClick={() => setFilter('negative')}
            variant={filter === 'negative' ? 'default' : 'outline'}
            className={`gap-2 ${filter === 'negative' ? 'bg-red-600 hover:bg-red-700' : ''}`}
          >
            <ThumbsDown className="w-4 h-4" />
            Negative ({feedback.filter(f => !f.is_positive).length})
          </Button>
        </div>

        {/* Pagination Info */}
        {filteredFeedback.length > 0 && (
          <PaginationInfo
            currentPage={currentPage}
            pageSize={pageSize}
            totalItems={totalItems}
          />
        )}

        <div className="grid gap-4">
          {paginatedData.map((f) => (
            <Card
              key={f.id}
              className={`p-6 hover:shadow-lg transition-shadow ${
                f.is_positive ? 'border-l-4 border-green-500' : 'border-l-4 border-red-500'
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    f.is_positive ? 'bg-green-50' : 'bg-red-50'
                  }`}>
                    {f.is_positive ? (
                      <ThumbsUp className="w-5 h-5 text-green-600" />
                    ) : (
                      <ThumbsDown className="w-5 h-5 text-red-600" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xl">{'⭐'.repeat(f.rating)}</span>
                      <span className="text-sm text-gray-600 font-medium">({f.rating}/5)</span>
                    </div>
                    <Badge className={f.is_positive ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'}>
                      {f.is_positive ? 'Positive Review' : 'Needs Attention'}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Calendar className="w-4 h-4" />
                  {new Date(f.created_at).toLocaleDateString()}
                </div>
              </div>

              {f.comment && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <p className="text-gray-700 leading-relaxed">{f.comment}</p>
                </div>
              )}
            </Card>
          ))}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setPage}
            className="mt-6"
          />
        )}

        {filteredFeedback.length === 0 && (
          <Card className="p-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No feedback yet</h3>
              <p className="text-gray-600 mb-6">
                {filter === 'all'
                  ? 'Start collecting customer feedback by sharing your QR code!'
                  : `No ${filter} feedback found.`
                }
              </p>
              <Button onClick={() => router.push('/dashboard/qr')} className="gap-2">
                View QR Code
              </Button>
            </div>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
