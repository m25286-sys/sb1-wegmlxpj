import type { ConcernLevel } from './types';
import { colors } from '../constants/theme';

interface LevelMeta {
  emoji: string;
  label: string;
  color: string;
  background: string;
}

export const LEVEL_META: Record<ConcernLevel, LevelMeta> = {
  red: {
    emoji: '🔴',
    label: '特に確認したい',
    color: colors.error[600],
    background: colors.error[50],
  },
  orange: {
    emoji: '🟠',
    label: '摂りすぎに注意',
    color: colors.warning[600],
    background: colors.warning[50],
  },
  green: {
    emoji: '🟢',
    label: '大きな注意点ではない',
    color: colors.success[700],
    background: colors.success[50],
  },
  gray: {
    emoji: '⚪',
    label: '判断できない／情報不足',
    color: colors.neutral[500],
    background: colors.neutral[100],
  },
};
