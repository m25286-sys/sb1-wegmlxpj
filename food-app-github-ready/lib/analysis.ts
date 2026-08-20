import type {
  AnalysisResult,
  ConcernLevel,
  MatchedAdditive,
  NutrientInfoRow,
  NutritionInput,
  NutritionResult,
} from './types';

const LEVEL_RANK: Record<ConcernLevel, number> = {
  red: 3,
  orange: 2,
  green: 1,
  gray: 0,
};

function levelForValue(
  value: number | null,
  lowMax: number | null,
  mediumMax: number | null
): ConcernLevel {
  if (value === null || (lowMax === null && mediumMax === null)) return 'gray';
  if (lowMax !== null && value <= lowMax) return 'green';
  if (mediumMax !== null && value <= mediumMax) return 'orange';
  if (mediumMax !== null && value > mediumMax) return 'red';
  return 'gray';
}

function matchAdditives(
  ingredientsText: string,
  additiveRows: NutrientInfoRow[]
): MatchedAdditive[] {
  const text = ingredientsText.trim();
  if (!text) return [];

  const matches: MatchedAdditive[] = [];
  for (const row of additiveRows) {
    const found = row.aliases.find((alias) => text.includes(alias));
    if (found) {
      matches.push({
        key: row.key,
        displayName: row.display_name,
        matchedText: found,
        level: row.default_level ?? 'gray',
        whyText: row.why_text,
        effectText: row.effect_text,
        sourceText: row.source_text,
      });
    }
  }
  return matches;
}

export function buildAnalysis(
  nutritionInput: NutritionInput,
  ingredientsText: string,
  nutrientRows: NutrientInfoRow[]
): AnalysisResult {
  const nutritionRows = nutrientRows
    .filter((row) => row.category === 'judged' || row.category === 'info')
    .sort((a, b) => a.sort_order - b.sort_order);

  const nutritionResults: NutritionResult[] = nutritionRows.map((row) => {
    const value = nutritionInput[row.key as keyof NutritionInput] ?? null;
    const level =
      row.category === 'judged' ? levelForValue(value, row.low_max, row.medium_max) : 'gray';
    return {
      key: row.key,
      displayName: row.display_name,
      unit: row.unit,
      value,
      category: row.category,
      level,
      whyText: row.why_text,
      effectText: row.effect_text,
      sourceText: row.source_text,
    };
  });

  const additiveRows = nutrientRows.filter((row) => row.category === 'additive');
  const additives = matchAdditives(ingredientsText, additiveRows);

  const judgedConcerns = nutritionResults.filter((r) => r.category === 'judged');
  const allConcerns: { displayName: string; level: ConcernLevel }[] = [
    ...judgedConcerns.map((c) => ({ displayName: c.displayName, level: c.level })),
    ...additives.map((a) => ({ displayName: a.displayName, level: a.level })),
  ];

  const sortedConcerns = [...allConcerns].sort(
    (a, b) => LEVEL_RANK[b.level] - LEVEL_RANK[a.level]
  );

  const primary = sortedConcerns.find((c) => c.level === 'red' || c.level === 'orange');
  const overallLevel: ConcernLevel = primary
    ? primary.level
    : allConcerns.some((c) => c.level === 'green')
      ? 'green'
      : 'gray';

  const topSummary = primary
    ? `この商品は${primary.displayName}に注意したい商品です`
    : '今回の表示では、特に大きな注意点は見つかりませんでした';

  const secondaryNames = sortedConcerns
    .filter((c) => c.level === 'red' || c.level === 'orange')
    .slice(0, 3)
    .map((c) => c.displayName);

  const keyPoints = secondaryNames.length
    ? `${secondaryNames.join('・')}を意識しながら、他の食事とのバランスを見て選ぶとよいでしょう。`
    : '今回確認した範囲では大きな注意点はありませんが、量や頻度も含めて全体の食事バランスで考えることが大切です。';

  return {
    overallLevel,
    topSummary,
    keyPoints,
    nutritionResults,
    additives,
  };
}
