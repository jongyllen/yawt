import ActivityKit
import SwiftUI
import WidgetKit

struct WorkoutLiveActivityView: View {
    let context: ActivityViewContext<WorkoutAttributes>
    
    var body: some View {
        VStack(spacing: 8) {
            HStack {
                VStack(alignment: .leading) {
                    Text(context.attributes.workoutName)
                        .font(.caption)
                        .foregroundColor(.secondary)
                    Text(context.state.exerciseName)
                        .font(.headline)
                }
                Spacer()
                if context.state.isTimed {
                    Text(formatTime(context.state.durationSeconds))
                        .font(.title2.monospacedDigit())
                        .bold()
                } else if let reps = context.state.reps {
                    Text("\(reps) reps")
                        .font(.title2)
                        .bold()
                }
            }
            
            ProgressView(value: context.state.progress)
                .tint(Color(hex: context.attributes.accentColorHex))
            
            HStack {
                Text(context.state.blockName)
                    .font(.caption)
                Spacer()
                Text("Round \(context.state.currentRound)/\(context.state.totalRounds)")
                    .font(.caption)
            }
        }
        .padding()
    }
    
    func formatTime(_ seconds: Int) -> String {
        let mins = seconds / 60
        let secs = seconds % 60
        return String(format: "%d:%02d", mins, secs)
    }
}

@main
@available(iOS 16.2, *)
struct WorkoutLiveActivityWidget: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: WorkoutAttributes.self) { context in
            // Lock Screen / Notification Center UI
            WorkoutLiveActivityView(context: context)
        } dynamicIsland: { context in
            DynamicIsland {
                // Expanded UI
                DynamicIslandExpandedRegion(.leading) {
                    VStack(alignment: .leading) {
                        Text(context.state.exerciseName)
                            .font(.headline)
                        Text(context.state.blockName)
                            .font(.caption)
                    }
                }
                DynamicIslandExpandedRegion(.trailing) {
                    VStack(alignment: .trailing) {
                        if context.state.isTimed {
                            Text(formatTime(context.state.durationSeconds))
                                .font(.title2.monospacedDigit())
                        } else if let reps = context.state.reps {
                            Text("\(reps) reps")
                                .font(.title2)
                        }
                    }
                }
                DynamicIslandExpandedRegion(.bottom) {
                    ProgressView(value: context.state.progress)
                        .tint(Color(hex: context.attributes.accentColorHex))
                }
            } compactLeading: {
                Text(context.state.exerciseName)
                    .font(.caption2)
            } compactTrailing: {
                if context.state.isTimed {
                    Text(formatTime(context.state.durationSeconds))
                        .font(.caption2.monospacedDigit())
                } else {
                    Text("B\(context.state.currentBlock)")
                }
            } minimal: {
                if context.state.isTimed {
                    Image(systemName: "timer")
                } else {
                    Text("\(context.state.currentBlock)")
                }
            }
        }
    }
    
    func formatTime(_ seconds: Int) -> String {
        let mins = seconds / 60
        let secs = seconds % 60
        return String(format: "%d:%02d", mins, secs)
    }
}

extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 3: // RGB (12-bit)
            (a, r, g, b) = (255, (int >> 8) * 17, (int >> 4 & 0xF) * 17, (int & 0xF) * 17)
        case 6: // RGB (24-bit)
            (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        case 8: // ARGB (32-bit)
            (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default:
            (a, r, g, b) = (1, 1, 1, 0)
        }
        self.init(
            .sRGB,
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue: Double(b) / 255,
            opacity: Double(a) / 255
        )
    }
}
