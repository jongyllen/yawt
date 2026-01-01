import { WorkoutLog } from '../schemas/schema';

/**
 * Calculate the current workout streak (consecutive days with workouts)
 * Returns { current: number, longest: number }
 */
export function calculateStreak(logs: WorkoutLog[]): { current: number; longest: number } {
    if (logs.length === 0) {
        return { current: 0, longest: 0 };
    }

    // Get unique workout dates (normalized to midnight)
    const uniqueDates = new Set<string>();
    for (const log of logs) {
        const date = new Date(log.date);
        const dateStr = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
        uniqueDates.add(dateStr);
    }

    // Convert to sorted array of Date objects
    const sortedDates = Array.from(uniqueDates)
        .map(str => {
            const [year, month, day] = str.split('-').map(Number);
            return new Date(year, month, day);
        })
        .sort((a, b) => b.getTime() - a.getTime()); // Most recent first

    if (sortedDates.length === 0) {
        return { current: 0, longest: 0 };
    }

    // Check if streak is active (worked out today or yesterday)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const mostRecent = sortedDates[0];
    mostRecent.setHours(0, 0, 0, 0);

    const isStreakActive = mostRecent.getTime() === today.getTime() ||
        mostRecent.getTime() === yesterday.getTime();

    // Calculate current streak
    let currentStreak = 0;
    if (isStreakActive) {
        currentStreak = 1;

        for (let i = 0; i < sortedDates.length - 1; i++) {
            const current = sortedDates[i];
            const next = sortedDates[i + 1];

            // Allow 1 day gap (diffDays = 1 or 2)
            const diffDays = Math.round((current.getTime() - next.getTime()) / (1000 * 60 * 60 * 24));

            if (diffDays <= 2) {
                currentStreak++;
            } else {
                break;
            }
        }
    }

    // Calculate longest streak
    let longestStreak = 0;
    let tempStreak = 1;

    for (let i = 0; i < sortedDates.length - 1; i++) {
        const current = sortedDates[i];
        const next = sortedDates[i + 1];

        const diffDays = Math.round((current.getTime() - next.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
            tempStreak++;
        } else {
            longestStreak = Math.max(longestStreak, tempStreak);
            tempStreak = 1;
        }
    }
    longestStreak = Math.max(longestStreak, tempStreak);

    return {
        current: currentStreak,
        longest: Math.max(longestStreak, currentStreak)
    };
}

/**
 * Check if user worked out today
 */
export function workedOutToday(logs: WorkoutLog[]): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return logs.some(log => {
        const logDate = new Date(log.date);
        logDate.setHours(0, 0, 0, 0);
        return logDate.getTime() === today.getTime();
    });
}

