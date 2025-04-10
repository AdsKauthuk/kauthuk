"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { generateCaptcha, submitEnquiry } from '@/actions/enquiry';
import {
  MessageSquare,
  X,
  Send,
  RefreshCw,
  CheckCircle
} from 'lucide-react';
import { toast } from 'sonner';

const QuickContact = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
    captcha: "",
  });
  const [captchaText, setCaptchaText] = useState("");
  const [errors, setErrors] = useState({});
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Generate captcha when component mounts or form opens
  const refreshCaptcha = useCallback(async () => {
    if (isOpen) {
      try {
        const captcha = await generateCaptcha();
        setCaptchaText(captcha);
      } catch (error) {
        console.error("Error generating captcha:", error);
      }
    }
  }, [isOpen]);

  useEffect(() => {
    refreshCaptcha();
  }, [refreshCaptcha]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Clear error for this field as user types
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email)) 
      newErrors.email = "Email is invalid";
    if (!formData.message.trim()) newErrors.message = "Message is required";
    if (!formData.captcha.trim()) newErrors.captcha = "Please complete the captcha";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      const result = await submitEnquiry({
        ...formData,
        expectedCaptcha: captchaText
      });
      
      if (result.success) {
        // Show success message
        setSubmitSuccess(true);
        toast.success("Message sent successfully!");
        
        // Reset form
        setFormData({
          name: "",
          email: "",
          phone: "",
          message: "",
          captcha: "",
        });
        
        // Reset success message and close form after 3 seconds
        setTimeout(() => {
          setSubmitSuccess(false);
          setIsOpen(false);
        }, 3000);
      } else {
        // Show error message
        if (result.validationErrors) {
          const newErrors = {};
          result.validationErrors.forEach((err) => {
            newErrors[err.path] = err.message;
          });
          setErrors(newErrors);
        } else if (result.error === "Invalid captcha. Please try again.") {
          setErrors({ captcha: result.error });
          refreshCaptcha();
        } else {
          toast.error(result.error || "Something went wrong");
        }
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error("Failed to submit your message. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Floating contact button */}
      <div className="fixed right-0 top-1/2 transform -translate-y-1/2 z-40">
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 bg-[#6B2F1A] hover:bg-[#5A2814] text-white py-2 px-3 rounded-l-lg shadow-lg transition-all duration-300"
          style={{ fontFamily: "Poppins, sans-serif" }}
        >
          <MessageSquare size={20} />
          <span className="text-sm font-medium">Quick Contact</span>
        </button>
      </div>

      {/* Modal overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => !isSubmitting && setIsOpen(false)}
          >
            {/* Modal content */}
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.9 }}
              className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal header */}
              <div className="bg-[#6B2F1A] text-white px-6 py-4 flex items-center justify-between">
                <h3 
                  className="font-semibold text-lg" 
                  style={{ fontFamily: "Playfair Display, serif" }}
                >
                  Quick Contact
                </h3>
                <button
                  onClick={() => !isSubmitting && setIsOpen(false)}
                  className="text-white hover:text-[#fee3d8] focus:outline-none"
                  disabled={isSubmitting}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Modal body */}
              <div className="p-6">
                <AnimatePresence mode="wait">
                  {submitSuccess ? (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="bg-[#fee3d8]/30 border border-[#6B2F1A]/20 rounded-lg p-4 text-center"
                    >
                      <CheckCircle className="h-10 w-10 text-[#6B2F1A] mx-auto mb-3" />
                      <h4 
                        className="font-semibold text-[#6B2F1A] text-lg mb-2"
                        style={{ fontFamily: "Playfair Display, serif" }}
                      >
                        Thank you!
                      </h4>
                      <p 
                        className="text-gray-700"
                        style={{ fontFamily: "Poppins, sans-serif" }}
                      >
                        Your message has been sent successfully. We'll get back to you soon.
                      </p>
                    </motion.div>
                  ) : (
                    <motion.form
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onSubmit={handleSubmit}
                      className="space-y-4"
                    >
                      <p 
                        className="text-gray-600 text-sm mb-4"
                        style={{ fontFamily: "Poppins, sans-serif" }}
                      >
                        Have a quick question? Send us a message and we'll get back to you as soon as possible.
                      </p>

                      {/* Name field */}
                      <div>
                        <label 
                          htmlFor="quick-name" 
                          className="block text-sm font-medium text-gray-700 mb-1"
                          style={{ fontFamily: "Poppins, sans-serif" }}
                        >
                          Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          id="quick-name"
                          name="name"
                          type="text"
                          value={formData.name}
                          onChange={handleChange}
                          placeholder="Your name"
                          className={`w-full px-3 py-2 rounded-md border ${
                            errors.name
                              ? "border-red-300"
                              : "border-[#6B2F1A]/20"
                          } bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#6B2F1A]`}
                          style={{ fontFamily: "Poppins, sans-serif" }}
                        />
                        {errors.name && (
                          <p 
                            className="mt-1 text-xs text-red-500"
                            style={{ fontFamily: "Poppins, sans-serif" }}
                          >
                            {errors.name}
                          </p>
                        )}
                      </div>

                      {/* Email field */}
                      <div>
                        <label 
                          htmlFor="quick-email" 
                          className="block text-sm font-medium text-gray-700 mb-1"
                          style={{ fontFamily: "Poppins, sans-serif" }}
                        >
                          Email <span className="text-red-500">*</span>
                        </label>
                        <input
                          id="quick-email"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleChange}
                          placeholder="Your email"
                          className={`w-full px-3 py-2 rounded-md border ${
                            errors.email
                              ? "border-red-300"
                              : "border-[#6B2F1A]/20"
                          } bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#6B2F1A]`}
                          style={{ fontFamily: "Poppins, sans-serif" }}
                        />
                        {errors.email && (
                          <p 
                            className="mt-1 text-xs text-red-500"
                            style={{ fontFamily: "Poppins, sans-serif" }}
                          >
                            {errors.email}
                          </p>
                        )}
                      </div>

                      {/* Phone field (optional) */}
                      <div>
                        <label 
                          htmlFor="quick-phone" 
                          className="block text-sm font-medium text-gray-700 mb-1"
                          style={{ fontFamily: "Poppins, sans-serif" }}
                        >
                          Phone (optional)
                        </label>
                        <input
                          id="quick-phone"
                          name="phone"
                          type="text"
                          value={formData.phone}
                          onChange={handleChange}
                          placeholder="Your phone number"
                          className="w-full px-3 py-2 rounded-md border border-[#6B2F1A]/20 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#6B2F1A]"
                          style={{ fontFamily: "Poppins, sans-serif" }}
                        />
                      </div>

                      {/* Message field */}
                      <div>
                        <label 
                          htmlFor="quick-message" 
                          className="block text-sm font-medium text-gray-700 mb-1"
                          style={{ fontFamily: "Poppins, sans-serif" }}
                        >
                          Message <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          id="quick-message"
                          name="message"
                          value={formData.message}
                          onChange={handleChange}
                          placeholder="How can we help you?"
                          rows={3}
                          className={`w-full px-3 py-2 rounded-md border ${
                            errors.message
                              ? "border-red-300"
                              : "border-[#6B2F1A]/20"
                          } bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#6B2F1A] resize-none`}
                          style={{ fontFamily: "Poppins, sans-serif" }}
                        />
                        {errors.message && (
                          <p 
                            className="mt-1 text-xs text-red-500"
                            style={{ fontFamily: "Poppins, sans-serif" }}
                          >
                            {errors.message}
                          </p>
                        )}
                      </div>

                      {/* Captcha field */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label 
                            htmlFor="quick-captcha" 
                            className="block text-sm font-medium text-gray-700"
                            style={{ fontFamily: "Poppins, sans-serif" }}
                          >
                            Captcha <span className="text-red-500">*</span>
                          </label>
                          <button
                            type="button"
                            onClick={refreshCaptcha}
                            className="text-xs flex items-center gap-1 text-[#6B2F1A] hover:text-[#5A2814]"
                            style={{ fontFamily: "Poppins, sans-serif" }}
                          >
                            <RefreshCw size={10} />
                            Refresh
                          </button>
                        </div>

                        <div className="flex items-center space-x-3 mb-2">
                          <div className="relative bg-[#fee3d8]/50 rounded-md p-2 text-center min-w-[120px] select-none">
                            <div className="relative">
                              <div 
                                className="text-base font-mono tracking-widest font-semibold text-[#6B2F1A] select-none"
                                style={{
                                  transform: "skewX(-15deg)",
                                  textShadow: "1px 1px 0 rgba(0,0,0,0.1)",
                                  letterSpacing: "0.2em"
                                }}
                              >
                                {captchaText}
                              </div>
                              {/* Decorative lines */}
                              <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
                                <div className="opacity-20">
                                  <div className="absolute left-0 top-1/2 w-full h-px bg-[#6B2F1A] rotate-3"></div>
                                  <div className="absolute left-0 bottom-1/4 w-full h-px bg-[#6B2F1A] -rotate-2"></div>
                                </div>
                              </div>
                            </div>
                          </div>

                          <input
                            id="quick-captcha"
                            name="captcha"
                            type="text"
                            value={formData.captcha}
                            onChange={handleChange}
                            placeholder="Enter captcha"
                            className={`flex-1 px-3 py-2 rounded-md border ${
                              errors.captcha
                                ? "border-red-300"
                                : "border-[#6B2F1A]/20"
                            } bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#6B2F1A]`}
                            style={{ fontFamily: "Poppins, sans-serif" }}
                          />
                        </div>
                        {errors.captcha && (
                          <p 
                            className="mt-1 text-xs text-red-500"
                            style={{ fontFamily: "Poppins, sans-serif" }}
                          >
                            {errors.captcha}
                          </p>
                        )}
                      </div>

                      {/* Submit button */}
                      <div className="pt-2">
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="w-full px-4 py-2 bg-[#6B2F1A] hover:bg-[#5A2814] disabled:bg-[#6B2F1A]/50 text-white rounded-md font-medium flex items-center justify-center transition-colors"
                          style={{ fontFamily: "Poppins, sans-serif" }}
                        >
                          {isSubmitting ? (
                            <>
                              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                              Sending...
                            </>
                          ) : (
                            <>
                              <Send size={16} className="mr-2" />
                              Send Message
                            </>
                          )}
                        </button>
                      </div>
                    </motion.form>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default QuickContact;