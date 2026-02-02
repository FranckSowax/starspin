'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, X, Loader2, Globe, Bell, Shield } from 'lucide-react';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { useTranslation } from 'react-i18next';
import '@/lib/i18n/config';

export default function SettingsPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [merchant, setMerchant] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Settings state
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [newReviewAlert, setNewReviewAlert] = useState(true);
  const [weeklySummary, setWeeklySummary] = useState(false);
  const [timezone, setTimezone] = useState('Africa/Libreville');

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
      if (merchantData?.timezone) setTimezone(merchantData.timezone);
      if (merchantData?.email_notifications !== undefined) setEmailNotifications(merchantData.email_notifications);
      if (merchantData?.new_review_alert !== undefined) setNewReviewAlert(merchantData.new_review_alert);
      if (merchantData?.weekly_summary !== undefined) setWeeklySummary(merchantData.weekly_summary);
    };

    checkAuth();
  }, [router]);

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    setMessage(null);

    try {
      const { error } = await supabase
        .from('merchants')
        .update({
          timezone,
          email_notifications: emailNotifications,
          new_review_alert: newReviewAlert,
          weekly_summary: weeklySummary,
        })
        .eq('id', user.id);

      if (error) throw error;

      setMessage({ type: 'success', text: 'Settings saved successfully!' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to save settings' });
    } finally {
      setSaving(false);
    }
  };

  if (!user || !merchant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout merchant={merchant}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('dashboard.nav.settings')}</h1>
          <p className="text-gray-600">General application settings</p>
        </div>

        {message && (
          <Card className={`p-4 ${
            message.type === 'success' ? 'bg-teal-50 border-teal-200' : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-start gap-2">
              {message.type === 'success' ? (
                <Check className="w-5 h-5 text-teal-600 mt-0.5" />
              ) : (
                <X className="w-5 h-5 text-red-600 mt-0.5" />
              )}
              <p className={`font-medium ${
                message.type === 'success' ? 'text-teal-700' : 'text-red-700'
              }`}>
                {message.text}
              </p>
            </div>
          </Card>
        )}

        {/* Language & Region */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <Globe className="w-6 h-6 text-teal-600" />
            <h3 className="text-lg font-semibold text-gray-900">Language & Region</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Application Language</label>
              <LanguageSwitcher variant="dark" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white"
              >
                <option value="Africa/Libreville">Africa/Libreville (UTC+1)</option>
                <option value="Africa/Lagos">Africa/Lagos (UTC+1)</option>
                <option value="Africa/Douala">Africa/Douala (UTC+1)</option>
                <option value="Africa/Kinshasa">Africa/Kinshasa (UTC+1)</option>
                <option value="Africa/Brazzaville">Africa/Brazzaville (UTC+1)</option>
                <option value="Europe/Paris">Europe/Paris (UTC+1/+2)</option>
                <option value="Europe/London">Europe/London (UTC+0/+1)</option>
                <option value="America/New_York">America/New_York (UTC-5/-4)</option>
                <option value="Asia/Bangkok">Asia/Bangkok (UTC+7)</option>
                <option value="Asia/Shanghai">Asia/Shanghai (UTC+8)</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Notifications */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <Bell className="w-6 h-6 text-teal-600" />
            <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
          </div>

          <div className="space-y-4">
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <p className="text-sm font-medium text-gray-900">Email Notifications</p>
                <p className="text-xs text-gray-500">Receive notifications by email</p>
              </div>
              <div className="relative">
                <input
                  type="checkbox"
                  checked={emailNotifications}
                  onChange={(e) => setEmailNotifications(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-teal-600 transition-colors"></div>
                <div className="absolute left-[2px] top-[2px] w-5 h-5 bg-white rounded-full shadow peer-checked:translate-x-5 transition-transform"></div>
              </div>
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <p className="text-sm font-medium text-gray-900">New Review Alerts</p>
                <p className="text-xs text-gray-500">Get notified when a customer leaves a review</p>
              </div>
              <div className="relative">
                <input
                  type="checkbox"
                  checked={newReviewAlert}
                  onChange={(e) => setNewReviewAlert(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-teal-600 transition-colors"></div>
                <div className="absolute left-[2px] top-[2px] w-5 h-5 bg-white rounded-full shadow peer-checked:translate-x-5 transition-transform"></div>
              </div>
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <p className="text-sm font-medium text-gray-900">Weekly Summary</p>
                <p className="text-xs text-gray-500">Receive a weekly performance summary</p>
              </div>
              <div className="relative">
                <input
                  type="checkbox"
                  checked={weeklySummary}
                  onChange={(e) => setWeeklySummary(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-teal-600 transition-colors"></div>
                <div className="absolute left-[2px] top-[2px] w-5 h-5 bg-white rounded-full shadow peer-checked:translate-x-5 transition-transform"></div>
              </div>
            </label>
          </div>
        </Card>

        {/* Account Security */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="w-6 h-6 text-teal-600" />
            <h3 className="text-lg font-semibold text-gray-900">Account</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <p className="text-sm text-gray-600 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                {user.email}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Account ID</label>
              <p className="text-xs text-gray-500 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg font-mono">
                {user.id}
              </p>
            </div>
          </div>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-teal-600 hover:bg-teal-700"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Settings'
            )}
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
