const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  // Check cookies first, fallback to Authorization header
  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }

  let decoded;
  try {
    const secret = process.env.JWT_SECRET || 'fallback_secret_key_change_me_later';
    decoded = jwt.verify(token, secret);
  } catch (error) {
    return res.status(401).json({ message: 'Not authorized, token failed' });
  }

  const user = await User.findById(decoded.id).select('-password');
  if (!user) {
    return res.status(401).json({ message: 'Not authorized, user no longer exists' });
  }
  // Tokens issued before a force logout or password reset carry an older version
  if ((decoded.tv || 0) !== (user.tokenVersion || 0)) {
    return res.status(401).json({ message: 'Session expired, please sign in again' });
  }
  if (user.status === 'suspended') {
    return res.status(403).json({ message: 'This account has been suspended. Contact the administrator.' });
  }

  req.user = user;
  return next();
};

const admin = (req, res, next) => {
  if (req.user && req.user.role === 'Admin') {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized as an admin' });
  }
};

module.exports = { protect, admin };
