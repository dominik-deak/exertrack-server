import bcrypt from 'bcrypt';
import { Request, Response } from 'express';
import UserOperations from '../../db/UserOperations';
import AuthService from '../../middleware/AuthService';
import BaseRoute from '../BaseRoute';

/**
 * User routes
 */
class UserRoutes extends BaseRoute {
	private static instance: UserRoutes;
	private userOps = UserOperations.getInstance();
	public path = '/user';

	private constructor() {
		super();
		this.initialiseRoutes();
	}

	/**
	 * @returns UserRoutes instance
	 */
	public static getInstance(): UserRoutes {
		if (!UserRoutes.instance) {
			UserRoutes.instance = new UserRoutes();
		}

		return UserRoutes.instance;
	}

	public configureRoutes() {
		this.router.use(AuthService.verifyToken); // Applies middleware to all routes
		this.router.get('/', this.getUser.bind(this));
		this.router.patch('/name', this.updateUserNames.bind(this));
		this.router.patch('/password', this.updateUserPassword.bind(this));
	}

	/**
	 * Retrieve user details using the user operations repository class
	 * @param req request object
	 * @param res response object
	 */
	private getUser(req: Request, res: Response) {
		if (!req.user) {
			return res.status(403).json({ error: "Can't get user from request" });
		}

		res.status(200).json({
			user: {
				id: req.user.id,
				email: req.user.email,
				firstName: req.user.firstName,
				lastName: req.user.lastName,
				created: req.user.created,
				updated: req.user.updated
			}
		});
	}

	/**
	 * Update the user's first and last name using the user operations repository class
	 * @param req request object
	 * @param res response object
	 */
	private async updateUserNames(req: Request, res: Response) {
		if (!req.user) {
			return res.status(403).json({ error: "Can't get user from request" });
		}
		const { firstName, lastName } = req.body;

		try {
			const newUser = await this.userOps.updateUser(req.user.id, firstName, lastName);
			res.status(200).json({
				message: 'User updated successfully',
				user: {
					id: newUser.id,
					email: newUser.email,
					firstName: newUser.firstName,
					lastName: newUser.lastName,
					created: newUser.created,
					updated: newUser.updated
				}
			});
		} catch (err) {
			console.error('Update User Error:', err);
			res.status(500).json({ error: 'Failed to update user' });
		}
	}

	/**
	 * Update the user's password using the user operations repository class
	 * @param req request object
	 * @param res response object
	 */
	private async updateUserPassword(req: Request, res: Response) {
		if (!req.user) {
			return res.status(403).json({ error: "Can't get user from request" });
		}

		const { currentPassword, newPassword } = req.body;
		if (!currentPassword || !newPassword) {
			return res.status(403).json({ error: 'Missing required field(s)' });
		}

		try {
			const valid = await bcrypt.compare(currentPassword, req.user.password);
			if (!valid) {
				return res.status(401).json({ error: 'Invalid password' });
			}
			if (currentPassword === newPassword) {
				return res.status(409).json({ error: 'New password cannot be the same as current password' });
			}

			const hashedPassword = await bcrypt.hash(newPassword, 10);
			await this.userOps.updateUserPassword(req.user.id, hashedPassword);

			res.status(200).json({ message: 'Password updated successfully' });
		} catch (err) {
			console.error('Update Password Error:', err);
			res.status(500).json({ error: 'Failed to update password' });
		}
	}
}

export default UserRoutes;
