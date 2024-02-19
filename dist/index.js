"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const express_1 = __importDefault(require("express"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT;
app.get('/', (req, res) => {
    res.status(200).send('Hello World');
});
app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
}).on('error', err => {
    throw new Error(err.message);
});
