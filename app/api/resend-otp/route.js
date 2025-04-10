// app/api/resend-otp/route.js
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { sendOTP } from '@/actions/auth';

export async function POST(request) {
  try {
    const body = await request.json();
    const { userId, mobile } = body;
    
    if (!userId || !mobile) {
      return NextResponse.json(
        { success: false, error: 'Missing user ID or mobile number' },
        { status: 400 }
      );
    }
    
    // Resend OTP
    const result = await sendOTP(mobile, userId);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('OTP resend error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to resend OTP' },
      { status: 500 }
    );
  }
}