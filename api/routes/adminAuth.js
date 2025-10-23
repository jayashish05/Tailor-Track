const express = require('express');
const Admin = require('../models/Admin');
const router = express.Router();

// Middleware to check if admin is authenticated
const isAuthenticated = (req, res, next) => {
  if (req.session && req.session.adminId) {
    return next();
  }
  return res.status(401).json({ error: 'Unauthorized. Please log in.' });
};

// Admin Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // Find admin by username or email
    const admin = await Admin.findOne({
      $or: [{ username: username.toLowerCase() }, { email: username.toLowerCase() }],
    });

    if (!admin) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!admin.isActive) {
      return res.status(403).json({ error: 'Account is inactive. Contact administrator.' });
    }

    // Verify password
    const isPasswordValid = await admin.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last login
    admin.lastLogin = new Date();
    await admin.save();

    // Create session
    req.session.adminId = admin._id.toString();
    req.session.adminName = admin.name;
    req.session.adminRole = admin.role;

    // Explicitly save session to ensure it's stored
    req.session.save((err) => {
      if (err) {
        console.error('Session save error:', err);
        return res.status(500).json({ error: 'Failed to create session' });
      }

      console.log(`✅ Admin logged in: ${admin.username}`);

      res.json({
        success: true,
        message: 'Login successful',
        admin: {
          id: admin._id,
          username: admin.username,
          email: admin.email,
          name: admin.name,
          role: admin.role,
        },
      });
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

// Check authentication status
router.get('/status', isAuthenticated, async (req, res) => {
  try {
    const admin = await Admin.findById(req.session.adminId).select('-password');

    if (!admin) {
      req.session.destroy();
      return res.status(401).json({ authenticated: false });
    }

    res.json({
      authenticated: true,
      admin: {
        id: admin._id,
        username: admin.username,
        email: admin.email,
        name: admin.name,
        role: admin.role,
      },
    });
  } catch (error) {
    console.error('Status check error:', error);
    res.status(500).json({ error: 'Failed to check authentication status' });
  }
});

// Admin Logout
router.post('/logout', isAuthenticated, (req, res) => {
  const adminName = req.session.adminName;
  
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).json({ error: 'Logout failed' });
    }

    console.log(`✅ Admin logged out: ${adminName}`);
    res.json({ message: 'Logout successful' });
  });
});

// Create new admin (protected - super_admin only)
router.post('/create', isAuthenticated, async (req, res) => {
  try {
    // Check if requesting admin is super_admin
    const requestingAdmin = await Admin.findById(req.session.adminId);
    
    if (requestingAdmin.role !== 'super_admin') {
      return res.status(403).json({ error: 'Only super admins can create new admins' });
    }

    const { username, email, password, name, role } = req.body;

    // Validation
    if (!username || !email || !password || !name) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Check if username or email already exists
    const existingAdmin = await Admin.findOne({
      $or: [{ username: username.toLowerCase() }, { email: email.toLowerCase() }],
    });

    if (existingAdmin) {
      return res.status(400).json({ error: 'Username or email already exists' });
    }

    // Create new admin
    const newAdmin = new Admin({
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      password,
      name,
      role: role || 'admin',
    });

    await newAdmin.save();

    console.log(`✅ New admin created: ${newAdmin.username}`);

    res.status(201).json({
      message: 'Admin created successfully',
      admin: {
        id: newAdmin._id,
        username: newAdmin.username,
        email: newAdmin.email,
        name: newAdmin.name,
        role: newAdmin.role,
      },
    });
  } catch (error) {
    console.error('Create admin error:', error);
    res.status(500).json({ error: 'Failed to create admin' });
  }
});

// Get all admins (super_admin only)
router.get('/list', isAuthenticated, async (req, res) => {
  try {
    const requestingAdmin = await Admin.findById(req.session.adminId);
    
    if (requestingAdmin.role !== 'super_admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const admins = await Admin.find().select('-password').sort({ createdAt: -1 });

    res.json({ admins });
  } catch (error) {
    console.error('Get admins error:', error);
    res.status(500).json({ error: 'Failed to fetch admins' });
  }
});

// Update admin profile
router.patch('/profile', isAuthenticated, async (req, res) => {
  try {
    const { name, email } = req.body;
    const admin = await Admin.findById(req.session.adminId);

    if (!admin) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    if (name) admin.name = name;
    if (email) admin.email = email.toLowerCase();

    await admin.save();

    res.json({
      message: 'Profile updated successfully',
      admin: {
        id: admin._id,
        username: admin.username,
        email: admin.email,
        name: admin.name,
        role: admin.role,
      },
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Change password
router.patch('/change-password', isAuthenticated, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new passwords are required' });
    }

    const admin = await Admin.findById(req.session.adminId);

    if (!admin) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    // Verify current password
    const isPasswordValid = await admin.comparePassword(currentPassword);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Update password
    admin.password = newPassword;
    await admin.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

module.exports = router;
module.exports.isAuthenticated = isAuthenticated;
