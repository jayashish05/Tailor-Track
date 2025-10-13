const { v4: uuidv4 } = require('uuid');
const bwipjs = require('bwip-js');

/**
 * Generate a unique barcode string
 */
const generateBarcodeString = () => {
  return uuidv4().toUpperCase().replace(/-/g, '').substring(0, 12);
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
  
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  
  // Get count of orders today
  const startOfDay = new Date(date.setHours(0, 0, 0, 0));
  const count = await Order.countDocuments({
    createdAt: { $gte: startOfDay },
  });
  
  const sequence = String(count + 1).padStart(4, '0');
  return `TT-${dateStr}-${sequence}`;
};

module.exports = {
  generateBarcodeString,
  generateBarcodeImage,
  generateQRCode,
  generateOrderNumber,
};
