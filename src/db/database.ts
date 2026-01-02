import * as SQLite from 'expo-sqlite';
import { Program, ProgramSchema, WorkoutLog, ActiveProgram, ActiveProgramSchema, Workout } from '../schemas/schema';

const DB_NAME = 'yawt.db';
let dbInstance: SQLite.SQLiteDatabase | null = null;
let initPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export const initDatabase = async () => {
    if (dbInstance) return dbInstance;
    if (initPromise) return initPromise;

    initPromise = (async () => {
        const db = await SQLite.openDatabaseAsync(DB_NAME);
        dbInstance = db;

        await db.execAsync('PRAGMA journal_mode = WAL;');

        await db.execAsync(`
    CREATE TABLE IF NOT EXISTS programs (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      data TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );`);

        await db.execAsync(`
    CREATE TABLE IF NOT EXISTS workout_logs (
      id TEXT PRIMARY KEY,
      workout_id TEXT NOT NULL,
      program_id TEXT NOT NULL,
      date TEXT NOT NULL,
      duration_seconds INTEGER NOT NULL,
      data TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );`);

        await db.execAsync(`
    CREATE TABLE IF NOT EXISTS active_programs (
      id TEXT PRIMARY KEY,
      program_id TEXT NOT NULL,
      status TEXT NOT NULL,
      data TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );`);

        // Migrations: Add columns individually
        const migrations = [
            'ALTER TABLE workout_logs ADD COLUMN week_number INTEGER;',
            'ALTER TABLE workout_logs ADD COLUMN day_number INTEGER;',
            'ALTER TABLE active_programs ADD COLUMN updated_at DATETIME;'
        ];

        for (const sql of migrations) {
            try {
                await db.execAsync(sql);
            } catch (e) {
                // Column likely already exists
            }
        }

        return db;
    })();

    return initPromise;
};

export const saveProgram = async (db: SQLite.SQLiteDatabase, program: Program) => {
    const validated = ProgramSchema.parse(program);
    await db.runAsync(
        'INSERT OR REPLACE INTO programs (id, name, data) VALUES (?, ?, ?)',
        validated.id,
        validated.name,
        JSON.stringify(validated)
    );
};

export const getPrograms = async (db: SQLite.SQLiteDatabase): Promise<Program[]> => {
    const rows = await db.getAllAsync<{ data: string }>('SELECT data FROM programs ORDER BY created_at DESC');
    return rows.map(row => JSON.parse(row.data));
};

export const getProgramById = async (db: SQLite.SQLiteDatabase, id: string): Promise<Program | null> => {
    const row = await db.getFirstAsync<{ data: string }>('SELECT data FROM programs WHERE id = ?', id);
    return row ? JSON.parse(row.data) : null;
};

export const saveWorkoutLog = async (db: SQLite.SQLiteDatabase, log: WorkoutLog) => {
    await db.runAsync(
        'INSERT INTO workout_logs (id, workout_id, program_id, date, duration_seconds, week_number, day_number, data) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        log.id,
        log.workoutId,
        log.programId,
        log.date,
        log.durationSeconds,
        log.weekNumber || null,
        log.dayNumber || null,
        JSON.stringify(log)
    );
};

export const getWorkoutLogs = async (db: SQLite.SQLiteDatabase): Promise<WorkoutLog[]> => {
    const rows = await db.getAllAsync<{ data: string }>('SELECT data FROM workout_logs ORDER BY date DESC');
    return rows.map(row => JSON.parse(row.data));
};

export const getWorkoutLogsByProgram = async (db: SQLite.SQLiteDatabase, programId: string): Promise<WorkoutLog[]> => {
    const rows = await db.getAllAsync<{ data: string }>('SELECT data FROM workout_logs WHERE program_id = ? ORDER BY date DESC', programId);
    return rows.map(row => JSON.parse(row.data));
};

export const startProgram = async (db: SQLite.SQLiteDatabase, programId: string) => {
    const id = Math.random().toString(36).substring(7);
    const now = new Date().toISOString();
    const activeProgram: ActiveProgram = {
        id,
        programId,
        startDate: now,
        status: 'active',
        updatedAt: now,
    };
    await db.runAsync(
        'INSERT INTO active_programs (id, program_id, status, data, updated_at) VALUES (?, ?, ?, ?, ?)',
        activeProgram.id,
        activeProgram.programId,
        activeProgram.status,
        JSON.stringify(activeProgram),
        now
    );
    return activeProgram;
};

export const getActivePrograms = async (db: SQLite.SQLiteDatabase): Promise<ActiveProgram[]> => {
    try {
        const rows = await db.getAllAsync<{ data: string }>('SELECT data FROM active_programs WHERE status = "active" ORDER BY updated_at DESC');
        return rows.map(row => {
            try {
                return JSON.parse(row.data);
            } catch (e) {
                console.error('Error parsing active program data', e);
                return null;
            }
        }).filter(ap => ap !== null);
    } catch (e) {
        console.error('Error fetching active programs', e);
        return [];
    }
};

export const stopProgram = async (db: SQLite.SQLiteDatabase, id: string) => {
    await db.runAsync('UPDATE active_programs SET status = "completed" WHERE id = ?', id);
};

export const getActiveProgramByProgramId = async (db: SQLite.SQLiteDatabase, programId: string): Promise<ActiveProgram | null> => {
    const row = await db.getFirstAsync<{ data: string }>('SELECT data FROM active_programs WHERE program_id = ? AND status = "active"', programId);
    return row ? JSON.parse(row.data) : null;
};

export const updateActiveProgram = async (db: SQLite.SQLiteDatabase, activeProgram: ActiveProgram) => {
    const now = new Date().toISOString();
    activeProgram.updatedAt = now;
    await db.runAsync(
        'UPDATE active_programs SET data = ?, status = ?, updated_at = ? WHERE id = ?',
        JSON.stringify(activeProgram),
        activeProgram.status,
        now,
        activeProgram.id
    );
};

export const getNextWorkoutForProgram = async (db: SQLite.SQLiteDatabase, program: Program): Promise<{ workout: Workout; weekNumber?: number; dayNumber?: number } | null> => {
    const logs = await getWorkoutLogsByProgram(db, program.id);

    if (!program.weeks || program.weeks.length === 0) {
        // Fallback for simple programs without weeks: find the first workout not in logs, or just the first
        const completedIds = new Set(logs.map(l => l.workoutId));
        const next = program.workouts.find(w => !completedIds.has(w.id)) || program.workouts[0];
        return next ? { workout: next } : null;
    }

    // Sort logs to find the "latest" completed in schedule
    // This is a simple heuristic: find highest week, then highest day in that week
    let lastWeek = 0;
    let lastDay = 0;

    for (const log of logs) {
        if (log.weekNumber !== undefined && log.dayNumber !== undefined) {
            if (log.weekNumber > lastWeek) {
                lastWeek = log.weekNumber;
                lastDay = log.dayNumber;
            } else if (log.weekNumber === lastWeek && log.dayNumber > lastDay) {
                lastDay = log.dayNumber;
            }
        }
    }

    // Find the next workout in the schedule
    for (const week of program.weeks) {
        if (week.weekNumber < lastWeek) continue;

        const workoutsSorted = [...week.workouts].sort((a, b) => a.dayNumber - b.dayNumber);
        for (const scheduled of workoutsSorted) {
            if (week.weekNumber === lastWeek && scheduled.dayNumber <= lastDay) continue;

            const workout = program.workouts.find(w => w.id === scheduled.workoutId);
            if (workout) {
                return {
                    workout,
                    weekNumber: week.weekNumber,
                    dayNumber: scheduled.dayNumber
                };
            }
        }
    }

    // Wrap around or finish? For now, let's just return null if finished,
    // or we could repeat the program. Let's return null to signify completion of the cycle.
    return null;
};

export const clearAllLogs = async (db: SQLite.SQLiteDatabase) => {
    await db.runAsync('DELETE FROM workout_logs');
    await db.runAsync('DELETE FROM active_programs');
};

export const clearAllPrograms = async (db: SQLite.SQLiteDatabase) => {
    await db.runAsync('DELETE FROM programs');
};

export const savePrograms = async (db: SQLite.SQLiteDatabase, programs: Program[]) => {
    for (const program of programs) {
        await saveProgram(db, program);
    }
};

/**
 * Get all data for backup
 */
export const getFullBackup = async (db: SQLite.SQLiteDatabase): Promise<any> => {
    const programs = await getPrograms(db);
    const logs = await getWorkoutLogs(db);
    const activePrograms = await db.getAllAsync<{ data: string }>('SELECT data FROM active_programs');

    return {
        version: 'yawt.backup.v1',
        timestamp: new Date().toISOString(),
        programs,
        workoutLogs: logs,
        activePrograms: activePrograms.map(row => JSON.parse(row.data))
    };
};

/**
 * Restore from backup data
 */
export const restoreFullBackup = async (db: SQLite.SQLiteDatabase, backup: any) => {
    if (backup.version !== 'yawt.backup.v1') {
        throw new Error('Invalid backup version');
    }

    // Clear everything
    await db.execAsync('DELETE FROM active_programs');
    await db.execAsync('DELETE FROM workout_logs');
    await db.execAsync('DELETE FROM programs');

    // Restore Programs
    for (const program of backup.programs) {
        await saveProgram(db, program);
    }

    // Restore Logs
    for (const log of backup.workoutLogs) {
        await saveWorkoutLog(db, log);
    }

    // Restore Active Programs
    for (const ap of backup.activePrograms) {
        await db.runAsync(
            'INSERT INTO active_programs (id, program_id, status, data) VALUES (?, ?, ?, ?)',
            ap.id,
            ap.programId,
            ap.status,
            JSON.stringify(ap)
        );
    }
};
