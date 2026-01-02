import { z } from 'zod';

export const ExerciseMediaSchema = z.object({
  id: z.string(),
  type: z.enum(['image', 'video']),
  url: z.string(),
  thumbnailUrl: z.string().optional(),
});

export type ExerciseMedia = z.infer<typeof ExerciseMediaSchema>;

export const StepSchema = z.object({
  id: z.string(),
  type: z.enum(['exercise_ref', 'exercise_inline', 'rest', 'timer', 'hold']),
  name: z.string().optional(),
  description: z.string().optional(), // Short description/tagline
  instructions: z.string().optional(), // Detailed instructions
  cues: z.array(z.string()).optional(), // Important permanent highlights
  media: z.array(ExerciseMediaSchema).optional(),
  durationSeconds: z.number().optional(),
  reps: z.number().optional(),
  weight: z.number().optional(),
  exerciseId: z.string().optional(), // For exercise_ref
});

export type Step = z.infer<typeof StepSchema>;

export const BlockSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['warmup', 'main', 'cooldown', 'circuit', 'interval']),
  rounds: z.number().default(1),
  restBetweenRounds: z.number().optional(),
  steps: z.array(StepSchema),
});

export type Block = z.infer<typeof BlockSchema>;

export const WorkoutSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  blocks: z.array(BlockSchema),
});

export type Workout = z.infer<typeof WorkoutSchema>;

export const ProgramSchema = z.object({
  id: z.string(),
  version: z.literal('workout.program.v1'),
  name: z.string(),
  description: z.string().optional(),
  author: z.string().optional(),
  weeks: z.array(
    z.object({
      weekNumber: z.number(),
      workouts: z.array(
        z.object({
          dayNumber: z.number(),
          workoutId: z.string(),
        })
      ),
    })
  ).optional(),
  workouts: z.array(WorkoutSchema),
});

export type Program = z.infer<typeof ProgramSchema>;

export const WorkoutLogSchema = z.object({
  id: z.string(),
  workoutId: z.string(),
  programId: z.string(),
  workoutName: z.string().optional(),
  programName: z.string().optional(),
  date: z.string(), // ISO String
  durationSeconds: z.number(),
  completedSteps: z.array(z.string()), // IDs of completed steps
  weekNumber: z.number().optional(),
  dayNumber: z.number().optional(),
});

export type WorkoutLog = z.infer<typeof WorkoutLogSchema>;

export const ActiveProgramSchema = z.object({
  id: z.string(), // enrollment ID
  programId: z.string(),
  startDate: z.string(),
  status: z.enum(['active', 'completed', 'paused']),
  lastBlockIndex: z.number().optional(),
  lastStepIndex: z.number().optional(),
  lastRound: z.number().optional(),
  lastWorkoutId: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type ActiveProgram = z.infer<typeof ActiveProgramSchema>;
