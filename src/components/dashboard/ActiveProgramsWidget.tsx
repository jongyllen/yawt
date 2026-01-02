import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Colors, Typography, Spacing } from '../../constants/theme';
import { Play, Dumbbell } from 'lucide-react-native';
import { dashboardStyles as styles } from './DashboardStyles';
import { Program, Workout } from '../../schemas/schema';

interface ActiveSession {
  program: Program;
  activeProgram: any;
  nextSession: {
    workout: Workout;
    weekNumber?: number;
    dayNumber?: number;
  };
}

interface ActiveProgramsWidgetProps {
  sessions: ActiveSession[];
  onSessionPress: (session: ActiveSession) => void;
}

export const ActiveProgramsWidget: React.FC<ActiveProgramsWidgetProps> = ({
  sessions,
  onSessionPress,
}) => {
  if (sessions.length === 0) return null;

  return (
    <View style={styles.section}>
      <Text style={[Typography.h3, { marginBottom: Spacing.md }]}>Active Programs</Text>
      {sessions.map((session, index) => (
        <TouchableOpacity
          key={`${session.program.id}-${index}`}
          style={[styles.heroCard, { marginBottom: Spacing.md }]}
          onPress={() => onSessionPress(session)}
        >
          <View style={styles.heroContent}>
            <Text style={[Typography.h2, { color: Colors.background }]}>
              {session.nextSession.workout.name}
            </Text>
            <Text style={[Typography.body, { color: 'rgba(0,0,0,0.6)', marginTop: Spacing.xs }]}>
              {session.program.name}
              {session.nextSession.weekNumber !== undefined
                ? ` • Week ${session.nextSession.weekNumber}`
                : ''}
              {session.nextSession.dayNumber !== undefined
                ? ` • Day ${session.nextSession.dayNumber}`
                : ''}
            </Text>
            <View style={styles.startButton}>
              <Play color={Colors.primary} size={24} fill={Colors.primary} />
              <Text style={styles.startText}>
                {session.activeProgram?.lastWorkoutId === session.nextSession.workout.id
                  ? 'RESUME'
                  : 'START NEXT'}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
};
