'use client';

import { useState } from 'react';
import ProductCard from './ProductCard';
import IngredientCard from './IngredientCard';

interface ProductTabsProps {
  data: any;
}

export default function ProductTabs({ data }: ProductTabsProps) {
  const [priceTier, setPriceTier] = useState<'best_match' | 'budget_picks' | 'premium'>('best_match');
  const [timeSlot, setTimeSlot] = useState<'morning' | 'night'>('morning');

  const ingredients = data?.ingredients;
  const products = data?.products;
  const conflictWarnings = ingredients?.conflict_warnings || [];

  const currentProducts = products?.[priceTier]?.[timeSlot] || {};

  const tierLabels = {
    best_match: '⭐ Best Match',
    budget_picks: '💚 Budget',
    premium: '✨ Premium',
  };

  const morningSteps = ['cleanser', 'serum', 'moisturizer', 'sunscreen', 'eye_cream'];
  const nightSteps = ['cleanser', 'treatment', 'moisturizer', 'eye_cream'];

  const currentSteps = timeSlot === 'morning' ? morningSteps : nightSteps;
  const missingSteps = currentSteps.filter(s => !currentProducts[s]);

  return (
    <div className="space-y-6">

      {/* Key Ingredients Section */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-lg">🧪</span>
          <h3 className="font-semibold text-gray-800">Key Ingredients For You</h3>
        </div>

        {/* Conflict warnings */}
        {conflictWarnings.length > 0 && (
          <div className="mb-4 bg-amber-50 border border-amber-100 rounded-xl p-3">
            <p className="text-xs font-semibold text-amber-700 mb-1">⚠ Ingredient Conflicts Detected</p>
            {conflictWarnings.map((w: string, i: number) => (
              <p key={i} className="text-xs text-amber-600">{w}</p>
            ))}
          </div>
        )}

        {/* Morning ingredients */}
        {ingredients?.morning?.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-semibold text-orange-500 mb-2 flex items-center gap-1">
              🌅 Morning Ingredients
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
            <p className="text-xs font-semibold text-purple-500 mb-2 flex items-center gap-1">
              🌙 Night Ingredients
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
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-lg">🛍️</span>
          <h3 className="font-semibold text-gray-800">Recommended Products</h3>
        </div>

        {/* Price tier tabs */}
        <div className="flex gap-2 mb-4 flex-wrap">
          {(Object.keys(tierLabels) as Array<keyof typeof tierLabels>).map((tier) => (
            <button
              key={tier}
              onClick={() => setPriceTier(tier)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer ${
                priceTier === tier
                  ? 'bg-rose-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tierLabels[tier]}
            </button>
          ))}
        </div>

        {/* Morning / Night toggle */}
        <div className="flex gap-2 mb-5">
          <button
            onClick={() => setTimeSlot('morning')}
            className={`px-4 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer ${
              timeSlot === 'morning'
                ? 'bg-orange-100 text-orange-600 border border-orange-200'
                : 'bg-gray-50 text-gray-500 border border-gray-100 hover:bg-gray-100'
            }`}
          >
            🌅 Morning Routine
          </button>
          <button
            onClick={() => setTimeSlot('night')}
            className={`px-4 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer ${
              timeSlot === 'night'
                ? 'bg-indigo-100 text-indigo-600 border border-indigo-200'
                : 'bg-gray-50 text-gray-500 border border-gray-100 hover:bg-gray-100'
            }`}
          >
            🌙 Night Routine
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
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
                <p className="text-xs font-semibold text-gray-500 mb-2">No match found for:</p>
                <div className="flex flex-wrap gap-2 mb-2">
                  {missingSteps.map(s => (
                    <span key={s} className="text-xs bg-white border border-gray-200 text-gray-400 px-3 py-1 rounded-full capitalize">
                      {s.replace('_', ' ')}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-gray-400">Try a different price tier or do a new scan to get more matches.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-10 text-gray-400 text-sm">
            No products available for this routine slot.
          </div>
        )}
      </div>
    </div>
  );
}