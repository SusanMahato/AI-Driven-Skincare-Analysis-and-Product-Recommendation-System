interface Product {
  id: number;
  name: string;
  brand: string;
  category: string;
  price_usd: number | null;
  price_npr: number | null;
  price_tier: string;
  key_ingredients: string[];
  matched_ingredients: string[];
  why_it_suits_you: string | null;
  safe_time: string;
  buy_link_global: string | null;
  conflict_warning: string | null;
}

interface ProductCardProps {
  product: Product;
  step: string;
}

export default function ProductCard({ product, step }: ProductCardProps) {
  const tierColor =
    product.price_tier === 'budget'
      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
      : product.price_tier === 'premium'
      ? 'bg-purple-50 text-purple-700 border border-purple-200'
      : 'bg-blue-50 text-blue-700 border border-blue-200';

  const stepLabel: Record<string, string> = {
    cleanser: '1. Cleanser',
    serum: '2. Serum',
    moisturizer: '3. Moisturizer',
    sunscreen: '4. Sunscreen',
    eye_cream: '5. Eye Cream',
    treatment: '2. Treatment',
    toner: '2. Toner',
  };

  return (
    <div className="rounded-lg border border-[#20241F]/12 bg-white p-5 hover:border-[#BD7B54]/30 transition">
      <p className="font-[family-name:var(--font-mono)] text-[10px] text-[#20241F]/40 font-medium mb-2 uppercase tracking-[0.08em]">
        {stepLabel[step] || step}
      </p>

      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          <h4 className="text-sm font-medium text-[#20241F] leading-tight">{product.name}</h4>
          <p className="text-xs text-[#20241F]/40 mt-0.5">{product.brand}</p>
        </div>
        <span className={`text-[10px] font-semibold uppercase tracking-[0.04em] px-2 py-0.5 rounded-md flex-shrink-0 ${tierColor}`}>
          {product.price_tier}
        </span>
      </div>

      <div className="flex items-center gap-2 mb-3">
        {product.price_npr && (
          <span className="font-[family-name:var(--font-display)] text-base font-medium text-[#20241F]">₨{product.price_npr.toLocaleString()}</span>
        )}
        {product.price_usd && (
          <span className="text-xs text-[#20241F]/40">(${product.price_usd})</span>
        )}
      </div>

      {product.key_ingredients && product.key_ingredients.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {product.key_ingredients.slice(0, 6).map((ing) => {
            const isMatched = product.matched_ingredients?.some(
              (m) => ing.toLowerCase().includes(m.toLowerCase())
            );
            return (
              <span
                key={ing}
                className={`text-xs px-2 py-0.5 rounded-full ${
                  isMatched
                    ? 'bg-[#BD7B54]/10 text-[#BD7B54] font-medium'
                    : 'bg-[#F5F2EA] text-[#20241F]/40'
                }`}
              >
                {ing}
              </span>
            );
          })}
        </div>
      )}

      {product.why_it_suits_you && (
        <p className="text-xs text-[#20241F]/65 italic leading-relaxed mb-3 border-l-2 border-[#BD7B54]/30 pl-2.5">
          "{product.why_it_suits_you}"
        </p>
      )}

      {product.conflict_warning && (
        <p className="text-xs text-amber-700 mb-3">⚠ {product.conflict_warning}</p>
      )}

      {/* Buy link — external destination, correctly a plain <a>, not next/link */}
      <div className="mt-3">
         <a
          href={product.buy_link_global || `https://www.amazon.com/s?k=${encodeURIComponent(product.name + ' ' + product.brand)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="block text-center font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.06em] text-[#F5F2EA] bg-[#182019] hover:bg-[#BD7B54] transition px-4 py-2.5 rounded-md"
        >
          {product.buy_link_global ? 'View Product →' : 'Search on Amazon →'}
        </a>
        {!product.buy_link_global && (
          <p className="text-xs text-[#20241F]/40 text-center mt-2 leading-relaxed">
            Product may not be available on Amazon. Check the brand's official website or local beauty stores for availability.
          </p>
        )}
      </div>
    </div>
  );
}
