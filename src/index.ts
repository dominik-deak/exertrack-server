import dotenv from 'dotenv';
import express from 'express';
import routes from './routes/routes';

dotenv.config();
const app = express();
const PORT = process.env.PORT;

routes.forEach(route => {
	app.use(route);
});

app.listen(PORT, () => {
	console.log(`Server is running at http://localhost:${PORT}`);
}).on('error', err => {
	throw new Error(err.message);
});
