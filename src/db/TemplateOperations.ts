import { PrismaClient, TemplateExercise } from '@prisma/client';
import { Template } from '../types/Template';
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

	/**
	 * @returns TemplateOperations instance
	 */
	public static getInstance(): TemplateOperations {
		if (!TemplateOperations.instance) {
			TemplateOperations.instance = new TemplateOperations();
		}
		return TemplateOperations.instance;
	}

	/**
	 * Retrieves all default templates (where userId is null)
	 * @returns the default templates
	 */
	public async getDefaultTemplates() {
		const templates = await this.db.template.findMany({
			where: {
				OR: [{ userId: null }, { userId: { isSet: false } }]
			}
		});
		return templates;
	}

	/**
	 * Retrieves all user created templates
	 * @param userId the id of the user who created the templates
	 * @returns the user created templates
	 */
	public async getUserTemplates(userId: string) {
		const templates = await this.db.template.findMany({
			where: { userId: userId }
		});
		return templates;
	}

	/**
	 * Retrieves a template with its exercises
	 * @param templateId the id of the template
	 * @returns the template with its exercises
	 */
	public async getTemplateWithExercises(templateId: string) {
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
						where: { id: templateExercise.id },
						select: {
							id: false, // not including `id` because `template.exercises` already has `id`
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
						console.error(`Could not find exercise "${templateExercise.id}" in template "${template.name}"`);
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
			} as Template;
		}

		return {
			...template,
			exercises: []
		} as Template;
	}

	/**
	 * Retrieves the name of a template
	 * @param templateId the id of the template
	 * @returns the name of the template
	 */
	public async getTemplateName(templateId: string) {
		const template = await this.db.template.findUnique({
			where: { id: templateId },
			select: { name: true }
		});

		// if a valid template ID is provided, there should always be a template record
		if (!template) {
			return null;
		}

		return template.name;
	}

	/**
	 * Creates a new template in the database
	 * @param userId the id of the user who created the template
	 * @param name the name of the template
	 * @param exercises the exercises of the template
	 * @returns the created template
	 */
	public async createTemplate(userId: string, name: string, exercises: TemplateExercise[]) {
		const newTemplate = await this.db.template.create({
			data: {
				name,
				userId,
				exercises
			}
		});
		return newTemplate;
	}

	/**
	 * Updates a template in the database
	 * @param templateId the id of the template
	 * @param name the name of the template
	 * @param exercises the exercises of the template
	 * @returns the updated template
	 */
	public async updateTemplate(templateId: string, name: string, exercises: TemplateExercise[]) {
		const updatedTemplate = await this.db.template.update({
			where: { id: templateId },
			data: {
				name,
				exercises
			}
		});
		return updatedTemplate;
	}

	/**
	 * Deletes a template from the database
	 * @param templateId the id of the template to delete
	 */
	public async deleteTemplate(templateId: string) {
		await this.db.template.delete({
			where: { id: templateId }
		});
	}
}

export default TemplateOperations;
