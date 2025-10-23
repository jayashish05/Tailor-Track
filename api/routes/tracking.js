const express = require('express');
const Order = require('../models/OrderNew');
const router = express.Router();

// Public route - Track order by barcode
router.get('/:barcode', async (req, res) => {
  try {
    const { barcode } = req.params;

    if (!barcode) {
      return res.status(400).json({ 
        success: false,
        error: 'Barcode is required' 
      });
    }

    // Find order by barcode
    const order = await Order.findOne({ barcode: barcode.toUpperCase() }).lean();

    if (!order) {
      return res.status(404).json({ 
        success: false,
        error: 'Order not found',
        message: 'Invalid barcode or order does not exist',
      });
    }

    // Return customer-safe information
    const orderInfo = {
      barcode: order.barcode,
      customerName: order.customerName,
      clothType: order.clothType,
      items: order.items || [],
      status: order.status,
      expectedDeliveryDate: order.expectedDeliveryDate,
      amount: order.amount,
      advancePayment: order.advancePayment,
      balanceAmount: order.balanceAmount,
      specialInstructions: order.specialInstructions,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      statusHistory: order.statusHistory || [],
    };

    res.json({ 
      success: true,
      order: orderInfo 
    });
  } catch (error) {
    console.error('Track order error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch order details' 
    });
  }
});

// Public route - Search order by phone number
router.post('/search', async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    // Find orders by phone number
    const orders = await Order.find({ 
      phoneNumber: phoneNumber.trim(),
    })
    .select('barcode customerName clothType status createdAt expectedDeliveryDate')
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();

    if (orders.length === 0) {
      return res.status(404).json({ 
        error: 'No orders found',
        message: 'No orders found for this phone number',
      });
    }

    // Protect customer data
    const ordersInfo = orders.map(order => ({
      barcode: order.barcode,
      customerName: order.customerName.split(' ')[0],
      clothType: order.clothType,
      status: order.status,
      createdAt: order.createdAt,
      expectedDeliveryDate: order.expectedDeliveryDate,
    }));

    res.json({ orders: ordersInfo });
  } catch (error) {
    console.error('Search orders error:', error);
    res.status(500).json({ error: 'Failed to search orders' });
  }
});

module.exports = router;
