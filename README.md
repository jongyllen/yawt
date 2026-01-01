# yawt (Yet Another Workout Tracker)

A minimal, schema-driven workout application built with Expo and React Native.

## Features

- **Schema-Driven Programs**: Define complex multi-week workout programs using simple, extensible JSON patterns.
- **Focused Workout Experience**: A minimalist UI designed specifically for use during active training sessions, minimizing distractions while keeping essential data at your fingertips.
- **Local-First Data**: All workout logs and progress are stored locally using SQLite, ensuring your data remains private and accessible without an internet connection.
- **Easy Sharing & Import**: Seamlessly export your custom programs or import others' programs via JSON sharing.
- **Program Discovery**: Browse and explore available programs to find the one that fits your goals.
- **Developer-Friendly**: Built with Zod for robust schema validation and Expo for a modern cross-platform development experience.

## Tech Stack

- **Framework**: [Expo](https://expo.dev/) (React Native)
- **Navigation**: [Expo Router](https://docs.expo.dev/router/introduction/)
- **Database**: [Expo SQLite](https://docs.expo.dev/versions/latest/sdk/sqlite/)
- **Icons**: [Lucide React Native](https://lucide.dev/guide/packages/lucide-react-native)
- **Validation**: [Zod](https://zod.dev/)

## Getting Started

### Prerequisites

- Node.js (LTS recommended)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/jongyllen/yawt.git
   cd yawt
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

## License

This project is licensed under the [MIT License](LICENSE).