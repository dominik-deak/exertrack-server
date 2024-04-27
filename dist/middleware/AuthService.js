"use strict";
// FIXME src/types/express.d.ts is declared globally
// but for some reason it doesn't work without this line
/// <reference path="../types/express.d.ts" />
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
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const UserOperations_1 = __importDefault(require("../db/UserOperations"));
/**
 * JWT Authentication Middleware.
 *
 * To be used by protected routes.
 */
class AuthService {
    /**
     * Verifies the JWT token in the request
     * @param req request object
     * @param res response object
     * @param next next function to call after verification
     */
    static verifyToken(req, res, next) {
        const authHeader = req.headers.authorization;
        const token = authHeader === null || authHeader === void 0 ? void 0 : authHeader.split(' ')[1]; // 'bearer token'
        if (!token) {
            return res.status(401).json({ error: 'No token in request' });
        }
        jsonwebtoken_1.default.verify(token, process.env.JWT_ACCESS_SECRET, (err, user) => __awaiter(this, void 0, void 0, function* () {
            if (err) {
                return res.status(403).json({ error: 'Invalid token' });
            }
            const decodedToken = user;
            const userId = decodedToken.userId;
            if (!userId) {
                return res.status(403).json({ error: 'Invalid user ID' });
            }
            try {
                // `this.userOps` won't work because `userOps` is static
                const user = yield AuthService.userOps.getUserById(userId);
                if (!user) {
                    return res.status(404).json({ error: 'User not found' });
                }
                req.user = user; // attach user to request, to be used by route handler
                next();
            }
            catch (error) {
                console.error('AuthService Error:', error);
                return res.status(500).json({ error: 'Error verifying token' });
            }
        }));
    }
}
AuthService.userOps = UserOperations_1.default.getInstance();
exports.default = AuthService;
