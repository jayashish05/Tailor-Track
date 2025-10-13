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
            color: white;
            padding: 15px 40px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            margin: 20px 0;
            text-align: center;
          }
          .cta-button:hover {
            background: #7C3AED;
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

  orderStatusUpdate: (order, customer, newStatus) => ({
    subject: `Order #${order.orderNumber} - Status Updated`,
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
            background: linear-gradient(135deg, #3B82F6 0%, #1E40AF 100%);
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 10px 10px 0 0;
          }
          .content {
            background: #f9fafb;
            padding: 30px;
            border: 1px solid #e5e7eb;
            border-top: none;
          }
          .status-badge {
            display: inline-block;
            padding: 10px 20px;
            border-radius: 20px;
            font-weight: 600;
            margin: 20px 0;
          }
          .footer {
            text-align: center;
            padding: 20px;
            color: #6b7280;
            font-size: 14px;
            border-top: 1px solid #e5e7eb;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>📦 Order Status Update</h1>
        </div>
        <div class="content">
          <p>Dear <strong>${customer.name}</strong>,</p>
          <p>Your order <strong>#${order.orderNumber}</strong> has been updated:</p>
          <div style="text-align: center;">
            <span class="status-badge" style="background: #DBEAFE; color: #1E40AF;">${newStatus}</span>
          </div>
          <p>Track your order: <a href="${process.env.FRONTEND_URL || 'http://localhost:3002'}/take-clothes">View Order</a></p>
          <p>Best regards,<br>TailorTrack Team</p>
        </div>
        <div class="footer">
          <p>This is an automated notification from TailorTrack</p>
        </div>
      </body>
      </html>
    `,
    text: `Dear ${customer.name},\n\nYour order #${order.orderNumber} status has been updated to: ${newStatus}\n\nTrack your order: ${process.env.FRONTEND_URL || 'http://localhost:3002'}/take-clothes\n\nBest regards,\nTailorTrack Team`,
  }),
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

module.exports = {
  sendEmail,
  notifyOrderReadyForPickup,
  notifyOrderStatusUpdate,
  emailTemplates,
};
