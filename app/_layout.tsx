import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { initDatabase } from '../src/db/database';
import { Colors } from '../src/constants/theme';

export default function RootLayout() {
    useEffect(() => {
        // Initialize database on app start
        initDatabase().catch(console.error);
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
