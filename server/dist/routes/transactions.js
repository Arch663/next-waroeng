"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const Transaction_1 = require("../models/Transaction");
const Product_1 = require("../models/Product");
const History_1 = require("../models/History");
const auth_1 = require("../middleware/auth");
const validator_1 = require("../utils/validator");
const router = (0, express_1.Router)();
// POST /api/transactions - Create transaction (checkout)
router.post('/', auth_1.protect, [
    (0, express_validator_1.body)('items').isArray({ min: 1 }).withMessage('At least one item is required'),
    (0, express_validator_1.body)('items.*.productId').isMongoId().withMessage('Valid product ID is required'),
    (0, express_validator_1.body)('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
    (0, express_validator_1.body)('items.*.price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
    (0, express_validator_1.body)('cashPaid').isFloat({ min: 0 }).withMessage('Cash paid must be a positive number'),
], validator_1.validateRequest, async (req, res) => {
    try {
        const { items, cashPaid } = req.body;
        // Validate products and check stock
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
        const transaction = await Transaction_1.Transaction.create({
            items: processedItems,
            totalAmount,
            cashPaid,
            change,
        });
        // Update product stock and log history
        for (const item of processedItems) {
            const product = await Product_1.Product.findById(item.productId);
            if (product) {
                const stockBefore = product.stock;
                product.stock -= item.quantity;
                await product.save();
                await History_1.History.create({
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
        res.status(201).json({
            success: true,
            message: 'Transaction completed successfully',
            data: transaction,
        });
    }
    catch (error) {
        console.error('Transaction error:', error);
        res.status(500).json({
            success: false,
            message: 'Error processing transaction'
        });
    }
});
// GET /api/transactions - Get all transactions
router.get('/', auth_1.protect, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;
        const [transactions, total] = await Promise.all([
            Transaction_1.Transaction.find()
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            Transaction_1.Transaction.countDocuments(),
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
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching transactions'
        });
    }
});
// GET /api/transactions/:id - Get single transaction
router.get('/:id', auth_1.protect, async (req, res) => {
    try {
        const transaction = await Transaction_1.Transaction.findById(req.params.id);
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
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching transaction'
        });
    }
});
exports.default = router;
//# sourceMappingURL=transactions.js.map