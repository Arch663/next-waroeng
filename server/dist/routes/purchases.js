"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const Purchase_1 = require("../models/Purchase");
const Product_1 = require("../models/Product");
const Supplier_1 = require("../models/Supplier");
const History_1 = require("../models/History");
const auth_1 = require("../middleware/auth");
const validator_1 = require("../utils/validator");
const router = (0, express_1.Router)();
// POST /api/purchases - Create purchase (restock)
router.post('/', auth_1.protect, [
    (0, express_validator_1.body)('supplierId').isMongoId().withMessage('Valid supplier ID is required'),
    (0, express_validator_1.body)('items').isArray({ min: 1 }).withMessage('At least one item is required'),
    (0, express_validator_1.body)('items.*.productId').isMongoId().withMessage('Valid product ID is required'),
    (0, express_validator_1.body)('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
    (0, express_validator_1.body)('items.*.buyPrice').isFloat({ min: 0 }).withMessage('Buy price must be a positive number'),
], validator_1.validateRequest, async (req, res) => {
    try {
        const { supplierId, items } = req.body;
        // Validate supplier
        const supplier = await Supplier_1.Supplier.findById(supplierId);
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
            const product = await Product_1.Product.findById(item.productId);
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
        const purchase = await Purchase_1.Purchase.create({
            items: processedItems,
            supplierId,
            supplierName: supplier.name,
            totalAmount,
        });
        // Update product stock and log history
        for (const item of processedItems) {
            const product = await Product_1.Product.findById(item.productId);
            if (product) {
                const stockBefore = product.stock;
                product.stock += item.quantity;
                await product.save();
                await History_1.History.create({
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
    }
    catch (error) {
        console.error('Purchase error:', error);
        res.status(500).json({
            success: false,
            message: 'Error processing purchase'
        });
    }
});
// GET /api/purchases - Get all purchases
router.get('/', auth_1.protect, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;
        const [purchases, total] = await Promise.all([
            Purchase_1.Purchase.find()
                .populate('supplierId', 'name contact')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            Purchase_1.Purchase.countDocuments(),
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
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching purchases'
        });
    }
});
// GET /api/purchases/:id - Get single purchase
router.get('/:id', auth_1.protect, async (req, res) => {
    try {
        const purchase = await Purchase_1.Purchase.findById(req.params.id).populate('supplierId');
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
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching purchase'
        });
    }
});
// DELETE /api/purchases/:id - Delete purchase
router.delete('/:id', auth_1.protect, async (req, res) => {
    try {
        const purchase = await Purchase_1.Purchase.findByIdAndDelete(req.params.id);
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
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting purchase'
        });
    }
});
exports.default = router;
//# sourceMappingURL=purchases.js.map