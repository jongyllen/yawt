import React from 'react';
import { View, Text } from 'react-native';
import { Colors, Typography, Spacing } from '../../constants/theme';
import { Check } from 'lucide-react-native';
import { dashboardStyles as styles } from './DashboardStyles';
import { WorkoutLog } from '../../schemas/schema';

interface RecentActivityWidgetProps {
  logs: WorkoutLog[];
}

export const RecentActivityWidget: React.FC<RecentActivityWidgetProps> = ({ logs }) => {
  if (logs.length === 0) return null;

  return (
    <View style={styles.section}>
      <Text style={[Typography.h3, { marginBottom: Spacing.md }]}>Recent Activity</Text>
      {logs.slice(0, 3).map((log) => (
        <View key={log.id} style={styles.logCard}>
          <View style={{ flex: 1 }}>
            <Text style={Typography.h3}>{log.workoutName || 'Workout'}</Text>
            <Text style={Typography.bodySecondary}>
              {log.programName || 'Program'}
              {log.weekNumber !== undefined ? ` • W${log.weekNumber}` : ''}
              {log.dayNumber !== undefined ? ` • D${log.dayNumber}` : ''}
              {` • ${new Date(log.date).toLocaleDateString()}`}
            </Text>
          </View>
          <Check color={Colors.success} size={20} />
        </View>
      ))}
    </View>
  );
};
