const express = require('express');
const Order = require('../models/Order');
const Customer = require('../models/Customer');
const { isAuthenticated, isStaffOrAdmin } = require('../middleware/auth');
const { orderSchema, orderStatusSchema } = require('../utils/validation');
const {
  generateBarcodeString,
  generateBarcodeImage,
  generateOrderNumber,
} = require('../utils/barcode');
const { notifyOrderReadyForPickup } = require('../utils/emailService');
const router = express.Router();

// Get all orders
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const { page = 1, limit = 10, status = '', search = '' } = req.query;

    let query = {};

    // Customers can only see their own orders
    if (req.user.role === 'customer') {
      const customer = await Customer.findOne({ userId: req.user._id });
      if (customer) {
        query.customer = customer._id;
      } else {
        return res.json({ orders: [], totalPages: 0, currentPage: page, total: 0 });
      }
    }

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Search by order number or barcode
    if (search) {
      query.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { barcode: { $regex: search, $options: 'i' } },
      ];
    }

    const orders = await Order.find(query)
      .populate('customer', 'name phone email')
      .populate('createdBy', 'name email')
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Order.countDocuments(query);

    res.json({
      orders,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count,
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Get single order
router.get('/:id', isAuthenticated, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('customer')
      .populate('createdBy', 'name email')
      .populate('assignedTo', 'name email')
      .populate('statusHistory.updatedBy', 'name email');

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Customers can only view their own orders
    if (req.user.role === 'customer') {
      const customer = await Customer.findOne({ userId: req.user._id });
      if (!customer || order.customer._id.toString() !== customer._id.toString()) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    res.json({ order });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// Track order by barcode (public)
router.get('/track/:barcode', async (req, res) => {
  try {
    const order = await Order.findOne({ barcode: req.params.barcode })
      .populate('customer', 'name phone')
      .populate('statusHistory.updatedBy', 'name')
      .select('-createdBy -assignedTo');

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({ order });
  } catch (error) {
    console.error('Track order error:', error);
    res.status(500).json({ error: 'Failed to track order' });
  }
});

// Create order (Customer-friendly endpoint)
router.post('/', isAuthenticated, async (req, res) => {
  try {
    let customerId;
    
    // If customer is placing order themselves
    if (req.user.role === 'customer') {
      // Find or create customer record
      let customer = await Customer.findOne({ userId: req.user._id });
      
      if (!customer) {
        // Create customer record from user data
        customer = await Customer.create({
          userId: req.user._id,
          name: req.body.customerName || req.user.name,
          phone: req.body.customerPhone,
          email: req.user.email,
        });
      } else {
        // Update customer info if provided
        if (req.body.customerName) customer.name = req.body.customerName;
        if (req.body.customerPhone) customer.phone = req.body.customerPhone;
        await customer.save();
      }
      
      customerId = customer._id;
    } else {
      // Staff/Admin creating order for a customer
      customerId = req.body.customer;
    }

    // Process items (customers send simplified format)
    const processedItems = req.body.items.map(item => ({
      itemType: item.type || item.itemType,
      description: item.measurements || item.description || `${item.type} order`,
      quantity: item.quantity || 1,
      measurements: typeof item.measurements === 'object' ? item.measurements : { notes: item.measurements },
      price: item.price || 0, // Staff can set price later
    }));

    // Calculate total amount
    const totalAmount = processedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Generate barcode and order number
    const barcode = generateBarcodeString();
    const orderNumber = await generateOrderNumber();

    // Create order
    const order = await Order.create({
      customer: customerId,
      items: processedItems,
      orderNumber,
      barcode,
      totalAmount,
      dueDate: req.body.deliveryDate || req.body.dueDate,
      deliveryDate: req.body.deliveryDate,
      notes: req.body.instructions || req.body.notes,
      createdBy: req.user._id,
      status: 'received',
      statusHistory: [
        {
          status: 'received',
          updatedBy: req.user._id,
          timestamp: new Date(),
          notes: 'Order placed by customer',
        },
      ],
    });

    // Update customer stats
    await Customer.findByIdAndUpdate(customerId, {
      $inc: { totalOrders: 1, totalSpent: totalAmount },
    });

    const populatedOrder = await Order.findById(order._id)
      .populate('customer', 'name phone email')
      .populate('createdBy', 'name email');

    res.status(201).json({
      order: populatedOrder,
      message: 'Order created successfully',
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ error: 'Failed to create order', details: error.message });
  }
});

// Update order status
router.patch('/:id/status', isStaffOrAdmin, async (req, res) => {
  try {
    // Validate input
    const { error, value } = orderStatusSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Update status
    order.status = value.status;
    order.statusHistory.push({
      status: value.status,
      updatedBy: req.user._id,
      timestamp: new Date(),
      notes: value.notes,
    });

    // Set delivery date if status is delivered
    if (value.status === 'delivered' && !order.deliveryDate) {
      order.deliveryDate = new Date();
    }

    await order.save();

    const populatedOrder = await Order.findById(order._id)
      .populate('customer')
      .populate('statusHistory.updatedBy', 'name email');

    // Send email notification if status is "ready" (Ready to Pickup)
    if (value.status === 'ready' && populatedOrder.customer) {
      try {
        await notifyOrderReadyForPickup(populatedOrder, populatedOrder.customer);
        console.log('✅ Email notification sent for order ready:', order.orderNumber);
      } catch (emailError) {
        console.error('⚠️ Failed to send email notification:', emailError.message);
        // Don't fail the request if email fails
      }
    }

    res.json({
      order: populatedOrder,
      message: 'Order status updated successfully',
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

// Mark order as picked up (Customer endpoint)
router.patch('/:id/pickup', isAuthenticated, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Verify customer owns this order
    if (req.user.role === 'customer') {
      const customer = await Customer.findOne({ userId: req.user._id });
      if (!customer || order.customer.toString() !== customer._id.toString()) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    // Order must be in 'ready' status to be picked up
    if (order.status !== 'ready') {
      return res.status(400).json({ error: 'Order is not ready for pickup yet' });
    }

    // Check if payment is required and completed
    if (order.totalAmount > 0 && order.paymentStatus !== 'paid') {
      return res.status(400).json({ error: 'Payment required before pickup. Please complete payment first.' });
    }

    // Update to delivered
    order.status = 'delivered';
    order.deliveryDate = new Date();
    order.statusHistory.push({
      status: 'delivered',
      updatedBy: req.user._id,
      timestamp: new Date(),
      notes: 'Picked up by customer',
    });

    await order.save();

    const populatedOrder = await Order.findById(order._id)
      .populate('customer', 'name phone email');

    res.json({
      order: populatedOrder,
      message: 'Order marked as picked up successfully',
    });
  } catch (error) {
    console.error('Pickup order error:', error);
    res.status(500).json({ error: 'Failed to mark order as picked up' });
  }
});

// Update order
router.put('/:id', isStaffOrAdmin, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Update allowed fields
    const allowedUpdates = ['items', 'advanceAmount', 'dueDate', 'notes', 'assignedTo'];
    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) {
        order[field] = req.body[field];
      }
    });

    // Recalculate total if items changed
    if (req.body.items) {
      order.totalAmount = req.body.items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );
    }

    await order.save();

    const populatedOrder = await Order.findById(order._id)
      .populate('customer')
      .populate('createdBy', 'name email')
      .populate('assignedTo', 'name email');

    res.json({
      order: populatedOrder,
      message: 'Order updated successfully',
    });
  } catch (error) {
    console.error('Update order error:', error);
    res.status(500).json({ error: 'Failed to update order' });
  }
});

// Delete order
router.delete('/:id', isStaffOrAdmin, async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({ message: 'Order deleted successfully' });
  } catch (error) {
    console.error('Delete order error:', error);
    res.status(500).json({ error: 'Failed to delete order' });
  }
});

// Get barcode image
router.get('/:id/barcode', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const barcodeImage = await generateBarcodeImage(order.barcode);

    res.setHeader('Content-Type', 'image/png');
    res.send(barcodeImage);
  } catch (error) {
    console.error('Generate barcode error:', error);
    res.status(500).json({ error: 'Failed to generate barcode' });
  }
});

module.exports = router;
