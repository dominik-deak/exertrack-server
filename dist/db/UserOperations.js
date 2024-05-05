"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Database_1 = __importDefault(require("./Database"));
/**
 * User database operations repository class
 */
class UserOperations {
    constructor() {
        this.db = Database_1.default.getInstance();
    }
    /**
     * @returns UserOperations instance
     */
    static getInstance() {
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
    createUser(email, hashedPassword) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield this.db.user.create({
                data: {
                    email,
                    password: hashedPassword
                }
            });
            return user.id;
        });
    }
    /**
     * Retrieves a user by id
     * @param userId the id of the user
     * @returns the user
     */
    getUserById(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield this.db.user.findUnique({
                where: { id: userId }
            });
            return user;
        });
    }
    /**
     * Retrieves a user by email
     * @param email the email of the user
     * @returns the user
     */
    getUserByEmail(email) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield this.db.user.findUnique({
                where: { email: email }
            });
            return user;
        });
    }
    /**
     * Updates a user in the database
     * @param userId the id of the user
     * @param firstName the new first name of the user
     * @param lastName the new last name of the user
     * @returns the updated user
     */
    updateUser(userId, firstName, lastName) {
        return __awaiter(this, void 0, void 0, function* () {
            const newUser = yield this.db.user.update({
                where: { id: userId },
                data: {
                    firstName,
                    lastName
                }
            });
            return newUser;
        });
    }
    /**
     * Updates a user's password in the database
     * @param userId the id of the user
     * @param hashedPassword the new hashed password
     */
    updateUserPassword(userId, hashedPassword) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.db.user.update({
                where: { id: userId },
                data: {
                    password: hashedPassword
                }
            });
        });
    }
    /**
     * Deletes a user from the database
     * @param userId the id of the user to delete
     */
    deleteUserAndData(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.db.exercise.deleteMany({
                where: { userId: userId }
            });
            yield this.db.template.deleteMany({
                where: { userId: userId }
            });
            yield this.db.workout.deleteMany({
                where: { userId: userId }
            });
            yield this.db.user.delete({
                where: { id: userId }
            });
        });
    }
}
exports.default = UserOperations;
