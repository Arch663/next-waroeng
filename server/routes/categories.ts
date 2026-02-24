// @ts-nocheck
import { Router } from 'express';
import { body, query } from 'express-validator';
import { Category } from '../models/Category';
import { protect } from '../middleware/auth';
import { validateRequest } from '../utils/validator';

const router = Router();

// GET /api/categories - Get all categories
router.get('/', async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    
    res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching categories' 
    });
  }
});

// GET /api/categories/:id - Get single category
router.get('/:id', async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    
    if (!category) {
      return res.status(404).json({ 
        success: false, 
        message: 'Category not found' 
      });
    }

    res.json({
      success: true,
      data: category,
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching category' 
    });
  }
});

// POST /api/categories - Create category
router.post(
  '/',
  protect,
  [
    body('name').trim().notEmpty().withMessage('Category name is required'),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { name } = req.body;

      const existingCategory = await Category.findOne({ name });
      if (existingCategory) {
        return res.status(400).json({ 
          success: false, 
          message: 'Category already exists' 
        });
      }

      const category = await Category.create({ name });

      res.status(201).json({
        success: true,
        message: 'Category created successfully',
        data: category,
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: 'Error creating category' 
      });
    }
  }
);

// PUT /api/categories/:id - Update category
router.put(
  '/:id',
  protect,
  [
    body('name').trim().notEmpty().withMessage('Category name is required'),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { name } = req.body;

      const existingCategory = await Category.findOne({ name, _id: { $ne: req.params.id } });
      if (existingCategory) {
        return res.status(400).json({ 
          success: false, 
          message: 'Category name already exists' 
        });
      }

      const category = await Category.findByIdAndUpdate(
        req.params.id,
        { name },
        { new: true, runValidators: true }
      );
      
      if (!category) {
        return res.status(404).json({ 
          success: false, 
          message: 'Category not found' 
        });
      }

      res.json({
        success: true,
        message: 'Category updated successfully',
        data: category,
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: 'Error updating category' 
      });
    }
  }
);

// DELETE /api/categories/:id - Delete category
router.delete('/:id', protect, async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    
    if (!category) {
      return res.status(404).json({ 
        success: false, 
        message: 'Category not found' 
      });
    }

    await Category.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Category deleted successfully',
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error deleting category' 
    });
  }
});

export default router;
