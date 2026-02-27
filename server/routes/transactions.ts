// @ts-nocheck
import { Router, Response } from 'express';
import { body } from 'express-validator';
import { Transaction } from '../models/Transaction';
import { Product } from '../models/Product';
import { History } from '../models/History';
import { StoreBalance } from '../models/StoreBalance';
import { BalanceTransaction } from '../models/BalanceTransaction';
import { protect, AuthRequest } from '../middleware/auth';
import { validateRequest } from '../utils/validator';

const router = Router();

interface TransactionItemInput {
  productId: string;
  quantity: number;
  price: number;
}

// POST /api/transactions - Create transaction (checkout)
router.post(
  '/',
  protect,
  [
    body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
    body('items.*.productId').isMongoId().withMessage('Valid product ID is required'),
    body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
    body('items.*.price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
    body('cashPaid').isFloat({ min: 0 }).withMessage('Cash paid must be a positive number'),
  ],
  validateRequest,
  async (req: AuthRequest, res: Response) => {
    try {
      const { items, cashPaid } = req.body as {
        items: TransactionItemInput[];
        cashPaid: number;
      };

      // Validate products and check stock
      const processedItems = [];
      let totalAmount = 0;

      for (const item of items) {
        const product = await Product.findById(item.productId);
        
        if (!product) {
          return res.status(404).json({ 
            success: false, 
            message: `Product ${item.productId} not found` 
          });
        }

        if (product.stock < item.quantity) {
          return res.status(400).json({ 
            success: false, 
            message: `Insufficient stock for ${product.name}. Available: ${product.stock}` 
          });
        }

        const subtotal = item.quantity * item.price;
        totalAmount += subtotal;

        processedItems.push({
          productId: product._id,
          productName: product.name,
          quantity: item.quantity,
          price: item.price,
          subtotal,
        });
      }

      const change = cashPaid - totalAmount;

      if (change < 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'Cash paid is less than total amount' 
        });
      }

      // Create transaction
      const transaction = await Transaction.create({
        items: processedItems,
        totalAmount,
        cashPaid,
        change,
      });

      // Update product stock and log history
      for (const item of processedItems) {
        const product = await Product.findById(item.productId);
        if (product) {
          const stockBefore = product.stock;
          product.stock -= item.quantity;
          await product.save();

          await History.create({
            productId: product._id,
            productName: product.name,
            type: 'sold',
            quantity: item.quantity,
            stockBefore,
            stockAfter: product.stock,
            referenceId: transaction._id,
          });
        }
      }

      // Update store balance with sale amount
      let storeBalance = await StoreBalance.findOne().sort({ createdAt: -1 });
      if (!storeBalance) {
        storeBalance = await StoreBalance.create({ balance: 0 });
      }

      const balanceBefore = storeBalance.balance;
      const balanceAfter = balanceBefore + totalAmount;

      storeBalance.balance = balanceAfter;
      storeBalance.lastUpdated = new Date();
      await storeBalance.save();

      await BalanceTransaction.create({
        type: 'sale',
        amount: totalAmount,
        balanceBefore,
        balanceAfter,
        description: `Sale transaction`,
        referenceId: transaction._id,
        referenceType: 'transaction',
      });

      res.status(201).json({
        success: true,
        message: 'Transaction completed successfully',
        data: {
          transaction,
          balance: balanceAfter,
        },
      });
    } catch (error) {
      console.error('Transaction error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error processing transaction' 
      });
    }
  }
);

// GET /api/transactions - Get all transactions
router.get('/', protect, async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const [transactions, total] = await Promise.all([
      Transaction.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Transaction.countDocuments(),
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
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching transactions' 
    });
  }
});

// GET /api/transactions/:id - Get single transaction
router.get('/:id', protect, async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    
    if (!transaction) {
      return res.status(404).json({ 
        success: false, 
        message: 'Transaction not found' 
      });
    }

    res.json({
      success: true,
      data: transaction,
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching transaction' 
    });
  }
});

export default router;
