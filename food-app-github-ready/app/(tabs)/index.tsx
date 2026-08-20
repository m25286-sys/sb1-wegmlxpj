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
import { Camera, ChevronRight, CircleHelp } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import type { AnalysisRecord } from '../../lib/types';
import { LEVEL_META } from '../../lib/levels';
import { Card } from '../../components/Card';
import { colors, radius, spacing, typography } from '../../constants/theme';

export default function HomeScreen() {
  const router = useRouter();
  const [recent, setRecent] = useState<AnalysisRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRecent = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('analyses')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(3);
    if (!error && data) {
      setRecent(data as AnalysisRecord[]);
    }
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadRecent();
    }, [loadRecent])
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadRecent} />}
      >
        <View style={styles.header}>
          <Text style={typography.h2}>食品ラベルチェック</Text>
          <Text style={[typography.body, styles.subtitle]}>
            原材料を見ても分からないを、分かるに変える。
          </Text>
        </View>

        <Pressable
          style={({ pressed }) => [styles.captureButton, pressed && styles.captureButtonPressed]}
          onPress={() => router.push('/capture')}
        >
          <View style={styles.captureIconWrap}>
            <Camera size={32} color={colors.neutral[0]} />
          </View>
          <View style={styles.captureTextWrap}>
            <Text style={styles.captureTitle}>食品を撮影する</Text>
            <Text style={styles.captureSubtitle}>原材料・栄養成分表示を撮って分析</Text>
          </View>
          <ChevronRight size={22} color={colors.neutral[0]} />
        </Pressable>

        <Pressable style={styles.howToRow} onPress={() => router.push('/how-to-use')}>
          <CircleHelp size={18} color={colors.secondary[700]} />
          <Text style={[typography.small, styles.howToText]}>使い方を見る</Text>
        </Pressable>

        <View style={styles.section}>
          <Text style={typography.h3}>最近チェックした商品</Text>
          {recent.length === 0 && !loading ? (
            <Card style={styles.emptyCard}>
              <Text style={[typography.small, { color: colors.neutral[500] }]}>
                まだ商品を分析していません。上のボタンから撮影してみましょう。
              </Text>
            </Card>
          ) : (
            recent.map((item) => (
              <Pressable
                key={item.id}
                onPress={() => router.push({ pathname: '/result', params: { id: item.id } })}
              >
                <Card style={styles.recentCard}>
                  {item.photo_url ? (
                    <Image source={{ uri: item.photo_url }} style={styles.thumb} />
                  ) : (
                    <View style={[styles.thumb, styles.thumbPlaceholder]} />
                  )}
                  <View style={styles.recentInfo}>
                    <Text style={typography.bodyBold} numberOfLines={1}>
                      {item.product_name}
                    </Text>
                    <Text style={[typography.caption, { color: colors.neutral[500] }]} numberOfLines={1}>
                      {LEVEL_META[item.overall_level].emoji} {item.top_summary}
                    </Text>
                  </View>
                </Card>
              </Pressable>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral[50],
  },
  content: {
    padding: spacing(2.5),
    gap: spacing(2),
  },
  header: {
    gap: spacing(0.5),
  },
  subtitle: {
    color: colors.neutral[600],
  },
  captureButton: {
    backgroundColor: colors.primary[600],
    borderRadius: radius.xl,
    padding: spacing(2.5),
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(2),
    shadowColor: colors.primary[900],
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  captureButtonPressed: {
    opacity: 0.9,
  },
  captureIconWrap: {
    width: 56,
    height: 56,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureTextWrap: {
    flex: 1,
  },
  captureTitle: {
    color: colors.neutral[0],
    fontSize: 20,
    fontWeight: '700',
  },
  captureSubtitle: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    marginTop: 2,
  },
  howToRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(0.75),
    alignSelf: 'center',
    paddingVertical: spacing(1),
  },
  howToText: {
    color: colors.secondary[700],
    fontWeight: '600',
  },
  section: {
    gap: spacing(1.5),
  },
  emptyCard: {
    alignItems: 'center',
  },
  recentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(1.5),
  },
  thumb: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
  },
  thumbPlaceholder: {
    backgroundColor: colors.neutral[100],
  },
  recentInfo: {
    flex: 1,
    gap: 2,
  },
});
