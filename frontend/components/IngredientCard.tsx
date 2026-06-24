interface Ingredient {
  id: number;
  name: string;
  benefit: string;
  safe_time: string;
  condition_tags: string[];
  conflict_with: string[];
  score: number;
  conflict_warning: string | null;
}

interface IngredientCardProps {
  ingredient: Ingredient;
}

export default function IngredientCard({ ingredient }: IngredientCardProps) {
  const safeTimeIcon = ingredient.safe_time === 'morning' ? '🌅' : ingredient.safe_time === 'night' ? '🌙' : '🌗';
  const safeTimeLabel = ingredient.safe_time === 'morning' ? 'Morning' : ingredient.safe_time === 'night' ? 'Night' : 'AM & PM';

  const priorityLabel = ingredient.score >= 5 ? 'HIGH' : ingredient.score >= 3 ? 'MED' : 'LOW';
  const priorityColor = ingredient.score >= 5
    ? 'bg-rose-100 text-rose-600'
    : ingredient.score >= 3
    ? 'bg-amber-100 text-amber-600'
    : 'bg-gray-100 text-gray-500';

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition">
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="text-sm font-semibold text-gray-800 leading-tight">{ingredient.name}</h4>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${priorityColor}`}>
            {priorityLabel}
          </span>
          <span className="text-sm" title={safeTimeLabel}>{safeTimeIcon}</span>
        </div>
      </div>

      {ingredient.benefit && (
        <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 mb-2">
          {ingredient.benefit}
        </p>
      )}

      {ingredient.condition_tags && ingredient.condition_tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {ingredient.condition_tags.map((tag) => (
            <span key={tag} className="text-xs bg-rose-50 text-rose-500 px-2 py-0.5 rounded-full capitalize">
              {tag.replace('_', ' ')}
            </span>
          ))}
        </div>
      )}

      {ingredient.conflict_with && ingredient.conflict_with.length > 0 && (
        <p className="text-xs text-amber-600 mt-1">
          ⚠ Avoid with: {ingredient.conflict_with.join(', ')}
        </p>
      )}
    </div>
  );
}