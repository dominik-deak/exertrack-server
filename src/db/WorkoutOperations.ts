import { PrismaClient, WorkoutExercise } from '@prisma/client';
import { kilosToPounds } from '../util/convertWeight';
import Database from './Database';

/**
 * Workout database operations repository class
 */
class WorkoutOperations {
	private static instance: WorkoutOperations;
	private db: PrismaClient;

	private constructor() {
		this.db = Database.getInstance();
	}

	/**
	 * @returns WorkoutOperations instance
	 */
	public static getInstance(): WorkoutOperations {
		if (!WorkoutOperations.instance) {
			WorkoutOperations.instance = new WorkoutOperations();
		}
		return WorkoutOperations.instance;
	}

	/**
	 * Creates a new workout in the database
	 * @param userId the id of the user
	 * @param templateId the id of the template used for the workout
	 * @param duration the duration of the workout
	 * @param exercises the exercises of the workout
	 * @returns the id of the created workout
	 */
	public async createWorkout(userId: string, templateId: string | null, duration: number, exercises: WorkoutExercise[]) {
		const workout = await this.db.workout.create({
			data: {
				userId,
				templateId,
				duration,
				exercises
			}
		});
		return workout;
	}

	/**
	 * Retrieves a user's workout history
	 * @param userId the id of the user
	 * @returns the user's workout history
	 */
	public async getWorkoutHistory(userId: string) {
		const workouts = await this.db.workout.findMany({
			where: { userId }
		});
		return workouts;
	}

	/**
	 * Retrieves a single workout
	 * @param workoutId the id of the workout
	 * @returns the workout
	 */
	public async getWorkoutHistoryItem(workoutId: string) {
		const workout = await this.db.workout.findUnique({
			where: { id: workoutId }
		});
		return workout;
	}

	/**
	 * Retrieves a user's workout history for a specific period.
	 * Method source: https://www.basedash.com/blog/how-to-filter-on-date-ranges-in-prisma
	 * @param userId the id of the user
	 * @param frequency the frequency of the period
	 * @param unit the unit of the period
	 * @returns the user's workout history for the period
	 */
	public async getVolume(userId: string, frequency: string, unit: 'kilos' | 'pounds') {
		const earliestDate = new Date();
		switch (frequency) {
			case 'weekly':
				earliestDate.setDate(earliestDate.getDate() - 7);
				break;
			case 'fortnightly':
				earliestDate.setDate(earliestDate.getDate() - 14);
				break;
			case 'monthly':
				earliestDate.setDate(earliestDate.getDate() - 30);
				break;
			case 'quarterly':
				earliestDate.setDate(earliestDate.getDate() - 90);
				break;
			case 'yearly':
				earliestDate.setDate(earliestDate.getDate() - 365);
				break;
			default:
				return null;
		}

		const workoutsForPeriod = await this.db.workout.findMany({
			where: {
				userId,
				created: {
					gte: earliestDate
				}
			}
		});

		const volumeForPeriod = workoutsForPeriod.map(workout => {
			const workoutVolume = workout.exercises.reduce((exerciseTotal, exercise) => {
				const exerciseVolume = exercise.sets.reduce((setTotal, set) => {
					// weight is stored as kilos in the database
					const weight = unit === 'pounds' ? kilosToPounds(set.weight) : set.weight;
					return setTotal + weight * set.reps;
				}, 0);
				return exerciseTotal + exerciseVolume;
			}, 0);

			return {
				date: workout.created,
				volume: workoutVolume
			};
		});

		return volumeForPeriod;
	}

	/**
	 * Retrieves a user's split usages
	 * @param userId the id of the user
	 * @returns the user's split usages
	 */
	public async getSplitUsages(userId: string) {
		const templateWorkouts = await this.db.workout.findMany({
			where: {
				userId
			}
		});

		// using Record to specify key-value pairs
		// source: https://stackoverflow.com/a/58085320
		const templateIdCounts = templateWorkouts.reduce<Record<string, number>>((acc, workout) => {
			const key = workout.templateId ?? 'null';
			acc[key] = (acc[key] || 0) + 1;
			return acc;
		}, {});

		const templateIdCountArray = Object.entries(templateIdCounts).map(([templateId, count]) => {
			return {
				templateId: templateId === 'null' ? null : templateId,
				count
			};
		});

		return templateIdCountArray as {
			templateId: string | null;
			count: number;
		}[];
	}

	/**
	 * Retrieves a list of workouts by exercise IDs
	 * @param exerciseIds the list of exercise IDs
	 * @returns the list of workouts
	 */
	public async getWorkoutsByExerciseIds(exerciseIds: string[]) {
		const workouts = await this.db.workout.findMany({
			where: {
				exercises: {
					some: {
						id: {
							in: exerciseIds
						}
					}
				}
			}
		});

		// exclude exercises that are not in the list of IDs
		workouts.forEach(workout => {
			workout.exercises = workout.exercises.filter(exercise => exerciseIds.includes(exercise.id));
		});

		return workouts;
	}
}

export default WorkoutOperations;
