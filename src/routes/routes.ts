import AuthRoutes from './AuthRoutes';
import ExerciseRoutes from './protected/ExerciseRoutes';
import TemplateRoutes from './protected/TemplateRoutes';
import UserRoutes from './protected/UserRoutes';
import WorkoutRoutes from './protected/WorkoutRoutes';

/**
 * Array of all routes in the application
 */
const routes = [
	AuthRoutes.getInstance(),
	UserRoutes.getInstance(),
	WorkoutRoutes.getInstance(),
	TemplateRoutes.getInstance(),
	ExerciseRoutes.getInstance()
];

export default routes;
