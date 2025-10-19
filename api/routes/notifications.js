const express = require('express');
const Notification = require('../models/Notification');
const User = require('../models/User');
const Customer = require('../models/Customer');
const { isAuthenticated, isStaffOrAdmin } = require('../middleware/auth');
const { notifyUnreadNotifications } = require('../utils/emailService');
const router = express.Router();

// Get notifications for current user
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const { page = 1, limit = 20, unreadOnly = false } = req.query;

    let query = { recipient: req.user._id };
    
    if (unreadOnly === 'true') {
      query.isRead = false;
    }

    const notifications = await Notification.find(query)
      .populate('order', 'orderNumber status')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({ 
      recipient: req.user._id, 
      isRead: false 
    });

    res.json({
      notifications,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count,
      unreadCount,
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// Get unread count
router.get('/unread-count', isAuthenticated, async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      recipient: req.user._id,
      isRead: false,
    });

    res.json({ count });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ error: 'Failed to fetch unread count' });
  }
});

// Mark notification as read
router.patch('/:id/read', isAuthenticated, async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      recipient: req.user._id,
    });

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    notification.isRead = true;
    notification.readAt = new Date();
    await notification.save();

    res.json({ notification });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

// Mark all notifications as read
router.patch('/mark-all-read', isAuthenticated, async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark all as read error:', error);
    res.status(500).json({ error: 'Failed to mark all as read' });
  }
});

// Admin: Send broadcast notification to all customers
router.post('/broadcast', isStaffOrAdmin, async (req, res) => {
  try {
    const { title, message } = req.body;

    if (!title || !message) {
      return res.status(400).json({ error: 'Title and message are required' });
    }

    // Get all customer users with their details
    const customers = await User.find({ role: 'customer' })
      .select('_id name email')
      .lean();

    if (customers.length === 0) {
      return res.status(404).json({ error: 'No customers found' });
    }

    // Create notifications for all customers
    const notifications = customers.map(customer => ({
      type: 'admin_broadcast',
      title,
      message,
      recipient: customer._id,
      metadata: {
        sentBy: req.user.name || req.user.email,
        sentAt: new Date(),
      },
    }));

    const createdNotifications = await Notification.insertMany(notifications);

    console.log(`✅ Broadcast sent to ${createdNotifications.length} customers`);

    // Send email to all customers asynchronously
    const emailPromises = customers.map(async (customer) => {
      try {
        // Get unread count for this customer
        const unreadCount = await Notification.countDocuments({
          recipient: customer._id,
          isRead: false,
        });

        if (unreadCount > 0) {
          await notifyUnreadNotifications(
            customer.email,
            customer.name || 'Customer',
            unreadCount
          );
        }
      } catch (emailError) {
        console.error(`Failed to send email to ${customer.email}:`, emailError.message);
      }
    });

    // Execute all email sends in parallel but don't wait for completion
    Promise.all(emailPromises).then(() => {
      console.log('✅ All notification emails sent');
    }).catch((error) => {
      console.error('❌ Some emails failed to send:', error);
    });

    res.status(201).json({
      message: `Notification sent to ${createdNotifications.length} customers`,
      count: createdNotifications.length,
    });
  } catch (error) {
    console.error('Broadcast notification error:', error);
    res.status(500).json({ error: 'Failed to send broadcast notification' });
  }
});

// Delete notification
router.delete('/:id', isAuthenticated, async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      recipient: req.user._id,
    });

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ error: 'Failed to delete notification' });
  }
});

module.exports = router;
