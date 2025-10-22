const express = require('express');
const Order = require('../models/OrderNew');
const router = express.Router();

// Public route - Track order by barcode (no authentication required)
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
    const order = await Order.findOne({ barcode: barcode.toUpperCase() });

    if (!order) {
      return res.status(404).json({ 
        success: false,
        error: 'Order not found' 
      });
    }

    // Return limited order information for customer (privacy)
    const publicOrder = {
      barcode: order.barcode,
      customerName: order.customerName, // Frontend will show first name only
      clothType: order.clothType,
      status: order.status,
      expectedDeliveryDate: order.expectedDeliveryDate,
      amount: order.amount,
      advancePayment: order.advancePayment,
      balanceAmount: order.balanceAmount,
      specialInstructions: order.specialInstructions,
      statusHistory: order.statusHistory,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };

    res.json({
      success: true,
      order: publicOrder,
    });
  } catch (error) {
    console.error('Track order error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch order details' 
    });
  }
});

module.exports = router;
