const { verifyToken } = require('../utils/token');

const authenticate = (context) => {
  const { token } = context;
  if (!token) throw new Error('Authentication required');
  try {
    return verifyToken(token);
  } catch {
    throw new Error('Invalid or expired token');
  }
};

const requireAdmin = (context) => {
  const decoded = authenticate(context);
  if (decoded.role !== 'admin') throw new Error('Admin access required');
  return decoded;
};

module.exports = { authenticate, requireAdmin };
