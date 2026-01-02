import React from 'react';
import { View, Text } from 'react-native';
import { Colors, Typography, Spacing } from '../../constants/theme';
import { Flame } from 'lucide-react-native';
import { dashboardStyles as styles } from './DashboardStyles';

interface DashboardHeaderProps {
  userName: string;
  currentStreak: number;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({ userName, currentStreak }) => {
  return (
    <View style={styles.headerRow}>
      <View style={{ flex: 1, marginRight: Spacing.md }}>
        <Text style={Typography.h1} numberOfLines={1} ellipsizeMode="tail">
          {userName ? `Hello, ${userName}` : 'Today'}
        </Text>
      </View>
      <View style={[styles.streakBadge, currentStreak > 0 && styles.streakBadgeActive]}>
        <Flame
          color={currentStreak > 0 ? Colors.warning : Colors.textTertiary}
          size={20}
          fill={currentStreak > 0 ? Colors.warning : 'transparent'}
        />
        <Text style={[styles.streakNumber, currentStreak > 0 && styles.streakNumberActive]}>
          {currentStreak}
        </Text>
      </View>
    </View>
  );
};
