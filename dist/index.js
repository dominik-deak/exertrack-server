"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const express_1 = __importDefault(require("express"));
const fs_1 = __importDefault(require("fs"));
const routes_1 = __importDefault(require("./routes/routes"));
// Exit if .env file doesn't exist
if (!fs_1.default.existsSync('.env')) {
    console.error('Error: .env file not found. Exiting...');
    process.exit(1);
}
// Load environment variables
dotenv_1.default.config();
// Exit if environment variables aren't set
if (!process.env.DATABASE_URL) {
    console.error('Error: DATABASE_URL is not set. Exiting...');
    process.exit(1);
}
if (!process.env.PORT) {
    console.error('Error: PORT is not set. Exiting...');
    process.exit(1);
}
if (!process.env.JWT_ACCESS_SECRET) {
    console.error('Error: JWT_ACCESS_SECRET is not set. Exiting...');
    process.exit(1);
}
if (!process.env.JWT_REFRESH_SECRET) {
    console.error('Error: JWT_REFRESH_SECRET is not set. Exiting...');
    process.exit(1);
}
// Create server
const server = (0, express_1.default)();
const PORT = process.env.PORT;
server.use(express_1.default.json());
server.use((0, cors_1.default)()); // TODO disable cors for production
// Load routes
routes_1.default.forEach(route => route.addTo(server));
// Start server
server
    .listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
})
    .on('error', err => {
    throw new Error(err.message);
});
