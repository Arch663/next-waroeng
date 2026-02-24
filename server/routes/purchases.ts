import { Router, Response } from 'express';
import { body } from 'express-validator';
import { Purchase } from '../models/Purchase';
import { Product } from '../models/Product';
import { Supplier } from '../models/Supplier';
import { History } from '../models/History';
import { protect, AuthRequest } from '../middleware/auth';
import { validateRequest } from '../utils/validator';

const router = Router();

interface PurchaseItemInput {
  productId: string;
  quantity: number;
  buyPrice: number;
}

// POST /api/purchases - Create purchase (restock)
router.post(
  '/',
  protect,
  [
    body('supplierId').isMongoId().withMessage('Valid supplier ID is required'),
    body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
    body('items.*.productId').isMongoId().withMessage('Valid product ID is required'),
    body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
    body('items.*.buyPrice').isFloat({ min: 0 }).withMessage('Buy price must be a positive number'),
  ],
  validateRequest,
  async (req: AuthRequest, res: Response) => {
    try {
      const { supplierId, items } = req.body as {
        supplierId: string;
        items: PurchaseItemInput[];
      };

      // Validate supplier
      const supplier = await Supplier.findById(supplierId);
      if (!supplier) {
        return res.status(404).json({ 
          success: false, 
          message: 'Supplier not found' 
        });
      }

      // Validate products and process items
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

        const subtotal = item.quantity * item.buyPrice;
        totalAmount += subtotal;

        processedItems.push({
          productId: product._id,
          productName: product.name,
          quantity: item.quantity,
          buyPrice: item.buyPrice,
          subtotal,
        });
      }

      // Create purchase
      const purchase = await Purchase.create({
        items: processedItems,
        supplierId,
        supplierName: supplier.name,
        totalAmount,
      });

      // Update product stock and log history
      for (const item of processedItems) {
        const product = await Product.findById(item.productId);
        if (product) {
          const stockBefore = product.stock;
          product.stock += item.quantity;
          await product.save();

          await History.create({
            productId: product._id,
            productName: product.name,
            type: 'bought',
            quantity: item.quantity,
            stockBefore,
            stockAfter: product.stock,
            referenceId: purchase._id,
            notes: `Restocked from ${supplier.name}`,
          });
        }
      }

      res.status(201).json({
        success: true,
        message: 'Purchase completed successfully',
        data: purchase,
      });
    } catch (error) {
      console.error('Purchase error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error processing purchase' 
      });
    }
  }
);

// GET /api/purchases - Get all purchases
router.get('/', protect, async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const [purchases, total] = await Promise.all([
      Purchase.find()
        .populate('supplierId', 'name contact')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Purchase.countDocuments(),
    ]);

    res.json({
      success: true,
      data: {
        purchases,
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
      message: 'Error fetching purchases' 
    });
  }
});

// GET /api/purchases/:id - Get single purchase
router.get('/:id', protect, async (req, res) => {
  try {
    const purchase = await Purchase.findById(req.params.id).populate('supplierId');

    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: 'Purchase not found'
      });
    }

    res.json({
      success: true,
      data: purchase,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching purchase'
    });
  }
});

// DELETE /api/purchases/:id - Delete purchase
router.delete('/:id', protect, async (req, res) => {
  try {
    const purchase = await Purchase.findByIdAndDelete(req.params.id);

    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: 'Purchase not found'
      });
    }

    res.json({
      success: true,
      message: 'Purchase deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting purchase'
    });
  }
});

export default router;
