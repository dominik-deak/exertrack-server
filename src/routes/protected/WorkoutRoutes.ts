import { Request, Response } from 'express';
import ExerciseOperations from '../../db/ExerciseOperations';
import TemplateOperations from '../../db/TemplateOperations';
import WorkoutOperations from '../../db/WorkoutOperations';
import AuthService from '../../middleware/AuthService';
import { ExerciseSet, WorkoutExercise, WorkoutHistoryItem, WorkoutSubmission } from '../../types/Workout';
import BaseRoute from '../BaseRoute';

/**
 * Workout routes
 */
class WorkoutRoutes extends BaseRoute {
	private static instance: WorkoutRoutes;
	private workoutOps = WorkoutOperations.getInstance();
	private tempOps = TemplateOperations.getInstance();
	private exerOps = ExerciseOperations.getInstance();
	public path = '/workout';

	private constructor() {
		super();
		this.initialiseRoutes();
	}

	/**
	 * @returns WorkoutRoutes instance
	 */
	public static getInstance(): WorkoutRoutes {
		if (!WorkoutRoutes.instance) {
			WorkoutRoutes.instance = new WorkoutRoutes();
		}

		return WorkoutRoutes.instance;
	}

	public configureRoutes() {
		this.router.use(AuthService.verifyToken); // Applies middleware to all routes
		this.router.get('/history', this.getWorkoutHistory.bind(this));
		this.router.get('/history-item/:workoutId', this.getWorkoutHistoryItem.bind(this));
		this.router.get('/volume/:frequency/:unit', this.getVolume.bind(this));
		this.router.get('/split-usage', this.getSplitUsages.bind(this));
		this.router.post('/complete', this.completeWorkout.bind(this));
	}

	/**
	 * Complete a workout submission using the workout operations repository class
	 * @param req request
	 * @param res response
	 */
	private async completeWorkout(req: Request, res: Response) {
		const workoutSubmission: WorkoutSubmission = req.body.workoutSubmission;
		const userId = req.user?.id;
		if (!userId) {
			return res.status(403).json({ error: "Can't get user ID from request" });
		}

		try {
			const convertedExercises = workoutSubmission.exercises
				// remove exercises where every set is blank
				.filter(exercise => exercise.sets.some(set => set.weight !== 0 && set.reps !== 0))
				.map((exercise: WorkoutExercise) => ({
					id: exercise.id,
					sets: exercise.sets
						// remove blank sets
						.filter(set => !(set.weight === 0 && set.reps === 0))
						.map((set: ExerciseSet) => ({
							weight: Number(set.weight),
							reps: Number(set.reps)
						}))
				}));

			await this.workoutOps.createWorkout(
				userId,
				workoutSubmission.templateId,
				workoutSubmission.duration,
				convertedExercises
			);

			res.status(201).json({ message: 'Workout created successfully' });
		} catch (err) {
			console.error('Error creating workout:', err);
			res.status(500).json({ error: 'Failed to create workout' });
		}
	}

	/**
	 * Get all of the user's workout history using the workout operations repository class
	 * @param req request object
	 * @param res response object
	 */
	private async getWorkoutHistory(req: Request, res: Response) {
		const userId = req.user?.id;
		if (!userId) {
			return res.status(403).json({ error: "Can't get user ID from request" });
		}

		try {
			let workoutHistory = await this.workoutOps.getWorkoutHistory(userId);

			// adding template name to workout objects for convenience on the client
			workoutHistory = await Promise.all(
				workoutHistory.map(async item => {
					const templateName = item.templateId ? await this.tempOps.getTemplateName(item.templateId) : null;
					return { ...item, templateName };
				})
			);

			res.status(200).json({ workoutHistory });
		} catch (err) {
			console.error('Error getting workout history:', err);
			res.status(500).json({ error: 'Failed to get workout history' });
		}
	}

	/**
	 * Get a single workout using the workout operations repository class
	 * @param req request object
	 * @param res response object
	 */
	private async getWorkoutHistoryItem(req: Request, res: Response) {
		const { workoutId } = req.params;
		if (!workoutId) {
			return res.status(403).json({ error: "Can't get workout ID from request" });
		}

		try {
			let workoutHistoryItem = (await this.workoutOps.getWorkoutHistoryItem(workoutId)) as WorkoutHistoryItem;

			if (workoutHistoryItem) {
				const exercisesWithDetails = await Promise.all(
					workoutHistoryItem.exercises.map(async exercise => {
						const exerciseDetail = await this.exerOps.getExerciseById(exercise.id);
						return {
							...exercise,
							...exerciseDetail
						};
					})
				);

				workoutHistoryItem.exercises = exercisesWithDetails;

				if (workoutHistoryItem.templateId) {
					const templateName = await this.tempOps.getTemplateName(workoutHistoryItem.templateId);
					workoutHistoryItem.templateName = templateName;
					delete workoutHistoryItem.templateId;
				}
			}

			res.status(200).json({ workoutHistoryItem });
		} catch (err) {
			console.error('Error getting workout:', err);
			res.status(500).json({ error: 'Failed to get workout history' });
		}
	}

	/**
	 * Get the user's total workout volume using the workout operations repository class
	 * @param req request object
	 * @param res response object
	 */
	private async getVolume(req: Request, res: Response) {
		const { frequency, unit } = req.params;
		if (!frequency || !unit) {
			return res.status(403).json({ error: "Can't get frequency or unit from request" });
		}

		const isValidUnit = unit === 'kilos' || unit === 'pounds';
		if (!isValidUnit) {
			return res.status(400).json({ error: 'Unit must be "kilos" or "pounds"' });
		}

		const userId = req.user?.id;
		if (!userId) {
			return res.status(403).json({ error: "Can't get user ID from request" });
		}

		try {
			const volume = await this.workoutOps.getVolume(userId, frequency, unit as 'kilos' | 'pounds');

			if (volume === null) {
				return res.status(403).json({ error: 'Invalid frequency specified' });
			}

			res.status(200).json({ volume });
		} catch (err) {
			console.error('Error getting volume:', err);
			res.status(500).json({ error: 'Failed to get volume' });
		}
	}

	/**
	 * Get the user's split usages using the workout operations repository class
	 * @param req request object
	 * @param res response object
	 */
	private async getSplitUsages(req: Request, res: Response) {
		const userId = req.user?.id;
		if (!userId) {
			return res.status(403).json({ error: "Can't get user ID from request" });
		}

		try {
			const splitUsages = await this.workoutOps.getSplitUsages(userId);
			const splitUsagesWithNames = await Promise.all(
				splitUsages.map(async usage => {
					if (usage.templateId) {
						const templateName = await this.tempOps.getTemplateName(usage.templateId);
						return {
							templateName,
							count: usage.count
						};
					} else {
						return {
							templateName: null,
							count: usage.count
						};
					}
				})
			);

			res.status(200).json({ splitUsages: splitUsagesWithNames });
		} catch (err) {
			console.error('Error getting split usage:', err);
			res.status(500).json({ error: 'Failed to get split usage' });
		}
	}
}

export default WorkoutRoutes;
