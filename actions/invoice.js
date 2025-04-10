"use server";

import { db } from "@/lib/prisma";
import { calculateTotals, numberToWords } from "@/lib/utils2";

// Static company information that doesn't change
const companyInfo = {
  name: "KAUTHUK",
  gstin: "19-TJHZOL",
  address: "Vrindavan Bypass, Mathura - 282301",
  phone: "8077677191, 9742678903",
  email: "sales@kauthuk.com",
  gst: "GST:32AROPV6237K1Z4",
  website: "www.kauthuk.com",
  bankDetails: {
    bankName: "Kauthuk",
    accountNo: "254075727191",
    ifsc: "IFDK00001066",
    customerId: "78810207",
    branch: "Equality Branch"
  },
  declaration: "We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct."
};

/**
 * Fetch invoice data by ID
 * @param {string|number} invoiceId - The ID of the invoice to fetch
 * @returns {Promise<Object>} Complete invoice data object
 */
export async function getInvoiceById(invoiceId) {
  try {
    if (!invoiceId) {
      throw new Error("Invoice ID is required");
    }

    // Fetch order information from the database
    const order = await db.order.findUnique({
      where: {
        id: Number(invoiceId)
      },
      include: {
        User: {
          select: {
            name: true,
            email: true
          }
        },
        OrderProducts: {
          include: {
            Product: {
              select: {
                title: true,
                hsn_code: true,
                tax: true
              }
            }
          }
        },
        ShippingDetail: true,
        BillingAddress: {
          include: {
            Country: true,
            States: true
          }
        }
      }
    });

    if (!order) {
      throw new Error("Invoice not found");
    }

    // Format invoice number
    const invoiceNumber = `KA-${new Date().getFullYear()}-${(new Date().getFullYear() + 1).toString().slice(2)}/${order.id.toString().padStart(4, '0')}`;
    
    // Format invoice date
    const invoiceDate = new Date(order.order_date).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });

    // Map order products to invoice items
    const items = order.OrderProducts.map((item, index) => {
      const taxRate = item.Product?.tax || 0;
      const cost = parseFloat(item.price) * item.quantity;
      const taxAmount = (cost * taxRate) / 100;
      
      // Parse variation JSON if it exists
      let discount = 0;
      if (item.variation) {
        try {
          const variationData = JSON.parse(item.variation);
          discount = variationData.discount || 0;
        } catch (error) {
          console.error("Error parsing variation data:", error);
        }
      }

      return {
        sl: index + 1,
        description: item.Product?.title || 'Product',
        hsn: item.Product?.hsn_code || '',
        gst: taxRate,
        rate: parseFloat(item.price),
        quantity: item.quantity,
        discount: discount,
        cost: cost - discount,
        igst: taxAmount,
        amount: cost - discount + taxAmount
      };
    });

    // Calculate totals
    const totals = {
      quantity: items.reduce((sum, item) => sum + item.quantity, 0),
      discount: items.reduce((sum, item) => sum + item.discount, 0),
      cost: items.reduce((sum, item) => sum + item.cost, 0),
      igst: items.reduce((sum, item) => sum + item.igst, 0),
      amount: items.reduce((sum, item) => sum + item.amount, 0)
    };

    // Include additional costs
    const additional = {
      shipping: parseFloat(order.delivery_charge) || 0,
      adjustment: order.discount_amount ? -parseFloat(order.discount_amount) : 0,
      roundOff: 0 // Can be calculated if needed
    };

    // Calculate grand total
    const grandTotal = totals.amount + additional.shipping + additional.adjustment + additional.roundOff;
    
    // Format buyer address
    const buyerAddress = order.BillingAddress ? 
      `${order.BillingAddress.address}, ${order.BillingAddress.city}, ${order.BillingAddress.States?.state_en || ''}, ${order.BillingAddress.Country?.country_enName || ''} - ${order.BillingAddress.pin}` :
      '';

    // Convert amount to words
    const amountInWords = `Rupees ${numberToWords(Math.round(grandTotal))} Only`;

    // Construct complete invoice data
    const invoiceData = {
      company: companyInfo,
      invoice: {
        number: invoiceNumber,
        date: invoiceDate,
        deliveryNote: order.order_notes || "None",
        paymentTerms: order.payment_method || "Direct",
        supplierRef: `Order #${order.id}`,
        dispatchedThrough: order.ShippingDetail?.courier_name || ""
      },
      buyer: {
        name: order.User?.name || order.BillingAddress?.name || "Guest Customer",
        gstin: "GSTIN", // You might want to add this field to your user or address model
        address: buyerAddress,
        email: order.User?.email || "",
        phone: order.BillingAddress?.phone || ""
      },
      terms: order.order_notes || "Terms of Delivery",
      items: items,
      totals: totals,
      additional: additional,
      grandTotal: grandTotal,
      taxableValue: totals.cost,
      totalTax: totals.igst,
      amountInWords: amountInWords,
      bankDetails: companyInfo.bankDetails,
      declaration: companyInfo.declaration,
      // Include order status information
      status: {
        payment: order.payment_status,
        order: order.order_status,
        shipping: order.ShippingDetail?.status || null,
        trackingId: order.ShippingDetail?.tracking_id || null,
        trackingUrl: order.ShippingDetail?.tracking_url || null
      }
    };

    return { success: true, data: invoiceData };
  } catch (error) {
    console.error("Error fetching invoice:", error);
    return { 
      success: false, 
      error: error.message || "Failed to fetch invoice data" 
    };
  }
}

/**
 * Generate a new invoice (can be used for creating draft invoices)
 * @param {Object} orderData - Order data to generate invoice from
 * @returns {Promise<Object>} Generated invoice data
 */
export async function generateInvoice(orderData) {
  try {
    if (!orderData) {
      throw new Error("Order data is required");
    }

    // Here you would typically save the order first and then generate an invoice
    // For now, we'll return a mockup with the provided data
    
    // Generate invoice number (you might want to implement a more robust numbering system)
    const invoiceNumber = `KA-${new Date().getFullYear()}-${(new Date().getFullYear() + 1).toString().slice(2)}/${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
    
    // Format invoice date
    const invoiceDate = new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });

    // Construct basic invoice data
    const invoiceData = {
      company: companyInfo,
      invoice: {
        number: invoiceNumber,
        date: invoiceDate,
        deliveryNote: orderData.notes || "None",
        paymentTerms: orderData.paymentMethod || "Direct",
        supplierRef: `Draft Order`,
        dispatchedThrough: ""
      },
      buyer: {
        name: orderData.customerName || "Draft Customer",
        gstin: orderData.gstin || "GSTIN",
        address: orderData.address || "",
        email: orderData.email || "",
        phone: orderData.phone || ""
      },
      terms: orderData.terms || "Terms of Delivery",
      items: orderData.items || [],
      // Other fields would be calculated based on items
      bankDetails: companyInfo.bankDetails,
      declaration: companyInfo.declaration
    };

    // Calculate totals from items if present
    if (orderData.items && orderData.items.length > 0) {
      const calculatedData = calculateTotals(invoiceData);
      return { success: true, data: calculatedData };
    }

    return { success: true, data: invoiceData };
  } catch (error) {
    console.error("Error generating invoice:", error);
    return { 
      success: false, 
      error: error.message || "Failed to generate invoice" 
    };
  }
}

/**
 * Update an existing invoice
 * @param {string|number} invoiceId - ID of the invoice to update
 * @param {Object} updateData - New data to update the invoice with
 * @returns {Promise<Object>} Updated invoice data
 */
export async function updateInvoice(invoiceId, updateData) {
  try {
    if (!invoiceId) {
      throw new Error("Invoice ID is required");
    }

    // First get the current invoice
    const currentInvoice = await getInvoiceById(invoiceId);
    
    if (!currentInvoice.success) {
      throw new Error(currentInvoice.error);
    }
    
    // Merge the update data with current invoice
    // Note: this is a simplified version; in reality you'd update the database
    const updatedInvoice = {
      ...currentInvoice.data,
      ...updateData,
      // Always keep company info static
      company: companyInfo,
      bankDetails: companyInfo.bankDetails,
      declaration: companyInfo.declaration
    };
    
    // If items were updated, recalculate totals
    if (updateData.items) {
      const recalculated = calculateTotals(updatedInvoice);
      return { success: true, data: recalculated };
    }
    
    return { success: true, data: updatedInvoice };
  } catch (error) {
    console.error("Error updating invoice:", error);
    return { 
      success: false, 
      error: error.message || "Failed to update invoice" 
    };
  }
}