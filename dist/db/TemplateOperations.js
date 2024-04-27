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
 * Template database operations repository class
 */
class TemplateOperations {
    constructor() {
        this.db = Database_1.default.getInstance();
    }
    /**
     * @returns TemplateOperations instance
     */
    static getInstance() {
        if (!TemplateOperations.instance) {
            TemplateOperations.instance = new TemplateOperations();
        }
        return TemplateOperations.instance;
    }
    /**
     * Retrieves all default templates (where userId is null)
     * @returns the default templates
     */
    getDefaultTemplates() {
        return __awaiter(this, void 0, void 0, function* () {
            const templates = yield this.db.template.findMany({
                where: {
                    OR: [{ userId: null }, { userId: { isSet: false } }]
                }
            });
            return templates;
        });
    }
    /**
     * Retrieves all user created templates
     * @param userId the id of the user who created the templates
     * @returns the user created templates
     */
    getUserTemplates(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const templates = yield this.db.template.findMany({
                where: { userId }
            });
            return templates;
        });
    }
    /**
     * Retrieves a template with its exercises
     * @param templateId the id of the template
     * @returns the template with its exercises
     */
    getTemplateWithExercises(templateId) {
        return __awaiter(this, void 0, void 0, function* () {
            const template = yield this.db.template.findUnique({
                where: { id: templateId }
            });
            if (!template) {
                return null;
            }
            if (template.exercises && template.exercises.length > 0) {
                // multiple asynchronous operations aggregation source:
                // https://www.javascripttutorial.net/es6/javascript-promise-all/
                const exercisesWithDetails = yield Promise.all(template.exercises.map((templateExercise) => __awaiter(this, void 0, void 0, function* () {
                    const exerciseDetail = yield this.db.exercise.findUnique({
                        where: { id: templateExercise.id },
                        select: {
                            id: false, // not including `id` because `template.exercises` already has `id`
                            name: true,
                            bodypart: true,
                            type: true,
                            userId: true,
                            created: true,
                            updated: true
                        }
                    });
                    // if everything works properly, this should never be null
                    if (!exerciseDetail) {
                        console.error(`Could not find exercise "${templateExercise.id}" in template "${template.name}"`);
                        return null;
                    }
                    return Object.assign(Object.assign({}, exerciseDetail), templateExercise);
                })));
                // filter out any nulls if an exercise detail was missing
                // but once again, none of them should be null if everything works properly
                const filteredExercises = exercisesWithDetails.filter(exercise => exercise !== null);
                return Object.assign(Object.assign({}, template), { exercises: filteredExercises });
            }
            return Object.assign(Object.assign({}, template), { exercises: [] });
        });
    }
    /**
     * Retrieves the name of a template
     * @param templateId the id of the template
     * @returns the name of the template
     */
    getTemplateName(templateId) {
        return __awaiter(this, void 0, void 0, function* () {
            const template = yield this.db.template.findUnique({
                where: { id: templateId },
                select: { name: true }
            });
            // if a valid template ID is provided, there should always be a template record
            if (!template) {
                return null;
            }
            return template.name;
        });
    }
    /**
     * Creates a new template in the database
     * @param userId the id of the user who created the template
     * @param name the name of the template
     * @param exercises the exercises of the template
     * @returns the created template
     */
    createTemplate(userId, name, exercises) {
        return __awaiter(this, void 0, void 0, function* () {
            const newTemplate = yield this.db.template.create({
                data: {
                    name,
                    userId,
                    exercises
                }
            });
            return newTemplate;
        });
    }
    /**
     * Updates a template in the database
     * @param templateId the id of the template
     * @param name the name of the template
     * @param exercises the exercises of the template
     * @returns the updated template
     */
    updateTemplate(templateId, name, exercises) {
        return __awaiter(this, void 0, void 0, function* () {
            const updatedTemplate = yield this.db.template.update({
                where: { id: templateId },
                data: {
                    name,
                    exercises
                }
            });
            return updatedTemplate;
        });
    }
    /**
     * Deletes a template from the database
     * @param templateId the id of the template to delete
     */
    deleteTemplate(templateId) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.db.template.delete({
                where: { id: templateId }
            });
        });
    }
}
exports.default = TemplateOperations;
