"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const Supplier_1 = require("../models/Supplier");
const auth_1 = require("../middleware/auth");
const validator_1 = require("../utils/validator");
const router = (0, express_1.Router)();
// GET /api/suppliers - Get all suppliers
router.get('/', async (req, res) => {
    try {
        const suppliers = await Supplier_1.Supplier.find().sort({ name: 1 });
        res.json({
            success: true,
            data: suppliers,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching suppliers'
        });
    }
});
// GET /api/suppliers/:id - Get single supplier
router.get('/:id', async (req, res) => {
    try {
        const supplier = await Supplier_1.Supplier.findById(req.params.id);
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
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching supplier'
        });
    }
});
// POST /api/suppliers - Create supplier
router.post('/', auth_1.protect, [
    (0, express_validator_1.body)('name').trim().notEmpty().withMessage('Supplier name is required'),
    (0, express_validator_1.body)('contact').trim().notEmpty().withMessage('Contact information is required'),
    (0, express_validator_1.body)('address').trim().notEmpty().withMessage('Address is required'),
], validator_1.validateRequest, async (req, res) => {
    try {
        const { name, contact, address } = req.body;
        const supplier = await Supplier_1.Supplier.create({ name, contact, address });
        res.status(201).json({
            success: true,
            message: 'Supplier created successfully',
            data: supplier,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error creating supplier'
        });
    }
});
// PUT /api/suppliers/:id - Update supplier
router.put('/:id', auth_1.protect, [
    (0, express_validator_1.body)('name').optional().trim().notEmpty().withMessage('Supplier name cannot be empty'),
    (0, express_validator_1.body)('contact').optional().trim().notEmpty().withMessage('Contact cannot be empty'),
    (0, express_validator_1.body)('address').optional().trim().notEmpty().withMessage('Address cannot be empty'),
], validator_1.validateRequest, async (req, res) => {
    try {
        const { name, contact, address } = req.body;
        const supplier = await Supplier_1.Supplier.findByIdAndUpdate(req.params.id, { name, contact, address }, { new: true, runValidators: true });
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
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating supplier'
        });
    }
});
// DELETE /api/suppliers/:id - Delete supplier
router.delete('/:id', auth_1.protect, async (req, res) => {
    try {
        const supplier = await Supplier_1.Supplier.findById(req.params.id);
        if (!supplier) {
            return res.status(404).json({
                success: false,
                message: 'Supplier not found'
            });
        }
        await Supplier_1.Supplier.findByIdAndDelete(req.params.id);
        res.json({
            success: true,
            message: 'Supplier deleted successfully',
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting supplier'
        });
    }
});
exports.default = router;
//# sourceMappingURL=suppliers.js.map