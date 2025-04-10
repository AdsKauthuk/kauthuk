// app/api/orders/route.js
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { db } from '@/lib/prisma';

export async function POST(request) {
  try {
    // Get the order data from the request
    const orderData = await request.json();
    
    // Get the user token from cookies
    const token = cookies().get('userToken')?.value;
    
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Verify token
    let userId;
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      userId = decoded.id;
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Invalid authentication token' },
        { status: 401 }
      );
    }
    
    // Check if the cart is empty
    if (!orderData.items || orderData.items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Cart is empty' },
        { status: 400 }
      );
    }
    
    // Generate order ID for Razorpay (if needed for non-COD orders)
    let razorpayOrderId = null;
    if (orderData.paymentMethod !== 'cod') {
      // In a real implementation, you would generate a Razorpay order ID here
      // For now, we'll simulate one
      razorpayOrderId = `rzp_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    }
    
    // Create the order in the database
    const order = await db.order.create({
      data: {
        user_id: userId,
        total: parseFloat(orderData.total),
        payment_method: orderData.paymentMethod,
        payment_status: orderData.paymentMethod === 'cod' ? 'pending' : 'pending',
        order_status: 'placed',
        currency: orderData.currency,
        delivery_charge: parseFloat(orderData.shipping),
        tax_amount: parseFloat(orderData.tax),
        discount_amount: orderData.discount ? parseFloat(orderData.discount) : null,
        coupon_code: orderData.coupon || null,
        order_notes: orderData.notes || null,
      }
    });
    
    // Create order products for each item in the cart
    const orderProducts = await Promise.all(
      orderData.items.map(async (item) => {
        return await db.orderProduct.create({
          data: {
            order_id: order.id,
            product_id: item.id,
            price: orderData.currency === 'INR' ? parseFloat(item.price) : parseFloat(item.priceDollars),
            quantity: item.quantity || 1,
            currency: orderData.currency,
            variation: item.variant ? JSON.stringify(item.variant) : null
          }
        });
      })
    );
    
    // Create shipping details if needed
    if (orderData.shippingMethod) {
      await db.shippingDetail.create({
        data: {
          order_id: order.id,
          courier_name: orderData.shippingMethod === 'express' ? 'Express Courier' : 'Standard Shipping',
          tracking_id: '', // Will be updated when shipped
          status: 'processing'
        }
      });
    }
    
    // If not COD, return Razorpay order ID
    const responseData = {
      success: true,
      order: {
        id: order.id,
        orderId: `ORD${order.id.toString().padStart(6, '0')}`,
        ...orderData,
        razorpayOrderId
      }
    };
    
    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Error creating order:', error);
    
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create order' },
      { status: 500 }
    );
  }
}
