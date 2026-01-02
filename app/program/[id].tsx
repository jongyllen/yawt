import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Colors, Typography, Spacing } from '../../src/constants/theme';
import { Play, Ban, Share2 } from 'lucide-react-native';
import {
  initDatabase,
  startProgram,
  stopProgram,
  getNextWorkoutForProgram,
} from '../../src/db/database';
import * as Sharing from 'expo-sharing';
import { File, Paths } from 'expo-file-system';
import * as Clipboard from 'expo-clipboard';
import { Share } from 'react-native';
import { Workout } from '../../src/schemas/schema';
import { ShareModal } from '../../src/components/ShareModal';
import { usePrograms, useActiveProgram } from '../../src/hooks/useDatabase';

export default function ProgramDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { programs, refresh: refreshPrograms } = usePrograms();
  const { activeProgram, refresh: refreshActive } = useActiveProgram(id as string);

  const program = programs.find((p) => p.id === id);
  const [nextSession, setNextSession] = useState<{
    workout: Workout;
    weekNumber?: number;
    dayNumber?: number;
  } | null>(null);
  const [shareModalVisible, setShareModalVisible] = useState(false);

  useEffect(() => {
    if (program && activeProgram) {
      initDatabase().then((db) => {
        getNextWorkoutForProgram(db, program).then(setNextSession);
      });
    }
  }, [program, activeProgram]);

  const handleStartProgram = async () => {
    const db = await initDatabase();
    await startProgram(db, program!.id);
    refreshActive();
  };

  const handleStopProgram = async () => {
    const db = await initDatabase();
    if (activeProgram) {
      await stopProgram(db, activeProgram.id);
      refreshActive();
    }
  };

  const handleCopyJSON = async () => {
    if (!program) return;
    try {
      await Clipboard.setStringAsync(JSON.stringify(program, null, 2));
      Alert.alert('Copied', 'Program JSON copied to clipboard');
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to copy to clipboard');
    }
  };

  const handleSaveToFile = async () => {
    if (!program) return;
    try {
      const fileName = `${program.name.replace(/\s+/g, '_')}.json`;
      const file = new File(Paths.cache, fileName);
      await file.write(JSON.stringify(program, null, 2));

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(file.uri);
      } else {
        await Share.share({
          message: JSON.stringify(program, null, 2),
          title: `Share ${program.name}`,
        });
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to save/share file');
    }
  };

  if (!program)
    return (
      <View style={styles.container}>
        <Text style={Typography.body}>Loading...</Text>
      </View>
    );

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: program.name,
          headerRight: () => (
            <TouchableOpacity onPress={() => setShareModalVisible(true)}>
              <Share2 color={Colors.primary} size={24} />
            </TouchableOpacity>
          ),
        }}
      />
      <ShareModal
        visible={shareModalVisible}
        onClose={() => setShareModalVisible(false)}
        onCopyJSON={handleCopyJSON}
        onSaveToFile={handleSaveToFile}
        programName={program.name}
      />
      <ScrollView style={{ flex: 1 }}>
        <View style={styles.header}>
          <Text style={Typography.h1}>{program.name}</Text>
          {program.description && (
            <Text style={[Typography.bodySecondary, { marginTop: Spacing.sm }]}>
              {program.description}
            </Text>
          )}

          <View style={styles.actionSection}>
            {activeProgram ? (
              <View style={styles.activeStatus}>
                <View style={{ flex: 1 }}>
                  <Text style={[Typography.h3, { color: Colors.primary }]}>Active Program</Text>
                  {nextSession ? (
                    <Text style={Typography.bodySecondary}>
                      Next:{' '}
                      {nextSession.weekNumber !== undefined
                        ? `Week ${nextSession.weekNumber}, `
                        : ''}
                      Day {nextSession.dayNumber ?? 'Next'} - {nextSession.workout.name}
                    </Text>
                  ) : (
                    <Text style={Typography.bodySecondary}>Program Completed!</Text>
                  )}
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
                  {nextSession && (
                    <TouchableOpacity
                      style={styles.resumeButton}
                      onPress={() =>
                        router.push({
                          pathname: '/workout/player',
                          params: {
                            programId: program.id,
                            workoutId: nextSession.workout.id,
                            weekNumber: nextSession.weekNumber,
                            dayNumber: nextSession.dayNumber,
                          },
                        })
                      }
                    >
                      <Play color={Colors.background} size={16} fill={Colors.background} />
                      <Text
                        style={[
                          Typography.caption,
                          { color: Colors.background, marginLeft: 4, fontWeight: 'bold' },
                        ]}
                      >
                        START NEXT
                      </Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity style={styles.stopButton} onPress={handleStopProgram}>
                    <Ban color={Colors.error} size={16} />
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity style={styles.startButton} onPress={handleStartProgram}>
                <Text style={[Typography.h3, { color: Colors.background }]}>Start Program</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.workoutsSection}>
          <Text
            style={[Typography.h3, { marginBottom: Spacing.md, paddingHorizontal: Spacing.lg }]}
          >
            Workouts
          </Text>
          {program.workouts.map((workout) => (
            <View key={workout.id} style={styles.workoutCard}>
              <View style={{ flex: 1 }}>
                <Text style={Typography.h3}>{workout.name}</Text>
                <Text style={[Typography.bodySecondary, { marginTop: Spacing.xs }]}>
                  {workout.blocks.length} blocks
                </Text>
              </View>
              <TouchableOpacity
                style={styles.playButton}
                onPress={() =>
                  router.push({
                    pathname: '/workout/player',
                    params: {
                      programId: program.id,
                      workoutId: workout.id,
                      weekNumber:
                        activeProgram && nextSession?.workout.id === workout.id
                          ? nextSession.weekNumber
                          : undefined,
                      dayNumber:
                        activeProgram && nextSession?.workout.id === workout.id
                          ? nextSession.dayNumber
                          : undefined,
                    },
                  })
                }
              >
                <Play color={Colors.background} size={20} fill={Colors.background} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    padding: Spacing.lg,
  },
  workoutCard: {
    backgroundColor: Colors.surface,
    padding: Spacing.lg,
    borderRadius: 12,
    marginBottom: Spacing.md,
    marginHorizontal: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  playButton: {
    backgroundColor: Colors.primary,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionSection: {
    marginTop: Spacing.xl,
  },
  startButton: {
    backgroundColor: Colors.primary,
    padding: Spacing.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  activeStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: Spacing.lg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  resumeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 8,
  },
  stopButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.surface,
  },
  workoutsSection: {
    marginTop: Spacing.lg,
  },
});
