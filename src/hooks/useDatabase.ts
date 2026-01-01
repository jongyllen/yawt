import { useState, useEffect, useCallback } from 'react';
import * as SQLite from 'expo-sqlite';
import { initDatabase, getPrograms, getProgramById, getActivePrograms } from '../db/database';
import { Program, ActiveProgram } from '../schemas/schema';

export function useDatabase() {
    const [db, setDb] = useState<SQLite.SQLiteDatabase | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        initDatabase().then(instance => {
            setDb(instance);
            setIsLoading(false);
        });
    }, []);

    return { db, isLoading };
}

export function usePrograms() {
    const { db, isLoading: dbLoading } = useDatabase();
    const [programs, setPrograms] = useState<Program[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const refresh = useCallback(async () => {
        if (!db) return;
        setIsLoading(true);
        const data = await getPrograms(db);
        setPrograms(data);
        setIsLoading(false);
    }, [db]);

    useEffect(() => {
        if (!dbLoading) refresh();
    }, [dbLoading, refresh]);

    return { programs, isLoading, refresh };
}

export function useActiveProgram(programId?: string) {
    const { db, isLoading: dbLoading } = useDatabase();
    const [activeProgram, setActiveProgram] = useState<ActiveProgram | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const refresh = useCallback(async () => {
        if (!db) return;
        setIsLoading(true);
        const allActive = await getActivePrograms(db);
        if (programId) {
            setActiveProgram(allActive.find(a => a.programId === programId) || null);
        } else {
            // If no programId, just return the first active one? 
            // Most apps only have one "active" enrollment at a time.
            setActiveProgram(allActive[0] || null);
        }
        setIsLoading(false);
    }, [db, programId]);

    useEffect(() => {
        if (!dbLoading) refresh();
    }, [dbLoading, refresh]);

    return { activeProgram, isLoading, refresh };
}
