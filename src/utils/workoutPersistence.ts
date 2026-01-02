import AsyncStorage from '@react-native-async-storage/async-storage';
import { StepResult } from '../schemas/schema';

const WORKOUT_STATE_KEY = 'active_workout_state';

/**
 * Persisted workout state - saved to AsyncStorage
 * Uses timestamps instead of counting variables for background persistence
 */
export interface PersistedWorkoutState {
  // Workout identifiers
  workoutId: string;
  programId: string;
  workoutName: string;
  programName?: string;

  // Position in workout
  blockIndex: number;
  stepIndex: number;
  round: number;

  // Timer state (timestamp-based)
  timerStartedAt: string | null; // ISO string when current timer started
  timerDuration: number | null; // Total duration in seconds for current step
  timerPausedAt: string | null; // ISO string when paused (null if running)
  accumulatedPauseTime: number; // Total seconds spent paused

  // Workout session
  workoutStartedAt: string; // ISO string when workout began
  isPaused: boolean;
  isFinished: boolean;

  // Track performance
  stepResults: StepResult[];
}

/**
 * Save workout state to AsyncStorage
 */
export async function saveWorkoutState(state: PersistedWorkoutState): Promise<void> {
  try {
    await AsyncStorage.setItem(WORKOUT_STATE_KEY, JSON.stringify(state));
  } catch (error) {
    console.warn('[WorkoutPersistence] Failed to save state:', error);
  }
}

/**
 * Load workout state from AsyncStorage
 */
export async function loadWorkoutState(): Promise<PersistedWorkoutState | null> {
  try {
    const data = await AsyncStorage.getItem(WORKOUT_STATE_KEY);
    if (data) {
      return JSON.parse(data) as PersistedWorkoutState;
    }
    return null;
  } catch (error) {
    console.warn('[WorkoutPersistence] Failed to load state:', error);
    return null;
  }
}

/**
 * Clear workout state from AsyncStorage
 */
export async function clearWorkoutState(): Promise<void> {
  try {
    await AsyncStorage.removeItem(WORKOUT_STATE_KEY);
  } catch (error) {
    console.warn('[WorkoutPersistence] Failed to clear state:', error);
  }
}

/**
 * Calculate remaining time for a timer based on timestamps
 * This is the core of the persistence model - time is calculated, not counted
 *
 * Formula: remainingSeconds = duration - elapsedSeconds
 * Where: elapsedSeconds = (now - startTime - totalPauseTime) / 1000
 */
export function calculateTimeLeft(state: PersistedWorkoutState): number | null {
  if (!state.timerStartedAt || !state.timerDuration) {
    return null;
  }

  const startTime = new Date(state.timerStartedAt).getTime();
  const duration = state.timerDuration;

  let now: number;
  if (state.isPaused && state.timerPausedAt) {
    // If paused, calculate from when we paused
    now = new Date(state.timerPausedAt).getTime();
  } else {
    now = Date.now();
  }

  // Calculate elapsed time, accounting for accumulated pause time
  const elapsedMs = now - startTime - state.accumulatedPauseTime * 1000;
  const elapsedSeconds = Math.floor(elapsedMs / 1000);
  const remaining = duration - elapsedSeconds;

  return Math.max(0, remaining);
}

/**
 * Calculate total workout elapsed time
 */
export function calculateWorkoutElapsed(state: PersistedWorkoutState): number {
  const startTime = new Date(state.workoutStartedAt).getTime();
  const now = Date.now();
  return Math.floor((now - startTime) / 1000);
}

/**
 * Create initial workout state
 */
export function createInitialWorkoutState(
  workoutId: string,
  programId: string,
  workoutName: string,
  programName?: string,
  initialIndexes?: { blockIndex: number; stepIndex: number; round: number }
): PersistedWorkoutState {
  return {
    workoutId,
    programId,
    workoutName,
    programName,
    blockIndex: initialIndexes?.blockIndex ?? 0,
    stepIndex: initialIndexes?.stepIndex ?? 0,
    round: initialIndexes?.round ?? 1,
    timerStartedAt: null,
    timerDuration: null,
    timerPausedAt: null,
    accumulatedPauseTime: 0,
    workoutStartedAt: new Date().toISOString(),
    isPaused: false,
    isFinished: false,
    stepResults: [],
  };
}

/**
 * Start a timer for the current step
 */
export function startTimer(
  state: PersistedWorkoutState,
  durationSeconds: number
): PersistedWorkoutState {
  return {
    ...state,
    timerStartedAt: new Date().toISOString(),
    timerDuration: durationSeconds,
    timerPausedAt: null,
    accumulatedPauseTime: 0,
  };
}

/**
 * Pause the workout/timer
 */
export function pauseWorkout(state: PersistedWorkoutState): PersistedWorkoutState {
  if (state.isPaused) return state;

  return {
    ...state,
    isPaused: true,
    timerPausedAt: new Date().toISOString(),
  };
}

/**
 * Resume the workout/timer
 */
export function resumeWorkout(state: PersistedWorkoutState): PersistedWorkoutState {
  if (!state.isPaused) return state;

  // Calculate how long we were paused and add to accumulated pause time
  let additionalPauseTime = 0;
  if (state.timerPausedAt) {
    const pausedAt = new Date(state.timerPausedAt).getTime();
    additionalPauseTime = Math.floor((Date.now() - pausedAt) / 1000);
  }

  return {
    ...state,
    isPaused: false,
    timerPausedAt: null,
    accumulatedPauseTime: state.accumulatedPauseTime + additionalPauseTime,
  };
}

/**
 * Move to next step (resets timer state)
 */
export function advanceStep(
  state: PersistedWorkoutState,
  newBlockIndex: number,
  newStepIndex: number,
  newRound: number,
  currentStepResult?: StepResult
): PersistedWorkoutState {
  const nextResults = [...state.stepResults];
  if (currentStepResult) {
    nextResults.push(currentStepResult);
  }

  return {
    ...state,
    blockIndex: newBlockIndex,
    stepIndex: newStepIndex,
    round: newRound,
    timerStartedAt: null,
    timerDuration: null,
    timerPausedAt: null,
    accumulatedPauseTime: 0,
    stepResults: nextResults,
  };
}

/**
 * Mark workout as finished
 */
export function finishWorkout(state: PersistedWorkoutState): PersistedWorkoutState {
  return {
    ...state,
    isFinished: true,
    isPaused: true,
  };
}
