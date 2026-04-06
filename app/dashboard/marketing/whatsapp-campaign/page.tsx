'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import '@/lib/i18n/config';
import {
  Megaphone, RefreshCw, Plus, Trash2, Send, Check, X, Loader2,
  AlertCircle, Users, Star, Phone, FileText, Eye, ChevronRight,
  Coins, ShoppingCart, Clock, CheckCircle, XCircle, BarChart3,
  MessageCircle, Globe, Video, Image as ImageIcon, Type,
} from 'lucide-react';
import type { TemplateStatus } from '@/lib/whatsapp/types';
import { CREDIT_PACKS } from '@/lib/whatsapp/types';

type TabId = 'templates' | 'campaigns' | 'new';

interface WaTemplate {
  id: string;
  name: string;
  language: string;
  category: string;
  status: TemplateStatus;
  components: any;
  rejection_reason: string | null;
  created_at: string;
}

interface WaCampaign {
  id: string;
  name: string;
  template_id: string;
  template_name?: string;
  total_recipients: number;
  estimated_cost_fcfa: number;
  actual_cost_fcfa: number;
  total_sent?: number;
  total_delivered?: number;
  total_read?: number;
  total_failed?: number;
  status?: string;
  send_count: number;
  last_sent_at: string | null;
  created_at: string;
}

interface Recipient {
  phone: string;
  name: string | null;
  avg_rating: number;
  total_reviews: number;
  is_positive: boolean;
}

const STATUS_COLORS: Record<string, string> = {
  APPROVED: 'bg-green-100 text-green-700',
  PENDING: 'bg-amber-100 text-amber-700',
  REJECTED: 'bg-red-100 text-red-700',
  DRAFT: 'bg-gray-100 text-gray-600',
  PAUSED: 'bg-blue-100 text-blue-700',
  DISABLED: 'bg-gray-100 text-gray-400',
};

const inputClass = 'w-full px-3 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-teal-50/30 transition-all duration-200';

export default function WhatsAppCampaignPage() {
  const router = useRouter();
  const { i18n } = useTranslation(undefined, { useSuspense: false });
  const isFr = i18n.language === 'fr';

  const [user, setUser] = useState<any>(null);
  const [merchant, setMerchant] = useState<any>(null);
  const [hasConfig, setHasConfig] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>('templates');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Credits
  const [credits, setCredits] = useState(0);
  const [buyingPack, setBuyingPack] = useState<string | null>(null);

  // Templates
  const [templates, setTemplates] = useState<WaTemplate[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [tplForm, setTplForm] = useState({
    name: '', language: 'fr', category: 'MARKETING',
    headerType: 'NONE', headerContent: '',
    bodyText: '', footerText: '',
    buttons: [] as { type: string; text: string; url: string; phone: string }[],
  });

  // Campaigns
  const [campaigns, setCampaigns] = useState<WaCampaign[]>([]);
  const [expandedCampaign, setExpandedCampaign] = useState<string | null>(null);
  const [campaignMessages, setCampaignMessages] = useState<any[]>([]);

  // New campaign wizard
  const [wizardStep, setWizardStep] = useState(1);
  const [selectedTemplate, setSelectedTemplate] = useState<WaTemplate | null>(null);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [selectedPhones, setSelectedPhones] = useState<Set<string>>(new Set());
  const [createdCampaignId, setCreatedCampaignId] = useState<string | null>(null);
  const [campaignCost, setCampaignCost] = useState(0);
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<any>(null);

  // Auth helpers
  const getAuthHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session ? { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' } : null;
  };

  // ==================== DATA LOADING ====================

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/auth/login'); return; }
      setUser(user);

      const { data: m } = await supabase.from('merchants').select('*').eq('id', user.id).single();
      setMerchant(m);

      // Check WA config
      const { data: config } = await supabase.from('merchant_whatsapp_config').select('id').eq('merchant_id', user.id).single();
      setHasConfig(!!config);

      setLoading(false);
    };
    init();
  }, [router]);

  useEffect(() => {
    if (!user) return;
    loadCredits();
    loadTemplates();
    loadCampaigns();
  }, [user]);

  const loadCredits = async () => {
    if (!user) return;
    const headers = await getAuthHeaders();
    if (!headers) return;
    const res = await fetch(`/api/whatsapp/credits?merchantId=${user.id}`, { headers });
    if (res.ok) {
      const data = await res.json();
      setCredits(data.credits || 0);
    }
  };

  const loadTemplates = async () => {
    if (!user) return;
    const headers = await getAuthHeaders();
    if (!headers) return;
    const res = await fetch(`/api/whatsapp/templates?merchantId=${user.id}`, { headers });
    if (res.ok) setTemplates(await res.json());
  };

  const loadCampaigns = async () => {
    if (!user) return;
    const headers = await getAuthHeaders();
    if (!headers) return;
    const res = await fetch(`/api/whatsapp/wa-campaigns?merchantId=${user.id}`, { headers });
    if (res.ok) setCampaigns(await res.json());
  };

  const loadRecipients = async () => {
    if (!user) return;
    const { data: feedbacks } = await supabase
      .from('feedback')
      .select('customer_phone, customer_email, rating, is_positive')
      .eq('merchant_id', user.id)
      .not('customer_phone', 'is', null);

    const { data: loyaltyClients } = await supabase
      .from('loyalty_clients')
      .select('phone, name')
      .eq('merchant_id', user.id)
      .not('phone', 'is', null);

    const phoneMap = new Map<string, Recipient>();

    (feedbacks || []).forEach((f: any) => {
      if (!f.customer_phone) return;
      const existing = phoneMap.get(f.customer_phone);
      if (!existing) {
        phoneMap.set(f.customer_phone, {
          phone: f.customer_phone,
          name: f.customer_email || null,
          avg_rating: f.rating,
          total_reviews: 1,
          is_positive: f.is_positive,
        });
      } else {
        existing.total_reviews++;
        existing.avg_rating = (existing.avg_rating * (existing.total_reviews - 1) + f.rating) / existing.total_reviews;
        if (f.rating >= 4) existing.is_positive = true;
      }
    });

    (loyaltyClients || []).forEach((c: any) => {
      if (!c.phone || phoneMap.has(c.phone)) return;
      phoneMap.set(c.phone, { phone: c.phone, name: c.name, avg_rating: 0, total_reviews: 0, is_positive: false });
    });

    setRecipients(Array.from(phoneMap.values()));
  };

  // ==================== ACTIONS ====================

  const syncTemplates = async () => {
    setSyncing(true);
    const headers = await getAuthHeaders();
    if (!headers) return;
    try {
      const res = await fetch('/api/whatsapp/templates', {
        method: 'POST', headers,
        body: JSON.stringify({ action: 'sync', merchantId: user.id }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: isFr ? `${data.synced} templates synchronisés` : `${data.synced} templates synced` });
        loadTemplates();
      } else {
        setMessage({ type: 'error', text: data.error });
      }
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message });
    } finally { setSyncing(false); }
  };

  const createTemplate = async (submitToMeta: boolean) => {
    setSubmitting(true);
    const headers = await getAuthHeaders();
    if (!headers) return;

    const components: any[] = [];
    if (tplForm.headerType !== 'NONE' && tplForm.headerContent) {
      if (tplForm.headerType === 'TEXT') {
        components.push({ type: 'HEADER', format: 'TEXT', text: tplForm.headerContent });
      } else {
        components.push({ type: 'HEADER', format: tplForm.headerType, example: { header_handle: [tplForm.headerContent] } });
      }
    }
    components.push({ type: 'BODY', text: tplForm.bodyText });
    if (tplForm.footerText) components.push({ type: 'FOOTER', text: tplForm.footerText });
    if (tplForm.buttons.length > 0) {
      components.push({
        type: 'BUTTONS',
        buttons: tplForm.buttons.map(b => ({
          type: b.type, text: b.text,
          ...(b.type === 'URL' && b.url ? { url: b.url } : {}),
          ...(b.type === 'PHONE_NUMBER' && b.phone ? { phone_number: b.phone } : {}),
        })),
      });
    }

    try {
      const res = await fetch('/api/whatsapp/templates', {
        method: 'POST', headers,
        body: JSON.stringify({
          action: 'create', merchantId: user.id, submitToMeta,
          name: tplForm.name, language: tplForm.language, category: tplForm.category,
          components,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: submitToMeta ? (isFr ? 'Template soumis à Meta' : 'Template submitted to Meta') : (isFr ? 'Brouillon enregistré' : 'Draft saved') });
        setShowCreateForm(false);
        setTplForm({ name: '', language: 'fr', category: 'MARKETING', headerType: 'NONE', headerContent: '', bodyText: '', footerText: '', buttons: [] });
        loadTemplates();
      } else {
        setMessage({ type: 'error', text: data.error });
      }
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message });
    } finally { setSubmitting(false); }
  };

  const deleteTemplate = async (id: string) => {
    if (!confirm(isFr ? 'Supprimer ce template ?' : 'Delete this template?')) return;
    const headers = await getAuthHeaders();
    if (!headers) return;
    await fetch(`/api/whatsapp/templates?id=${id}&merchantId=${user.id}`, { method: 'DELETE', headers });
    loadTemplates();
  };

  const buyCredits = async (packId: string) => {
    setBuyingPack(packId);
    const headers = await getAuthHeaders();
    if (!headers) return;
    try {
      const res = await fetch('/api/whatsapp/credits', {
        method: 'POST', headers,
        body: JSON.stringify({ merchantId: user.id, packId }),
      });
      if (res.ok) {
        const data = await res.json();
        setCredits(data.credits);
        setMessage({ type: 'success', text: isFr ? 'Crédits ajoutés !' : 'Credits added!' });
      }
    } finally { setBuyingPack(null); }
  };

  const createCampaign = async () => {
    if (!selectedTemplate || selectedPhones.size === 0) return;
    const headers = await getAuthHeaders();
    if (!headers) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/whatsapp/wa-campaigns', {
        method: 'POST', headers,
        body: JSON.stringify({
          merchantId: user.id,
          templateId: selectedTemplate.id,
          name: `${selectedTemplate.name} - ${new Date().toLocaleDateString(isFr ? 'fr-FR' : 'en-US')}`,
          recipients: Array.from(selectedPhones),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setCreatedCampaignId(data.id);
        setCampaignCost(data.pricing?.total_cost || data.estimated_cost_fcfa || 0);
        setMessage({ type: 'success', text: isFr ? 'Campagne créée' : 'Campaign created' });
      } else {
        setMessage({ type: 'error', text: data.error });
      }
    } finally { setSubmitting(false); }
  };

  const sendCampaign = async () => {
    if (!createdCampaignId) return;
    setSending(true);
    const headers = await getAuthHeaders();
    if (!headers) return;
    try {
      const res = await fetch('/api/whatsapp/campaign/send', {
        method: 'POST', headers,
        body: JSON.stringify({ merchantId: user.id, campaignId: createdCampaignId }),
      });
      const data = await res.json();
      if (res.ok) {
        setSendResult(data);
        setCredits(data.creditsRemaining ?? credits);
        loadCampaigns();
      } else {
        setMessage({ type: 'error', text: data.error });
      }
    } finally { setSending(false); }
  };

  // ==================== RENDER ====================

  if (loading || !merchant) {
    return (
      <DashboardLayout merchant={merchant}>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  const TABS: { id: TabId; icon: React.ReactNode; label: string }[] = [
    { id: 'templates', icon: <FileText className="w-4 h-4" />, label: 'Templates' },
    { id: 'campaigns', icon: <BarChart3 className="w-4 h-4" />, label: isFr ? 'Campagnes' : 'Campaigns' },
    { id: 'new', icon: <Send className="w-4 h-4" />, label: isFr ? 'Nouvelle Campagne' : 'New Campaign' },
  ];

  const approvedTemplates = templates.filter(t => t.status === 'APPROVED');

  return (
    <DashboardLayout merchant={merchant}>
      <div className="space-y-6 max-w-5xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
                <Megaphone className="w-5 h-5" />
              </div>
              {isFr ? 'Campagnes WhatsApp' : 'WhatsApp Campaigns'}
            </h1>
            <p className="text-gray-500 mt-1 ml-[52px]">{isFr ? 'Envoyez des campagnes marketing via WhatsApp Business' : 'Send marketing campaigns via WhatsApp Business'}</p>
          </div>
          {/* Credits badge */}
          <div className="flex items-center gap-2 px-4 py-2 bg-teal-50 border border-teal-200 rounded-xl">
            <Coins className="w-4 h-4 text-teal-600" />
            <span className="text-sm font-bold text-teal-700">{credits}</span>
            <span className="text-xs text-teal-600">{isFr ? 'crédits' : 'credits'}</span>
          </div>
        </div>

        {/* No config banner */}
        {hasConfig === false && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800">{isFr ? 'WhatsApp Business non configuré' : 'WhatsApp Business not configured'}</p>
              <p className="text-xs text-amber-600 mt-1">{isFr ? 'Contactez l\'administrateur pour configurer vos identifiants Meta.' : 'Contact your administrator to set up your Meta credentials.'}</p>
            </div>
          </div>
        )}

        {/* Message */}
        {message && (
          <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium ${message.type === 'success' ? 'bg-teal-50 border border-teal-200 text-teal-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
            {message.type === 'success' ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
            {message.text}
            <button onClick={() => setMessage(null)} className="ml-auto"><X className="w-3.5 h-3.5" /></button>
          </div>
        )}

        {/* Credit packs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {CREDIT_PACKS.map(pack => (
            <button key={pack.id} onClick={() => buyCredits(pack.id)} disabled={buyingPack === pack.id}
              className="group relative p-3 border border-gray-200 rounded-xl hover:border-teal-300 hover:shadow-md transition-all bg-white text-left">
              <span className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-teal-500 to-emerald-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
              <p className="text-lg font-bold text-gray-900">{pack.credits}</p>
              <p className="text-xs text-gray-500">{isFr ? 'crédits' : 'credits'}</p>
              <p className="text-sm font-semibold text-teal-600 mt-1">{pack.price_fcfa.toLocaleString()} FCFA</p>
              {buyingPack === pack.id && <Loader2 className="w-4 h-4 text-teal-600 animate-spin absolute top-3 right-3" />}
            </button>
          ))}
        </div>

        {/* Tabs */}
        <nav className="flex gap-1 border-b-2 border-gray-100">
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => { setActiveTab(tab.id); setMessage(null); if (tab.id === 'new') { setWizardStep(1); setCreatedCampaignId(null); setSendResult(null); loadRecipients(); } }}
              className={`relative flex items-center gap-2 px-5 py-3 text-sm font-medium transition-all rounded-t-lg ${activeTab === tab.id ? 'text-teal-600' : 'text-gray-500 hover:text-teal-700 hover:bg-teal-50/50'}`}>
              {tab.icon} <span>{tab.label}</span>
              <span className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-teal-500 to-emerald-500 transition-transform duration-300 origin-left ${activeTab === tab.id ? 'scale-x-100' : 'scale-x-0'}`} />
            </button>
          ))}
        </nav>

        {/* ==================== TAB: TEMPLATES ==================== */}
        {activeTab === 'templates' && (
          <div className="space-y-5">
            <div className="flex gap-3">
              <Button onClick={syncTemplates} disabled={syncing || !hasConfig} variant="outline" className="gap-2">
                <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                {isFr ? 'Synchroniser depuis Meta' : 'Sync from Meta'}
              </Button>
              <Button onClick={() => setShowCreateForm(true)} disabled={!hasConfig} className="gap-2 bg-teal-600 hover:bg-teal-700 text-white">
                <Plus className="w-4 h-4" />
                {isFr ? 'Créer un template' : 'Create template'}
              </Button>
            </div>

            {/* Template creation form */}
            {showCreateForm && (
              <Card className="p-6 border border-gray-200 rounded-xl space-y-4">
                <h3 className="font-semibold text-gray-900">{isFr ? 'Nouveau Template' : 'New Template'}</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{isFr ? 'Nom (minuscules, _)' : 'Name (lowercase, _)'}</label>
                    <input value={tplForm.name} onChange={e => setTplForm({ ...tplForm, name: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_') })} placeholder="promo_ete_2025" className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{isFr ? 'Langue' : 'Language'}</label>
                    <select value={tplForm.language} onChange={e => setTplForm({ ...tplForm, language: e.target.value })} className={inputClass}>
                      {['fr', 'en', 'es', 'pt', 'de', 'it', 'ar', 'th'].map(l => <option key={l} value={l}>{l.toUpperCase()}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{isFr ? 'Catégorie' : 'Category'}</label>
                    <select value={tplForm.category} onChange={e => setTplForm({ ...tplForm, category: e.target.value })} className={inputClass}>
                      <option value="MARKETING">Marketing</option>
                      <option value="UTILITY">{isFr ? 'Utilitaire' : 'Utility'}</option>
                    </select>
                  </div>
                </div>

                {/* Header */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Header</label>
                  <div className="flex gap-2 mb-2">
                    {['NONE', 'TEXT', 'IMAGE', 'VIDEO'].map(h => (
                      <button key={h} onClick={() => setTplForm({ ...tplForm, headerType: h, headerContent: '' })}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${tplForm.headerType === h ? 'bg-teal-100 text-teal-700 border border-teal-300' : 'bg-gray-100 text-gray-600 border border-gray-200'}`}>
                        {h === 'NONE' ? (isFr ? 'Aucun' : 'None') : h === 'TEXT' ? <Type className="w-3 h-3 inline" /> : h === 'IMAGE' ? <ImageIcon className="w-3 h-3 inline" /> : <Video className="w-3 h-3 inline" />}
                        {h !== 'NONE' && <span className="ml-1">{h}</span>}
                      </button>
                    ))}
                  </div>
                  {tplForm.headerType !== 'NONE' && (
                    <input value={tplForm.headerContent} onChange={e => setTplForm({ ...tplForm, headerContent: e.target.value })}
                      placeholder={tplForm.headerType === 'TEXT' ? (isFr ? 'Texte du header...' : 'Header text...') : 'URL du média...'}
                      className={inputClass} />
                  )}
                </div>

                {/* Body */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Body *</label>
                  <textarea value={tplForm.bodyText} onChange={e => setTplForm({ ...tplForm, bodyText: e.target.value })} rows={4}
                    placeholder={isFr ? 'Bonjour {{1}}, découvrez notre offre...' : 'Hello {{1}}, check out our offer...'} className={inputClass} />
                  <p className="text-xs text-gray-400 mt-1">{isFr ? 'Utilisez {{1}}, {{2}} pour les variables' : 'Use {{1}}, {{2}} for variables'}</p>
                </div>

                {/* Footer */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Footer ({isFr ? 'optionnel' : 'optional'})</label>
                  <input value={tplForm.footerText} onChange={e => setTplForm({ ...tplForm, footerText: e.target.value })} placeholder={isFr ? 'Texte du footer...' : 'Footer text...'} className={inputClass} />
                </div>

                {/* Buttons */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">{isFr ? 'Boutons' : 'Buttons'} ({tplForm.buttons.length}/3)</label>
                    {tplForm.buttons.length < 3 && (
                      <button onClick={() => setTplForm({ ...tplForm, buttons: [...tplForm.buttons, { type: 'URL', text: '', url: '', phone: '' }] })}
                        className="text-xs text-teal-600 hover:text-teal-700 font-medium">+ {isFr ? 'Ajouter' : 'Add'}</button>
                    )}
                  </div>
                  {tplForm.buttons.map((btn, i) => (
                    <div key={i} className="flex gap-2 mb-2 items-center">
                      <select value={btn.type} onChange={e => { const btns = [...tplForm.buttons]; btns[i] = { ...btn, type: e.target.value }; setTplForm({ ...tplForm, buttons: btns }); }}
                        className="px-2 py-2 border border-gray-300 rounded-lg text-xs bg-gray-50 w-32">
                        <option value="URL">URL</option>
                        <option value="PHONE_NUMBER">{isFr ? 'Téléphone' : 'Phone'}</option>
                        <option value="QUICK_REPLY">{isFr ? 'Réponse rapide' : 'Quick Reply'}</option>
                      </select>
                      <input value={btn.text} onChange={e => { const btns = [...tplForm.buttons]; btns[i] = { ...btn, text: e.target.value }; setTplForm({ ...tplForm, buttons: btns }); }}
                        placeholder={isFr ? 'Texte du bouton' : 'Button text'} className="flex-1 px-2 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50" />
                      {btn.type === 'URL' && (
                        <input value={btn.url} onChange={e => { const btns = [...tplForm.buttons]; btns[i] = { ...btn, url: e.target.value }; setTplForm({ ...tplForm, buttons: btns }); }}
                          placeholder="https://..." className="flex-1 px-2 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50" />
                      )}
                      {btn.type === 'PHONE_NUMBER' && (
                        <input value={btn.phone} onChange={e => { const btns = [...tplForm.buttons]; btns[i] = { ...btn, phone: e.target.value }; setTplForm({ ...tplForm, buttons: btns }); }}
                          placeholder="+33..." className="flex-1 px-2 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50" />
                      )}
                      <button onClick={() => setTplForm({ ...tplForm, buttons: tplForm.buttons.filter((_, j) => j !== i) })} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <Button variant="outline" onClick={() => setShowCreateForm(false)}>{isFr ? 'Annuler' : 'Cancel'}</Button>
                  <Button variant="outline" disabled={submitting || !tplForm.name || !tplForm.bodyText} onClick={() => createTemplate(false)}>
                    {isFr ? 'Enregistrer brouillon' : 'Save draft'}
                  </Button>
                  <Button disabled={submitting || !tplForm.name || !tplForm.bodyText} onClick={() => createTemplate(true)} className="bg-teal-600 hover:bg-teal-700 text-white gap-2">
                    {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                    {isFr ? 'Soumettre à Meta' : 'Submit to Meta'}
                  </Button>
                </div>
              </Card>
            )}

            {/* Template list */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {templates.map(tpl => (
                <Card key={tpl.id} className="group relative p-4 border border-gray-200 rounded-xl overflow-hidden hover:border-gray-300 hover:shadow-md transition-all">
                  <span className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-teal-500 to-emerald-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-gray-900 text-sm font-mono">{tpl.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[tpl.status] || STATUS_COLORS.DRAFT}`}>{tpl.status}</span>
                        <span className="text-xs text-gray-400">{tpl.language.toUpperCase()}</span>
                        <span className="text-xs text-gray-400">{tpl.category}</span>
                      </div>
                    </div>
                    <button onClick={() => deleteTemplate(tpl.id)} className="text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                  </div>
                  {tpl.components && (
                    <p className="text-xs text-gray-500 mt-2 line-clamp-2">
                      {Array.isArray(tpl.components) ? tpl.components.find((c: any) => c.type === 'BODY')?.text || '' : ''}
                    </p>
                  )}
                  {tpl.rejection_reason && <p className="text-xs text-red-500 mt-1">{tpl.rejection_reason}</p>}
                </Card>
              ))}
              {templates.length === 0 && (
                <div className="col-span-2 text-center py-12 text-gray-400">
                  <FileText className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                  <p>{isFr ? 'Aucun template. Synchronisez depuis Meta ou créez-en un.' : 'No templates. Sync from Meta or create one.'}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==================== TAB: CAMPAIGNS ==================== */}
        {activeTab === 'campaigns' && (
          <div className="space-y-4">
            {campaigns.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <BarChart3 className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                <p>{isFr ? 'Aucune campagne envoyée.' : 'No campaigns sent.'}</p>
              </div>
            ) : (
              <div className="group relative border border-gray-200 rounded-xl overflow-hidden bg-white">
                <span className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-teal-500 to-emerald-500" />
                <table className="w-full">
                  <thead><tr className="bg-gray-50/80">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{isFr ? 'Nom' : 'Name'}</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Template</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{isFr ? 'Dest.' : 'Recip.'}</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{isFr ? 'Coût' : 'Cost'}</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{isFr ? 'Envoyés' : 'Sent'}</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
                  </tr></thead>
                  <tbody className="divide-y divide-gray-100">
                    {campaigns.map(c => (
                      <tr key={c.id} className="hover:bg-teal-50/30 transition-colors cursor-pointer" onClick={() => setExpandedCampaign(expandedCampaign === c.id ? null : c.id)}>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{c.name}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 font-mono">{c.template_name || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{c.total_recipients}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{(c.actual_cost_fcfa || c.estimated_cost_fcfa || 0).toLocaleString()} F</td>
                        <td className="px-4 py-3 text-sm">
                          <span className="text-green-600">{c.total_sent || c.send_count || 0}</span>
                          {(c.total_failed || 0) > 0 && <span className="text-red-500 ml-1">/ {c.total_failed} ✗</span>}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">{c.last_sent_at ? new Date(c.last_sent_at).toLocaleDateString(isFr ? 'fr-FR' : 'en-US') : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ==================== TAB: NEW CAMPAIGN ==================== */}
        {activeTab === 'new' && (
          <div className="space-y-5">
            {/* Step indicator */}
            <div className="flex items-center gap-2">
              {[1, 2, 3].map(s => (
                <React.Fragment key={s}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${wizardStep >= s ? 'bg-teal-600 text-white' : 'bg-gray-200 text-gray-500'}`}>{s}</div>
                  {s < 3 && <div className={`flex-1 h-0.5 ${wizardStep > s ? 'bg-teal-500' : 'bg-gray-200'}`} />}
                </React.Fragment>
              ))}
            </div>

            {/* Step 1: Select template */}
            {wizardStep === 1 && (
              <Card className="p-6 border border-gray-200 rounded-xl space-y-4">
                <h3 className="font-semibold text-gray-900">{isFr ? '1. Sélectionnez un template approuvé' : '1. Select an approved template'}</h3>
                {approvedTemplates.length === 0 ? (
                  <p className="text-sm text-gray-500">{isFr ? 'Aucun template approuvé. Créez et soumettez un template dans l\'onglet Templates.' : 'No approved templates. Create and submit one in the Templates tab.'}</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {approvedTemplates.map(tpl => (
                      <button key={tpl.id} onClick={() => setSelectedTemplate(tpl)}
                        className={`p-4 rounded-xl border-2 text-left transition-all ${selectedTemplate?.id === tpl.id ? 'border-teal-500 bg-teal-50' : 'border-gray-200 hover:border-gray-300'}`}>
                        <p className="font-semibold text-sm text-gray-900 font-mono">{tpl.name}</p>
                        <p className="text-xs text-gray-500 mt-1">{tpl.language.toUpperCase()} · {tpl.category}</p>
                        {tpl.components && (
                          <p className="text-xs text-gray-400 mt-2 line-clamp-2">
                            {Array.isArray(tpl.components) ? tpl.components.find((c: any) => c.type === 'BODY')?.text : ''}
                          </p>
                        )}
                      </button>
                    ))}
                  </div>
                )}
                <div className="flex justify-end">
                  <Button disabled={!selectedTemplate} onClick={() => { setWizardStep(2); loadRecipients(); }} className="bg-teal-600 hover:bg-teal-700 text-white gap-2">
                    {isFr ? 'Suivant' : 'Next'} <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            )}

            {/* Step 2: Select recipients */}
            {wizardStep === 2 && (
              <Card className="p-6 border border-gray-200 rounded-xl space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">{isFr ? '2. Sélectionnez les destinataires' : '2. Select recipients'}</h3>
                  <span className="text-sm text-teal-600 font-medium">{selectedPhones.size} {isFr ? 'sélectionnés' : 'selected'}</span>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setSelectedPhones(new Set(recipients.map(r => r.phone)))}>
                    {isFr ? 'Tout sélectionner' : 'Select all'} ({recipients.length})
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setSelectedPhones(new Set(recipients.filter(r => r.is_positive).map(r => r.phone)))}>
                    <Star className="w-3.5 h-3.5 mr-1 text-amber-500" /> {isFr ? 'Positifs (4-5★)' : 'Positive (4-5★)'}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setSelectedPhones(new Set())}>{isFr ? 'Désélectionner' : 'Deselect'}</Button>
                </div>
                <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
                  <table className="w-full">
                    <thead><tr className="bg-gray-50 sticky top-0">
                      <th className="px-3 py-2 w-10"></th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500">{isFr ? 'Numéro' : 'Number'}</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500">{isFr ? 'Note' : 'Rating'}</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500">{isFr ? 'Avis' : 'Reviews'}</th>
                    </tr></thead>
                    <tbody className="divide-y divide-gray-100">
                      {recipients.map(r => (
                        <tr key={r.phone} className="hover:bg-gray-50">
                          <td className="px-3 py-2">
                            <input type="checkbox" checked={selectedPhones.has(r.phone)}
                              onChange={() => { const s = new Set(selectedPhones); s.has(r.phone) ? s.delete(r.phone) : s.add(r.phone); setSelectedPhones(s); }}
                              className="rounded border-gray-300 text-teal-600 focus:ring-teal-500" />
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-700 font-mono">{r.phone}</td>
                          <td className="px-3 py-2 text-sm">
                            {r.total_reviews > 0 ? <span className="flex items-center gap-1">{r.avg_rating.toFixed(1)} <Star className="w-3 h-3 text-amber-400 fill-amber-400" /></span> : '-'}
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-600">{r.total_reviews}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setWizardStep(1)}>{isFr ? 'Retour' : 'Back'}</Button>
                  <Button disabled={selectedPhones.size === 0} onClick={() => setWizardStep(3)} className="bg-teal-600 hover:bg-teal-700 text-white gap-2">
                    {isFr ? 'Suivant' : 'Next'} <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            )}

            {/* Step 3: Summary & Send */}
            {wizardStep === 3 && (
              <Card className="p-6 border border-gray-200 rounded-xl space-y-5">
                <h3 className="font-semibold text-gray-900">{isFr ? '3. Récapitulatif & Envoi' : '3. Summary & Send'}</h3>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-3 bg-gray-50 rounded-lg text-center">
                    <p className="text-xs text-gray-500">Template</p>
                    <p className="text-sm font-semibold text-gray-900 font-mono">{selectedTemplate?.name}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg text-center">
                    <p className="text-xs text-gray-500">{isFr ? 'Destinataires' : 'Recipients'}</p>
                    <p className="text-xl font-bold text-gray-900">{selectedPhones.size}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg text-center">
                    <p className="text-xs text-gray-500">{isFr ? 'Coût estimé' : 'Estimated cost'}</p>
                    <p className="text-xl font-bold text-teal-700">{(selectedPhones.size * 50).toLocaleString()} F</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg text-center">
                    <p className="text-xs text-gray-500">{isFr ? 'Crédits disponibles' : 'Available credits'}</p>
                    <p className={`text-xl font-bold ${credits >= selectedPhones.size ? 'text-green-600' : 'text-red-600'}`}>{credits}</p>
                  </div>
                </div>

                {credits < selectedPhones.size && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    <p className="text-sm text-red-700">{isFr ? `Crédits insuffisants. Il vous manque ${selectedPhones.size - credits} crédits.` : `Insufficient credits. You need ${selectedPhones.size - credits} more.`}</p>
                  </div>
                )}

                {sendResult && (
                  <div className="p-4 bg-teal-50 border border-teal-200 rounded-lg space-y-2">
                    <p className="text-sm font-semibold text-teal-800">{isFr ? 'Campagne envoyée !' : 'Campaign sent!'}</p>
                    <div className="flex gap-4 text-sm">
                      <span className="text-green-700">✓ {sendResult.sent} {isFr ? 'envoyés' : 'sent'}</span>
                      {sendResult.failed > 0 && <span className="text-red-600">✗ {sendResult.failed} {isFr ? 'échoués' : 'failed'}</span>}
                      <span className="text-gray-600">{isFr ? 'Crédits restants' : 'Credits remaining'}: {sendResult.creditsRemaining}</span>
                    </div>
                  </div>
                )}

                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setWizardStep(2)}>{isFr ? 'Retour' : 'Back'}</Button>
                  <div className="flex gap-3">
                    {!createdCampaignId && (
                      <Button disabled={submitting || credits < selectedPhones.size} onClick={createCampaign} className="bg-teal-600 hover:bg-teal-700 text-white gap-2">
                        {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                        {isFr ? 'Créer la campagne' : 'Create campaign'}
                      </Button>
                    )}
                    {createdCampaignId && !sendResult && (
                      <Button disabled={sending} onClick={sendCampaign} className="bg-green-600 hover:bg-green-700 text-white gap-2">
                        {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        {isFr ? 'Envoyer la campagne' : 'Send campaign'}
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
