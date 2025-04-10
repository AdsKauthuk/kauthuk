// lib/utils.js (add these functions to your existing utils file)

/**
 * Converts a number to words representation
 * @param {number} num - Number to convert to words
 * @returns {string} The number in words format
 */
export function numberToWords(num) {
    const single = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const double = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const formatTenth = (n) => n < 10 ? single[n] : double[n - 10];
    const formatOther = (n) => {
      if (n < 10) return single[n];
      if (n < 20) return double[n - 10];
      const tenner = Math.floor(n / 10);
      const rest = n - (tenner * 10);
      return `${tens[tenner]}${rest > 0 ? '-' + single[rest] : ''}`;
    };
  
    if (num === 0) return 'Zero';
  
    const isNegative = num < 0;
    num = Math.abs(num);
    let words = '';
  
    if (Math.floor(num / 10000000) > 0) {
      words += `${numberToWords(Math.floor(num / 10000000))} Crore `;
      num %= 10000000;
    }
  
    if (Math.floor(num / 100000) > 0) {
      words += `${formatOther(Math.floor(num / 100000))} Lakh `;
      num %= 100000;
    }
  
    if (Math.floor(num / 1000) > 0) {
      words += `${formatOther(Math.floor(num / 1000))} Thousand `;
      num %= 1000;
    }
  
    if (Math.floor(num / 100) > 0) {
      words += `${single[Math.floor(num / 100)]} Hundred `;
      num %= 100;
    }
  
    if (num > 0) {
      if (words !== '') words += 'and ';
      words += formatOther(num);
    }
  
    return `${isNegative ? 'Negative ' : ''}${words.trim()}`;
  }
  
  /**
   * Calculate invoice totals based on items
   * @param {Object} invoiceData - Invoice data with items
   * @returns {Object} Invoice data with calculated totals
   */
  export function calculateTotals(invoiceData) {
    if (!invoiceData.items || !Array.isArray(invoiceData.items) || invoiceData.items.length === 0) {
      return invoiceData;
    }
  
    // Calculate item totals if not already done
    const items = invoiceData.items.map((item, index) => {
      if (!item.cost) {
        const cost = (item.rate * item.quantity) - (item.discount || 0);
        const igst = (cost * (item.gst || 0)) / 100;
        const amount = cost + igst;
        
        return {
          ...item,
          sl: item.sl || index + 1,
          cost: parseFloat(cost.toFixed(2)),
          igst: parseFloat(igst.toFixed(2)),
          amount: parseFloat(amount.toFixed(2))
        };
      }
      return item;
    });
  
    // Calculate invoice totals
    const totals = {
      quantity: parseFloat(items.reduce((sum, item) => sum + (item.quantity || 0), 0).toFixed(2)),
      discount: parseFloat(items.reduce((sum, item) => sum + (item.discount || 0), 0).toFixed(2)),
      cost: parseFloat(items.reduce((sum, item) => sum + (item.cost || 0), 0).toFixed(2)),
      igst: parseFloat(items.reduce((sum, item) => sum + (item.igst || 0), 0).toFixed(2)),
      amount: parseFloat(items.reduce((sum, item) => sum + (item.amount || 0), 0).toFixed(2))
    };
  
    // Additional costs (shipping, adjustment, roundoff)
    const additional = {
      shipping: parseFloat((invoiceData.additional?.shipping || 0).toFixed(2)),
      adjustment: parseFloat((invoiceData.additional?.adjustment || 0).toFixed(2)),
      roundOff: 0, // Can calculate round off if needed
    };
  
    // Calculate grand total
    const grandTotal = parseFloat((totals.amount + additional.shipping + additional.adjustment + additional.roundOff).toFixed(2));
    
    // Amount in words
    const amountInWords = `Rupees ${numberToWords(Math.round(grandTotal))} Only`;
  
    return {
      ...invoiceData,
      items,
      totals,
      additional,
      grandTotal,
      taxableValue: totals.cost,
      totalTax: totals.igst,
      amountInWords
    };
  }
  
  /**
   * Format a number as currency
   * @param {number} amount - Amount to format
   * @param {string} currency - Currency code (default: INR)
   * @returns {string} Formatted currency string
   */
  export function formatCurrency(amount, currency = 'INR') {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2
    }).format(amount);
  }