import bcrypt from 'bcrypt';
import { Request, Response } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import AuthOperations from '../db/AuthOperations';
import UserOperations from '../db/UserOperations';
import AuthService from '../middleware/AuthService';
import BaseRoute from './BaseRoute';

/**
 * Authentication routes
 */
class AuthRoutes extends BaseRoute {
	private static instance: AuthRoutes;
	private authOps = AuthOperations.getInstance();
	private userOps = UserOperations.getInstance();
	public path = '/auth';

	private constructor() {
		super();
		this.initialiseRoutes();
	}

	/**
	 * @returns AuthRoutes instance
	 */
	public static getInstance(): AuthRoutes {
		if (!AuthRoutes.instance) {
			AuthRoutes.instance = new AuthRoutes();
		}

		return AuthRoutes.instance;
	}

	public configureRoutes() {
		this.router.post('/register', this.register.bind(this));
		this.router.post('/login', this.login.bind(this));
		this.router.post('/token', this.exchangeTokens.bind(this));
		this.router.post('/check-password', AuthService.verifyToken, this.checkPassword.bind(this));
		this.router.delete('/logout', AuthService.verifyToken, this.logout.bind(this));
		this.router.delete('/delete-account', AuthService.verifyToken, this.deleteAccount.bind(this));
	}

	/**
	 * Generates an access token by signing the user id
	 * @param userId the user id
	 * @returns the access token
	 */
	private generateAccessToken(userId: string) {
		return jwt.sign({ userId: userId }, process.env.JWT_ACCESS_SECRET as string, { expiresIn: '1h' });
	}

	/**
	 * Generates a refresh token by signing the user id
	 * @param userId the user id
	 * @returns the refresh token
	 */
	private generateRefreshToken(userId: string) {
		return jwt.sign({ userId: userId }, process.env.JWT_REFRESH_SECRET as string);
	}

	/**
	 * Registers a new user using the user operations repository class
	 * @param req request object
	 * @param res response object
	 */
	private async register(req: Request, res: Response) {
		const { email, password } = req.body;

		try {
			const exists = await this.userOps.getUserByEmail(email);
			if (exists) {
				return res.status(409).json({ error: 'User already exists' });
			}
		} catch (err) {
			console.error('Error checking user existence:', err);
			return res.status(500).json({ error: 'Error checking if user exists' });
		}

		try {
			const hashedPassword = await bcrypt.hash(password, 10);
			await this.userOps.createUser(email, hashedPassword);

			res.status(201).json({ message: 'You have registered successfully' });
		} catch (err) {
			console.error('Registration Error:', err);
			res.status(500).json({ error: 'Error registering' });
		}
	}

	/**
	 * Logs in a user using the auth operations repository class
	 * @param req request object
	 * @param res response object
	 */
	private async login(req: Request, res: Response) {
		const { email, password } = req.body;

		try {
			const user = await this.userOps.getUserByEmail(email);
			if (!user) {
				return res.status(404).json({ error: 'User not found' });
			}
			const isPasswordValid = await bcrypt.compare(password, user.password);
			if (!isPasswordValid) {
				return res.status(401).json({ error: 'Invalid password' });
			}

			let refreshToken: string | null = null;

			// checks for existing refresh token (exinsting login session)
			const refTokenObj = await this.authOps.getRefreshTokenByUserId(user.id);
			if (refTokenObj) {
				refreshToken = refTokenObj.token;
			} else {
				refreshToken = this.generateRefreshToken(user.id);
				await this.authOps.createRefreshToken(refreshToken, user.id); // stores refresh token in database
			}

			const accessToken = this.generateAccessToken(user.id);

			res.status(200).json({ accessToken: accessToken, refreshToken: refreshToken });
		} catch (err) {
			console.error('Login Error:', err);
			res.status(500).json({ error: 'Error logging in' });
		}
	}

	/**
	 * Exchanges a refresh token for an access token
	 * @param req request object
	 * @param res response object
	 */
	private async exchangeTokens(req: Request, res: Response) {
		const { refreshToken } = req.body;
		if (!refreshToken) {
			return res.status(401).json({ error: 'No token in request' });
		}
		const tokenExists = await this.authOps.getRefreshToken(refreshToken);
		if (!tokenExists) {
			return res.status(403).json({ error: 'No token found' });
		}

		// FIXME for some reason the types for `err` and `user` need to be defined
		// this wasn't necessary in AuthService for the same callback.
		// Type sources:
		// https://stackoverflow.com/questions/67897887/why-the-token-parameter-in-verify-function-is-showing-error-in-jwt-authentitcati
		// https://stackoverflow.com/questions/68403905/how-to-add-additional-properties-to-jwtpayload-type-from-types-jsonwebtoken
		jwt.verify(
			refreshToken,
			process.env.JWT_REFRESH_SECRET as string,
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

	/**
	 * Checks if a password is valid
	 * @param req request object
	 * @param res response object
	 */
	private async checkPassword(req: Request, res: Response) {
		const { currentPassword } = req.body;
		if (!currentPassword) {
			return res.status(403).json({ error: 'Missing required field(s)' });
		}

		const user = req.user;
		if (!user) {
			return res.status(403).json({ error: "Can't get user from request" });
		}

		try {
			const valid = await bcrypt.compare(currentPassword, user.password);

			if (valid) {
				res.status(200).json({ message: 'Password valid' });
			} else {
				res.status(401).json({ error: 'Invalid password' });
			}
		} catch (err) {
			console.error('Check Password Error:', err);
			res.status(500).json({ error: 'Failed to check password' });
		}
	}

	/**
	 * Logs out a user by deleting their refresh token using the auth operations repository class
	 * @param req request object
	 * @param res response object
	 */
	private async logout(req: Request, res: Response) {
		const { refreshToken } = req.body;
		if (!refreshToken) {
			return res.status(401).json({ error: 'No token in request' });
		}

		try {
			const exists = await this.authOps.getRefreshToken(refreshToken);
			if (!exists) {
				return res.status(403).json({ error: 'Not logged in' });
			}

			await this.authOps.deleteRefreshToken(refreshToken);

			res.status(200).json({ message: 'Logged out successfully' });
		} catch (err) {
			console.error('Logout Error:', err);
			return res.status(500).json({ message: 'Failed to log out' });
		}
	}

	/**
	 * Deletes an account using the user operations repository class
	 * @param req request object
	 * @param res response object
	 */
	private async deleteAccount(req: Request, res: Response) {
		const { refreshToken } = req.body;
		if (!refreshToken) {
			return res.status(401).json({ error: 'No token in request' });
		}

		try {
			const tokenExists = await this.authOps.getRefreshToken(refreshToken);
			if (!tokenExists) {
				return res.status(403).json({ error: 'Not logged in' });
			}
			const userId = req.user?.id;
			if (!userId) {
				return res.status(403).json({ error: "Can't get user ID from request" });
			}

			await this.authOps.deleteRefreshToken(refreshToken);
			await this.userOps.deleteUser(userId);

			res.status(200).json({ message: 'Account deleted successfully' });
		} catch (err) {
			console.error('Delete Account Error:', err);
			res.status(500).json({ error: 'Failed to delete account' });
		}
	}
}

export default AuthRoutes;
