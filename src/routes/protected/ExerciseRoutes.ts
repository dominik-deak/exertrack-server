import { Request, Response } from 'express';
import BaseRoute from '../BaseRoute';

class ExerciseRoutes extends BaseRoute {
	public path = '/api/users';

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

export default ExerciseRoutes;
