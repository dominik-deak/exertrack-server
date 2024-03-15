import { PrismaClient } from '@prisma/client';
import Database from './Database';

class UserOperations {
	private static instance: UserOperations;
	private db: PrismaClient;

	private constructor() {
		this.db = Database.getInstance();
	}

	public static getInstance(): UserOperations {
		if (!UserOperations.instance) {
			UserOperations.instance = new UserOperations();
		}
		return UserOperations.instance;
	}

	public async createUser(email: string, hashedPassword: string) {
		const user = await this.db.user.create({
			data: {
				email,
				password: hashedPassword
			}
		});
		return user.id;
	}

	public async getUserById(userId: string) {
		const user = await this.db.user.findUnique({
			where: { id: userId }
		});
		return user;
	}

	public async getUserByEmail(email: string) {
		const user = await this.db.user.findUnique({
			where: { email }
		});
		return user;
	}

	public async updateUser() {
		// TODO
	}

	public async deleteUser(userId: string) {
		await this.db.user.delete({
			where: { id: userId }
		});
	}
}

export default UserOperations;
