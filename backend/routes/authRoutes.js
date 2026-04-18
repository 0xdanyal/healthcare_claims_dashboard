const express = require('express');
const router = express.Router();
const { login, getMe, getUsers } = require('../controllers/authController');
const { protect, restrictTo } = require('../middleware/auth');

router.post('/login', login);
router.get('/me', protect, getMe);
router.get('/users', protect, restrictTo('admin'), getUsers);

module.exports = router;