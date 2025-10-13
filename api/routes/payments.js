const express = require('express');
const razorpay = require('../config/razorpay');
const crypto = require('crypto');
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const { isAuthenticated, isStaffOrAdmin } = require('../middleware/auth');
const { paymentSchema } = require('../utils/validation');
const router = express.Router();

// Get all payments
router.get('/', isStaffOrAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 10, status = '' } = req.query;

    const query = status ? { paymentStatus: status } : {};

    const payments = await Payment.find(query)
      .populate('order', 'orderNumber barcode')
      .populate('customer', 'name phone')
      .populate('processedBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Payment.countDocuments(query);

    res.json({
      payments,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count,
    });
  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

// Get single payment
router.get('/:id', isAuthenticated, async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('order')
      .populate('customer')
      .populate('processedBy', 'name email');

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    res.json({ payment });
  } catch (error) {
    console.error('Get payment error:', error);
    res.status(500).json({ error: 'Failed to fetch payment' });
  }
});

// Create manual payment (staff/admin)
router.post('/', isStaffOrAdmin, async (req, res) => {
  try {
    // Validate input
    const { error, value } = paymentSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const order = await Order.findById(value.order);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Create payment
    const payment = await Payment.create({
      ...value,
      customer: order.customer,
      paymentStatus: 'completed',
      processedBy: req.user._id,
    });

    // Update order advance amount
    order.advanceAmount += value.amount;
    await order.save();

    const populatedPayment = await Payment.findById(payment._id)
      .populate('order', 'orderNumber barcode')
      .populate('customer', 'name phone');

    res.status(201).json({
      payment: populatedPayment,
      message: 'Payment recorded successfully',
    });
  } catch (error) {
    console.error('Create payment error:', error);
    res.status(500).json({ error: 'Failed to record payment' });
  }
});

// Create order (alias for create-razorpay-order)
router.post('/create-order', isAuthenticated, async (req, res) => {
  try {
    const { orderId, amount } = req.body;

    if (!orderId) {
      return res.status(400).json({ error: 'Order ID is required' });
    }

    const order = await Order.findById(orderId).populate('customer');

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Check if balance is already paid
    if (order.balanceAmount <= 0) {
      return res.status(400).json({ error: 'Order is already fully paid' });
    }

    // Create Razorpay order
    const options = {
      amount: Math.round(order.balanceAmount * 100), // amount in paise
      currency: 'INR',
      receipt: `order_${orderId}`,
      notes: {
        orderId: orderId.toString(),
        customerId: order.customer._id.toString(),
        orderNumber: order.orderNumber,
      },
    };

    const razorpayOrder = await razorpay.orders.create(options);

    res.json({
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      orderDetails: {
        orderNumber: order.orderNumber,
        customerName: order.customer.name,
      },
    });
  } catch (error) {
    console.error('Create Razorpay order error:', error);
    res.status(500).json({ error: 'Failed to create Razorpay order' });
  }
});

// Verify Razorpay payment (alias)
router.post('/verify', isAuthenticated, async (req, res) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, orderId } = req.body;

    // Verify signature
    const body = razorpayOrderId + '|' + razorpayPaymentId;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    if (expectedSignature !== razorpaySignature) {
      return res.status(400).json({ error: 'Invalid payment signature' });
    }

    // Fetch payment details from Razorpay
    const paymentDetails = await razorpay.payments.fetch(razorpayPaymentId);

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Create payment record
    const payment = await Payment.create({
      order: orderId,
      customer: order.customer,
      amount: paymentDetails.amount / 100,
      paymentMethod: 'razorpay',
      paymentStatus: 'completed',
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      transactionId: razorpayPaymentId,
    });

    // Update order
    order.advanceAmount += paymentDetails.amount / 100;
    await order.save();

    console.log('✅ Payment verified successfully for order:', orderId);

    res.json({
      success: true,
      message: 'Payment verified successfully',
      payment,
    });
  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({ error: 'Failed to verify payment' });
  }
});

// Verify Razorpay payment (original endpoint)
router.post('/verify-payment', isAuthenticated, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;

    // Verify signature
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ error: 'Invalid payment signature' });
    }

    // Fetch payment details from Razorpay
    const paymentDetails = await razorpay.payments.fetch(razorpay_payment_id);

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Create payment record
    const payment = await Payment.create({
      order: orderId,
      customer: order.customer,
      amount: paymentDetails.amount / 100, // Convert from paise
      paymentMethod: 'razorpay',
      paymentStatus: 'completed',
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
      transactionId: razorpay_payment_id,
    });

    // Update order
    order.advanceAmount += paymentDetails.amount / 100;
    await order.save();

    console.log('✅ Payment verified successfully for order:', orderId);

    res.json({
      success: true,
      message: 'Payment verified successfully',
      payment,
    });
  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({ error: 'Failed to verify payment' });
  }
});

// Razorpay webhook
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(JSON.stringify(req.body))
      .digest('hex');

    if (signature !== expectedSignature) {
      return res.status(400).json({ error: 'Invalid webhook signature' });
    }

    const event = req.body.event;
    const payloadData = req.body.payload.payment.entity;

    if (event === 'payment.captured') {
      try {
        const orderId = payloadData.notes?.orderId;
        const customerId = payloadData.notes?.customerId;

        if (orderId) {
          const order = await Order.findById(orderId);

          if (order) {
            // Create payment record
            await Payment.create({
              order: orderId,
              customer: customerId,
              amount: payloadData.amount / 100,
              paymentMethod: 'razorpay',
              paymentStatus: 'completed',
              razorpayOrderId: payloadData.order_id,
              razorpayPaymentId: payloadData.id,
              transactionId: payloadData.id,
            });

            // Update order
            order.advanceAmount += payloadData.amount / 100;
            await order.save();

            console.log('✅ Webhook: Payment captured for order:', orderId);
          }
        }
      } catch (error) {
        console.error('Error processing webhook:', error);
      }
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Get payments for an order
router.get('/order/:orderId', isAuthenticated, async (req, res) => {
  try {
    const payments = await Payment.find({ order: req.params.orderId })
      .populate('processedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({ payments });
  } catch (error) {
    console.error('Get order payments error:', error);
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

module.exports = router;
