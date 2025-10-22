const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    barcode: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    // Customer Details
    customerName: {
      type: String,
      required: true,
      trim: true,
    },
    phoneNumber: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
    // Order Details
    clothType: {
      type: String,
      required: true,
      enum: ['shirt', 'pants', 'suit', 'dress', 'kurta', 'blouse', 'other'],
      lowercase: true,
    },
    // Measurements - flexible object to store any measurements
    measurements: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    specialInstructions: {
      type: String,
      trim: true,
    },
    expectedDeliveryDate: {
      type: Date,
    },
    // Order Status
    status: {
      type: String,
      enum: [
        'pending',
        'measurement-taken',
        'cutting-done',
        'stitching-in-progress',
        'ready-for-trial',
        'trial-done',
        'ready-for-delivery',
        'delivered',
        'cancelled'
      ],
      default: 'pending',
      lowercase: true,
    },
    statusHistory: [
      {
        status: String,
        timestamp: {
          type: Date,
          default: Date.now,
        },
        updatedBy: String,
      },
    ],
    // Pricing
    amount: {
      type: Number,
      default: 0,
    },
    advancePayment: {
      type: Number,
      default: 0,
    },
    balanceAmount: {
      type: Number,
      default: 0,
    },
    // Tracking
    trackingLink: {
      type: String,
    },
    smsSent: {
      type: Boolean,
      default: false,
    },
    smsSentAt: {
      type: Date,
    },
    // Admin who created
    createdBy: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save middleware to update balance amount
orderSchema.pre('save', function (next) {
  if (this.amount && this.advancePayment) {
    this.balanceAmount = this.amount - this.advancePayment;
  }
  next();
});

// Add status to history when status changes
orderSchema.pre('save', function (next) {
  if (this.isModified('status')) {
    this.statusHistory.push({
      status: this.status,
      timestamp: new Date(),
      updatedBy: this.createdBy,
    });
  }
  next();
});

// Export as OrderNew to avoid conflict with old Order model
module.exports = mongoose.models.OrderNew || mongoose.model('OrderNew', orderSchema);
