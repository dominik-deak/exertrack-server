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

	// Refresh Token Operations Start //
	public async createRefreshToken(token: string) {
		const createdToken = await this.db.refreshToken.create({
			data: { token }
		});
		return createdToken.id;
	}

	public async getRefreshToken(token: string) {
		const refreshToken = await this.db.refreshToken.findUnique({
			where: { token }
		});
		return refreshToken;
	}

	public async deleteRefreshToken(token: string) {
		await this.db.refreshToken.delete({
			where: { token }
		});
	}
	// Refresh Token Operations End //

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

	public async updateUser() {}

	public async deleteUser() {}
	// User Operations End //
}

export default DBOperations;
