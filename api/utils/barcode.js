const { v4: uuidv4 } = require('uuid');
const bwipjs = require('bwip-js');

/**
 * Generate a unique barcode string (alphanumeric, 10 characters)
 * Format: TT + timestamp(6) + random(2)
 */
const generateBarcodeString = () => {
  const timestamp = Date.now().toString(36).toUpperCase().substring(0, 6);
  const random = Math.random().toString(36).toUpperCase().substring(2, 4);
  return `TT${timestamp}${random}`;
};

/**
 * Generate a simple random alphanumeric code
 * @param {number} length - Length of the code (default: 10)
 * @returns {string} - Random alphanumeric code
 */
const generateRandomCode = (length = 10) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'TT';
  for (let i = 0; i < length - 2; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

/**
 * Generate barcode image as PNG buffer
 * @param {string} text - The text to encode
 * @returns {Promise<Buffer>} - PNG image buffer
 */
const generateBarcodeImage = async (text) => {
  try {
    const png = await bwipjs.toBuffer({
      bcid: 'code128',
      text: text,
      scale: 3,
      height: 10,
      includetext: true,
      textxalign: 'center',
    });
    return png;
  } catch (error) {
    throw new Error('Failed to generate barcode: ' + error.message);
  }
};

/**
 * Generate QR code image as PNG buffer
 * @param {string} text - The text to encode
 * @returns {Promise<Buffer>} - PNG image buffer
 */
const generateQRCode = async (text) => {
  try {
    const png = await bwipjs.toBuffer({
      bcid: 'qrcode',
      text: text,
      scale: 3,
      height: 10,
      width: 10,
    });
    return png;
  } catch (error) {
    throw new Error('Failed to generate QR code: ' + error.message);
  }
};

/**
 * Generate unique order number
 * Format: TT-YYYYMMDD-XXXX
 */
const generateOrderNumber = async () => {
  const Order = require('../models/Order');
  
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  
  // Find the highest order number for today
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  
  const lastOrder = await Order.findOne({
    createdAt: { $gte: startOfDay, $lte: endOfDay },
  })
    .sort({ orderNumber: -1 })
    .select('orderNumber')
    .lean();
  
  let sequence = 1;
  if (lastOrder && lastOrder.orderNumber) {
    // Extract sequence from last order number (TT-20251017-0004 -> 0004)
    const parts = lastOrder.orderNumber.split('-');
    if (parts.length === 3) {
      const lastSequence = parts[2];
      sequence = parseInt(lastSequence, 10) + 1;
    }
  }
  
  const sequenceStr = String(sequence).padStart(4, '0');
  return `TT-${dateStr}-${sequenceStr}`;
};

module.exports = {
  generateBarcodeString,
  generateRandomCode,
  generateBarcodeImage,
  generateQRCode,
  generateOrderNumber,
};
