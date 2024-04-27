"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const AuthRoutes_1 = __importDefault(require("./AuthRoutes"));
const ExerciseRoutes_1 = __importDefault(require("./protected/ExerciseRoutes"));
const TemplateRoutes_1 = __importDefault(require("./protected/TemplateRoutes"));
const UserRoutes_1 = __importDefault(require("./protected/UserRoutes"));
const WorkoutRoutes_1 = __importDefault(require("./protected/WorkoutRoutes"));
/**
 * Array of all routes in the application
 */
const routes = [
    AuthRoutes_1.default.getInstance(),
    UserRoutes_1.default.getInstance(),
    WorkoutRoutes_1.default.getInstance(),
    TemplateRoutes_1.default.getInstance(),
    ExerciseRoutes_1.default.getInstance()
];
exports.default = routes;
