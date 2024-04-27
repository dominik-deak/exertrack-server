import { ExerciseSet } from './Workout';

export type Predictions = {
	[key: string]: string;
};

export type SetMap = {
	[key: string]: ExtendedExerciseSet[];
};

export type ExtendedExerciseSet = ExerciseSet & {
	previousWeight?: number;
	previousReps?: number;
};

export type PreviousBestSets = {
	[exerciseId: string]: {
		weight: number;
		reps: number;
	} | null;
};
