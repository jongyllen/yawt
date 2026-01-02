import React from 'react';
import { View, Text } from 'react-native';
import { Colors, Typography } from '../../constants/theme';
import { Flame, Check } from 'lucide-react-native';
import { dashboardStyles as styles } from './DashboardStyles';

interface StreakWidgetProps {
  current: number;
  longest: number;
  completedToday: boolean;
}

export const StreakWidget: React.FC<StreakWidgetProps> = ({ current, longest, completedToday }) => {
  if (current <= 0) {
    return (
      <View style={styles.streakCard}>
        <View style={styles.streakMain}>
          <Flame color={Colors.textTertiary} size={32} />
          <View style={styles.streakInfo}>
            <Text style={styles.streakLabel}>0 Day Streak</Text>
            <Text style={[Typography.caption, { color: Colors.textTertiary }]}>No workouts yet</Text>
          </View>
        </View>
        <Text style={styles.keepGoingText}>Start your first workout!</Text>
      </View>
    );
  }

  return (
    <View style={styles.streakCard}>
      <View style={styles.streakMain}>
        <Flame color={Colors.warning} size={32} fill={Colors.warning} />
        <View style={styles.streakInfo}>
          <Text style={styles.streakLabel}>Day streak</Text>
          <Text style={styles.streakValue}>{current}</Text>
        </View>
      </View>
      <View style={styles.streakMeta}>
        {completedToday ? (
          <View style={styles.completedBadge}>
            <Check color={Colors.success} size={14} />
            <Text style={styles.completedText}>Done today</Text>
          </View>
        ) : (
          <Text style={styles.keepGoingText}>Keep it going!</Text>
        )}
        {longest > current && <Text style={styles.bestText}>Best: {longest}</Text>}
      </View>
    </View>
  );
};
