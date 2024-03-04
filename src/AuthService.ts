import { NextFunction, Request, Response } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';

interface AuthenticatedRequest extends Request {
	user?: JwtPayload | string; // Added user info to Request
}

class AuthService {
	public static verifyToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
		const authHeader = req.headers.authorization;
		const token = authHeader?.split(' ')[1]; // bearer token

		if (!token) {
			res.sendStatus(401);
			return;
		}

		jwt.verify(token, process.env.JWT_SECRET as string, (err, decoded) => {
			if (err) {
				return res.sendStatus(403);
			}
			req.user = decoded; // attach user info to request
			next();
		});
	}
}

export default AuthService;
