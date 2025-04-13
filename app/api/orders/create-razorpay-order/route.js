// File: app/api/orders/create-razorpay-order/route.js
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

export async function POST(request) {
  try {
    const body = await request.json();
    const { amount, currency, orderId } = body;

    if (!amount || !currency || !orderId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Initialize Razorpay
    const Razorpay = require('razorpay');
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    // Create Razorpay order
    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(amount * 100), // Convert to lowest denomination (paise)
      currency: currency,
      receipt: `order_rcpt_${orderId}`,
      payment_capture: 1, // Auto-capture payment
      notes: {
        orderId: orderId.toString(),
      },
    });

    // Update the order with Razorpay order ID
    await prisma.order.update({
      where: { id: orderId },
      data: {
        // Add a custom field for razorpay_order_id if you need to store it
        // or you can use the order_notes field to store this info
        order_notes: JSON.stringify({
          razorpay_order_id: razorpayOrder.id,
          ...JSON.parse(await prisma.order.findUnique({ where: { id: orderId } }).order_notes || '{}'),
        }),
      },
    });

    return NextResponse.json({
      success: true,
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
    });
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create Razorpay order' },
      { status: 500 }
    );
  }
}

