import { useCallback, useState } from 'react';
import {
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import type { AnalysisRecord } from '../../lib/types';
import { LEVEL_META } from '../../lib/levels';
import { Card } from '../../components/Card';
import { colors, radius, spacing, typography } from '../../constants/theme';

export default function FavoritesScreen() {
  const router = useRouter();
  const [items, setItems] = useState<AnalysisRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('analyses')
      .select('*')
      .eq('is_favorite', true)
      .order('created_at', { ascending: false });
    if (!error && data) setItems(data as AnalysisRecord[]);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={typography.h2}>お気に入り</Text>
        <Text style={[typography.small, { color: colors.neutral[500] }]}>
          よく買う商品をすぐに確認できます
        </Text>
      </View>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
      >
        {items.length === 0 && !loading ? (
          <Card style={styles.empty}>
            <Text style={[typography.small, { color: colors.neutral[500] }]}>
              お気に入り登録した商品がありません。分析結果画面でハートマークを押すと登録できます。
            </Text>
          </Card>
        ) : (
          items.map((item) => (
            <Pressable
              key={item.id}
              onPress={() => router.push({ pathname: '/result', params: { id: item.id } })}
            >
              <Card style={styles.row}>
                {item.photo_url ? (
                  <Image source={{ uri: item.photo_url }} style={styles.thumb} />
                ) : (
                  <View style={[styles.thumb, styles.thumbPlaceholder]} />
                )}
                <View style={styles.rowInfo}>
                  <Text style={typography.bodyBold} numberOfLines={1}>
                    {item.product_name}
                  </Text>
                  <Text style={[typography.small, { color: colors.neutral[700] }]} numberOfLines={1}>
                    {LEVEL_META[item.overall_level].emoji} {item.top_summary}
                  </Text>
                </View>
              </Card>
            </Pressable>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral[50],
  },
  header: {
    paddingHorizontal: spacing(2.5),
    paddingTop: spacing(2),
    paddingBottom: spacing(1),
    gap: 2,
  },
  content: {
    padding: spacing(2),
    gap: spacing(1.5),
  },
  empty: {
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(1.5),
  },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
  },
  thumbPlaceholder: {
    backgroundColor: colors.neutral[100],
  },
  rowInfo: {
    flex: 1,
    gap: 2,
  },
});
