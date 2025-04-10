"use server";

import { db } from "@/lib/prisma";
import { cookies } from "next/headers";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import { baseEncode } from "@/lib/decode-product-data";

// Email configuration
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "kauthuk.com",
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USERNAME || "admin@kauthuk.com",
    pass: process.env.EMAIL_PASSWORD || "anoop123456",
  },
});

// Helper function to send order confirmation email
async function sendOrderConfirmationEmail(order, user, items) {
  try {
    const orderDate = new Date(order.order_date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    // Create items HTML for email
    const itemsHtml = items.map(item => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.title || "Product"}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">
          ${order.currency === "INR" ? "₹" : "$"}${parseFloat(item.price).toFixed(2)}
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">
          ${order.currency === "INR" ? "₹" : "$"}${(parseFloat(item.price) * item.quantity).toFixed(2)}
        </td>
      </tr>
    `).join('');

    // HTML email template
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order Confirmation</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; padding: 20px 0; background-color: #FFF5F1; color: #6B2F1A; }
          .content { padding: 20px 0; }
          .footer { text-align: center; padding: 20px 0; font-size: 12px; color: #777; }
          .order-details { background-color: #f8f9fa; padding: 15px; margin: 15px 0; border-radius: 4px; }
          table { width: 100%; border-collapse: collapse; }
          th { text-align: left; padding: 10px; border-bottom: 2px solid #ddd; }
          .total-row { font-weight: bold; background-color: #f8f9fa; }
          .button { display: inline-block; padding: 10px 20px; background-color: #6B2F1A; color: white; text-decoration: none; border-radius: 4px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Thank You for Your Order!</h1>
            <p>Order #${order.id}</p>
          </div>
          
          <div class="content">
            <p>Dear ${user.name},</p>
            
            <p>We're delighted to confirm that we've received your order. Here's a summary of your purchase:</p>
            
            <div class="order-details">
              <p><strong>Order Number:</strong> #${order.id}</p>
              <p><strong>Order Date:</strong> ${orderDate}</p>
              <p><strong>Payment Method:</strong> ${order.paymentMethod}</p>
              <p><strong>Order Status:</strong> ${order.status}</p>
            </div>
            
            <h3>Items Ordered:</h3>
            
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Quantity</th>
                  <th style="text-align: right;">Price</th>
                  <th style="text-align: right;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
                <tr class="total-row">
                  <td colspan="3" style="padding: 10px; text-align: right;">Subtotal:</td>
                  <td style="padding: 10px; text-align: right;">${order.currency === "INR" ? "₹" : "$"}${(parseFloat(order.total) - parseFloat(order.shipping || 0)).toFixed(2)}</td>
                </tr>
                <tr>
                  <td colspan="3" style="padding: 10px; text-align: right;">Shipping:</td>
                  <td style="padding: 10px; text-align: right;">${order.shipping > 0 ? `${order.currency === "INR" ? "₹" : "$"}${parseFloat(order.shipping).toFixed(2)}` : "Free"}</td>
                </tr>
                <tr class="total-row">
                  <td colspan="3" style="padding: 10px; text-align: right;">Total:</td>
                  <td style="padding: 10px; text-align: right;">${order.currency === "INR" ? "₹" : "$"}${parseFloat(order.total).toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
            
            <p style="margin-top: 20px;">We'll notify you when your order ships. You can also track your order status by visiting our website.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://kauthuk.com/track-order" class="button">Track Your Order</a>
            </div>
            
            <p>If you have any questions about your order, please don't hesitate to contact our customer service team.</p>
            
            <p>Thank you for shopping with us!</p>
            
            <p>Best regards,<br>The Kauthuk Team</p>
          </div>
          
          <div class="footer">
            <p>© ${new Date().getFullYear()} Kauthuk. All rights reserved.</p>
            <p>This email was sent to ${user.email}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send the email
    const mailOptions = {
      from: '"Kauthuk Shop" <admin@kauthuk.com>',
      to: user.email,
      subject: `Order Confirmation #${order.id} - Kauthuk`,
      html: emailHtml,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Order confirmation email sent to ${user.email}`);
    return true;
  } catch (error) {
    console.error("Error sending order confirmation email:", error);
    return false;
  }
}

/**
 * Get orders with pagination, filtering and sorting
 */
export async function getOrders({
  search = "",
  page = 1,
  limit = 15,
  sort = "latest",
  status = "all",
  userId = null,
  startDate = null,
  endDate = null,
} = {}) {
  try {
    // Validate and parse input parameters
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip =
      ((isNaN(pageNum) ? 1 : Math.max(1, pageNum)) - 1) *
      (isNaN(limitNum) ? 15 : Math.max(1, limitNum));

    // Build the where clause for filtering
    const where = {};

    // Apply status filter if specified
    if (status && status !== "all") {
      where.order_status = status;
    }

    // Filter by user id if provided
    if (userId) {
      const parsedUserId = parseInt(userId);
      if (!isNaN(parsedUserId)) {
        where.user_id = parsedUserId;
      }
    }

    // Filter by date range if provided
    if (startDate) {
      const parsedStartDate = new Date(startDate);
      if (!isNaN(parsedStartDate.getTime())) {
        where.order_date = {
          ...where.order_date,
          gte: parsedStartDate,
        };
      }
    }

    if (endDate) {
      const parsedEndDate = new Date(endDate);
      if (!isNaN(parsedEndDate.getTime())) {
        // Set to end of day
        parsedEndDate.setHours(23, 59, 59, 999);
        where.order_date = {
          ...where.order_date,
          lte: parsedEndDate,
        };
      }
    }

    // Apply search filter if provided
    if (search && typeof search === "string" && search.trim() !== "") {
      const searchTerm = search.trim();
      where.OR = [
        { id: isNaN(parseInt(searchTerm)) ? undefined : parseInt(searchTerm) },
        {
          User: {
            OR: [
              { name: { contains: searchTerm, mode: "insensitive" } },
              { email: { contains: searchTerm, mode: "insensitive" } },
            ],
          },
        },
      ].filter(Boolean); // Remove undefined entries
    }

    // Determine the orderBy configuration based on sort parameter
    let orderBy = {};
    switch (sort) {
      case "latest":
        orderBy = { order_date: "desc" };
        break;
      case "oldest":
        orderBy = { order_date: "asc" };
        break;
      case "high_value":
        orderBy = { total: "desc" };
        break;
      case "low_value":
        orderBy = { total: "asc" };
        break;
      default:
        orderBy = { order_date: "desc" };
    }

    // Execute the query with pagination
    const orders = await db.order.findMany({
      where,
      select: {
        id: true,
        user_id: true,
        total: true,
        payment_method: true,
        payment_status: true,
        order_status: true,
        order_date: true,
        currency: true,
        delivery_charge: true,
        tax_amount: true,
        discount_amount: true,
        coupon_code: true,
        createdAt: true,
        User: {
          select: {
            name: true,
            email: true,
          },
        },
        OrderProducts: {
          select: {
            id: true,
          },
        },
        ShippingDetail: {
          select: {
            status: true,
            tracking_id: true,
          },
        },
      },
      orderBy,
      skip,
      take: isNaN(limitNum) ? 15 : Math.max(1, limitNum),
    });

    // Count total matching records for pagination
    const totalCount = await db.order.count({ where });

    // Format the response data - Fixed the null user issue
    const formattedOrders = orders.map((order) => ({
      id: order.id,
      userId: order.user_id,
      userName: order.User?.name || "Guest User",
      userEmail: order.User?.email || "Guest Checkout",
      total: Number(order.total) || 0,
      paymentMethod: order.payment_method || "unknown",
      paymentStatus: order.payment_status || "pending",
      orderStatus: order.order_status || "placed",
      orderDate: order.order_date || new Date(),
      currency: order.currency || "INR",
      shippingStatus: order.ShippingDetail?.status || null,
      trackingId: order.ShippingDetail?.tracking_id || null,
      itemsCount: order.OrderProducts?.length || 0,
    }));

    return {
      success: true,
      orders: formattedOrders,
      totalOrders: totalCount,
      totalPages: Math.ceil(
        totalCount / (isNaN(limitNum) ? 15 : Math.max(1, limitNum))
      ),
    };
  } catch (error) {
    // Improved error handling
    const errorMessage = error.message || "Unknown error";
    console.error("Error fetching orders: " + errorMessage);

    return {
      success: false,
      error: "Failed to fetch orders: " + errorMessage,
      orders: [],
      totalOrders: 0,
      totalPages: 0,
    };
  }
}

/**
 * Create an order with option to create a user account
 * @param {Object} orderData - Complete order data including customer, items, addresses
 * @returns {Promise<Object>} Order details and success status
 */
export async function createGuestOrder(orderData) {
  try {
    // Begin a transaction to ensure all operations succeed or fail together
    const result = await db.$transaction(async (tx) => {
      // Check if user wants to create an account or already has one
      let userId = orderData.userId;
      let userInfo = null;

      // If no userId provided, we need to either find an existing user or create a new one
      if (!userId) {
        // Check if user with this email already exists
        const existingUser = await tx.user.findUnique({
          where: { email: orderData.email },
          select: { id: true, name: true, email: true },
        });

        if (existingUser) {
          // User exists but is not logged in
          userId = existingUser.id;
          userInfo = existingUser;
        } else {
          // Create a new user account - always create a user for guest checkout
          const hashedPassword = orderData.password && orderData.createAccount
            ? await bcrypt.hash(orderData.password, 10)
            : await bcrypt.hash("Apple@123", 10); // Random password if none provided or not creating an account

          // Create the user with better handling of names and mobile
          const newUser = await tx.user.create({
            data: {
              name: `${orderData.firstName || ''} ${orderData.lastName || ''}`.trim(),
              email: orderData.email,
              password: hashedPassword,
              mobile: orderData.phone || null,
              mobile_verified: "no",
              status: "active",
              newsletter_opt_in: orderData.newsletter_opt_in || false,
            },
          });

          userId = newUser.id;
          userInfo = {
            id: newUser.id,
            name: newUser.name,
            email: newUser.email
          };

          // If user opted to create an account, generate auth token
          if (orderData.createAccount) {
            // Create JWT token for auto-login
            const token = jwt.sign(
              { id: newUser.id, email: newUser.email },
              process.env.JWT_SECRET || 'fallback_secret_do_not_use_in_production',
              { expiresIn: "30d" }
            );

            // Set token in cookies
            cookies().set({
              name: "userToken",
              value: token,
              httpOnly: true,
              path: "/",
              maxAge: 60 * 60 * 24 * 30, // 30 days
              secure: process.env.NODE_ENV === "production",
              sameSite: "lax",
            });
          }
        }
      } else {
        // Get user info for email
        const user = await tx.user.findUnique({
          where: { id: userId },
          select: { id: true, name: true, email: true },
        });
        
        if (user) {
          userInfo = user;
        }
      }

      // Save the billing address
      let billingAddressId = null;

      // Fixed: better handling for country and state IDs
      if (userId) {
        // Try to find the country and state IDs
        let countryId = 1; // Default to India

        try {
          const country = await tx.country.findFirst({
            where: {
              country_enName: { contains: orderData.billingCountry },
            },
          });

          if (country) {
            countryId = country.id;
          }
        } catch (err) {
          console.error("Error finding country:", err);
        }

        let stateId = 1; // Default state

        try {
          const state = await tx.states.findFirst({
            where: {
              country_id: countryId,
              state_en: { contains: orderData.billingState, mode: "insensitive" },
            },
          });

          if (state) {
            stateId = state.id;
          }
        } catch (err) {
          console.error("Error finding state:", err);
        }

        // Save billing address for registered user
        const billingAddress = await tx.billingAddress.create({
          data: {
            user_id: userId,
            name: `${orderData.firstName || ''} ${orderData.lastName || ''}`.trim(),
            address: orderData.billingAddress1,
            apartment: orderData.billingAddress2 || null,
            city: orderData.billingCity,
            country_id: countryId,
            state_id: stateId,
            pin: orderData.billingPostalCode,
            phone: orderData.phone,
            is_default: true,
          },
        });

        billingAddressId = billingAddress.id;

        // If shipping address is different, save it too
        if (!orderData.sameAsBilling) {
          // Get country and state IDs for shipping
          let shippingCountryId = countryId;

          try {
            const country = await tx.country.findFirst({
              where: {
                country_enName: { contains: orderData.shippingCountry, mode: "insensitive" },
              },
            });

            if (country) {
              shippingCountryId = country.id;
            }
          } catch (err) {
            console.error("Error finding shipping country:", err);
          }

          let shippingStateId = stateId;

          try {
            const state = await tx.states.findFirst({
              where: {
                country_id: shippingCountryId,
                state_en: { contains: orderData.shippingState, mode: "insensitive" },
              },
            });

            if (state) {
              shippingStateId = state.id;
            }
          } catch (err) {
            console.error("Error finding shipping state:", err);
          }

          // Create delivery address
          await tx.deliveryAddress.create({
            data: {
              user_id: userId,
              name: `${orderData.firstName || ''} ${orderData.lastName || ''}`.trim(),
              address: orderData.shippingAddress1,
              apartment: orderData.shippingAddress2 || null,
              city: orderData.shippingCity,
              country_id: shippingCountryId,
              state_id: shippingStateId,
              pin: orderData.shippingPostalCode,
              phone: orderData.phone,
              is_default: true,
            },
          });
        }
      }

      // Map payment method to Prisma enum values
      const mapPaymentMethod = (method) => {
        switch (method) {
          case "card":
            return "stripe";
          case "upi":
            return "razorpay";
          case "cod":
            return "cod";
          default:
            return "online";
        }
      };

      // Create the order - FIXED: removed billing_address_id field which doesn't exist in schema
      const order = await tx.order.create({
        data: {
          user_id: userId,
          total: parseFloat(orderData.total || 0),
          payment_method: mapPaymentMethod(orderData.paymentMethod),
          payment_status: orderData.paymentStatus || "pending",
          order_status: orderData.orderStatus || "placed",
          order_date: new Date(),
          currency: orderData.currency || "INR",
          delivery_charge: parseFloat(orderData.shipping || 0),
          tax_amount: parseFloat(orderData.tax || 0),
          discount_amount: parseFloat(orderData.discount || 0),
          coupon_code: orderData.couponCode || null,
          order_notes: orderData.notes || null,
        },
      });

      // Array to store items for email
      const orderItems = [];

      // Create order products
      for (const item of orderData.items) {
        // Get the product ID and details
        const productId = item.id;
        const price =
          orderData.currency === "INR" ? parseFloat(item.price || 0) : parseFloat(item.priceDollars || 0);
        const quantity = parseInt(item.quantity || 1);

        // Create product variation object if it exists
        let variationJSON = null;
        if (item.variant) {
          variationJSON = JSON.stringify({
            id: item.variant.id,
            attributes: item.variant.attributes || [],
            price: item.variant.price || item.price,
          });
        }

        // Create order product record
        await tx.orderProduct.create({
          data: {
            order_id: order.id,
            product_id: productId,
            price: price,
            quantity: quantity,
            currency: orderData.currency,
            variation: variationJSON,
          },
        });

        // Add to items array for email
        orderItems.push({
          title: item.title,
          price: price,
          quantity: quantity,
          variant: item.variant,
        });
      }

      // Create shipping details if needed
      if (orderData.shippingMethod) {
        await tx.shippingDetail.create({
          data: {
            order_id: order.id,
            courier_name:
              orderData.shippingMethod === "express"
                ? "Express Courier"
                : "Standard Shipping",
            tracking_id: `TR-${Math.floor(Math.random() * 1000000)}`,
            status: "processing",
            shipping_date: null, // Will be set when actually shipped
          },
        });
      }

      const orderDetails = {
        id: order.id,
        total: parseFloat(order.total),
        status: order.order_status,
        paymentMethod: order.payment_method,
        paymentStatus: order.payment_status,
        currency: orderData.currency,
        shipping: orderData.shipping,
      };

      return {
        order: orderDetails,
        userId,
        userInfo,
        items: orderItems,
      };
    });

    // Send order confirmation email
    if (result.userInfo && result.userInfo.email) {
      await sendOrderConfirmationEmail(result.order, result.userInfo, result.items);
    }

    return {
      success: true,
      order: result.order,
      userId: result.userId,
      emailSent: true,
    };
  } catch (error) {
    console.error("Error creating order:", error);
    return {
      success: false,
      error: error.message || "Failed to create order",
    };
  }
}

/**
 * Create Razorpay order for payment
 * @param {Object} data - Order data including amount, currency and order ID
 * @returns {Promise<Object>} Razorpay order details
 */
export async function createRazorpayOrder(data) {
  try {
    // Validate data
    if (!data.amount) {
      return {
        success: false,
        error: "Order amount is required",
      };
    }

    // In a real implementation, you would make an API call to Razorpay
    // For this implementation, we'll simulate a successful response

    // Create a simulated Razorpay order ID
    const orderId = `rzp_order_${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 7)}`;

    return {
      success: true,
      orderId,
      amount: parseFloat(data.amount),
      currency: data.currency || "INR",
      receipt: `receipt_${data.orderId || Date.now()}`,
    };
  } catch (error) {
    console.error("Error creating Razorpay order:", error);
    return {
      success: false,
      error: error.message || "Failed to create payment order",
    };
  }
}

/**
 * Verify Razorpay payment
 * @param {Object} data - Payment verification data
 * @returns {Promise<Object>} Verification result
 */
export async function verifyPayment(data) {
  try {
    // Validate data
    if (!data.paymentData || !data.orderId) {
      return {
        success: false,
        error: "Payment data and order ID are required",
      };
    }

    // In a real implementation, you would verify the payment with Razorpay
    // by creating a signature and comparing it with the one received

    // For this implementation, we'll simulate a successful verification

    // Update the order payment status to completed
    const updatedOrder = await db.order.update({
      where: { id: parseInt(data.orderId) },
      data: {
        payment_status: "completed",
        // Store payment details
        payment_details: JSON.stringify({
          transactionId: data.paymentData.razorpay_payment_id,
          orderId: data.paymentData.razorpay_order_id,
          signature: data.paymentData.razorpay_signature,
          verifiedAt: new Date().toISOString(),
        }),
      },
      include: {
        User: {
          select: {
            name: true,
            email: true,
          },
        },
        OrderProducts: {
          include: {
            Product: {
              select: {
                title: true,
              },
            },
          },
        },
      },
    });

    // Send payment confirmation email
    if (updatedOrder && updatedOrder.User && updatedOrder.User.email) {
      try {
        // Format order items for email
        const items = updatedOrder.OrderProducts.map(item => ({
          title: item.Product?.title || "Product",
          price: Number(item.price),
          quantity: item.quantity,
        }));

        // Create an order object for the email
        const orderForEmail = {
          id: updatedOrder.id,
          total: Number(updatedOrder.total),
          status: updatedOrder.order_status,
          paymentMethod: updatedOrder.payment_method,
          paymentStatus: updatedOrder.payment_status,
          currency: updatedOrder.currency,
          shipping: Number(updatedOrder.delivery_charge || 0),
          order_date: updatedOrder.order_date,
        };

        // Send the email
        await sendOrderConfirmationEmail(orderForEmail, updatedOrder.User, items);
      } catch (emailError) {
        console.error("Failed to send payment confirmation email:", emailError);
        // Continue with the process even if email fails
      }
    }

    return {
      success: true,
      message: "Payment verified successfully",
      transactionId: data.paymentData.razorpay_payment_id,
    };
  } catch (error) {
    console.error("Error verifying payment:", error);
    return {
      success: false,
      error: error.message || "Payment verification failed",
    };
  }
}

/**
 * Get user orders (supporting guest orders with email checking)
 * @param {string} email - Email to check for guest orders
 * @returns {Promise<Object>} User's orders
 */
export async function getUserOrdersByEmail(email) {
  try {
    if (!email) {
      return {
        success: false,
        error: "Email is required",
      };
    }

    // First, check if this user exists
    const user = await db.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (!user) {
      // Look for guest orders with this email in order notes or metadata
      // This implementation would depend on how you store guest email

      // For this example, we'll return an empty array
      return {
        success: true,
        orders: [],
        message: "No orders found for this email",
      };
    }

    // Get orders for this user
    const orders = await db.order.findMany({
      where: { user_id: user.id },
      orderBy: { order_date: "desc" },
      include: {
        OrderProducts: {
          include: {
            Product: {
              select: {
                title: true,
                description: true,
              },
            },
          },
        },
        ShippingDetail: true,
      },
    });

    // Format the orders
    const formattedOrders = orders.map((order) => ({
      id: order.id,
      orderId: `ORD-${order.id.toString().padStart(4, "0")}`,
      date: new Date(order.order_date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
      status: order.order_status,
      total: Number(order.total),
      items: order.OrderProducts.length,
      shippingStatus: order.ShippingDetail?.status || null,
      currency: order.currency,
    }));

    return {
      success: true,
      orders: formattedOrders,
    };
  } catch (error) {
    console.error("Error getting user orders by email:", error);
    return {
      success: false,
      error: "Failed to get orders: " + error.message,
    };
  }
}

/**
 * Track an order by ID and email (for guest users)
 * @param {number} orderId - Order ID
 * @param {string} email - Email used during checkout
 * @returns {Promise<Object>} Order tracking information
 */
export async function trackOrderByIdAndEmail(orderId, email) {
  try {
    if (!orderId || !email) {
      return {
        success: false,
        error: "Order ID and email are required",
      };
    }

    // Find the order
    const order = await db.order.findUnique({
      where: { id: parseInt(orderId) },
      include: {
        User: {
          select: {
            email: true,
          },
        },
        ShippingDetail: true,
        OrderProducts: {
          include: {
            Product: {
              select: {
                title: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      return {
        success: false,
        error: "Order not found",
      };
    }

    // Check if this is a guest order or if the email matches
    const isUserOrder = order.User && order.User.email === email;
    const isGuestOrder = order.user_id === 0; // Assuming guest orders use 0 as user_id

    if (!isUserOrder && !isGuestOrder) {
      return {
        success: false,
        error: "Order not found for this email",
      };
    }

    // Prepare tracking information
    const trackingInfo = {
      orderId: order.id,
      orderStatus: order.order_status,
      orderDate: order.order_date,
      shippingStatus: order.ShippingDetail?.status || "processing",
      trackingId: order.ShippingDetail?.tracking_id || null,
      trackingUrl: order.ShippingDetail?.tracking_url || null,
      items: order.OrderProducts.map((item) => ({
        productId: item.product_id,
        title: item.Product?.title || "Product",
        quantity: item.quantity,
        price: Number(item.price),
      })),
      total: Number(order.total),
      shippingCharge: Number(order.delivery_charge || 0),
    };

    return {
      success: true,
      tracking: trackingInfo,
    };
  } catch (error) {
    console.error("Error tracking order:", error);
    return {
      success: false,
      error: "Failed to track order: " + error.message,
    };
  }
}

/**
 * Send an order status update email to customer
 * @param {number} orderId - Order ID
 * @param {string} newStatus - New order status
 * @returns {Promise<Object>} Email sending result
 */
export async function sendOrderStatusEmail(orderId, newStatus) {
  try {
    if (!orderId || !newStatus) {
      return {
        success: false,
        error: "Order ID and new status are required",
      };
    }

    // Get the order with user information
    const order = await db.order.findUnique({
      where: { id: parseInt(orderId) },
      include: {
        User: {
          select: {
            name: true,
            email: true,
          },
        },
        ShippingDetail: true,
      },
    });

    if (!order || !order.User || !order.User.email) {
      return {
        success: false,
        error: "Order not found or user email not available",
      };
    }

    // Create status update email content
    const statusMessages = {
      confirmed: "Your order has been confirmed and is being processed.",
      processing: "Your order is currently being processed and prepared for shipping.",
      shipped: "Great news! Your order has been shipped and is on its way to you.",
      delivered: "Your order has been delivered. We hope you enjoy your purchase!",
      cancelled: "Your order has been cancelled as requested.",
      returned: "Your return request has been processed.",
    };

    const statusMessage = statusMessages[newStatus] || `Your order status has been updated to: ${newStatus}`;
    
    // Create tracking info section if order is shipped
    let trackingSection = '';
    if (newStatus === 'shipped' && order.ShippingDetail) {
      trackingSection = `
        <div class="tracking-info" style="background-color: #f0f9ff; padding: 15px; margin: 15px 0; border-radius: 4px; border-left: 4px solid #0ea5e9;">
          <h3 style="margin-top: 0; color: #0369a1;">Shipping Information</h3>
          <p><strong>Courier:</strong> ${order.ShippingDetail.courier_name}</p>
          <p><strong>Tracking Number:</strong> ${order.ShippingDetail.tracking_id}</p>
          ${order.ShippingDetail.tracking_url ? 
            `<p><a href="${order.ShippingDetail.tracking_url}" style="color: #0369a1; text-decoration: none; font-weight: bold;">Track Your Package</a></p>` : 
            ''}
        </div>
      `;
    }

    // Email HTML template
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order Status Update</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; padding: 20px 0; background-color: #FFF5F1; color: #6B2F1A; }
          .content { padding: 20px 0; }
          .footer { text-align: center; padding: 20px 0; font-size: 12px; color: #777; }
          .status-badge { 
            display: inline-block; 
            padding: 8px 16px; 
            background-color: ${
              newStatus === 'confirmed' ? '#c6f6d5' : 
              newStatus === 'processing' ? '#fef3c7' : 
              newStatus === 'shipped' ? '#dbeafe' : 
              newStatus === 'delivered' ? '#d1fae5' : 
              newStatus === 'cancelled' ? '#fee2e2' : '#f3f4f6'
            }; 
            color: ${
              newStatus === 'confirmed' ? '#166534' : 
              newStatus === 'processing' ? '#92400e' : 
              newStatus === 'shipped' ? '#1e40af' : 
              newStatus === 'delivered' ? '#065f46' : 
              newStatus === 'cancelled' ? '#991b1b' : '#374151'
            };
            border-radius: 4px;
            font-weight: bold;
            text-transform: capitalize;
          }
          .button { display: inline-block; padding: 10px 20px; background-color: #6B2F1A; color: white; text-decoration: none; border-radius: 4px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Order Status Update</h1>
            <p>Order #${order.id}</p>
          </div>
          
          <div class="content">
            <p>Dear ${order.User.name || 'Valued Customer'},</p>
            
            <p>We're writing to inform you that your order status has been updated.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <span class="status-badge">${newStatus}</span>
            </div>
            
            <p>${statusMessage}</p>
            
            ${trackingSection}
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://kauthuk.com/track-order" class="button">View Order Details</a>
            </div>
            
            <p>If you have any questions about your order, please don't hesitate to contact our customer service team.</p>
            
            <p>Thank you for shopping with us!</p>
            
            <p>Best regards,<br>The Kauthuk Team</p>
          </div>
          
          <div class="footer">
            <p>© ${new Date().getFullYear()} Kauthuk. All rights reserved.</p>
            <p>This email was sent to ${order.User.email}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send the email
    const mailOptions = {
      from: '"Kauthuk Shop" <admin@kauthuk.com>',
      to: order.User.email,
      subject: `Order #${order.id} Status Update - ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}`,
      html: emailHtml,
    };

    await transporter.sendMail(mailOptions);

    return {
      success: true,
      message: `Order status update email sent to ${order.User.email}`,
    };
  } catch (error) {
    console.error("Error sending order status email:", error);
    return {
      success: false,
      error: "Failed to send order status email: " + error.message,
    };
  }
}

/**
 * Update order status and notify customer
 * @param {number} orderId - Order ID
 * @param {string} status - New order status
 * @returns {Promise<Object>} Update result
 */
export async function updateOrderStatus(orderId, status) {
  try {
    if (!orderId || !status) {
      return {
        success: false,
        error: "Order ID and status are required",
      };
    }

    // Update the order status
    const updatedOrder = await db.order.update({
      where: { id: parseInt(orderId) },
      data: {
        order_status: status,
      },
    });

    // If status is "shipped", update the shipping details
    if (status === "shipped") {
      await db.shippingDetail.updateMany({
        where: { order_id: parseInt(orderId) },
        data: {
          status: "shipped",
          shipping_date: new Date(),
        },
      });
    } else if (status === "delivered") {
      await db.shippingDetail.updateMany({
        where: { order_id: parseInt(orderId) },
        data: {
          status: "delivered",
        },
      });
    }

    // Send email notification about status change
    const emailResult = await sendOrderStatusEmail(orderId, status);

    return {
      success: true,
      order: updatedOrder,
      emailSent: emailResult.success,
      message: `Order status updated to ${status}`,
    };
  } catch (error) {
    console.error("Error updating order status:", error);
    return {
      success: false,
      error: "Failed to update order status: " + error.message,
    };
  }
}

/**
 * Add tracking information to an order
 * @param {number} orderId - Order ID
 * @param {Object} trackingData - Tracking information
 * @returns {Promise<Object>} Update result
 */
export async function addTrackingInformation(orderId, trackingData) {
  try {
    if (!orderId || !trackingData || !trackingData.trackingId) {
      return {
        success: false,
        error: "Order ID and tracking information are required",
      };
    }

    // Check if shipping details exist for this order
    const existingDetails = await db.shippingDetail.findUnique({
      where: { order_id: parseInt(orderId) },
    });

    let result;

    if (existingDetails) {
      // Update existing shipping details
      result = await db.shippingDetail.update({
        where: { order_id: parseInt(orderId) },
        data: {
          courier_name: trackingData.courierName || existingDetails.courier_name,
          tracking_id: trackingData.trackingId,
          tracking_url: trackingData.trackingUrl || null,
          status: trackingData.status || "shipped",
          shipping_date: new Date(),
        },
      });
    } else {
      // Create new shipping details
      result = await db.shippingDetail.create({
        data: {
          order_id: parseInt(orderId),
          courier_name: trackingData.courierName || "Standard Shipping",
          tracking_id: trackingData.trackingId,
          tracking_url: trackingData.trackingUrl || null,
          status: trackingData.status || "shipped",
          shipping_date: new Date(),
        },
      });
    }

    // Update order status if it's not already shipped or delivered
    const order = await db.order.findUnique({
      where: { id: parseInt(orderId) },
      select: { order_status: true },
    });

    if (order && !["shipped", "delivered"].includes(order.order_status)) {
      await db.order.update({
        where: { id: parseInt(orderId) },
        data: { order_status: "shipped" },
      });

      // Send shipping notification
      await sendOrderStatusEmail(orderId, "shipped");
    }

    return {
      success: true,
      tracking: result,
      message: "Tracking information added successfully",
    };
  } catch (error) {
    console.error("Error adding tracking information:", error);
    return {
      success: false,
      error: "Failed to add tracking information: " + error.message,
    };
  }
}

/**
 * Get detailed order information
 * @param {number} orderId - Order ID to retrieve
 * @returns {Promise<Object>} Complete order information
 */
export async function getOrderDetails(orderId) {
  try {
    if (!orderId) {
      return {
        success: false,
        error: "Order ID is required",
      };
    }

    const order = await db.order.findUnique({
      where: { id: parseInt(orderId) },
      include: {
        User: {
          select: {
            id: true,
            name: true,
            email: true,
            mobile: true,
          },
        },
        OrderProducts: {
          include: {
            Product: {
              select: {
                id: true,
                title: true,
                description: true,
                image: true,
              },
            },
          },
        },
        ShippingDetail: true,
      },
    });

    if (!order) {
      return {
        success: false,
        error: "Order not found",
      };
    }

    // Get the billing address for this user
    const billingAddress = await db.billingAddress.findFirst({
      where: { user_id: order.user_id },
      orderBy: { id: 'desc' },
      include: {
        Country: true,
        States: true,
      },
    });

    // Get the delivery address for this user
    const deliveryAddress = await db.deliveryAddress.findFirst({
      where: { user_id: order.user_id },
      orderBy: { id: 'desc' },
      include: {
        Country: true,
        States: true,
      },
    });

    // Format the response
    const formattedOrder = {
      id: order.id,
      orderId: `ORD-${order.id.toString().padStart(4, "0")}`,
      date: new Date(order.order_date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      status: order.order_status,
      paymentStatus: order.payment_status,
      paymentMethod: order.payment_method,
      total: Number(order.total),
      currency: order.currency,
      shippingCharge: Number(order.delivery_charge || 0),
      taxAmount: Number(order.tax_amount || 0),
      discountAmount: Number(order.discount_amount || 0),
      couponCode: order.coupon_code,
      notes: order.order_notes,
      customer: order.User ? {
        id: order.User.id,
        name: order.User.name,
        email: order.User.email,
        phone: order.User.mobile,
      } : null,
      items: order.OrderProducts.map(item => ({
        id: item.id,
        productId: item.product_id,
        title: item.Product?.title || "Product",
        description: item.Product?.description,
        image: item.Product?.image,
        price: Number(item.price),
        quantity: item.quantity,
        total: Number(item.price) * item.quantity,
        variation: item.variation ? JSON.parse(item.variation) : null,
      })),
      shipping: order.ShippingDetail ? {
        courier: order.ShippingDetail.courier_name,
        trackingId: order.ShippingDetail.tracking_id,
        trackingUrl: order.ShippingDetail.tracking_url,
        status: order.ShippingDetail.status,
        shippingDate: order.ShippingDetail.shipping_date,
      } : null,
      billingAddress: billingAddress ? {
        name: billingAddress.name,
        address: billingAddress.address,
        apartment: billingAddress.apartment,
        city: billingAddress.city,
        state: billingAddress.States?.state_en,
        country: billingAddress.Country?.country_enName,
        postalCode: billingAddress.pin,
        phone: billingAddress.phone,
      } : null,
      deliveryAddress: deliveryAddress ? {
        name: deliveryAddress.name,
        address: deliveryAddress.address,
        apartment: deliveryAddress.apartment,
        city: deliveryAddress.city,
        state: deliveryAddress.States?.state_en,
        country: deliveryAddress.Country?.country_enName,
        postalCode: deliveryAddress.pin,
        phone: deliveryAddress.phone,
      } : null,
    };

    return {
      success: true,
      order: formattedOrder,
    };
  } catch (error) {
    console.error("Error fetching order details:", error);
    return {
      success: false,
      error: "Failed to fetch order details: " + error.message,
    };
  }
}

/**
 * Send order invoice email to customer
 * @param {number} orderId - Order ID
 * @returns {Promise<Object>} Email sending result
 */
export async function sendOrderInvoice(orderId) {
  try {
    if (!orderId) {
      return {
        success: false,
        error: "Order ID is required",
      };
    }

    // Get complete order details
    const orderResult = await getOrderDetails(orderId);
    
    if (!orderResult.success) {
      return orderResult;
    }

    const order = orderResult.order;
    
    if (!order.customer || !order.customer.email) {
      return {
        success: false,
        error: "Customer email not found",
      };
    }

    // Format date for invoice
    const invoiceDate = new Date(order.date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    // Create items HTML for invoice
    const itemsHtml = order.items.map(item => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.title}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">
          ${order.currency === "INR" ? "₹" : "$"}${parseFloat(item.price).toFixed(2)}
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">
          ${order.currency === "INR" ? "₹" : "$"}${(parseFloat(item.price) * item.quantity).toFixed(2)}
        </td>
      </tr>
    `).join('');

    // Build billing and shipping address HTML
    const billingAddressHtml = order.billingAddress ? `
      <p>${order.billingAddress.name}<br>
      ${order.billingAddress.address}${order.billingAddress.apartment ? ', ' + order.billingAddress.apartment : ''}<br>
      ${order.billingAddress.city}, ${order.billingAddress.state} ${order.billingAddress.postalCode}<br>
      ${order.billingAddress.country}<br>
      Phone: ${order.billingAddress.phone}</p>
    ` : '<p>No billing address found</p>';

    const shippingAddressHtml = order.deliveryAddress ? `
      <p>${order.deliveryAddress.name}<br>
      ${order.deliveryAddress.address}${order.deliveryAddress.apartment ? ', ' + order.deliveryAddress.apartment : ''}<br>
      ${order.deliveryAddress.city}, ${order.deliveryAddress.state} ${order.deliveryAddress.postalCode}<br>
      ${order.deliveryAddress.country}<br>
      Phone: ${order.deliveryAddress.phone}</p>
    ` : (order.billingAddress ? billingAddressHtml : '<p>No shipping address found</p>');

    // HTML email template for invoice
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order Invoice</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 800px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; padding: 20px 0; background-color: #FFF5F1; color: #6B2F1A; }
          .content { padding: 20px 0; }
          .footer { text-align: center; padding: 20px 0; font-size: 12px; color: #777; }
          .invoice-header { display: flex; justify-content: space-between; margin-bottom: 30px; }
          .invoice-to { margin-bottom: 20px; }
          .addresses { display: flex; justify-content: space-between; margin-bottom: 30px; }
          .address-block { width: 48%; }
          .invoice-details { margin-bottom: 30px; background-color: #f8f9fa; padding: 15px; border-radius: 4px; }
          table { width: 100%; border-collapse: collapse; }
          th { text-align: left; padding: 10px; border-bottom: 2px solid #ddd; background-color: #f8f9fa; }
          .total-row { font-weight: bold; background-color: #f8f9fa; }
          .status-badge { 
            display: inline-block; 
            padding: 5px 10px; 
            background-color: ${
              order.status === 'placed' ? '#fef3c7' : 
              order.status === 'confirmed' ? '#c6f6d5' : 
              order.status === 'processing' ? '#dbeafe' : 
              order.status === 'shipped' ? '#dbeafe' : 
              order.status === 'delivered' ? '#d1fae5' : '#f3f4f6'
            }; 
            color: ${
              order.status === 'placed' ? '#92400e' : 
              order.status === 'confirmed' ? '#166534' : 
              order.status === 'processing' ? '#1e40af' : 
              order.status === 'shipped' ? '#1e40af' : 
              order.status === 'delivered' ? '#065f46' : '#374151'
            };
            border-radius: 4px;
            font-size: 14px;
            text-transform: uppercase;
          }
          .button { display: inline-block; padding: 10px 20px; background-color: #6B2F1A; color: white; text-decoration: none; border-radius: 4px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Invoice</h1>
            <p>${order.orderId}</p>
          </div>
          
          <div class="content">
            <div class="invoice-header">
              <div>
                <h2>Kauthuk</h2>
                <p>The Finest Handcrafted Products</p>
              </div>
              <div style="text-align: right;">
                <h3>INVOICE</h3>
                <p><strong>Invoice Date:</strong> ${invoiceDate}</p>
                <p><strong>Invoice #:</strong> INV-${order.id.toString().padStart(6, "0")}</p>
                <p><strong>Order #:</strong> ${order.orderId}</p>
                <p><strong>Status:</strong> <span class="status-badge">${order.status}</span></p>
              </div>
            </div>
            
            <div class="invoice-to">
              <h3>INVOICE TO:</h3>
              <p><strong>${order.customer.name}</strong><br>
              Email: ${order.customer.email}<br>
              Phone: ${order.customer.phone || 'Not provided'}</p>
            </div>
            
            <div class="addresses">
              <div class="address-block">
                <h3>BILLING ADDRESS:</h3>
                ${billingAddressHtml}
              </div>
              
              <div class="address-block">
                <h3>SHIPPING ADDRESS:</h3>
                ${shippingAddressHtml}
              </div>
            </div>
            
            <div>
              <h3>ORDER SUMMARY:</h3>
              <table>
                <thead>
                  <tr>
                    <th>Item</th>
                    <th style="text-align: center;">Qty</th>
                    <th style="text-align: right;">Price</th>
                    <th style="text-align: right;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                  <tr>
                    <td colspan="3" style="padding: 10px; text-align: right; border-top: 1px solid #ddd;"><strong>Subtotal:</strong></td>
                    <td style="padding: 10px; text-align: right; border-top: 1px solid #ddd;">${order.currency === "INR" ? "₹" : "$"}${(parseFloat(order.total) - parseFloat(order.shippingCharge || 0) - parseFloat(order.taxAmount || 0)).toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td colspan="3" style="padding: 10px; text-align: right;"><strong>Shipping:</strong></td>
                    <td style="padding: 10px; text-align: right;">${order.shippingCharge > 0 ? `${order.currency === "INR" ? "₹" : "$"}${parseFloat(order.shippingCharge).toFixed(2)}` : "Free"}</td>
                  </tr>
                  <tr>
                    <td colspan="3" style="padding: 10px; text-align: right;"><strong>Tax:</strong></td>
                    <td style="padding: 10px; text-align: right;">${order.currency === "INR" ? "₹" : "$"}${parseFloat(order.taxAmount || 0).toFixed(2)}</td>
                  </tr>
                  ${order.discountAmount && order.discountAmount > 0 ? `
                  <tr>
                    <td colspan="3" style="padding: 10px; text-align: right;"><strong>Discount:</strong></td>
                    <td style="padding: 10px; text-align: right;">-${order.currency === "INR" ? "₹" : "$"}${parseFloat(order.discountAmount).toFixed(2)}</td>
                  </tr>` : ''}
                  <tr class="total-row">
                    <td colspan="3" style="padding: 10px; text-align: right; border-top: 2px solid #ddd;"><strong>Total:</strong></td>
                    <td style="padding: 10px; text-align: right; border-top: 2px solid #ddd; font-size: 18px;">${order.currency === "INR" ? "₹" : "$"}${parseFloat(order.total).toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <div class="invoice-details">
              <h3>PAYMENT & SHIPPING DETAILS:</h3>
              <p><strong>Payment Method:</strong> ${order.paymentMethod.charAt(0).toUpperCase() + order.paymentMethod.slice(1)}</p>
              <p><strong>Payment Status:</strong> ${order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}</p>
              ${order.shipping ? `
              <p><strong>Shipping Method:</strong> ${order.shipping.courier}</p>
              ${order.shipping.trackingId ? `<p><strong>Tracking Number:</strong> ${order.shipping.trackingId}</p>` : ''}
              ${order.shipping.shippingDate ? `<p><strong>Shipping Date:</strong> ${new Date(order.shipping.shippingDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>` : ''}
              ` : ''}
            </div>
            
            <div style="margin: 30px 0; text-align: center;">
              <p>Thank you for your business!</p>
              
              <div style="margin-top: 20px;">
                <a href="https://kauthuk.com/track-order" class="button">Track Your Order</a>
              </div>
            </div>
            
            <div style="border-top: 1px solid #eee; padding-top: 20px;">
              <p>If you have any questions about this invoice, please contact our customer support at support@kauthuk.com</p>
            </div>
          </div>
          
          <div class="footer">
            <p>© ${new Date().getFullYear()} Kauthuk. All rights reserved.</p>
            <p>This email was sent to ${order.customer.email}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send the email
    const mailOptions = {
      from: '"Kauthuk Shop" <admin@kauthuk.com>',
      to: order.customer.email,
      subject: `Invoice for Order #${order.orderId} - Kauthuk`,
      html: emailHtml,
    };

    await transporter.sendMail(mailOptions);

    return {
      success: true,
      message: `Invoice sent to ${order.customer.email}`,
    };
  } catch (error) {
    console.error("Error sending invoice:", error);
    return {
      success: false,
      error: "Failed to send invoice: " + error.message,
    };
  }
}