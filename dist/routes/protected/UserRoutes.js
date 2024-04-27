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
const bcrypt_1 = __importDefault(require("bcrypt"));
const UserOperations_1 = __importDefault(require("../../db/UserOperations"));
const AuthService_1 = __importDefault(require("../../middleware/AuthService"));
const BaseRoute_1 = __importDefault(require("../BaseRoute"));
/**
 * User routes
 */
class UserRoutes extends BaseRoute_1.default {
    constructor() {
        super();
        this.userOps = UserOperations_1.default.getInstance();
        this.path = '/user';
        this.initialiseRoutes();
    }
    /**
     * @returns UserRoutes instance
     */
    static getInstance() {
        if (!UserRoutes.instance) {
            UserRoutes.instance = new UserRoutes();
        }
        return UserRoutes.instance;
    }
    configureRoutes() {
        this.router.use(AuthService_1.default.verifyToken); // Applies middleware to all routes
        this.router.get('/', this.getUser.bind(this));
        this.router.patch('/name', this.updateUserNames.bind(this));
        this.router.patch('/password', this.updateUserPassword.bind(this));
    }
    /**
     * Retrieve user details using the user operations repository class
     * @param req request object
     * @param res response object
     */
    getUser(req, res) {
        if (!req.user) {
            return res.status(403).json({ error: "Can't get user from request" });
        }
        res.status(200).json({
            user: {
                id: req.user.id,
                email: req.user.email,
                firstName: req.user.firstName,
                lastName: req.user.lastName,
                created: req.user.created,
                updated: req.user.updated
            }
        });
    }
    /**
     * Update the user's first and last name using the user operations repository class
     * @param req request object
     * @param res response object
     */
    updateUserNames(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!req.user) {
                return res.status(403).json({ error: "Can't get user from request" });
            }
            const { firstName, lastName } = req.body;
            try {
                const newUser = yield this.userOps.updateUser(req.user.id, firstName, lastName);
                res.status(200).json({
                    message: 'User updated successfully',
                    user: {
                        id: newUser.id,
                        email: newUser.email,
                        firstName: newUser.firstName,
                        lastName: newUser.lastName,
                        created: newUser.created,
                        updated: newUser.updated
                    }
                });
            }
            catch (err) {
                console.error('Update User Error:', err);
                res.status(500).json({ error: 'Failed to update user' });
            }
        });
    }
    /**
     * Update the user's password using the user operations repository class
     * @param req request object
     * @param res response object
     */
    updateUserPassword(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!req.user) {
                return res.status(403).json({ error: "Can't get user from request" });
            }
            const { currentPassword, newPassword } = req.body;
            if (!currentPassword || !newPassword) {
                return res.status(403).json({ error: 'Missing required field(s)' });
            }
            try {
                const valid = yield bcrypt_1.default.compare(currentPassword, req.user.password);
                if (!valid) {
                    return res.status(401).json({ error: 'Invalid password' });
                }
                if (currentPassword === newPassword) {
                    return res.status(409).json({ error: 'New password cannot be the same as current password' });
                }
                const hashedPassword = yield bcrypt_1.default.hash(newPassword, 10);
                yield this.userOps.updateUserPassword(req.user.id, hashedPassword);
                res.status(200).json({ message: 'Password updated successfully' });
            }
            catch (err) {
                console.error('Update Password Error:', err);
                res.status(500).json({ error: 'Failed to update password' });
            }
        });
    }
}
exports.default = UserRoutes;
