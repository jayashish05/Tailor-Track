const express = require('express');
const Order = require('../models/OrderNew');
const { isAuthenticated } = require('./adminAuth');
const { generateBarcodeString, generateRandomCode } = require('../utils/barcode');
const { sendOrderTrackingSMS, sendStatusUpdateSMS } = require('../utils/whatsappService');
const router = express.Router();

// Create new order
router.post('/', isAuthenticated, async (req, res) => {
  try {
    const {
      customerName,
      phoneNumber,
      address,
      clothType,
      measurements,
      items,
      specialInstructions,
      expectedDeliveryDate,
      amount,
      advancePayment,
      discount,
    } = req.body;

    // Validation
    if (!customerName || !phoneNumber) {
      return res.status(400).json({ 
        error: 'Customer name and phone number are required' 
      });
    }

    // Support both old (single-item) and new (multi-item) formats
    if (!items || items.length === 0) {
      if (!clothType) {
        return res.status(400).json({ 
          error: 'Cloth type or items array is required' 
        });
      }
    }

    // Generate unique barcode
    let barcode;
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 10;

    while (!isUnique && attempts < maxAttempts) {
      barcode = generateRandomCode(10);
      const existing = await Order.findOne({ barcode });
      if (!existing) {
        isUnique = true;
      }
      attempts++;
    }

    if (!isUnique) {
      return res.status(500).json({ error: 'Failed to generate unique barcode' });
    }

    // Generate tracking link (use frontend URL, not API URL)
    // In production, this should be your Render frontend URL
    const baseUrl = process.env.FRONTEND_URL || 
                    (process.env.NODE_ENV === 'production' 
                      ? 'https://tailor-track-v1.onrender.com' 
                      : 'http://localhost:3002');
    const trackingLink = `${baseUrl}/track/${barcode}`;

    // Prepare order data
    const orderData = {
      barcode,
      customerName,
      phoneNumber,
      address,
      specialInstructions,
      expectedDeliveryDate,
      trackingLink,
      createdBy: req.session.adminName || req.session.adminId,
    };

    // Handle multi-item orders
    if (items && items.length > 0) {
      console.log('Creating multi-item order with items:', items);
      orderData.items = items;
      orderData.discount = discount || 0;
      // subtotal and amount will be calculated by the pre-save middleware
      orderData.advancePayment = advancePayment || 0;
    } else {
      console.log('Creating legacy single-item order with clothType:', clothType);
      // Backward compatibility for single-item orders
      orderData.clothType = clothType;
      orderData.measurements = measurements || {};
      orderData.amount = amount || 0;
      orderData.advancePayment = advancePayment || 0;
    }

    // Create order
    const order = new Order(orderData);

    console.log('Order data before save:', JSON.stringify(orderData, null, 2));

    await order.save();

    console.log(`✅ Order created: ${barcode} for ${customerName}`);
    console.log('Saved order items:', order.items);
    console.log('Saved order clothType:', order.clothType);

    // Send SMS
    try {
      const smsResult = await sendOrderTrackingSMS(
        phoneNumber,
        customerName,
        barcode,
        trackingLink
      );

      if (smsResult.success) {
        order.smsSent = true;
        order.smsSentAt = new Date();
        await order.save();
        console.log(`✅ SMS sent for order ${barcode}`);
      } else {
        console.error(`❌ Failed to send SMS for order ${barcode}:`, smsResult.error);
      }
    } catch (smsError) {
      console.error('SMS sending error:', smsError);
    }

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      order: {
        id: order._id,
        barcode: order.barcode,
        customerName: order.customerName,
        phoneNumber: order.phoneNumber,
        trackingLink: order.trackingLink,
        smsSent: order.smsSent,
        status: order.status,
      },
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// Get all orders (with pagination and search)
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const { page = 1, limit = 20, search, status, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    // Build query
    let query = {};

    if (search) {
      query.$or = [
        { barcode: { $regex: search, $options: 'i' } },
        { customerName: { $regex: search, $options: 'i' } },
        { phoneNumber: { $regex: search, $options: 'i' } },
      ];
    }

    if (status && status !== 'all') {
      query.status = status;
    }

    // Execute query with pagination
    const orders = await Order.find(query)
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const totalOrders = await Order.countDocuments(query);

    res.json({
      success: true,
      orders,
      totalPages: Math.ceil(totalOrders / limit),
      currentPage: parseInt(page),
      total: totalOrders,
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Get single order by ID
router.get('/:id', isAuthenticated, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({ success: true, order });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// Update order
router.patch('/:id', isAuthenticated, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const {
      customerName,
      phoneNumber,
      address,
      clothType,
      measurements,
      specialInstructions,
      expectedDeliveryDate,
      amount,
      advancePayment,
      status,
    } = req.body;

    // Track status change for SMS
    const statusChanged = status && status !== order.status;
    const oldStatus = order.status;

    // Update fields
    if (customerName) order.customerName = customerName;
    if (phoneNumber) order.phoneNumber = phoneNumber;
    if (address !== undefined) order.address = address;
    if (clothType) order.clothType = clothType;
    if (measurements) order.measurements = { ...order.measurements, ...measurements };
    if (specialInstructions !== undefined) order.specialInstructions = specialInstructions;
    if (expectedDeliveryDate) order.expectedDeliveryDate = expectedDeliveryDate;
    if (amount !== undefined) order.amount = amount;
    if (advancePayment !== undefined) order.advancePayment = advancePayment;
    if (status) order.status = status;

    await order.save();

    console.log(`✅ Order updated: ${order.barcode}`);

    // Send SMS for status update
    if (statusChanged) {
      try {
        const smsResult = await sendStatusUpdateSMS(
          order.phoneNumber,
          order.customerName,
          order.barcode,
          status,
          order.trackingLink
        );

        if (smsResult.success) {
          console.log(`✅ Status update SMS sent for order ${order.barcode}`);
        }
      } catch (smsError) {
        console.error('SMS sending error:', smsError);
      }
    }

    res.json({
      success: true,
      message: 'Order updated successfully',
      order,
    });
  } catch (error) {
    console.error('Update order error:', error);
    res.status(500).json({ error: 'Failed to update order' });
  }
});

// Full update order (PUT)
router.put('/:id', isAuthenticated, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const {
      customerName,
      phoneNumber,
      address,
      clothType,
      measurements,
      specialInstructions,
      expectedDeliveryDate,
      amount,
      advancePayment,
    } = req.body;

    // Update all fields (no status update here)
    if (customerName) order.customerName = customerName;
    if (phoneNumber) order.phoneNumber = phoneNumber;
    if (address !== undefined) order.address = address;
    if (clothType) order.clothType = clothType;
    if (measurements) order.measurements = measurements;
    if (specialInstructions !== undefined) order.specialInstructions = specialInstructions;
    if (expectedDeliveryDate !== undefined) order.expectedDeliveryDate = expectedDeliveryDate;
    if (amount !== undefined) order.amount = amount;
    if (advancePayment !== undefined) order.advancePayment = advancePayment;

    await order.save();

    console.log(`✅ Order fully updated: ${order.barcode}`);

    res.json({
      success: true,
      message: 'Order updated successfully',
      order,
    });
  } catch (error) {
    console.error('Full update order error:', error);
    res.status(500).json({ error: 'Failed to update order' });
  }
});

// Update order status only (with WhatsApp notification)
router.patch('/:id/status', isAuthenticated, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    const oldStatus = order.status;
    order.status = status;

    await order.save();

    console.log(`✅ Order status updated: ${order.barcode} from ${oldStatus} to ${status}`);

    // Send WhatsApp notification for status change
    try {
      const smsResult = await sendStatusUpdateSMS(
        order.phoneNumber,
        order.customerName,
        order.barcode,
        status,
        order.trackingLink
      );

      if (smsResult.success) {
        console.log(`✅ Status update WhatsApp sent for order ${order.barcode}`);
      } else {
        console.error(`❌ Failed to send WhatsApp for order ${order.barcode}:`, smsResult.error);
      }
    } catch (smsError) {
      console.error('WhatsApp sending error:', smsError);
    }

    res.json({
      success: true,
      message: 'Status updated successfully',
      order,
    });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// Delete order
router.delete('/:id', isAuthenticated, async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);

    if (!order) {
      return res.status(404).json({ 
        success: false,
        error: 'Order not found' 
      });
    }

    console.log(`✅ Order deleted: ${order.barcode}`);

    res.json({ 
      success: true,
      message: 'Order deleted successfully' 
    });
  } catch (error) {
    console.error('Delete order error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to delete order' 
    });
  }
});

// Get order statistics
router.get('/stats/dashboard', isAuthenticated, async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments();
    
    // Get orders by status
    const statusAggregation = await Order.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    // Convert array to object for easier access
    const ordersByStatus = {};
    statusAggregation.forEach(item => {
      ordersByStatus[item._id] = item.count;
    });

    // Get revenue stats
    const revenueAggregation = await Order.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
          collected: { $sum: '$advancePayment' },
          pending: { $sum: '$balanceAmount' },
        },
      },
    ]);

    const revenue = revenueAggregation[0] || { total: 0, collected: 0, pending: 0 };

    // Get recent orders
    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    // Today's orders
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const todayOrders = await Order.countDocuments({
      createdAt: { $gte: startOfDay },
    });

    res.json({
      success: true,
      stats: {
        totalOrders,
        ordersByStatus,
        revenue,
        recentOrders,
        todayOrders,
      },
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch statistics' 
    });
  }
});

// Resend tracking SMS
router.post('/:id/resend-sms', isAuthenticated, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const smsResult = await sendOrderTrackingSMS(
      order.phoneNumber,
      order.customerName,
      order.barcode,
      order.trackingLink
    );

    if (smsResult.success) {
      order.smsSent = true;
      order.smsSentAt = new Date();
      await order.save();

      res.json({ success: true, message: 'SMS sent successfully' });
    } else {
      console.error('SMS sending failed:', smsResult.error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to send SMS', 
        details: smsResult.error 
      });
    }
  } catch (error) {
    console.error('Resend SMS error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to resend SMS',
      details: error.message 
    });
  }
});

module.exports = router;
