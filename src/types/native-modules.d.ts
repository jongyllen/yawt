import { NativeModule } from 'react-native';

/**
 * Type declarations for native modules
 */

export interface LiveActivityModuleInterface extends NativeModule {
    /**
     * Check if Live Activities are supported on this device
     */
    isSupported(): Promise<boolean>;

    /**
     * Start a new workout Live Activity
     */
    startActivity(
        workoutName: string,
        programName: string | null,
        exerciseName: string,
        exerciseDescription: string,
        blockName: string,
        currentBlock: number,
        totalBlocks: number,
        currentRound: number,
        totalRounds: number,
        progress: number,
        isTimed: boolean,
        durationSeconds: number,
        isPaused: boolean,
        reps: number | null,
        accentColorHex: string
    ): Promise<string>;

    /**
     * Update the current workout Live Activity
     */
    updateActivity(
        exerciseName: string,
        exerciseDescription: string,
        blockName: string,
        currentBlock: number,
        totalBlocks: number,
        currentRound: number,
        totalRounds: number,
        progress: number,
        isTimed: boolean,
        durationSeconds: number,
        isPaused: boolean,
        reps: number | null
    ): Promise<boolean>;

    /**
     * End the current workout Live Activity
     */
    endActivity(): Promise<boolean>;

    /**
     * End all workout Live Activities
     */
    endAllActivities(): Promise<boolean>;
}

declare module 'react-native' {
    interface NativeModulesStatic {
        LiveActivityModule?: LiveActivityModuleInterface;
    }
}

