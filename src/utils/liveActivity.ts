import { NativeModules, Platform } from 'react-native';
import { Colors } from '../constants/theme';

const { LiveActivityModule } = NativeModules;

export interface LiveActivityState {
  exerciseName: string;
  exerciseDescription: string;
  blockName: string;
  currentBlock: number;
  totalBlocks: number;
  currentRound: number;
  totalRounds: number;
  progress: number;
  isTimed: boolean;
  durationSeconds: number;
  isPaused: boolean;
  reps?: number;
}

export interface LiveActivityAttributes {
  workoutName: string;
  programName?: string;
  accentColorHex?: string;
}

/**
 * Check if Live Activities are supported on this device
 * Requires iOS 16.1+ and user permission
 */
export async function isLiveActivitySupported(): Promise<boolean> {
  if (Platform.OS !== 'ios') {
    return false;
  }

  try {
    return (await LiveActivityModule?.isSupported()) ?? false;
  } catch (error) {
    console.warn('Failed to check Live Activity support:', error);
    return false;
  }
}

/**
 * Start a new workout Live Activity
 * Shows on Lock Screen and Dynamic Island
 */
export async function startLiveActivity(
  attributes: LiveActivityAttributes,
  state: LiveActivityState
): Promise<string | null> {
  if (Platform.OS !== 'ios' || !LiveActivityModule) {
    return null;
  }

  try {
    const activityId = await LiveActivityModule.startActivity(
      attributes.workoutName,
      attributes.programName ?? null,
      state.exerciseName,
      state.exerciseDescription,
      state.blockName,
      state.currentBlock,
      state.totalBlocks,
      state.currentRound,
      state.totalRounds,
      state.progress,
      state.isTimed,
      state.durationSeconds,
      state.isPaused,
      state.reps ?? null,
      attributes.accentColorHex ?? Colors.primary
    );
    console.log('Live Activity started:', activityId);
    return activityId;
  } catch (error) {
    console.warn('Failed to start Live Activity:', error);
    return null;
  }
}

/**
 * Update the current workout Live Activity
 */
export async function updateLiveActivity(state: LiveActivityState): Promise<boolean> {
  if (Platform.OS !== 'ios' || !LiveActivityModule) {
    return false;
  }

  try {
    await LiveActivityModule.updateActivity(
      state.exerciseName,
      state.exerciseDescription,
      state.blockName,
      state.currentBlock,
      state.totalBlocks,
      state.currentRound,
      state.totalRounds,
      state.progress,
      state.isTimed,
      state.durationSeconds,
      state.isPaused,
      state.reps ?? null
    );
    return true;
  } catch (error) {
    // Activity might not exist, which is fine
    console.warn('Failed to update Live Activity:', error);
    return false;
  }
}

/**
 * End the current workout Live Activity
 */
export async function endLiveActivity(): Promise<boolean> {
  if (Platform.OS !== 'ios' || !LiveActivityModule) {
    return false;
  }

  try {
    await LiveActivityModule.endActivity();
    console.log('Live Activity ended');
    return true;
  } catch (error) {
    console.warn('Failed to end Live Activity:', error);
    return false;
  }
}

/**
 * End all workout Live Activities (cleanup)
 * Call this when the app starts to clean up any stale activities
 */
export async function endAllLiveActivities(): Promise<boolean> {
  if (Platform.OS !== 'ios' || !LiveActivityModule) {
    return false;
  }

  try {
    await LiveActivityModule.endAllActivities();
    return true;
  } catch (error) {
    console.warn('Failed to end all Live Activities:', error);
    return false;
  }
}

/**
 * Helper to format step description for Live Activity
 */
export function formatStepDescription(step: {
  durationSeconds?: number;
  reps?: number;
  name?: string;
}): string {
  if (step.durationSeconds) {
    const minutes = Math.floor(step.durationSeconds / 60);
    const seconds = step.durationSeconds % 60;
    if (minutes > 0) {
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${seconds} sec`;
  }

  if (step.reps) {
    return `${step.reps} reps`;
  }

  return step.name ?? 'Exercise';
}
