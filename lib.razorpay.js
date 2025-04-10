/**
 * Razorpay helper functions for payment integration
 * 
 * In a real implementation, you should use the official Razorpay Node SDK
 * This is a simplified version for demonstration purposes
 */

import crypto from 'crypto';

// Razorpay configuration
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || 'rzp_test_jG2ZIwR6d1w09S';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'your_test_secret';

/**
 * Generate a Razorpay signature for payment verification
 * @param {string} orderId - Razorpay order ID
 * @param {string} paymentId - Razorpay payment ID
 * @returns {string} HMAC signature
 */
export function generateRazorpaySignature(orderId, paymentId) {
  // The signature is created using HMAC SHA256
  // The payload is: orderId + "|" + paymentId
  const payload = `${orderId}|${paymentId}`;
  
  // Create the HMAC using the secret key
  return crypto
    .createHmac('sha256', RAZORPAY_KEY_SECRET)
    .update(payload)
    .digest('hex');
}

/**
 * Verify a Razorpay payment signature
 * @param {string} orderId - Razorpay order ID
 * @param {string} paymentId - Razorpay payment ID
 * @param {string} signature - Signature to verify
 * @returns {boolean} True if valid, false otherwise
 */
export function verifyRazorpaySignature(orderId, paymentId, signature) {
  const expectedSignature = generateRazorpaySignature(orderId, paymentId);
  return expectedSignature === signature;
}

/**
 * Format the amount for Razorpay (in smallest currency unit)
 * @param {number} amount - Amount in decimals (e.g. 100.50)
 * @returns {number} Amount in smallest currency unit (paise for INR)
 */
export function formatAmount(amount) {
  // Razorpay expects amount in paise (100 paise = 1 INR)
  return Math.round(amount * 100);
}

/**
 * Create Razorpay payment options
 * @param {Object} data - Payment options data
 * @returns {Object} Razorpay options object
 */
export function createPaymentOptions(data) {
  if (!data.amount || !data.currency || !data.name) {
    throw new Error('Missing required payment parameters');
  }
  
  // Create options object
  return {
    key: RAZORPAY_KEY_ID,
    amount: formatAmount(data.amount), // Convert to paise
    currency: data.currency,
    name: data.name,
    description: data.description || 'Purchase from Kauthuk',
    order_id: data.orderId,
    handler: data.handler,
    prefill: {
      name: data.customerName || '',
      email: data.customerEmail || '',
      contact: data.customerPhone || ''
    },
    notes: data.notes || {},
    theme: {
      color: data.themeColor || '#6B2F1A',
    },
  };
}

/**
 * Get Razorpay API endpoint URL
 * @param {string} endpoint - API endpoint
 * @returns {string} Full API URL
 */
export function getRazorpayApiUrl(endpoint) {
  const baseUrl = 'https://api.razorpay.com/v1';
  return `${baseUrl}/${endpoint}`;
}

/**
 * Get Razorpay API authentication headers
 * @returns {Object} HTTP headers with authentication
 */
export function getRazorpayAuthHeaders() {
  // Base64 encode the API key and secret
  const auth = Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64');
  
  return {
    'Authorization': `Basic ${auth}`,
    'Content-Type': 'application/json'
  };
}

export default {
  generateRazorpaySignature,
  verifyRazorpaySignature,
  formatAmount,
  createPaymentOptions,
  getRazorpayApiUrl,
  getRazorpayAuthHeaders
};