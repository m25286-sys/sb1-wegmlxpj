import { useCallback, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronDown } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';
import type { NutrientInfoRow } from '../../lib/types';
import { Card } from '../../components/Card';
import { colors, spacing, typography } from '../../constants/theme';

const CATEGORY_LABEL: Record<string, string> = {
  judged: '量で注意度を判定する栄養成分',
  info: '参考表示する栄養成分',
  additive: '原材料表示に出てくる添加物など',
};

export default function LearnScreen() {
  const [rows, setRows] = useState<NutrientInfoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('nutrient_info')
      .select('*')
      .order('sort_order', { ascending: true });
    if (!error && data) setRows(data as NutrientInfoRow[]);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const grouped: Record<string, NutrientInfoRow[]> = {};
  for (const row of rows) {
    if (!grouped[row.category]) grouped[row.category] = [];
    grouped[row.category].push(row);
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={typography.h2}>成分を知る</Text>
        <Text style={[typography.small, { color: colors.neutral[500] }]}>
          主要な成分について、なぜ注意なのか、体への影響、根拠をまとめました。
        </Text>
      </View>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
      >
        {(['judged', 'info', 'additive'] as const).map((cat) =>
          grouped[cat] ? (
            <View key={cat} style={styles.section}>
              <Text style={[typography.bodyBold, { color: colors.neutral[700] }]}>
                {CATEGORY_LABEL[cat]}
              </Text>
              {grouped[cat].map((row) => {
                const isOpen = expanded === row.id;
                return (
                  <Card key={row.id} style={styles.item}>
                    <Pressable
                      style={styles.itemHeader}
                      onPress={() => setExpanded(isOpen ? null : row.id)}
                    >
                      <Text style={typography.bodyBold}>{row.display_name}</Text>
                      <ChevronDown
                        size={18}
                        color={colors.neutral[400]}
                        style={isOpen ? styles.chevronOpen : undefined}
                      />
                    </Pressable>
                    {isOpen ? (
                      <View style={styles.itemBody}>
                        <Text style={[typography.small, styles.itemText]}>
                          <Text style={{ fontWeight: '600' }}>なぜ注意？{'\n'}</Text>
                          {row.why_text}
                        </Text>
                        <Text style={[typography.small, styles.itemText]}>
                          <Text style={{ fontWeight: '600' }}>体への影響{'\n'}</Text>
                          {row.effect_text}
                        </Text>
                        <Text style={[typography.caption, styles.source]}>
                          根拠: {row.source_text}
                        </Text>
                      </View>
                    ) : null}
                  </Card>
                );
              })}
            </View>
          ) : null
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
    gap: spacing(2),
    paddingBottom: spacing(5),
  },
  section: {
    gap: spacing(1),
  },
  item: {
    gap: 0,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chevronOpen: {
    transform: [{ rotate: '180deg' }],
  },
  itemBody: {
    marginTop: spacing(1.5),
    gap: spacing(1.5),
  },
  itemText: {
    color: colors.neutral[700],
    lineHeight: 22,
  },
  source: {
    color: colors.neutral[400],
    marginTop: spacing(0.5),
  },
});
