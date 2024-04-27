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
const ExerciseOperations_1 = __importDefault(require("../../db/ExerciseOperations"));
const WorkoutOperations_1 = __importDefault(require("../../db/WorkoutOperations"));
const AuthService_1 = __importDefault(require("../../middleware/AuthService"));
const PerformancePredictor_1 = __importDefault(require("../../util/PerformancePredictor"));
const BaseRoute_1 = __importDefault(require("../BaseRoute"));
/**
 * Exercise routes
 */
class ExerciseRoutes extends BaseRoute_1.default {
    constructor() {
        super();
        this.exerOps = ExerciseOperations_1.default.getInstance();
        this.workoutOps = WorkoutOperations_1.default.getInstance();
        this.path = '/exercises';
        this.initialiseRoutes();
    }
    /**
     * @returns ExerciseRoutes instance
     */
    static getInstance() {
        if (!ExerciseRoutes.instance) {
            ExerciseRoutes.instance = new ExerciseRoutes();
        }
        return ExerciseRoutes.instance;
    }
    configureRoutes() {
        this.router.use(AuthService_1.default.verifyToken); // Applies middleware to all routes
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
    getAllExercises(req, res) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
            if (!userId) {
                return res.status(403).json({ error: "Can't get user ID from request" });
            }
            try {
                const defaultExercises = yield this.exerOps.getDefaultExercises();
                const userExercises = yield this.exerOps.getUserExercises(userId);
                res.status(200).json({
                    defaultExercises: defaultExercises,
                    userExercises: userExercises
                });
            }
            catch (err) {
                console.error('Error getting exercises:', err);
                res.status(500).json({ error: 'Failed to get exercises' });
            }
        });
    }
    /**
     * Retrieve all body parts from across all exercises
     * using the exercise operations repository class
     * @param _req request object (currently unused)
     * @param res response object
     */
    getBodyParts(_req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const bodyparts = yield this.exerOps.getBodyparts();
                res.status(200).json({ bodyparts });
            }
            catch (err) {
                console.error('Error getting body parts:', err);
                res.status(500).json({ error: 'Failed to get body parts' });
            }
        });
    }
    /**
     * Retrieve all equipment types from across all exercises
     * using the exercise operations repository class
     * @param _req request object (currently unused)
     * @param res response object
     */
    getEquipmentTypes(_req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const equipmentTypes = yield this.exerOps.getEquipmentTypes();
                res.status(200).json({ equipmentTypes });
            }
            catch (err) {
                console.error('Error getting equipment types:', err);
                res.status(500).json({ error: 'Failed to get equipment types' });
            }
        });
    }
    /**
     * Retrieve all user created exercises
     * using the exercise operations repository class
     * @param req request object
     * @param res response object
     */
    getUserExercises(req, res) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
            if (!userId) {
                return res.status(403).json({ error: "Can't get user ID from request" });
            }
            try {
                const userExercises = yield this.exerOps.getUserExercises(userId);
                res.status(200).json({ userExercises });
            }
            catch (err) {
                console.error('Error getting user exercises:', err);
                res.status(500).json({ error: 'Failed to get user exercises' });
            }
        });
    }
    /**
     * Retrieve single exercise
     * using the exercise operations repository class
     * @param req request object
     * @param res response object
     */
    getExercise(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { exerciseId } = req.params;
            if (!exerciseId) {
                return res.status(403).json({ error: "Can't get exercise ID from request" });
            }
            try {
                const exercise = yield this.exerOps.getExerciseById(exerciseId);
                res.status(200).json({ exercise });
            }
            catch (err) {
                console.error('Error getting exercise:', err);
                res.status(500).json({ error: 'Failed to get exercise' });
            }
        });
    }
    /**
     * Retrieve predictions for the next best action for an exercise.
     * This is based on the previous best sets for each exercise.
     * Uses the workout operations repository class.
     * @param req request object
     * @param res response object
     */
    getExercisePredictions(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { exerciseId } = req.params;
            if (!exerciseId) {
                return res.status(403).json({ error: "Can't get exercise ID from request" });
            }
            try {
                const workouts = yield this.workoutOps.getWorkoutsByExerciseIds([exerciseId]);
                const firstSetsMap = {};
                const previousBestSets = {};
                previousBestSets[exerciseId] = null;
                workouts.forEach(workout => {
                    workout.exercises.forEach(exercise => {
                        var _a;
                        if (!firstSetsMap[exercise.id]) {
                            firstSetsMap[exercise.id] = [];
                        }
                        const firstSet = (_a = workout.exercises.find(e => e.id === exercise.id)) === null || _a === void 0 ? void 0 : _a.sets[0];
                        if (firstSet) {
                            firstSetsMap[exercise.id].push({
                                weight: firstSet.weight,
                                reps: firstSet.reps
                            });
                            previousBestSets[exercise.id] = { weight: firstSet.weight, reps: firstSet.reps };
                        }
                    });
                });
                // determine if predictions can be made or use default prediction
                const defaultPrediction = 'increase weight';
                const predictions = {};
                predictions[exerciseId] = defaultPrediction;
                if (workouts.length >= 2) {
                    const predictor = yield PerformancePredictor_1.default.create();
                    const predictionResults = yield Promise.all(Object.entries(firstSetsMap).map(([exerciseId, sets]) => __awaiter(this, void 0, void 0, function* () {
                        if (sets.length >= 2) {
                            const prediction = yield predictor.predict(sets);
                            return { exerciseId, prediction: prediction[prediction.length - 1] };
                        }
                        return { exerciseId, prediction: defaultPrediction }; // maintain default if not enough data
                    })));
                    predictionResults.forEach(({ exerciseId, prediction }) => {
                        predictions[exerciseId] = prediction;
                    });
                }
                // console.log('Predictions:', predictions);
                res.status(200).json({ predictions: predictions, previousBestSets: previousBestSets });
            }
            catch (err) {
                console.error('Error getting exercise predictions:', err);
                res.status(500).json({ error: 'Failed to get exercise predictions' });
            }
        });
    }
    /**
     * Create a new exercise using the exercise operations repository class
     * @param req request object
     * @param res response object
     */
    createExercise(req, res) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const submission = req.body.exerciseSubmission;
            const { name, bodypart, type } = submission;
            if (!name || !bodypart || !type) {
                return res.status(403).json({ error: 'Missing required field(s)' });
            }
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
            if (!userId) {
                return res.status(403).json({ error: "Can't get user ID from request" });
            }
            try {
                const newExercise = yield this.exerOps.createExercise(userId, name, bodypart, type);
                res.status(200).json({ exercise: newExercise });
            }
            catch (err) {
                console.error('Creating exercise error:', err);
                res.status(500).json({ error: 'Failed to create exercise' });
            }
        });
    }
    /**
     * Update an exercise using the exercise operations repository class
     * @param req request object
     * @param res response object
     */
    updateExercise(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { exerciseId } = req.params;
            if (!exerciseId) {
                return res.status(403).json({ error: "Can't get exercise ID from request" });
            }
            const exercise = req.body.exercise;
            if (!exerciseId || !exercise) {
                return res.status(403).json({ error: 'Missing required field(s)' });
            }
            try {
                const updatedExercise = yield this.exerOps.updateExercise(exerciseId, exercise);
                res.status(200).json({ exercise: updatedExercise });
            }
            catch (err) {
                console.error('Updating exercise error:', err);
                res.status(500).json({ error: 'Failed to update exercise' });
            }
        });
    }
    /**
     * Delete an exercise using the exercise operations repository class
     * @param req request object
     * @param res response object
     */
    deleteExercise(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { exerciseId } = req.params;
            if (!exerciseId) {
                return res.status(403).json({ error: "Can't get exercise ID from request" });
            }
            try {
                yield this.exerOps.deleteExercise(exerciseId);
                res.status(200).json({ message: 'Exercise deleted successfully' });
            }
            catch (err) {
                console.error('Deleting exercise error:', err);
                res.status(500).json({ error: 'Failed to delete exercise' });
            }
        });
    }
}
exports.default = ExerciseRoutes;
