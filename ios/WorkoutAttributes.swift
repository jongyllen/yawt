import ActivityKit
import Foundation

struct WorkoutAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        // Dynamic state (changes during the activity)
        var exerciseName: String
        var exerciseDescription: String
        var blockName: String
        var currentBlock: Int
        var totalBlocks: Int
        var currentRound: Int
        var totalRounds: Int
        var progress: Double
        var isTimed: Bool
        var durationSeconds: Int
        var isPaused: Bool
        var reps: Int?
    }

    // Fixed attributes (set once at start)
    var workoutName: String
    var programName: String?
    var accentColorHex: String
}
