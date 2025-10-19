const express = require('express');
const Customer = require('../models/Customer');
const Order = require('../models/Order');
const { isAuthenticated, isStaffOrAdmin } = require('../middleware/auth');
const { customerSchema } = require('../utils/validation');
const router = express.Router();

// Get current user's customer profile
router.get('/me', isAuthenticated, async (req, res) => {
  try {
    const customer = await Customer.findOne({ userId: req.user._id })
      .populate('userId', 'name email')
      .populate({
        path: 'measurementsHistory.updatedBy',
        select: 'name email'
      });

    if (!customer) {
      return res.status(404).json({ error: 'Customer profile not found' });
    }

    // Get order statistics
    const orders = await Order.find({ customer: customer._id });
    const totalOrders = orders.length;
    const totalSpent = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);

    // Add statistics to customer object
    const customerData = customer.toObject();
    customerData.totalOrders = totalOrders;
    customerData.totalSpent = totalSpent;

    res.json({ customer: customerData });
  } catch (error) {
    console.error('Get customer profile error:', error);
    res.status(500).json({ error: 'Failed to fetch customer profile' });
  }
});

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

    // Calculate order statistics for each customer
    const customersWithStats = await Promise.all(
      customers.map(async (customer) => {
        const orders = await Order.find({ customer: customer._id });
        const totalOrders = orders.length;
        const totalSpent = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
        
        const customerData = customer.toObject();
        customerData.totalOrders = totalOrders;
        customerData.totalSpent = totalSpent;
        
        return customerData;
      })
    );

    const count = await Customer.countDocuments(query);

    res.json({
      customers: customersWithStats,
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

// Update current user's customer profile
router.put('/me', isAuthenticated, async (req, res) => {
  try {
    const { name, phone, age, address } = req.body;
    
    const customer = await Customer.findOne({ userId: req.user._id });
    
    if (!customer) {
      return res.status(404).json({ error: 'Customer profile not found' });
    }

    // Update allowed fields
    if (name) customer.name = name;
    if (phone) customer.phone = phone;
    if (age) customer.age = age;
    if (address) customer.address = { ...customer.address, ...address };

    await customer.save();

    res.json({ customer, message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
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

// Update customer measurements
router.patch('/:id/measurements', isStaffOrAdmin, async (req, res) => {
  try {
    const { measurements, notes } = req.body;

    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Save current measurements to history
    if (customer.measurements && Object.keys(customer.measurements).length > 0) {
      customer.measurementsHistory.push({
        measurements: customer.measurements,
        updatedBy: req.user._id,
        updatedAt: new Date(),
        notes: notes || 'Measurements updated',
      });
    }

    // Update current measurements
    customer.measurements = measurements;
    await customer.save();

    const updatedCustomer = await Customer.findById(customer._id)
      .populate('userId', 'name email')
      .populate('measurementsHistory.updatedBy', 'name email');

    res.json({ 
      customer: updatedCustomer, 
      message: 'Measurements updated successfully' 
    });
  } catch (error) {
    console.error('Update measurements error:', error);
    res.status(500).json({ error: 'Failed to update measurements' });
  }
});

module.exports = router;
