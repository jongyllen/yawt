export const generateAIPrompt = (userDescription: string) => {
  return `Create a fitness program JSON based on the following description: "${userDescription}"

The JSON must follow this exact structure:
{
  "id": "unique-kebab-case-id",
  "version": "workout.program.v1",
  "name": "Program Name",
  "description": "Short description",
  "author": "AI Assistant",
  "workouts": [
    {
      "id": "workout-id",
      "name": "Workout Name",
      "muscleGroups": ["Chest", "Triceps"], // optional tags
      "blocks": [
        {
          "id": "block-id",
          "name": "Block Name",
          "type": "warmup | main | cooldown | circuit | interval",
          "rounds": 1,
          "steps": [
            {
              "id": "step-id",
              "type": "exercise_ref | exercise_inline | rest | timer | hold",
              "name": "Exercise/Step Name",
              "instructions": "How to perform",
              "durationSeconds": 30, // optional
              "reps": 10, // optional
              "weight": 0 // optional
            }
          ]
        }
      ]
    }
  ],
  "weeks": [ // optional schedule
    {
      "weekNumber": 1,
      "workouts": [
        { "dayNumber": 1, "workoutId": "workout-id" }
      ]
    }
  ]
}

Important Rules:
1. "type" in Block must be one of: warmup, main, cooldown, circuit, interval.
2. "type" in Step must be one of: exercise_ref, exercise_inline, rest, timer, hold.
3. Use sensible IDs.
4. "muscleGroups" should be an array of strings (e.g., "Full Body", "Upper Body", "Legs", "Chest", "Back", "Shoulders", "Arms", "Core").
5. Return ONLY valid JSON, no other text.`;
};
