// @ts-nocheck
import { Router, Request, Response } from 'express';
import { Transaction } from '../models/Transaction';
import { Purchase } from '../models/Purchase';
import { Product } from '../models/Product';
import { History } from '../models/History';
import { protect } from '../middleware/auth';

const router = Router();

const buildDateRangeFilter = (startDate?: string, endDate?: string) => {
  if (!startDate || !endDate) return undefined;
  const start = new Date(startDate);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);
  return { $gte: start, $lte: end };
};

// GET /api/reports/dashboard - Get dashboard statistics
router.get('/dashboard', protect, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Total products count
    const totalProducts = await Product.countDocuments();

    // Low stock products (stock < 10)
    const lowStockProducts = await Product.countDocuments({ stock: { $lt: 10 } });

    // Today's transactions
    const todayTransactions = await Transaction.find({
      createdAt: { $gte: today, $lt: tomorrow },
    });

    const todayRevenue = todayTransactions.reduce((sum, t) => sum + t.totalAmount, 0);
    const todaySalesCount = todayTransactions.length;

    // This month's transactions
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthTransactions = await Transaction.find({
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

      const dayTransactions = await Transaction.find({
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
  } catch (error) {
    console.error('Dashboard report error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching dashboard report' 
    });
  }
});

// GET /api/reports/sales - Get sales report with date range
router.get('/sales', protect, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const filter: Record<string, unknown> = {};
    
    const createdAt = buildDateRangeFilter(startDate as string | undefined, endDate as string | undefined);
    if (createdAt) {
      filter.createdAt = createdAt;
    }

    const transactions = await Transaction.find(filter as any).sort({ createdAt: -1 });

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
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching sales report' 
    });
  }
});

// GET /api/reports/purchases - Get purchases report with date range
router.get('/purchases', protect, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const filter: Record<string, unknown> = {};
    
    const createdAt = buildDateRangeFilter(startDate as string | undefined, endDate as string | undefined);
    if (createdAt) {
      filter.createdAt = createdAt;
    }

    const purchases = await Purchase.find(filter as any)
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
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching purchases report' 
    });
  }
});

// GET /api/reports/history - Get stock movement history
router.get('/history', protect, async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = (page - 1) * limit;
    const { productId, type } = req.query;

    const filter: Record<string, unknown> = {};
    
    if (productId) {
      filter.productId = productId;
    }
    
    if (type && ['sold', 'bought', 'adjusted'].includes(type as string)) {
      filter.type = type;
    }

    const [history, total] = await Promise.all([
      History.find(filter as any)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      History.countDocuments(filter as any),
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
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching history' 
    });
  }
});

// GET /api/reports/profit - Get profit analysis
router.get('/profit', protect, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const filter: Record<string, unknown> = {};
    
    const createdAt = buildDateRangeFilter(startDate as string | undefined, endDate as string | undefined);
    if (createdAt) {
      filter.createdAt = createdAt;
    }

    const transactions = await Transaction.find(filter as any);
    const purchases = await Purchase.find(filter as any);

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
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching profit report' 
    });
  }
});

export default router;
