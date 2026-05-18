'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ShoppingCart, X, Plus, Minus, Trash2, ChevronRight,
  Package, Dumbbell, Utensils, Star, Zap, Check,
  ExternalLink, ShoppingBag, Tag, Clock, Video, MapPin,
  CreditCard, ArrowRight, AlertCircle, Shirt,
} from 'lucide-react';
import { getAuth, getCart, addToCart, removeFromCart, updateCartQuantity, clearCart, addOrder } from '@/lib/storage';
import { mockShopProducts, mockCoachingPacks } from '@/lib/mockData';
import { CartItem, Order, ProductSize, ShopProduct, CoachingPack } from '@/lib/types';

type Tab = 'vetements' | 'packs' | 'seances';

const SIZES: ProductSize[] = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

const SINGLE_SESSIONS = [
  {
    id: 'seance-presentiel',
    name: 'Séance individuelle présentiel',
    description: '1h de coaching personnalisé en salle avec votre coach.',
    price: 65,
    icon: MapPin,
    color: 'from-blue-600 to-indigo-600',
    duration: '1h',
    type: 'présentiel',
  },
  {
    id: 'seance-online',
    name: 'Séance individuelle en ligne',
    description: '1h de coaching en visioconférence, disponible partout.',
    price: 55,
    icon: Video,
    color: 'from-purple-600 to-pink-600',
    duration: '1h',
    type: 'en ligne',
  },
  {
    id: 'bilan-nutrition',
    name: 'Bilan nutritionnel',
    description: 'Consultation diététique approfondie + plan alimentaire personnalisé.',
    price: 120,
    icon: Utensils,
    color: 'from-emerald-600 to-teal-500',
    duration: '1h30',
    type: 'présentiel / en ligne',
  },
  {
    id: 'bilan-morpho',
    name: 'Bilan morpho-physique',
    description: 'Analyse complète : mensurations, tests de force, cardio et composition corporelle.',
    price: 90,
    icon: Zap,
    color: 'from-amber-500 to-orange-600',
    duration: '1h',
    type: 'présentiel',
  },
];

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

// ─── Cart Panel ──────────────────────────────────────────────────────────────

function CartPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [checkoutStep, setCheckoutStep] = useState<'cart' | 'info' | 'confirm'>('cart');
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '', notes: '' });
  const [ordered, setOrdered] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setCart(getCart());
  }, [open]);

  const refresh = () => setCart(getCart());

  const remove = (id: string) => { removeFromCart(id); refresh(); };
  const qty = (id: string, q: number) => { updateCartQuantity(id, q); refresh(); };

  const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const hasPhysical = cart.some(i => i.type === 'clothing');
  const shipping = hasPhysical && subtotal < 100 ? 4.9 : 0;
  const total = subtotal + shipping;

  const placeOrder = () => {
    const order: Order = {
      id: `ORD-${Date.now()}`,
      customerName: form.name,
      customerEmail: form.email,
      items: [...cart],
      subtotal,
      shipping,
      total,
      status: 'confirmed',
      paymentMethod: 'card',
      createdAt: new Date().toISOString(),
      shippingAddress: form.address,
      notes: form.notes,
    };
    addOrder(order);
    clearCart();
    setOrdered(true);
    setCart([]);
  };

  return (
    <>
      {/* Backdrop */}
      {open && <div className="fixed inset-0 bg-black/60 z-50" onClick={onClose} />}

      {/* Panel */}
      <div className={`fixed right-0 top-0 h-full w-full max-w-md bg-slate-900 border-l border-slate-800 z-50 flex flex-col transition-transform duration-300 ${open ? 'translate-x-0' : 'translate-x-full'}`}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-blue-400" />
            <span className="font-semibold text-white">Panier</span>
            {cart.length > 0 && (
              <span className="w-5 h-5 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center font-bold">{cart.length}</span>
            )}
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        {ordered ? (
          /* Success */
          <div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-4">
            <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <Check className="w-10 h-10 text-emerald-400" />
            </div>
            <h2 className="text-xl font-bold text-white">Commande confirmée !</h2>
            <p className="text-slate-400 text-sm">Un email de confirmation vous a été envoyé à <span className="text-white">{form.email}</span>.</p>
            <button
              onClick={() => { setOrdered(false); setCheckoutStep('cart'); setForm({ name: '', email: '', phone: '', address: '', notes: '' }); onClose(); }}
              className="mt-4 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Continuer mes achats
            </button>
          </div>
        ) : checkoutStep === 'cart' ? (
          <>
            {/* Items */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center gap-3 py-12">
                  <ShoppingBag className="w-12 h-12 text-slate-700" />
                  <p className="text-slate-400 text-sm">Votre panier est vide</p>
                </div>
              ) : cart.map(item => (
                <div key={item.id} className="flex gap-3 bg-slate-800 rounded-xl p-3">
                  <div className={`w-14 h-14 rounded-lg bg-gradient-to-br ${item.imageColor} flex items-center justify-center flex-shrink-0`}>
                    {item.type === 'clothing' ? <Shirt className="w-6 h-6 text-white/70" /> : <Dumbbell className="w-6 h-6 text-white/70" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{item.name}</p>
                    <div className="flex gap-2 mt-0.5">
                      {item.size && <span className="text-xs text-slate-500">Taille: {item.size}</span>}
                      {item.color && <span className="text-xs text-slate-500">{item.color}</span>}
                      {item.withDiet && <span className="text-xs text-emerald-400 flex items-center gap-1"><Utensils className="w-3 h-3" /> + Nutrition</span>}
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-1 bg-slate-700 rounded-lg">
                        <button onClick={() => qty(item.id, item.quantity - 1)} className="w-7 h-7 flex items-center justify-center text-slate-300 hover:text-white"><Minus className="w-3 h-3" /></button>
                        <span className="text-sm text-white w-5 text-center">{item.quantity}</span>
                        <button onClick={() => qty(item.id, item.quantity + 1)} className="w-7 h-7 flex items-center justify-center text-slate-300 hover:text-white"><Plus className="w-3 h-3" /></button>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-white">{(item.price * item.quantity).toFixed(2)}€</span>
                        <button onClick={() => remove(item.id)} className="text-slate-500 hover:text-red-400 transition-colors"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            {cart.length > 0 && (
              <div className="px-5 py-4 border-t border-slate-800 space-y-3">
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between text-slate-400">
                    <span>Sous-total</span><span className="text-white">{subtotal.toFixed(2)}€</span>
                  </div>
                  {hasPhysical && (
                    <div className="flex justify-between text-slate-400">
                      <span>Livraison</span>
                      <span className={shipping === 0 ? 'text-emerald-400' : 'text-white'}>{shipping === 0 ? 'Offerte' : `${shipping.toFixed(2)}€`}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-semibold text-white border-t border-slate-700 pt-2">
                    <span>Total</span><span className="text-blue-400 text-base">{total.toFixed(2)}€</span>
                  </div>
                </div>
                {hasPhysical && shipping > 0 && (
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Livraison offerte dès 100€ d'achats
                  </p>
                )}
                <button
                  onClick={() => setCheckoutStep('info')}
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2"
                >
                  Commander <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        ) : checkoutStep === 'info' ? (
          <>
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              <h3 className="font-semibold text-white">Vos informations</h3>
              {[
                { key: 'name', label: 'Nom complet', type: 'text', required: true },
                { key: 'email', label: 'Email', type: 'email', required: true },
                { key: 'phone', label: 'Téléphone', type: 'tel', required: false },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-xs text-slate-400 mb-1">{f.label}{f.required && <span className="text-red-400 ml-0.5">*</span>}</label>
                  <input
                    type={f.type}
                    value={(form as any)[f.key]}
                    onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
              ))}
              {hasPhysical && (
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Adresse de livraison<span className="text-red-400 ml-0.5">*</span></label>
                  <textarea
                    value={form.address}
                    onChange={e => setForm(p => ({ ...p, address: e.target.value }))}
                    rows={3}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500 resize-none"
                  />
                </div>
              )}
              <div>
                <label className="block text-xs text-slate-400 mb-1">Notes (optionnel)</label>
                <textarea
                  value={form.notes}
                  onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                  rows={2}
                  placeholder="Instructions spéciales, disponibilités..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500 resize-none placeholder-slate-600"
                />
              </div>

              <div className="bg-slate-800 rounded-xl p-4 space-y-2">
                <p className="text-sm font-medium text-white flex items-center gap-2"><CreditCard className="w-4 h-4 text-blue-400" /> Paiement sécurisé</p>
                <p className="text-xs text-slate-400">Vous serez redirigé vers notre processeur de paiement sécurisé pour finaliser votre commande.</p>
              </div>
            </div>
            <div className="px-5 py-4 border-t border-slate-800 flex gap-3">
              <button onClick={() => setCheckoutStep('cart')} className="flex-1 py-2.5 border border-slate-700 text-slate-300 hover:text-white rounded-xl text-sm font-medium transition-colors">Retour</button>
              <button
                onClick={() => { if (form.name && form.email) setCheckoutStep('confirm'); }}
                disabled={!form.name || !form.email}
                className="flex-2 flex-[2] py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-xl text-sm font-semibold transition-colors"
              >
                Confirmer ({total.toFixed(2)}€)
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              <h3 className="font-semibold text-white">Récapitulatif</h3>
              <div className="space-y-2">
                {cart.map(item => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-slate-400">{item.name} {item.size ? `(${item.size})` : ''} ×{item.quantity}</span>
                    <span className="text-white">{(item.price * item.quantity).toFixed(2)}€</span>
                  </div>
                ))}
                <div className="border-t border-slate-700 pt-2 flex justify-between font-semibold">
                  <span className="text-white">Total</span>
                  <span className="text-blue-400">{total.toFixed(2)}€</span>
                </div>
              </div>
              <div className="bg-slate-800 rounded-xl p-4 text-sm space-y-1">
                <p className="text-slate-400">Client : <span className="text-white">{form.name}</span></p>
                <p className="text-slate-400">Email : <span className="text-white">{form.email}</span></p>
                {form.address && <p className="text-slate-400">Livraison : <span className="text-white">{form.address}</span></p>}
              </div>
            </div>
            <div className="px-5 py-4 border-t border-slate-800 flex gap-3">
              <button onClick={() => setCheckoutStep('info')} className="flex-1 py-2.5 border border-slate-700 text-slate-300 hover:text-white rounded-xl text-sm font-medium">Retour</button>
              <button
                onClick={placeOrder}
                className="flex-[2] py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" /> Valider la commande
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}

// ─── Product Card (Vêtements) ────────────────────────────────────────────────

function ClothingCard({ product }: { product: ShopProduct }) {
  const [selectedVariant, setSelectedVariant] = useState(0);
  const [selectedSize, setSelectedSize] = useState<ProductSize | null>(null);
  const [added, setAdded] = useState(false);

  const variant = product.variants?.[selectedVariant];

  const handleAdd = () => {
    if (product.variants && !selectedSize) return;
    addToCart({
      id: uid(),
      productId: product.id,
      type: 'clothing',
      name: product.name,
      price: product.price,
      quantity: 1,
      size: selectedSize ?? undefined,
      color: variant?.color,
      imageColor: product.imageColor,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const stockForSize = selectedSize && variant ? variant.stock[selectedSize] : null;

  return (
    <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl overflow-hidden hover:border-slate-600 transition-all duration-200 group flex flex-col">
      {/* Image placeholder */}
      <div className={`relative h-52 bg-gradient-to-br ${product.imageColor} flex items-center justify-center`}>
        <Shirt className="w-16 h-16 text-white/30" />
        {product.badge && (
          <span className="absolute top-3 left-3 px-2.5 py-1 bg-white/10 backdrop-blur-sm border border-white/20 text-white text-xs font-semibold rounded-full">
            {product.badge}
          </span>
        )}
        {product.originalPrice && (
          <span className="absolute top-3 right-3 px-2 py-1 bg-red-500/80 text-white text-xs font-bold rounded-full">
            -{Math.round((1 - product.price / product.originalPrice) * 100)}%
          </span>
        )}
        {product.externalUrl && (
          <a
            href={product.externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute bottom-3 right-3 w-7 h-7 bg-black/40 hover:bg-black/70 rounded-full flex items-center justify-center transition-colors"
            title="Voir sur Ariesfitwear.com"
          >
            <ExternalLink className="w-3.5 h-3.5 text-white" />
          </a>
        )}
      </div>

      <div className="p-4 flex-1 flex flex-col gap-3">
        <div>
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-white text-sm leading-tight">{product.name}</h3>
            <div className="text-right flex-shrink-0">
              <span className="text-blue-400 font-bold">{product.price}€</span>
              {product.originalPrice && <p className="text-xs text-slate-500 line-through">{product.originalPrice}€</p>}
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">{product.description}</p>
        </div>

        {/* Color selector */}
        {product.variants && product.variants.length > 1 && (
          <div>
            <p className="text-xs text-slate-500 mb-1.5">Coloris : <span className="text-slate-300">{variant?.color}</span></p>
            <div className="flex gap-1.5">
              {product.variants.map((v, i) => (
                <button
                  key={i}
                  onClick={() => { setSelectedVariant(i); setSelectedSize(null); }}
                  title={v.color}
                  className={`w-6 h-6 rounded-full border-2 transition-all ${selectedVariant === i ? 'border-white scale-110' : 'border-transparent hover:border-slate-500'}`}
                  style={{ backgroundColor: v.colorHex }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Size selector */}
        {product.variants && (
          <div>
            <p className="text-xs text-slate-500 mb-1.5">Taille</p>
            <div className="flex flex-wrap gap-1">
              {SIZES.map(size => {
                const stock = variant?.stock[size] ?? 0;
                const isSelected = selectedSize === size;
                return (
                  <button
                    key={size}
                    onClick={() => stock > 0 && setSelectedSize(size)}
                    disabled={stock === 0}
                    className={`px-2.5 py-1 text-xs font-medium rounded-lg border transition-all
                      ${stock === 0 ? 'border-slate-700 text-slate-700 cursor-not-allowed line-through' :
                        isSelected ? 'border-blue-500 bg-blue-500/20 text-blue-300' :
                        'border-slate-600 text-slate-300 hover:border-slate-400'}`}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
            {stockForSize !== null && stockForSize <= 3 && stockForSize > 0 && (
              <p className="text-xs text-amber-400 mt-1">Plus que {stockForSize} en stock !</p>
            )}
          </div>
        )}

        <button
          onClick={handleAdd}
          disabled={!!product.variants && !selectedSize}
          className={`mt-auto w-full py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2
            ${added ? 'bg-emerald-600 text-white' :
              product.variants && !selectedSize ? 'bg-slate-700/50 text-slate-600 cursor-not-allowed' :
              'bg-blue-600 hover:bg-blue-500 text-white'}`}
        >
          {added ? <><Check className="w-4 h-4" /> Ajouté !</> : <><ShoppingCart className="w-4 h-4" /> {product.variants && !selectedSize ? 'Choisir une taille' : 'Ajouter au panier'}</>}
        </button>
      </div>
    </div>
  );
}

// ─── Pack Card ───────────────────────────────────────────────────────────────

function PackCard({ pack }: { pack: CoachingPack }) {
  const [withDiet, setWithDiet] = useState(pack.includesDiet);
  const [added, setAdded] = useState(false);

  const price = withDiet && pack.priceWithDiet ? pack.priceWithDiet : pack.price;

  const handleAdd = () => {
    addToCart({
      id: uid(),
      productId: pack.id,
      type: 'coaching_pack',
      name: pack.name + (withDiet ? ' + Nutrition' : ''),
      price,
      quantity: 1,
      withDiet,
      imageColor: pack.includesDiet ? 'from-emerald-600 to-teal-500' : 'from-blue-600 to-indigo-600',
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className={`relative bg-slate-800/60 border rounded-2xl overflow-hidden flex flex-col transition-all duration-200
      ${pack.popular ? 'border-blue-500/60 shadow-lg shadow-blue-500/10' : 'border-slate-700/50 hover:border-slate-600'}`}>
      {pack.popular && (
        <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500" />
      )}

      <div className="p-5 flex-1 flex flex-col gap-4">
        <div className="flex items-start justify-between">
          <div>
            {pack.badge && (
              <span className={`inline-block px-2.5 py-0.5 text-xs font-semibold rounded-full mb-2
                ${pack.popular ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                  pack.badge === 'Exclusif' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' :
                  'bg-amber-500/20 text-amber-400 border border-amber-500/30'}`}>
                {pack.badge === 'Populaire' && <Star className="w-3 h-3 inline mr-1" />}
                {pack.badge}
              </span>
            )}
            <h3 className="text-lg font-bold text-white">{pack.name}</h3>
            <p className="text-xs text-slate-400 mt-1">{pack.description}</p>
          </div>
          <div className="text-right flex-shrink-0 ml-3">
            <div className="text-2xl font-black text-white">{price}€</div>
            {withDiet && pack.priceWithDiet && pack.price !== pack.priceWithDiet && (
              <div className="text-xs text-slate-500">sans nutrition : {pack.price}€</div>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-slate-700/50 rounded-xl p-2.5 text-center">
            <div className="text-lg font-bold text-blue-400">{pack.sessions}</div>
            <div className="text-xs text-slate-400">séances</div>
          </div>
          <div className="bg-slate-700/50 rounded-xl p-2.5 text-center">
            <div className="text-lg font-bold text-purple-400">{pack.durationWeeks}</div>
            <div className="text-xs text-slate-400">semaines</div>
          </div>
          <div className="bg-slate-700/50 rounded-xl p-2.5 text-center">
            <div className="text-xs font-bold text-emerald-400 leading-tight mt-1">{pack.sessionType}</div>
            <div className="text-xs text-slate-400 mt-0.5">format</div>
          </div>
        </div>

        {/* Features */}
        <ul className="space-y-1.5">
          {pack.features.map((f, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-slate-300">
              <Check className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
              {f}
            </li>
          ))}
        </ul>

        {/* Diet toggle */}
        {!pack.includesDiet && pack.priceWithDiet && (
          <div className={`rounded-xl border p-3 transition-all ${withDiet ? 'border-emerald-500/50 bg-emerald-500/10' : 'border-slate-700 bg-slate-700/30'}`}>
            <label className="flex items-start gap-3 cursor-pointer">
              <div
                onClick={() => setWithDiet(!withDiet)}
                className={`mt-0.5 w-9 h-5 rounded-full transition-colors flex-shrink-0 relative ${withDiet ? 'bg-emerald-500' : 'bg-slate-600'}`}
              >
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${withDiet ? 'translate-x-4' : 'translate-x-0.5'}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-white flex items-center gap-1.5">
                  <Utensils className="w-3.5 h-3.5 text-emerald-400" /> Ajouter le suivi nutrition
                  <span className="text-emerald-400 font-bold">+{pack.priceWithDiet - pack.price}€</span>
                </p>
                {withDiet && pack.dietDetails && (
                  <p className="text-xs text-slate-400 mt-1">{pack.dietDetails}</p>
                )}
              </div>
            </label>
          </div>
        )}
        {pack.includesDiet && (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3">
            <p className="text-sm font-medium text-emerald-400 flex items-center gap-2">
              <Utensils className="w-4 h-4" /> Suivi nutrition inclus
            </p>
          </div>
        )}
      </div>

      <div className="px-5 pb-5">
        <button
          onClick={handleAdd}
          className={`w-full py-3 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2
            ${added ? 'bg-emerald-600 text-white' :
              pack.popular ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white' :
              'bg-slate-700 hover:bg-slate-600 text-white'}`}
        >
          {added ? <><Check className="w-4 h-4" /> Ajouté au panier</> : <><ShoppingCart className="w-4 h-4" /> Commander ce pack</>}
        </button>
      </div>
    </div>
  );
}

// ─── Session Card ────────────────────────────────────────────────────────────

function SessionCard({ session }: { session: typeof SINGLE_SESSIONS[0] }) {
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    addToCart({
      id: uid(),
      productId: session.id,
      type: 'session',
      name: session.name,
      price: session.price,
      quantity: 1,
      imageColor: session.color,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5 hover:border-slate-600 transition-all flex gap-4">
      <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${session.color} flex items-center justify-center flex-shrink-0`}>
        <session.icon className="w-7 h-7 text-white" />
      </div>
      <div className="flex-1">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-semibold text-white text-sm">{session.name}</h3>
            <p className="text-xs text-slate-400 mt-0.5">{session.description}</p>
            <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {session.duration}</span>
              <span>{session.type}</span>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="text-xl font-black text-blue-400">{session.price}€</div>
          </div>
        </div>
        <button
          onClick={handleAdd}
          className={`mt-3 px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5
            ${added ? 'bg-emerald-600 text-white' : 'bg-blue-600 hover:bg-blue-500 text-white'}`}
        >
          {added ? <><Check className="w-3.5 h-3.5" /> Ajouté</> : <><ShoppingCart className="w-3.5 h-3.5" /> Réserver</>}
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function BoutiquePage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('packs');
  const [cartOpen, setCartOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const auth = getAuth();
    if (!auth.isAuthenticated) { router.push('/'); return; }
  }, [router]);

  useEffect(() => {
    if (!mounted) return;
    const updateCount = () => setCartCount(getCart().reduce((s, i) => s + i.quantity, 0));
    updateCount();
    const interval = setInterval(updateCount, 500);
    return () => clearInterval(interval);
  }, [mounted, cartOpen]);

  const CATEGORIES = [
    { key: 'all', label: 'Tout' },
    { key: 'ensemble', label: 'Ensembles' },
    { key: 'haut', label: 'Hauts' },
    { key: 'bas', label: 'Bas' },
    { key: 'accessoire', label: 'Accessoires' },
  ];

  const filteredProducts = categoryFilter === 'all'
    ? mockShopProducts
    : mockShopProducts.filter(p => p.category === categoryFilter);

  if (!mounted) return null;

  return (
    <div className="min-h-full">
      {/* Hero banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-purple-950 px-6 py-10 mb-8 rounded-2xl mx-1">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-500/10 via-transparent to-purple-500/10" />
        <div className="relative max-w-2xl">
          <div className="flex items-center gap-2 mb-3">
            <span className="px-3 py-1 bg-blue-500/20 border border-blue-500/30 text-blue-400 text-xs font-semibold rounded-full">
              Boutique officielle
            </span>
          </div>
          <h1 className="text-3xl font-black text-white mb-3 leading-tight">
            Équipements & Packs<br />
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Coaching</span>
          </h1>
          <p className="text-slate-400 text-sm max-w-lg">
            Découvrez les ensembles sportifs <strong className="text-white">Ariesfitwear</strong> et
            nos packs de coaching personnalisés — avec ou sans suivi nutritionnel.
          </p>
        </div>

        {/* Cart button */}
        <button
          onClick={() => setCartOpen(true)}
          className="absolute top-6 right-6 relative flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
        >
          <ShoppingCart className="w-4 h-4" />
          <span>Panier</span>
          {cartCount > 0 && (
            <span className="absolute -top-2 -right-2 w-5 h-5 bg-blue-500 rounded-full text-xs font-bold flex items-center justify-center">
              {cartCount}
            </span>
          )}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-800/50 p-1 rounded-xl mb-6">
        {[
          { key: 'packs' as Tab, label: 'Packs Coaching', icon: Dumbbell },
          { key: 'vetements' as Tab, label: 'Ariesfitwear', icon: Shirt },
          { key: 'seances' as Tab, label: 'Séances à l\'unité', icon: Zap },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-medium transition-all
              ${tab === t.key ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <t.icon className="w-4 h-4" />
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      {/* Vetements tab */}
      {tab === 'vetements' && (
        <div>
          {/* Brand banner */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center">
                <Shirt className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-white">Ariesfitwear</h2>
                <a href="https://ariesfitwear.com" target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
                  ariesfitwear.com <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Package className="w-3.5 h-3.5" />
              Livraison offerte dès 100€
            </div>
          </div>

          {/* Category filter */}
          <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
            {CATEGORIES.map(c => (
              <button
                key={c.key}
                onClick={() => setCategoryFilter(c.key)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all
                  ${categoryFilter === c.key ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700'}`}
              >
                {c.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredProducts.map(p => <ClothingCard key={p.id} product={p} />)}
          </div>
        </div>
      )}

      {/* Packs tab */}
      {tab === 'packs' && (
        <div>
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-white text-lg">Packs de coaching</h2>
            <span className="text-xs text-slate-500 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5" /> Option nutrition ajustable sur chaque pack
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {mockCoachingPacks.map(pack => <PackCard key={pack.id} pack={pack} />)}
          </div>
        </div>
      )}

      {/* Seances tab */}
      {tab === 'seances' && (
        <div>
          <div className="mb-5">
            <h2 className="font-bold text-white text-lg mb-1">Séances à l'unité</h2>
            <p className="text-sm text-slate-400">Réservez une séance sans engagement, selon vos besoins du moment.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {SINGLE_SESSIONS.map(s => <SessionCard key={s.id} session={s} />)}
          </div>

          <div className="mt-8 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-2xl p-5 flex gap-4 items-start">
            <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-white mb-1">Vous préférez un engagement sur la durée ?</p>
              <p className="text-xs text-slate-400 mb-3">Nos packs coaching offrent un meilleur suivi et un tarif dégressif par rapport aux séances à l'unité.</p>
              <button
                onClick={() => setTab('packs')}
                className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
              >
                Voir les packs <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cart Panel */}
      <CartPanel open={cartOpen} onClose={() => setCartOpen(false)} />

      {/* Floating cart button (when items in cart) */}
      {cartCount > 0 && !cartOpen && (
        <button
          onClick={() => setCartOpen(true)}
          className="fixed bottom-6 right-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-5 py-3 rounded-2xl shadow-2xl shadow-blue-500/30 flex items-center gap-2.5 font-semibold text-sm z-40 hover:scale-105 transition-transform"
        >
          <ShoppingCart className="w-4 h-4" />
          Panier ({cartCount})
        </button>
      )}
    </div>
  );
}
