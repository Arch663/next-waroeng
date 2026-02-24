// @ts-nocheck
import { Router } from 'express';
import { body, query } from 'express-validator';
import { Product } from '../models/Product';
import { Category } from '../models/Category';
import { History } from '../models/History';
import { protect, AuthRequest } from '../middleware/auth';
import { validateRequest } from '../utils/validator';

const router = Router();

const buildCategoryAcronym = (categoryName: string): string => {
  const cleaned = categoryName.replace(/[^A-Za-z0-9\s]/g, ' ').trim();
  const words = cleaned.split(/\s+/).filter(Boolean);

  if (!words.length) return 'CAT';

  if (words.length === 1) {
    return words[0].slice(0, 3).toUpperCase().padEnd(3, 'X');
  }

  let acronym = words.map((w) => w[0]).join('').toUpperCase();
  if (acronym.length < 3) {
    const extra = words.join('').slice(acronym.length, 3).toUpperCase();
    acronym = `${acronym}${extra}`;
  }

  return acronym.slice(0, 3).padEnd(3, 'X');
};

const formatSku = (prefix: string, sequence: number): string => {
  return `${prefix}-${sequence.toString().padStart(3, '0')}`;
};

const generateCategorySku = async (categoryId: string): Promise<string> => {
  const category = await Category.findById(categoryId).select('name');
  if (!category) {
    throw new Error('Category not found for SKU generation');
  }

  const prefix = buildCategoryAcronym(category.name);
  const categoryProducts = await Product.find({ categoryId }).select('sku');

  let maxSeq = 0;
  for (const p of categoryProducts) {
    const match = p.sku?.match(new RegExp(`^${prefix}-(\\d+)$`));
    if (match) {
      const seq = parseInt(match[1], 10);
      if (!Number.isNaN(seq) && seq > maxSeq) maxSeq = seq;
    }
  }

  return formatSku(prefix, maxSeq + 1);
};

const resequenceCategorySkus = async (categoryId: string): Promise<void> => {
  const category = await Category.findById(categoryId).select('name');
  if (!category) return;

  const prefix = buildCategoryAcronym(category.name);
  const products = await Product.find({ categoryId }).sort({ createdAt: 1, _id: 1 });

  for (let i = 0; i < products.length; i += 1) {
    await Product.updateOne(
      { _id: products[i]._id },
      { $set: { sku: `TMP-${products[i]._id.toString()}` } }
    );
  }

  for (let i = 0; i < products.length; i += 1) {
    await Product.updateOne(
      { _id: products[i]._id },
      { $set: { sku: formatSku(prefix, i + 1) } }
    );
  }
};

// GET /api/products - Get all products with optional search and pagination
router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('search').optional().trim(),
    query('categoryId').optional().isMongoId(),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const search = req.query.search as string;
      const categoryId = req.query.categoryId as string;

      const filter: Record<string, unknown> = {};
      
      if (search) {
        filter.name = { $regex: search, $options: 'i' };
      }
      
      if (categoryId) {
        filter.categoryId = categoryId;
      }

      const skip = (page - 1) * limit;

      const [products, total] = await Promise.all([
        Product.find(filter)
          .populate('categoryId', 'name')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        Product.countDocuments(filter),
      ]);

      res.json({
        success: true,
        data: {
          products,
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
        message: 'Error fetching products' 
      });
    }
  }
);

// GET /api/products/:id - Get single product
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('categoryId', 'name');
    
    if (!product) {
      return res.status(404).json({ 
        success: false, 
        message: 'Product not found' 
      });
    }

    res.json({
      success: true,
      data: product,
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching product' 
    });
  }
});

// POST /api/products - Create product
router.post(
  '/',
  protect,
  [
    body('name').trim().notEmpty().withMessage('Product name is required'),
    body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
    body('costPrice').optional().isFloat({ min: 0 }).withMessage('Cost price must be a positive number'),
    body('stock').optional().isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
    body('categoryId').isMongoId().withMessage('Valid category ID is required'),
    body('unit').optional().isIn(['pcs', 'box', 'kg', 'liter', 'pack', 'bottle', 'can', 'sachet', 'cup']).withMessage('Invalid unit'),
    body('minStock').optional().isInt({ min: 0 }).withMessage('Minimum stock must be a non-negative integer'),
    body('image').optional().trim(),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { name, price, costPrice, stock, categoryId, unit, minStock, image } = req.body;

      const sku = await generateCategorySku(categoryId);

      const product = await Product.create({
        name,
        sku,
        price,
        costPrice: costPrice || 0,
        stock: stock || 0,
        categoryId,
        unit: unit || 'pcs',
        minStock: minStock || 5,
        image,
      });

      // Log history
      await History.create({
        productId: product._id,
        productName: product.name,
        type: 'adjusted',
        quantity: product.stock,
        stockBefore: 0,
        stockAfter: product.stock,
        notes: 'Initial stock',
      });

      res.status(201).json({
        success: true,
        message: 'Product created successfully',
        data: product,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error creating product'
      });
    }
  }
);

// PUT /api/products/:id - Update product
router.put(
  '/:id',
  protect,
  [
    body('name').optional().trim().notEmpty().withMessage('Product name cannot be empty'),
    body('price').optional().isFloat({ min: 0 }).withMessage('Price must be a positive number'),
    body('costPrice').optional().isFloat({ min: 0 }).withMessage('Cost price must be a positive number'),
    body('stock').optional().isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
    body('categoryId').optional().isMongoId().withMessage('Valid category ID is required'),
    body('unit').optional().isIn(['pcs', 'box', 'kg', 'liter', 'pack', 'bottle', 'can', 'sachet', 'cup']).withMessage('Invalid unit'),
    body('minStock').optional().isInt({ min: 0 }).withMessage('Minimum stock must be a non-negative integer'),
    body('image').optional().trim(),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const product = await Product.findById(req.params.id);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      const { name, price, costPrice, stock, categoryId, unit, minStock, image } = req.body;
      const stockBefore = product.stock;
      const previousCategoryId = product.categoryId.toString();
      const nextCategoryId = categoryId || previousCategoryId;

      Object.assign(product, {
        name: name || product.name,
        price: price !== undefined ? price : product.price,
        costPrice: costPrice !== undefined ? costPrice : product.costPrice,
        stock: stock !== undefined ? stock : product.stock,
        categoryId: categoryId || product.categoryId,
        unit: unit || product.unit,
        minStock: minStock !== undefined ? minStock : product.minStock,
        image: image !== undefined ? image : product.image,
      });

      await product.save();

      if (nextCategoryId !== previousCategoryId) {
        product.sku = await generateCategorySku(nextCategoryId);
        await product.save();
        await resequenceCategorySkus(previousCategoryId);
        await resequenceCategorySkus(nextCategoryId);
      }

      // Log history if stock changed
      if (stock !== undefined && stock !== stockBefore) {
        await History.create({
          productId: product._id,
          productName: product.name,
          type: 'adjusted',
          quantity: Math.abs(stock - stockBefore),
          stockBefore,
          stockAfter: stock,
          notes: 'Stock adjusted manually',
        });
      }

      res.json({
        success: true,
        message: 'Product updated successfully',
        data: product,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error updating product'
      });
    }
  }
);

// DELETE /api/products/:id - Delete product
router.delete('/:id', protect, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ 
        success: false, 
        message: 'Product not found' 
      });
    }

    const categoryId = product.categoryId.toString();
    await Product.findByIdAndDelete(req.params.id);
    await resequenceCategorySkus(categoryId);

    res.json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error deleting product' 
    });
  }
});

export default router;

