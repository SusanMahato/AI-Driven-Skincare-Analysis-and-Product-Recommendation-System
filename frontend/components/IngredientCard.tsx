import { Sun, Moon, Repeat2, AlertTriangle } from 'lucide-react';

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
  const SafeTimeIcon =
    ingredient.safe_time === 'morning'
      ? Sun
      : ingredient.safe_time === 'night'
      ? Moon
      : Repeat2;

  const safeTimeLabel =
    ingredient.safe_time === 'morning'
      ? 'Morning'
      : ingredient.safe_time === 'night'
      ? 'Night'
      : 'AM & PM';

  const priorityLabel =
    ingredient.score >= 5 ? 'HIGH' : ingredient.score >= 3 ? 'MED' : 'LOW';

  const priorityColor =
    ingredient.score >= 5
      ? 'bg-[#BD7B54]/15 text-[#BD7B54]'
      : ingredient.score >= 3
      ? 'bg-[#20241F]/8 text-[#20241F]/60'
      : 'bg-[#20241F]/5 text-[#20241F]/40';

  return (
    <div className="rounded-lg border border-[#20241F]/12 bg-white p-4 hover:border-[#BD7B54]/30 transition">
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="text-sm font-medium text-[#20241F] leading-tight">
          {ingredient.name}
        </h4>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span
            className={`text-[10px] font-semibold uppercase tracking-[0.04em] px-2 py-0.5 rounded-md ${priorityColor}`}
          >
            {priorityLabel}
          </span>

          <span title={safeTimeLabel}>
            <SafeTimeIcon size={13} className="text-[#20241F]/35" />
          </span>
        </div>
      </div>

      {ingredient.benefit && (
        <p className="text-xs text-[#20241F]/55 leading-relaxed line-clamp-2 mb-2.5">
          {ingredient.benefit}
        </p>
      )}

      {ingredient.condition_tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {ingredient.condition_tags.map((tag) => (
            <span
              key={tag}
              className="text-xs bg-[#F5F2EA] text-[#20241F]/55 border border-[#20241F]/10 px-2 py-0.5 rounded-full capitalize"
            >
              {tag.replace('_', ' ')}
            </span>
          ))}
        </div>
      )}

      {ingredient.conflict_with.length > 0 && (
        <p className="flex items-start gap-1 text-xs text-amber-700 mt-1.5">
          <AlertTriangle size={12} className="mt-0.5 flex-shrink-0" />
          <span>Avoid with: {ingredient.conflict_with.join(', ')}</span>
        </p>
      )}
    </div>
  );
}
