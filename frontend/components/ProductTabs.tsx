'use client';

import { useState } from 'react';
import ProductCard from './ProductCard';
import IngredientCard from './IngredientCard';
import { FlaskConical, ShoppingBag, Sun, Moon, AlertTriangle, Star, Heart, Sparkles } from 'lucide-react';

interface ProductTabsProps {
  data: any;
}

const TIER_CONFIG = {
  best_match: { label: 'Best Match', icon: Star },
  budget_picks: { label: 'Budget', icon: Heart },
  premium: { label: 'Premium', icon: Sparkles },
};

export default function ProductTabs({ data }: ProductTabsProps) {
  const [priceTier, setPriceTier] = useState<'best_match' | 'budget_picks' | 'premium'>('best_match');
  const [timeSlot, setTimeSlot] = useState<'morning' | 'night'>('morning');

  const ingredients = data?.ingredients;
  const products = data?.products;
  const conflictWarnings = ingredients?.conflict_warnings || [];

  const currentProducts = products?.[priceTier]?.[timeSlot] || {};

  const morningSteps = ['cleanser', 'serum', 'moisturizer', 'sunscreen', 'eye_cream'];
  const nightSteps = ['cleanser', 'treatment', 'moisturizer', 'eye_cream'];

  const currentSteps = timeSlot === 'morning' ? morningSteps : nightSteps;
  const missingSteps = currentSteps.filter(s => !currentProducts[s]);

  return (
    <div className="space-y-4">

      {/* Key Ingredients Section */}
      <div className="rounded-lg border border-[#20241F]/12 bg-white p-6">
        <div className="flex items-center gap-2 mb-5">
          <FlaskConical size={16} className="text-[#BD7B54]" />
          <h3 className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.1em] text-[#20241F]/50">
            Key Ingredients For You
          </h3>
        </div>

        {/* Conflict warnings */}
        {conflictWarnings.length > 0 && (
          <div className="mb-5 bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 mb-2">
              <AlertTriangle size={13} /> Ingredient Conflicts Detected
            </p>
            <div className="space-y-1">
              {conflictWarnings.map((w: string, i: number) => (
                <p key={i} className="text-xs text-amber-700/80">{w}</p>
              ))}
            </div>
          </div>
        )}

        {/* Morning ingredients */}
        {ingredients?.morning?.length > 0 && (
          <div className="mb-5">
            <p className="flex items-center gap-1.5 font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.08em] text-[#20241F]/50 mb-3">
              <Sun size={13} className="text-[#BD7B54]" /> Morning Ingredients
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {ingredients.morning.map((ing: any) => (
                <IngredientCard key={ing.id} ingredient={ing} />
              ))}
            </div>
          </div>
        )}

        {/* Night ingredients */}
        {ingredients?.night?.length > 0 && (
          <div>
            <p className="flex items-center gap-1.5 font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.08em] text-[#20241F]/50 mb-3">
              <Moon size={13} className="text-[#20241F]/50" /> Night Ingredients
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {ingredients.night.map((ing: any) => (
                <IngredientCard key={ing.id} ingredient={ing} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Product Recommendations Section */}
      <div className="rounded-lg border border-[#20241F]/12 bg-white p-6">
        <div className="flex items-center gap-2 mb-5">
          <ShoppingBag size={16} className="text-[#BD7B54]" />
          <h3 className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.1em] text-[#20241F]/50">
            Recommended Products
          </h3>
        </div>

        {/* Price tier tabs */}
        <div className="flex gap-2 mb-4 flex-wrap">
          {(Object.keys(TIER_CONFIG) as Array<keyof typeof TIER_CONFIG>).map((tier) => {
            const { label, icon: Icon } = TIER_CONFIG[tier];
            return (
              <button
                key={tier}
                onClick={() => setPriceTier(tier)}
                className={`cursor-pointer rounded-md px-3 py-1.5 text-xs font-medium transition flex items-center gap-1.5 ${
                  priceTier === tier
                    ? 'bg-[#182019] text-[#F5F2EA]'
                    : 'bg-white text-[#20241F]/60 border border-[#20241F]/12 hover:border-[#BD7B54]/40'
                }`}
              >
                <Icon size={12} />
                {label}
              </button>
            );
          })}
        </div>

        {/* Morning / Night toggle */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setTimeSlot('morning')}
            className={`cursor-pointer rounded-md px-4 py-1.5 text-xs font-medium transition flex items-center gap-1.5 ${
              timeSlot === 'morning'
                ? 'bg-[#BD7B54]/10 text-[#BD7B54] border border-[#BD7B54]/30'
                : 'bg-white text-[#20241F]/50 border border-[#20241F]/12 hover:border-[#BD7B54]/30'
            }`}
          >
            <Sun size={13} /> Morning Routine
          </button>
          <button
            onClick={() => setTimeSlot('night')}
            className={`cursor-pointer rounded-md px-4 py-1.5 text-xs font-medium transition flex items-center gap-1.5 ${
              timeSlot === 'night'
                ? 'bg-[#20241F]/8 text-[#20241F] border border-[#20241F]/25'
                : 'bg-white text-[#20241F]/50 border border-[#20241F]/12 hover:border-[#20241F]/25'
            }`}
          >
            <Moon size={13} /> Night Routine
          </button>
        </div>

        {/* Product cards */}
        {Object.keys(currentProducts).length > 0 ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Object.entries(currentProducts).map(([step, product]: [string, any]) => (
                <ProductCard key={step} product={product} step={step} />
              ))}
            </div>

            {/* Missing steps */}
            {missingSteps.length > 0 && (
              <div className="bg-[#F5F2EA] border border-[#20241F]/10 rounded-lg p-4">
                <p className="text-xs font-medium text-[#20241F]/55 mb-2">Still looking for a match in:</p>
                <div className="flex flex-wrap gap-2 mb-2">
                  {missingSteps.map(s => (
                    <span key={s} className="text-xs bg-white border border-[#20241F]/12 text-[#20241F]/40 px-3 py-1 rounded-full capitalize">
                      {s.replace('_', ' ')}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-[#20241F]/40">We didn't find a great fit for this tier yet — try Budget or Premium, or rescan for fresh picks.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-10 text-[#20241F]/40 text-sm">
            No products available for this routine slot.
          </div>
        )}
      </div>
    </div>
  );
}
