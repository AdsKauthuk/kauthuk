
// app/api/verify-payment/route.js
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { db } from '@/lib/prisma';
import crypto from 'crypto';

export async function POST(request) {
  try {
    // Get payment verification data
    const {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
      order_id
    } = await request.json();
    
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
    
    // Find the order
    const order = await db.order.findUnique({
      where: { id: parseInt(order_id) },
      select: {
        id: true,
        user_id: true,
        payment_method: true
      }
    });
    
    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }
    
    // Verify that the order belongs to the authenticated user
    if (order.user_id !== userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }
    
    // In a real application, verify the Razorpay signature
    // For our purposes, we'll simulate a successful verification
    const isValidPayment = true;
    
    if (isValidPayment) {
      // Update the order payment status
      await db.order.update({
        where: { id: order.id },
        data: {
          payment_status: 'completed',
          order_status: 'confirmed'
        }
      });
      
      return NextResponse.json({
        success: true,
        message: 'Payment verified successfully'
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid payment signature' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Payment verification error:', error);
    
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to verify payment' },
      { status: 500 }
    );
  }
}