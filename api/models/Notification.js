const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      enum: ['order_confirmation', 'status_update', 'admin_broadcast', 'ready_for_pickup'],
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      // Can store additional data like status, orderNumber, etc.
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ isRead: 1, recipient: 1 });

module.exports = mongoose.model('Notification', notificationSchema);
