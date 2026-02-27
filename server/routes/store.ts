// @ts-nocheck
import { Router, Response } from 'express';
import { body } from 'express-validator';
import { StoreBalance } from '../models/StoreBalance';
import { BalanceTransaction } from '../models/BalanceTransaction';
import { protect, AuthRequest } from '../middleware/auth';
import { validateRequest } from '../utils/validator';

const router = Router();

// Helper function to get or create store balance document
const getOrCreateStoreBalance = async () => {
  let storeBalance = await StoreBalance.findOne().sort({ createdAt: -1 });
  
  if (!storeBalance) {
    storeBalance = await StoreBalance.create({ balance: 0 });
  }
  
  return storeBalance;
};

// GET /api/store/balance - Get current balance
router.get(
  '/balance',
  protect,
  async (req, res) => {
    try {
      const storeBalance = await getOrCreateStoreBalance();
      
      res.json({
        success: true,
        data: {
          balance: storeBalance.balance,
          lastUpdated: storeBalance.lastUpdated,
        },
      });
    } catch (error) {
      console.error('Get balance error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching balance'
      });
    }
  }
);

// GET /api/store/balance/history - Get balance transaction history
router.get(
  '/balance/history',
  protect,
  async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const skip = (page - 1) * limit;
      const type = req.query.type as string;

      const query: any = {};
      if (type && ['deposit', 'withdraw', 'sale', 'purchase'].includes(type)) {
        query.type = type;
      }

      const [transactions, total] = await Promise.all([
        BalanceTransaction.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        BalanceTransaction.countDocuments(query),
      ]);

      res.json({
        success: true,
        data: {
          transactions,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
          },
        },
      });
    } catch (error) {
      console.error('Get balance history error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching balance history'
      });
    }
  }
);

// POST /api/store/balance/deposit - Add funds to store balance
router.post(
  '/balance/deposit',
  protect,
  [
    body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
    body('description').optional().isString().trim(),
  ],
  validateRequest,
  async (req: AuthRequest, res: Response) => {
    try {
      const { amount, description } = req.body as { 
        amount: number; 
        description?: string;
      };

      const storeBalance = await getOrCreateStoreBalance();
      
      const balanceBefore = storeBalance.balance;
      const balanceAfter = balanceBefore + amount;

      storeBalance.balance = balanceAfter;
      storeBalance.lastUpdated = new Date();
      await storeBalance.save();

      await BalanceTransaction.create({
        type: 'deposit',
        amount,
        balanceBefore,
        balanceAfter,
        description: description || 'Manual deposit',
        referenceType: 'manual',
      });

      res.json({
        success: true,
        message: 'Deposit successful',
        data: {
          balance: balanceAfter,
          amount,
        },
      });
    } catch (error) {
      console.error('Deposit error:', error);
      res.status(500).json({
        success: false,
        message: 'Error processing deposit'
      });
    }
  }
);

// POST /api/store/balance/withdraw - Withdraw funds from store balance
router.post(
  '/balance/withdraw',
  protect,
  [
    body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
    body('description').optional().isString().trim(),
  ],
  validateRequest,
  async (req: AuthRequest, res: Response) => {
    try {
      const { amount, description } = req.body as { 
        amount: number; 
        description?: string;
      };

      const storeBalance = await getOrCreateStoreBalance();
      
      if (storeBalance.balance < amount) {
        return res.status(400).json({
          success: false,
          message: 'Insufficient balance'
        });
      }

      const balanceBefore = storeBalance.balance;
      const balanceAfter = balanceBefore - amount;

      storeBalance.balance = balanceAfter;
      storeBalance.lastUpdated = new Date();
      await storeBalance.save();

      await BalanceTransaction.create({
        type: 'withdraw',
        amount,
        balanceBefore,
        balanceAfter,
        description: description || 'Manual withdrawal',
        referenceType: 'manual',
      });

      res.json({
        success: true,
        message: 'Withdrawal successful',
        data: {
          balance: balanceAfter,
          amount,
        },
      });
    } catch (error) {
      console.error('Withdraw error:', error);
      res.status(500).json({
        success: false,
        message: 'Error processing withdrawal'
      });
    }
  }
);

// Only admin and manager can modify balance
router.use(protect);

export default router;
