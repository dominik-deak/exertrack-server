"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
/**
 * Base route to be extended by other routes
 */
class BaseRoute {
    constructor() {
        this.router = (0, express_1.Router)();
    }
    /**
     * Initialise the configured routes
     */
    initialiseRoutes() {
        this.configureRoutes();
    }
    /**
     * Add routes to express application
     * @param app express application
     */
    addTo(app) {
        app.use(this.path, this.router);
    }
}
exports.default = BaseRoute;
