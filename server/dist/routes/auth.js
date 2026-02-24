"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const User_1 = require("../models/User");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const validator_1 = require("../utils/validator");
const router = (0, express_1.Router)();
// POST /api/auth/register
router.post('/register', [
    (0, express_validator_1.body)('username').trim().isLength({ min: 3, max: 30 }).withMessage('Username must be 3-30 characters'),
    (0, express_validator_1.body)('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    (0, express_validator_1.body)('fullName').optional().trim().isLength({ min: 2, max: 100 }).withMessage('Full name must be 2-100 characters'),
    (0, express_validator_1.body)('email').optional({ values: 'falsy' }).isEmail().withMessage('Please provide a valid email'),
], validator_1.validateRequest, async (req, res) => {
    try {
        const { username, password, fullName, email } = req.body;
        const existingUser = await User_1.User.findOne({ username });
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: 'Username already exists',
            });
        }
        if (email) {
            const existingEmail = await User_1.User.findOne({ email: email.toLowerCase() });
            if (existingEmail) {
                return res.status(409).json({
                    success: false,
                    message: 'Email already exists',
                });
            }
        }
        const user = await User_1.User.create({
            username,
            password,
            fullName,
            email: email ? email.toLowerCase() : undefined,
            role: 'cashier',
        });
        const token = jsonwebtoken_1.default.sign({ id: user._id, username: user.username, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
        res.status(201).json({
            success: true,
            message: 'Registration successful',
            data: {
                token,
                user: {
                    id: user._id,
                    username: user.username,
                    role: user.role,
                    email: user.email,
                    fullName: user.fullName,
                },
            },
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error during registration',
        });
    }
});
// POST /api/auth/login
router.post('/login', [
    (0, express_validator_1.body)('username').trim().notEmpty().withMessage('Username is required'),
    (0, express_validator_1.body)('password').notEmpty().withMessage('Password is required'),
], validator_1.validateRequest, async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User_1.User.findOne({ username });
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }
        const token = jsonwebtoken_1.default.sign({ id: user._id, username: user.username, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
        res.json({
            success: true,
            message: 'Login successful',
            data: {
                token,
                user: {
                    id: user._id,
                    username: user.username,
                    role: user.role,
                    email: user.email,
                    fullName: user.fullName,
                },
            },
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error during login'
        });
    }
});
exports.default = router;
//# sourceMappingURL=auth.js.map