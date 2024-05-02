import { PrismaClient } from '@prisma/client';
import { Exercise } from '../types/Exercise';
import Database from './Database';

/**
 * Exercise database operations repository class
 */
class ExerciseOperations {
	private static instance: ExerciseOperations;
	private db: PrismaClient;

	private constructor() {
		this.db = Database.getInstance();
	}

	/**
	 * @returns ExerciseOperations instance
	 */
	public static getInstance(): ExerciseOperations {
		if (!ExerciseOperations.instance) {
			ExerciseOperations.instance = new ExerciseOperations();
		}
		return ExerciseOperations.instance;
	}

	/**
	 * Retrieve an exercise by id
	 * @param exerciseId the exercise id
	 * @returns the exercise
	 */
	public async getExerciseById(exerciseId: string) {
		const exercise = await this.db.exercise.findUnique({
			where: { id: exerciseId },
			select: {
				id: false,
				name: true,
				bodypart: true,
				type: true,
				userId: true,
				created: true,
				updated: true
			}
		});
		return exercise;
	}

	/**
	 * Retrieve default exercises (where userId is null)
	 * @returns the default exercises
	 */
	public async getDefaultExercises() {
		const exercises = await this.db.exercise.findMany({
			where: {
				OR: [{ userId: null }, { userId: { isSet: false } }]
			}
		});
		return exercises;
	}

	/**
	 * Retrieve user created exercises
	 * @param userId the id of the user who created the exercises
	 * @returns the user created exercises
	 */
	public async getUserExercises(userId: string) {
		const exercises = await this.db.exercise.findMany({
			where: { userId: userId }
		});
		return exercises;
	}

	/**
	 * Retrieve all bodyparts from across all exercises
	 * @returns the bodyparts
	 */
	public async getBodyparts() {
		const exerciseBodyparts = await this.db.exercise.findMany({
			select: { bodypart: true },
			distinct: ['bodypart']
		});
		return exerciseBodyparts.map(ebp => ebp.bodypart);
	}

	/**
	 * Retrieve all equipment types from across all exercises
	 * @returns the equipment types
	 */
	public async getEquipmentTypes() {
		const exerciseEquipmentTypes = await this.db.exercise.findMany({
			select: { type: true },
			distinct: ['type']
		});
		return exerciseEquipmentTypes.map(etc => etc.type);
	}

	/**
	 * Creates a new exercise in the database
	 * @param userId the id of the user who created the exercise
	 * @param name the name of the exercise
	 * @param bodypart the bodypart of the exercise
	 * @param type the equipment type of the exercise
	 * @returns the created exercise
	 */
	public async createExercise(userId: string, name: string, bodypart: string, type: string) {
		const newExercise = await this.db.exercise.create({
			data: {
				name,
				bodypart,
				type,
				userId
			}
		});
		return newExercise;
	}

	/**
	 * Updates an exercise in the database
	 * @param exerciseId the id of the exercise
	 * @param exercise the updated exercise
	 * @returns the updated exercise
	 */
	public async updateExercise(exerciseId: string, exercise: Exercise) {
		const { name, bodypart, type } = exercise;
		const updatedExercise = await this.db.exercise.update({
			where: { id: exerciseId },
			data: {
				name,
				bodypart,
				type
			}
		});
		return updatedExercise;
	}

	/**
	 * Deletes an exercise from the database
	 * @param exerciseId the id of the exercise to delete
	 */
	public async deleteExercise(exerciseId: string) {
		await this.db.exercise.delete({
			where: { id: exerciseId }
		});
	}
}

export default ExerciseOperations;
