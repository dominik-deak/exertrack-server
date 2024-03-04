import bcrypt from 'bcrypt';
import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import DBOperations from '../db/DBOperations';
import BaseRoute from './BaseRoute';

class AuthRoutes extends BaseRoute {
	private db = DBOperations.getInstance();
	public path = '/auth';

	public configureRoutes(): void {
		this.router.post('/register', this.register);
		this.router.post('/login', this.login);
	}

	async register(req: Request, res: Response) {
		const { email, password } = req.body;
		const hashedPassword = await bcrypt.hash(password, 10);
		try {
			const userId = await this.db.createUser(email, hashedPassword);
			res.status(201).json({ message: 'You have registered successfully', userId: userId });
		} catch (error) {
			res.status(400).json({ error: 'Error registering' });
		}
	}

	async login(req: Request, res: Response) {
		const { email, password } = req.body;
		try {
			const user = await this.db.getUser(email);
			if (!user) {
				return res.status(404).json({ error: 'User not found' });
			}
			const isPasswordValid = await bcrypt.compare(password, user.password);
			if (!isPasswordValid) {
				return res.status(401).json({ error: 'Invalid password' });
			}

			const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET as string, { expiresIn: '30d' });
			res.json({ token });
		} catch (error) {
			res.status(400).json({ error: 'Error logging in' });
		}
	}
}

export default AuthRoutes;
