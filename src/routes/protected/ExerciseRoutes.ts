import { Request, Response } from 'express';
import BaseRoute from '../BaseRoute';

class ExerciseRoutes extends BaseRoute {
	private static instance: ExerciseRoutes;
	public path = '/api/users';

	private constructor() {
		super();
		this.initialiseRoutes();
	}

	public static getInstance(): ExerciseRoutes {
		if (!ExerciseRoutes.instance) {
			ExerciseRoutes.instance = new ExerciseRoutes();
		}

		return ExerciseRoutes.instance;
	}

	public configureRoutes(): void {
		this.router.get('/', this.getUsers);
		this.router.get('/:id', this.getUserById);
	}

	private getUsers(_: Request, res: Response): void {
		res.send('List of users');
	}

	private getUserById(req: Request, res: Response): void {
		res.send(`User with ID ${req.params.id}`);
	}
}

export default ExerciseRoutes;
