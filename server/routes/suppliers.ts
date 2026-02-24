import { Router } from 'express';
import { body, query } from 'express-validator';
import { Supplier } from '../models/Supplier';
import { protect } from '../middleware/auth';
import { validateRequest } from '../utils/validator';

const router = Router();

// GET /api/suppliers - Get all suppliers
router.get('/', async (req, res) => {
  try {
    const suppliers = await Supplier.find().sort({ name: 1 });
    
    res.json({
      success: true,
      data: suppliers,
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching suppliers' 
    });
  }
});

// GET /api/suppliers/:id - Get single supplier
router.get('/:id', async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    
    if (!supplier) {
      return res.status(404).json({ 
        success: false, 
        message: 'Supplier not found' 
      });
    }

    res.json({
      success: true,
      data: supplier,
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching supplier' 
    });
  }
});

// POST /api/suppliers - Create supplier
router.post(
  '/',
  protect,
  [
    body('name').trim().notEmpty().withMessage('Supplier name is required'),
    body('contact').trim().notEmpty().withMessage('Contact information is required'),
    body('address').trim().notEmpty().withMessage('Address is required'),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { name, contact, address } = req.body;

      const supplier = await Supplier.create({ name, contact, address });

      res.status(201).json({
        success: true,
        message: 'Supplier created successfully',
        data: supplier,
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: 'Error creating supplier' 
      });
    }
  }
);

// PUT /api/suppliers/:id - Update supplier
router.put(
  '/:id',
  protect,
  [
    body('name').optional().trim().notEmpty().withMessage('Supplier name cannot be empty'),
    body('contact').optional().trim().notEmpty().withMessage('Contact cannot be empty'),
    body('address').optional().trim().notEmpty().withMessage('Address cannot be empty'),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { name, contact, address } = req.body;

      const supplier = await Supplier.findByIdAndUpdate(
        req.params.id,
        { name, contact, address },
        { new: true, runValidators: true }
      );
      
      if (!supplier) {
        return res.status(404).json({ 
          success: false, 
          message: 'Supplier not found' 
        });
      }

      res.json({
        success: true,
        message: 'Supplier updated successfully',
        data: supplier,
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: 'Error updating supplier' 
      });
    }
  }
);

// DELETE /api/suppliers/:id - Delete supplier
router.delete('/:id', protect, async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    
    if (!supplier) {
      return res.status(404).json({ 
        success: false, 
        message: 'Supplier not found' 
      });
    }

    await Supplier.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Supplier deleted successfully',
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error deleting supplier' 
    });
  }
});

export default router;
