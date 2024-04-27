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
const TemplateOperations_1 = __importDefault(require("../../db/TemplateOperations"));
const WorkoutOperations_1 = __importDefault(require("../../db/WorkoutOperations"));
const AuthService_1 = __importDefault(require("../../middleware/AuthService"));
const BaseRoute_1 = __importDefault(require("../BaseRoute"));
/**
 * Workout routes
 */
class WorkoutRoutes extends BaseRoute_1.default {
    constructor() {
        super();
        this.workoutOps = WorkoutOperations_1.default.getInstance();
        this.tempOps = TemplateOperations_1.default.getInstance();
        this.exerOps = ExerciseOperations_1.default.getInstance();
        this.path = '/workout';
        this.initialiseRoutes();
    }
    /**
     * @returns WorkoutRoutes instance
     */
    static getInstance() {
        if (!WorkoutRoutes.instance) {
            WorkoutRoutes.instance = new WorkoutRoutes();
        }
        return WorkoutRoutes.instance;
    }
    configureRoutes() {
        this.router.use(AuthService_1.default.verifyToken); // Applies middleware to all routes
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
    completeWorkout(req, res) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const workoutSubmission = req.body.workoutSubmission;
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
            if (!userId) {
                return res.status(403).json({ error: "Can't get user ID from request" });
            }
            try {
                const convertedExercises = workoutSubmission.exercises
                    // remove exercises where every set is blank
                    .filter(exercise => exercise.sets.some(set => set.weight !== 0 && set.reps !== 0))
                    .map((exercise) => ({
                    id: exercise.id,
                    sets: exercise.sets
                        // remove blank sets
                        .filter(set => !(set.weight === 0 && set.reps === 0))
                        .map((set) => ({
                        weight: Number(set.weight),
                        reps: Number(set.reps)
                    }))
                }));
                yield this.workoutOps.createWorkout(userId, workoutSubmission.templateId, workoutSubmission.duration, convertedExercises);
                res.status(201).json({ message: 'Workout created successfully' });
            }
            catch (err) {
                console.error('Error creating workout:', err);
                res.status(500).json({ error: 'Failed to create workout' });
            }
        });
    }
    /**
     * Get all of the user's workout history using the workout operations repository class
     * @param req request object
     * @param res response object
     */
    getWorkoutHistory(req, res) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
            if (!userId) {
                return res.status(403).json({ error: "Can't get user ID from request" });
            }
            try {
                let workoutHistory = yield this.workoutOps.getWorkoutHistory(userId);
                // adding template name to workout objects for convenience on the client
                workoutHistory = yield Promise.all(workoutHistory.map((item) => __awaiter(this, void 0, void 0, function* () {
                    const templateName = item.templateId ? yield this.tempOps.getTemplateName(item.templateId) : null;
                    return Object.assign(Object.assign({}, item), { templateName });
                })));
                res.status(200).json({ workoutHistory });
            }
            catch (err) {
                console.error('Error getting workout history:', err);
                res.status(500).json({ error: 'Failed to get workout history' });
            }
        });
    }
    /**
     * Get a single workout using the workout operations repository class
     * @param req request object
     * @param res response object
     */
    getWorkoutHistoryItem(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { workoutId } = req.params;
            if (!workoutId) {
                return res.status(403).json({ error: "Can't get workout ID from request" });
            }
            try {
                let workoutHistoryItem = (yield this.workoutOps.getWorkoutHistoryItem(workoutId));
                if (workoutHistoryItem) {
                    const exercisesWithDetails = yield Promise.all(workoutHistoryItem.exercises.map((exercise) => __awaiter(this, void 0, void 0, function* () {
                        const exerciseDetail = yield this.exerOps.getExerciseById(exercise.id);
                        return Object.assign(Object.assign({}, exercise), exerciseDetail);
                    })));
                    workoutHistoryItem.exercises = exercisesWithDetails;
                    if (workoutHistoryItem.templateId) {
                        const templateName = yield this.tempOps.getTemplateName(workoutHistoryItem.templateId);
                        workoutHistoryItem.templateName = templateName;
                        delete workoutHistoryItem.templateId;
                    }
                }
                res.status(200).json({ workoutHistoryItem });
            }
            catch (err) {
                console.error('Error getting workout:', err);
                res.status(500).json({ error: 'Failed to get workout history' });
            }
        });
    }
    /**
     * Get the user's total workout volume using the workout operations repository class
     * @param req request object
     * @param res response object
     */
    getVolume(req, res) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const { frequency, unit } = req.params;
            if (!frequency || !unit) {
                return res.status(403).json({ error: "Can't get frequency or unit from request" });
            }
            const isValidUnit = unit === 'kilos' || unit === 'pounds';
            if (!isValidUnit) {
                return res.status(400).json({ error: 'Unit must be "kilos" or "pounds"' });
            }
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
            if (!userId) {
                return res.status(403).json({ error: "Can't get user ID from request" });
            }
            try {
                const volume = yield this.workoutOps.getVolume(userId, frequency, unit);
                if (volume === null) {
                    return res.status(403).json({ error: 'Invalid frequency specified' });
                }
                res.status(200).json({ volume });
            }
            catch (err) {
                console.error('Error getting volume:', err);
                res.status(500).json({ error: 'Failed to get volume' });
            }
        });
    }
    /**
     * Get the user's split usages using the workout operations repository class
     * @param req request object
     * @param res response object
     */
    getSplitUsages(req, res) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
            if (!userId) {
                return res.status(403).json({ error: "Can't get user ID from request" });
            }
            try {
                const splitUsages = yield this.workoutOps.getSplitUsages(userId);
                const splitUsagesWithNames = yield Promise.all(splitUsages.map((usage) => __awaiter(this, void 0, void 0, function* () {
                    if (usage.templateId) {
                        const templateName = yield this.tempOps.getTemplateName(usage.templateId);
                        return {
                            templateName,
                            count: usage.count
                        };
                    }
                    else {
                        return {
                            templateName: null,
                            count: usage.count
                        };
                    }
                })));
                res.status(200).json({ splitUsages: splitUsagesWithNames });
            }
            catch (err) {
                console.error('Error getting split usage:', err);
                res.status(500).json({ error: 'Failed to get split usage' });
            }
        });
    }
}
exports.default = WorkoutRoutes;
