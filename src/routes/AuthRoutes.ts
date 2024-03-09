import bcrypt from 'bcrypt';
import { Request, Response } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import DBOperations from '../db/DBOperations';
import BaseRoute from './BaseRoute';

class AuthRoutes extends BaseRoute {
	private db = DBOperations.getInstance();
	public path = '/auth';

	constructor() {
		super();
		this.initialiseRoutes();
	}

	public configureRoutes(): void {
		this.router.post('/register', this.register.bind(this));
		this.router.post('/login', this.login.bind(this));
		this.router.post('/token', this.exchangeTokens.bind(this));
		this.router.delete('/logout', this.logout.bind(this));
	}

	private generateAccessToken(userId: string) {
		return jwt.sign({ userId: userId }, process.env.JWT_ACCESS_SECRET as string, { expiresIn: '15m' });
	}

	private generateRefreshToken(userId: string) {
		return jwt.sign({ userId: userId }, process.env.JWT_REFRESH_SECRET as string);
	}

	async register(req: Request, res: Response) {
		const { email, password } = req.body;
		const hashedPassword = await bcrypt.hash(password, 10);

		try {
			await this.db.createUser(email, hashedPassword);
			res.status(201).json({ message: 'You have registered successfully' });
		} catch (err) {
			console.error('Registration Error:', err);
			res.status(500).json({ error: 'Error registering' });
		}
	}

	async login(req: Request, res: Response) {
		const { email, password } = req.body;

		try {
			const user = await this.db.getUserByEmail(email);
			if (!user) {
				return res.status(404).json({ error: 'User not found' });
			}
			const isPasswordValid = await bcrypt.compare(password, user.password);
			if (!isPasswordValid) {
				return res.status(401).json({ error: 'Invalid password' });
			}

			const accessToken = this.generateAccessToken(user.id);
			const refreshToken = this.generateRefreshToken(user.id);

			await this.db.createRefreshToken(refreshToken); // stores refresh token in database
			res.status(200).json({ accessToken: accessToken, refreshToken: refreshToken });
		} catch (err) {
			console.error('Login Error:', err);
			res.status(500).json({ error: 'Error logging in' });
		}
	}

	async exchangeTokens(req: Request, res: Response) {
		const { refreshToken } = req.body;
		if (!refreshToken) {
			return res.status(401).json({ error: 'No token in request' });
		}

		const tokenExists = await this.db.getRefreshToken(refreshToken);
		if (!tokenExists) {
			return res.status(403).json({ error: 'No token found' });
		}

		jwt.verify(
			refreshToken,
			process.env.JWT_REFRESH_SECRET as string,
			// FIXME for some reason the types for `err` and `user` need to be defined
			// this wasn't necessary in AuthService for the same callback
			(err: jwt.VerifyErrors | null, user: string | jwt.JwtPayload | undefined) => {
				if (err) {
					return res.status(403).json({ error: 'Invalid token' });
				}

				const decodedToken = user as JwtPayload;
				const userId = decodedToken.userId;
				if (!userId) {
					return res.status(403).json({ error: 'Invalid user ID' });
				}

				const accessToken = this.generateAccessToken(userId);
				res.status(200).json({ accessToken: accessToken });
			}
		);
	}

	async logout(req: Request, res: Response) {
		const { refreshToken } = req.body;
		if (!refreshToken) {
			return res.status(401).json({ error: 'No token in request' });
		}

		try {
			const exists = await this.db.getRefreshToken(refreshToken);
			if (!exists) {
				return res.status(403).json({ error: 'Not logged in' });
			}

			await this.db.deleteRefreshToken(refreshToken);
			res.status(204).json({ message: 'Logged out successfully.' });
		} catch (err) {
			console.error('Logout Error:', err);
			return res.status(500).json({ message: 'Failed to log out.' });
		}
	}
}

export default AuthRoutes;
