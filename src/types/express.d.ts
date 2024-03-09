import { User } from '@prisma/client';

// This was needed in order to attach the full user object
// to the express request, to be used by the request handlers.
declare global {
	namespace Express {
		interface Request {
			user?: User;
		}
	}
}
