"use server";

import { db } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { baseEncode, baseDecode } from "@/lib/decode-product-data";
import { revalidatePath } from "next/cache";

/**
 * Verify mobile via OTP
 */
export async function verifyOTP(userId, otp) {
  try {
    // Validate the OTP from the session
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        mobile: true,
        name: true,
        email: true
      }
    });

    if (!user) {
      return {
        success: false,
        error: "User not found"
      };
    }

    // Check if the OTP matches the one stored in the session
    const cookieStore = cookies();
    const storedOTP = cookieStore.get('user_otp')?.value;

    if (!storedOTP || storedOTP !== otp) {
      return {
        success: false,
        error: "Invalid OTP. Please try again."
      };
    }

    // Mark the user's mobile as verified
    await db.user.update({
      where: { id: userId },
      data: { 
        mobile_verified: "yes" 
      }
    });

    // Clear the OTP cookie
    cookieStore.delete('user_otp');

    // Generate JWT token for this user and set it in cookies
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    // Set the JWT token cookie
    cookieStore.set({
      name: 'userToken',
      value: token,
      httpOnly: true,
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });

    return {
      success: true,
      message: "Mobile verified successfully",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        mobile_verified: "yes"
      }
    };
  } catch (error) {
    console.error("OTP verification error:", error.message);
    return {
      success: false,
      error: "Failed to verify OTP: " + error.message
    };
  }
}

/**
 * Generate and send OTP to user's mobile
 */
export async function sendOTP(mobile, userId = null) {
  try {
    // Validate mobile number
    if (!mobile) {
      return {
        success: false,
        error: "Mobile number is required"
      };
    }

    // Find user by mobile if userId not provided
    let user = null;
    if (!userId) {
      user = await db.user.findFirst({
        where: { mobile },
        select: {
          id: true,
          name: true,
          email: true,
          mobile: true
        }
      });

      if (!user) {
        return {
          success: false,
          error: "No account found with this mobile number"
        };
      }
      userId = user.id;
    } else {
      user = await db.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          mobile: true
        }
      });

      if (!user) {
        return {
          success: false,
          error: "User not found"
        };
      }
    }

    // Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store OTP in a cookie temporarily
    cookies().set({
      name: 'user_otp',
      value: otp,
      httpOnly: true,
      path: '/',
      maxAge: 60 * 15, // 15 minutes
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });

    // Store user info in session cookies for the verification process
    cookies().set({
      name: 'otp_user_id',
      value: user.id.toString(),
      httpOnly: true,
      path: '/',
      maxAge: 60 * 15, // 15 minutes
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });

    // In a real implementation, you would send an SMS here
    console.log(`Sending OTP: ${otp} to mobile: ${mobile}`);

    // Simulate SMS sending with MSG91 (as in your PHP code)
    // This is for demonstration - you'd need to implement actual API calls
    const smsResponse = await simulateSendSMS(mobile, otp, user.name);

    return {
      success: true,
      message: "OTP sent successfully",
      otp: process.env.NODE_ENV === 'development' ? otp : undefined, // Only in development
      userId: user.id,
      mobile: user.mobile
    };
  } catch (error) {
    console.error("Send OTP error:", error.message);
    return {
      success: false,
      error: "Failed to send OTP: " + error.message
    };
  }
}

/**
 * Skip OTP verification and register anyway
 */
export async function skipOTPAndRegister(userId) {
  try {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        mobile: true
      }
    });

    if (!user) {
      return {
        success: false,
        error: "User not found"
      };
    }

    // Set mobile as non-verified but keep the user
    await db.user.update({
      where: { id: user.id },
      data: { mobile_verified: "no" }
    });

    // Generate JWT token for this user and set it in cookies
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    // Set the JWT token cookie
    cookies().set({
      name: 'userToken',
      value: token,
      httpOnly: true,
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });

    // Clear OTP cookies
    cookies().delete('user_otp');
    cookies().delete('otp_user_id');

    return {
      success: true,
      message: "Registration completed without OTP verification",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        mobile_verified: "no"
      }
    };
  } catch (error) {
    console.error("Skip OTP error:", error.message);
    return {
      success: false,
      error: "Failed to complete registration: " + error.message
    };
  }
}

/**
 * Register a new user with OTP flow
 */
export async function registerWithOTP(formData) {
  try {
    // Extract data from form
    const name = formData.get("name")?.trim() || '';
    const email = formData.get("email")?.trim() || '';
    const password = formData.get("password") || '';
    const confirmPassword = formData.get("confirmPassword") || '';
    const mobile = formData.get("mobile")?.trim() || null;
    const captcha = formData.get("captcha") || '';
    
    // Basic validation
    if (!name || !email || !password) {
      return {
        success: false,
        error: "Name, email and password are required"
      };
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return {
        success: false,
        error: "Invalid email format"
      };
    }
    
    // Check password confirmation
    if (password !== confirmPassword) {
      return {
        success: false,
        error: "Passwords do not match"
      };
    }
    
    // Check password length
    if (password.length < 6) {
      return {
        success: false,
        error: "Password must be at least 6 characters long"
      };
    }
    
    // Verify captcha
    const cookieStore = cookies();
    const storedCaptcha = cookieStore.get('captcha_code')?.value;
    
    if (!storedCaptcha || storedCaptcha !== captcha) {
      return {
        success: false,
        error: "Invalid security code. Please try again."
      };
    }
    
    // Check if email is already registered
    const existingUser = await db.user.findUnique({
      where: { email },
      select: { id: true }
    });
    
    if (existingUser) {
      return {
        success: false,
        error: "Email is already registered"
      };
    }

    // Check if mobile is already registered (if provided)
    if (mobile) {
      const existingMobile = await db.user.findFirst({
        where: { mobile },
        select: { id: true }
      });
      
      if (existingMobile) {
        return {
          success: false,
          error: "Mobile number is already registered with another account"
        };
      }
    }
    
    // Hash the password - using bcrypt for all new users
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create the user
    const newUser = await db.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        mobile,
        mobile_verified: mobile ? "no" : null,
        status: 'active'
      },
      select: {
        id: true,
        name: true,
        email: true,
        mobile: true,
        mobile_verified: true,
        status: true
      }
    });

    // If mobile is provided, send OTP
    if (mobile) {
      const otpResult = await sendOTP(mobile, newUser.id);
      
      if (!otpResult.success) {
        // OTP sending failed but user is created
        return {
          success: true,
          requireOTP: true,
          otpSent: false,
          error: otpResult.error,
          user: newUser,
          message: "Account created but failed to send OTP"
        };
      }
      
      return {
        success: true,
        requireOTP: true,
        otpSent: true,
        user: newUser,
        otp: otpResult.otp, // Only returned in development
        message: "Account created and OTP sent for verification"
      };
    }
    
    // No mobile provided, create JWT token directly
    const token = jwt.sign(
      { id: newUser.id, email: newUser.email },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );
    
    // Set the JWT token cookie
    cookieStore.set({
      name: 'userToken',
      value: token,
      httpOnly: true,
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });
    
    return {
      success: true,
      requireOTP: false,
      user: newUser,
      message: "Account created successfully"
    };
  } catch (error) {
    const errorMessage = error.message || 'Unknown error';
    const errorCode = error.code || '';
    console.error("Registration error:", errorMessage);
    
    if (errorCode === 'P2002' && error.meta?.target?.includes('email')) {
      return {
        success: false,
        error: "Email is already registered"
      };
    }
    
    if (errorCode === 'P2002' && error.meta?.target?.includes('mobile')) {
      return {
        success: false,
        error: "Mobile number is already registered"
      };
    }
    
    return {
      success: false,
      error: "Failed to register: " + errorMessage
    };
  }
}

/**
 * Login with OTP via mobile number
 */
/**
 * Login with OTP via mobile number
 */
export async function loginWithMobileOTP(mobile) {
  try {
    if (!mobile) {
      return {
        success: false,
        error: "Mobile number is required"
      };
    }

    // Find user by mobile number
    const user = await db.user.findFirst({
      where: { 
        mobile,
        status: 'active' 
      },
      select: {
        id: true,
        name: true,
        email: true,
        mobile: true,
        mobile_verified: true
      }
    });

    if (!user) {
      return {
        success: false,
        error: "No active account found with this mobile number"
      };
    }

    // Generate and send OTP
    const otpResult = await sendOTP(mobile, user.id);
    
    if (!otpResult.success) {
      return {
        success: false,
        error: otpResult.error || "Failed to send OTP"
      };
    }

    return {
      success: true,
      message: "OTP sent successfully",
      userId: user.id,  // Make sure to include these exact fields
      mobile: user.mobile,
      user: {  // Also include the user object for backward compatibility
        id: user.id,
        name: user.name,
        email: user.email,
        mobile: user.mobile
      },
      otp: otpResult.otp // Only returned in development
    };
  } catch (error) {
    console.error("Mobile login error:", error.message);
    return {
      success: false,
      error: "Failed to initiate login: " + error.message
    };
  }
}

/**
 * Login a user with email and password including backward compatibility
 * with base64 encoded passwords
 */
export async function loginUser(formData) {
  try {
    // Extract credentials from form data
    const email = formData.get("email")?.trim() || '';
    const password = formData.get("password") || '';
    
    // Basic validation
    if (!email || !password) {
      return {
        success: false,
        error: "Email and password are required"
      };
    }
    
    // Find the user by email
    const user = await db.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        password: true,
        mobile: true,
        mobile_verified: true,
        status: true
      }
    });
    
    // Check if user exists
    if (!user) {
      return {
        success: false,
        error: "Invalid email or password"
      };
    }
    
    // Check if user is active
    if (user.status === 'inactive') {
      return {
        success: false,
        error: "Your account is currently inactive. Please contact support."
      };
    }
    
    // First try modern bcrypt verification
    let passwordMatch = false;
    try {
      passwordMatch = await bcrypt.compare(password, user.password);
    } catch (err) {
      console.log("Bcrypt verification failed, trying legacy method", err);
      passwordMatch = false;
    }
    
    // If bcrypt verification fails, try legacy base64 verification
    if (!passwordMatch) {
      try {
        // Try to decode the stored password and compare with plain text
        const decodedStoredPassword = await baseDecode(user.password);
        passwordMatch = password === decodedStoredPassword;
        
        // If using base64 encoding and the login is successful, 
        // upgrade to bcrypt
        if (passwordMatch) {
          // Upgrade the password to bcrypt
          const bcryptPassword = await bcrypt.hash(password, 10);
          await db.user.update({
            where: { id: user.id },
            data: { password: bcryptPassword }
          });
          console.log("Password upgraded from legacy format to bcrypt");
        }
      } catch (err) {
        console.log("Legacy verification failed", err);
        passwordMatch = false;
      }
    }
    
    if (!passwordMatch) {
      return {
        success: false,
        error: "Invalid email or password"
      };
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET || "fallback_secret_only_for_development",
      { expiresIn: '30d' }
    );
    
    // Set the JWT token cookie
    cookies().set({
      name: 'userToken',
      value: token,
      httpOnly: true,
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });
    
    // Return user data without password
    const { password: _, ...userData } = user;
    
    return {
      success: true,
      user: userData
    };
  } catch (error) {
    const errorMessage = error.message || 'Unknown error';
    console.error("Login error: " + errorMessage);
    
    return {
      success: false,
      error: "Failed to login: " + errorMessage
    };
  }
}

/**
 * Simulated function to send SMS (for development/demonstration)
 */
async function simulateSendSMS(mobile, otp, name = '') {
  // This function simulates the API call to MSG91 as seen in your PHP code
  console.log(`Simulating SMS to ${mobile} with OTP: ${otp}`);
  
  // In a real implementation, you would make an HTTP request to the SMS gateway
  // Example based on your PHP code:
  /*
  const response = await fetch("http://api.msg91.com/api/v2/sendsms", {
    method: "POST",
    headers: {
      "authkey": process.env.MSG91_AUTH_KEY,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      mobiles: mobile,
      message: `${otp} is your OTP to validate registration on KAUTHUK.`,
      sender: "KAUTUK",
      route: 4,
      DLT_TE_ID: "1307161002327887372"
    })
  });
  return response.json();
  */
  
  // For now, return a simulated success response
  return {
    type: "success",
    message: "OTP sent successfully"
  };
}