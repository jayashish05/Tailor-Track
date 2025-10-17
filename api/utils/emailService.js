const nodemailer = require('nodemailer');

// Create reusable transporter
let transporter = null;

const createTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT) || 587,
      secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    // Verify connection configuration
    transporter.verify((error, success) => {
      if (error) {
        console.error('❌ Email configuration error:', error.message);
        console.log('💡 Make sure you have set up Gmail App Password in .env file');
      } else {
        console.log('✅ Email service is ready');
      }
    });
  }

  return transporter;
};

// Email templates
const emailTemplates = {
  orderReadyForPickup: (order, customer) => ({
    subject: `🎉 Your Order #${order.orderNumber} is Ready for Pickup!`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: 'Arial', sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%);
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 10px 10px 0 0;
          }
          .header h1 {
            margin: 0;
            font-size: 28px;
          }
          .content {
            background: #f9fafb;
            padding: 30px;
            border: 1px solid #e5e7eb;
            border-top: none;
          }
          .order-details {
            background: white;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 4px solid #8B5CF6;
          }
          .order-details h2 {
            margin-top: 0;
            color: #8B5CF6;
            font-size: 20px;
          }
          .detail-row {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            border-bottom: 1px solid #e5e7eb;
          }
          .detail-row:last-child {
            border-bottom: none;
          }
          .detail-label {
            font-weight: 600;
            color: #6b7280;
          }
          .detail-value {
            color: #111827;
          }
          .items-list {
            background: white;
            padding: 15px;
            border-radius: 8px;
            margin: 15px 0;
          }
          .item {
            padding: 8px 0;
            border-bottom: 1px dashed #e5e7eb;
          }
          .item:last-child {
            border-bottom: none;
          }
          .cta-button {
            display: inline-block;
            background: #8B5CF6;
            color: #FFFFFF !important;
            padding: 15px 40px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            margin: 20px 0;
            text-align: center;
          }
          .cta-button:hover {
            background: #7C3AED;
            color: #FFFFFF !important;
          }
          .payment-notice {
            background: #FEF3C7;
            border: 2px solid #F59E0B;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
          }
          .payment-notice strong {
            color: #92400E;
          }
          .footer {
            text-align: center;
            padding: 20px;
            color: #6b7280;
            font-size: 14px;
            border-top: 1px solid #e5e7eb;
            margin-top: 20px;
          }
          .contact-info {
            background: #EEF2FF;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>✨ Great News!</h1>
          <p style="margin: 10px 0 0 0; font-size: 18px;">Your order is ready for pickup</p>
        </div>
        
        <div class="content">
          <p>Dear <strong>${customer.name}</strong>,</p>
          
          <p>We're excited to let you know that your order has been completed and is ready for pickup! 🎉</p>
          
          <div class="order-details">
            <h2>📦 Order Details</h2>
            <div class="detail-row">
              <span class="detail-label">Order Number:</span>
              <span class="detail-value"><strong>${order.orderNumber}</strong></span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Barcode:</span>
              <span class="detail-value">${order.barcode}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Status:</span>
              <span class="detail-value" style="color: #10B981; font-weight: 600;">✓ Ready to Pickup</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Total Items:</span>
              <span class="detail-value">${order.items.length} item(s)</span>
            </div>
            ${order.totalAmount > 0 ? `
            <div class="detail-row">
              <span class="detail-label">Total Amount:</span>
              <span class="detail-value" style="font-size: 20px; font-weight: 700; color: #8B5CF6;">₹${order.totalAmount}</span>
            </div>
            ` : ''}
          </div>

          ${order.items && order.items.length > 0 ? `
          <div class="items-list">
            <h3 style="margin-top: 0; color: #374151;">Items in Your Order:</h3>
            ${order.items.map(item => `
              <div class="item">
                <strong>${item.itemType}</strong> ${item.quantity > 1 ? `(Qty: ${item.quantity})` : ''}
                ${item.description ? `<br><span style="color: #6b7280; font-size: 14px;">${item.description}</span>` : ''}
              </div>
            `).join('')}
          </div>
          ` : ''}

          ${order.totalAmount > 0 && order.paymentStatus !== 'paid' ? `
          <div class="payment-notice">
            <strong>⚠️ Payment Required:</strong> Please complete the payment of <strong>₹${order.totalAmount}</strong> before pickup.
          </div>
          ` : ''}

          <div style="text-align: center;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3002'}/take-clothes" class="cta-button">
              🚀 Track & Pickup Order
            </a>
          </div>

          <div class="contact-info">
            <p style="margin: 5px 0;"><strong>📍 Visit Us:</strong> [Your Shop Address]</p>
            <p style="margin: 5px 0;"><strong>📞 Call Us:</strong> [Your Phone Number]</p>
            <p style="margin: 5px 0;"><strong>🕒 Hours:</strong> Mon-Sat, 10 AM - 8 PM</p>
          </div>

          <p style="margin-top: 30px;">Looking forward to seeing you soon!</p>
          <p style="margin: 5px 0;">Best regards,<br><strong>TailorTrack Team</strong></p>
        </div>

        <div class="footer">
          <p>This is an automated notification from TailorTrack</p>
          <p style="font-size: 12px; color: #9ca3af;">
            If you have any questions, please contact us at ${process.env.EMAIL_FROM || 'support@tailortrack.com'}
          </p>
        </div>
      </body>
      </html>
    `,
    text: `
Dear ${customer.name},

Great news! Your order #${order.orderNumber} is ready for pickup!

Order Details:
- Order Number: ${order.orderNumber}
- Barcode: ${order.barcode}
- Status: Ready to Pickup
- Total Items: ${order.items.length}
${order.totalAmount > 0 ? `- Total Amount: ₹${order.totalAmount}` : ''}

${order.items && order.items.length > 0 ? `
Items:
${order.items.map(item => `- ${item.itemType} ${item.quantity > 1 ? `(Qty: ${item.quantity})` : ''}`).join('\n')}
` : ''}

${order.totalAmount > 0 && order.paymentStatus !== 'paid' ? `
⚠️ Payment Required: Please complete the payment of ₹${order.totalAmount} before pickup.
` : ''}

Track your order: ${process.env.FRONTEND_URL || 'http://localhost:3002'}/take-clothes

Looking forward to seeing you soon!

Best regards,
TailorTrack Team
    `,
  }),

  orderConfirmation: (order, customer) => ({
    subject: `✅ Order Confirmed #${order.orderNumber} - TailorTrack`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: 'Arial', sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, #10B981 0%, #059669 100%);
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 10px 10px 0 0;
          }
          .header h1 {
            margin: 0;
            font-size: 28px;
          }
          .content {
            background: #f9fafb;
            padding: 30px;
            border: 1px solid #e5e7eb;
            border-top: none;
          }
          .success-badge {
            background: #D1FAE5;
            color: #065F46;
            padding: 15px;
            border-radius: 8px;
            text-align: center;
            margin: 20px 0;
            font-size: 18px;
            font-weight: 600;
          }
          .order-details {
            background: white;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 4px solid #10B981;
          }
          .order-details h2 {
            margin-top: 0;
            color: #10B981;
            font-size: 20px;
          }
          .detail-row {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            border-bottom: 1px solid #e5e7eb;
          }
          .detail-row:last-child {
            border-bottom: none;
          }
          .detail-label {
            font-weight: 600;
            color: #6b7280;
          }
          .detail-value {
            color: #111827;
          }
          .items-list {
            background: white;
            padding: 15px;
            border-radius: 8px;
            margin: 15px 0;
          }
          .item {
            padding: 8px 0;
            border-bottom: 1px dashed #e5e7eb;
          }
          .item:last-child {
            border-bottom: none;
          }
          .barcode-section {
            background: white;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            margin: 20px 0;
            border: 2px dashed #10B981;
          }
          .barcode-section h3 {
            margin-top: 0;
            color: #10B981;
          }
          .barcode-text {
            font-size: 24px;
            font-weight: 700;
            color: #111827;
            letter-spacing: 2px;
            margin: 10px 0;
          }
          .info-box {
            background: #EFF6FF;
            border-left: 4px solid #3B82F6;
            padding: 15px;
            border-radius: 4px;
            margin: 20px 0;
          }
          .cta-button {
            display: inline-block;
            background: #10B981;
            color: #FFFFFF !important;
            padding: 15px 40px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            margin: 20px 0;
          }
          .cta-button:hover {
            background: #059669;
            color: #FFFFFF !important;
          }
          .footer {
            text-align: center;
            padding: 20px;
            color: #6b7280;
            font-size: 14px;
            border-top: 1px solid #e5e7eb;
            margin-top: 20px;
          }
          .contact-info {
            background: #EEF2FF;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>✅ Order Confirmed!</h1>
          <p style="margin: 10px 0 0 0; font-size: 18px;">Thank you for your order</p>
        </div>
        
        <div class="content">
          <p>Dear <strong>${customer.name}</strong>,</p>
          
          <div class="success-badge">
            🎉 Your order has been successfully placed!
          </div>

          <p>We've received your order and our team will start working on it soon. You'll receive updates via email as your order progresses.</p>
          
          <div class="order-details">
            <h2>📦 Order Details</h2>
            <div class="detail-row">
              <span class="detail-label">Order Number:</span>
              <span class="detail-value"><strong>${order.orderNumber}</strong></span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Order Date:</span>
              <span class="detail-value">${new Date(order.createdAt).toLocaleDateString('en-IN', { 
                day: 'numeric', 
                month: 'long', 
                year: 'numeric' 
              })}</span>
            </div>
            ${order.dueDate ? `
            <div class="detail-row">
              <span class="detail-label">Expected Delivery:</span>
              <span class="detail-value">${new Date(order.dueDate).toLocaleDateString('en-IN', { 
                day: 'numeric', 
                month: 'long', 
                year: 'numeric' 
              })}</span>
            </div>
            ` : ''}
            <div class="detail-row">
              <span class="detail-label">Status:</span>
              <span class="detail-value" style="color: #10B981; font-weight: 600;">📝 Received</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Total Items:</span>
              <span class="detail-value">${order.items.length} item(s)</span>
            </div>
          </div>

          ${order.items && order.items.length > 0 ? `
          <div class="items-list">
            <h3 style="margin-top: 0; color: #374151;">Items in Your Order:</h3>
            ${order.items.map(item => `
              <div class="item">
                <strong>${item.itemType.charAt(0).toUpperCase() + item.itemType.slice(1)}</strong> ${item.quantity > 1 ? `(Qty: ${item.quantity})` : ''}
                ${item.description && item.description !== `${item.itemType} order` ? `<br><span style="color: #6b7280; font-size: 14px;">${item.description}</span>` : ''}
              </div>
            `).join('')}
          </div>
          ` : ''}

          <div class="barcode-section">
            <h3>🔍 Track Your Order</h3>
            <p style="margin: 5px 0; color: #6b7280;">Use this barcode to track your order:</p>
            <div class="barcode-text">${order.barcode}</div>
            <p style="margin: 10px 0 0 0; font-size: 12px; color: #9ca3af;">Show this barcode when picking up your order</p>
          </div>

          <div class="info-box">
            <strong>ℹ️ What's Next?</strong>
            <ul style="margin: 10px 0; padding-left: 20px;">
              <li>Our team will review your order details</li>
              <li>You'll receive email notifications as your order progresses</li>
              <li>We'll notify you when your order is ready for pickup</li>
              ${order.totalAmount > 0 ? `<li>Payment can be made during pickup</li>` : ''}
            </ul>
          </div>

          <div style="text-align: center;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3002'}/take-clothes" class="cta-button">
              📱 Track Your Order
            </a>
          </div>

          <div class="contact-info">
            <p style="margin: 5px 0;"><strong>📍 Visit Us:</strong> [Your Shop Address]</p>
            <p style="margin: 5px 0;"><strong>📞 Call Us:</strong> [Your Phone Number]</p>
            <p style="margin: 5px 0;"><strong>🕒 Hours:</strong> Mon-Sat, 10 AM - 8 PM</p>
          </div>

          <p style="margin-top: 30px;">Thank you for choosing TailorTrack!</p>
          <p style="margin: 5px 0;">Best regards,<br><strong>TailorTrack Team</strong></p>
        </div>

        <div class="footer">
          <p>This is an automated confirmation from TailorTrack</p>
          <p style="font-size: 12px; color: #9ca3af;">
            Order #${order.orderNumber} | Barcode: ${order.barcode}
          </p>
          <p style="font-size: 12px; color: #9ca3af;">
            If you have any questions, please contact us at ${process.env.EMAIL_FROM || 'support@tailortrack.com'}
          </p>
        </div>
      </body>
      </html>
    `,
    text: `
Order Confirmation - TailorTrack

Dear ${customer.name},

✅ Your order has been successfully placed!

Order Details:
- Order Number: ${order.orderNumber}
- Order Date: ${new Date(order.createdAt).toLocaleDateString('en-IN')}
${order.dueDate ? `- Expected Delivery: ${new Date(order.dueDate).toLocaleDateString('en-IN')}` : ''}
- Status: Received
- Total Items: ${order.items.length}

Barcode: ${order.barcode}
(Show this barcode when picking up your order)

${order.items && order.items.length > 0 ? `
Items in Your Order:
${order.items.map(item => `- ${item.itemType.charAt(0).toUpperCase() + item.itemType.slice(1)} ${item.quantity > 1 ? `(Qty: ${item.quantity})` : ''}`).join('\n')}
` : ''}

What's Next?
- Our team will review your order details
- You'll receive email notifications as your order progresses
- We'll notify you when your order is ready for pickup
${order.totalAmount > 0 ? '- Payment can be made during pickup' : ''}

Track your order: ${process.env.FRONTEND_URL || 'http://localhost:3002'}/take-clothes

Thank you for choosing TailorTrack!

Best regards,
TailorTrack Team

---
Order #${order.orderNumber} | Barcode: ${order.barcode}
    `,
  }),

  orderStatusUpdate: (order, customer, newStatus) => {
    // Map status to friendly names and colors
    const statusInfo = {
      received: { label: 'Order Received', color: '#3B82F6', emoji: '📝' },
      'in-progress': { label: 'In Progress', color: '#F59E0B', emoji: '⚙️' },
      measuring: { label: 'Taking Measurements', color: '#0EA5E9', emoji: '📏' },
      stitching: { label: 'Being Stitched', color: '#F59E0B', emoji: '🧵' },
      qc: { label: 'Quality Check', color: '#14B8A6', emoji: '✨' },
      ready: { label: 'Ready to Pickup', color: '#10B981', emoji: '✅' },
      delivered: { label: 'Delivered', color: '#8B5CF6', emoji: '🎉' },
      cancelled: { label: 'Cancelled', color: '#EF4444', emoji: '❌' },
    };

    const status = statusInfo[newStatus] || { label: newStatus, color: '#6B7280', emoji: '📦' };

    return {
      subject: `${status.emoji} Order #${order.orderNumber} - ${status.label}`,
      html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: 'Arial', sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, ${status.color} 0%, ${status.color}dd 100%);
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 10px 10px 0 0;
          }
          .header h1 {
            margin: 0;
            font-size: 28px;
          }
          .content {
            background: #f9fafb;
            padding: 30px;
            border: 1px solid #e5e7eb;
            border-top: none;
            border-radius: 0 0 10px 10px;
          }
          .order-details {
            background: white;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 4px solid ${status.color};
          }
          .order-details h2 {
            margin-top: 0;
            color: ${status.color};
            font-size: 20px;
          }
          .detail-row {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            border-bottom: 1px solid #e5e7eb;
          }
          .detail-row:last-child {
            border-bottom: none;
          }
          .detail-label {
            font-weight: 600;
            color: #6b7280;
          }
          .detail-value {
            color: #111827;
          }
          .status-badge {
            display: inline-block;
            padding: 12px 24px;
            border-radius: 25px;
            font-weight: 700;
            font-size: 18px;
            margin: 20px 0;
            background: ${status.color}22;
            color: ${status.color};
            border: 2px solid ${status.color};
          }
          .items-list {
            background: white;
            padding: 15px;
            border-radius: 8px;
            margin: 15px 0;
          }
          .item {
            padding: 8px 0;
            border-bottom: 1px dashed #e5e7eb;
          }
          .item:last-child {
            border-bottom: none;
          }
          .cta-button {
            display: inline-block;
            background: ${status.color};
            color: #FFFFFF !important;
            padding: 15px 40px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            margin: 20px 0;
          }
          .cta-button:hover {
            opacity: 0.9;
            color: #FFFFFF !important;
          }
          .footer {
            text-align: center;
            padding: 20px;
            color: #6b7280;
            font-size: 14px;
            border-top: 1px solid #e5e7eb;
            margin-top: 20px;
          }
          .timeline-info {
            background: #F3F4F6;
            padding: 15px;
            border-radius: 8px;
            margin: 15px 0;
            font-size: 14px;
            color: #4B5563;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${status.emoji} Order Status Update</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px;">Your order has been updated</p>
        </div>
        
        <div class="content">
          <p>Dear <strong>${customer.name}</strong>,</p>
          
          <p>We wanted to let you know that your order status has been updated:</p>
          
          <div style="text-align: center;">
            <div class="status-badge">
              ${status.emoji} ${status.label}
            </div>
          </div>

          <div class="order-details">
            <h2>📦 Order Details</h2>
            <div class="detail-row">
              <span class="detail-label">Order Number:</span>
              <span class="detail-value"><strong>${order.orderNumber}</strong></span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Barcode:</span>
              <span class="detail-value">${order.barcode}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Current Status:</span>
              <span class="detail-value" style="color: ${status.color}; font-weight: 600;">${status.label}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Total Items:</span>
              <span class="detail-value">${order.items.length} item(s)</span>
            </div>
            ${order.totalAmount > 0 ? `
            <div class="detail-row">
              <span class="detail-label">Total Amount:</span>
              <span class="detail-value" style="font-size: 18px; font-weight: 700; color: #8B5CF6;">₹${order.totalAmount}</span>
            </div>
            ` : ''}
          </div>

          ${order.items && order.items.length > 0 ? `
          <div class="items-list">
            <h3 style="margin-top: 0; color: #374151;">Items in Your Order:</h3>
            ${order.items.map(item => `
              <div class="item">
                <strong>${item.itemType}</strong> ${item.quantity > 1 ? `(Qty: ${item.quantity})` : ''}
                ${item.description ? `<br><span style="color: #6b7280; font-size: 14px;">${item.description}</span>` : ''}
              </div>
            `).join('')}
          </div>
          ` : ''}

          ${newStatus === 'ready' ? `
          ${newStatus === 'ready' ? `
          <div class="timeline-info">
            <strong>🎉 Great news!</strong> Your order is ready for pickup. Please visit our shop at your convenience.
            ${order.totalAmount > 0 && order.paymentStatus !== 'paid' ? `<br><br><strong>⚠️ Note:</strong> Payment of ₹${order.totalAmount} is required before pickup.` : ''}
          </div>
          ` : ''}

          ${newStatus === 'in-progress' ? `
          <div class="timeline-info">
            <strong>⚙️ In Progress:</strong> Our team is working on your order. We'll notify you once it's ready for pickup.
          </div>
          ` : ''}

          ${newStatus === 'measuring' ? `
          <div class="timeline-info">
            <strong>📏 Taking Measurements:</strong> We're carefully taking your measurements to ensure a perfect fit.
          </div>
          ` : ''}

          ${newStatus === 'stitching' ? `
          <div class="timeline-info">
            <strong>🧵 Being Stitched:</strong> Your garment is being expertly stitched by our skilled tailors.
          </div>
          ` : ''}

          ${newStatus === 'qc' ? `
          <div class="timeline-info">
            <strong>✨ Quality Check:</strong> Your order is undergoing quality inspection to ensure perfection.
          </div>
          ` : ''}

          ${newStatus === 'delivered' ? `
          <div class="timeline-info">
            <strong>🎉 Thank you!</strong> Your order has been delivered. We hope you're happy with our service!
          </div>
          ` : ''}

          ${newStatus === 'cancelled' ? `
          <div class="timeline-info">
            <strong>❌ Cancelled:</strong> Your order has been cancelled. If you have any questions, please contact us.
          </div>
          ` : ''}
          ` : ''}

          ${newStatus === 'in-progress' ? `
          <div class="timeline-info">
            <strong>⚙️ In Progress:</strong> Our team is working on your order. We'll notify you once it's ready for pickup.
          </div>
          ` : ''}

          ${newStatus === 'delivered' ? `
          <div class="timeline-info">
            <strong>🎉 Thank you!</strong> Your order has been delivered. We hope you're happy with our service!
          </div>
          ` : ''}

          ${newStatus === 'cancelled' ? `
          <div class="timeline-info">
            <strong>❌ Cancelled:</strong> Your order has been cancelled. If you have any questions, please contact us.
          </div>
          ` : ''}

          <div style="text-align: center;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3002'}/take-clothes" class="cta-button">
              📱 Track Your Order
            </a>
          </div>

          <p style="margin-top: 30px;">Thank you for choosing TailorTrack!</p>
          <p style="margin: 5px 0;">Best regards,<br><strong>TailorTrack Team</strong></p>
        </div>

        <div class="footer">
          <p>This is an automated notification from TailorTrack</p>
          <p style="font-size: 12px; color: #9ca3af;">
            If you have any questions, please contact us at ${process.env.EMAIL_FROM || 'support@tailortrack.com'}
          </p>
        </div>
      </body>
      </html>
    `,
      text: `
Dear ${customer.name},

Your order #${order.orderNumber} status has been updated!

Current Status: ${status.label}

Order Details:
- Order Number: ${order.orderNumber}
- Barcode: ${order.barcode}
- Status: ${status.label}
- Total Items: ${order.items.length}
${order.totalAmount > 0 ? `- Total Amount: ₹${order.totalAmount}` : ''}

${order.items && order.items.length > 0 ? `
Items:
${order.items.map(item => `- ${item.itemType} ${item.quantity > 1 ? `(Qty: ${item.quantity})` : ''}`).join('\n')}
` : ''}

${newStatus === 'ready' ? `🎉 Great news! Your order is ready for pickup.${order.totalAmount > 0 && order.paymentStatus !== 'paid' ? `\n⚠️ Payment of ₹${order.totalAmount} is required before pickup.` : ''}` : ''}
${newStatus === 'in-progress' ? `⚙️ Our team is working on your order. We'll notify you once it's ready.` : ''}
${newStatus === 'measuring' ? `📏 We're carefully taking your measurements to ensure a perfect fit.` : ''}
${newStatus === 'stitching' ? `🧵 Your garment is being expertly stitched by our skilled tailors.` : ''}
${newStatus === 'qc' ? `✨ Your order is undergoing quality inspection to ensure perfection.` : ''}
${newStatus === 'delivered' ? `🎉 Thank you! Your order has been delivered.` : ''}
${newStatus === 'cancelled' ? `❌ Your order has been cancelled. Please contact us if you have questions.` : ''}

Track your order: ${process.env.FRONTEND_URL || 'http://localhost:3002'}/take-clothes

Thank you for choosing TailorTrack!

Best regards,
TailorTrack Team
    `,
    };
  },
};

// Send email function
const sendEmail = async (to, template) => {
  try {
    // Check if email is configured
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.warn('⚠️ Email not configured. Skipping email notification.');
      console.log('📧 Would have sent email to:', to);
      console.log('📋 Subject:', template.subject);
      return { success: false, message: 'Email not configured' };
    }

    const transport = createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_FROM || `"TailorTrack" <${process.env.EMAIL_USER}>`,
      to,
      subject: template.subject,
      text: template.text,
      html: template.html,
    };

    const info = await transport.sendMail(mailOptions);
    console.log('✅ Email sent successfully:', info.messageId);
    console.log('📧 To:', to);
    console.log('📋 Subject:', template.subject);

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending email:', error.message);
    return { success: false, error: error.message };
  }
};

// Notification functions
const notifyOrderReadyForPickup = async (order, customer) => {
  if (!customer.email) {
    console.warn('⚠️ Customer email not found. Skipping notification.');
    return { success: false, message: 'Customer email not found' };
  }

  const template = emailTemplates.orderReadyForPickup(order, customer);
  return await sendEmail(customer.email, template);
};

const notifyOrderStatusUpdate = async (order, customer, newStatus) => {
  if (!customer.email) {
    console.warn('⚠️ Customer email not found. Skipping notification.');
    return { success: false, message: 'Customer email not found' };
  }

  const template = emailTemplates.orderStatusUpdate(order, customer, newStatus);
  return await sendEmail(customer.email, template);
};

const notifyOrderConfirmation = async (order, customer) => {
  if (!customer.email) {
    console.warn('⚠️ Customer email not found. Skipping order confirmation email.');
    return { success: false, message: 'Customer email not found' };
  }

  const template = emailTemplates.orderConfirmation(order, customer);
  return await sendEmail(customer.email, template);
};

module.exports = {
  sendEmail,
  notifyOrderReadyForPickup,
  notifyOrderStatusUpdate,
  notifyOrderConfirmation,
  emailTemplates,
};
