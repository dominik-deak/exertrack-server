import { Request, Response } from 'express';
import TemplateOperations from '../../db/TemplateOperations';
import WorkoutOperations from '../../db/WorkoutOperations';
import AuthService from '../../middleware/AuthService';
import { Predictions, PreviousBestSets, SetMap } from '../../types/Prediction';
import { Template, TemplateSubmission } from '../../types/Template';
import PerformancePredictor from '../../util/PerformancePredictor';
import BaseRoute from '../BaseRoute';

/**
 * Template routes
 */
class TemplateRoutes extends BaseRoute {
	private static instance: TemplateRoutes;
	private tempOps = TemplateOperations.getInstance();
	private workoutOps = WorkoutOperations.getInstance();
	public path = '/templates';

	private constructor() {
		super();
		this.initialiseRoutes();
	}

	/**
	 * @returns TemplateRoutes instance
	 */
	public static getInstance(): TemplateRoutes {
		if (!TemplateRoutes.instance) {
			TemplateRoutes.instance = new TemplateRoutes();
		}

		return TemplateRoutes.instance;
	}

	public configureRoutes() {
		this.router.use(AuthService.verifyToken); // Applies middleware to all routes
		this.router.get('/', this.getAllTemplates.bind(this));
		this.router.get('/user', this.getUserTemplates.bind(this));
		this.router.get('/:templateId', this.getSingleTemplate.bind(this));
		this.router.get('/:templateId/predictions', this.getTemplatePredictions.bind(this));
		this.router.post('/', this.createTemplate.bind(this));
		this.router.patch('/:templateId', this.updateTemplate.bind(this));
		this.router.delete('/:templateId', this.deleteTemplate.bind(this));
	}

	/**
	 * Get all default and user created templates
	 * using the template operations repository class
	 * @param req request object
	 * @param res response object
	 */
	private async getAllTemplates(req: Request, res: Response) {
		const userId = req.user?.id;
		if (!userId) {
			return res.status(403).json({ error: "Can't get user ID from request" });
		}

		try {
			const defaultTemplates = await this.tempOps.getDefaultTemplates();
			const userTemplates = await this.tempOps.getUserTemplates(userId);

			res.status(200).json({
				defaultTemplates: defaultTemplates,
				userTemplates: userTemplates
			});
		} catch (err) {
			console.error('Getting templates error:', err);
			res.status(500).json({ error: 'Failed to get templates' });
		}
	}

	/**
	 * Get a single template with associated exercises
	 * using the template operations repository class
	 * @param req request object
	 * @param res response object
	 */
	private async getSingleTemplate(req: Request, res: Response) {
		const { templateId } = req.params;
		if (!templateId) {
			return res.status(403).json({ error: "Can't get template ID from request" });
		}

		try {
			const templateWithExercises = await this.tempOps.getTemplateWithExercises(templateId);
			if (!templateWithExercises) {
				return res.status(404).json({ error: "Can't find template" });
			}

			res.status(200).json({ template: templateWithExercises });
		} catch (err) {
			console.error('Getting templates error:', err);
			res.status(500).json({ error: 'Failed to get templates' });
		}
	}

	/**
	 * Retrieve predictions for the next best action for all exercises in a template.
	 * This is based on the previous best sets for each exercise.
	 * Uses the workout operations repository class.
	 * @param req request object
	 * @param res response object
	 */
	private async getTemplatePredictions(req: Request, res: Response) {
		const { templateId } = req.params;
		if (!templateId) {
			return res.status(403).json({ error: "Can't get template ID from request" });
		}

		try {
			const templateWithExercises = await this.tempOps.getTemplateWithExercises(templateId);
			if (!templateWithExercises) {
				return res.status(404).json({ error: "Can't find template" });
			}

			const exerciseIds = templateWithExercises.exercises.map(exercise => exercise.id);
			const workouts = await this.workoutOps.getWorkoutsByExerciseIds(exerciseIds);

			workouts.sort((a, b) => a.created.getTime() - b.created.getTime());

			const firstSetsMap: SetMap = {};
			const defaultPredictions: Predictions = {};
			const previousBestSets: PreviousBestSets = {};

			exerciseIds.forEach(id => {
				firstSetsMap[id] = [];
				defaultPredictions[id] = 'increase weight'; // default prediction if there's not enough data
				previousBestSets[id] = null;
			});

			workouts.forEach(workout => {
				workout.exercises.forEach(exercise => {
					const firstSet = exercise.sets[0];
					if (firstSet && exerciseIds.includes(exercise.id)) {
						firstSetsMap[exercise.id].push({
							weight: firstSet.weight,
							reps: firstSet.reps
						});
						previousBestSets[exercise.id] = { weight: firstSet.weight, reps: firstSet.reps };
					}
				});
			});

			const predictor = await PerformancePredictor.create();
			const predictions = { ...defaultPredictions };
			await Promise.all(
				Object.entries(firstSetsMap).map(async ([exerciseId, sets]) => {
					if (sets.length >= 2) {
						const prediction = await predictor.predict(sets);
						predictions[exerciseId] = prediction[prediction.length - 1];
					}
				})
			);
			// console.log('Predictions:', predictions);

			res.status(200).json({ predictions, previousBestSets });
		} catch (err) {
			console.error('Getting template predictions error:', err);
			res.status(500).json({ error: 'Failed to get template predictions' });
		}
	}

	/**
	 * Get all user templates using the template operations repository class
	 * @param req request object
	 * @param res response object
	 */
	private async getUserTemplates(req: Request, res: Response) {
		const userId = req.user?.id;
		if (!userId) {
			return res.status(403).json({ error: "Can't get user ID from request" });
		}

		try {
			const userTemplates = await this.tempOps.getUserTemplates(userId);

			res.status(200).json({ userTemplates });
		} catch (err) {
			console.error('Getting templates error:', err);
			res.status(500).json({ error: 'Failed to get templates' });
		}
	}

	/**
	 * Create a new template using the template operations repository class
	 * @param req request object
	 * @param res response object
	 */
	private async createTemplate(req: Request, res: Response) {
		const templateSubmission: TemplateSubmission = req.body.templateSubmission;

		const { name, exercises } = templateSubmission;
		if (!name || !exercises) {
			return res.status(403).json({ error: 'Missing required field(s)' });
		}

		const userId = req.user?.id;
		if (!userId) {
			return res.status(403).json({ error: "Can't get user ID from request" });
		}

		// to match TemplateExercise type in schema
		const filteredExercises = exercises.map(exercise => ({
			id: exercise.id,
			sets: exercise.sets,
			repsMin: exercise.repsMin,
			repsMax: exercise.repsMax
		}));

		try {
			const newTemplate = await this.tempOps.createTemplate(userId, name, filteredExercises);

			res.status(200).json({ template: newTemplate });
		} catch (err) {
			console.error('Creating template error:', err);
			res.status(500).json({ error: 'Failed to create template' });
		}
	}

	/**
	 * Update an existing template using the template operations repository class
	 * @param req request object
	 * @param res response object
	 */
	private async updateTemplate(req: Request, res: Response) {
		const { templateId } = req.params;
		if (!templateId) {
			return res.status(403).json({ error: "Can't get template ID from request" });
		}

		const template: Template = req.body.template;
		const { name, exercises } = template;
		const filteredExercises = exercises.map(exercise => ({
			id: exercise.id,
			sets: exercise.sets,
			repsMin: exercise.repsMin,
			repsMax: exercise.repsMax
		}));

		try {
			const updatedTemplate = await this.tempOps.updateTemplate(templateId, name, filteredExercises);

			res.status(200).json({ template: updatedTemplate });
		} catch (err) {
			console.error('Updating template error:', err);
			res.status(500).json({ error: 'Failed to update template' });
		}
	}

	/**
	 * Delete a template using the template operations repository class
	 * @param req request object
	 * @param res response object
	 */
	private async deleteTemplate(req: Request, res: Response) {
		const { templateId } = req.params;
		if (!templateId) {
			return res.status(403).json({ error: "Can't get template ID from request" });
		}

		try {
			if (!templateId) {
				return res.status(403).json({ error: "Can't get template ID from request" });
			}

			await this.tempOps.deleteTemplate(templateId);

			res.status(200).json({ message: 'Template deleted successfully' });
		} catch (err) {
			console.error('Deleting template error:', err);
			res.status(500).json({ error: 'Failed to delete template' });
		}
	}
}

export default TemplateRoutes;
