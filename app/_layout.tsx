import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { initDatabase, getPrograms, saveProgram } from '../src/db/database';
import { Colors } from '../src/constants/theme';
import pushups50 from '../assets/programs/pushups_50.json';
import calisthenics28 from '../assets/programs/calisthenics_28.json';
import hamstringStretch from '../assets/programs/hamstring_stretch.json';
import yogaMobility from '../assets/programs/yoga_mobility.json';

export default function RootLayout() {
    useEffect(() => {
        async function setup() {
            const db = await initDatabase();
            const existing = await getPrograms(db);
            const defaultIds = [
                pushups50.id,
                calisthenics28.id,
                hamstringStretch.id,
                yogaMobility.id
            ];

            const existingIds = new Set(existing.map(p => p.id));
            const missing = [
                pushups50,
                calisthenics28,
                hamstringStretch,
                yogaMobility
            ].filter(p => !existingIds.has(p.id));

            for (const p of missing) {
                await saveProgram(db, p as any);
            }
        }
        setup().catch(console.error);
    }, []);

    return (
        <ThemeProvider value={DarkTheme}>
            <Stack
                screenOptions={{
                    headerStyle: {
                        backgroundColor: Colors.background,
                    },
                    headerTintColor: Colors.primary,
                    headerTitleStyle: {
                        fontWeight: 'bold',
                    },
                    contentStyle: {
                        backgroundColor: Colors.background,
                    },
                    headerBackTitle: 'Back',
                }}
            >
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="workout/player" options={{ presentation: 'fullScreenModal', headerShown: false }} />
                <Stack.Screen name="import" options={{ presentation: 'modal', title: 'Import Program' }} />
            </Stack>
            <StatusBar style="light" />
        </ThemeProvider>
    );
}
