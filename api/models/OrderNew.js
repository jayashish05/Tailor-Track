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
    // Order Items - Array of items (clothes)
    items: [{
      clothType: {
        type: String,
        required: true,
        enum: ['shirt', 'pants', 'suit', 'dress', 'kurta', 'blouse', 'other'],
        lowercase: true,
      },
      measurements: {
        type: mongoose.Schema.Types.Mixed,
        default: {},
      },
      price: {
        type: Number,
        default: 0,
      },
      notes: {
        type: String,
        trim: true,
      },
    }],
    // Legacy fields for backward compatibility (deprecated)
    clothType: {
      type: String,
      enum: ['shirt', 'pants', 'suit', 'dress', 'kurta', 'blouse', 'other'],
      lowercase: true,
    },
    // Measurements - flexible object to store any measurements (deprecated)
    measurements: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    // Order-level details
    specialInstructions: {
      type: String,
      trim: true,
    },
    expectedDeliveryDate: {
      type: Date,
    },
    // Pricing
    subtotal: {
      type: Number,
      default: 0,
    },
    discount: {
      type: Number,
      default: 0,
    },
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

// Pre-save middleware to calculate subtotal and amount from items
orderSchema.pre('save', function (next) {
  // Calculate subtotal from items if items exist
  if (this.items && this.items.length > 0) {
    this.subtotal = this.items.reduce((total, item) => total + (item.price || 0), 0);
    this.amount = this.subtotal - (this.discount || 0);
  }
  
  // Update balance amount
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
