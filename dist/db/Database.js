"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
/**
 * Singleton database class.
 * Uses Prisma Client.
 */
class Database {
    // Private constructor to prevent direct instantiation.
    constructor() { }
    /**
     * @returns Database instance
     */
    static getInstance() {
        if (!Database.instance) {
            Database.instance = new client_1.PrismaClient();
        }
        return Database.instance;
    }
}
exports.default = Database;
