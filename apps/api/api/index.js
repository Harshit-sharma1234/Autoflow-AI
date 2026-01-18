"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = handler;
const app_1 = __importDefault(require("../src/app"));
const database_1 = require("../src/config/database");
// Cache the app instance
let app = null;
async function handler(req, res) {
    // Ensure database connection
    await (0, database_1.connectDatabase)();
    // Initialize app if not already done
    if (!app) {
        app = (0, app_1.default)();
    }
    // Handle the request
    return app(req, res);
}
//# sourceMappingURL=index.js.map