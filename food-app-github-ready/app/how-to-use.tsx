import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Camera, FileText, Heart, History, ShieldCheck } from 'lucide-react-native';
import { Card } from '../components/Card';
import { colors, radius, spacing, typography } from '../constants/theme';

const STEPS = [
  { icon: 'camera', title: '1. 食品を撮影する', text: '商品パッケージの「原材料名」と「栄養成分表示」が写るように撮影します。' },
  { icon: 'input', title: '2. 内容を入力・確認', text: '撮影した画像を見ながら、原材料名と栄養成分の数値を入力します。分からない項目は空欄で大丈夫です。' },
  { icon: 'result', title: '3. 分析結果を見る', text: '摂りすぎに注意したい成分が色と文字で分かりやすく表示されます。タップすると詳しい説明が出ます。' },
  { icon: 'history', title: '4. 履歴・お気に入り', text: '過去の分析は履歴に保存されます。よく買う商品はお気に入りに登録すると、次回すぐ確認できます。' },
];

export default function HowToUseScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={22} color={colors.neutral[700]} />
        </Pressable>
        <Text style={typography.h3}>使い方</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.intro}>
          <Text style={[typography.body, { color: colors.neutral[600] }]}>
            専門知識がなくても、商品を買う前に「何に注意すればいいか」が分かるアプリです。
          </Text>
        </View>

        {STEPS.map((step) => (
          <Card key={step.title} style={styles.stepCard}>
            <Text style={typography.bodyBold}>{step.title}</Text>
            <Text style={[typography.small, { color: colors.neutral[600], lineHeight: 22 }]}>
              {step.text}
            </Text>
          </Card>
        ))}

        <Card style={styles.safetyCard}>
          <View style={styles.safetyHeader}>
            <ShieldCheck size={20} color={colors.primary[700]} />
            <Text style={typography.bodyBold}>大切なお約束</Text>
          </View>
          <Text style={[typography.small, { color: colors.neutral[600], lineHeight: 22 }]}>
            {`\u2022 「入っている＝危険」とは判断しません。摂りすぎや長期間の過剰摂取の観点でお伝えします。\n\u2022 情報が不足している場合は「判断できません」と表示します。\n\u2022 このアプリは医療診断や治療の代替ではありません。特定の病気・妊娠・アレルギーなどがある方は、医師・管理栄養士などにご相談ください。`}
          </Text>
        </Card>

        <View style={styles.legend}>
          <Text style={typography.bodyBold}>注意度の色</Text>
          <View style={styles.legendRow}>
            <Text style={styles.legendEmoji}>🔴</Text>
            <Text style={[typography.small, { color: colors.neutral[700] }]}>特に確認したい</Text>
          </View>
          <View style={styles.legendRow}>
            <Text style={styles.legendEmoji}>🟠</Text>
            <Text style={[typography.small, { color: colors.neutral[700] }]}>摂りすぎに注意</Text>
          </View>
          <View style={styles.legendRow}>
            <Text style={styles.legendEmoji}>🟢</Text>
            <Text style={[typography.small, { color: colors.neutral[700] }]}>大きな注意点ではない</Text>
          </View>
          <View style={styles.legendRow}>
            <Text style={styles.legendEmoji}>⚪</Text>
            <Text style={[typography.small, { color: colors.neutral[700] }]}>判断できない／情報不足</Text>
          </View>
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
  backBtn: {
    padding: spacing(0.5),
  },
  content: {
    padding: spacing(2),
    gap: spacing(2),
    paddingBottom: spacing(6),
  },
  intro: {
    paddingHorizontal: spacing(1),
  },
  stepCard: {
    gap: spacing(0.75),
  },
  safetyCard: {
    gap: spacing(1),
    backgroundColor: colors.primary[50],
    borderColor: colors.primary[200],
  },
  safetyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(1),
  },
  legend: {
    gap: spacing(1),
    paddingHorizontal: spacing(1),
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(1),
  },
  legendEmoji: {
    fontSize: 16,
  },
});
