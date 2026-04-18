const express = require('express');
const router = express.Router();
const {
  getClaims,
  getClaim,
  updateClaimStatus,
  resubmitClaim,
  getAnalytics,
} = require('../controllers/claimsController');
const { protect, restrictTo } = require('../middleware/auth');

router.use(protect); // all claims routes require auth

router.get('/analytics', getAnalytics);
router.get('/', getClaims);
router.get('/:id', getClaim);
router.patch('/:id/status', restrictTo('admin'), updateClaimStatus);
router.patch('/:id/resubmit', restrictTo('admin'), resubmitClaim);

module.exports = router;