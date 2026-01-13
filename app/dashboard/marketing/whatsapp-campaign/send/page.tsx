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
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg text-slate-600">{t('dashboard.common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout merchant={merchant}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/dashboard/marketing/whatsapp-campaign')}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('dashboard.common.back')}
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-slate-900">{t('marketing.whatsappCampaign.selectRecipients')}</h1>
            <p className="text-slate-500">{t('marketing.whatsappCampaign.selectRecipientsDesc')}</p>
          </div>
        </div>

        {/* Campaign Summary */}
        {campaignData && (
          <Card className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <MessageCircle className="w-5 h-5 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-green-900">{campaignData.campaignName || t('marketing.whatsappCampaign.untitledCampaign')}</p>
                <p className="text-sm text-green-700">{campaignData.cards?.length || 0} {t('marketing.whatsappCampaign.cards')}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowTestModal(true);
                  setTestResults([]);
                }}
                className="gap-2 border-amber-300 text-amber-700 hover:bg-amber-50"
              >
                <FlaskConical className="w-4 h-4" />
                {t('marketing.whatsappCampaign.testSend')}
              </Button>
            </div>
          </Card>
        )}

        {/* Test Send Modal */}
        {showTestModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md p-6 bg-white">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <FlaskConical className="w-5 h-5 text-amber-600" />
                  <h3 className="text-lg font-semibold text-slate-900">{t('marketing.whatsappCampaign.testSend')}</h3>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowTestModal(false)}
                  className="h-8 w-8 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <p className="text-sm text-slate-600 mb-4">{t('marketing.whatsappCampaign.testSendDesc')}</p>

              {/* Test Numbers */}
              <div className="space-y-3 mb-4">
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
                    className="w-full gap-2 border-dashed"
                  >
                    <Plus className="w-4 h-4" />
                    {t('marketing.whatsappCampaign.addTestNumber')}
                  </Button>
                )}
              </div>

              {/* Test Results */}
              {testResults.length > 0 && (
                <div className="mb-4 space-y-2">
                  {testResults.map((result, i) => (
                    <div
                      key={i}
                      className={`flex items-center gap-2 p-2 rounded-lg text-sm ${
                        result.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                      }`}
                    >
                      {result.success ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-600" />
                      )}
                      <span className="font-medium">{result.phone}</span>
                      {result.error && <span className="text-xs">- {result.error}</span>}
                    </div>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowTestModal(false)}
                  className="flex-1"
                >
                  {t('dashboard.common.close')}
                </Button>
                <Button
                  onClick={sendTestCampaign}
                  disabled={isTestSending || testNumbers.every(n => !n.trim())}
                  className="flex-1 bg-amber-600 hover:bg-amber-700 text-white gap-2"
                >
                  {isTestSending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {t('marketing.whatsappCampaign.sendingInProgress')}
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      {t('marketing.whatsappCampaign.sendTest')}
                    </>
                  )}
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* Stats and Actions */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-teal-50 rounded-lg">
                <Users className="w-5 h-5 text-teal-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{customers.length}</p>
                <p className="text-sm text-slate-500">{t('marketing.whatsappCampaign.totalContacts')}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-50 rounded-lg">
                <Check className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{selectedCustomers.size}</p>
                <p className="text-sm text-slate-500">{t('marketing.whatsappCampaign.selected')}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-50 rounded-lg">
                <Star className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">
                  {customers.filter(c => c.avg_rating >= 4).length}
                </p>
                <p className="text-sm text-slate-500">{t('marketing.whatsappCampaign.positiveCustomers')}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <Button
              onClick={sendCampaign}
              disabled={selectedCustomers.size === 0 || isSending || !campaignData}
              className="w-full h-full bg-green-600 hover:bg-green-700 text-white gap-2"
            >
              {isSending ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {sendProgress}%
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  {t('marketing.whatsappCampaign.sendToSelected')} ({selectedCustomers.size})
                </>
              )}
            </Button>
          </Card>
        </div>

        {/* Send Progress */}
        {isSending && (
          <Card className="p-4">
            <div className="flex items-center gap-4 mb-3">
              <Loader2 className="w-5 h-5 text-green-600 animate-spin" />
              <p className="font-medium text-slate-900">{t('marketing.whatsappCampaign.sendingInProgress')}</p>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-3">
              <div
                className="bg-green-600 h-3 rounded-full transition-all duration-300"
                style={{ width: `${sendProgress}%` }}
              />
            </div>
            <p className="text-sm text-slate-500 mt-2">
              {sendResults.length} / {selectedCustomers.size} {t('marketing.whatsappCampaign.messagesSent')}
            </p>
          </Card>
        )}

        {/* Results */}
        {showResults && (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">{t('marketing.whatsappCampaign.sendResults')}</h3>
              <Button variant="outline" size="sm" onClick={() => setShowResults(false)}>
                {t('dashboard.common.close')}
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="p-4 bg-green-50 rounded-lg flex items-center gap-3">
                <CheckCircle className="w-8 h-8 text-green-600" />
                <div>
                  <p className="text-2xl font-bold text-green-900">{successCount}</p>
                  <p className="text-sm text-green-700">{t('marketing.whatsappCampaign.successfullySent')}</p>
                </div>
              </div>
              <div className="p-4 bg-red-50 rounded-lg flex items-center gap-3">
                <XCircle className="w-8 h-8 text-red-600" />
                <div>
                  <p className="text-2xl font-bold text-red-900">{failureCount}</p>
                  <p className="text-sm text-red-700">{t('marketing.whatsappCampaign.failed')}</p>
                </div>
              </div>
            </div>
            {failureCount > 0 && (
              <div className="border border-red-200 rounded-lg p-3 bg-red-50 max-h-40 overflow-y-auto">
                <p className="text-sm font-medium text-red-800 mb-2">{t('marketing.whatsappCampaign.failedNumbers')}:</p>
                {sendResults.filter(r => !r.success).map((result, i) => (
                  <p key={i} className="text-xs text-red-700">
                    {result.phone}: {result.error}
                  </p>
                ))}
              </div>
            )}
          </Card>
        )}

        {/* Search and Quick Actions */}
        <Card className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder={t('marketing.whatsappCampaign.searchByPhone')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={toggleSelectAll} className="gap-2">
                <Check className="w-4 h-4" />
                {selectedCustomers.size === filteredCustomers.length
                  ? t('marketing.whatsappCampaign.deselectAll')
                  : t('marketing.whatsappCampaign.selectAll')}
              </Button>
              <Button variant="outline" size="sm" onClick={selectPositiveOnly} className="gap-2">
                <Star className="w-4 h-4 text-amber-500" />
                {t('marketing.whatsappCampaign.selectPositive')}
              </Button>
            </div>
          </div>
        </Card>

        {/* Customer List */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedCustomers.size === filteredCustomers.length && filteredCustomers.length > 0}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">{t('marketing.whatsappCampaign.phoneNumber')}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">{t('marketing.whatsappCampaign.rating')}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">{t('marketing.whatsappCampaign.reviews')}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">{t('marketing.whatsappCampaign.lastVisit')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCustomers.length > 0 ? (
                  filteredCustomers.map((customer) => (
                    <tr
                      key={customer.phone}
                      className={`hover:bg-slate-50 cursor-pointer transition-colors ${
                        selectedCustomers.has(customer.phone) ? 'bg-teal-50' : ''
                      }`}
                      onClick={() => toggleCustomer(customer.phone)}
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedCustomers.has(customer.phone)}
                          onChange={() => toggleCustomer(customer.phone)}
                          onClick={(e) => e.stopPropagation()}
                          className="w-4 h-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-green-500" />
                          <span className="font-medium text-slate-900">{customer.phone}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <span className="font-medium">{customer.avg_rating.toFixed(1)}</span>
                          <Star className={`w-4 h-4 ${customer.avg_rating >= 4 ? 'text-amber-400 fill-amber-400' : 'text-slate-300'}`} />
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="secondary">{customer.total_reviews}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                          <Calendar className="w-4 h-4" />
                          {new Date(customer.last_review).toLocaleDateString()}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-slate-500">
                      <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                      <p className="text-lg font-medium text-slate-900">{t('marketing.whatsappCampaign.noContacts')}</p>
                      <p className="text-sm">{t('marketing.whatsappCampaign.noContactsDesc')}</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
