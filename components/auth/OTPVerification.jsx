'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { verifyOTP, skipOTPAndRegister } from '@/actions/auth';

export default function OTPVerification({ userId, mobile, otp = null }) {
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const inputRefs = useRef([]);
  const router = useRouter();

  // Timer for resend button
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Auto-fill OTP in development mode if provided
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && otp) {
      const otpArray = otp.split('');
      setDigits(otpArray.concat(Array(6 - otpArray.length).fill('')));
    }
  }, [otp]);

  const handleChange = (index, value) => {
    if (value.length > 1) {
      // If user pastes an OTP, distribute the digits
      const pastedOTP = value.slice(0, 6).split('');
      const newDigits = [...digits];
      
      pastedOTP.forEach((digit, i) => {
        if (index + i < 6) {
          newDigits[index + i] = digit;
        }
      });
      
      setDigits(newDigits);
      
      // Move focus to the appropriate input
      const focusIndex = Math.min(index + pastedOTP.length, 5);
      if (inputRefs.current[focusIndex]) {
        inputRefs.current[focusIndex].focus();
      }
    } else {
      // Handle single digit input
      const newDigits = [...digits];
      newDigits[index] = value;
      setDigits(newDigits);
      
      // Auto-focus next input
      if (value !== '' && index < 5 && inputRefs.current[index + 1]) {
        inputRefs.current[index + 1].focus();
      }
    }
  };

  const handleKeyDown = (index, e) => {
    // Handle backspace - move to previous input when deleting
    if (e.key === 'Backspace' && index > 0 && digits[index] === '') {
      inputRefs.current[index - 1].focus();
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    
    // Combine the digits into a single OTP string
    const userOtp = digits.join('');
    
    // Validate OTP
    if (userOtp.length !== 6 || !/^\d+$/.test(userOtp)) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const result = await verifyOTP(userId, userOtp);

      if (result.success) {
        setSuccess('Mobile number verified successfully!');
        setError('');
        // Redirect to dashboard or homepage after successful verification
        setTimeout(() => {
          router.push('/my-account');
        }, 1500);
      } else {
        setError(result.error || 'Invalid OTP. Please try again.');
      }
    } catch (error) {
      console.error('OTP verification error:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    try {
      setResendLoading(true);
      setError('');

      // Call the sendOTP action from your auth.js file
      const response = await fetch('/api/resend-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, mobile }),
      });

      const result = await response.json();

      if (result.success) {
        setSuccess('OTP sent successfully!');
        setError('');
        setCountdown(30); // Reset the countdown
        
        // If in development and OTP is returned, auto-fill it
        if (process.env.NODE_ENV === 'development' && result.otp) {
          const otpArray = result.otp.split('');
          setDigits(otpArray.concat(Array(6 - otpArray.length).fill('')));
        }
      } else {
        setError(result.error || 'Failed to resend OTP. Please try again.');
      }
    } catch (error) {
      console.error('Resend OTP error:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  const handleSkipVerification = async () => {
    try {
      setLoading(true);
      setError('');

      const result = await skipOTPAndRegister(userId);

      if (result.success) {
        setSuccess('Registration completed successfully!');
        // Redirect to dashboard or homepage
        setTimeout(() => {
          router.push('/my-account');
        }, 1500);
      } else {
        setError(result.error || 'Failed to complete registration. Please try again.');
      }
    } catch (error) {
      console.error('Skip verification error:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F4F0] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-[#6B2F1A]" style={{ fontFamily: "Playfair Display, serif" }}>
          Verify Your Mobile Number
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600" style={{ fontFamily: "Poppins, sans-serif" }}>
          We sent a verification code to {mobile}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-[#6B2F1A]/10">
          {error && (
            <div className="mb-4 p-4 bg-[#fee3d8] border-l-4 border-[#6B2F1A] text-[#6B2F1A]" style={{ fontFamily: "Poppins, sans-serif" }}>
              <p>{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-4 p-4 bg-green-50 border-l-4 border-green-500 text-green-700" style={{ fontFamily: "Poppins, sans-serif" }}>
              <p>{success}</p>
            </div>
          )}

          <form onSubmit={handleVerify} className="space-y-6">
            <div>
              <label
                htmlFor="otp"
                className="block text-sm font-medium text-gray-700 mb-2"
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                Enter verification code
              </label>
              
              <div className="flex gap-2 justify-between">
                {digits.map((digit, index) => (
                  <input
                    key={index}
                    ref={el => inputRefs.current[index] = el}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleChange(index, e.target.value)}
                    onKeyDown={e => handleKeyDown(index, e)}
                    className="block w-12 h-12 text-xl text-center border border-[#6B2F1A]/20 rounded-md shadow-sm focus:outline-none focus:ring-[#6B2F1A] focus:border-[#6B2F1A]"
                    style={{ fontFamily: "Poppins, sans-serif" }}
                  />
                ))}
              </div>
              
              <p className="mt-2 text-sm text-gray-500 flex justify-between items-center" style={{ fontFamily: "Poppins, sans-serif" }}>
                <span>
                  {countdown > 0 ? (
                    <>Code expires in: {countdown}s</>
                  ) : (
                    <>Code expired</>
                  )}
                </span>
              </p>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading || digits.some(d => d === '')}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#6B2F1A] hover:bg-[#5A2814] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#6B2F1A] disabled:opacity-50"
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                    Verifying...
                  </>
                ) : (
                  'Verify'
                )}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500" style={{ fontFamily: "Poppins, sans-serif" }}>
                  or
                </span>
              </div>
            </div>
            
            <div className="mt-6 flex items-center justify-between">
              <button
                onClick={handleResendOTP}
                disabled={resendLoading || countdown > 0}
                className="text-sm font-medium text-[#6B2F1A] hover:text-[#5A2814] disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                {resendLoading ? (
                  <>
                    <Loader2 className="animate-spin inline-block mr-1 h-3 w-3" />
                    Sending...
                  </>
                ) : countdown > 0 ? (
                  `Resend OTP in ${countdown}s`
                ) : (
                  'Resend OTP'
                )}
              </button>
              
              <button
                onClick={handleSkipVerification}
                disabled={loading}
                className="text-sm font-medium text-gray-600 hover:text-[#6B2F1A]"
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                Skip Verification
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}