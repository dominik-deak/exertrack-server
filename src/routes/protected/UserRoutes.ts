import { Request, Response } from 'express';
import AuthService from '../../middleware/AuthService';
import BaseRoute from '../BaseRoute';

class UserRoutes extends BaseRoute {
	private static instance: UserRoutes;
	public path = '/users';

	private constructor() {
		super();
		this.initialiseRoutes();
	}

	public static getInstance(): UserRoutes {
		if (!UserRoutes.instance) {
			UserRoutes.instance = new UserRoutes();
		}

		return UserRoutes.instance;
	}

	public configureRoutes() {
		this.router.use(AuthService.verifyToken); // Apply the middleware to all user routes
		this.router.get('/', this.getUsers.bind(this));
		this.router.get('/:id', this.getUserById.bind(this));
	}

	getUsers(req: Request, res: Response) {
		if (req.user) {
			res.status(200).json({
				message: 'This is a protected route',
				user: {
					id: req.user.id,
					email: req.user.email,
					firstName: req.user.firstName,
					lastName: req.user.lastName
				}
			});
		} else {
			res.status(404).json({ message: 'User not found' });
		}
	}

	getUserById(req: Request, res: Response) {
		res.send(`User with ID ${req.params.id}`);
	}
}

export default UserRoutes;
