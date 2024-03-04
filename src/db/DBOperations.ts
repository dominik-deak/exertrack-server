import { PrismaClient } from '@prisma/client';
import Database from './Database';

// singleton
class DBOperations {
	private db: PrismaClient;
	private static instance: DBOperations;

	private constructor() {
		this.db = Database.getInstance();
	}

	public static getInstance(): DBOperations {
		if (!DBOperations.instance) {
			DBOperations.instance = new DBOperations();
		}
		return DBOperations.instance;
	}

	// User Operations Start //
	public async createUser(email: string, hashedPassword: string) {
		const user = await this.db.user.create({
			data: {
				email,
				password: hashedPassword
			}
		});
		return user.id;
	}

	public async getUser(email: string) {
		const user = await this.db.user.findUnique({
			where: {
				email
			}
		});
		return user;
	}

	public async updateUser() {}

	public async deleteUser() {}
	// User Operations End //
}

export default DBOperations;
