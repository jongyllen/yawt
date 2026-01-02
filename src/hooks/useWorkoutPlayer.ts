import { useState, useEffect, useRef, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { Workout, StepResult } from '../schemas/schema';
import * as Feedback from '../utils/feedback';
import * as LiveActivity from '../utils/liveActivity';
import * as WorkoutPersistence from '../utils/workoutPersistence';
import * as Notifications from '../utils/notifications';

interface UseWorkoutPlayerProps {
  workout: Workout | null;
  workoutId?: string;
  programId?: string;
  programName?: string;
  initialIndexes?: {
    blockIndex: number;
    stepIndex: number;
    round: number;
  };
  onFinish?: () => void;
}

/**
 * Workout player hook using persistence and recovery model
 *
 * Key features:
 * - Timer uses timestamps instead of decrementing counters
 * - State persists to AsyncStorage for background recovery
 * - AppState listener re-syncs when app returns to foreground
 * - Background notifications alert user when timers complete
 */
export function useWorkoutPlayer({
  workout,
  workoutId = '',
  programId = '',
  programName,
  initialIndexes,
}: UseWorkoutPlayerProps) {
  // Core workout state
  const [currentBlockIndex, setCurrentBlockIndex] = useState(initialIndexes?.blockIndex ?? 0);
  const [currentStepIndex, setCurrentStepIndex] = useState(initialIndexes?.stepIndex ?? 0);
  const [currentRound, setCurrentRound] = useState(initialIndexes?.round ?? 1);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [stepResults, setStepResults] = useState<StepResult[]>([]);

  // Performance adjustments for current step
  const [adjustedReps, setAdjustedReps] = useState<number | undefined>(undefined);
  const [adjustedWeight, setAdjustedWeight] = useState<number | undefined>(undefined);

  // Refs for persistence and timers
  const persistedStateRef = useRef<WorkoutPersistence.PersistedWorkoutState | null>(null);
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastCountdownRef = useRef<number | null>(null);
  const hasCompletedRef = useRef(false);
  const notificationIdRef = useRef<string | null>(null);
  const liveActivityStartedRef = useRef(false);

  // Get current step info
  const currentBlock = workout?.blocks[currentBlockIndex] || null;
  const currentStep = currentBlock?.steps[currentStepIndex] || null;
  const currentDuration = currentStep?.durationSeconds || null;

  // ============================================
  // PERSISTENCE HELPERS
  // ============================================

  /**
   * Save current state to AsyncStorage
   */
  const saveState = useCallback(async (state: WorkoutPersistence.PersistedWorkoutState) => {
    persistedStateRef.current = state;
    await WorkoutPersistence.saveWorkoutState(state);
  }, []);

  /**
   * Calculate time remaining from persisted state
   */
  const calculateTimeRemaining = useCallback((): number | null => {
    const state = persistedStateRef.current;
    if (!state || !state.timerStartedAt || !state.timerDuration) {
      return null;
    }
    return WorkoutPersistence.calculateTimeLeft(state);
  }, []);

  /**
   * Sync UI state from persisted state
   */
  const syncFromPersistedState = useCallback(() => {
    const remaining = calculateTimeRemaining();
    if (remaining !== null) {
      setTimeLeft(remaining);
    }
    return remaining;
  }, [calculateTimeRemaining]);

  // ============================================
  // NAVIGATION HELPERS
  // ============================================

  /**
   * Get the name of the next exercise (for notifications)
   */
  const getNextExerciseName = useCallback((): string | undefined => {
    if (!workout) return undefined;

    const block = workout.blocks[currentBlockIndex];

    // Next step in same round
    if (currentStepIndex < block.steps.length - 1) {
      const nextStep = block.steps[currentStepIndex + 1];
      return nextStep?.name ?? (nextStep?.type === 'rest' ? 'Rest' : 'Exercise');
    }

    // Next round, first step
    if (currentRound < block.rounds) {
      const firstStep = block.steps[0];
      return firstStep?.name ?? (firstStep?.type === 'rest' ? 'Rest' : 'Exercise');
    }

    // Next block, first step
    if (currentBlockIndex < workout.blocks.length - 1) {
      const nextBlock = workout.blocks[currentBlockIndex + 1];
      const firstStep = nextBlock?.steps[0];
      return firstStep?.name ?? (firstStep?.type === 'rest' ? 'Rest' : 'Exercise');
    }

    return undefined;
  }, [workout, currentBlockIndex, currentStepIndex, currentRound]);

  /**
   * Calculate overall progress (0-1)
   */
  const getProgress = useCallback(() => {
    if (!workout) return 0;
    let totalSteps = 0;
    let currentLinearIndex = 0;

    workout.blocks.forEach((block, bIdx) => {
      const blockSteps = block.steps.length * block.rounds;
      totalSteps += blockSteps;

      if (bIdx < currentBlockIndex) {
        currentLinearIndex += blockSteps;
      } else if (bIdx === currentBlockIndex) {
        currentLinearIndex += (currentRound - 1) * block.steps.length + currentStepIndex;
      }
    });

    return totalSteps > 0 ? currentLinearIndex / totalSteps : 0;
  }, [workout, currentBlockIndex, currentStepIndex, currentRound]);

  /**
   * Check if on the last step
   */
  const getIsLastStep = useCallback(() => {
    if (!workout) return false;
    const isLastBlock = currentBlockIndex === workout.blocks.length - 1;
    const block = workout.blocks[currentBlockIndex];
    const isLastRound = currentRound === block.rounds;
    const isLastStepInBlock = currentStepIndex === block.steps.length - 1;
    return isLastBlock && isLastRound && isLastStepInBlock;
  }, [workout, currentBlockIndex, currentStepIndex, currentRound]);

  // ============================================
  // NOTIFICATION HELPERS
  // ============================================

  /**
   * Schedule a notification for timer completion
   */
  const scheduleTimerNotification = useCallback(
    async (seconds: number) => {
      // Cancel existing notification
      await Notifications.cancelAllWorkoutNotifications();
      notificationIdRef.current = null;

      if (seconds > 0) {
        const nextExercise = getNextExerciseName();
        const id = await Notifications.scheduleTimerCompleteNotification(
          seconds,
          nextExercise || 'Next exercise'
        );
        notificationIdRef.current = id;

        // Removed pre-scheduling 3-2-1 countdowns to reduce spam
      }
    },
    [getNextExerciseName]
  );

  /**
   * Cancel scheduled timer notification
   */
  const cancelTimerNotification = useCallback(async () => {
    await Notifications.cancelAllWorkoutNotifications();
    notificationIdRef.current = null;
  }, []);

  // ============================================
  // TIMER MANAGEMENT
  // ============================================

  /**
   * Start a new timer for the current step
   */
  const startTimer = useCallback(
    async (durationSeconds: number) => {
      if (!persistedStateRef.current) return;

      hasCompletedRef.current = false;
      lastCountdownRef.current = null;

      const newState = WorkoutPersistence.startTimer(persistedStateRef.current, durationSeconds);
      await saveState(newState);

      setTimeLeft(durationSeconds);

      // We no longer pre-schedule here. Scheduling happens only when app goes to background.
    },
    [saveState, scheduleTimerNotification]
  );

  /**
   * Clear and stop the timer
   */
  const clearTimer = useCallback(() => {
    if (updateIntervalRef.current) {
      clearInterval(updateIntervalRef.current);
      updateIntervalRef.current = null;
    }
    cancelTimerNotification();
  }, [cancelTimerNotification]);

  // ============================================
  // NAVIGATION ACTIONS
  // ============================================

  /**
   * Move to the next step/round/block
   *
   * @param shouldPause - If true, advance the index but stay in a paused state
   */
  const handleNext = useCallback(
    async (shouldPause: boolean = false) => {
      if (!workout || !persistedStateRef.current) return;

      clearTimer();
      const block = workout.blocks[currentBlockIndex];
      const step = block.steps[currentStepIndex];
      const nextExercise = getNextExerciseName();

      // Record performance for completed step
      const result: StepResult = {
        stepId: step.id,
        exerciseId: step.exerciseId,
        name: step.name,
        reps: adjustedReps ?? step.reps,
        weight: adjustedWeight ?? step.weight,
        durationSeconds: step.durationSeconds,
        completed: true,
      };

      let newBlockIndex = currentBlockIndex;
      let newStepIndex = currentStepIndex;
      let newRound = currentRound;

      if (currentStepIndex < block.steps.length - 1) {
        // Next step in same round
        Feedback.onStepTransition(nextExercise);
        newStepIndex = currentStepIndex + 1;
      } else if (currentRound < block.rounds) {
        // Next round
        Feedback.onStepTransition(nextExercise);
        newRound = currentRound + 1;
        newStepIndex = 0;
      } else if (currentBlockIndex < workout.blocks.length - 1) {
        // Next block
        const nextBlock = workout.blocks[currentBlockIndex + 1];
        Feedback.onBlockComplete(nextBlock?.name);
        newBlockIndex = currentBlockIndex + 1;
        newStepIndex = 0;
        newRound = 1;
      } else {
        // Workout complete!
        Feedback.onWorkoutComplete();
        const finishedState = WorkoutPersistence.finishWorkout(persistedStateRef.current);
        await saveState(finishedState);
        setIsFinished(true);
        setIsPaused(true);
        return;
      }

      // Update persisted state
      const newState = WorkoutPersistence.advanceStep(
        persistedStateRef.current,
        newBlockIndex,
        newStepIndex,
        newRound,
        result
      );

      // If explicitly requested or manually triggered, we check pause state
      if (shouldPause) {
        newState.isPaused = true;
        newState.timerPausedAt = new Date().toISOString();
        setIsPaused(true);
      }

      await saveState(newState);

      // Update UI state
      setCurrentBlockIndex(newBlockIndex);
      setCurrentStepIndex(newStepIndex);
      setCurrentRound(newRound);

      // Calculate and set the new time left immediately to avoid "Hold" UI
      const nextStep = workout.blocks[newBlockIndex].steps[newStepIndex];
      const nextDuration = nextStep?.durationSeconds;
      setTimeLeft(nextDuration || null);

      // Reset adjustment state for next step
      setAdjustedReps(undefined);
      setAdjustedWeight(undefined);
      setStepResults(newState.stepResults);

      hasCompletedRef.current = false;
    },
    [
      workout,
      currentBlockIndex,
      currentStepIndex,
      currentRound,
      clearTimer,
      getNextExerciseName,
      saveState,
    ]
  );

  /**
   * Move to the previous step/round/block
   */
  const handleBack = useCallback(async () => {
    if (!workout || !persistedStateRef.current) return;

    clearTimer();
    Feedback.onGoBack();

    let newBlockIndex = currentBlockIndex;
    let newStepIndex = currentStepIndex;
    let newRound = currentRound;

    if (currentStepIndex > 0) {
      newStepIndex = currentStepIndex - 1;
    } else if (currentRound > 1) {
      newRound = currentRound - 1;
      newStepIndex = workout.blocks[currentBlockIndex].steps.length - 1;
    } else if (currentBlockIndex > 0) {
      const prevBlock = workout.blocks[currentBlockIndex - 1];
      newBlockIndex = currentBlockIndex - 1;
      newRound = prevBlock.rounds;
      newStepIndex = prevBlock.steps.length - 1;
    } else {
      return; // Can't go back further
    }

    // Update persisted state
    const newState = WorkoutPersistence.advanceStep(
      persistedStateRef.current,
      newBlockIndex,
      newStepIndex,
      newRound
    );
    await saveState(newState);

    // Update UI state
    setCurrentBlockIndex(newBlockIndex);
    setCurrentStepIndex(newStepIndex);
    setCurrentRound(newRound);
    setTimeLeft(null);
    hasCompletedRef.current = false;
  }, [workout, currentBlockIndex, currentStepIndex, currentRound, clearTimer, saveState]);

  // ============================================
  // PAUSE/RESUME
  // ============================================

  /**
   * Handle pause state changes
   */
  const handlePauseChange = useCallback(
    async (paused: boolean) => {
      if (!persistedStateRef.current) return;

      setIsPaused(paused);

      if (paused) {
        // Pause: save pause timestamp
        const pausedState = WorkoutPersistence.pauseWorkout(persistedStateRef.current);
        await saveState(pausedState);
        // We no longer cancel notifications here, AppState handle handles it
      } else {
        // Resume: calculate accumulated pause time
        const resumedState = WorkoutPersistence.resumeWorkout(persistedStateRef.current);
        await saveState(resumedState);
        // We no longer schedule notifications here, AppState handle handles it
      }
    },
    [saveState, cancelTimerNotification, scheduleTimerNotification]
  );

  // ============================================
  // INITIALIZATION
  // ============================================

  /**
   * Initialize workout state on mount
   */
  useEffect(() => {
    if (!workout) return;

    const initializeWorkout = async () => {
      // Initialize feedback
      Feedback.initAudio();
      Feedback.loadFeedbackSettings();

      // Create initial persisted state
      const initialState = WorkoutPersistence.createInitialWorkoutState(
        workoutId,
        programId,
        workout.name,
        programName,
        initialIndexes
      );
      await saveState(initialState);
      setStepResults(initialState.stepResults);

      // Start Live Activity
      const state = LiveActivity.formatStepDescription(currentStep || {});
      const activityId = await LiveActivity.startLiveActivity(
        { workoutName: workout.name, programName },
        {
          exerciseName: currentStep?.name ?? 'Exercise',
          exerciseDescription: state,
          blockName: currentBlock?.name ?? 'Workout',
          currentBlock: currentBlockIndex + 1,
          totalBlocks: workout.blocks.length,
          currentRound,
          totalRounds: currentBlock?.rounds ?? 1,
          progress: 0,
          isTimed: !!currentStep?.durationSeconds,
          durationSeconds: currentStep?.durationSeconds ?? 0,
          isPaused: false,
          reps: currentStep?.reps,
        }
      );
      if (activityId) {
        liveActivityStartedRef.current = true;
      }
    };

    initializeWorkout();

    return () => {
      Feedback.cleanupAudio();
      clearTimer();
      if (liveActivityStartedRef.current) {
        LiveActivity.endLiveActivity();
      }
      // Clear persisted state on unmount (workout ended or canceled)
      WorkoutPersistence.clearWorkoutState();
    };
  }, [workout?.id]);

  /**
   * Start timer when step changes to a timed exercise
   */
  useEffect(() => {
    if (currentDuration && currentDuration > 0 && !isPaused && !isFinished) {
      startTimer(currentDuration);
    } else if (!currentDuration) {
      setTimeLeft(null);
      clearTimer();
    }
  }, [currentBlockIndex, currentStepIndex, currentRound, currentDuration, isPaused, isFinished]);

  // ============================================
  // TIMER UPDATE LOOP
  // ============================================

  /**
   * Update timer display by recalculating from timestamps
   */
  useEffect(() => {
    if (timeLeft === null || isPaused || isFinished || hasCompletedRef.current) {
      clearTimer();
      return;
    }

    updateIntervalRef.current = setInterval(() => {
      const remaining = calculateTimeRemaining();

      if (remaining === null) return;

      setTimeLeft(remaining);

      // Countdown feedback (3, 2, 1)
      if (remaining <= 3 && remaining > 0 && lastCountdownRef.current !== remaining) {
        lastCountdownRef.current = remaining;
        Feedback.onCountdown(remaining, getNextExerciseName());
      }

      // Timer complete
      if (remaining <= 0 && !hasCompletedRef.current) {
        hasCompletedRef.current = true;
        Feedback.onCountdown(0, getNextExerciseName());

        const { autoPlayEnabled } = Feedback.getFeedbackSettings();
        handleNext(!autoPlayEnabled); // Always advance, but pause if auto-play is off
      }
    }, 250); // 4 updates per second for smooth display

    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
        updateIntervalRef.current = null;
      }
    };
  }, [
    timeLeft,
    isPaused,
    isFinished,
    calculateTimeRemaining,
    getNextExerciseName,
    handleNext,
    clearTimer,
  ]);

  // ============================================
  // APP STATE RECOVERY
  // ============================================

  /**
   * True Background Scheduling:
   * Only schedule notifications when app leaves, and cancel when app returns.
   */
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        // Cancel all notifications when returning to app (Zero Foreground Spam)
        Notifications.cancelAllWorkoutNotifications();

        if (!isPaused && !isFinished) {
          // App came to foreground - recalculate time
          const remaining = syncFromPersistedState();

          // Check if timer completed while in background
          if (remaining !== null && remaining <= 0 && !hasCompletedRef.current) {
            hasCompletedRef.current = true;
            Feedback.onCountdown(0, getNextExerciseName());

            const { autoPlayEnabled } = Feedback.getFeedbackSettings();
            handleNext(!autoPlayEnabled);
          }
        }
      } else if (nextAppState === 'background' || nextAppState === 'inactive') {
        // Schedule notification only when leaving the app
        const remaining = calculateTimeRemaining();
        if (remaining !== null && remaining > 0 && !isPaused && !isFinished) {
          scheduleTimerNotification(remaining);
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [
    isPaused,
    isFinished,
    syncFromPersistedState,
    getNextExerciseName,
    handleNext,
    calculateTimeRemaining,
    scheduleTimerNotification,
  ]);

  // ============================================
  // LIVE ACTIVITY UPDATES
  // ============================================

  /**
   * Update Live Activity when state changes
   */
  useEffect(() => {
    if (!workout || !liveActivityStartedRef.current || isFinished) return;

    LiveActivity.updateLiveActivity({
      exerciseName: currentStep?.name ?? (currentStep?.type === 'rest' ? 'Rest' : 'Exercise'),
      exerciseDescription: LiveActivity.formatStepDescription(currentStep || {}),
      blockName: currentBlock?.name ?? 'Workout',
      currentBlock: currentBlockIndex + 1,
      totalBlocks: workout.blocks.length,
      currentRound,
      totalRounds: currentBlock?.rounds ?? 1,
      progress: getProgress(),
      isTimed: !!currentStep?.durationSeconds,
      durationSeconds: timeLeft ?? currentStep?.durationSeconds ?? 0,
      isPaused,
      reps: currentStep?.reps,
    });
  }, [
    workout,
    currentBlockIndex,
    currentStepIndex,
    currentRound,
    timeLeft,
    isPaused,
    isFinished,
    getProgress,
  ]);

  /**
   * End Live Activity when finished
   */
  useEffect(() => {
    if (isFinished && liveActivityStartedRef.current) {
      LiveActivity.endLiveActivity();
      liveActivityStartedRef.current = false;
    }
  }, [isFinished]);

  // ============================================
  // RETURN VALUES
  // ============================================

  return {
    currentBlockIndex,
    currentStepIndex,
    currentRound,
    timeLeft,
    isPaused,
    isFinished,
    setIsPaused: handlePauseChange,
    setIsFinished,
    handleNext,
    handleBack,
    getProgress,
    isLastStep: getIsLastStep(),
    currentBlock,
    currentStep,
    stepResults,
    adjustedReps,
    adjustedWeight,
    updatePerformance: (reps?: number, weight?: number) => {
      if (reps !== undefined) setAdjustedReps(reps);
      if (weight !== undefined) setAdjustedWeight(weight);
    },
  };
}
