"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import { useUserAuth } from "@/providers/UserProvider";
import MobileLogin from "@/components/auth/MobileLogin";
import OTPVerification from "@/components/auth/OTPVerification";

export default function LoginPage() {
  const [formErrors, setFormErrors] = useState({});
  const [loginMethod, setLoginMethod] = useState("email"); // 'email' or 'mobile'
  const [otpData, setOtpData] = useState(null);
  const [showCaptcha, setShowCaptcha] = useState(false);
  const [captchaImage, setCaptchaImage] = useState("");
  const [captchaInput, setCaptchaInput] = useState("");
  const [loginAttempts, setLoginAttempts] = useState(0);

  const {
    login,
    clearError,
    error: authError,
    loading: authLoading,
  } = useUserAuth();

  // Load captcha on initial render if needed
  useEffect(() => {
    // Show captcha after 2 failed attempts or if it was previously shown
    if (loginAttempts >= 2 || showCaptcha) {
      refreshCaptcha();
    }
  }, [loginAttempts, showCaptcha]);

  const validateForm = (formData) => {
    const errors = {};

    // Email validation
    const email = formData.get("email")?.trim() || "";
    if (!email) {
      errors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = "Email is invalid";
    }

    // Password validation
    const password = formData.get("password") || "";
    if (!password) {
      errors.password = "Password is required";
    }

    // Captcha validation if shown
    if (showCaptcha && !captchaInput) {
      errors.captcha = "Please enter the captcha";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Create FormData from the form
    const formData = new FormData(e.target);
    
    // Validate form
    if (!validateForm(formData)) {
      return;
    }

    try {
      clearError?.(); // Clear any previous auth context errors

      // Check if captcha is required and validate it
      if (showCaptcha) {
        // Add captcha to form data
        formData.set("captcha", captchaInput);
        
        // In a real implementation, you would verify the captcha with a server action
        // For this example, we'll just check if it's not empty
        if (!captchaInput) {
          setFormErrors({ captcha: "Please enter the captcha code" });
          return;
        }
      }

      // Call login function from auth context
      const result = await login(formData);

      if (!result.success) {
        // Increment login attempts
        setLoginAttempts(prev => prev + 1);
        
        // If login fails multiple times, show captcha
        if (loginAttempts >= 1) {
          setShowCaptcha(true);
          await refreshCaptcha();
        }
      }
    } catch (err) {
      console.error("Login error:", err);
      setLoginAttempts(prev => prev + 1);
      setShowCaptcha(true);
      await refreshCaptcha();
    }
  };

  const refreshCaptcha = async () => {
    // In a real implementation, you would fetch a new captcha from your server
    const timestamp = new Date().getTime();
    setCaptchaImage(`/api/captcha?t=${timestamp}`);
    setCaptchaInput("");
  };

  const handleOTPSent = (data) => {
    setOtpData(data);
  };

  // If OTP has been sent, show the OTP verification form
  if (otpData) {
    return (
      <OTPVerification
        userId={otpData.userId}
        mobile={otpData.mobile}
        otp={otpData.otp}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#F9F4F0] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2
          className="mt-6 text-center text-3xl font-extrabold text-[#6B2F1A]"
          style={{ fontFamily: "Playfair Display, serif" }}
        >
          Sign in to your account
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-[#6B2F1A]/10">
          {authError && (
            <div
              className="mb-4 p-4 bg-[#fee3d8] border-l-4 border-[#6B2F1A] text-[#6B2F1A]"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              <p>{authError}</p>
            </div>
          )}

          <Tabs
            value={loginMethod}
            onValueChange={setLoginMethod}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2 mb-6 bg-[#fee3d8]/50">
              <TabsTrigger
                value="email"
                className="data-[state=active]:bg-white data-[state=active]:text-[#6B2F1A] data-[state=active]:shadow-sm"
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                Email & Password
              </TabsTrigger>
              <TabsTrigger
                value="mobile"
                className="data-[state=active]:bg-white data-[state=active]:text-[#6B2F1A] data-[state=active]:shadow-sm"
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                Mobile OTP
              </TabsTrigger>
            </TabsList>

            <TabsContent value="email">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700"
                    style={{ fontFamily: "Poppins, sans-serif" }}
                  >
                    Email address
                  </label>
                  <div className="mt-1">
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      className={`appearance-none block w-full px-3 py-2 border ${
                        formErrors.email
                          ? "border-red-300"
                          : "border-[#6B2F1A]/20"
                      } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#6B2F1A] focus:border-[#6B2F1A] sm:text-sm`}
                      style={{ fontFamily: "Poppins, sans-serif" }}
                    />
                    {formErrors.email && (
                      <p
                        className="mt-1 text-sm text-red-600"
                        style={{ fontFamily: "Poppins, sans-serif" }}
                      >
                        {formErrors.email}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-gray-700"
                    style={{ fontFamily: "Poppins, sans-serif" }}
                  >
                    Password
                  </label>
                  <div className="mt-1">
                    <input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="current-password"
                      required
                      className={`appearance-none block w-full px-3 py-2 border ${
                        formErrors.password
                          ? "border-red-300"
                          : "border-[#6B2F1A]/20"
                      } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#6B2F1A] focus:border-[#6B2F1A] sm:text-sm`}
                      style={{ fontFamily: "Poppins, sans-serif" }}
                    />
                    {formErrors.password && (
                      <p
                        className="mt-1 text-sm text-red-600"
                        style={{ fontFamily: "Poppins, sans-serif" }}
                      >
                        {formErrors.password}
                      </p>
                    )}
                  </div>
                </div>

                {showCaptcha && (
                  <div>
                    <label
                      htmlFor="captcha"
                      className="block text-sm font-medium text-gray-700"
                      style={{ fontFamily: "Poppins, sans-serif" }}
                    >
                      Security Code
                    </label>
                    <div className="mt-1">
                      <div className="flex space-x-2 mb-2">
                        {captchaImage && (
                          <img
                            src={captchaImage}
                            alt="CAPTCHA"
                            className="h-10 border border-[#6B2F1A]/20 rounded"
                          />
                        )}
                        <button
                          type="button"
                          onClick={refreshCaptcha}
                          className="px-2 py-1 text-xs text-[#6B2F1A] border border-[#6B2F1A]/20 rounded hover:bg-[#fee3d8]/50"
                          style={{ fontFamily: "Poppins, sans-serif" }}
                        >
                          Refresh
                        </button>
                      </div>
                      <input
                        id="captcha"
                        name="captcha"
                        type="text"
                        value={captchaInput}
                        onChange={(e) => setCaptchaInput(e.target.value)}
                        required={showCaptcha}
                        className={`appearance-none block w-full px-3 py-2 border ${
                          formErrors.captcha
                            ? "border-red-300"
                            : "border-[#6B2F1A]/20"
                        } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#6B2F1A] focus:border-[#6B2F1A] sm:text-sm`}
                        placeholder="Enter the code shown above"
                        style={{ fontFamily: "Poppins, sans-serif" }}
                      />
                      {formErrors.captcha && (
                        <p
                          className="mt-1 text-sm text-red-600"
                          style={{ fontFamily: "Poppins, sans-serif" }}
                        >
                          {formErrors.captcha}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      id="remember_me"
                      name="remember_me"
                      type="checkbox"
                      className="h-4 w-4 text-[#6B2F1A] focus:ring-[#6B2F1A] border-gray-300 rounded"
                    />
                    <label
                      htmlFor="remember_me"
                      className="ml-2 block text-sm text-gray-900"
                      style={{ fontFamily: "Poppins, sans-serif" }}
                    >
                      Remember me
                    </label>
                  </div>

                  <div
                    className="text-sm"
                    style={{ fontFamily: "Poppins, sans-serif" }}
                  >
                    <Link
                      href="/forgot-password"
                      className="font-medium text-[#6B2F1A] hover:text-[#5A2814]"
                    >
                      Forgot your password?
                    </Link>
                  </div>
                </div>
                <div className="w-full">
                  <p
                    className="mt-2 text-center text-sm text-gray-600 flex items-center gap-1 justify-center"
                    style={{ fontFamily: "Poppins, sans-serif" }}
                  >
                    <span className="font-medium text-[#6B2F1A] hover:text-[#5A2814]">
                      Don't have an account?
                    </span>
                    <Link
                      href="/register"
                      className="font-medium text-[#6B2F1A] hover:text-[#5A2814] underline"
                    >
                      Signup
                    </Link>
                  </p>
                </div>
                <div>
                  <button
                    type="submit"
                    disabled={authLoading}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#6B2F1A] hover:bg-[#5A2814] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#6B2F1A] disabled:opacity-50"
                    style={{ fontFamily: "Poppins, sans-serif" }}
                  >
                    {authLoading ? (
                      <>
                        <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                        Signing in...
                      </>
                    ) : (
                      "Sign in"
                    )}
                  </button>
                </div>
              </form>
            </TabsContent>

            <TabsContent value="mobile">
              <MobileLogin onOTPSent={handleOTPSent} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}