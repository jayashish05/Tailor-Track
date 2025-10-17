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
          default: 0,
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
      default: 0,
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
// Note: barcode and orderNumber already have unique: true in schema, no need for separate index
orderSchema.index({ customer: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ createdAt: -1 });

// Calculate balance amount before saving
orderSchema.pre('save', function (next) {
  // Calculate total amount from items if not explicitly set
  if (this.items && this.items.length > 0) {
    const calculatedTotal = this.items.reduce((sum, item) => {
      return sum + ((item.price || 0) * (item.quantity || 1));
    }, 0);
    
    // Only update if total wasn't manually set or is 0
    if (!this.totalAmount || this.totalAmount === 0) {
      this.totalAmount = calculatedTotal;
    }
  }
  
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
