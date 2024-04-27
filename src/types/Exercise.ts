export type Exercise = {
	id: string;
	name: string;
	bodypart: string;
	type: string;
	userId: string | null;
	created: Date;
	updated: Date;
};

export type ExerciseSubmission = {
	name: string;
	bodypart: string;
	type: string;
};
