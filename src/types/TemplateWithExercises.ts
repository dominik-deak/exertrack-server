export type TemplateWithExercises = {
	id: string;
	name: string;
	userId: string | null;
	created: Date;
	updated: Date;
	exercises: {
		exerciseId: string;
		sets: number;
		repsMin: number;
		repsMax: number;
		name: string;
		bodypart: string;
		type: string;
		userId: string | null;
		created: Date;
		updated: Date;
	}[];
};
