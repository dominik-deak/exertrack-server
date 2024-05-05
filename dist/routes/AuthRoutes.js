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
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const AuthOperations_1 = __importDefault(require("../db/AuthOperations"));
const UserOperations_1 = __importDefault(require("../db/UserOperations"));
const AuthService_1 = __importDefault(require("../middleware/AuthService"));
const BaseRoute_1 = __importDefault(require("./BaseRoute"));
/**
 * Authentication routes
 */
class AuthRoutes extends BaseRoute_1.default {
    constructor() {
        super();
        this.authOps = AuthOperations_1.default.getInstance();
        this.userOps = UserOperations_1.default.getInstance();
        this.path = '/auth';
        this.initialiseRoutes();
    }
    /**
     * @returns AuthRoutes instance
     */
    static getInstance() {
        if (!AuthRoutes.instance) {
            AuthRoutes.instance = new AuthRoutes();
        }
        return AuthRoutes.instance;
    }
    configureRoutes() {
        this.router.post('/register', this.register.bind(this));
        this.router.post('/login', this.login.bind(this));
        this.router.post('/token', this.exchangeTokens.bind(this));
        this.router.post('/check-password', AuthService_1.default.verifyToken, this.checkPassword.bind(this));
        this.router.delete('/logout', AuthService_1.default.verifyToken, this.logout.bind(this));
        this.router.delete('/delete-account', AuthService_1.default.verifyToken, this.deleteAccount.bind(this));
    }
    /**
     * Generates an access token by signing the user id
     * @param userId the user id
     * @returns the access token
     */
    generateAccessToken(userId) {
        return jsonwebtoken_1.default.sign({ userId: userId }, process.env.JWT_ACCESS_SECRET, { expiresIn: '1h' });
    }
    /**
     * Generates a refresh token by signing the user id
     * @param userId the user id
     * @returns the refresh token
     */
    generateRefreshToken(userId) {
        return jsonwebtoken_1.default.sign({ userId: userId }, process.env.JWT_REFRESH_SECRET);
    }
    /**
     * Registers a new user using the user operations repository class
     * @param req request object
     * @param res response object
     */
    register(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { email, password } = req.body;
            try {
                const exists = yield this.userOps.getUserByEmail(email);
                if (exists) {
                    return res.status(409).json({ error: 'User already exists' });
                }
            }
            catch (err) {
                console.error('Error checking user existence:', err);
                return res.status(500).json({ error: 'Error checking if user exists' });
            }
            try {
                const hashedPassword = yield bcrypt_1.default.hash(password, 10);
                yield this.userOps.createUser(email, hashedPassword);
                res.status(201).json({ message: 'You have registered successfully' });
            }
            catch (err) {
                console.error('Registration Error:', err);
                res.status(500).json({ error: 'Error registering' });
            }
        });
    }
    /**
     * Logs in a user using the auth operations repository class
     * @param req request object
     * @param res response object
     */
    login(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { email, password } = req.body;
            try {
                const user = yield this.userOps.getUserByEmail(email);
                if (!user) {
                    return res.status(404).json({ error: 'User not found' });
                }
                const isPasswordValid = yield bcrypt_1.default.compare(password, user.password);
                if (!isPasswordValid) {
                    return res.status(401).json({ error: 'Invalid password' });
                }
                let refreshToken = null;
                // checks for existing refresh token (exinsting login session)
                const refTokenObj = yield this.authOps.getRefreshTokenByUserId(user.id);
                if (refTokenObj) {
                    refreshToken = refTokenObj.token;
                }
                else {
                    refreshToken = this.generateRefreshToken(user.id);
                    yield this.authOps.createRefreshToken(refreshToken, user.id); // stores refresh token in database
                }
                const accessToken = this.generateAccessToken(user.id);
                res.status(200).json({ accessToken: accessToken, refreshToken: refreshToken });
            }
            catch (err) {
                console.error('Login Error:', err);
                res.status(500).json({ error: 'Error logging in' });
            }
        });
    }
    /**
     * Exchanges a refresh token for an access token
     * @param req request object
     * @param res response object
     */
    exchangeTokens(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { refreshToken } = req.body;
            if (!refreshToken) {
                return res.status(401).json({ error: 'No token in request' });
            }
            const tokenExists = yield this.authOps.getRefreshToken(refreshToken);
            if (!tokenExists) {
                return res.status(403).json({ error: 'No token found' });
            }
            // FIXME for some reason the types for `err` and `user` need to be defined
            // this wasn't necessary in AuthService for the same callback.
            // Type sources:
            // https://stackoverflow.com/questions/67897887/why-the-token-parameter-in-verify-function-is-showing-error-in-jwt-authentitcati
            // https://stackoverflow.com/questions/68403905/how-to-add-additional-properties-to-jwtpayload-type-from-types-jsonwebtoken
            jsonwebtoken_1.default.verify(refreshToken, process.env.JWT_REFRESH_SECRET, (err, user) => {
                if (err) {
                    return res.status(403).json({ error: 'Invalid token' });
                }
                const decodedToken = user;
                const userId = decodedToken.userId;
                if (!userId) {
                    return res.status(403).json({ error: 'Invalid user ID' });
                }
                const accessToken = this.generateAccessToken(userId);
                res.status(200).json({ accessToken: accessToken });
            });
        });
    }
    /**
     * Checks if a password is valid
     * @param req request object
     * @param res response object
     */
    checkPassword(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { currentPassword } = req.body;
            if (!currentPassword) {
                return res.status(403).json({ error: 'Missing required field(s)' });
            }
            const user = req.user;
            if (!user) {
                return res.status(403).json({ error: "Can't get user from request" });
            }
            try {
                const valid = yield bcrypt_1.default.compare(currentPassword, user.password);
                if (valid) {
                    res.status(200).json({ message: 'Password valid' });
                }
                else {
                    res.status(401).json({ error: 'Invalid password' });
                }
            }
            catch (err) {
                console.error('Check Password Error:', err);
                res.status(500).json({ error: 'Failed to check password' });
            }
        });
    }
    /**
     * Logs out a user by deleting their refresh token using the auth operations repository class
     * @param req request object
     * @param res response object
     */
    logout(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { refreshToken } = req.body;
            if (!refreshToken) {
                return res.status(401).json({ error: 'No token in request' });
            }
            try {
                const exists = yield this.authOps.getRefreshToken(refreshToken);
                if (!exists) {
                    return res.status(403).json({ error: 'Not logged in' });
                }
                yield this.authOps.deleteRefreshToken(refreshToken);
                res.status(200).json({ message: 'Logged out successfully' });
            }
            catch (err) {
                console.error('Logout Error:', err);
                return res.status(500).json({ message: 'Failed to log out' });
            }
        });
    }
    /**
     * Deletes an account using the user operations repository class
     * @param req request object
     * @param res response object
     */
    deleteAccount(req, res) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const { refreshToken } = req.body;
            if (!refreshToken) {
                return res.status(401).json({ error: 'No token in request' });
            }
            try {
                const tokenExists = yield this.authOps.getRefreshToken(refreshToken);
                if (!tokenExists) {
                    return res.status(403).json({ error: 'Not logged in' });
                }
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                if (!userId) {
                    return res.status(403).json({ error: "Can't get user ID from request" });
                }
                yield this.authOps.deleteRefreshToken(refreshToken);
                yield this.userOps.deleteUserAndData(userId); // also deletes all data related to user
                res.status(200).json({ message: 'Account deleted successfully' });
            }
            catch (err) {
                console.error('Delete Account Error:', err);
                res.status(500).json({ error: 'Failed to delete account' });
            }
        });
    }
}
exports.default = AuthRoutes;
