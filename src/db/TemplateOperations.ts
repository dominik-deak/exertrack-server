import { PrismaClient } from '@prisma/client';
import { TemplateWithExercises } from '../types/TemplateWithExercises';
import Database from './Database';

/**
 * Template database operations repository class
 */
class TemplateOperations {
	private static instance: TemplateOperations;
	private db: PrismaClient;

	private constructor() {
		this.db = Database.getInstance();
	}

	public static getInstance(): TemplateOperations {
		if (!TemplateOperations.instance) {
			TemplateOperations.instance = new TemplateOperations();
		}
		return TemplateOperations.instance;
	}

	public async getDefaultTemplates() {
		const templates = await this.db.template.findMany({
			where: { userId: null }
		});
		return templates;
	}

	public async getUserTemplates(userId: string) {
		const templates = await this.db.template.findMany({
			where: { userId }
		});
		return templates;
	}

	/**
	 * @returns both template and full exercise objects
	 */
	public async getSingleTemplate(templateId: string) {
		const template = await this.db.template.findUnique({
			where: { id: templateId }
		});

		if (!template) {
			return null;
		}

		if (template.exercises && template.exercises.length > 0) {
			// multiple asynchronous operations aggregation source:
			// https://www.javascripttutorial.net/es6/javascript-promise-all/
			const exercisesWithDetails = await Promise.all(
				template.exercises.map(async templateExercise => {
					const exerciseDetail = await this.db.exercise.findUnique({
						where: { id: templateExercise.exerciseId },
						select: {
							id: false, // not including `id` because `template.exercises` already has `exerciseId`
							name: true,
							bodypart: true,
							type: true,
							userId: true,
							created: true,
							updated: true
						}
					});

					// if everything works properly, this should never be null
					if (!exerciseDetail) {
						console.error(
							`Could not find exercise "${templateExercise.exerciseId}" in template "${template.name}"`
						);
						return null;
					}

					return {
						...exerciseDetail,
						...templateExercise
					};
				})
			);

			// filter out any nulls if an exercise detail was missing
			// but once again, none of them should be null if everything works properly
			const filteredExercises = exercisesWithDetails.filter(exercise => exercise !== null);

			return {
				...template,
				exercises: filteredExercises
			} as TemplateWithExercises;
		}

		return {
			...template,
			exercises: []
		} as TemplateWithExercises;
	}
}

export default TemplateOperations;
