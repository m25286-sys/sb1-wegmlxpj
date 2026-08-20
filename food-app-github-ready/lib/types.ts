export type ConcernLevel = 'red' | 'orange' | 'green' | 'gray';

export type NutrientCategory = 'judged' | 'info' | 'additive';

export interface NutrientInfoRow {
  id: string;
  key: string;
  category: NutrientCategory;
  display_name: string;
  aliases: string[];
  unit: string | null;
  low_max: number | null;
  medium_max: number | null;
  default_level: ConcernLevel | null;
  why_text: string;
  effect_text: string;
  source_text: string;
  sort_order: number;
}

export interface NutritionInput {
  energy?: number;
  protein?: number;
  fat?: number;
  saturated_fat?: number;
  carbohydrate?: number;
  sugars?: number;
  fiber?: number;
  salt?: number;
}

export interface NutritionResult {
  key: string;
  displayName: string;
  unit: string | null;
  value: number | null;
  category: NutrientCategory;
  level: ConcernLevel;
  whyText: string;
  effectText: string;
  sourceText: string;
}

export interface MatchedAdditive {
  key: string;
  displayName: string;
  matchedText: string;
  level: ConcernLevel;
  whyText: string;
  effectText: string;
  sourceText: string;
}

export interface AnalysisResult {
  overallLevel: ConcernLevel;
  topSummary: string;
  keyPoints: string;
  nutritionResults: NutritionResult[];
  additives: MatchedAdditive[];
}

export interface AnalysisRecord {
  id: string;
  product_name: string;
  photo_url: string | null;
  overall_level: ConcernLevel;
  top_summary: string;
  key_points: string;
  ingredients_text: string;
  nutrition: NutritionResult[];
  matched_additives: MatchedAdditive[];
  is_favorite: boolean;
  created_at: string;
}
