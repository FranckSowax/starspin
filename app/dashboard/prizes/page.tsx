'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/atoms/Input';
import { Prize } from '@/lib/types/database';
import { Plus, Trash2, AlertCircle, Upload, Image as ImageIcon, Info, Percent, TrendingUp, Pencil, X, Ban, RefreshCw, Lock } from 'lucide-react';
import { WheelPreview, PrizeWithQuantity } from '@/components/dashboard/WheelPreview';

// Special segment types that are always present on the wheel
const SPECIAL_SEGMENTS = {
  UNLUCKY: 'unlucky',
  RETRY: 'retry',
} as const;

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
  
  // Segment quantities for the wheel (max 8 total segments)
  const MAX_SEGMENTS = 8;
  const [prizeQuantities, setPrizeQuantities] = useState<Record<string, number>>({});
  const [unluckyQuantity, setUnluckyQuantity] = useState(1);
  const [retryQuantity, setRetryQuantity] = useState(1);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [migrationNeeded, setMigrationNeeded] = useState(false);

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
      
      // Load segment quantities from merchant data (or use defaults)
      if (merchantData?.unlucky_quantity !== undefined) {
        setUnluckyQuantity(merchantData.unlucky_quantity);
      }
      if (merchantData?.retry_quantity !== undefined) {
        setRetryQuantity(merchantData.retry_quantity);
      }
      if (merchantData?.prize_quantities) {
        setPrizeQuantities(merchantData.prize_quantities);
      }
      
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
      } else if (editingId) {
        // Keep existing image if editing and no new file selected
        const existingPrize = prizes.find(p => p.id === editingId);
        imageUrl = existingPrize?.image_url;
      }

      const prizeData = {
        merchant_id: user.id,
        name: formData.name,
        description: formData.description,
        probability: formData.probability,
        image_url: imageUrl,
      };

      if (editingId) {
        const { error } = await supabase
          .from('prizes')
          .update(prizeData)
          .eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('prizes')
          .insert(prizeData);
        if (error) throw error;
      }

      setShowForm(false);
      setEditingId(null);
      setFormData({ name: '', description: '', probability: 10 });
      setImageFile(null);
      setImagePreview('');
      fetchPrizes(user.id);
    } catch (error: any) {
      alert(error.message || 'Failed to save prize');
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  const handleEdit = (prize: Prize) => {
    setFormData({
      name: prize.name,
      description: prize.description || '',
      probability: prize.probability,
    });
    setEditingId(prize.id);
    setImagePreview(prize.image_url || '');
    setShowForm(true);
    // Scroll to top to see form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({ name: '', description: '', probability: 10 });
    setImageFile(null);
    setImagePreview('');
  };

  const handleDelete = async (prizeId: string) => {
    if (!confirm('Are you sure you want to delete this prize?')) return;

    await supabase.from('prizes').delete().eq('id', prizeId);
    fetchPrizes(user.id);
  };

  // Calculate total segments used
  const totalPrizeSegments = Object.values(prizeQuantities).reduce((sum, qty) => sum + qty, 0);
  const totalSegments = totalPrizeSegments + unluckyQuantity + retryQuantity;
  const remainingSegments = MAX_SEGMENTS - totalSegments;
  
  // Build prize quantities array for WheelPreview
  const prizeQuantitiesArray: PrizeWithQuantity[] = prizes.map(prize => ({
    prize,
    quantity: prizeQuantities[prize.id] || 0
  }));
  
  // Update prize quantity
  const updatePrizeQuantity = (prizeId: string, delta: number) => {
    const currentQty = prizeQuantities[prizeId] || 0;
    const newQty = Math.max(0, currentQty + delta);
    
    // Check if we can add more segments
    if (delta > 0 && totalSegments >= MAX_SEGMENTS) {
      return; // Can't add more
    }
    
    setPrizeQuantities(prev => ({
      ...prev,
      [prizeId]: newQty
    }));
  };
  
  // Update special segment quantity
  const updateUnluckyQuantity = (delta: number) => {
    const newQty = Math.max(0, unluckyQuantity + delta);
    if (delta > 0 && totalSegments >= MAX_SEGMENTS) return;
    setUnluckyQuantity(newQty);
  };
  
  const updateRetryQuantity = (delta: number) => {
    const newQty = Math.max(0, retryQuantity + delta);
    if (delta > 0 && totalSegments >= MAX_SEGMENTS) return;
    setRetryQuantity(newQty);
  };
  
  // Save segment quantities to merchant
  const saveSegmentQuantities = async () => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('merchants')
        .update({
          unlucky_quantity: unluckyQuantity,
          retry_quantity: retryQuantity,
          prize_quantities: prizeQuantities,
        })
        .eq('id', user.id);
      
      if (error) throw error;
      setMigrationNeeded(false);
    } catch (error: unknown) {
      const err = error as { code?: string; message?: string };
      if (err.code === 'PGRST204' || err.message?.includes('quantity')) {
        setMigrationNeeded(true);
      }
    }
  };
  
  // Auto-save when quantities change
  useEffect(() => {
    if (user) {
      const timer = setTimeout(() => {
        saveSegmentQuantities();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [unluckyQuantity, retryQuantity, prizeQuantities, user]);

  const getChanceDescription = (prob: number) => {
    if (prob >= 50) return { text: 'Très fréquent', color: 'text-green-600', bg: 'bg-green-50' };
    if (prob >= 25) return { text: 'Fréquent', color: 'text-blue-600', bg: 'bg-blue-50' };
    if (prob >= 10) return { text: 'Moyen', color: 'text-yellow-600', bg: 'bg-yellow-50' };
    if (prob >= 5) return { text: 'Rare', color: 'text-orange-600', bg: 'bg-orange-50' };
    return { text: 'Très rare', color: 'text-red-600', bg: 'bg-red-50' };
  };

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
        {/* Migration Warning */}
        {migrationNeeded && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-amber-800">Mise à jour de la base de données requise</h3>
              <p className="text-sm text-amber-700 mt-1">
                Les colonnes pour les probabilités spéciales manquent dans la base de données. 
                Veuillez exécuter la commande SQL suivante dans votre tableau de bord Supabase :
              </p>
              <pre className="mt-2 bg-amber-100 p-2 rounded text-xs overflow-x-auto text-amber-900 border border-amber-200">
                ALTER TABLE merchants ADD COLUMN IF NOT EXISTS unlucky_probability INTEGER DEFAULT 20;{'\n'}
                ALTER TABLE merchants ADD COLUMN IF NOT EXISTS retry_probability INTEGER DEFAULT 10;
              </pre>
            </div>
          </div>
        )}

        {/* Header with Probability Overview */}
        <div className="flex flex-col lg:flex-row justify-between items-start gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">🎁 Gestion des Prix</h1>
            <p className="text-gray-600">Configurez vos prix et leurs probabilités pour la roue</p>
          </div>
          <Button 
            onClick={() => showForm ? handleCancel() : setShowForm(true)} 
            className={`gap-2 ${showForm ? 'bg-red-100 text-red-600 hover:bg-red-200' : 'bg-teal-600 hover:bg-teal-700 text-white'}`}
            variant={showForm ? 'outline' : 'default'}
          >
            {showForm ? (
              <>
                <X className="w-4 h-4" />
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

        {/* Segment Counter Card */}
        <Card className="p-6 bg-gradient-to-r from-teal-50 to-blue-50 border-teal-200">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 bg-teal-600 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-2xl">🎡</span>
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Composition de la Roue</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="bg-white rounded-lg p-4 border-2 border-teal-200">
                  <p className="text-sm text-gray-600 mb-1">Segments utilisés</p>
                  <p className="text-3xl font-bold text-teal-600">{totalSegments}/{MAX_SEGMENTS}</p>
                </div>
                <div className={`rounded-lg p-4 border-2 ${
                  remainingSegments === 0 ? 'bg-green-50 border-green-200' : 
                  remainingSegments > 0 ? 'bg-yellow-50 border-yellow-200' : 
                  'bg-red-50 border-red-200'
                }`}>
                  <p className="text-sm text-gray-600 mb-1">Segments restants</p>
                  <p className={`text-3xl font-bold ${
                    remainingSegments === 0 ? 'text-green-600' : 
                    remainingSegments > 0 ? 'text-yellow-600' : 
                    'text-red-600'
                  }`}>{remainingSegments}</p>
                </div>
                <div className="bg-white rounded-lg p-4 border-2 border-gray-200">
                  <p className="text-sm text-gray-600 mb-1">Prix disponibles</p>
                  <p className="text-3xl font-bold text-gray-900">{prizes.length}</p>
                </div>
              </div>
              
              {/* Segment Info */}
              <div className="bg-white rounded-lg p-4 border border-teal-200">
                <div className="flex items-center gap-2 mb-3">
                  <Info className="w-5 h-5 text-teal-600" />
                  <h4 className="font-semibold text-gray-900">💡 Comment ça marche</h4>
                </div>
                <div className="text-sm text-gray-600 space-y-2">
                  <p>• La roue peut contenir <strong>maximum {MAX_SEGMENTS} segments</strong></p>
                  <p>• Ajoutez des segments pour chaque prix en cliquant sur <strong>+</strong></p>
                  <p>• Plus un prix a de segments, plus il a de chances d'être gagné</p>
                  <p>• Les segments spéciaux (#UNLUCKY#, #RÉESSAYER#) sont configurables</p>
                </div>
              </div>

              {totalSegments === 0 && (
                <div className="mt-4 flex items-center gap-2 text-orange-700 bg-orange-50 border border-orange-200 rounded-lg p-3">
                  <AlertCircle className="w-5 h-5" />
                  <span className="font-medium">
                    Ajoutez des segments à la roue pour la configurer !
                  </span>
                </div>
              )}
            </div>
          </div>
        </Card>

        {showForm && (
          <Card className="p-6 border-2 border-teal-100 shadow-xl bg-white/80 backdrop-blur-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-teal-400 to-blue-500"></div>
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              {editingId ? (
                <>
                  <Pencil className="w-5 h-5 text-teal-600" />
                  Modifier le Prix
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5 text-teal-600" />
                  Ajouter un Nouveau Prix
                </>
              )}
            </h3>
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
                className="w-full bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700 text-white font-bold py-6 rounded-xl shadow-lg transform transition-transform active:scale-95"
              >
                {uploading ? 'Upload en cours...' : loading ? 'Sauvegarde...' : (editingId ? 'Mettre à jour le Prix' : 'Créer le Prix')}
              </Button>
            </form>
          </Card>
        )}

        {/* Special Segments Section */}
        <Card className="p-6 bg-gradient-to-r from-gray-900 to-gray-800 border-gray-700">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center">
              <Lock className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Segments Spéciaux (Permanents)</h3>
              <p className="text-gray-400 text-sm">Ces segments sont toujours présents sur la roue</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* UNLUCKY Card */}
            <div className="bg-gray-800 rounded-xl p-5 border-2 border-red-500/50">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-14 h-14 bg-red-900 rounded-full flex items-center justify-center">
                  <Ban className="w-8 h-8 text-red-400" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-red-400">#UNLUCKY#</h4>
                  <p className="text-gray-400 text-xs">Éliminatoire - Fin du jeu</p>
                </div>
              </div>
              
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-300">Segments sur la roue</label>
                </div>
                <div className="flex items-center justify-center gap-4">
                  <Button
                    onClick={() => updateUnluckyQuantity(-1)}
                    disabled={unluckyQuantity <= 0}
                    variant="outline"
                    size="sm"
                    className="w-10 h-10 rounded-full bg-red-900/50 border-red-500 text-red-400 hover:bg-red-800 disabled:opacity-50"
                  >
                    -
                  </Button>
                  <span className="text-3xl font-bold text-red-400 w-12 text-center">{unluckyQuantity}</span>
                  <Button
                    onClick={() => updateUnluckyQuantity(1)}
                    disabled={totalSegments >= MAX_SEGMENTS}
                    variant="outline"
                    size="sm"
                    className="w-10 h-10 rounded-full bg-red-900/50 border-red-500 text-red-400 hover:bg-red-800 disabled:opacity-50"
                  >
                    +
                  </Button>
                </div>
              </div>
              
              <div className="bg-red-900/30 border border-red-500/30 rounded-lg p-3">
                <p className="text-xs text-red-300">
                  ⚠️ Si la roue s'arrête sur ce segment, le joueur perd et ne peut plus rejouer.
                </p>
              </div>
            </div>
            
            {/* RETRY Card */}
            <div className="bg-gray-800 rounded-xl p-5 border-2 border-yellow-500/50">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-14 h-14 bg-yellow-900 rounded-full flex items-center justify-center">
                  <RefreshCw className="w-8 h-8 text-yellow-400" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-yellow-400">#REESSAYER#</h4>
                  <p className="text-gray-400 text-xs">Tour supplémentaire gratuit</p>
                </div>
              </div>
              
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-300">Segments sur la roue</label>
                </div>
                <div className="flex items-center justify-center gap-4">
                  <Button
                    onClick={() => updateRetryQuantity(-1)}
                    disabled={retryQuantity <= 0}
                    variant="outline"
                    size="sm"
                    className="w-10 h-10 rounded-full bg-yellow-900/50 border-yellow-500 text-yellow-400 hover:bg-yellow-800 disabled:opacity-50"
                  >
                    -
                  </Button>
                  <span className="text-3xl font-bold text-yellow-400 w-12 text-center">{retryQuantity}</span>
                  <Button
                    onClick={() => updateRetryQuantity(1)}
                    disabled={totalSegments >= MAX_SEGMENTS}
                    variant="outline"
                    size="sm"
                    className="w-10 h-10 rounded-full bg-yellow-900/50 border-yellow-500 text-yellow-400 hover:bg-yellow-800 disabled:opacity-50"
                  >
                    +
                  </Button>
                </div>
              </div>
              
              <div className="bg-yellow-900/30 border border-yellow-500/30 rounded-lg p-3">
                <p className="text-xs text-yellow-300">
                  🔄 Si la roue s'arrête sur ce segment, le joueur peut tourner à nouveau !
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Wheel Preview Section */}
        <Card className="p-6 bg-gradient-to-br from-slate-50 to-gray-100 border-2 border-gray-200">
          <div className="flex flex-col lg:flex-row items-center gap-8">
            <div className="flex-shrink-0">
              <WheelPreview 
                prizeQuantities={prizeQuantitiesArray}
                unluckyQuantity={unluckyQuantity}
                retryQuantity={retryQuantity}
                size={320}
                maxSegments={MAX_SEGMENTS}
              />
            </div>
            <div className="flex-1 text-center lg:text-left">
              <h3 className="text-2xl font-bold text-gray-900 mb-3">🎡 Aperçu de la Roue</h3>
              <p className="text-gray-600 mb-4">
                Voici un aperçu de votre roue avec tous les segments configurés. 
                Chaque segment représente un prix ou un segment spécial.
              </p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-white rounded-lg p-3 border">
                  <p className="text-gray-500">Segments totaux</p>
                  <p className="text-2xl font-bold text-teal-600">{totalSegments}/{MAX_SEGMENTS}</p>
                </div>
                <div className="bg-white rounded-lg p-3 border">
                  <p className="text-gray-500">Prix sur la roue</p>
                  <p className="text-2xl font-bold text-blue-600">{totalPrizeSegments}</p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2 justify-center lg:justify-start">
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                  <span className="w-2 h-2 bg-red-600 rounded-full"></span>
                  #UNLUCKY# × {unluckyQuantity}
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
                  <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                  #RÉESSAYER# × {retryQuantity}
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Merchant Prizes Grid */}
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            🎁 Vos Prix Personnalisés
            <span className="text-sm font-normal text-gray-500">({prizes.length} prix)</span>
          </h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {prizes.map((prize) => {
            const quantity = prizeQuantities[prize.id] || 0;
            return (
              <Card key={prize.id} className={`overflow-hidden hover:shadow-xl transition-all border-2 ${quantity > 0 ? 'border-teal-400 bg-teal-50/30' : 'hover:border-teal-300'}`}>
                {/* Prize Image */}
                {prize.image_url ? (
                  <div className="relative h-40 bg-gradient-to-br from-teal-100 to-blue-100">
                    <img 
                      src={prize.image_url} 
                      alt={prize.name} 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 right-3">
                      <div className={`px-3 py-1.5 ${quantity > 0 ? 'bg-teal-600 text-white' : 'bg-gray-200 text-gray-600'} rounded-full font-bold text-sm shadow-lg`}>
                        × {quantity}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-40 bg-gradient-to-br from-teal-100 to-blue-100 flex items-center justify-center relative">
                    <span className="text-5xl">🎁</span>
                    <div className="absolute top-3 right-3">
                      <div className={`px-3 py-1.5 ${quantity > 0 ? 'bg-teal-600 text-white' : 'bg-gray-200 text-gray-600'} rounded-full font-bold text-sm shadow-lg`}>
                        × {quantity}
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="p-4">
                  <div className="mb-3">
                    <h3 className="text-lg font-bold text-gray-900 mb-1">{prize.name}</h3>
                    {prize.description && (
                      <p className="text-gray-500 text-xs line-clamp-1">{prize.description}</p>
                    )}
                  </div>
                  
                  {/* Quantity Controls */}
                  <div className="mb-4">
                    <label className="text-xs font-medium text-gray-500 block mb-2">Segments sur la roue</label>
                    <div className="flex items-center justify-center gap-3">
                      <Button
                        onClick={() => updatePrizeQuantity(prize.id, -1)}
                        disabled={quantity <= 0}
                        variant="outline"
                        size="sm"
                        className="w-9 h-9 rounded-full border-teal-400 text-teal-600 hover:bg-teal-50 disabled:opacity-50"
                      >
                        -
                      </Button>
                      <span className="text-2xl font-bold text-teal-600 w-10 text-center">{quantity}</span>
                      <Button
                        onClick={() => updatePrizeQuantity(prize.id, 1)}
                        disabled={totalSegments >= MAX_SEGMENTS}
                        variant="outline"
                        size="sm"
                        className="w-9 h-9 rounded-full border-teal-400 text-teal-600 hover:bg-teal-50 disabled:opacity-50"
                      >
                        +
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleEdit(prize)}
                      variant="outline"
                      size="sm"
                      className="flex-1 text-gray-600 border-gray-300 hover:bg-gray-50 gap-1"
                    >
                      <Pencil className="w-3 h-3" />
                      Modifier
                    </Button>
                    <Button
                      onClick={() => handleDelete(prize.id)}
                      variant="outline"
                      size="sm"
                      className="text-red-600 border-red-300 hover:bg-red-50"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
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
