"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorize = exports.protect = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const protect = async (req, res, next) => {
    try {
        let token;
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized to access this route'
            });
        }
        try {
            const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
            req.user = decoded;
            next();
        }
        catch (error) {
            return res.status(401).json({
                success: false,
                message: 'Invalid token'
            });
        }
    }
    catch (error) {
        next(error);
    }
};
exports.protect = protect;
/**
 * Middleware to restrict access to specific roles
 * @param allowedRoles - Array of roles that are allowed to access the route
 */
const authorize = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to access this resource'
            });
        }
        next();
    };
};
exports.authorize = authorize;
//# sourceMappingURL=auth.js.map