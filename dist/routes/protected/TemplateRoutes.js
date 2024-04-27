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
const TemplateOperations_1 = __importDefault(require("../../db/TemplateOperations"));
const WorkoutOperations_1 = __importDefault(require("../../db/WorkoutOperations"));
const AuthService_1 = __importDefault(require("../../middleware/AuthService"));
const PerformancePredictor_1 = __importDefault(require("../../util/PerformancePredictor"));
const BaseRoute_1 = __importDefault(require("../BaseRoute"));
/**
 * Template routes
 */
class TemplateRoutes extends BaseRoute_1.default {
    constructor() {
        super();
        this.tempOps = TemplateOperations_1.default.getInstance();
        this.workoutOps = WorkoutOperations_1.default.getInstance();
        this.path = '/templates';
        this.initialiseRoutes();
    }
    /**
     * @returns TemplateRoutes instance
     */
    static getInstance() {
        if (!TemplateRoutes.instance) {
            TemplateRoutes.instance = new TemplateRoutes();
        }
        return TemplateRoutes.instance;
    }
    configureRoutes() {
        this.router.use(AuthService_1.default.verifyToken); // Applies middleware to all routes
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
    getAllTemplates(req, res) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
            if (!userId) {
                return res.status(403).json({ error: "Can't get user ID from request" });
            }
            try {
                const defaultTemplates = yield this.tempOps.getDefaultTemplates();
                const userTemplates = yield this.tempOps.getUserTemplates(userId);
                res.status(200).json({
                    defaultTemplates: defaultTemplates,
                    userTemplates: userTemplates
                });
            }
            catch (err) {
                console.error('Getting templates error:', err);
                res.status(500).json({ error: 'Failed to get templates' });
            }
        });
    }
    /**
     * Get a single template with associated exercises
     * using the template operations repository class
     * @param req request object
     * @param res response object
     */
    getSingleTemplate(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { templateId } = req.params;
            if (!templateId) {
                return res.status(403).json({ error: "Can't get template ID from request" });
            }
            try {
                const templateWithExercises = yield this.tempOps.getTemplateWithExercises(templateId);
                if (!templateWithExercises) {
                    return res.status(404).json({ error: "Can't find template" });
                }
                res.status(200).json({ template: templateWithExercises });
            }
            catch (err) {
                console.error('Getting templates error:', err);
                res.status(500).json({ error: 'Failed to get templates' });
            }
        });
    }
    /**
     * Retrieve predictions for the next best action for all exercises in a template.
     * This is based on the previous best sets for each exercise.
     * Uses the workout operations repository class.
     * @param req request object
     * @param res response object
     */
    getTemplatePredictions(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { templateId } = req.params;
            if (!templateId) {
                return res.status(403).json({ error: "Can't get template ID from request" });
            }
            try {
                const templateWithExercises = yield this.tempOps.getTemplateWithExercises(templateId);
                if (!templateWithExercises) {
                    return res.status(404).json({ error: "Can't find template" });
                }
                const exerciseIds = templateWithExercises.exercises.map(exercise => exercise.id);
                const workouts = yield this.workoutOps.getWorkoutsByExerciseIds(exerciseIds);
                workouts.sort((a, b) => a.created.getTime() - b.created.getTime());
                const firstSetsMap = {};
                const defaultPredictions = {};
                const previousBestSets = {};
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
                const predictor = yield PerformancePredictor_1.default.create();
                const predictions = Object.assign({}, defaultPredictions);
                yield Promise.all(Object.entries(firstSetsMap).map(([exerciseId, sets]) => __awaiter(this, void 0, void 0, function* () {
                    if (sets.length >= 2) {
                        const prediction = yield predictor.predict(sets);
                        predictions[exerciseId] = prediction[prediction.length - 1];
                    }
                })));
                // console.log('Predictions:', predictions);
                res.status(200).json({ predictions, previousBestSets });
            }
            catch (err) {
                console.error('Getting template predictions error:', err);
                res.status(500).json({ error: 'Failed to get template predictions' });
            }
        });
    }
    /**
     * Get all user templates using the template operations repository class
     * @param req request object
     * @param res response object
     */
    getUserTemplates(req, res) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
            if (!userId) {
                return res.status(403).json({ error: "Can't get user ID from request" });
            }
            try {
                const userTemplates = yield this.tempOps.getUserTemplates(userId);
                res.status(200).json({ userTemplates });
            }
            catch (err) {
                console.error('Getting templates error:', err);
                res.status(500).json({ error: 'Failed to get templates' });
            }
        });
    }
    /**
     * Create a new template using the template operations repository class
     * @param req request object
     * @param res response object
     */
    createTemplate(req, res) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const templateSubmission = req.body.templateSubmission;
            const { name, exercises } = templateSubmission;
            if (!name || !exercises) {
                return res.status(403).json({ error: 'Missing required field(s)' });
            }
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
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
                const newTemplate = yield this.tempOps.createTemplate(userId, name, filteredExercises);
                res.status(200).json({ template: newTemplate });
            }
            catch (err) {
                console.error('Creating template error:', err);
                res.status(500).json({ error: 'Failed to create template' });
            }
        });
    }
    /**
     * Update an existing template using the template operations repository class
     * @param req request object
     * @param res response object
     */
    updateTemplate(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { templateId } = req.params;
            if (!templateId) {
                return res.status(403).json({ error: "Can't get template ID from request" });
            }
            const template = req.body.template;
            const { name, exercises } = template;
            const filteredExercises = exercises.map(exercise => ({
                id: exercise.id,
                sets: exercise.sets,
                repsMin: exercise.repsMin,
                repsMax: exercise.repsMax
            }));
            try {
                const updatedTemplate = yield this.tempOps.updateTemplate(templateId, name, filteredExercises);
                res.status(200).json({ template: updatedTemplate });
            }
            catch (err) {
                console.error('Updating template error:', err);
                res.status(500).json({ error: 'Failed to update template' });
            }
        });
    }
    /**
     * Delete a template using the template operations repository class
     * @param req request object
     * @param res response object
     */
    deleteTemplate(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { templateId } = req.params;
            if (!templateId) {
                return res.status(403).json({ error: "Can't get template ID from request" });
            }
            try {
                if (!templateId) {
                    return res.status(403).json({ error: "Can't get template ID from request" });
                }
                yield this.tempOps.deleteTemplate(templateId);
                res.status(200).json({ message: 'Template deleted successfully' });
            }
            catch (err) {
                console.error('Deleting template error:', err);
                res.status(500).json({ error: 'Failed to delete template' });
            }
        });
    }
}
exports.default = TemplateRoutes;
