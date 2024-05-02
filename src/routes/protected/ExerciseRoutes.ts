import { Request, Response } from 'express';
import ExerciseOperations from '../../db/ExerciseOperations';
import WorkoutOperations from '../../db/WorkoutOperations';
import AuthService from '../../middleware/AuthService';
import { Exercise, ExerciseSubmission } from '../../types/Exercise';
import { Predictions, PreviousBestSets, SetMap } from '../../types/Prediction';
import PerformancePredictor from '../../util/PerformancePredictor';
import BaseRoute from '../BaseRoute';

/**
 * Exercise routes
 */
class ExerciseRoutes extends BaseRoute {
	private static instance: ExerciseRoutes;
	private exerOps = ExerciseOperations.getInstance();
	private workoutOps = WorkoutOperations.getInstance();
	public path = '/exercises';

	private constructor() {
		super();
		this.initialiseRoutes();
	}

	/**
	 * @returns ExerciseRoutes instance
	 */
	public static getInstance(): ExerciseRoutes {
		if (!ExerciseRoutes.instance) {
			ExerciseRoutes.instance = new ExerciseRoutes();
		}

		return ExerciseRoutes.instance;
	}

	public configureRoutes() {
		this.router.use(AuthService.verifyToken); // Applies middleware to all routes
		this.router.get('/', this.getAllExercises.bind(this));
		this.router.get('/bodyparts', this.getBodyParts.bind(this));
		this.router.get('/equipmentTypes', this.getEquipmentTypes.bind(this));
		this.router.get('/user', this.getUserExercises.bind(this));
		this.router.get('/:exerciseId', this.getExercise.bind(this));
		this.router.get('/:exerciseId/predictions', this.getExercisePredictions.bind(this));
		this.router.post('/', this.createExercise.bind(this));
		this.router.patch('/:exerciseId', this.updateExercise.bind(this));
		this.router.delete('/:exerciseId', this.deleteExercise.bind(this));
	}

	/**
	 * Retrieve all default and user created exercises
	 * using the exercise operations repository class
	 * @param req request object
	 * @param res response object
	 */
	private async getAllExercises(req: Request, res: Response) {
		const userId = req.user?.id;
		if (!userId) {
			return res.status(403).json({ error: "Can't get user ID from request" });
		}

		try {
			const defaultExercises = await this.exerOps.getDefaultExercises();
			const userExercises = await this.exerOps.getUserExercises(userId);

			res.status(200).json({
				defaultExercises: defaultExercises,
				userExercises: userExercises
			});
		} catch (err) {
			console.error('Error getting exercises:', err);
			res.status(500).json({ error: 'Failed to get exercises' });
		}
	}

	/**
	 * Retrieve all body parts from across all exercises
	 * using the exercise operations repository class
	 * @param _req request object (currently unused)
	 * @param res response object
	 */
	private async getBodyParts(_req: Request, res: Response) {
		try {
			const bodyparts = await this.exerOps.getBodyparts();

			res.status(200).json({ bodyparts });
		} catch (err) {
			console.error('Error getting body parts:', err);
			res.status(500).json({ error: 'Failed to get body parts' });
		}
	}

	/**
	 * Retrieve all equipment types from across all exercises
	 * using the exercise operations repository class
	 * @param _req request object (currently unused)
	 * @param res response object
	 */
	private async getEquipmentTypes(_req: Request, res: Response) {
		try {
			const equipmentTypes = await this.exerOps.getEquipmentTypes();

			res.status(200).json({ equipmentTypes });
		} catch (err) {
			console.error('Error getting equipment types:', err);
			res.status(500).json({ error: 'Failed to get equipment types' });
		}
	}

	/**
	 * Retrieve all user created exercises
	 * using the exercise operations repository class
	 * @param req request object
	 * @param res response object
	 */
	private async getUserExercises(req: Request, res: Response) {
		const userId = req.user?.id;
		if (!userId) {
			return res.status(403).json({ error: "Can't get user ID from request" });
		}

		try {
			const userExercises = await this.exerOps.getUserExercises(userId);

			res.status(200).json({ userExercises });
		} catch (err) {
			console.error('Error getting user exercises:', err);
			res.status(500).json({ error: 'Failed to get user exercises' });
		}
	}

	/**
	 * Retrieve single exercise
	 * using the exercise operations repository class
	 * @param req request object
	 * @param res response object
	 */
	private async getExercise(req: Request, res: Response) {
		const { exerciseId } = req.params;
		if (!exerciseId) {
			return res.status(403).json({ error: "Can't get exercise ID from request" });
		}

		try {
			const exercise = await this.exerOps.getExerciseById(exerciseId);

			res.status(200).json({ exercise });
		} catch (err) {
			console.error('Error getting exercise:', err);
			res.status(500).json({ error: 'Failed to get exercise' });
		}
	}

	/**
	 * Retrieve predictions for the next best action for an exercise.
	 * This is based on the previous best sets for each exercise.
	 * Uses the workout operations repository class.
	 * @param req request object
	 * @param res response object
	 */
	private async getExercisePredictions(req: Request, res: Response) {
		const { exerciseId } = req.params;
		if (!exerciseId) {
			return res.status(403).json({ error: "Can't get exercise ID from request" });
		}

		const userId = req.user?.id;
		if (!userId) {
			return res.status(403).json({ error: "Can't get user ID from request" });
		}

		try {
			const workouts = await this.workoutOps.getUserWorkoutsByExerciseIds(userId, [exerciseId]);

			const firstSetsMap: SetMap = {};
			const previousBestSets: PreviousBestSets = {};
			previousBestSets[exerciseId] = null;

			workouts.forEach(workout => {
				workout.exercises.forEach(exercise => {
					if (!firstSetsMap[exercise.id]) {
						firstSetsMap[exercise.id] = [];
					}

					const firstSet = workout.exercises.find(e => e.id === exercise.id)?.sets[0];
					if (firstSet) {
						firstSetsMap[exercise.id].push({
							weight: firstSet.weight,
							reps: firstSet.reps
						});

						previousBestSets[exercise.id] = { weight: firstSet.weight, reps: firstSet.reps };
					}
				});
			});

			const predictions: Predictions = {};
			predictions[exerciseId] = null;

			const predictor = await PerformancePredictor.create();
			const predictionResults = await Promise.all(
				Object.entries(firstSetsMap).map(async ([exerciseId, sets]) => {
					if (sets.length == 1) {
						return { exerciseId, prediction: 'increase weight or reps' };
					} else if (sets.length >= 2) {
						const prediction = await predictor.predict(sets);
						return { exerciseId, prediction: prediction[prediction.length - 1] };
					}
					return { exerciseId, prediction: null };
				})
			);

			predictionResults.forEach(({ exerciseId, prediction }) => {
				predictions[exerciseId] = prediction;
			});
			// console.log('Predictions:', predictions);

			res.status(200).json({ predictions: predictions, previousBestSets: previousBestSets });
		} catch (err) {
			console.error('Error getting exercise predictions:', err);
			res.status(500).json({ error: 'Failed to get exercise predictions' });
		}
	}

	/**
	 * Create a new exercise using the exercise operations repository class
	 * @param req request object
	 * @param res response object
	 */
	private async createExercise(req: Request, res: Response) {
		const submission: ExerciseSubmission = req.body.exerciseSubmission;

		const { name, bodypart, type } = submission;
		if (!name || !bodypart || !type) {
			return res.status(403).json({ error: 'Missing required field(s)' });
		}

		const userId = req.user?.id;
		if (!userId) {
			return res.status(403).json({ error: "Can't get user ID from request" });
		}

		try {
			const newExercise = await this.exerOps.createExercise(userId, name, bodypart, type);

			res.status(200).json({ exercise: newExercise });
		} catch (err) {
			console.error('Creating exercise error:', err);
			res.status(500).json({ error: 'Failed to create exercise' });
		}
	}

	/**
	 * Update an exercise using the exercise operations repository class
	 * @param req request object
	 * @param res response object
	 */
	private async updateExercise(req: Request, res: Response) {
		const { exerciseId } = req.params;
		if (!exerciseId) {
			return res.status(403).json({ error: "Can't get exercise ID from request" });
		}

		const exercise: Exercise = req.body.exercise;
		if (!exerciseId || !exercise) {
			return res.status(403).json({ error: 'Missing required field(s)' });
		}

		try {
			const updatedExercise = await this.exerOps.updateExercise(exerciseId, exercise);

			res.status(200).json({ exercise: updatedExercise });
		} catch (err) {
			console.error('Updating exercise error:', err);
			res.status(500).json({ error: 'Failed to update exercise' });
		}
	}

	/**
	 * Delete an exercise using the exercise operations repository class
	 * @param req request object
	 * @param res response object
	 */
	private async deleteExercise(req: Request, res: Response) {
		const { exerciseId } = req.params;
		if (!exerciseId) {
			return res.status(403).json({ error: "Can't get exercise ID from request" });
		}

		try {
			await this.exerOps.deleteExercise(exerciseId);

			res.status(200).json({ message: 'Exercise deleted successfully' });
		} catch (err) {
			console.error('Deleting exercise error:', err);
			res.status(500).json({ error: 'Failed to delete exercise' });
		}
	}
}

export default ExerciseRoutes;
