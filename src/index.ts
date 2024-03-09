import dotenv from 'dotenv';
import express from 'express';
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

// Load routes
routes.forEach(route => route.addTo(server));

// Prints all routes added to the server
// server._router.stack.forEach((middleware: { route: { path: any; methods: any }; name: string; handle: { stack: any[] } }) => {
// 	if (middleware.route) {
// 		// Only consider middleware that is a route
// 		const { path, methods } = middleware.route;
// 		const methodNames = Object.keys(methods)
// 			.map(method => method.toUpperCase())
// 			.join(', ');
// 		console.log(`${methodNames} ${path}`);
// 	} else if (middleware.name === 'router') {
// 		// For routers, dive into the routes they contain
// 		middleware.handle.stack.forEach((handler: { route: { path: any; methods: any } }) => {
// 			const routePath = handler.route?.path;
// 			const routeMethods = handler.route?.methods;
// 			const methodNames = routeMethods
// 				? Object.keys(routeMethods)
// 						.map(method => method.toUpperCase())
// 						.join(', ')
// 				: '';
// 			console.log(`${methodNames} ${routePath}`);
// 		});
// 	}
// });

// Start server
server
	.listen(PORT, () => {
		console.log(`Server is running at http://localhost:${PORT}`);
	})
	.on('error', err => {
		throw new Error(err.message);
	});
