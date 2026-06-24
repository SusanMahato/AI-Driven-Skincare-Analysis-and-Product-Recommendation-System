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
      ? 'bg-green-100 text-green-700'
      : product.price_tier === 'premium'
      ? 'bg-purple-100 text-purple-700'
      : 'bg-blue-100 text-blue-700';

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
    <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition">
      <p className="text-xs text-gray-400 font-medium mb-2 uppercase tracking-wide">
        {stepLabel[step] || step}
      </p>

      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          <h4 className="text-sm font-semibold text-gray-800 leading-tight">{product.name}</h4>
          <p className="text-xs text-gray-400 mt-0.5">{product.brand}</p>
        </div>
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${tierColor}`}>
          {product.price_tier.charAt(0).toUpperCase() + product.price_tier.slice(1)}
        </span>
      </div>

      <div className="flex items-center gap-2 mb-3">
        {product.price_npr && (
          <span className="text-base font-bold text-gray-800">₨{product.price_npr.toLocaleString()}</span>
        )}
        {product.price_usd && (
          <span className="text-xs text-gray-400">(${product.price_usd})</span>
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
                    ? 'bg-rose-100 text-rose-600 font-medium'
                    : 'bg-gray-50 text-gray-400'
                }`}
              >
                {ing}
              </span>
            );
          })}
        </div>
      )}

      {product.why_it_suits_you && (
        <p className="text-xs text-gray-600 italic leading-relaxed mb-3 border-l-2 border-rose-200 pl-2">
          "{product.why_it_suits_you}"
        </p>
      )}

      {product.conflict_warning && (
        <p className="text-xs text-amber-600 mb-3">⚠ {product.conflict_warning}</p>
      )}

     
     {/* Buy link */}
      <div className="mt-3">
        <a
          href={product.buy_link_global || `https://www.amazon.com/s?k=${encodeURIComponent(product.name + ' ' + product.brand)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="block text-center text-xs font-medium text-white bg-rose-500 hover:bg-rose-600 transition px-4 py-2 rounded-xl"
        >
          {product.buy_link_global ? 'View Product →' : 'Search on Amazon →'}
        </a>
        {!product.buy_link_global && (
          <p className="text-xs text-gray-400 text-center mt-2 leading-relaxed">
            Product may not be available on Amazon. Check the brand's official website or local beauty stores for availability.
          </p>
        )}
      </div>
    </div>
  );
}