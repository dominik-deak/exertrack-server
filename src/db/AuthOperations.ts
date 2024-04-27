import { PrismaClient } from '@prisma/client';
import Database from './Database';

/**
 * Auth database operations repository class
 */
class AuthOperations {
	private static instance: AuthOperations;
	private db: PrismaClient;

	private constructor() {
		this.db = Database.getInstance();
	}

	/**
	 * @returns AuthOperations instance
	 */
	public static getInstance(): AuthOperations {
		if (!AuthOperations.instance) {
			AuthOperations.instance = new AuthOperations();
		}
		return AuthOperations.instance;
	}

	/**
	 * Creates a new refresh token in the database
	 * @param token the refresh token
	 * @param userId the user id
	 * @returns the id of the created refresh token
	 */
	public async createRefreshToken(token: string, userId: string) {
		const createdToken = await this.db.refreshToken.create({
			data: {
				token,
				userId
			}
		});
		return createdToken.id;
	}

	/**
	 * Check if a refresh token exists in the database
	 * @param token the refresh token
	 * @returns the refresh token
	 */
	public async getRefreshToken(token: string) {
		const refreshToken = await this.db.refreshToken.findUnique({
			where: { token }
		});
		return refreshToken;
	}

	/**
	 * Retrieve a refresh token by user id
	 * @param userId the user id
	 * @returns the refresh token
	 */
	public async getRefreshTokenByUserId(userId: string) {
		const refreshToken = await this.db.refreshToken.findUnique({
			where: { userId }
		});
		return refreshToken;
	}

	/**
	 * Delete a refresh token from the database
	 * @param token the refresh token to delete
	 */
	public async deleteRefreshToken(token: string) {
		await this.db.refreshToken.delete({
			where: { token }
		});
	}
}

export default AuthOperations;
