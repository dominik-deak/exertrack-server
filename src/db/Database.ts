import { PrismaClient } from '@prisma/client';

// singleton
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
