import React from 'react';
import {
    FlexWidget,
    TextWidget,
} from 'react-native-android-widget';

interface StreakWidgetProps {
    currentStreak: number;
    nextWorkoutName: string | null;
    nextProgramName: string | null;
    workedOutToday: boolean;
}

// Colors matching the app theme
const Colors = {
    background: '#0D0D0D',
    surface: '#1A1A1A',
    primary: '#00F2FF',
    secondary: '#FF007A',
    accent: '#A020F0',
    warning: '#FFB800',
    success: '#00FF94',
    text: '#FFFFFF',
    textSecondary: '#A0A0A0',
    border: '#333333',
};

export function StreakWidget({
    currentStreak = 0,
    nextWorkoutName,
    nextProgramName,
    workedOutToday,
}: StreakWidgetProps) {
    const hasStreak = currentStreak > 0;
    const flameColor = hasStreak ? Colors.warning : Colors.textSecondary;

    return (
        <FlexWidget
            clickAction="OPEN_APP"
            clickActionData={{ screen: 'today' }}
            style={{
                flex: 1,
                backgroundColor: Colors.background as any,
                borderRadius: 24,
                padding: 16,
                justifyContent: 'space-between',
            }}
        >
            {/* Header with streak */}
            <FlexWidget
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}
            >
                <FlexWidget style={{ flexDirection: 'row', alignItems: 'center' }}>
                    {/* Flame emoji as icon */}
                    <TextWidget
                        text="🔥"
                        style={{
                            fontSize: 28,
                            marginRight: 8,
                        }}
                    />
                    <FlexWidget>
                        <TextWidget
                            text={currentStreak.toString()}
                            style={{
                                fontSize: 32,
                                fontWeight: '900',
                                color: flameColor as any,
                            }}
                        />
                        <TextWidget
                            text="DAY STREAK"
                            style={{
                                fontSize: 10,
                                fontWeight: '600',
                                color: Colors.textSecondary as any,
                                letterSpacing: 1,
                            }}
                        />
                    </FlexWidget>
                </FlexWidget>

                {/* Today's status */}
                {workedOutToday && (
                    <FlexWidget
                        style={{
                            backgroundColor: `${Colors.success}20` as any,
                            paddingHorizontal: 10,
                            paddingVertical: 4,
                            borderRadius: 12,
                        }}
                    >
                        <TextWidget
                            text="✓ Done"
                            style={{
                                fontSize: 11,
                                fontWeight: '600',
                                color: Colors.success as any,
                            }}
                        />
                    </FlexWidget>
                )}
            </FlexWidget>

            {/* Next workout */}
            {nextWorkoutName ? (
                <FlexWidget
                    clickAction="OPEN_APP"
                    clickActionData={{
                        screen: 'workout',
                    }}
                    style={{
                        marginTop: 12,
                        backgroundColor: Colors.surface as any,
                        borderRadius: 16,
                        flexDirection: 'row',
                        padding: 0,
                        borderWidth: 1,
                        borderColor: `${Colors.primary}40` as any,
                    }}
                >
                    {/* sidebar accent */}
                    <FlexWidget
                        style={{
                            width: 3,
                            backgroundColor: Colors.primary as any,
                        }}
                    />
                    <FlexWidget
                        style={{
                            padding: 14,
                            flex: 1,
                        }}
                    >
                        <TextWidget
                            text="UP NEXT"
                            style={{
                                fontSize: 9,
                                fontWeight: '700',
                                color: Colors.primary as any,
                                letterSpacing: 1,
                                marginBottom: 4,
                            }}
                        />
                        <TextWidget
                            text={nextWorkoutName}
                            style={{
                                fontSize: 16,
                                fontWeight: '700',
                                color: Colors.text as any,
                            }}
                            maxLines={1}
                        />
                        {nextProgramName && (
                            <TextWidget
                                text={nextProgramName}
                                style={{
                                    fontSize: 12,
                                    color: Colors.textSecondary as any,
                                    marginTop: 2,
                                }}
                                maxLines={1}
                            />
                        )}
                    </FlexWidget>
                </FlexWidget>
            ) : (
                <FlexWidget
                    style={{
                        marginTop: 12,
                        backgroundColor: Colors.surface as any,
                        borderRadius: 16,
                        padding: 14,
                        alignItems: 'center',
                    }}
                >
                    <TextWidget
                        text="No active programs"
                        style={{
                            fontSize: 13,
                            color: Colors.textSecondary as any,
                        }}
                    />
                    <TextWidget
                        text="Tap to discover workouts"
                        style={{
                            fontSize: 11,
                            color: Colors.primary as any,
                            marginTop: 4,
                        }}
                    />
                </FlexWidget>
            )}

            {/* App branding */}
            <FlexWidget
                style={{
                    marginTop: 12,
                    flexDirection: 'row',
                    justifyContent: 'center',
                    alignItems: 'center',
                }}
            >
                <TextWidget
                    text="YAWT"
                    style={{
                        fontSize: 10,
                        fontWeight: '700',
                        color: Colors.primary as any,
                        letterSpacing: 2,
                    }}
                />
            </FlexWidget>
        </FlexWidget>
    );
}
