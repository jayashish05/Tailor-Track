const express = require('express');
const Customer = require('../models/Customer');
const { isAuthenticated, isStaffOrAdmin } = require('../middleware/auth');
const { customerSchema } = require('../utils/validation');
const router = express.Router();

// Get all customers (staff/admin only)
router.get('/', isAuthenticated, async (req, res) => {
  try {
    // Check if user has admin/staff role
    if (req.user.role !== 'admin' && req.user.role !== 'staff') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { page = 1, limit = 10, search = '' } = req.query;

    const query = search
      ? {
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { phone: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
          ],
        }
      : {};

    const customers = await Customer.find(query)
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Customer.countDocuments(query);

    res.json({
      customers,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count,
    });
  } catch (error) {
    console.error('Get customers error:', error);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

// Get single customer
router.get('/:id', isAuthenticated, async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id).populate('userId', 'name email');

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Customers can only view their own data
    if (req.user.role === 'customer' && customer.userId?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ customer });
  } catch (error) {
    console.error('Get customer error:', error);
    res.status(500).json({ error: 'Failed to fetch customer' });
  }
});

// Create customer
router.post('/', isStaffOrAdmin, async (req, res) => {
  try {
    // Validate input
    const { error, value } = customerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    // Check if customer with phone exists
    const existingCustomer = await Customer.findOne({ phone: value.phone });
    if (existingCustomer) {
      return res.status(400).json({ error: 'Customer with this phone number already exists' });
    }

    const customer = await Customer.create(value);
    res.status(201).json({ customer, message: 'Customer created successfully' });
  } catch (error) {
    console.error('Create customer error:', error);
    res.status(500).json({ error: 'Failed to create customer' });
  }
});

// Update customer
router.put('/:id', isStaffOrAdmin, async (req, res) => {
  try {
    // Validate input
    const { error, value } = customerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const customer = await Customer.findByIdAndUpdate(req.params.id, value, {
      new: true,
      runValidators: true,
    });

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    res.json({ customer, message: 'Customer updated successfully' });
  } catch (error) {
    console.error('Update customer error:', error);
    res.status(500).json({ error: 'Failed to update customer' });
  }
});

// Delete customer
router.delete('/:id', isStaffOrAdmin, async (req, res) => {
  try {
    const customer = await Customer.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    res.json({ message: 'Customer deactivated successfully' });
  } catch (error) {
    console.error('Delete customer error:', error);
    res.status(500).json({ error: 'Failed to delete customer' });
  }
});

// Search customer by phone
router.get('/search/phone/:phone', isStaffOrAdmin, async (req, res) => {
  try {
    const customer = await Customer.findOne({ phone: req.params.phone });

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    res.json({ customer });
  } catch (error) {
    console.error('Search customer error:', error);
    res.status(500).json({ error: 'Failed to search customer' });
  }
});

module.exports = router;
