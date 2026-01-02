import React, { useState, useCallback } from 'react';
import { StyleSheet, ScrollView } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Colors, Spacing } from '../../src/constants/theme';
import {
  initDatabase,
  getWorkoutLogs,
  getActivePrograms,
  getProgramById,
  getNextWorkoutForProgram,
} from '../../src/db/database';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Program, Workout, WorkoutLog } from '../../src/schemas/schema';
import { calculateStreak, workedOutToday } from '../../src/utils/streak';
import { saveWidgetData } from '../../src/utils/widgetData';
import * as CloudSync from '../../src/utils/cloudSync';

// Dashboard Components
import { DashboardHeader } from '../../src/components/dashboard/DashboardHeader';
import { StreakWidget } from '../../src/components/dashboard/StreakWidget';
import { ActiveProgramsWidget } from '../../src/components/dashboard/ActiveProgramsWidget';
import { RecentActivityWidget } from '../../src/components/dashboard/RecentActivityWidget';

export default function TodayScreen() {
  const router = useRouter();
  const [activeSessions, setActiveSessions] = useState<
    {
      program: Program;
      activeProgram: any;
      nextSession: {
        workout: Workout;
        weekNumber?: number;
        dayNumber?: number;
      };
    }[]
  >([]);
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [userName, setUserName] = useState('');
  const [streak, setStreak] = useState({ current: 0, longest: 0 });
  const [completedToday, setCompletedToday] = useState(false);

  const loadData = useCallback(async () => {
    const db = await initDatabase();
    const activePrograms = await getActivePrograms(db);
    const workoutLogs = await getWorkoutLogs(db);
    setLogs(workoutLogs);
    const streakData = calculateStreak(workoutLogs);
    setStreak(streakData);
    const doneToday = workedOutToday(workoutLogs);
    setCompletedToday(doneToday);

    const currentSessions = [];
    for (const ap of activePrograms) {
      const program = await getProgramById(db, ap.programId);
      if (program) {
        const next = await getNextWorkoutForProgram(db, program);
        if (next) {
          currentSessions.push({ program, activeProgram: ap, nextSession: next });
        }
      }
    }
    setActiveSessions(currentSessions);

    const name = await AsyncStorage.getItem('user_name');
    setUserName(name || '');

    // Update widget data
    const firstSession = currentSessions[0];
    saveWidgetData({
      currentStreak: streakData.current,
      longestStreak: streakData.longest,
      nextWorkoutName: firstSession?.nextSession.workout.name || null,
      nextProgramName: firstSession?.program.name || null,
      nextWorkoutId: firstSession?.nextSession.workout.id || null,
      nextProgramId: firstSession?.program.id || null,
      workedOutToday: doneToday,
      lastUpdated: new Date().toISOString(),
    });

    // Sync with cloud if enabled
    await CloudSync.syncIfNewer();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleSessionPress = (session: any) => {
    router.push({
      pathname: '/workout/player',
      params: {
        programId: session.program.id,
        workoutId: session.nextSession.workout.id,
        weekNumber: session.nextSession.weekNumber,
        dayNumber: session.nextSession.dayNumber,
      },
    });
  };

  return (
    <ScrollView style={styles.container}>
      <DashboardHeader userName={userName} currentStreak={streak.current} />

      <StreakWidget
        current={streak.current}
        longest={streak.longest}
        completedToday={completedToday}
      />

      <ActiveProgramsWidget
        sessions={activeSessions}
        onSessionPress={handleSessionPress}
        onBrowsePress={() => router.push('/programs')}
      />

      <RecentActivityWidget logs={logs} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.lg,
  },
});
