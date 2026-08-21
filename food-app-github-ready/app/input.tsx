import { useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Sparkles } from 'lucide-react-native';
import { Pressable } from 'react-native';
import { supabase } from '../lib/supabase';
import { buildAnalysis } from '../lib/analysis';
import type { NutrientInfoRow, NutritionInput } from '../lib/types';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { colors, radius, spacing, typography } from '../constants/theme';

const NUTRITION_FIELDS: { key: keyof NutritionInput; label: string; unit: string }[] = [
  { key: 'energy', label: 'エネルギー', unit: 'kcal' },
  { key: 'protein', label: 'たんぱく質', unit: 'g' },
  { key: 'fat', label: '脂質', unit: 'g' },
  { key: 'saturated_fat', label: '　うち飽和脂肪酸', unit: 'g' },
  { key: 'carbohydrate', label: '炭水化物', unit: 'g' },
  { key: 'sugars', label: '　うち糖類', unit: 'g' },
  { key: 'fiber', label: '　うち食物繊維', unit: 'g' },
  { key: 'salt', label: '食塩相当量', unit: 'g' },
];

interface OcrResult {
  product_name?: string;
  ingredients?: string;
  nutrition?: Record<string, number>;
}

export default function InputScreen() {
  const router = useRouter();
  const { photoUri, ocrData } = useLocalSearchParams<{
    photoUri?: string;
    ocrData?: string;
  }>();

  let parsedOcr: OcrResult | null = null;
  if (ocrData) {
    try {
      parsedOcr = JSON.parse(ocrData) as OcrResult;
    } catch {
      parsedOcr = null;
    }
  }

  const [productName, setProductName] = useState(parsedOcr?.product_name ?? '');
  const [ingredientsText, setIngredientsText] = useState(parsedOcr?.ingredients ?? '');
  const [nutrition, setNutrition] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    if (parsedOcr?.nutrition) {
      for (const key of Object.keys(parsedOcr.nutrition)) {
        init[key] = String(parsedOcr.nutrition[key]);
      }
    }
    return init;
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateNutrition = (key: string, value: string) => {
    setNutrition((prev) => ({ ...prev, [key]: value }));
  };

  const handleAnalyze = async () => {
    if (!ingredientsText.trim()) {
      setError('原材料名を入力してください。');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const { data: nutrientRows, error: nutrientError } = await supabase
        .from('nutrient_info')
        .select('*');
      if (nutrientError || !nutrientRows) {
        throw new Error('成分データの取得に失敗しました。');
      }

      const nutritionInput: NutritionInput = {};
      for (const field of NUTRITION_FIELDS) {
        const raw = nutrition[field.key];
        if (raw && raw.trim() !== '') {
          const parsed = Number(raw);
          if (!Number.isNaN(parsed)) {
            nutritionInput[field.key] = parsed;
          }
        }
      }

      const result = buildAnalysis(nutritionInput, ingredientsText, nutrientRows as NutrientInfoRow[]);

      let photoUrl: string | null = null;
      if (photoUri) {
        try {
          const response = await fetch(photoUri);
          const blob = await response.blob();
          const path = `photo-${Date.now()}.jpg`;
          const { error: uploadError } = await supabase.storage
            .from('product-photos')
            .upload(path, blob, { contentType: 'image/jpeg' });
          if (!uploadError) {
            const { data: publicUrlData } = supabase.storage
              .from('product-photos')
              .getPublicUrl(path);
            photoUrl = publicUrlData.publicUrl;
          }
        } catch {
          photoUrl = null;
        }
      }

      const { data: inserted, error: insertError } = await supabase
        .from('analyses')
        .insert({
          product_name: productName.trim() || '名称未設定の商品',
          photo_url: photoUrl,
          overall_level: result.overallLevel,
          top_summary: result.topSummary,
          key_points: result.keyPoints,
          ingredients_text: ingredientsText.trim(),
          nutrition: result.nutritionResults,
          matched_additives: result.additives,
        })
        .select('id')
        .maybeSingle();

      if (insertError || !inserted) {
        throw new Error('分析結果の保存に失敗しました。');
      }

      router.replace({ pathname: '/result', params: { id: inserted.id } });
    } catch (e) {
      setError(e instanceof Error ? e.message : '分析に失敗しました。もう一度お試しください。');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={22} color={colors.neutral[700]} />
          </Pressable>
          <Text style={typography.h3}>ラベルの内容を確認</Text>
        </View>
        <ScrollView contentContainerStyle={styles.content}>
          {photoUri ? <Image source={{ uri: photoUri }} style={styles.photo} /> : null}

          {parsedOcr ? (
            <View style={styles.ocrBanner}>
              <Sparkles size={16} color={colors.primary[700]} />
              <Text style={[typography.small, { color: colors.primary[700], fontWeight: '600' }]}>
                写真から自動で読み取りました。内容を確認・修正してください。
              </Text>
            </View>
          ) : null}

          <Card style={styles.card}>
            <Text style={typography.bodyBold}>商品名</Text>
            <TextInput
              style={styles.input}
              placeholder="例：〇〇のクッキー"
              placeholderTextColor={colors.neutral[400]}
              value={productName}
              onChangeText={setProductName}
            />
          </Card>

          <Card style={styles.card}>
            <Text style={typography.bodyBold}>原材料名</Text>
            <Text style={[typography.caption, styles.helper]}>
              パッケージの「原材料名」欄の内容です。読み取り間違いがあれば修正してください。
            </Text>
            <TextInput
              style={[styles.input, styles.multiline]}
              placeholder="例：小麦粉、砂糖、ショートニング、食塩、香料..."
              placeholderTextColor={colors.neutral[400]}
              value={ingredientsText}
              onChangeText={setIngredientsText}
              multiline
              textAlignVertical="top"
            />
          </Card>

          <Card style={styles.card}>
            <Text style={typography.bodyBold}>栄養成分表示</Text>
            <Text style={[typography.caption, styles.helper]}>
              パッケージに表示されている1食分（または1包装分）の量です。分からない項目は空欄で構いません。
            </Text>
            {NUTRITION_FIELDS.map((field) => (
              <View key={field.key} style={styles.nutritionRow}>
                <Text style={[typography.small, styles.nutritionLabel]}>{field.label}</Text>
                <TextInput
                  style={styles.nutritionInput}
                  placeholder="0"
                  placeholderTextColor={colors.neutral[400]}
                  keyboardType="decimal-pad"
                  value={nutrition[field.key] ?? ''}
                  onChangeText={(v) => updateNutrition(field.key, v)}
                />
                <Text style={[typography.small, styles.unit]}>{field.unit}</Text>
              </View>
            ))}
          </Card>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Button label="分析する" onPress={handleAnalyze} loading={submitting} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral[50],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(1.5),
    paddingHorizontal: spacing(2),
    paddingVertical: spacing(1.5),
    backgroundColor: colors.neutral[0],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  backButton: {
    padding: spacing(0.5),
  },
  content: {
    padding: spacing(2),
    gap: spacing(2),
    paddingBottom: spacing(5),
  },
  photo: {
    width: '100%',
    height: 350,
    borderRadius: radius.lg,
  },
  ocrBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(1),
    backgroundColor: colors.primary[50],
    borderRadius: radius.md,
    paddingHorizontal: spacing(2),
    paddingVertical: spacing(1.5),
  },
  card: {
    gap: spacing(1),
  },
  helper: {
    color: colors.neutral[500],
  },
  input: {
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderRadius: radius.md,
    paddingHorizontal: spacing(1.5),
    paddingVertical: spacing(1.25),
    fontSize: 15,
    color: colors.neutral[900],
  },
  multiline: {
    minHeight: 100,
  },
  nutritionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(1),
  },
  nutritionLabel: {
    flex: 1,
    color: colors.neutral[700],
  },
  nutritionInput: {
    width: 80,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderRadius: radius.md,
    paddingHorizontal: spacing(1),
    paddingVertical: spacing(0.75),
    textAlign: 'right',
    fontSize: 15,
  },
  unit: {
    width: 40,
    color: colors.neutral[500],
  },
  error: {
    color: colors.error[600],
    fontSize: 13,
  },
});
