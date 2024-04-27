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

	/**
	 * Configure all routes and add any middleware.
	 * `.bind` needed to preserve `this.{function}` working properly.
	 * Method source: https://www.w3schools.com/js/js_function_bind.asp
	 */
	public abstract configureRoutes(): void;

	/**
	 * Initialise the configured routes
	 */
	public initialiseRoutes() {
		this.configureRoutes();
	}

	/**
	 * Add routes to express application
	 * @param app express application
	 */
	public addTo(app: Application) {
		app.use(this.path, this.router);
	}
}

export default BaseRoute;
