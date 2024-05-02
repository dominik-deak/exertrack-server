import { PrismaClient } from '@prisma/client';
import Database from './Database';

/**
 * User database operations repository class
 */
class UserOperations {
	private static instance: UserOperations;
	private db: PrismaClient;

	private constructor() {
		this.db = Database.getInstance();
	}

	/**
	 * @returns UserOperations instance
	 */
	public static getInstance(): UserOperations {
		if (!UserOperations.instance) {
			UserOperations.instance = new UserOperations();
		}
		return UserOperations.instance;
	}

	/**
	 * Creates a new user in the database
	 * @param email the email of the user
	 * @param hashedPassword the hashed password of the user
	 * @returns the id of the created user
	 */
	public async createUser(email: string, hashedPassword: string) {
		const user = await this.db.user.create({
			data: {
				email,
				password: hashedPassword
			}
		});
		return user.id;
	}

	/**
	 * Retrieves a user by id
	 * @param userId the id of the user
	 * @returns the user
	 */
	public async getUserById(userId: string) {
		const user = await this.db.user.findUnique({
			where: { id: userId }
		});
		return user;
	}

	/**
	 * Retrieves a user by email
	 * @param email the email of the user
	 * @returns the user
	 */
	public async getUserByEmail(email: string) {
		const user = await this.db.user.findUnique({
			where: { email: email }
		});
		return user;
	}

	/**
	 * Updates a user in the database
	 * @param userId the id of the user
	 * @param firstName the new first name of the user
	 * @param lastName the new last name of the user
	 * @returns the updated user
	 */
	public async updateUser(userId: string, firstName: string, lastName: string) {
		const newUser = await this.db.user.update({
			where: { id: userId },
			data: {
				firstName,
				lastName
			}
		});
		return newUser;
	}

	/**
	 * Updates a user's password in the database
	 * @param userId the id of the user
	 * @param hashedPassword the new hashed password
	 */
	public async updateUserPassword(userId: string, hashedPassword: string) {
		await this.db.user.update({
			where: { id: userId },
			data: {
				password: hashedPassword
			}
		});
	}

	/**
	 * Deletes a user from the database
	 * @param userId the id of the user to delete
	 */
	public async deleteUser(userId: string) {
		await this.db.user.delete({
			where: { id: userId }
		});
	}
}

export default UserOperations;
