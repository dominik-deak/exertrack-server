import { Request, Response } from 'express';
import BaseRoute from '../BaseRoute';

class WorkoutRoutes extends BaseRoute {
	private static instance: WorkoutRoutes;
	public path = '/api/users';

	private constructor() {
		super();
		this.initialiseRoutes();
	}

	public static getInstance(): WorkoutRoutes {
		if (!WorkoutRoutes.instance) {
			WorkoutRoutes.instance = new WorkoutRoutes();
		}

		return WorkoutRoutes.instance;
	}

	public configureRoutes(): void {
		this.router.get('/', this.getUsers);
		this.router.get('/:id', this.getUserById);
	}

	getUsers(_: Request, res: Response): void {
		res.send('List of users');
	}

	getUserById(req: Request, res: Response): void {
		res.send(`User with ID ${req.params.id}`);
	}
}

export default WorkoutRoutes;
