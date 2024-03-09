import { Application, Router } from 'express';

/**
 * Base route to be extended by other routes
 */
abstract class BaseRoute {
	public router: Router;
	public abstract path: string;

	constructor() {
		this.router = Router();
	}

	public abstract configureRoutes(): void;

	public initialiseRoutes() {
		this.configureRoutes();
	}

	public addTo(app: Application) {
		app.use(this.path, this.router);
	}
}

export default BaseRoute;
