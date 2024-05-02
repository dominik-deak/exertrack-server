import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
// import expressListRoutes from 'express-list-routes';
import fs from 'fs';
import routes from './routes/routes';

// Exit if .env file doesn't exist
if (!fs.existsSync('.env')) {
	console.error('Error: .env file not found. Exiting...');
	process.exit(1);
}

// Load environment variables
dotenv.config();

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
const server = express();
const PORT = process.env.PORT;
server.use(express.json());
server.use(cors()); // TODO disable cors for production

// Load routes
routes.forEach(route => route.addTo(server));

// // prints all routes registered in the express app for testing purposes
// expressListRoutes(server);

// Start server
server
	.listen(PORT, () => {
		console.log(`Server is running at http://localhost:${PORT}`);
	})
	.on('error', err => {
		throw new Error(err.message);
	});
