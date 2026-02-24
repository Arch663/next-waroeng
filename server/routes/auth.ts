// @ts-nocheck
import { Router } from 'express';
import { body } from 'express-validator';
import { User } from '../models/User';
import jwt from 'jsonwebtoken';
import { validateRequest } from '../utils/validator';

const router = Router();

// POST /api/auth/register
router.post(
  '/register',
  [
    body('username').trim().isLength({ min: 3, max: 30 }).withMessage('Username must be 3-30 characters'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('fullName').optional().trim().isLength({ min: 2, max: 100 }).withMessage('Full name must be 2-100 characters'),
    body('email').optional({ values: 'falsy' }).isEmail().withMessage('Please provide a valid email'),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { username, password, fullName, email } = req.body as {
        username: string;
        password: string;
        fullName?: string;
        email?: string;
      };

      const existingUser = await User.findOne({ username });
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'Username already exists',
        });
      }

      if (email) {
        const existingEmail = await User.findOne({ email: email.toLowerCase() });
        if (existingEmail) {
          return res.status(409).json({
            success: false,
            message: 'Email already exists',
          });
        }
      }

      const user = await User.create({
        username,
        password,
        fullName,
        email: email ? email.toLowerCase() : undefined,
        role: 'cashier',
      });

      const token = jwt.sign(
        { id: user._id, username: user.username, role: user.role },
        process.env.JWT_SECRET!,
        { expiresIn: '7d' }
      );

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
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Server error during registration',
      });
    }
  }
);

// POST /api/auth/login
router.post(
  '/login',
  [
    body('username').trim().notEmpty().withMessage('Username is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { username, password } = req.body;

      const user = await User.findOne({ username });
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

      const token = jwt.sign(
        { id: user._id, username: user.username, role: user.role },
        process.env.JWT_SECRET!,
        { expiresIn: '7d' }
      );

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
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: 'Server error during login' 
      });
    }
  }
);

export default router;
