# yawt (Yet Another Workout Tracker)

A minimal, schema-driven workout application built with Expo and React Native.

## Features

- **Schema-Driven Programs**: Define complex multi-week workout programs using simple, extensible JSON patterns.
- **Focused Workout Experience**: A minimalist UI designed specifically for use during active training sessions, minimizing distractions while keeping essential data at your fingertips.
- **Local-First Data**: All workout logs and progress are stored locally using SQLite, ensuring your data remains private and accessible without an internet connection.
- **Easy Sharing & Import**: Seamlessly export your custom programs or import others' programs via JSON sharing.
- **Program Discovery**: Browse and explore available programs to find the one that fits your goals.
- **Developer-Friendly**: Built with Zod for robust schema validation and Expo for a modern cross-platform development experience.

## GitHub Integration & Program Discovery

YAWT can discover and import workout programs directly from any public GitHub repository. This allows you to share your custom programs or browse community-created workouts.

### How It Works

The **Discover** tab in the Programs screen fetches a registry of available programs from a GitHub repository. By default, it points to [`jongyllen/yawt-workouts`](https://github.com/jongyllen/yawt-workouts), but you can configure your own in **Settings → Discovery Registry**.

### Setting Up Your Own Workout Registry

To host your own programs on GitHub:

1. **Create a public repository** on GitHub

2. **Add a `registry.json`** file at the root with this structure:

   ```json
   {
     "programs": [
       {
         "id": "unique-program-id",
         "name": "My Workout Program",
         "description": "A brief description of the program",
         "author": "Your Name",
         "path": "programs/my-workout.json"
       }
     ]
   }
   ```

3. **Add your program JSON files** in the paths specified in the registry. Each program must follow the YAWT program schema (validated with Zod).

4. **Configure the app** to use your repository:
   - Go to **Settings → Discovery Registry**
   - Enter your repository as `username/repo-name`
   - Optionally specify a branch (defaults to `main`)

### Example Program Structure

Programs follow a schema with workouts containing blocks and steps:

```json
{
  "id": "my-program",
  "version": "workout.program.v1",
  "name": "My Program",
  "description": "Program description",
  "workouts": [
    {
      "id": "workout-1",
      "name": "Day 1",
      "blocks": [
        {
          "id": "block-1",
          "name": "Main Set",
          "type": "main",
          "rounds": 3,
          "restBetweenRounds": 60,
          "steps": [
            {
              "id": "step-1",
              "type": "exercise_inline",
              "name": "Push-ups",
              "reps": 10,
              "cues": ["Full lockout", "Core tight"]
            }
          ]
        }
      ]
    }
  ]
}
```

For multi-week programs, add a `weeks` array to schedule workouts across days:

```json
{
  "weeks": [
    {
      "weekNumber": 1,
      "workouts": [
        { "dayNumber": 1, "workoutId": "workout-1" },
        { "dayNumber": 3, "workoutId": "workout-2" }
      ]
    }
  ]
}
```

See the [yawt-workouts repository](https://github.com/jongyllen/yawt-workouts) for complete examples.

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
