'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase/client';
import { useTranslation } from 'react-i18next';
import '@/lib/i18n/config';
import {
  Plus,
  Trash2,
  Image as ImageIcon,
  Link as LinkIcon,
  MessageSquare,
  Send,
  Eye,
  Check,
  Upload,
  X,
  ChevronUp,
  ChevronDown,
  Loader2,
  AlertCircle,
  Users,
  Save,
  FolderOpen,
  Star,
  Clock,
} from 'lucide-react';

interface CarouselCard {
  id: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  text: string;
  buttonType: 'url' | 'quick_reply';
  buttonTitle: string;
  buttonUrl?: string;
}

interface SavedCampaign {
  id: string;
  merchant_id: string;
  name: string;
  main_message: string;
  cards: CarouselCard[];
  created_at: string;
  updated_at: string;
  is_favorite: boolean;
  send_count: number;
  last_sent_at: string | null;
}

const generateId = () => Math.random().toString(36).substring(2, 9);

export default function WhatsAppCampaignPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [merchant, setMerchant] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  // Campaign state
  const [campaignName, setCampaignName] = useState('');
  const [mainMessage, setMainMessage] = useState('');
  const [cards, setCards] = useState<CarouselCard[]>([
    {
      id: generateId(),
      mediaUrl: '',
      mediaType: 'image',
      text: '',
      buttonType: 'url',
      buttonTitle: '',
      buttonUrl: '',
    },
  ]);

  // UI state
  const [showPreview, setShowPreview] = useState(false);
  const [uploadingCard, setUploadingCard] = useState<string | null>(null);

  // Saved campaigns state
  const [savedCampaigns, setSavedCampaigns] = useState<SavedCampaign[]>([]);
  const [showSavedCampaigns, setShowSavedCampaigns] = useState(false);
  const [currentCampaignId, setCurrentCampaignId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    const fetchMerchant = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('merchants')
          .select('*')
          .eq('id', user.id)
          .single();
        setMerchant(data);

        // Fetch saved campaigns
        fetchSavedCampaigns(user.id);
      }
      setLoading(false);
    };
    fetchMerchant();
  }, []);

  const fetchSavedCampaigns = async (merchantId: string) => {
    try {
      const response = await fetch(`/api/whatsapp/campaigns?merchantId=${merchantId}`);
      const data = await response.json();
      if (data.campaigns) {
        setSavedCampaigns(data.campaigns);
      }
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    }
  };

  const saveCampaign = async () => {
    if (!merchant || !campaignName.trim()) return;

    setIsSaving(true);
    setSaveMessage(null);

    try {
      const payload = {
        merchantId: merchant.id,
        name: campaignName,
        mainMessage: mainMessage,
        cards: cards,
      };

      let response;
      if (currentCampaignId) {
        // Update existing campaign
        response = await fetch('/api/whatsapp/campaigns', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload, id: currentCampaignId }),
        });
      } else {
        // Create new campaign
        response = await fetch('/api/whatsapp/campaigns', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      const data = await response.json();
      if (response.ok && data.campaign) {
        setSaveMessage({ type: 'success', text: t('marketing.whatsappCampaign.campaignSaved') });
        setCurrentCampaignId(data.campaign.id);
        fetchSavedCampaigns(merchant.id);
        setTimeout(() => setSaveMessage(null), 3000);
      } else {
        setSaveMessage({ type: 'error', text: data.error || t('marketing.whatsappCampaign.saveFailed') });
      }
    } catch (error) {
      setSaveMessage({ type: 'error', text: t('marketing.whatsappCampaign.saveFailed') });
    } finally {
      setIsSaving(false);
    }
  };

  const loadCampaign = (campaign: SavedCampaign) => {
    setCampaignName(campaign.name);
    setMainMessage(campaign.main_message);
    setCards(campaign.cards);
    setCurrentCampaignId(campaign.id);
    setShowSavedCampaigns(false);
  };

  const deleteCampaign = async (campaignId: string) => {
    if (!merchant) return;

    try {
      const response = await fetch(
        `/api/whatsapp/campaigns?id=${campaignId}&merchantId=${merchant.id}`,
        { method: 'DELETE' }
      );

      if (response.ok) {
        setSavedCampaigns(savedCampaigns.filter(c => c.id !== campaignId));
        if (currentCampaignId === campaignId) {
          setCurrentCampaignId(null);
        }
      }
    } catch (error) {
      console.error('Error deleting campaign:', error);
    }
  };

  const toggleFavorite = async (campaignId: string, currentValue: boolean) => {
    if (!merchant) return;

    try {
      await fetch('/api/whatsapp/campaigns', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: campaignId,
          merchantId: merchant.id,
          isFavorite: !currentValue,
        }),
      });

      setSavedCampaigns(savedCampaigns.map(c =>
        c.id === campaignId ? { ...c, is_favorite: !currentValue } : c
      ));
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const startNewCampaign = () => {
    setCampaignName('');
    setMainMessage('');
    setCards([{
      id: generateId(),
      mediaUrl: '',
      mediaType: 'image',
      text: '',
      buttonType: 'url',
      buttonTitle: '',
      buttonUrl: '',
    }]);
    setCurrentCampaignId(null);
    setShowSavedCampaigns(false);
  };

  const addCard = () => {
    if (cards.length >= 10) return;
    setCards([
      ...cards,
      {
        id: generateId(),
        mediaUrl: '',
        mediaType: 'image',
        text: '',
        buttonType: 'url',
        buttonTitle: '',
        buttonUrl: '',
      },
    ]);
  };

  const removeCard = (id: string) => {
    if (cards.length <= 1) return;
    setCards(cards.filter((card) => card.id !== id));
  };

  const updateCard = (id: string, updates: Partial<CarouselCard>) => {
    setCards(cards.map((card) => (card.id === id ? { ...card, ...updates } : card)));
  };

  const moveCard = (index: number, direction: 'up' | 'down') => {
    const newCards = [...cards];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= cards.length) return;
    [newCards[index], newCards[newIndex]] = [newCards[newIndex], newCards[index]];
    setCards(newCards);
  };

  const handleFileUpload = async (cardId: string, file: File) => {
    if (!merchant) return;

    setUploadingCard(cardId);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${merchant.id}/campaigns/${cardId}_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('merchant-assets')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('merchant-assets')
        .getPublicUrl(fileName);

      const mediaType = file.type.startsWith('video/') ? 'video' : 'image';
      updateCard(cardId, { mediaUrl: publicUrl, mediaType });
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setUploadingCard(null);
    }
  };

  const isCardValid = (card: CarouselCard) => {
    return card.mediaUrl && card.text && card.buttonTitle && (card.buttonType !== 'url' || card.buttonUrl);
  };

  const isCampaignValid = () => {
    return mainMessage && cards.every(isCardValid);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout merchant={merchant}>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{t('marketing.whatsappCampaign.title')}</h1>
            <p className="text-slate-500 mt-1">{t('marketing.whatsappCampaign.subtitle')}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => setShowSavedCampaigns(!showSavedCampaigns)}
              className="gap-2"
            >
              <FolderOpen className="w-4 h-4" />
              {t('marketing.whatsappCampaign.myCampaigns')} ({savedCampaigns.length})
            </Button>
            <Button
              variant="outline"
              onClick={startNewCampaign}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              {t('marketing.whatsappCampaign.newCampaign')}
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowPreview(!showPreview)}
              className="gap-2"
            >
              <Eye className="w-4 h-4" />
              {showPreview ? t('marketing.whatsappCampaign.hidePreview') : t('marketing.whatsappCampaign.showPreview')}
            </Button>
            <Button
              onClick={saveCampaign}
              disabled={!campaignName.trim() || isSaving}
              className="gap-2 bg-blue-600 hover:bg-blue-700"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {currentCampaignId ? t('marketing.whatsappCampaign.updateCampaign') : t('marketing.whatsappCampaign.saveCampaign')}
            </Button>
          </div>
        </div>

        {/* Save Message */}
        {saveMessage && (
          <div className={`p-3 rounded-lg flex items-center gap-2 ${
            saveMessage.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'
          }`}>
            {saveMessage.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span className="text-sm">{saveMessage.text}</span>
          </div>
        )}

        {/* Saved Campaigns Panel */}
        {showSavedCampaigns && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <FolderOpen className="w-5 h-5 text-teal-600" />
                {t('marketing.whatsappCampaign.savedCampaigns')}
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSavedCampaigns(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {savedCampaigns.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <FolderOpen className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p>{t('marketing.whatsappCampaign.noCampaigns')}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {savedCampaigns
                  .sort((a, b) => {
                    // Favorites first, then by updated_at
                    if (a.is_favorite && !b.is_favorite) return -1;
                    if (!a.is_favorite && b.is_favorite) return 1;
                    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
                  })
                  .map((campaign) => (
                  <div
                    key={campaign.id}
                    className={`border rounded-xl p-4 hover:border-teal-500 transition-colors cursor-pointer ${
                      currentCampaignId === campaign.id ? 'border-teal-500 bg-teal-50' : 'border-slate-200'
                    }`}
                    onClick={() => loadCampaign(campaign)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-medium text-slate-900 line-clamp-1">{campaign.name}</h3>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(campaign.id, campaign.is_favorite);
                          }}
                          className={`p-1 rounded hover:bg-slate-100 ${campaign.is_favorite ? 'text-amber-500' : 'text-slate-300'}`}
                        >
                          <Star className={`w-4 h-4 ${campaign.is_favorite ? 'fill-amber-500' : ''}`} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(t('marketing.whatsappCampaign.confirmDelete'))) {
                              deleteCampaign(campaign.id);
                            }
                          }}
                          className="p-1 rounded hover:bg-red-100 text-slate-400 hover:text-red-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-slate-500 line-clamp-2 mb-3">{campaign.main_message}</p>
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <ImageIcon className="w-3 h-3" />
                        {campaign.cards.length} {t('marketing.whatsappCampaign.cards')}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(campaign.updated_at).toLocaleDateString()}
                      </span>
                    </div>
                    {campaign.send_count > 0 && (
                      <div className="mt-2 text-xs text-teal-600 flex items-center gap-1">
                        <Send className="w-3 h-3" />
                        {t('marketing.whatsappCampaign.sentTimes', { count: campaign.send_count })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Campaign Builder */}
          <div className="space-y-6">
            {/* Campaign Name */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-teal-600" />
                {t('marketing.whatsappCampaign.campaignDetails')}
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    {t('marketing.whatsappCampaign.campaignName')}
                  </label>
                  <input
                    type="text"
                    value={campaignName}
                    onChange={(e) => setCampaignName(e.target.value)}
                    placeholder={t('marketing.whatsappCampaign.campaignNamePlaceholder')}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    {t('marketing.whatsappCampaign.mainMessage')}
                  </label>
                  <textarea
                    value={mainMessage}
                    onChange={(e) => setMainMessage(e.target.value)}
                    placeholder={t('marketing.whatsappCampaign.mainMessagePlaceholder')}
                    rows={3}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Carousel Cards */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-teal-600" />
                  {t('marketing.whatsappCampaign.carouselCards')} ({cards.length}/10)
                </h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addCard}
                  disabled={cards.length >= 10}
                  className="gap-1"
                >
                  <Plus className="w-4 h-4" />
                  {t('marketing.whatsappCampaign.addCard')}
                </Button>
              </div>

              <div className="space-y-4">
                {cards.map((card, index) => (
                  <div
                    key={card.id}
                    className="border border-slate-200 rounded-xl p-4 bg-slate-50/50"
                  >
                    {/* Card Header */}
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-semibold text-slate-700">
                        {t('marketing.whatsappCampaign.card')} {index + 1}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => moveCard(index, 'up')}
                          disabled={index === 0}
                          className="p-1.5 rounded-lg hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <ChevronUp className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => moveCard(index, 'down')}
                          disabled={index === cards.length - 1}
                          className="p-1.5 rounded-lg hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => removeCard(card.id)}
                          disabled={cards.length <= 1}
                          className="p-1.5 rounded-lg hover:bg-red-100 text-red-500 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Media Upload */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-slate-600 mb-2">
                        {t('marketing.whatsappCampaign.media')}
                      </label>
                      {card.mediaUrl ? (
                        <div className="relative w-full h-40 rounded-lg overflow-hidden bg-slate-200">
                          {card.mediaType === 'video' ? (
                            <video
                              src={card.mediaUrl}
                              className="w-full h-full object-cover"
                              controls
                            />
                          ) : (
                            <img
                              src={card.mediaUrl}
                              alt={`Card ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          )}
                          <button
                            onClick={() => updateCard(card.id, { mediaUrl: '', mediaType: 'image' })}
                            className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div
                          onClick={() => fileInputRefs.current[card.id]?.click()}
                          className="w-full h-48 border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-teal-500 hover:bg-teal-50/50 transition-colors"
                        >
                          {uploadingCard === card.id ? (
                            <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
                          ) : (
                            <>
                              <Upload className="w-8 h-8 text-slate-400 mb-2" />
                              <span className="text-sm text-slate-500">{t('marketing.whatsappCampaign.uploadMedia')}</span>
                              <div className="text-xs text-slate-400 mt-2 text-center px-4 space-y-1">
                                <p className="font-medium">{t('marketing.whatsappCampaign.mediaRequirements')}</p>
                                <p>{t('marketing.whatsappCampaign.imageRequirements')}</p>
                                <p>{t('marketing.whatsappCampaign.videoRequirements')}</p>
                              </div>
                            </>
                          )}
                        </div>
                      )}
                      <input
                        ref={(el) => { fileInputRefs.current[card.id] = el; }}
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,video/mp4"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(card.id, file);
                        }}
                        className="hidden"
                      />
                    </div>

                    {/* Card Text */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-slate-600 mb-2">
                        {t('marketing.whatsappCampaign.cardText')}
                      </label>
                      <textarea
                        value={card.text}
                        onChange={(e) => updateCard(card.id, { text: e.target.value })}
                        placeholder={t('marketing.whatsappCampaign.cardTextPlaceholder')}
                        rows={2}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none text-sm"
                      />
                    </div>

                    {/* Button Type */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-slate-600 mb-2">
                        {t('marketing.whatsappCampaign.buttonType')}
                      </label>
                      <div className="flex gap-2">
                        <button
                          onClick={() => updateCard(card.id, { buttonType: 'url' })}
                          className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                            card.buttonType === 'url'
                              ? 'bg-teal-600 text-white'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          <LinkIcon className="w-4 h-4" />
                          {t('marketing.whatsappCampaign.urlButton')}
                        </button>
                        <button
                          onClick={() => updateCard(card.id, { buttonType: 'quick_reply' })}
                          className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                            card.buttonType === 'quick_reply'
                              ? 'bg-teal-600 text-white'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          <MessageSquare className="w-4 h-4" />
                          {t('marketing.whatsappCampaign.quickReply')}
                        </button>
                      </div>
                    </div>

                    {/* Button Title */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-slate-600 mb-2">
                        {t('marketing.whatsappCampaign.buttonTitle')}
                      </label>
                      <input
                        type="text"
                        value={card.buttonTitle}
                        onChange={(e) => updateCard(card.id, { buttonTitle: e.target.value })}
                        placeholder={t('marketing.whatsappCampaign.buttonTitlePlaceholder')}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                      />
                    </div>

                    {/* Button URL (only for URL type) */}
                    {card.buttonType === 'url' && (
                      <div>
                        <label className="block text-sm font-medium text-slate-600 mb-2">
                          {t('marketing.whatsappCampaign.buttonUrl')}
                        </label>
                        <input
                          type="url"
                          value={card.buttonUrl}
                          onChange={(e) => updateCard(card.id, { buttonUrl: e.target.value })}
                          placeholder="https://example.com"
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Preview & JSON */}
          <div className="space-y-6">
            {/* WhatsApp Preview */}
            {showPreview && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <Eye className="w-5 h-5 text-teal-600" />
                  {t('marketing.whatsappCampaign.preview')}
                </h2>

                {/* WhatsApp Message Preview */}
                <div className="bg-[#E5DDD5] rounded-xl p-4 max-h-[500px] overflow-y-auto">
                  {/* Main Message */}
                  {mainMessage && (
                    <div className="bg-white rounded-lg p-3 shadow-sm mb-3 max-w-[85%]">
                      <p className="text-sm text-slate-800">{mainMessage}</p>
                    </div>
                  )}

                  {/* Carousel Preview */}
                  <div className="flex gap-3 overflow-x-auto pb-2">
                    {cards.map((card, index) => (
                      <div
                        key={card.id}
                        className="flex-shrink-0 w-56 bg-white rounded-lg shadow-sm overflow-hidden"
                      >
                        {/* Card Media */}
                        <div className="h-32 bg-slate-200">
                          {card.mediaUrl ? (
                            card.mediaType === 'video' ? (
                              <video
                                src={card.mediaUrl}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <img
                                src={card.mediaUrl}
                                alt={`Preview ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                            )
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ImageIcon className="w-8 h-8 text-slate-400" />
                            </div>
                          )}
                        </div>

                        {/* Card Content */}
                        <div className="p-3">
                          <p className="text-xs text-slate-700 line-clamp-3 mb-2">
                            {card.text || t('marketing.whatsappCampaign.cardTextPlaceholder')}
                          </p>
                          <button className="w-full py-1.5 bg-slate-100 rounded text-xs font-medium text-teal-600 flex items-center justify-center gap-1">
                            {card.buttonType === 'url' ? <LinkIcon className="w-3 h-3" /> : <MessageSquare className="w-3 h-3" />}
                            {card.buttonTitle || t('marketing.whatsappCampaign.buttonTitlePlaceholder')}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Next Step Info */}
            <div className="bg-gradient-to-br from-teal-50 to-emerald-50 rounded-2xl border border-teal-200 p-6">
              <h3 className="text-lg font-semibold text-teal-900 mb-2">{t('marketing.whatsappCampaign.nextStep')}</h3>
              <p className="text-sm text-teal-700 mb-4">{t('marketing.whatsappCampaign.nextStepDescription')}</p>
              <Button
                className="bg-teal-600 hover:bg-teal-700 gap-2"
                disabled={!isCampaignValid()}
                onClick={() => {
                  // Save campaign to localStorage
                  localStorage.setItem('whatsapp_campaign_draft', JSON.stringify({
                    campaignName,
                    mainMessage,
                    cards,
                  }));
                  router.push('/dashboard/marketing/whatsapp-campaign/send');
                }}
              >
                <Users className="w-4 h-4" />
                {t('marketing.whatsappCampaign.selectRecipients')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
