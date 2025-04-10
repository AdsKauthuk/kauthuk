'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { loginWithMobileOTP } from '@/actions/auth';

export default function MobileLogin({ onOTPSent }) {
  const [mobile, setMobile] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!mobile) {
      setError('Please enter your mobile number');
      return;
    }
    
    // Basic mobile validation
    const cleanedMobile = mobile.replace(/[^0-9]/g, "");
    if (cleanedMobile.length < 10 || cleanedMobile.length > 12) {
      setError('Please enter a valid mobile number');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      // Call the server action
      const result = await loginWithMobileOTP(cleanedMobile);
      
      if (result.success) {
        // Check if the necessary data is available
        if (!result.userId || !result.mobile) {
          setError('Unexpected response from server. Missing user data.');
          console.error('Missing user data in response:', result);
          return;
        }
        
        // Call the onOTPSent callback with the correct data structure
        onOTPSent({
          userId: result.userId,
          mobile: result.mobile,
          otp: result.otp // Will be undefined in production
        });
      } else {
        setError(result.error || 'Failed to send OTP. Please try again.');
      }
    } catch (error) {
      console.error('Mobile login error:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 
          className="text-lg font-medium text-[#6B2F1A]" 
          style={{ fontFamily: "Playfair Display, serif" }}
        >
          Login with Mobile
        </h3>
        <p 
          className="mt-1 text-sm text-gray-500" 
          style={{ fontFamily: "Poppins, sans-serif" }}
        >
          We'll send a one-time code to your phone
        </p>
      </div>

      {error && (
        <div 
          className="p-3 bg-[#fee3d8] border-l-4 border-[#6B2F1A] text-[#6B2F1A] text-sm" 
          style={{ fontFamily: "Poppins, sans-serif" }}
        >
          <p>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="mobile"
            className="block text-sm font-medium text-gray-700"
            style={{ fontFamily: "Poppins, sans-serif" }}
          >
            Mobile Number
          </label>
          <div className="mt-1">
            <input
              id="mobile"
              name="mobile"
              type="tel"
              autoComplete="tel"
              required
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              className="appearance-none block w-full px-3 py-2 border border-[#6B2F1A]/20 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#6B2F1A] focus:border-[#6B2F1A] sm:text-sm"
              placeholder="Enter your mobile number"
              style={{ fontFamily: "Poppins, sans-serif" }}
            />
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={loading || !mobile}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#6B2F1A] hover:bg-[#5A2814] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#6B2F1A] disabled:opacity-50"
            style={{ fontFamily: "Poppins, sans-serif" }}
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                Sending OTP...
              </>
            ) : (
              'Send Verification Code'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}