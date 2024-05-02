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
const convertWeight_1 = require("../util/convertWeight");
const Database_1 = __importDefault(require("./Database"));
/**
 * Workout database operations repository class
 */
class WorkoutOperations {
    constructor() {
        this.db = Database_1.default.getInstance();
    }
    /**
     * @returns WorkoutOperations instance
     */
    static getInstance() {
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
    createWorkout(userId, templateId, duration, exercises) {
        return __awaiter(this, void 0, void 0, function* () {
            const workout = yield this.db.workout.create({
                data: {
                    userId,
                    templateId,
                    duration,
                    exercises
                }
            });
            return workout;
        });
    }
    /**
     * Retrieves a user's workout history
     * @param userId the id of the user
     * @returns the user's workout history
     */
    getWorkoutHistory(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const workouts = yield this.db.workout.findMany({
                where: { userId: userId }
            });
            return workouts;
        });
    }
    /**
     * Retrieves a single workout
     * @param workoutId the id of the workout
     * @returns the workout
     */
    getWorkoutHistoryItem(workoutId) {
        return __awaiter(this, void 0, void 0, function* () {
            const workout = yield this.db.workout.findUnique({
                where: { id: workoutId }
            });
            return workout;
        });
    }
    /**
     * Retrieves a user's workout history for a specific period.
     * Method source: https://www.basedash.com/blog/how-to-filter-on-date-ranges-in-prisma
     * @param userId the id of the user
     * @param frequency the frequency of the period
     * @param unit the unit of the period
     * @returns the user's workout history for the period
     */
    getVolume(userId, frequency, unit) {
        return __awaiter(this, void 0, void 0, function* () {
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
            const workoutsForPeriod = yield this.db.workout.findMany({
                where: {
                    userId: userId,
                    created: { gte: earliestDate }
                }
            });
            const volumeForPeriod = workoutsForPeriod.map(workout => {
                const workoutVolume = workout.exercises.reduce((exerciseTotal, exercise) => {
                    const exerciseVolume = exercise.sets.reduce((setTotal, set) => {
                        // weight is stored as kilos in the database
                        const weight = unit === 'pounds' ? (0, convertWeight_1.kilosToPounds)(set.weight) : set.weight;
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
        });
    }
    /**
     * Retrieves a user's split usages
     * @param userId the id of the user
     * @returns the user's split usages
     */
    getSplitUsages(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const templateWorkouts = yield this.db.workout.findMany({
                where: { userId: userId }
            });
            // using Record to specify key-value pairs
            // source: https://stackoverflow.com/a/58085320
            const templateIdCounts = templateWorkouts.reduce((acc, workout) => {
                var _a;
                const key = (_a = workout.templateId) !== null && _a !== void 0 ? _a : 'null';
                acc[key] = (acc[key] || 0) + 1;
                return acc;
            }, {});
            const templateIdCountArray = Object.entries(templateIdCounts).map(([templateId, count]) => {
                return {
                    templateId: templateId === 'null' ? null : templateId,
                    count
                };
            });
            return templateIdCountArray;
        });
    }
    /**
     * Retrieves a list of workouts by exercise IDs, for a specific user
     * @param exerciseIds the list of exercise IDs
     * @returns the list of workouts
     */
    getUserWorkoutsByExerciseIds(userId, exerciseIds) {
        return __awaiter(this, void 0, void 0, function* () {
            const workouts = yield this.db.workout.findMany({
                where: {
                    userId: userId,
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
        });
    }
}
exports.default = WorkoutOperations;
