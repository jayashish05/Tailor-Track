const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String,
    },
    measurements: {
      // Shirt measurements
      shirtLength: Number,
      chest: Number,
      shoulder: Number,
      sleeveLength: Number,
      neck: Number,
      
      // Pants measurements
      waist: Number,
      hip: Number,
      inseam: Number,
      outseam: Number,
      thigh: Number,
      
      // Additional measurements
      custom: mongoose.Schema.Types.Mixed,
    },
    measurementsHistory: [
      {
        measurements: {
          shirtLength: Number,
          chest: Number,
          shoulder: Number,
          sleeveLength: Number,
          neck: Number,
          waist: Number,
          hip: Number,
          inseam: Number,
          outseam: Number,
          thigh: Number,
          custom: mongoose.Schema.Types.Mixed,
        },
        updatedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        updatedAt: {
          type: Date,
          default: Date.now,
        },
        notes: String,
      },
    ],
    age: {
      type: Number,
    },
    notes: {
      type: String,
    },
    totalOrders: {
      type: Number,
      default: 0,
    },
    totalSpent: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for quick search
customerSchema.index({ phone: 1 });
customerSchema.index({ email: 1 });
customerSchema.index({ name: 'text' });

module.exports = mongoose.model('Customer', customerSchema);
