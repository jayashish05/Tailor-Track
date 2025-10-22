const twilio = require('twilio');

// Only initialize Twilio if credentials are properly set
let twilioClient = null;
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

// Check if Twilio credentials are valid (not placeholder values)
const isValidTwilioConfig = accountSid && 
                           authToken && 
                           twilioPhoneNumber &&
                           accountSid.startsWith('AC') && 
                           !accountSid.includes('your_');

if (isValidTwilioConfig) {
  try {
    twilioClient = twilio(accountSid, authToken);
    console.log('✅ Twilio WhatsApp client initialized successfully');
  } catch (error) {
    console.warn('⚠️  Twilio initialization failed:', error.message);
  }
} else {
  console.warn('⚠️  Twilio credentials not configured. WhatsApp messaging will be disabled.');
  console.warn('   Please update .env with valid Twilio credentials to enable WhatsApp.');
}

/**
 * Send WhatsApp message with tracking link to customer
 * @param {string} phoneNumber - Customer's phone number (with country code)
 * @param {string} customerName - Customer's name
 * @param {string} barcode - Order barcode
 * @param {string} trackingUrl - Full tracking URL
 * @returns {Promise<object>} - Twilio response
 */
const sendOrderTrackingSMS = async (phoneNumber, customerName, barcode, trackingUrl) => {
  try {
    // Check if Twilio is configured
    if (!twilioClient) {
      console.warn('⚠️  WhatsApp message not sent: Twilio not configured');
      return {
        success: false,
        error: 'Twilio not configured. Please set up Twilio credentials in .env file.',
      };
    }

    // Ensure phone number has country code
    let formattedPhone = phoneNumber.trim();
    if (!formattedPhone.startsWith('+')) {
      // Default to India country code if not specified
      formattedPhone = `+91${formattedPhone}`;
    }

    const message = `Hi ${customerName}, your tailoring order has been placed successfully! 

Order ID: ${barcode}

Track your order here: ${trackingUrl}

Thank you for choosing Tailor Track!`;

    // Send via regular SMS (no JOIN required, works immediately)
    const response = await twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: formattedPhone,
    });

    console.log(`✅ SMS sent successfully to ${formattedPhone}. SID: ${response.sid}`);
    return {
      success: true,
      messageSid: response.sid,
      status: response.status,
    };
  } catch (error) {
    console.error('❌ Error sending SMS:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Send order status update SMS to customer
 * @param {string} phoneNumber - Customer's phone number
 * @param {string} customerName - Customer's name
 * @param {string} barcode - Order barcode
 * @param {string} newStatus - New order status
 * @param {string} trackingUrl - Full tracking URL
 * @returns {Promise<object>} - Twilio response
 */
const sendStatusUpdateSMS = async (phoneNumber, customerName, barcode, newStatus, trackingUrl) => {
  try {
    // Check if Twilio is configured
    if (!twilioClient) {
      console.warn('⚠️  SMS not sent: Twilio not configured');
      return {
        success: false,
        error: 'Twilio not configured. Please set up Twilio credentials in .env file.',
      };
    }

    let formattedPhone = phoneNumber.trim();
    if (!formattedPhone.startsWith('+')) {
      formattedPhone = `+91${formattedPhone}`;
    }

    const message = `Hi ${customerName}, your order ${barcode} status has been updated to: ${newStatus}

Track your order: ${trackingUrl}

Tailor Track`;

    // Send via regular SMS (no JOIN required, works immediately)
    const response = await twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: formattedPhone,
    });

    console.log(`✅ SMS status update sent to ${formattedPhone}. SID: ${response.sid}`);
    return {
      success: true,
      messageSid: response.sid,
      status: response.status,
    };
  } catch (error) {
    console.error('❌ Error sending status update SMS:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Validate if Twilio is properly configured
 * @returns {boolean} - True if Twilio is configured
 */
const validateTwilioConfig = () => {
  return twilioClient !== null && isValidTwilioConfig;
};

module.exports = {
  sendOrderTrackingSMS,
  sendStatusUpdateSMS,
  validateTwilioConfig,
};

module.exports = {
  sendOrderTrackingSMS,
  sendStatusUpdateSMS,
  validateTwilioConfig,
};
