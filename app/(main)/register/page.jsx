"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { registerWithOTP } from "@/actions/auth";
import OTPVerification from "@/components/auth/OTPVerification";

export default function RegisterPage() {
  const [formErrors, setFormErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showCaptcha, setShowCaptcha] = useState(true); // Always show captcha
  const [captchaImage, setCaptchaImage] = useState("");
  const [captchaInput, setCaptchaInput] = useState("");
  const [otpData, setOtpData] = useState(null);

  const formRef = useRef(null);

  // Load captcha on initial render
  useEffect(() => {
    refreshCaptcha();
  }, []);

  const validateForm = (data) => {
    const errors = {};

    // Name validation
    const name = data.name?.trim() || "";
    if (!name) {
      errors.name = "Name is required";
    }

    // Email validation
    const email = data.email?.trim() || "";
    if (!email) {
      errors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = "Email is invalid";
    }

    // Password validation
    const password = data.password || "";
    if (!password) {
      errors.password = "Password is required";
    } else if (password.length < 6) {
      errors.password = "Password must be at least 6 characters";
    }

    // Confirm password validation
    const confirmPassword = data.confirmPassword || "";
    if (!confirmPassword) {
      errors.confirmPassword = "Please confirm your password";
    } else if (password !== confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    // Mobile validation (optional)
    const mobile = data.mobile?.trim() || "";
    if (mobile && !/^\d{10,12}$/.test(mobile.replace(/[^0-9]/g, ""))) {
      errors.mobile = "Please enter a valid mobile number";
    }

    // Captcha validation
    if (!captchaInput) {
      errors.captcha = "Please enter the security code";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const refreshCaptcha = async () => {
    // In a real implementation, you would fetch a new captcha from your server
    // For this example, we'll set a placeholder URL
    setCaptchaImage("/api/captcha?" + new Date().getTime());
    setCaptchaInput("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Get form data
    const formData = new FormData(formRef.current);
    const formValues = Object.fromEntries(formData.entries());

    // Add captcha input to form values
    formValues.captcha = captchaInput;

    // Validate form
    if (!validateForm(formValues)) {
      return;
    }

    try {
      setLoading(true);
      setError("");

      // Create a copy of the FormData with trimmed values
      const processedFormData = new FormData();
      processedFormData.append("name", formValues.name?.trim() || "");
      processedFormData.append("email", formValues.email?.trim() || "");
      processedFormData.append("password", formValues.password || "");
      processedFormData.append(
        "confirmPassword",
        formValues.confirmPassword || ""
      );
      processedFormData.append("captcha", captchaInput);

      // Only append mobile if it's provided
      const mobile = formValues.mobile?.trim();
      if (mobile) {
        processedFormData.append("mobile", mobile);
      }

      // Call register with OTP function
      const result = await registerWithOTP(processedFormData);

      if (result.success) {
        if (result.requireOTP && result.otpSent) {
          // If OTP is required and was sent successfully, show OTP verification screen
          setOtpData({
            userId: result.user.id,
            mobile: result.user.mobile,
            otp: result.otp, // Will be undefined in production
          });
        } else if (result.requireOTP && !result.otpSent) {
          // OTP sending failed but user was created
          setError(
            result.error ||
              "Account created but failed to send OTP. Please try again."
          );
        } else {
          // No OTP required, redirect handled by the server action
          // This is for users who don't provide a mobile number
        }
      } else {
        setError(result.error || "Registration failed. Please try again.");
        refreshCaptcha();
      }
    } catch (err) {
      console.error("Registration error:", err);
      setError("An unexpected error occurred. Please try again.");
      refreshCaptcha();
    } finally {
      setLoading(false);
    }
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
          Create a new account
        </h2>
        <p
          className="mt-2 text-center text-sm text-gray-600"
          style={{ fontFamily: "Poppins, sans-serif" }}
        >
          Or{" "}
          <Link
            href="/login"
            className="font-medium text-[#6B2F1A] hover:text-[#5A2814]"
          >
            sign in to your existing account
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-[#6B2F1A]/10">
          {error && (
            <div
              className="mb-4 p-4 bg-[#fee3d8] border-l-4 border-[#6B2F1A] text-[#6B2F1A]"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              <p>{error}</p>
            </div>
          )}

          <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700"
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                Full Name
              </label>
              <div className="mt-1">
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  className={`appearance-none block w-full px-3 py-2 border ${
                    formErrors.name ? "border-red-300" : "border-[#6B2F1A]/20"
                  } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#6B2F1A] focus:border-[#6B2F1A] sm:text-sm`}
                  style={{ fontFamily: "Poppins, sans-serif" }}
                />
                {formErrors.name && (
                  <p
                    className="mt-1 text-sm text-red-600"
                    style={{ fontFamily: "Poppins, sans-serif" }}
                  >
                    {formErrors.name}
                  </p>
                )}
              </div>
            </div>

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
                    formErrors.email ? "border-red-300" : "border-[#6B2F1A]/20"
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
                htmlFor="mobile"
                className="block text-sm font-medium text-gray-700"
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                Mobile Number (for OTP verification)
              </label>
              <div className="mt-1">
                <input
                  id="mobile"
                  name="mobile"
                  type="tel"
                  autoComplete="tel"
                  className={`appearance-none block w-full px-3 py-2 border ${
                    formErrors.mobile ? "border-red-300" : "border-[#6B2F1A]/20"
                  } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#6B2F1A] focus:border-[#6B2F1A] sm:text-sm`}
                  placeholder="e.g., 9876543210"
                  style={{ fontFamily: "Poppins, sans-serif" }}
                />
                {formErrors.mobile && (
                  <p
                    className="mt-1 text-sm text-red-600"
                    style={{ fontFamily: "Poppins, sans-serif" }}
                  >
                    {formErrors.mobile}
                  </p>
                )}
                <p
                  className="mt-1 text-xs text-gray-500"
                  style={{ fontFamily: "Poppins, sans-serif" }}
                >
                  Adding a mobile number allows you to login using OTP in the
                  future
                </p>
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
                  autoComplete="new-password"
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

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700"
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                Confirm Password
              </label>
              <div className="mt-1">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  className={`appearance-none block w-full px-3 py-2 border ${
                    formErrors.confirmPassword
                      ? "border-red-300"
                      : "border-[#6B2F1A]/20"
                  } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#6B2F1A] focus:border-[#6B2F1A] sm:text-sm`}
                  style={{ fontFamily: "Poppins, sans-serif" }}
                />
                {formErrors.confirmPassword && (
                  <p
                    className="mt-1 text-sm text-red-600"
                    style={{ fontFamily: "Poppins, sans-serif" }}
                  >
                    {formErrors.confirmPassword}
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
                    required
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

            <div className="mt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#6B2F1A] hover:bg-[#5A2814] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#6B2F1A] disabled:opacity-50"
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                    Creating Account...
                  </>
                ) : (
                  "Create Account"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
