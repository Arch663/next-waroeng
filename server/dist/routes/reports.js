"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const Transaction_1 = require("../models/Transaction");
const Purchase_1 = require("../models/Purchase");
const Product_1 = require("../models/Product");
const History_1 = require("../models/History");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const buildDateRangeFilter = (startDate, endDate) => {
    if (!startDate || !endDate)
        return undefined;
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    return { $gte: start, $lte: end };
};
// GET /api/reports/dashboard - Get dashboard statistics
router.get('/dashboard', auth_1.protect, async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        // Total products count
        const totalProducts = await Product_1.Product.countDocuments();
        // Low stock products (stock < 10)
        const lowStockProducts = await Product_1.Product.countDocuments({ stock: { $lt: 10 } });
        // Today's transactions
        const todayTransactions = await Transaction_1.Transaction.find({
            createdAt: { $gte: today, $lt: tomorrow },
        });
        const todayRevenue = todayTransactions.reduce((sum, t) => sum + t.totalAmount, 0);
        const todaySalesCount = todayTransactions.length;
        // This month's transactions
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        const monthTransactions = await Transaction_1.Transaction.find({
            createdAt: { $gte: monthStart },
        });
        const monthRevenue = monthTransactions.reduce((sum, t) => sum + t.totalAmount, 0);
        // Last 7 days sales data for chart
        const last7Days = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            date.setHours(0, 0, 0, 0);
            const nextDate = new Date(date);
            nextDate.setDate(nextDate.getDate() + 1);
            const dayTransactions = await Transaction_1.Transaction.find({
                createdAt: { $gte: date, $lt: nextDate },
            });
            const dayRevenue = dayTransactions.reduce((sum, t) => sum + t.totalAmount, 0);
            last7Days.push({
                date: date.toISOString().split('T')[0],
                revenue: dayRevenue,
                sales: dayTransactions.length,
            });
        }
        res.json({
            success: true,
            data: {
                overview: {
                    totalProducts,
                    lowStockProducts,
                    todayRevenue,
                    todaySalesCount,
                    monthRevenue,
                },
                last7Days,
            },
        });
    }
    catch (error) {
        console.error('Dashboard report error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching dashboard report'
        });
    }
});
// GET /api/reports/sales - Get sales report with date range
router.get('/sales', auth_1.protect, async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const filter = {};
        const createdAt = buildDateRangeFilter(startDate, endDate);
        if (createdAt) {
            filter.createdAt = createdAt;
        }
        const transactions = await Transaction_1.Transaction.find(filter).sort({ createdAt: -1 });
        const totalSales = transactions.length;
        const totalRevenue = transactions.reduce((sum, t) => sum + t.totalAmount, 0);
        const avgTransaction = totalSales > 0 ? totalRevenue / totalSales : 0;
        res.json({
            success: true,
            data: {
                transactions,
                summary: {
                    totalSales,
                    totalRevenue,
                    avgTransaction,
                },
            },
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching sales report'
        });
    }
});
// GET /api/reports/purchases - Get purchases report with date range
router.get('/purchases', auth_1.protect, async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const filter = {};
        const createdAt = buildDateRangeFilter(startDate, endDate);
        if (createdAt) {
            filter.createdAt = createdAt;
        }
        const purchases = await Purchase_1.Purchase.find(filter)
            .populate('supplierId', 'name contact')
            .sort({ createdAt: -1 });
        const totalPurchases = purchases.length;
        const totalSpent = purchases.reduce((sum, p) => sum + p.totalAmount, 0);
        res.json({
            success: true,
            data: {
                purchases,
                summary: {
                    totalPurchases,
                    totalSpent,
                },
            },
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching purchases report'
        });
    }
});
// GET /api/reports/history - Get stock movement history
router.get('/history', auth_1.protect, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const skip = (page - 1) * limit;
        const { productId, type } = req.query;
        const filter = {};
        if (productId) {
            filter.productId = productId;
        }
        if (type && ['sold', 'bought', 'adjusted'].includes(type)) {
            filter.type = type;
        }
        const [history, total] = await Promise.all([
            History_1.History.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            History_1.History.countDocuments(filter),
        ]);
        res.json({
            success: true,
            data: {
                history,
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
            message: 'Error fetching history'
        });
    }
});
// GET /api/reports/profit - Get profit analysis
router.get('/profit', auth_1.protect, async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const filter = {};
        const createdAt = buildDateRangeFilter(startDate, endDate);
        if (createdAt) {
            filter.createdAt = createdAt;
        }
        const transactions = await Transaction_1.Transaction.find(filter);
        const purchases = await Purchase_1.Purchase.find(filter);
        const totalRevenue = transactions.reduce((sum, t) => sum + t.totalAmount, 0);
        const totalPurchaseCost = purchases.reduce((sum, p) => sum + p.totalAmount, 0);
        const grossProfit = totalRevenue - totalPurchaseCost;
        const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
        res.json({
            success: true,
            data: {
                summary: {
                    totalRevenue,
                    totalPurchaseCost,
                    grossProfit,
                    profitMargin: parseFloat(profitMargin.toFixed(2)),
                },
                period: {
                    startDate,
                    endDate,
                },
            },
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching profit report'
        });
    }
});
exports.default = router;
//# sourceMappingURL=reports.js.map