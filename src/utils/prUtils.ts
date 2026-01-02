import { SQLiteDatabase } from 'expo-sqlite';
import { StepResult, PersonalRecord, WorkoutLog } from '../schemas/schema';
import { getBestForExercise, savePersonalRecord, generateId } from '../db/database';
import { goldMedalHaptic } from './feedback';

export type NewPR = {
    exerciseName: string;
    type: PersonalRecord['type'];
    oldValue?: number;
    newValue: number;
};

/**
 * Check for PRs in a completed workout and save them
 */
export async function checkAndSavePRs(
    db: SQLiteDatabase,
    log: WorkoutLog
): Promise<NewPR[]> {
    if (!log.stepResults || log.stepResults.length === 0) return [];

    const newPRs: NewPR[] = [];
    const date = new Date().toISOString();

    // Helper to normalize exercise name for matching
    const normalize = (name?: string) => name?.trim().toLowerCase() || 'unknown';

    for (const step of log.stepResults) {
        if (!step.name || !step.completed) continue;

        const exerciseId = step.exerciseId || normalize(step.name);

        // Check Weight PR
        if (step.weight !== undefined && step.weight > 0) {
            const best = await getBestForExercise(db, exerciseId, 'weight');
            if (!best || step.weight > best.value) {
                const pr: PersonalRecord = {
                    id: generateId(),
                    exerciseId,
                    exerciseName: step.name,
                    type: 'weight',
                    value: step.weight,
                    date,
                    workoutId: log.workoutId,
                    workoutName: log.workoutName,
                };
                await savePersonalRecord(db, pr);
                newPRs.push({
                    exerciseName: step.name,
                    type: 'weight',
                    oldValue: best?.value,
                    newValue: step.weight,
                });
            }
        }

        // Check Reps PR (for the same weight, or bodyweight)
        // For now, we'll just check max reps ever for this exercise as a simple PR
        if (step.reps !== undefined && step.reps > 0) {
            const best = await getBestForExercise(db, exerciseId, 'reps');
            if (!best || step.reps > best.value) {
                const pr: PersonalRecord = {
                    id: generateId(),
                    exerciseId,
                    exerciseName: step.name,
                    type: 'reps',
                    value: step.reps,
                    date,
                    workoutId: log.workoutId,
                    workoutName: log.workoutName,
                };
                await savePersonalRecord(db, pr);
                newPRs.push({
                    exerciseName: step.name,
                    type: 'reps',
                    oldValue: best?.value,
                    newValue: step.reps,
                });
            }
        }

        // Check Duration PR
        if (step.durationSeconds !== undefined && step.durationSeconds > 0) {
            const best = await getBestForExercise(db, exerciseId, 'duration');
            if (!best || step.durationSeconds > best.value) {
                const pr: PersonalRecord = {
                    id: generateId(),
                    exerciseId,
                    exerciseName: step.name,
                    type: 'duration',
                    value: step.durationSeconds,
                    date,
                    workoutId: log.workoutId,
                    workoutName: log.workoutName,
                };
                await savePersonalRecord(db, pr);
                newPRs.push({
                    exerciseName: step.name,
                    type: 'duration',
                    oldValue: best?.value,
                    newValue: step.durationSeconds,
                });
            }
        }
    }

    if (newPRs.length > 0) {
        // Celebrate!
        await goldMedalHaptic();
    }

    return newPRs;
}

/**
 * Scan all historical logs to populate PRs (useful if PR tracking was added later)
 */
export async function scanHistoryForPRs(
    db: SQLiteDatabase,
    logs: WorkoutLog[]
): Promise<number> {
    let totalNewPRs = 0;

    // Sort logs by date to process them chronologically
    const sortedLogs = [...logs].sort((a, b) =>
        new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    for (const log of sortedLogs) {
        const prs = await checkAndSavePRs(db, log);
        totalNewPRs += prs.length;
    }

    return totalNewPRs;
}
