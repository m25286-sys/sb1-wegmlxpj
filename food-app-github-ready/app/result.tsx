import { useCallback, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, ChevronDown, Heart, Trash2 } from 'lucide-react-native';
import { supabase } from '../lib/supabase';
import type { AnalysisRecord, ConcernLevel, MatchedAdditive, NutritionResult } from '../lib/types';
import { LEVEL_META } from '../lib/levels';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { colors, radius, spacing, typography } from '../constants/theme';

export default function ResultScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [record, setRecord] = useState<AnalysisRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [showIngredients, setShowIngredients] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    const { data, error: queryError } = await supabase
      .from('analyses')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (queryError || !data) {
      setError('分析結果が見つかりませんでした。');
      setRecord(null);
    } else {
      setRecord(data as AnalysisRecord);
      setError(null);
    }
    setLoading(false);
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const toggleFavorite = async () => {
    if (!record) return;
    const newValue = !record.is_favorite;
    setRecord({ ...record, is_favorite: newValue });
    await supabase.from('analyses').update({ is_favorite: newValue }).eq('id', record.id);
  };

  const handleDelete = async () => {
    if (!record) return;
    await supabase.from('analyses').delete().eq('id', record.id);
    router.replace('/(tabs)/history');
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={[typography.body, { color: colors.neutral[500] }]}>読み込み中...</Text>
      </SafeAreaView>
    );
  }

  if (error || !record) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={[typography.body, { color: colors.error[600] }]}>{error ?? 'エラーが発生しました'}</Text>
        <Button label="履歴に戻る" onPress={() => router.replace('/(tabs)/history')} style={styles.centerButton} />
      </SafeAreaView>
    );
  }

  const overallMeta = LEVEL_META[record.overall_level];
  const allItems: { key: string; displayName: string; level: ConcernLevel; value: number | null; unit: string | null; whyText: string; effectText: string; sourceText: string; matchedText?: string }[] = [
    ...record.nutrition.map((n: NutritionResult) => ({
      key: n.key,
      displayName: n.displayName,
      level: n.level,
      value: n.value,
      unit: n.unit,
      whyText: n.whyText,
      effectText: n.effectText,
      sourceText: n.sourceText,
    })),
    ...record.matched_additives.map((a: MatchedAdditive) => ({
      key: a.key,
      displayName: a.displayName,
      level: a.level,
      value: null,
      unit: null,
      whyText: a.whyText,
      effectText: a.effectText,
      sourceText: a.sourceText,
      matchedText: a.matchedText,
    })),
  ];

  const ranked = [...allItems].sort((a, b) => {
    const rank: Record<ConcernLevel, number> = { red: 3, orange: 2, green: 1, gray: 0 };
    return rank[b.level] - rank[a.level];
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.topBar}>
        <Pressable style={styles.iconBtn} onPress={() => router.back()}>
          <ArrowLeft size={22} color={colors.neutral[700]} />
        </Pressable>
        <Pressable style={styles.iconBtn} onPress={toggleFavorite}>
          <Heart
            size={22}
            color={record.is_favorite ? colors.error[500] : colors.neutral[400]}
            fill={record.is_favorite ? colors.error[500] : 'none'}
          />
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        {record.photo_url ? (
          <Image source={{ uri: record.photo_url }} style={styles.photo} />
        ) : null}

        <Text style={typography.h2}>{record.product_name}</Text>

        <Card style={[styles.topCard, { backgroundColor: overallMeta.background }]}>
          <View style={styles.topCardHeader}>
            <Text style={styles.topEmoji}>{overallMeta.emoji}</Text>
            <Text style={[typography.body, { color: overallMeta.color, fontWeight: '600' }]}>
              {overallMeta.label}
            </Text>
          </View>
          <Text style={[typography.h3, { color: overallMeta.color }]}>
            {record.top_summary}
          </Text>
        </Card>

        <View style={styles.section}>
          <Text style={typography.h3}>特に確認したい成分</Text>
          {ranked.length === 0 ? (
            <Card>
              <Text style={[typography.small, { color: colors.neutral[500] }]}>
                判定対象の成分がありません。
              </Text>
            </Card>
          ) : (
            ranked.map((item, index) => {
              const meta = LEVEL_META[item.level];
              const isOpen = expandedItem === item.key;
              return (
                <Card key={item.key} style={styles.concernCard}>
                  <Pressable
                    style={styles.concernHeader}
                    onPress={() => setExpandedItem(isOpen ? null : item.key)}
                  >
                    <View style={styles.concernLeft}>
                      <Text style={styles.rankNumber}>{index + 1}</Text>
                      <Text style={styles.emojiText}>{meta.emoji}</Text>
                      <View style={styles.concernTitle}>
                        <Text style={typography.bodyBold}>{item.displayName}</Text>
                        {item.value !== null && item.unit ? (
                          <Text style={[typography.small, { color: colors.neutral[500] }]}>
                            {item.value}{item.unit}
                          </Text>
                        ) : item.matchedText ? (
                          <Text style={[typography.small, { color: colors.neutral[500] }]}>
                            「{item.matchedText}」を検出
                          </Text>
                        ) : null}
                        <Text style={[typography.caption, { color: meta.color, fontWeight: '600' }]}>
                          {meta.label}
                        </Text>
                      </View>
                    </View>
                    <ChevronDown
                      size={18}
                      color={colors.neutral[400]}
                      style={isOpen ? styles.chevronOpen : undefined}
                    />
                  </Pressable>
                  {isOpen ? (
                    <View style={styles.concernBody}>
                      <Text style={[typography.small, styles.concernText]}>
                        <Text style={{ fontWeight: '600' }}>なぜ注意？{'\n'}</Text>
                        {item.whyText}
                      </Text>
                      <Text style={[typography.small, styles.concernText]}>
                        <Text style={{ fontWeight: '600' }}>体への影響{'\n'}</Text>
                        {item.effectText}
                      </Text>
                      <Text style={[typography.caption, styles.source]}>
                        根拠: {item.sourceText}
                      </Text>
                    </View>
                  ) : null}
                </Card>
              );
            })
          )}
        </View>

        <View style={styles.section}>
          <Text style={typography.h3}>この商品を選ぶときのポイント</Text>
          <Card>
            <Text style={[typography.body, { color: colors.neutral[700] }]}>
              {record.key_points}
            </Text>
          </Card>
        </View>

        <View style={styles.section}>
          <Pressable
            style={styles.ingredientsToggle}
            onPress={() => setShowIngredients(!showIngredients)}
          >
            <Text style={typography.bodyBold}>原材料一覧を表示</Text>
            <ChevronDown
              size={18}
              color={colors.neutral[400]}
              style={showIngredients ? styles.chevronOpen : undefined}
            />
          </Pressable>
          {showIngredients ? (
            <Card>
              <Text style={[typography.small, { color: colors.neutral[700], lineHeight: 22 }]}>
                {record.ingredients_text}
              </Text>
            </Card>
          ) : null}
        </View>

        <View style={styles.section}>
          <Text style={[typography.caption, { color: colors.neutral[400] }]}>
            このアプリは医療診断や治療の代替ではありません。特定の病気・妊娠・アレルギーなどがある方は、必要に応じて医師・管理栄養士などにご相談ください。
          </Text>
        </View>

        <Pressable style={styles.deleteRow} onPress={handleDelete}>
          <Trash2 size={16} color={colors.error[500]} />
          <Text style={[typography.small, { color: colors.error[500] }]}>この分析を削除</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral[50],
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing(3),
    gap: spacing(2),
  },
  centerButton: {
    width: 200,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing(2),
    paddingVertical: spacing(1),
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: spacing(2),
    gap: spacing(2.5),
    paddingBottom: spacing(6),
  },
  photo: {
    width: '100%',
    height: 200,
    borderRadius: radius.lg,
  },
  topCard: {
    gap: spacing(1),
    padding: spacing(2.5),
    borderRadius: radius.xl,
    backgroundColor: colors.neutral[0],
    borderColor: colors.neutral[100],
    borderWidth: 1,
  },
  topCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(1),
  },
  topEmoji: {
    fontSize: 18,
  },
  emojiText: {
    fontSize: 16,
  },
  section: {
    gap: spacing(1.5),
  },
  concernCard: {
    padding: spacing(2),
    borderRadius: radius.md,
    backgroundColor: colors.neutral[0],
    borderColor: colors.neutral[100],
    borderWidth: 1,
    gap: spacing(1),
  },
  concernHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  concernLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(1.5),
    flex: 1,
  },
  rankNumber: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.neutral[400],
    width: 20,
  },
  concernTitle: {
    flex: 1,
    gap: 2,
  },
  chevronOpen: {
    transform: [{ rotate: '180deg' }],
  },
  concernBody: {
    marginTop: spacing(1.5),
    gap: spacing(1.5),
    paddingTop: spacing(1.5),
    borderTopWidth: 1,
    borderTopColor: colors.neutral[100],
  },
  concernText: {
    color: colors.neutral[700],
    lineHeight: 22,
  },
  source: {
    color: colors.neutral[400],
  },
  ingredientsToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing(0.5),
  },
  deleteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(1),
    alignSelf: 'center',
    paddingVertical: spacing(1),
  },
});
