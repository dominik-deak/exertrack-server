// FIXME src/types/express.d.ts is declared globally
// but for some reason it doesn't work without this line
/// <reference path="../types/express.d.ts" />

import { NextFunction, Request, Response } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import DBOperations from '../db/DBOperations';

/**
 * JWT Authentication Middleware.
 *
 * To be used by protected routes.
 */
class AuthService {
	private static db = DBOperations.getInstance();

	public static verifyToken(req: Request, res: Response, next: NextFunction) {
		const authHeader = req.headers.authorization;
		const token = authHeader?.split(' ')[1]; // 'bearer token'
		if (!token) {
			return res.status(401).json({ error: 'No token in request' });
		}

		jwt.verify(token, process.env.JWT_ACCESS_SECRET as string, async (err, user) => {
			if (err) {
				return res.status(403).json({ error: 'Invalid token' });
			}

			const decodedToken = user as JwtPayload;
			const userId = decodedToken.userId;
			if (!userId) {
				return res.status(403).json({ error: 'Invalid user ID' });
			}

			try {
				const user = await AuthService.db.getUserById(userId);
				if (!user) {
					return res.status(404).json({ error: 'User not found' });
				}

				req.user = user; // attach user to request, to be used by route handler
				next();
			} catch (error) {
				console.error('AuthService Error:', error);
				return res.status(500).json({ error: 'Error verifying token' });
			}
		});
	}
}

export default AuthService;