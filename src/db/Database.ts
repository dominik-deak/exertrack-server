import { PrismaClient } from '@prisma/client';

/**
 * Singleton database class.
 * Uses Prisma Client.
 */
class Database {
	private static instance: PrismaClient;

	// Private constructor to prevent direct instantiation.
	private constructor() {}

	public static getInstance(): PrismaClient {
		if (!Database.instance) {
			Database.instance = new PrismaClient();
		}

		return Database.instance;
	}
}

export default Database;
