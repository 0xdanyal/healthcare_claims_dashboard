const Claim = require('../models/Claim');

// @desc    Get all claims (Admin: all, Staff: assigned only)
// @route   GET /api/claims
// @access  Private
const getClaims = async (req, res, next) => {
  try {
    const { status, insurance, search, page = 1, limit = 50 } = req.query;

    let filter = {};

    // Staff can only see their own claims
    if (req.user.role === 'staff') {
      filter.assignedTo = req.user._id;
    }

    if (status && status !== 'All') {
      filter.status = status;
    }

    if (insurance && insurance !== 'All') {
      filter.insurance = insurance;
    }

    if (search) {
      filter.$or = [
        { patientName: { $regex: search, $options: 'i' } },
        { claimId: { $regex: search, $options: 'i' } },
        { procedure: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [claims, total] = await Promise.all([
      Claim.find(filter)
        .populate('assignedTo', 'name email role')
        .sort({ date: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Claim.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      claims,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single claim
// @route   GET /api/claims/:id
// @access  Private
const getClaim = async (req, res, next) => {
  try {
    const claim = await Claim.findById(req.params.id).populate(
      'assignedTo',
      'name email role department'
    );

    if (!claim) {
      return res.status(404).json({ success: false, message: 'Claim not found.' });
    }

    // Staff can only view their own claims
    if (
      req.user.role === 'staff' &&
      claim.assignedTo._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    res.status(200).json({ success: true, claim });
  } catch (err) {
    next(err);
  }
};

// @desc    Update claim status (Admin only)
// @route   PATCH /api/claims/:id/status
// @access  Private/Admin
const updateClaimStatus = async (req, res, next) => {
  try {
    const { status, rejectionReason, notes } = req.body;

    const claim = await Claim.findById(req.params.id);

    if (!claim) {
      return res.status(404).json({ success: false, message: 'Claim not found.' });
    }

    claim.status = status;
    if (status === 'Rejected') {
      claim.rejectionReason = rejectionReason || 'No reason provided';
    }
    if (status === 'Approved' || status === 'Pending') {
      claim.rejectionReason = null;
    }
    if (notes) claim.notes = notes;

    await claim.save();
    await claim.populate('assignedTo', 'name email role');

    res.status(200).json({ success: true, claim });
  } catch (err) {
    next(err);
  }
};

// @desc    Fix & Resubmit rejected claim (Admin only)
// @route   PATCH /api/claims/:id/resubmit
// @access  Private/Admin
const resubmitClaim = async (req, res, next) => {
  try {
    const claim = await Claim.findById(req.params.id);

    if (!claim) {
      return res.status(404).json({ success: false, message: 'Claim not found.' });
    }

    if (claim.status !== 'Rejected') {
      return res.status(400).json({
        success: false,
        message: 'Only rejected claims can be resubmitted.',
      });
    }

    claim.status = 'Pending';
    claim.rejectionReason = null;
    claim.resubmissionCount += 1;
    claim.date = new Date();

    await claim.save();
    await claim.populate('assignedTo', 'name email role');

    res.status(200).json({ success: true, claim });
  } catch (err) {
    next(err);
  }
};

// @desc    Get dashboard analytics
// @route   GET /api/claims/analytics
// @access  Private
const getAnalytics = async (req, res, next) => {
  try {
    let matchFilter = {};
    if (req.user.role === 'staff') {
      matchFilter.assignedTo = req.user._id;
    }

    const [statusStats, rejectionReasons, monthlyData, insuranceStats] = await Promise.all([
      // Status breakdown
      Claim.aggregate([
        { $match: matchFilter },
        { $group: { _id: '$status', count: { $sum: 1 }, totalAmount: { $sum: '$amount' } } },
      ]),

      // Most common rejection reasons
      Claim.aggregate([
        { $match: { ...matchFilter, status: 'Rejected', rejectionReason: { $ne: null } } },
        { $group: { _id: '$rejectionReason', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
      ]),

      // Monthly trend (last 6 months)
      Claim.aggregate([
        { $match: matchFilter },
        {
          $group: {
            _id: {
              year: { $year: '$date' },
              month: { $month: '$date' },
              status: '$status',
            },
            count: { $sum: 1 },
            totalAmount: { $sum: '$amount' },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
        { $limit: 18 },
      ]),

      // Insurance provider breakdown
      Claim.aggregate([
        { $match: matchFilter },
        { $group: { _id: '$insurance', count: { $sum: 1 }, totalAmount: { $sum: '$amount' } } },
        { $sort: { count: -1 } },
      ]),
    ]);

    // Compute summary
    let totalClaims = 0;
    let totalRevenue = 0;
    let approvedCount = 0;
    let rejectedCount = 0;
    let pendingCount = 0;

    statusStats.forEach((s) => {
      totalClaims += s.count;
      if (s._id === 'Approved') {
        totalRevenue = s.totalAmount;
        approvedCount = s.count;
      }
      if (s._id === 'Rejected') rejectedCount = s.count;
      if (s._id === 'Pending') pendingCount = s.count;
    });

    const rejectionRate =
      totalClaims > 0 ? ((rejectedCount / totalClaims) * 100).toFixed(1) : 0;

    // High-value rejected claims
    const highValueRejected = await Claim.find({
      ...matchFilter,
      status: 'Rejected',
      amount: { $gt: 500 },
    })
      .populate('assignedTo', 'name')
      .sort({ amount: -1 })
      .limit(5);

    res.status(200).json({
      success: true,
      analytics: {
        summary: {
          totalClaims,
          totalRevenue,
          approvedCount,
          rejectedCount,
          pendingCount,
          rejectionRate: parseFloat(rejectionRate),
        },
        statusStats,
        rejectionReasons,
        monthlyData,
        insuranceStats,
        highValueRejected,
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getClaims,
  getClaim,
  updateClaimStatus,
  resubmitClaim,
  getAnalytics,
};