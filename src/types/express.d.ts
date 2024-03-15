import { User } from '@prisma/client';

// This was needed in order to attach the full user object
// to the express request, to be used by the request handlers.
// Source: https://blog.logrocket.com/extend-express-request-object-typescript/
declare global {
	namespace Express {
		interface Request {
			user?: User;
		}
	}
}
