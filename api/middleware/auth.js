// Authentication middleware
const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  
  // Log session details for debugging
  console.error('❌ Authentication failed:', {
    path: req.path,
    method: req.method,
    sessionID: req.sessionID,
    hasSession: !!req.session,
    hasCookie: !!req.headers.cookie,
  });
  
  return res.status(401).json({ 
    error: 'Unauthorized. Please log in.',
    message: 'Your session has expired or you are not logged in. Please login again.',
  });
};

// Role-based authorization
const hasRole = (...roles) => {
  return (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Unauthorized. Please log in.' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden. Insufficient permissions.' });
    }

    next();
  };
};

// Admin only
const isAdmin = hasRole('admin');

// Staff and Admin
const isStaffOrAdmin = hasRole('staff', 'admin');

module.exports = {
  isAuthenticated,
  hasRole,
  isAdmin,
  isStaffOrAdmin,
};
