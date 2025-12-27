'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/atoms/Input';
import { Prize } from '@/lib/types/database';
import { Plus, Trash2, AlertCircle, Upload, Image as ImageIcon, Info, Percent, TrendingUp } from 'lucide-react';

export default function PrizesPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [merchant, setMerchant] = useState<any>(null);
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    probability: 10,
  });
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [uploading, setUploading] = useState(false);

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
      fetchPrizes(user.id);
    };

    checkAuth();
  }, [router]);

  const fetchPrizes = async (merchantId: string) => {
    const { data } = await supabase
      .from('prizes')
      .select('*')
      .eq('merchant_id', merchantId)
      .order('created_at', { ascending: false });

    setPrizes(data || []);
  };

  const uploadImage = async (file: File) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}-${Date.now()}.${fileExt}`;
    const filePath = `prizes/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('merchant-assets')
      .upload(filePath, file, { 
        cacheControl: '3600',
        upsert: true 
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw new Error(uploadError.message || 'Failed to upload image');
    }

    const { data: { publicUrl } } = supabase.storage
      .from('merchant-assets')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setUploading(true);

    try {
      let imageUrl = null;
      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
      }

      const { error } = await supabase.from('prizes').insert({
        merchant_id: user.id,
        name: formData.name,
        description: formData.description,
        probability: formData.probability,
        image_url: imageUrl,
      });

      if (error) throw error;

      setShowForm(false);
      setFormData({ name: '', description: '', probability: 10 });
      setImageFile(null);
      setImagePreview('');
      fetchPrizes(user.id);
    } catch (error: any) {
      alert(error.message || 'Failed to add prize');
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  const handleDelete = async (prizeId: string) => {
    if (!confirm('Are you sure you want to delete this prize?')) return;

    await supabase.from('prizes').delete().eq('id', prizeId);
    fetchPrizes(user.id);
  };

  const totalProbability = prizes.reduce((sum, p) => sum + p.probability, 0);

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

  const remainingProbability = 100 - totalProbability;
  const getChanceDescription = (prob: number) => {
    if (prob >= 50) return { text: 'Très fréquent', color: 'text-green-600', bg: 'bg-green-50' };
    if (prob >= 25) return { text: 'Fréquent', color: 'text-blue-600', bg: 'bg-blue-50' };
    if (prob >= 10) return { text: 'Moyen', color: 'text-yellow-600', bg: 'bg-yellow-50' };
    if (prob >= 5) return { text: 'Rare', color: 'text-orange-600', bg: 'bg-orange-50' };
    return { text: 'Très rare', color: 'text-red-600', bg: 'bg-red-50' };
  };

  return (
    <DashboardLayout merchant={merchant}>
      <div className="space-y-6">
        {/* Header with Probability Overview */}
        <div className="flex flex-col lg:flex-row justify-between items-start gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">🎁 Gestion des Prix</h1>
            <p className="text-gray-600">Configurez vos prix et leurs probabilités pour la roue</p>
          </div>
          <Button 
            onClick={() => setShowForm(!showForm)} 
            className="gap-2 bg-teal-600 hover:bg-teal-700"
          >
            {showForm ? (
              <>
                <span>Annuler</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span>Ajouter un Prix</span>
              </>
            )}
          </Button>
        </div>

        {/* Probability Calculator Card */}
        <Card className="p-6 bg-gradient-to-r from-teal-50 to-blue-50 border-teal-200">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 bg-teal-600 rounded-full flex items-center justify-center flex-shrink-0">
              <Percent className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Calculateur de Probabilités</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="bg-white rounded-lg p-4 border-2 border-teal-200">
                  <p className="text-sm text-gray-600 mb-1">Total configuré</p>
                  <p className="text-3xl font-bold text-teal-600">{totalProbability}%</p>
                </div>
                <div className={`rounded-lg p-4 border-2 ${
                  remainingProbability === 0 ? 'bg-green-50 border-green-200' : 
                  remainingProbability > 0 ? 'bg-yellow-50 border-yellow-200' : 
                  'bg-red-50 border-red-200'
                }`}>
                  <p className="text-sm text-gray-600 mb-1">Restant</p>
                  <p className={`text-3xl font-bold ${
                    remainingProbability === 0 ? 'text-green-600' : 
                    remainingProbability > 0 ? 'text-yellow-600' : 
                    'text-red-600'
                  }`}>{remainingProbability}%</p>
                </div>
                <div className="bg-white rounded-lg p-4 border-2 border-gray-200">
                  <p className="text-sm text-gray-600 mb-1">Nombre de prix</p>
                  <p className="text-3xl font-bold text-gray-900">{prizes.length}</p>
                </div>
              </div>
              
              {/* Probability Examples */}
              <div className="bg-white rounded-lg p-4 border border-teal-200">
                <div className="flex items-center gap-2 mb-3">
                  <Info className="w-5 h-5 text-teal-600" />
                  <h4 className="font-semibold text-gray-900">💡 Exemples de probabilités</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center font-bold text-green-700">50%</div>
                    <div>
                      <p className="font-medium text-gray-900">1 chance sur 2</p>
                      <p className="text-gray-600">Gagné tous les 2 tours en moyenne</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center font-bold text-blue-700">25%</div>
                    <div>
                      <p className="font-medium text-gray-900">1 chance sur 4</p>
                      <p className="text-gray-600">Gagné tous les 4 tours en moyenne</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center font-bold text-yellow-700">10%</div>
                    <div>
                      <p className="font-medium text-gray-900">1 chance sur 10</p>
                      <p className="text-gray-600">Gagné tous les 10 tours en moyenne</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center font-bold text-red-700">5%</div>
                    <div>
                      <p className="font-medium text-gray-900">1 chance sur 20</p>
                      <p className="text-gray-600">Gagné tous les 20 tours en moyenne</p>
                    </div>
                  </div>
                </div>
              </div>

              {totalProbability !== 100 && (
                <div className="mt-4 flex items-center gap-2 text-orange-700 bg-orange-50 border border-orange-200 rounded-lg p-3">
                  <AlertCircle className="w-5 h-5" />
                  <span className="font-medium">
                    {remainingProbability > 0 
                      ? `Il reste ${remainingProbability}% à distribuer pour atteindre 100%` 
                      : `Vous avez dépassé de ${Math.abs(remainingProbability)}% ! Ajustez vos probabilités.`
                    }
                  </span>
                </div>
              )}
            </div>
          </div>
        </Card>

        {showForm && (
          <Card className="p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-6">✨ Ajouter un Nouveau Prix</h3>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Prize Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Photo du Prix
                </label>
                {imagePreview ? (
                  <div className="relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden border-2 border-teal-200">
                    <img src={imagePreview} alt="Prize preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => {
                        setImageFile(null);
                        setImagePreview('');
                      }}
                      className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-teal-500 transition-colors">
                    <input
                      type="file"
                      id="prize-image"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                    <label htmlFor="prize-image" className="cursor-pointer">
                      <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-sm text-gray-600 mb-1">
                        <span className="text-teal-600 font-semibold">Cliquez pour uploader</span> ou glissez-déposez
                      </p>
                      <p className="text-xs text-gray-500">PNG, JPG jusqu'à 5MB</p>
                    </label>
                  </div>
                )}
              </div>

              <Input
                label="Nom du Prix"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Réduction de 10%"
                required
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Obtenez 10% de réduction sur votre prochain achat"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  rows={3}
                />
              </div>

              {/* Probability Slider */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Probabilité de Gain
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-teal-600">{formData.probability}%</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${getChanceDescription(formData.probability).bg} ${getChanceDescription(formData.probability).color} font-medium`}>
                      {getChanceDescription(formData.probability).text}
                    </span>
                  </div>
                </div>
                
                <input
                  type="range"
                  min="1"
                  max="100"
                  step="1"
                  value={formData.probability}
                  onChange={(e) => setFormData({ ...formData, probability: parseFloat(e.target.value) })}
                  className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
                />
                
                <div className="flex justify-between text-xs text-gray-500 mt-2">
                  <span>1% (Très rare)</span>
                  <span>50% (Moyen)</span>
                  <span>100% (Garanti)</span>
                </div>

                <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800">
                    💡 <strong>1 chance sur {Math.round(100 / formData.probability)}</strong> de gagner ce prix
                    {formData.probability >= 10 && ` (environ tous les ${Math.round(100 / formData.probability)} tours)`}
                  </p>
                </div>
              </div>

              <Button 
                type="submit" 
                disabled={loading || uploading} 
                className="w-full bg-teal-600 hover:bg-teal-700"
              >
                {uploading ? 'Upload en cours...' : loading ? 'Ajout...' : 'Ajouter le Prix'}
              </Button>
            </form>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {prizes.map((prize) => {
            const chanceInfo = getChanceDescription(prize.probability);
            return (
              <Card key={prize.id} className="overflow-hidden hover:shadow-xl transition-all border-2 hover:border-teal-300">
                {/* Prize Image */}
                {prize.image_url ? (
                  <div className="relative h-48 bg-gradient-to-br from-teal-100 to-blue-100">
                    <img 
                      src={prize.image_url} 
                      alt={prize.name} 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 right-3">
                      <div className={`px-3 py-1.5 ${chanceInfo.bg} ${chanceInfo.color} rounded-full font-bold text-sm shadow-lg`}>
                        {prize.probability}%
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-48 bg-gradient-to-br from-teal-100 to-blue-100 flex items-center justify-center relative">
                    <span className="text-6xl">🎁</span>
                    <div className="absolute top-3 right-3">
                      <div className={`px-3 py-1.5 ${chanceInfo.bg} ${chanceInfo.color} rounded-full font-bold text-sm shadow-lg`}>
                        {prize.probability}%
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="p-5">
                  <div className="mb-3">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{prize.name}</h3>
                    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${chanceInfo.bg} ${chanceInfo.color}`}>
                      <TrendingUp className="w-3 h-3" />
                      {chanceInfo.text} • 1/{Math.round(100 / prize.probability)}
                    </div>
                  </div>
                  
                  {prize.description && (
                    <p className="text-gray-600 mb-4 text-sm line-clamp-2">{prize.description}</p>
                  )}
                  
                  <Button
                    onClick={() => handleDelete(prize.id)}
                    variant="outline"
                    className="w-full text-red-600 border-red-600 hover:bg-red-50 gap-2 mt-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Supprimer
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>

        {prizes.length === 0 && !showForm && (
          <Card className="p-12 bg-gradient-to-br from-gray-50 to-teal-50">
            <div className="text-center">
              <div className="w-20 h-20 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-5xl">🎁</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Aucun prix configuré</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Ajoutez votre premier prix pour commencer à configurer votre roue de la chance !
              </p>
              <Button onClick={() => setShowForm(true)} className="gap-2 bg-teal-600 hover:bg-teal-700">
                <Plus className="w-4 h-4" />
                Ajouter mon Premier Prix
              </Button>
            </div>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
