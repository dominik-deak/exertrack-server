export type Workout = {
	id: string;
	userId: string;
	templateId: string | null;
	duration: number;
	created: Date;
	updated: Date;
	exercises: WorkoutExercise[];
};

export type WorkoutExercise = {
	id: string;
	name: string;
	bodypart: string;
	type: string;
	userId: string | null;
	created: Date;
	updated: Date;
	sets: ExerciseSet[];
};

export type ExerciseSet = {
	weight: number;
	reps: number;
};

export type WorkoutSubmission = {
	templateId: string | null;
	duration: number;
	exercises: WorkoutExercise[];
};

export type WorkoutHistoryItem = {
	id: string;
	userId: string;
	templateId?: string;
	duration: number;
	created: Date;
	updated: Date;
	exercises: ({
		id: string;
		name: string;
		bodypart: string;
		type: string;
		userId: string | null;
		created: Date;
		updated: Date;
	} & {
		sets: {
			weight: number;
			reps: number;
		}[];
	})[];
} & {
	templateName: string | null;
};
