"use client";

import { generateCaptcha, submitEnquiry } from "@/actions/enquiry";
import { getCompanyContact } from "@/actions/contact";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AnimatePresence, motion } from "framer-motion";
import {
    CheckCircle,
    Clock,
    Loader,
    Mail,
    MapPin,
    Phone,
    RefreshCw,
    Send
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

const ContactForm = () => {
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
  const [companyContact, setCompanyContact] = useState(null);
  const [loading, setLoading] = useState(true);

  // Generate captcha when component mounts
  const refreshCaptcha = useCallback(async () => {
    try {
      const captcha = await generateCaptcha();
      setCaptchaText(captcha);
    } catch (error) {
      console.error("Error generating captcha:", error);
    }
  }, []);

  // Fetch company contact info
  useEffect(() => {
    const fetchContactInfo = async () => {
      try {
        const response = await getCompanyContact();
        if (response.success && response.contact) {
          setCompanyContact(response.contact);
        }
      } catch (error) {
        console.error("Failed to load company contact information", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchContactInfo();
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
    else if (formData.message.trim().length < 10)
      newErrors.message = "Message should be at least 10 characters";
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
        toast.success(
         "Enquiry Submitted"
        );
        
        // Reset form
        setFormData({
          name: "",
          email: "",
          phone: "",
          message: "",
          captcha: "",
        });
        
        // Generate new captcha
        refreshCaptcha();
        
        // Reset success message after 5 seconds
        setTimeout(() => {
          setSubmitSuccess(false);
        }, 5000);
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
      toast.error("Failed to submit your enquiry. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Function to render contact info skeleton during loading
  const renderContactInfoSkeleton = () => (
    <>
      <div className="flex items-start animate-pulse">
        <div className="w-10 h-10 rounded-full bg-[#fee3d8]/50 flex items-center justify-center mr-4 flex-shrink-0"></div>
        <div className="space-y-2 flex-1">
          <div className="h-4 bg-gray-200 rounded w-24"></div>
          <div className="h-3 bg-gray-200 rounded w-32"></div>
        </div>
      </div>
      <div className="flex items-start animate-pulse">
        <div className="w-10 h-10 rounded-full bg-[#fee3d8]/50 flex items-center justify-center mr-4 flex-shrink-0"></div>
        <div className="space-y-2 flex-1">
          <div className="h-4 bg-gray-200 rounded w-24"></div>
          <div className="h-3 bg-gray-200 rounded w-40"></div>
        </div>
      </div>
      <div className="flex items-start animate-pulse">
        <div className="w-10 h-10 rounded-full bg-[#fee3d8]/50 flex items-center justify-center mr-4 flex-shrink-0"></div>
        <div className="space-y-2 flex-1">
          <div className="h-4 bg-gray-200 rounded w-32"></div>
          <div className="h-3 bg-gray-200 rounded w-full"></div>
          <div className="h-3 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    </>
  );

  return (
    <section className="py-8 bg-[#F9F4F0]">
      <div className="container mx-auto px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-[#6B2F1A] mb-4" style={{ fontFamily: "Playfair Display, serif" }}>
              Contact Us
            </h1>
            <p className="text-gray-600 max-w-2xl mx-auto" style={{ fontFamily: "Poppins, sans-serif" }}>
              Get in touch with us for any queries regarding our products, services, or issues regarding an order. Our customer support representative will get back within 24Hrs. to find a solution.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Contact Information */}
            <div className="lg:col-span-1">
              <Card className="h-full bg-white border-[#6B2F1A]/10 shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl text-[#6B2F1A]" style={{ fontFamily: "Playfair Display, serif" }}>
                    CONTACT INFO
                  </CardTitle>
                  <CardDescription className="text-gray-500" style={{ fontFamily: "Poppins, sans-serif" }}>
                    We're here to help you
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {loading ? (
                    renderContactInfoSkeleton()
                  ) : companyContact ? (
                    <>
                      <div className="flex items-start">
                        <div className="w-10 h-10 rounded-full bg-[#fee3d8] flex items-center justify-center text-[#6B2F1A] mr-4 flex-shrink-0">
                          <Phone size={18} />
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-[#6B2F1A] mb-1" style={{ fontFamily: "Playfair Display, serif" }}>
                            Phone
                          </h3>
                          <p className="text-gray-600" style={{ fontFamily: "Poppins, sans-serif" }}>
                            {companyContact.phone}
                          </p>
                          {companyContact.alt_phone && (
                            <p className="text-gray-600 mt-1" style={{ fontFamily: "Poppins, sans-serif" }}>
                              {companyContact.alt_phone}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-start">
                        <div className="w-10 h-10 rounded-full bg-[#fee3d8] flex items-center justify-center text-[#6B2F1A] mr-4 flex-shrink-0">
                          <Mail size={18} />
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-[#6B2F1A] mb-1" style={{ fontFamily: "Playfair Display, serif" }}>
                            Email
                          </h3>
                          <a 
                            href={`mailto:${companyContact.email}`} 
                            className="text-gray-600 hover:text-[#6B2F1A] transition-colors"
                            style={{ fontFamily: "Poppins, sans-serif" }}
                          >
                            {companyContact.email}
                          </a>
                        </div>
                      </div>

                      <div className="flex items-start">
                        <div className="w-10 h-10 rounded-full bg-[#fee3d8] flex items-center justify-center text-[#6B2F1A] mr-4 flex-shrink-0">
                          <MapPin size={18} />
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-[#6B2F1A] mb-1" style={{ fontFamily: "Playfair Display, serif" }}>
                            Registered Office
                          </h3>
                          <p className="text-gray-600" style={{ fontFamily: "Poppins, sans-serif" }}>
                            {companyContact.address_line1}
                            {companyContact.address_line2 && <><br/>{companyContact.address_line2}</>}
                            <br/>
                            {companyContact.city}, {companyContact.state} {companyContact.postal_code}
                            <br/>
                            {companyContact.country}
                          </p>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-start">
                        <div className="w-10 h-10 rounded-full bg-[#fee3d8] flex items-center justify-center text-[#6B2F1A] mr-4 flex-shrink-0">
                          <Phone size={18} />
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-[#6B2F1A] mb-1" style={{ fontFamily: "Playfair Display, serif" }}>
                            Phone
                          </h3>
                          <p className="text-gray-600" style={{ fontFamily: "Poppins, sans-serif" }}>
                            91 8075727191
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start">
                        <div className="w-10 h-10 rounded-full bg-[#fee3d8] flex items-center justify-center text-[#6B2F1A] mr-4 flex-shrink-0">
                          <Mail size={18} />
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-[#6B2F1A] mb-1" style={{ fontFamily: "Playfair Display, serif" }}>
                            Email
                          </h3>
                          <a 
                            href="mailto:info@kauthuk.com" 
                            className="text-gray-600 hover:text-[#6B2F1A] transition-colors"
                            style={{ fontFamily: "Poppins, sans-serif" }}
                          >
                            info@kauthuk.com
                          </a>
                        </div>
                      </div>

                      <div className="flex items-start">
                        <div className="w-10 h-10 rounded-full bg-[#fee3d8] flex items-center justify-center text-[#6B2F1A] mr-4 flex-shrink-0">
                          <MapPin size={18} />
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-[#6B2F1A] mb-1" style={{ fontFamily: "Playfair Display, serif" }}>
                            Registered Office
                          </h3>
                          <p className="text-gray-600" style={{ fontFamily: "Poppins, sans-serif" }}>
                            Kauthuk 19/316D, Brookwood Villas, Vymeethy, Tripunithura, Kochi -682301 Kerala, India
                          </p>
                        </div>
                      </div>
                    </>
                  )}

                  <div className="flex items-start">
                    <div className="w-10 h-10 rounded-full bg-[#fee3d8] flex items-center justify-center text-[#6B2F1A] mr-4 flex-shrink-0">
                      <Clock size={18} />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-[#6B2F1A] mb-1" style={{ fontFamily: "Playfair Display, serif" }}>
                        Response Time
                      </h3>
                      <p className="text-gray-600" style={{ fontFamily: "Poppins, sans-serif" }}>
                        We aim to respond within 24 hours on business days
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-2">
              <Card className="bg-white border-[#6B2F1A]/10 shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl text-[#6B2F1A]" style={{ fontFamily: "Playfair Display, serif" }}>
                    Send us an inquiry
                  </CardTitle>
                  <CardDescription className="text-gray-500" style={{ fontFamily: "Poppins, sans-serif" }}>
                    Need a callback from us? Fill out the form below.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <AnimatePresence>
                    {submitSuccess ? (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="bg-[#fee3d8]/30 border border-[#6B2F1A]/20 rounded-lg p-5 flex items-start mb-6"
                      >
                        <CheckCircle className="w-5 h-5 text-[#6B2F1A] mr-3 mt-0.5 flex-shrink-0" />
                        <div>
                          <h4 className="font-semibold text-[#6B2F1A]" style={{ fontFamily: "Playfair Display, serif" }}>
                            Thank you for contacting us!
                          </h4>
                          <p className="text-gray-700 text-sm mt-1" style={{ fontFamily: "Poppins, sans-serif" }}>
                            Your message has been received. We'll get back to you within 24 hours.
                          </p>
                        </div>
                      </motion.div>
                    ) : (
                      <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label htmlFor="name" className="text-gray-700" style={{ fontFamily: "Poppins, sans-serif" }}>
                              Full Name <span className="text-red-500">*</span>
                            </Label>
                            <Input
                              id="name"
                              name="name"
                              placeholder="Your name"
                              value={formData.name}
                              onChange={handleChange}
                              className={`border-[#6B2F1A]/20 focus:border-[#6B2F1A] ${
                                errors.name ? "border-red-300 focus-visible:ring-red-500" : ""
                              }`}
                              style={{ fontFamily: "Poppins, sans-serif" }}
                            />
                            {errors.name && (
                              <p className="text-red-500 text-sm mt-1" style={{ fontFamily: "Poppins, sans-serif" }}>{errors.name}</p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="email" className="text-gray-700" style={{ fontFamily: "Poppins, sans-serif" }}>
                              Email <span className="text-red-500">*</span>
                            </Label>
                            <Input
                              id="email"
                              name="email"
                              type="email"
                              placeholder="Your email"
                              value={formData.email}
                              onChange={handleChange}
                              className={`border-[#6B2F1A]/20 focus:border-[#6B2F1A] ${
                                errors.email ? "border-red-300 focus-visible:ring-red-500" : ""
                              }`}
                              style={{ fontFamily: "Poppins, sans-serif" }}
                            />
                            {errors.email && (
                              <p className="text-red-500 text-sm mt-1" style={{ fontFamily: "Poppins, sans-serif" }}>{errors.email}</p>
                            )}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="phone" className="text-gray-700" style={{ fontFamily: "Poppins, sans-serif" }}>
                            Phone Number
                          </Label>
                          <Input
                            id="phone"
                            name="phone"
                            placeholder="Your phone number"
                            value={formData.phone}
                            onChange={handleChange}
                            className="border-[#6B2F1A]/20 focus:border-[#6B2F1A]"
                            style={{ fontFamily: "Poppins, sans-serif" }}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="message" className="text-gray-700" style={{ fontFamily: "Poppins, sans-serif" }}>
                            Message <span className="text-red-500">*</span>
                          </Label>
                          <Textarea
                            id="message"
                            name="message"
                            placeholder="How can we help you?"
                            rows={4}
                            value={formData.message}
                            onChange={handleChange}
                            className={`resize-none border-[#6B2F1A]/20 focus:border-[#6B2F1A] ${
                              errors.message ? "border-red-300 focus-visible:ring-red-500" : ""
                            }`}
                            style={{ fontFamily: "Poppins, sans-serif" }}
                          />
                          {errors.message && (
                            <p className="text-red-500 text-sm mt-1" style={{ fontFamily: "Poppins, sans-serif" }}>{errors.message}</p>
                          )}
                        </div>

                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="captcha" className="text-gray-700" style={{ fontFamily: "Poppins, sans-serif" }}>
                              Captcha <span className="text-red-500">*</span>
                            </Label>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={refreshCaptcha}
                              className="text-xs flex items-center gap-1 border-[#6B2F1A]/20 text-[#6B2F1A] hover:bg-[#fee3d8] hover:text-[#6B2F1A]"
                              style={{ fontFamily: "Poppins, sans-serif" }}
                            >
                              <RefreshCw size={12} />
                              Refresh Captcha
                            </Button>
                          </div>

                          <div className="flex flex-col sm:flex-row gap-4">
                            <div className="relative bg-[#fee3d8]/50 rounded-md p-3 text-center w-full sm:w-auto min-w-[180px] select-none">
                              <div className="relative">
                                <div 
                                  className="text-lg font-mono tracking-widest font-semibold text-[#6B2F1A] select-none"
                                  style={{
                                    transform: "skewX(-15deg)",
                                    textShadow: "1px 1px 0 rgba(0,0,0,0.1)",
                                    letterSpacing: "0.2em"
                                  }}
                                >
                                  {captchaText}
                                </div>
                                {/* Lines to make captcha harder to read by bots */}
                                <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
                                  <div className="select-none pointer-events-none opacity-20">
                                    <div className="absolute left-0 top-1/2 w-full h-0.5 bg-[#6B2F1A] rotate-3"></div>
                                    <div className="absolute left-0 bottom-1/4 w-full h-0.5 bg-[#6B2F1A] -rotate-2"></div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="flex-1">
                              <Input
                                id="captcha"
                                name="captcha"
                                placeholder="Enter captcha text"
                                value={formData.captcha}
                                onChange={handleChange}
                                className={`border-[#6B2F1A]/20 focus:border-[#6B2F1A] w-full ${
                                  errors.captcha ? "border-red-300 focus-visible:ring-red-500" : ""
                                }`}
                                style={{ fontFamily: "Poppins, sans-serif" }}
                              />
                              {errors.captcha && (
                                <p className="text-red-500 text-sm mt-1" style={{ fontFamily: "Poppins, sans-serif" }}>{errors.captcha}</p>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-end">
                          <Button
                            type="submit"
                            className="bg-[#6B2F1A] hover:bg-[#5A2814] text-white min-w-[120px]"
                            disabled={isSubmitting}
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
                          </Button>
                        </div>
                      </form>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactForm;