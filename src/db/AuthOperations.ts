import { PrismaClient } from '@prisma/client';
import Database from './Database';

class AuthOperations {
	private static instance: AuthOperations;
	private db: PrismaClient;

	private constructor() {
		this.db = Database.getInstance();
	}

	public static getInstance(): AuthOperations {
		if (!AuthOperations.instance) {
			AuthOperations.instance = new AuthOperations();
		}
		return AuthOperations.instance;
	}

	public async createRefreshToken(token: string, userId: string) {
		const createdToken = await this.db.refreshToken.create({
			data: {
				token,
				userId
			}
		});
		return createdToken.id;
	}

	public async getRefreshToken(token: string) {
		const refreshToken = await this.db.refreshToken.findUnique({
			where: { token }
		});
		return refreshToken;
	}

	public async getRefreshTokenByUserId(userId: string) {
		const refreshToken = await this.db.refreshToken.findUnique({
			where: { userId }
		});
		return refreshToken;
	}

	public async deleteRefreshToken(token: string) {
		await this.db.refreshToken.delete({
			where: { token }
		});
	}
}

export default AuthOperations;
