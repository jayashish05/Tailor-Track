const express = require('express');
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const Customer = require('../models/Customer');
const { isStaffOrAdmin } = require('../middleware/auth');
const router = express.Router();

// Get dashboard analytics
router.get('/dashboard', isStaffOrAdmin, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Date range filter
    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    // Total orders
    const totalOrders = await Order.countDocuments(dateFilter);

    // Orders by status
    const ordersByStatus = await Order.aggregate([
      { $match: dateFilter },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    // Total revenue
    const revenueData = await Payment.aggregate([
      { $match: { paymentStatus: 'completed', ...dateFilter } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$amount' },
        },
      },
    ]);

    const totalRevenue = revenueData[0]?.totalRevenue || 0;

    // Pending payments
    const pendingOrders = await Order.find({
      paymentStatus: { $in: ['pending', 'partial'] },
      ...dateFilter,
    });

    const totalPending = pendingOrders.reduce((sum, order) => sum + order.balanceAmount, 0);

    // Recent orders
    const recentOrders = await Order.find(dateFilter)
      .populate('customer', 'name phone')
      .sort({ createdAt: -1 })
      .limit(10);

    // Revenue by month (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const revenueByMonth = await Payment.aggregate([
      {
        $match: {
          paymentStatus: 'completed',
          createdAt: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          revenue: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    // Top customers
    const topCustomers = await Customer.find()
      .sort({ totalSpent: -1 })
      .limit(10)
      .select('name phone totalOrders totalSpent');

    // Payment methods distribution
    const paymentMethods = await Payment.aggregate([
      { $match: { paymentStatus: 'completed', ...dateFilter } },
      {
        $group: {
          _id: '$paymentMethod',
          count: { $sum: 1 },
          total: { $sum: '$amount' },
        },
      },
    ]);

    res.json({
      summary: {
        totalOrders,
        totalRevenue,
        totalPending,
        totalCustomers: await Customer.countDocuments(),
      },
      ordersByStatus,
      revenueByMonth,
      topCustomers,
      paymentMethods,
      recentOrders,
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// Get revenue stats
router.get('/revenue', isStaffOrAdmin, async (req, res) => {
  try {
    const { period = 'month' } = req.query;

    let startDate = new Date();
    if (period === 'week') {
      startDate.setDate(startDate.getDate() - 7);
    } else if (period === 'month') {
      startDate.setMonth(startDate.getMonth() - 1);
    } else if (period === 'year') {
      startDate.setFullYear(startDate.getFullYear() - 1);
    }

    const revenue = await Payment.aggregate([
      {
        $match: {
          paymentStatus: 'completed',
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: period === 'year' ? '%Y-%m' : '%Y-%m-%d',
              date: '$createdAt',
            },
          },
          revenue: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({ revenue });
  } catch (error) {
    console.error('Get revenue stats error:', error);
    res.status(500).json({ error: 'Failed to fetch revenue stats' });
  }
});

// Get order stats
router.get('/orders', isStaffOrAdmin, async (req, res) => {
  try {
    const stats = await Order.aggregate([
      {
        $facet: {
          byStatus: [{ $group: { _id: '$status', count: { $sum: 1 } } }],
          byMonth: [
            {
              $group: {
                _id: {
                  year: { $year: '$createdAt' },
                  month: { $month: '$createdAt' },
                },
                count: { $sum: 1 },
              },
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } },
          ],
          avgOrderValue: [
            {
              $group: {
                _id: null,
                avgValue: { $avg: '$totalAmount' },
              },
            },
          ],
        },
      },
    ]);

    res.json(stats[0]);
  } catch (error) {
    console.error('Get order stats error:', error);
    res.status(500).json({ error: 'Failed to fetch order stats' });
  }
});

module.exports = router;
