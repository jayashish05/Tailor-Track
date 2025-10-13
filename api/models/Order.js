const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
    },
    barcode: {
      type: String,
      required: true,
      unique: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
    },
    items: [
      {
        itemType: {
          type: String,
          required: true,
          enum: ['shirt', 'pants', 'suit', 'dress', 'kurta', 'blouse', 'other'],
        },
        description: {
          type: String,
          required: true,
        },
        quantity: {
          type: Number,
          default: 1,
        },
        fabricImage: {
          type: String,
        },
        measurements: {
          type: mongoose.Schema.Types.Mixed,
        },
        price: {
          type: Number,
          required: true,
        },
      },
    ],
    status: {
      type: String,
      enum: ['received', 'measuring', 'stitching', 'qc', 'ready', 'delivered'],
      default: 'received',
    },
    statusHistory: [
      {
        status: String,
        timestamp: {
          type: Date,
          default: Date.now,
        },
        updatedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        notes: String,
      },
    ],
    totalAmount: {
      type: Number,
      required: true,
    },
    advanceAmount: {
      type: Number,
      default: 0,
    },
    balanceAmount: {
      type: Number,
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'partial', 'paid'],
      default: 'pending',
    },
    dueDate: {
      type: Date,
    },
    deliveryDate: {
      type: Date,
    },
    notes: {
      type: String,
    },
    images: [
      {
        url: String,
        type: {
          type: String,
          enum: ['before', 'after', 'fabric'],
        },
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
orderSchema.index({ barcode: 1 });
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ customer: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ createdAt: -1 });

// Calculate balance amount before saving
orderSchema.pre('save', function (next) {
  this.balanceAmount = this.totalAmount - this.advanceAmount;
  
  // Update payment status only if totalAmount is set
  if (this.totalAmount > 0) {
    if (this.advanceAmount >= this.totalAmount) {
      this.paymentStatus = 'paid';
    } else if (this.advanceAmount > 0) {
      this.paymentStatus = 'partial';
    } else {
      this.paymentStatus = 'pending';
    }
  } else {
    // If no amount set yet, keep as pending
    this.paymentStatus = 'pending';
  }
  
  next();
});

module.exports = mongoose.model('Order', orderSchema);
