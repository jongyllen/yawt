import ActivityKit
import Foundation
import React

@objc(LiveActivityModule)
class LiveActivityModule: NSObject {
    private var currentActivity: Activity<WorkoutAttributes>?

    @objc
    static func requiresMainQueueSetup() -> Bool {
        return true
    }

    @objc
    func isSupported(_ resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        if #available(iOS 16.1, *) {
            resolve(ActivityAuthorizationInfo().areActivitiesEnabled)
        } else {
            resolve(false)
        }
    }

    @objc(startActivity:programName:exerciseName:exerciseDescription:blockName:currentBlock:totalBlocks:currentRound:totalRounds:progress:isTimed:durationSeconds:isPaused:reps:accentColorHex:resolve:reject:)
    func startActivity(
        _ workoutName: String,
        programName: String?,
        exerciseName: String,
        exerciseDescription: String,
        blockName: String,
        currentBlock: Int,
        totalBlocks: Int,
        currentRound: Int,
        totalRounds: Int,
        progress: Double,
        isTimed: Bool,
        durationSeconds: Int,
        isPaused: Bool,
        reps: NSNumber?,
        accentColorHex: String,
        resolve: @escaping RCTPromiseResolveBlock,
        reject: @escaping RCTPromiseRejectBlock
    ) {
        guard #available(iOS 16.1, *), ActivityAuthorizationInfo().areActivitiesEnabled else {
            resolve(nil)
            return
        }
        
        // End existing activities first
        for activity in Activity<WorkoutAttributes>.activities {
            Task {
                await activity.end(dismissalPolicy: .immediate)
            }
        }
        
        let attributes = WorkoutAttributes(
            workoutName: workoutName,
            programName: programName,
            accentColorHex: accentColorHex
        )
        
        let initialContentState = WorkoutAttributes.ContentState(
            exerciseName: exerciseName,
            exerciseDescription: exerciseDescription,
            blockName: blockName,
            currentBlock: currentBlock,
            totalBlocks: totalBlocks,
            currentRound: currentRound,
            totalRounds: totalRounds,
            progress: progress,
            isTimed: isTimed,
            durationSeconds: durationSeconds,
            isPaused: isPaused,
            reps: reps?.intValue
        )
        
        do {
            let activity = try Activity.request(
                attributes: attributes,
                content: .init(state: initialContentState, staleDate: nil),
                pushType: nil
            )
            self.currentActivity = activity
            resolve(activity.id)
        } catch {
            reject("E_START_ACTIVITY_FAILED", "Failed to start Live Activity: \(error.localizedDescription)", error)
        }
    }

    @objc(updateActivity:exerciseDescription:blockName:currentBlock:totalBlocks:currentRound:totalRounds:progress:isTimed:durationSeconds:isPaused:reps:resolve:reject:)
    func updateActivity(
        _ exerciseName: String,
        exerciseDescription: String,
        blockName: String,
        currentBlock: Int,
        totalBlocks: Int,
        currentRound: Int,
        totalRounds: Int,
        progress: Double,
        isTimed: Bool,
        durationSeconds: Int,
        isPaused: Bool,
        reps: NSNumber?,
        resolve: @escaping RCTPromiseResolveBlock,
        reject: @escaping RCTPromiseRejectBlock
    ) {
        guard #available(iOS 16.1, *) else { return }
        
        let updatedContentState = WorkoutAttributes.ContentState(
            exerciseName: exerciseName,
            exerciseDescription: exerciseDescription,
            blockName: blockName,
            currentBlock: currentBlock,
            totalBlocks: totalBlocks,
            currentRound: currentRound,
            totalRounds: totalRounds,
            progress: progress,
            isTimed: isTimed,
            durationSeconds: durationSeconds,
            isPaused: isPaused,
            reps: reps?.intValue
        )
        
        Task {
            for activity in Activity<WorkoutAttributes>.activities {
                await activity.update(using: updatedContentState)
            }
            resolve(true)
        }
    }

    @objc
    func endActivity(_ resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        guard #available(iOS 16.1, *) else { return }
        
        Task {
            for activity in Activity<WorkoutAttributes>.activities {
                await activity.end(dismissalPolicy: .immediate)
            }
            self.currentActivity = nil
            resolve(true)
        }
    }

    @objc
    func endAllActivities(_ resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        guard #available(iOS 16.1, *) else { return }
        
        Task {
            for activity in Activity<WorkoutAttributes>.activities {
                await activity.end(dismissalPolicy: .immediate)
            }
            resolve(true)
        }
    }
}
