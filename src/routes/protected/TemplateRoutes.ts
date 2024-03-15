import { Request, Response } from 'express';
import BaseRoute from '../BaseRoute';

class TemplateRoutes extends BaseRoute {
	private static instance: TemplateRoutes;
	public path = '/api/users';

	private constructor() {
		super();
		this.initialiseRoutes();
	}

	public static getInstance(): TemplateRoutes {
		if (!TemplateRoutes.instance) {
			TemplateRoutes.instance = new TemplateRoutes();
		}

		return TemplateRoutes.instance;
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

export default TemplateRoutes;
