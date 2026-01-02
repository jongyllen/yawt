import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Colors, Typography, Spacing } from '../../src/constants/theme';
import { Flame, Clock, Dumbbell, Calendar, TrendingUp, Zap } from 'lucide-react-native';
import { initDatabase, getWorkoutLogs } from '../../src/db/database';
import { WorkoutLog } from '../../src/schemas/schema';
import { calculateStreak } from '../../src/utils/streak';

interface StatsData {
  totalWorkouts: number;
  totalMinutes: number;
  currentStreak: number;
  longestStreak: number;
  thisWeek: number;
  thisMonth: number;
  exerciseCounts: { name: string; count: number }[];
  activityMap: Map<string, number>; // date string -> workout count
}

function getDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function calculateStats(logs: WorkoutLog[]): StatsData {
  const streak = calculateStreak(logs);

  // Calculate totals
  const totalWorkouts = logs.length;
  const totalMinutes = Math.round(
    logs.reduce((sum, log) => sum + (log.durationSeconds || 0), 0) / 60
  );

  // This week and month
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  let thisWeek = 0;
  let thisMonth = 0;

  // Activity map for heatmap
  const activityMap = new Map<string, number>();

  // Exercise counts
  const exerciseMap = new Map<string, number>();

  for (const log of logs) {
    const logDate = new Date(log.date);
    const dateKey = getDateKey(logDate);

    // Activity map
    activityMap.set(dateKey, (activityMap.get(dateKey) || 0) + 1);

    // This week/month
    if (logDate >= startOfWeek) thisWeek++;
    if (logDate >= startOfMonth) thisMonth++;

    // Count workout names as "exercises" for now
    if (log.workoutName) {
      exerciseMap.set(log.workoutName, (exerciseMap.get(log.workoutName) || 0) + 1);
    }
  }

  // Sort exercises by count
  const exerciseCounts = Array.from(exerciseMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    totalWorkouts,
    totalMinutes,
    currentStreak: streak.current,
    longestStreak: streak.longest,
    thisWeek,
    thisMonth,
    exerciseCounts,
    activityMap,
  };
}

// Activity Heatmap Component (GitHub-style)
function ActivityHeatmap({ activityMap }: { activityMap: Map<string, number> }) {
  const weeks = 12; // Show 12 weeks
  const days: Date[] = [];
  const today = new Date();

  // Generate last 12 weeks of dates
  for (let w = weeks - 1; w >= 0; w--) {
    for (let d = 0; d < 7; d++) {
      const date = new Date(today);
      date.setDate(today.getDate() - (w * 7 + (6 - d)) - today.getDay());
      days.push(date);
    }
  }

  const maxCount = Math.max(1, ...Array.from(activityMap.values()));

  const getIntensity = (count: number): string => {
    if (count === 0) return Colors.surface;
    const ratio = count / maxCount;
    if (ratio <= 0.25) return `${Colors.primary}20`; // 12% opacity
    if (ratio <= 0.5) return `${Colors.primary}60`; // 38% opacity
    if (ratio <= 0.75) return `${Colors.primary}B0`; // 69% opacity
    return Colors.primary;
  };

  const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <View style={styles.heatmapContainer}>
      <View style={styles.heatmapLabels}>
        {dayLabels.map((label, i) => (
          <Text key={i} style={styles.heatmapDayLabel}>
            {label}
          </Text>
        ))}
      </View>
      <View style={styles.heatmapGrid}>
        {Array.from({ length: weeks }).map((_, weekIndex) => (
          <View key={weekIndex} style={styles.heatmapColumn}>
            {Array.from({ length: 7 }).map((_, dayIndex) => {
              const index = weekIndex * 7 + dayIndex;
              const date = days[index];
              const dateKey = getDateKey(date);
              const count = activityMap.get(dateKey) || 0;
              const isToday = getDateKey(today) === dateKey;

              return (
                <View
                  key={dayIndex}
                  style={[
                    styles.heatmapCell,
                    { backgroundColor: getIntensity(count) },
                    isToday && styles.heatmapCellToday,
                  ]}
                />
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}

// Stat Card Component
function StatCard({
  icon,
  label,
  value,
  subtitle,
  color = Colors.primary,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subtitle?: string;
  color?: string;
}) {
  return (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={[styles.statIconContainer, { backgroundColor: `${color}15` }]}>{icon}</View>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
    </View>
  );
}

// Big Streak Display
function StreakDisplay({ current, longest }: { current: number; longest: number }) {
  return (
    <View style={styles.streakContainer}>
      <View style={styles.streakGlow} />
      <Flame
        color={current > 0 ? Colors.warning : Colors.textTertiary}
        size={64}
        fill={current > 0 ? Colors.warning : 'transparent'}
      />
      <Text style={styles.streakNumber}>{current}</Text>
      <Text style={styles.streakLabel}>DAY STREAK</Text>
      {longest > 0 && (
        <View style={styles.bestStreakBadge}>
          <TrendingUp color={Colors.primary} size={12} />
          <Text style={styles.bestStreakText}>Best: {longest}</Text>
        </View>
      )}
    </View>
  );
}

// Exercise Bar Chart
function ExerciseChart({ exercises }: { exercises: { name: string; count: number }[] }) {
  if (exercises.length === 0) return null;

  const maxCount = Math.max(...exercises.map((e) => e.count));

  return (
    <View style={styles.exerciseChart}>
      {exercises.map((exercise, index) => {
        const width = (exercise.count / maxCount) * 100;
        const colors = [
          Colors.primary,
          Colors.secondary,
          Colors.accent,
          Colors.success,
          Colors.warning,
        ];
        const barColor = colors[index % colors.length];

        return (
          <View key={exercise.name} style={styles.exerciseRow}>
            <Text style={styles.exerciseName} numberOfLines={1}>
              {exercise.name}
            </Text>
            <View style={styles.exerciseBarContainer}>
              <View style={[styles.exerciseBar, { width: `${width}%`, backgroundColor: barColor }]}>
                <View style={[styles.exerciseBarGlow, { backgroundColor: barColor }]} />
              </View>
            </View>
            <Text style={styles.exerciseCount}>{exercise.count}</Text>
          </View>
        );
      })}
    </View>
  );
}

export default function StatsScreen() {
  const [stats, setStats] = useState<StatsData | null>(null);

  const loadStats = useCallback(async () => {
    const db = await initDatabase();
    const logs = await getWorkoutLogs(db);
    setStats(calculateStats(logs));
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, [loadStats])
  );

  if (!stats) {
    return (
      <View style={styles.container}>
        <Text style={Typography.body}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={Typography.h1}>Stats</Text>

      {/* Streak Hero */}
      <StreakDisplay current={stats.currentStreak} longest={stats.longestStreak} />

      {/* Activity Heatmap */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Calendar color={Colors.primary} size={20} />
          <Text style={styles.sectionTitle}>Activity</Text>
          <Text style={styles.sectionSubtitle}>Last 12 weeks</Text>
        </View>
        <ActivityHeatmap activityMap={stats.activityMap} />
        <View style={styles.heatmapLegend}>
          <Text style={styles.legendLabel}>Less</Text>
          <View style={[styles.legendBox, { backgroundColor: Colors.surface }]} />
          <View style={[styles.legendBox, { backgroundColor: `${Colors.primary}20` }]} />
          <View style={[styles.legendBox, { backgroundColor: `${Colors.primary}60` }]} />
          <View style={[styles.legendBox, { backgroundColor: `${Colors.primary}B0` }]} />
          <View style={[styles.legendBox, { backgroundColor: Colors.primary }]} />
          <Text style={styles.legendLabel}>More</Text>
        </View>
      </View>

      {/* Quick Stats Grid */}
      <View style={styles.statsGrid}>
        <StatCard
          icon={<Dumbbell color={Colors.primary} size={20} />}
          label="Total Workouts"
          value={stats.totalWorkouts}
          color={Colors.primary}
        />
        <StatCard
          icon={<Clock color={Colors.secondary} size={20} />}
          label="Total Time"
          value={
            stats.totalMinutes > 60
              ? `${Math.floor(stats.totalMinutes / 60)}h ${stats.totalMinutes % 60}m`
              : `${stats.totalMinutes}m`
          }
          color={Colors.secondary}
        />
        <StatCard
          icon={<Zap color={Colors.success} size={20} />}
          label="This Week"
          value={stats.thisWeek}
          subtitle="workouts"
          color={Colors.success}
        />
        <StatCard
          icon={<Calendar color={Colors.accent} size={20} />}
          label="This Month"
          value={stats.thisMonth}
          subtitle="workouts"
          color={Colors.accent}
        />
      </View>

      {/* Most Trained */}
      {stats.exerciseCounts.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <TrendingUp color={Colors.secondary} size={20} />
            <Text style={styles.sectionTitle}>Most Trained</Text>
          </View>
          <ExerciseChart exercises={stats.exerciseCounts} />
        </View>
      )}

      <View style={{ height: Spacing.xxl }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: Spacing.lg,
  },

  // Streak Display
  streakContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    marginTop: Spacing.md,
    position: 'relative',
  },
  streakGlow: {
    position: 'absolute',
    top: '30%',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.warning,
    opacity: 0.15,
  },
  streakNumber: {
    fontSize: 72,
    fontWeight: '900',
    color: Colors.warning,
    marginTop: -Spacing.sm,
  },
  streakLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.textSecondary,
    letterSpacing: 3,
    marginTop: -Spacing.xs,
  },
  bestStreakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: Spacing.md,
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  bestStreakText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600',
  },

  // Sections
  section: {
    marginTop: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: Colors.textTertiary,
    marginLeft: 'auto',
  },

  // Heatmap
  heatmapContainer: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  heatmapLabels: {
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  heatmapDayLabel: {
    fontSize: 9,
    color: Colors.textTertiary,
    height: 14,
    lineHeight: 14,
  },
  heatmapGrid: {
    flexDirection: 'row',
    gap: 3,
    flex: 1,
  },
  heatmapColumn: {
    gap: 3,
    flex: 1,
  },
  heatmapCell: {
    aspectRatio: 1,
    borderRadius: 3,
    flex: 1,
    maxHeight: 14,
  },
  heatmapCellToday: {
    borderWidth: 1,
    borderColor: Colors.text,
  },
  heatmapLegend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    marginTop: Spacing.sm,
  },
  legendLabel: {
    fontSize: 10,
    color: Colors.textTertiary,
  },
  legendBox: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },

  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginTop: Spacing.xl,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    borderLeftWidth: 4,
  },
  statIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
  },
  statSubtitle: {
    fontSize: 11,
    color: Colors.textTertiary,
    marginTop: 2,
  },

  // Exercise Chart
  exerciseChart: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  exerciseName: {
    width: 80,
    fontSize: 12,
    color: Colors.textSecondary,
  },
  exerciseBarContainer: {
    flex: 1,
    height: 20,
    backgroundColor: Colors.background,
    borderRadius: 4,
    marginHorizontal: Spacing.sm,
    overflow: 'hidden',
  },
  exerciseBar: {
    height: '100%',
    borderRadius: 4,
    position: 'relative',
    overflow: 'hidden',
  },
  exerciseBarGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    opacity: 0.3,
  },
  exerciseCount: {
    width: 30,
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.text,
    textAlign: 'right',
  },
});
