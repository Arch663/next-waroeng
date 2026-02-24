"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const mongoose_1 = __importDefault(require("mongoose"));
const User_1 = require("../models/User");
const auth_1 = require("../middleware/auth");
const validator_1 = require("../utils/validator");
const router = (0, express_1.Router)();
router.use(auth_1.protect);
router.use((0, auth_1.authorize)('admin', 'manager'));
// GET /api/users
router.get('/', async (req, res) => {
    try {
        const users = await User_1.User.find({})
            .select('_id username fullName email role createdAt updatedAt')
            .sort({ createdAt: -1 });
        res.json({
            success: true,
            data: users,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error while fetching users',
        });
    }
});
// PATCH /api/users/:id/role
router.patch('/:id/role', [
    (0, express_validator_1.param)('id').custom((value) => mongoose_1.default.Types.ObjectId.isValid(value)).withMessage('Invalid user id'),
    (0, express_validator_1.body)('role').isIn(['admin', 'manager', 'cashier']).withMessage('Invalid role'),
], validator_1.validateRequest, async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;
        const requesterRole = req.user?.role;
        const requesterId = req.user?.id;
        const targetUser = await User_1.User.findById(id);
        if (!targetUser) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }
        if (requesterRole === 'manager') {
            if (requesterId === String(targetUser._id)) {
                return res.status(403).json({
                    success: false,
                    message: 'Manager cannot change own role',
                });
            }
            if (!['admin', 'cashier'].includes(role)) {
                return res.status(403).json({
                    success: false,
                    message: 'Manager can only assign admin or cashier role',
                });
            }
        }
        if (requesterRole === 'admin') {
            if (targetUser.role === 'manager') {
                return res.status(403).json({
                    success: false,
                    message: 'Admin cannot modify manager role',
                });
            }
            if (!['admin', 'cashier'].includes(role)) {
                return res.status(403).json({
                    success: false,
                    message: 'Admin can only assign admin or cashier role',
                });
            }
        }
        targetUser.role = role;
        await targetUser.save();
        res.json({
            success: true,
            message: 'User role updated',
            data: {
                id: targetUser._id,
                role: targetUser.role,
            },
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error while updating role',
        });
    }
});
exports.default = router;
//# sourceMappingURL=users.js.map