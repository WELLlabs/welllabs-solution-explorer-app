const authRoutes = require('./auth.routes');
const authController = require('./auth.controller');

module.exports = {
  routes: authRoutes,
  controller: authController,
};
