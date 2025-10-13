const express = require('express');
const passport = require('passport');
const User = require('../models/User');
const { registerSchema, loginSchema } = require('../utils/validation');
const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  try {
    // Validate input
    const { error, value } = registerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { email, password, name, phone } = value;

    // Check if user exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Create user
    const user = await User.create({
      email: email.toLowerCase(),
      password,
      name,
      phone,
      authProvider: 'local',
    });

    // Log in the user
    req.login(user, (err) => {
      if (err) {
        return res.status(500).json({ error: 'Registration successful but login failed' });
      }
      res.status(201).json({ user, message: 'Registration successful' });
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
router.post('/login', (req, res, next) => {
  // Validate input
  const { error } = loginSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  passport.authenticate('local', (err, user, info) => {
    if (err) {
      return res.status(500).json({ error: 'Authentication failed' });
    }

    if (!user) {
      return res.status(401).json({ error: info.message || 'Invalid credentials' });
    }

    req.login(user, (err) => {
      if (err) {
        return res.status(500).json({ error: 'Login failed' });
      }
      res.json({ user, message: 'Login successful' });
    });
  })(req, res, next);
});

// Google OAuth
router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
  })
);

// Google OAuth callback
router.get(
  '/google/callback',
  passport.authenticate('google', {
    failureRedirect: `${process.env.FRONTEND_URL}/login?error=auth_failed`,
  }),
  (req, res) => {
    // Successful authentication
    // Store user info in session
    req.session.save((err) => {
      if (err) {
        console.error('Session save error:', err);
      }
      // Pass user data as URL parameter for client-side storage
      const userData = encodeURIComponent(JSON.stringify({
        id: req.user._id,
        email: req.user.email,
        name: req.user.name,
        role: req.user.role,
        avatar: req.user.avatar,
      }));
      res.redirect(`${process.env.FRONTEND_URL}/dashboard?user=${userData}`);
    });
  }
);

// Logout
router.post('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }
    req.session.destroy();
    res.json({ message: 'Logout successful' });
  });
});

// Get current user
router.get('/me', (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  res.json({ user: req.user });
});

// Check authentication status
router.get('/status', (req, res) => {
  res.json({
    authenticated: req.isAuthenticated(),
    user: req.user || null,
  });
});

module.exports = router;
