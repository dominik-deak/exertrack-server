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
 * Auth database operations repository class
 */
class AuthOperations {
    constructor() {
        this.db = Database_1.default.getInstance();
    }
    /**
     * @returns AuthOperations instance
     */
    static getInstance() {
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
    createRefreshToken(token, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const createdToken = yield this.db.refreshToken.create({
                data: {
                    token,
                    userId
                }
            });
            return createdToken.id;
        });
    }
    /**
     * Check if a refresh token exists in the database
     * @param token the refresh token
     * @returns the refresh token
     */
    getRefreshToken(token) {
        return __awaiter(this, void 0, void 0, function* () {
            const refreshToken = yield this.db.refreshToken.findUnique({
                where: { token }
            });
            return refreshToken;
        });
    }
    /**
     * Retrieve a refresh token by user id
     * @param userId the user id
     * @returns the refresh token
     */
    getRefreshTokenByUserId(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const refreshToken = yield this.db.refreshToken.findUnique({
                where: { userId }
            });
            return refreshToken;
        });
    }
    /**
     * Delete a refresh token from the database
     * @param token the refresh token to delete
     */
    deleteRefreshToken(token) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.db.refreshToken.delete({
                where: { token }
            });
        });
    }
}
exports.default = AuthOperations;
