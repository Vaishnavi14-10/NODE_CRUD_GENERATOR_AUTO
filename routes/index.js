
  const express = require('express');
  const router = express.Router();

  const studentRoutes = require('./studentRoutes');
  router.use('/student', studentRoutes);

  module.exports = router;
  