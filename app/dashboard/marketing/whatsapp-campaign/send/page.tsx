'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase/client';
import { useTranslation } from 'react-i18next';
import '@/lib/i18n/config';
import {
  Users,
  Search,
  Phone,
  Send,
  CheckCircle,
  XCircle,
  Loader2,
  ArrowLeft,
  MessageCircle,
  Calendar,
  Star,
  Check,
  FlaskConical,
  Plus,
  X,
} from 'lucide-react';
import { PhoneInputWithCountry } from '@/components/ui/PhoneInputWithCountry';

interface WhatsAppCustomer {
  user_token: string;
  phone: string;
  total_reviews: number;
  avg_rating: number;
  last_review: string;
  is_positive: boolean;
}

interface SendResult {
  phone: string;
  success: boolean;
  error?: string;
}

export default function SendCampaignPage() {
  const { t } = useTranslation();
  const router = useRouter();

  const [merchant, setMerchant] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<WhatsAppCustomer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<WhatsAppCustomer[]>([]);
  const [selectedCustomers, setSelectedCustomers] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  // Campaign data from URL params or localStorage
  const [campaignData, setCampaignData] = useState<any>(null);

  // Sending state
  const [isSending, setIsSending] = useState(false);
  const [sendProgress, setSendProgress] = useState(0);
  const [sendResults, setSendResults] = useState<SendResult[]>([]);
  const [showResults, setShowResults] = useState(false);

  // Test send state
  const [showTestModal, setShowTestModal] = useState(false);
  const [testNumbers, setTestNumbers] = useState<string[]>(['']);
  const [isTestSending, setIsTestSending] = useState(false);
  const [testResults, setTestResults] = useState<SendResult[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }

      // Fetch merchant
      const { data: merchantData } = await supabase
        .from('merchants')
        .select('*')
        .eq('id', user.id)
        .single();
      setMerchant(merchantData);

      // Fetch WhatsApp customers
      const { data: feedbackData } = await supabase
        .from('feedback')
        .select('*')
        .eq('merchant_id', user.id)
        .not('customer_phone', 'is', null)
        .order('created_at', { ascending: false });

      // Group by customer phone
      const customersMap = new Map<string, WhatsAppCustomer>();
      feedbackData?.forEach((feedback) => {
        if (!feedback.customer_phone) return;

        const existing = customersMap.get(feedback.customer_phone);
        if (!existing) {
          customersMap.set(feedback.customer_phone, {
            user_token: feedback.user_token,
            phone: feedback.customer_phone,
            total_reviews: 1,
            avg_rating: feedback.rating,
            last_review: feedback.created_at,
            is_positive: feedback.is_positive,
          });
        } else {
          existing.total_reviews += 1;
          existing.avg_rating = (existing.avg_rating * (existing.total_reviews - 1) + feedback.rating) / existing.total_reviews;
          if (new Date(feedback.created_at) > new Date(existing.last_review)) {
            existing.last_review = feedback.created_at;
          }
        }
      });

      const customersList = Array.from(customersMap.values());
      setCustomers(customersList);
      setFilteredCustomers(customersList);

      // Load campaign data from localStorage
      const savedCampaign = localStorage.getItem('whatsapp_campaign_draft');
      if (savedCampaign) {
        setCampaignData(JSON.parse(savedCampaign));
      }

      setLoading(false);
    };

    fetchData();
  }, [router]);

  // Filter customers based on search
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredCustomers(customers);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredCustomers(
        customers.filter(c => c.phone.includes(query))
      );
    }
  }, [searchQuery, customers]);

  const toggleSelectAll = () => {
    if (selectedCustomers.size === filteredCustomers.length) {
      setSelectedCustomers(new Set());
    } else {
      setSelectedCustomers(new Set(filteredCustomers.map(c => c.phone)));
    }
  };

  const toggleCustomer = (phone: string) => {
    const newSelected = new Set(selectedCustomers);
    if (newSelected.has(phone)) {
      newSelected.delete(phone);
    } else {
      newSelected.add(phone);
    }
    setSelectedCustomers(newSelected);
  };

  const selectPositiveOnly = () => {
    setSelectedCustomers(new Set(
      filteredCustomers.filter(c => c.avg_rating >= 4).map(c => c.phone)
    ));
  };

  const sendCampaign = async () => {
    if (!campaignData || selectedCustomers.size === 0) {
      return;
    }

    setIsSending(true);
    setSendProgress(0);
    setSendResults([]);
    setShowResults(false);

    const results: SendResult[] = [];
    const selectedArray = Array.from(selectedCustomers);
    const total = selectedArray.length;

    for (let i = 0; i < selectedArray.length; i++) {
      const phone = selectedArray[i];

      try {
        // Build the carousel payload for this recipient
        const carouselPayload = {
          body: { text: campaignData.mainMessage },
          cards: campaignData.cards.map((card: any, index: number) => ({
            media: { media: card.mediaUrl },
            text: card.text,
            id: `Card-ID${index + 1}`,
            buttons: [
              card.buttonType === 'url'
                ? { type: 'url', title: card.buttonTitle, id: `Button-ID${index + 1}`, url: card.buttonUrl }
                : { type: 'quick_reply', title: card.buttonTitle, id: `Button-ID${index + 1}` },
            ],
          })),
        };

        // Send via our API route (uses server-side WHAPI_API_KEY)
        const response = await fetch('/api/whatsapp/carousel', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            phoneNumber: phone,
            carouselPayload,
          }),
        });

        const data = await response.json();
        if (response.ok && data.success) {
          results.push({ phone, success: true });
        } else {
          results.push({ phone, success: false, error: data.error || 'Failed to send' });
        }
      } catch (error: any) {
        results.push({ phone, success: false, error: error.message || 'Network error' });
      }

      setSendProgress(Math.round(((i + 1) / total) * 100));
      setSendResults([...results]);

      // Small delay between sends to avoid rate limiting
      if (i < selectedArray.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    setIsSending(false);
    setShowResults(true);
  };

  const successCount = sendResults.filter(r => r.success).length;
  const failureCount = sendResults.filter(r => !r.success).length;

  // Test send functions
  const addTestNumber = () => {
    if (testNumbers.length < 2) {
      setTestNumbers([...testNumbers, '']);
    }
  };

  const removeTestNumber = (index: number) => {
    setTestNumbers(testNumbers.filter((_, i) => i !== index));
  };

  const updateTestNumber = (index: number, value: string) => {
    const newNumbers = [...testNumbers];
    newNumbers[index] = value;
    setTestNumbers(newNumbers);
  };

  const sendTestCampaign = async () => {
    const validNumbers = testNumbers.filter(n => n.trim().length > 0);
    if (!campaignData || validNumbers.length === 0) {
      return;
    }

    setIsTestSending(true);
    setTestResults([]);

    const results: SendResult[] = [];

    for (const phone of validNumbers) {
      try {
        const carouselPayload = {
          body: { text: campaignData.mainMessage },
          cards: campaignData.cards.map((card: any, index: number) => ({
            media: { media: card.mediaUrl },
            text: card.text,
            id: `Card-ID${index + 1}`,
            buttons: [
              card.buttonType === 'url'
                ? { type: 'url', title: card.buttonTitle, id: `Button-ID${index + 1}`, url: card.buttonUrl }
                : { type: 'quick_reply', title: card.buttonTitle, id: `Button-ID${index + 1}` },
            ],
          })),
        };

        // Send via our API route (uses server-side WHAPI_API_KEY)
        const response = await fetch('/api/whatsapp/carousel', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            phoneNumber: phone,
            carouselPayload,
          }),
        });

        const data = await response.json();
        if (response.ok && data.success) {
          results.push({ phone, success: true });
        } else {
          results.push({ phone, success: false, error: data.error || 'Failed to send' });
        }
      } catch (error: any) {
        results.push({ phone, success: false, error: error.message || 'Network error' });
      }

      await new Promise(resolve => setTimeout(resolve, 300));
    }

    setTestResults(results);
    setIsTestSending(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm text-gray-500">{t('dashboard.common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout merchant={merchant}>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/dashboard/marketing/whatsapp-campaign')}
            className="gap-1.5 h-8"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            {t('dashboard.common.back')}
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">{t('marketing.whatsappCampaign.selectRecipients')}</h1>
            <p className="text-sm text-gray-500">{t('marketing.whatsappCampaign.selectRecipientsDesc')}</p>
          </div>
        </div>

        {/* Campaign Summary Banner */}
        {campaignData && (
          <div className="group relative p-4 border border-gray-200 rounded-xl overflow-hidden transition-all duration-300 hover:border-gray-300 hover:shadow-md bg-gradient-to-r from-green-50 to-emerald-50">
            <span className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-teal-500 to-emerald-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-100 text-green-600 flex items-center justify-center">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-green-900">{campaignData.campaignName || t('marketing.whatsappCampaign.untitledCampaign')}</p>
                  <p className="text-xs text-green-700">{campaignData.cards?.length || 0} {t('marketing.whatsappCampaign.cards')}</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowTestModal(true);
                  setTestResults([]);
                }}
                className="gap-1.5 border-amber-300 text-amber-700 hover:bg-amber-50 h-8"
              >
                <FlaskConical className="w-3.5 h-3.5" />
                {t('marketing.whatsappCampaign.testSend')}
              </Button>
            </div>
          </div>
        )}

        {/* Test Send Modal */}
        {showTestModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="w-full max-w-md bg-white rounded-xl border border-gray-200 shadow-xl">
              <div className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                      <FlaskConical className="w-4 h-4" />
                    </div>
                    <h3 className="text-sm font-semibold text-gray-900">{t('marketing.whatsappCampaign.testSend')}</h3>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setShowTestModal(false)} className="h-7 w-7 p-0">
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                <p className="text-xs text-gray-500 mb-4">{t('marketing.whatsappCampaign.testSendDesc')}</p>

                {/* Test Numbers */}
                <div className="space-y-2 mb-4">
                  {testNumbers.map((number, index) => (
                    <div key={index} className="flex gap-2">
                      <PhoneInputWithCountry
                        value={number}
                        onChange={(value) => updateTestNumber(index, value)}
                        placeholder={t('marketing.whatsappCampaign.testNumberPlaceholder')}
                        className="flex-1"
                      />
                      {testNumbers.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeTestNumber(index)}
                          className="h-10 w-10 p-0 text-red-500 hover:bg-red-50"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}

                  {testNumbers.length < 2 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={addTestNumber}
                      className="w-full gap-1.5 border-dashed text-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      {t('marketing.whatsappCampaign.addTestNumber')}
                    </Button>
                  )}
                </div>

                {/* Test Results */}
                {testResults.length > 0 && (
                  <div className="mb-4 space-y-1.5">
                    {testResults.map((result, i) => (
                      <div
                        key={i}
                        className={`flex items-center gap-2 p-2 rounded-lg text-xs ${
                          result.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                        }`}
                      >
                        {result.success ? (
                          <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5 text-red-600" />
                        )}
                        <span className="font-medium">{result.phone}</span>
                        {result.error && <span className="text-[10px]">- {result.error}</span>}
                      </div>
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowTestModal(false)}
                    className="flex-1"
                    size="sm"
                  >
                    {t('dashboard.common.close')}
                  </Button>
                  <Button
                    onClick={sendTestCampaign}
                    disabled={isTestSending || testNumbers.every(n => !n.trim())}
                    className="flex-1 bg-amber-600 hover:bg-amber-700 text-white gap-1.5"
                    size="sm"
                  >
                    {isTestSending ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        {t('marketing.whatsappCampaign.sendingInProgress')}
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        {t('marketing.whatsappCampaign.sendTest')}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3">
          <div className="group relative p-4 border border-gray-200 rounded-xl overflow-hidden transition-all duration-300 hover:border-gray-300 hover:shadow-md bg-white">
            <span className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-teal-500 to-emerald-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900">{customers.length}</p>
                <p className="text-xs text-gray-500">{t('marketing.whatsappCampaign.totalContacts')}</p>
              </div>
            </div>
          </div>

          <div className="group relative p-4 border border-gray-200 rounded-xl overflow-hidden transition-all duration-300 hover:border-gray-300 hover:shadow-md bg-white">
            <span className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-teal-500 to-emerald-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
                <Check className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900">{selectedCustomers.size}</p>
                <p className="text-xs text-gray-500">{t('marketing.whatsappCampaign.selected')}</p>
              </div>
            </div>
          </div>

          <div className="group relative p-4 border border-gray-200 rounded-xl overflow-hidden transition-all duration-300 hover:border-gray-300 hover:shadow-md bg-white">
            <span className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-teal-500 to-emerald-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <Star className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900">
                  {customers.filter(c => c.avg_rating >= 4).length}
                </p>
                <p className="text-xs text-gray-500">{t('marketing.whatsappCampaign.positiveCustomers')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Send Progress */}
        {isSending && (
          <div className="group relative p-4 border border-gray-200 rounded-xl overflow-hidden bg-white">
            <span className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-teal-500 to-emerald-500" />
            <div className="flex items-center gap-3 mb-2">
              <Loader2 className="w-4 h-4 text-teal-600 animate-spin" />
              <p className="text-sm font-medium text-gray-900">{t('marketing.whatsappCampaign.sendingInProgress')}</p>
              <span className="text-xs text-gray-500 ml-auto">{sendResults.length} / {selectedCustomers.size}</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-teal-500 to-emerald-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${sendProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Results */}
        {showResults && (
          <div className="group relative p-5 border border-gray-200 rounded-xl overflow-hidden bg-white">
            <span className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-teal-500 to-emerald-500" />
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-900">{t('marketing.whatsappCampaign.sendResults')}</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowResults(false)} className="h-7 text-xs">
                {t('dashboard.common.close')}
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="p-3 bg-green-50 rounded-lg flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-green-600" />
                <div>
                  <p className="text-xl font-bold text-green-900">{successCount}</p>
                  <p className="text-xs text-green-700">{t('marketing.whatsappCampaign.successfullySent')}</p>
                </div>
              </div>
              <div className="p-3 bg-red-50 rounded-lg flex items-center gap-3">
                <XCircle className="w-6 h-6 text-red-600" />
                <div>
                  <p className="text-xl font-bold text-red-900">{failureCount}</p>
                  <p className="text-xs text-red-700">{t('marketing.whatsappCampaign.failed')}</p>
                </div>
              </div>
            </div>
            {failureCount > 0 && (
              <div className="border border-red-200 rounded-lg p-2.5 bg-red-50 max-h-32 overflow-y-auto">
                <p className="text-xs font-medium text-red-800 mb-1.5">{t('marketing.whatsappCampaign.failedNumbers')}:</p>
                {sendResults.filter(r => !r.success).map((result, i) => (
                  <p key={i} className="text-[10px] text-red-700">
                    {result.phone}: {result.error}
                  </p>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Customer Table Card */}
        <div className="group relative border border-gray-200 rounded-xl overflow-hidden transition-all duration-300 hover:border-gray-300 hover:shadow-md bg-white">
          <span className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-teal-500 to-emerald-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />

          {/* Card Header with Search */}
          <div className="p-4 border-b border-gray-100">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input
                  type="text"
                  placeholder={t('marketing.whatsappCampaign.searchByPhone')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={toggleSelectAll} className="gap-1.5 text-xs h-9">
                  <Check className="w-3.5 h-3.5" />
                  {selectedCustomers.size === filteredCustomers.length
                    ? t('marketing.whatsappCampaign.deselectAll')
                    : t('marketing.whatsappCampaign.selectAll')}
                </Button>
                <Button variant="outline" size="sm" onClick={selectPositiveOnly} className="gap-1.5 text-xs h-9">
                  <Star className="w-3.5 h-3.5 text-amber-500" />
                  {t('marketing.whatsappCampaign.selectPositive')}
                </Button>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50/50">
                  <th className="px-4 py-2.5 text-left w-10">
                    <input
                      type="checkbox"
                      checked={selectedCustomers.size === filteredCustomers.length && filteredCustomers.length > 0}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                    />
                  </th>
                  <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">{t('marketing.whatsappCampaign.phoneNumber')}</th>
                  <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">{t('marketing.whatsappCampaign.rating')}</th>
                  <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">{t('marketing.whatsappCampaign.reviews')}</th>
                  <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">{t('marketing.whatsappCampaign.lastVisit')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredCustomers.length > 0 ? (
                  filteredCustomers.map((customer) => (
                    <tr
                      key={customer.phone}
                      className={`hover:bg-gray-50 cursor-pointer transition-colors ${
                        selectedCustomers.has(customer.phone) ? 'bg-teal-50/50' : ''
                      }`}
                      onClick={() => toggleCustomer(customer.phone)}
                    >
                      <td className="px-4 py-2.5">
                        <input
                          type="checkbox"
                          checked={selectedCustomers.has(customer.phone)}
                          onChange={() => toggleCustomer(customer.phone)}
                          onClick={(e) => e.stopPropagation()}
                          className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                        />
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 text-green-500" />
                          <span className="text-sm font-medium text-gray-900">{customer.phone}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-1">
                          <span className="text-sm font-medium">{customer.avg_rating.toFixed(1)}</span>
                          <Star className={`w-3.5 h-3.5 ${customer.avg_rating >= 4 ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}`} />
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        <Badge variant="secondary" className="text-[10px]">{customer.total_reviews}</Badge>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                          <Calendar className="w-3 h-3" />
                          {new Date(customer.last_review).toLocaleDateString()}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-gray-500">
                      <Users className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm font-medium text-gray-900">{t('marketing.whatsappCampaign.noContacts')}</p>
                      <p className="text-xs">{t('marketing.whatsappCampaign.noContactsDesc')}</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bottom Action Bar */}
        {selectedCustomers.size > 0 && !isSending && (
          <div className="sticky bottom-4 z-10">
            <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
                  <Send className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{selectedCustomers.size} {t('marketing.whatsappCampaign.selected')}</p>
                  <p className="text-[10px] text-gray-500">{t('marketing.whatsappCampaign.readyToSend') || 'Pret a envoyer'}</p>
                </div>
              </div>
              <Button
                onClick={sendCampaign}
                disabled={!campaignData}
                className="bg-teal-600 hover:bg-teal-700 gap-1.5"
              >
                <Send className="w-4 h-4" />
                {t('marketing.whatsappCampaign.sendToSelected')} ({selectedCustomers.size})
              </Button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
