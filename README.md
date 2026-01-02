# 🏋️‍♂️ YAWT (Yet Another Workout Tracker)

A premium, schema-driven workout application designed for performance, progress visualization, and achievement recognition. Built with Expo and React Native.

---

## ✨ Core Features

### 📈 Intelligence & Progress
- **Personal Records (PRs)**: Automatically detects when you hit a new high in weight, reps, or duration. Celebrated with a custom "Gold Medal" haptic pattern.
- **Visual Trends**: Beautifully rendered charts for "Workouts per Week" and "Muscle Group Distribution" help you see your work pay off.
- **Detailed History**: Retroactive scanning of your workout history to populate your PR trophies instantly.

### 🎯 Focused Workout Player
- **Real-time Adjustments**: Life happens. Adjust your reps or weight mid-set to reflect your actual performance—your logs will stay accurate.
- **Dynamic Rest Timers**: Automated rest periods based on your program schema.
- **Live Activities**: (iOS) Keep track of your rest timer and current set directly from your Lock Screen or Dynamic Island.

### 🧠 Seamless Integration
- **Apple Health Sync**: Automatically sync your workouts to Apple Health to close your activity rings.
- **AI Workout Generator**: Create entire multi-week programs just by describing your goals.
- **iCloud Backup**: Securely sync your data across your devices.

### 🛠️ Developer & Community Friendly
- **Schema-Driven**: Programs are defined by JSON, making them easy to share, version, and import.
- **GitHub Discovery**: Import workout registries directly from GitHub repositories.

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (LTS)
- [Expo Go](https://expo.dev/expo-go) (for quick local testing) or [TestFlight](https://developer.apple.com/testflight/)

### Installation
1.  Clone and install:
    ```bash
    git clone https://github.com/jongyllen/yawt.git
    cd yawt
    npm install
    ```
2.  Launch the development server:
    ```bash
    npm start
    ```

For detailed build instructions, simulator setup, and release procedures, see [DEVELOPMENT.md](./DEVELOPMENT.md).

---

## 🔧 Technical Stack
- **Engine**: [Expo](https://expo.dev/) / React Native
- **Storage**: [SQLite](https://docs.expo.dev/versions/latest/sdk/sqlite/) (Local-first)
- **Validation**: [Zod](https://zod.dev/)
- **Icons**: [Lucide React Native](https://lucide.dev/)
- **Styling**: Modern, high-contrast dark theme with glassmorphic accents.

---

## 📜 License
Internal and Community usage allowed under the [MIT License](LICENSE).
