"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Database_1 = __importDefault(require("./Database"));
/**
 * Exercise database operations repository class
 */
class ExerciseOperations {
    constructor() {
        this.db = Database_1.default.getInstance();
    }
    /**
     * @returns ExerciseOperations instance
     */
    static getInstance() {
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
    getExerciseById(exerciseId) {
        return __awaiter(this, void 0, void 0, function* () {
            const exercise = yield this.db.exercise.findUnique({
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
        });
    }
    /**
     * Retrieve default exercises (where userId is null)
     * @returns the default exercises
     */
    getDefaultExercises() {
        return __awaiter(this, void 0, void 0, function* () {
            const exercises = yield this.db.exercise.findMany({
                where: {
                    OR: [{ userId: null }, { userId: { isSet: false } }]
                }
            });
            return exercises;
        });
    }
    /**
     * Retrieve user created exercises
     * @param userId the id of the user who created the exercises
     * @returns the user created exercises
     */
    getUserExercises(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const exercises = yield this.db.exercise.findMany({
                where: { userId: userId }
            });
            return exercises;
        });
    }
    /**
     * Retrieve all bodyparts from across all exercises
     * @returns the bodyparts
     */
    getBodyparts() {
        return __awaiter(this, void 0, void 0, function* () {
            const exerciseBodyparts = yield this.db.exercise.findMany({
                select: { bodypart: true },
                distinct: ['bodypart']
            });
            return exerciseBodyparts.map(ebp => ebp.bodypart);
        });
    }
    /**
     * Retrieve all equipment types from across all exercises
     * @returns the equipment types
     */
    getEquipmentTypes() {
        return __awaiter(this, void 0, void 0, function* () {
            const exerciseEquipmentTypes = yield this.db.exercise.findMany({
                select: { type: true },
                distinct: ['type']
            });
            return exerciseEquipmentTypes.map(etc => etc.type);
        });
    }
    /**
     * Creates a new exercise in the database
     * @param userId the id of the user who created the exercise
     * @param name the name of the exercise
     * @param bodypart the bodypart of the exercise
     * @param type the equipment type of the exercise
     * @returns the created exercise
     */
    createExercise(userId, name, bodypart, type) {
        return __awaiter(this, void 0, void 0, function* () {
            const newExercise = yield this.db.exercise.create({
                data: {
                    name,
                    bodypart,
                    type,
                    userId
                }
            });
            return newExercise;
        });
    }
    /**
     * Updates an exercise in the database
     * @param exerciseId the id of the exercise
     * @param exercise the updated exercise
     * @returns the updated exercise
     */
    updateExercise(exerciseId, exercise) {
        return __awaiter(this, void 0, void 0, function* () {
            const { name, bodypart, type } = exercise;
            const updatedExercise = yield this.db.exercise.update({
                where: { id: exerciseId },
                data: {
                    name,
                    bodypart,
                    type
                }
            });
            return updatedExercise;
        });
    }
    /**
     * Deletes an exercise from the database
     * @param exerciseId the id of the exercise to delete
     */
    deleteExercise(exerciseId) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.db.exercise.delete({
                where: { id: exerciseId }
            });
        });
    }
}
exports.default = ExerciseOperations;
