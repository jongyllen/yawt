# Home Screen Widget Setup

YAWT includes a home screen widget that shows your current streak and next workout. This document explains how to set it up for both Android and iOS.

## Prerequisites

The widget requires running with native code (not Expo Go). You'll need to run:

```bash
npx expo prebuild
```

This generates the native Android and iOS projects.

## Android Widget

The Android widget is automatically configured via the Expo config plugin. After prebuilding:

1. Run `npx expo run:android` to build and install
2. Long-press on your home screen
3. Select "Widgets"
4. Find "YAWT Streak" and drag it to your home screen

### Widget Features
- Shows current streak with flame icon
- Displays next workout name and program
- Shows "Done today" badge when you've completed a workout
- Tap to open the app
- Updates every 30 minutes automatically (and when you complete workouts)

## iOS Widget (Manual Setup Required)

iOS widgets require a Widget Extension target in Xcode. After running `npx expo prebuild`:

### 1. Open in Xcode
```bash
open ios/yawt.xcworkspace
```

### 2. Add Widget Extension
1. File → New → Target
2. Select "Widget Extension"
3. Name it "StreakWidget"
4. Uncheck "Include Configuration Intent"
5. Click Finish

### 3. Configure App Groups
1. Select the main app target → Signing & Capabilities
2. Add "App Groups" capability
3. Create group: `group.com.yawt.app`
4. Add the same App Group to the widget extension

### 4. Replace Widget Code

Replace `StreakWidget.swift` with:

```swift
import WidgetKit
import SwiftUI

struct StreakEntry: TimelineEntry {
    let date: Date
    let streak: Int
    let nextWorkout: String?
    let nextProgram: String?
    let workedOutToday: Bool
}

struct Provider: TimelineProvider {
    func placeholder(in context: Context) -> StreakEntry {
        StreakEntry(date: Date(), streak: 0, nextWorkout: nil, nextProgram: nil, workedOutToday: false)
    }

    func getSnapshot(in context: Context, completion: @escaping (StreakEntry) -> ()) {
        let entry = loadEntry()
        completion(entry)
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<StreakEntry>) -> ()) {
        let entry = loadEntry()
        let timeline = Timeline(entries: [entry], policy: .after(Date().addingTimeInterval(1800)))
        completion(timeline)
    }
    
    private func loadEntry() -> StreakEntry {
        // Load from App Group shared UserDefaults
        let defaults = UserDefaults(suiteName: "group.com.yawt.app")
        let streak = defaults?.integer(forKey: "currentStreak") ?? 0
        let nextWorkout = defaults?.string(forKey: "nextWorkoutName")
        let nextProgram = defaults?.string(forKey: "nextProgramName")
        let workedOutToday = defaults?.bool(forKey: "workedOutToday") ?? false
        
        return StreakEntry(
            date: Date(),
            streak: streak,
            nextWorkout: nextWorkout,
            nextProgram: nextProgram,
            workedOutToday: workedOutToday
        )
    }
}

struct StreakWidgetEntryView: View {
    var entry: Provider.Entry
    
    let backgroundColor = Color(red: 13/255, green: 13/255, blue: 13/255)
    let primaryColor = Color(red: 0, green: 242/255, blue: 255/255)
    let warningColor = Color(red: 255/255, green: 184/255, blue: 0)
    let successColor = Color(red: 0, green: 255/255, blue: 148/255)
    let textSecondary = Color(red: 160/255, green: 160/255, blue: 160/255)

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            // Header with streak
            HStack {
                Text("🔥")
                    .font(.system(size: 28))
                VStack(alignment: .leading, spacing: 0) {
                    Text("\(entry.streak)")
                        .font(.system(size: 32, weight: .black))
                        .foregroundColor(entry.streak > 0 ? warningColor : textSecondary)
                    Text("DAY STREAK")
                        .font(.system(size: 10, weight: .semibold))
                        .foregroundColor(textSecondary)
                        .kerning(1)
                }
                Spacer()
                if entry.workedOutToday {
                    Text("✓ Done")
                        .font(.system(size: 11, weight: .semibold))
                        .foregroundColor(successColor)
                        .padding(.horizontal, 10)
                        .padding(.vertical, 4)
                        .background(successColor.opacity(0.2))
                        .cornerRadius(12)
                }
            }
            
            // Next workout
            if let workout = entry.nextWorkout {
                VStack(alignment: .leading, spacing: 4) {
                    Text("UP NEXT")
                        .font(.system(size: 9, weight: .bold))
                        .foregroundColor(primaryColor)
                        .kerning(1)
                    Text(workout)
                        .font(.system(size: 14, weight: .bold))
                        .foregroundColor(.white)
                        .lineLimit(1)
                    if let program = entry.nextProgram {
                        Text(program)
                            .font(.system(size: 11))
                            .foregroundColor(textSecondary)
                            .lineLimit(1)
                    }
                }
                .padding(12)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(Color(white: 0.1))
                .cornerRadius(12)
            }
            
            Spacer()
            
            // Branding
            HStack {
                Spacer()
                Text("YAWT")
                    .font(.system(size: 10, weight: .bold))
                    .foregroundColor(primaryColor)
                    .kerning(2)
                Spacer()
            }
        }
        .padding(16)
        .background(backgroundColor)
    }
}

@main
struct StreakWidget: Widget {
    let kind: String = "StreakWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: Provider()) { entry in
            StreakWidgetEntryView(entry: entry)
        }
        .configurationDisplayName("Streak")
        .description("Shows your workout streak")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}
```

### 5. Update React Native to Save to App Group

The iOS widget reads from shared UserDefaults. You'll need to also save widget data there. Add this to `widgetData.ts` for iOS support:

```typescript
import { NativeModules, Platform } from 'react-native';

// For iOS, save to shared App Group
if (Platform.OS === 'ios') {
    // Requires a native module to access App Group UserDefaults
    // Or use a package like react-native-shared-group-preferences
}
```

## Troubleshooting

### Widget not showing
- Make sure you've run `npx expo prebuild` and rebuilt the app
- On Android, check that the app has the widget permission
- On iOS, make sure App Groups are configured correctly

### Widget not updating
- The widget updates every 30 minutes by default
- Opening the app triggers an immediate update
- Completing a workout triggers an update

### Widget shows wrong data
- Try removing and re-adding the widget
- Make sure the app has been opened at least once

