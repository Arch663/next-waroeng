import { Router } from 'express';
import { body, param } from 'express-validator';
import mongoose from 'mongoose';
import { User, UserRole } from '../models/User';
import { protect, authorize, AuthRequest } from '../middleware/auth';
import { validateRequest } from '../utils/validator';

const router = Router();

router.use(protect);
router.use(authorize('admin', 'manager'));

// GET /api/users
router.get('/', async (req: AuthRequest, res) => {
  try {
    const users = await User.find({})
      .select('_id username fullName email role createdAt updatedAt')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while fetching users',
    });
  }
});

// PATCH /api/users/:id/role
router.patch(
  '/:id/role',
  [
    param('id').custom((value) => mongoose.Types.ObjectId.isValid(value)).withMessage('Invalid user id'),
    body('role').isIn(['admin', 'manager', 'cashier']).withMessage('Invalid role'),
  ],
  validateRequest,
  async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const { role } = req.body as { role: UserRole };
      const requesterRole = req.user?.role;
      const requesterId = req.user?.id;

      const targetUser = await User.findById(id);
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
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Server error while updating role',
      });
    }
  }
);

export default router;
