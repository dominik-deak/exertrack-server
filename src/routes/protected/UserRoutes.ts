import { Request, Response } from 'express';
import AuthService from '../../AuthService';
import BaseRoute from '../BaseRoute';

class UserRoutes extends BaseRoute {
	public path = '/api/users';

	public configureRoutes(): void {
		this.router.get('/', AuthService.verifyToken, this.getUsers);
		this.router.get('/:id', AuthService.verifyToken, this.getUserById);
	}

	getUsers(_: Request, res: Response): void {
		res.send('List of users');
	}

	getUserById(req: Request, res: Response): void {
		res.send(`User with ID ${req.params.id}`);
	}
}

export default UserRoutes;
