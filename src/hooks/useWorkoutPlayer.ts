import { useState, useEffect, useRef, useCallback } from 'react';
import * as Haptics from 'expo-haptics';
import { Workout, Program } from '../schemas/schema';

interface UseWorkoutPlayerProps {
    workout: Workout | null;
    initialIndexes?: {
        blockIndex: number;
        stepIndex: number;
        round: number;
    };
    onFinish: () => void;
}

export function useWorkoutPlayer({ workout, initialIndexes, onFinish }: UseWorkoutPlayerProps) {
    const [currentBlockIndex, setCurrentBlockIndex] = useState(initialIndexes?.blockIndex ?? 0);
    const [currentStepIndex, setCurrentStepIndex] = useState(initialIndexes?.stepIndex ?? 0);
    const [currentRound, setCurrentRound] = useState(initialIndexes?.round ?? 1);
    const [timeLeft, setTimeLeft] = useState<number | null>(null);
    const [isPaused, setIsPaused] = useState(false);
    const [isFinished, setIsFinished] = useState(false);

    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Update timeLeft when step/round/block changes
    useEffect(() => {
        if (workout) {
            const step = workout.blocks[currentBlockIndex]?.steps[currentStepIndex];
            if (step?.durationSeconds) {
                setTimeLeft(step.durationSeconds);
            } else {
                setTimeLeft(null);
            }
        }
    }, [currentBlockIndex, currentStepIndex, currentRound, workout]);

    // Timer logic
    useEffect(() => {
        if (timeLeft !== null && timeLeft > 0 && !isPaused && !isFinished) {
            timerRef.current = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev === 1) {
                        handleNext();
                        return 0;
                    }
                    return (prev || 0) - 1;
                });
            }, 1000);
        } else {
            if (timerRef.current) clearInterval(timerRef.current);
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [timeLeft, isPaused, isFinished]);

    const handleNext = useCallback(async () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        if (!workout) return;

        const currentBlock = workout.blocks[currentBlockIndex];
        if (currentStepIndex < currentBlock.steps.length - 1) {
            setCurrentStepIndex(prev => prev + 1);
        } else if (currentRound < currentBlock.rounds) {
            setCurrentRound(prev => prev + 1);
            setCurrentStepIndex(0);
        } else if (currentBlockIndex < workout.blocks.length - 1) {
            setCurrentBlockIndex(prev => prev + 1);
            setCurrentStepIndex(0);
            setCurrentRound(1);
        } else {
            setIsFinished(true);
            setIsPaused(true);
            onFinish();
        }
    }, [workout, currentBlockIndex, currentStepIndex, currentRound, onFinish]);

    const handleBack = useCallback(() => {
        if (currentStepIndex > 0) {
            setCurrentStepIndex(prev => prev - 1);
        } else if (currentRound > 1) {
            setCurrentRound(prev => prev - 1);
            setCurrentStepIndex(workout!.blocks[currentBlockIndex].steps.length - 1);
        } else if (currentBlockIndex > 0) {
            const prevBlock = workout!.blocks[currentBlockIndex - 1];
            setCurrentBlockIndex(prev => prev - 1);
            setCurrentRound(prevBlock.rounds);
            setCurrentStepIndex(prevBlock.steps.length - 1);
        }
    }, [workout, currentBlockIndex, currentStepIndex, currentRound]);

    const getProgress = useCallback(() => {
        if (!workout) return 0;
        let totalSteps = 0;
        let currentLinearIndex = 0;

        workout.blocks.forEach((block, bIdx) => {
            const blockSteps = block.steps.length * block.rounds;
            totalSteps += blockSteps;

            if (bIdx < currentBlockIndex) {
                currentLinearIndex += blockSteps;
            } else if (bIdx === currentBlockIndex) {
                currentLinearIndex += (currentRound - 1) * block.steps.length + currentStepIndex;
            }
        });

        return totalSteps > 0 ? currentLinearIndex / totalSteps : 0;
    }, [workout, currentBlockIndex, currentStepIndex, currentRound]);

    return {
        currentBlockIndex,
        currentStepIndex,
        currentRound,
        timeLeft,
        isPaused,
        isFinished,
        setIsPaused,
        handleNext,
        handleBack,
        getProgress,
        currentBlock: workout?.blocks[currentBlockIndex] || null,
        currentStep: workout?.blocks[currentBlockIndex]?.steps[currentStepIndex] || null,
    };
}
