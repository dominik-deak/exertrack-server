import AuthRoutes from './AuthRoutes';
import ExerciseRoutes from './protected/ExerciseRoutes';
import TemplateRoutes from './protected/TemplateRoutes';
import UserRoutes from './protected/UserRoutes';
import WorkoutRoutes from './protected/WorkoutRoutes';

const routes = [new AuthRoutes(), new UserRoutes(), new WorkoutRoutes(), new TemplateRoutes(), new ExerciseRoutes()];

export default routes;
