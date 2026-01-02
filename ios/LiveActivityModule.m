#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE (LiveActivityModule, NSObject)

RCT_EXTERN_METHOD(isSupported : (RCTPromiseResolveBlock)
                      resolve reject : (RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(
    startActivity : (NSString *)workoutName programName : (
        NSString *)programName exerciseName : (NSString *)exerciseName
        exerciseDescription : (NSString *)exerciseDescription blockName : (
            NSString *)blockName currentBlock : (NSInteger)
            currentBlock totalBlocks : (NSInteger)totalBlocks currentRound : (
                NSInteger)currentRound totalRounds : (NSInteger)
                totalRounds progress : (double)progress isTimed : (BOOL)
                    isTimed durationSeconds : (NSInteger)
                        durationSeconds isPaused : (BOOL)isPaused reps : (
                            NSNumber *)reps accentColorHex : (NSString *)
                            accentColorHex resolve : (RCTPromiseResolveBlock)
                                resolve reject : (RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(
    updateActivity : (NSString *)exerciseName exerciseDescription : (NSString *)
        exerciseDescription blockName : (NSString *)blockName currentBlock : (
            NSInteger)currentBlock totalBlocks : (NSInteger)
            totalBlocks currentRound : (NSInteger)currentRound totalRounds : (
                NSInteger)totalRounds progress : (double)
                progress isTimed : (BOOL)isTimed durationSeconds : (NSInteger)
                    durationSeconds isPaused : (BOOL)isPaused reps : (
                        NSNumber *)reps resolve : (RCTPromiseResolveBlock)
                        resolve reject : (RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(endActivity : (RCTPromiseResolveBlock)
                      resolve reject : (RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(endAllActivities : (RCTPromiseResolveBlock)
                      resolve reject : (RCTPromiseRejectBlock)reject)

@end
