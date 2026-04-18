const mongoose = require('mongoose');

const claimSchema = new mongoose.Schema(
  {
    claimId: {
      type: String,
      required: true,
      unique: true,
    },
    patientName: {
      type: String,
      required: [true, 'Patient name is required'],
      trim: true,
    },
    patientDOB: {
      type: String,
    },
    procedure: {
      type: String,
      required: [true, 'Procedure is required'],
    },
    procedureCode: {
      type: String,
    },
    diagnosisCode: {
      type: String,
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: 0,
    },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected'],
      default: 'Pending',
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
    },
    insurance: {
      type: String,
      required: [true, 'Insurance provider is required'],
    },
    insurancePolicyNumber: {
      type: String,
    },
    rejectionReason: {
      type: String,
      default: null,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High'],
      default: 'Medium',
    },
    resubmissionCount: {
      type: Number,
      default: 0,
    },
    notes: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

// Index for faster queries
claimSchema.index({ status: 1, assignedTo: 1 });
claimSchema.index({ date: -1 });

module.exports = mongoose.model('Claim', claimSchema);