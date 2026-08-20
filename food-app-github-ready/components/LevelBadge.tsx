import { StyleSheet, Text, View } from 'react-native';
import type { ConcernLevel } from '../lib/types';
import { LEVEL_META } from '../lib/levels';
import { radius, spacing, typography } from '../constants/theme';

interface Props {
  level: ConcernLevel;
  size?: 'sm' | 'md';
}

export function LevelBadge({ level, size = 'md' }: Props) {
  const meta = LEVEL_META[level];
  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: meta.background },
        size === 'sm' && styles.badgeSm,
      ]}
    >
      <Text style={size === 'sm' ? styles.emojiSm : styles.emoji}>{meta.emoji}</Text>
      <Text
        style={[
          size === 'sm' ? typography.caption : typography.small,
          styles.label,
          { color: meta.color },
        ]}
      >
        {meta.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.full,
    paddingHorizontal: spacing(1.5),
    paddingVertical: spacing(0.75),
    alignSelf: 'flex-start',
    gap: spacing(0.5),
  },
  badgeSm: {
    paddingHorizontal: spacing(1),
    paddingVertical: spacing(0.5),
  },
  emoji: {
    fontSize: 14,
  },
  emojiSm: {
    fontSize: 11,
  },
  label: {
    fontWeight: '600',
  },
});
