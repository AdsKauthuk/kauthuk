"use client";

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { useCart } from "@/providers/CartProvider";
import { toast } from "sonner";
import { useUserAuth } from "@/providers/UserProvider";

// UI Components
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Form handling
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

// Icons
import {
  AlertCircle,
  ArrowRight,
  BanknoteIcon,
  Building,
  CheckCircle2,
  ChevronLeft,
  CreditCard,
  HeartHandshake,
  Info,
  Loader2,
  Lock,
  LogIn,
  MapPin,
  Shield,
  ShoppingBag,
  Truck,
  User,
  UserPlus,
  Wallet,
} from "lucide-react";

// API functions
import { 
  createGuestOrder, 
  createRazorpayOrder, 
  verifyPayment 
} from "@/actions/order";

// Order Schema (with guest checkout support)
const OrderSchema = z.object({
  // Customer information
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  
  // Account creation option (for guest checkout)
  createAccount: z.boolean().default(false),
  password: z.string().optional()
    .refine(val => {
      // Only validate password if createAccount is true
      if (val === undefined) return true;
      return val.length >= 6 || !val;
    }, { message: "Password must be at least 6 characters" }),

  // Billing information
  billingAddress1: z.string().min(5, "Address must be at least 5 characters"),
  billingAddress2: z.string().optional(),
  billingCity: z.string().min(2, "City must be at least 2 characters"),
  billingState: z.string().min(2, "State must be at least 2 characters"),
  billingPostalCode: z
    .string()
    .min(5, "Postal code must be at least 5 characters"),
  billingCountry: z.string().min(2, "Please select a country"),

  // Shipping information
  sameAsBilling: z.boolean().default(true),
  shippingAddress1: z.string().optional(),
  shippingAddress2: z.string().optional(),
  shippingCity: z.string().optional(),
  shippingState: z.string().optional(),
  shippingPostalCode: z.string().optional(),
  shippingCountry: z.string().optional(),

  // Order details
  shippingMethod: z.enum(["standard", "express"]),
  paymentMethod: z.enum(["card", "upi", "cod"]),
  notes: z.string().optional(),

  // Terms and privacy
  termsAccepted: z.boolean().refine((val) => val === true, {
    message: "You must accept the terms and conditions",
  }),
});

// Conditional validation for shipping address based on sameAsBilling
const OrderSchemaWithConditionalValidation = OrderSchema.superRefine(
  (data, ctx) => {
    // Validate shipping address if different from billing
    if (!data.sameAsBilling) {
      if (!data.shippingAddress1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Shipping address is required",
          path: ["shippingAddress1"],
        });
      }
      if (!data.shippingCity) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "City is required",
          path: ["shippingCity"],
        });
      }
      if (!data.shippingState) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "State is required",
          path: ["shippingState"],
        });
      }
      if (!data.shippingPostalCode) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Postal code is required",
          path: ["shippingPostalCode"],
        });
      }
      if (!data.shippingCountry) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Country is required",
          path: ["shippingCountry"],
        });
      }
    }

    // Validate password if user wants to create an account
    if (data.createAccount && (!data.password || data.password.length < 6)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Password must be at least 6 characters",
        path: ["password"],
      });
    }
  }
);

// Calculate shipping cost based on total weight (in grams)
// For first 500g: ₹50
// For each additional 500g: ₹40
const calculateShippingCost = (cart, shippingMethod, currency) => {
  // If currency is not INR, use the flat rates
  if (currency !== "INR") {
    return shippingMethod === "express" ? 10 : 0; // $10 for express, free for standard in USD
  }

  // If express shipping is selected, return flat rate of ₹100
  if (shippingMethod === "express") {
    return 100;
  }

  // For standard shipping, calculate based on weight if available
  // First, check if any products have weight information
  const hasWeightInfo = cart.some(
    (item) => item.weight || (item.variant && item.variant.weight)
  );

  // If no weight information is available, return free shipping
  if (!hasWeightInfo) {
    return 0;
  }

  // Calculate total weight
  let totalWeightInGrams = 0;

  cart.forEach((item) => {
    const quantity = item.quantity || 1;
    let itemWeight = 0;

    // Get weight from item or its variant
    if (item.weight) {
      itemWeight = parseFloat(item.weight);
    } else if (item.variant && item.variant.weight) {
      itemWeight = parseFloat(item.variant.weight);
    }

    // Add to total weight (weight * quantity)
    totalWeightInGrams += itemWeight * quantity;
  });

  // If total weight is 0, return free shipping
  if (totalWeightInGrams <= 0) {
    return 0;
  }

  // Calculate shipping cost based on weight
  // First 500g: ₹50
  let shippingCost = 50;

  // If weight is more than 500g, add ₹40 for each additional 500g
  if (totalWeightInGrams > 500) {
    // Calculate how many additional 500g blocks (rounded up)
    const additionalBlocks = Math.ceil((totalWeightInGrams - 500) / 500);
    shippingCost += additionalBlocks * 40;
  }

  return shippingCost;
};

const CheckoutPage = () => {
  const router = useRouter();
  const { cart, totals, currency, formatPrice, itemCount, clearCart } =
    useCart();
  const { user, isAuthenticated, login, register: registerUser } = useUserAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderCreated, setOrderCreated] = useState(false);
  const [order, setOrder] = useState(null);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [currentStep, setCurrentStep] = useState("contact");
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [checkoutMode, setCheckoutMode] = useState(isAuthenticated ? "loggedIn" : "guest");

  // Form with validation
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    getValues,
    trigger,
    reset,
  } = useForm({
    resolver: zodResolver(OrderSchemaWithConditionalValidation),
    defaultValues: {
      firstName: user?.name?.split(" ")[0] || "",
      lastName: user?.name?.split(" ")[1] || "",
      email: user?.email || "",
      phone: user?.mobile || "",
      createAccount: false,
      password: "",
      billingAddress1: "",
      billingAddress2: "",
      billingCity: "",
      billingState: "",
      billingPostalCode: "",
      billingCountry: "India",
      sameAsBilling: true,
      shippingAddress1: "",
      shippingAddress2: "",
      shippingCity: "",
      shippingState: "",
      shippingPostalCode: "",
      shippingCountry: "India",
      shippingMethod: "standard",
      paymentMethod: "card",
      notes: "",
      termsAccepted: false,
    },
    mode: "onChange",
  });

  // Watch for form values
  const watchSameAsBilling = watch("sameAsBilling");
  const watchShippingMethod = watch("shippingMethod");
  const watchPaymentMethod = watch("paymentMethod");
  const watchCreateAccount = watch("createAccount");

  // Populate form with user data if they're logged in
  useEffect(() => {
    if (user) {
      setValue("firstName", user.name?.split(" ")[0] || "");
      setValue("lastName", user.name?.split(" ")[1] || "");
      setValue("email", user.email || "");
      setValue("phone", user.mobile || "");

      // If user has default delivery address, set it
      if (user.DeliveryAddresses && user.DeliveryAddresses.length > 0) {
        const defaultAddress =
          user.DeliveryAddresses.find((addr) => addr.is_default) ||
          user.DeliveryAddresses[0];

        if (defaultAddress) {
          setValue("billingAddress1", defaultAddress.address || "");
          setValue("billingCity", defaultAddress.city || "");
          setValue("billingState", defaultAddress.state_id?.state_en || "");
          setValue("billingPostalCode", defaultAddress.pin || "");
          setValue(
            "billingCountry",
            defaultAddress.country_id?.country_enName || "India"
          );
        }
      }
      
      // Switch to logged-in mode
      setCheckoutMode("loggedIn");
    }
  }, [user, setValue]);

  // Add this useEffect to make the Continue button work
useEffect(() => {
  // Add event listener directly to the Continue button
  const addButtonHandler = () => {
    const continueButton = document.querySelector('button[type="submit"]');
    if (continueButton) {
      continueButton.addEventListener('click', (e) => {
        // Check which step we're on
        if (currentStep === "contact") {
          // Manually trigger step change
          const isValid = validateContactInfo();
          if (isValid) {
            e.preventDefault();
            setCurrentStep("shipping");
            window.scrollTo(0, 0);
          }
        } else if (currentStep === "shipping") {
          // Manually trigger step change
          const isValid = validateShippingInfo();
          if (isValid) {
            e.preventDefault();
            setCurrentStep("payment");
            window.scrollTo(0, 0);
          }
        }
        // Let the normal form submission happen for the payment step
      });
    }
  };
  
  // Simple validation functions
  const validateContactInfo = () => {
    const firstName = document.getElementById('firstName')?.value;
    const lastName = document.getElementById('lastName')?.value;
    const email = document.getElementById('email')?.value;
    const phone = document.getElementById('phone')?.value;
    
    if (!firstName || !lastName || !email || !phone) {
      toast.error("Please fill in all required fields");
      return false;
    }
    return true;
  };
  
  const validateShippingInfo = () => {
    const billingAddress1 = document.getElementById('billingAddress1')?.value;
    const billingCity = document.getElementById('billingCity')?.value;
    const billingState = document.getElementById('billingState')?.value;
    const billingPostalCode = document.getElementById('billingPostalCode')?.value;
    
    if (!billingAddress1 || !billingCity || !billingState || !billingPostalCode) {
      toast.error("Please fill in all required billing fields");
      return false;
    }
    return true;
  };
  
  // Add the handler after a short delay to ensure the DOM is ready
  setTimeout(addButtonHandler, 500);
  
  // Cleanup
  return () => {
    const continueButton = document.querySelector('button[type="submit"]');
    if (continueButton) {
      continueButton.replaceWith(continueButton.cloneNode(true)); // Remove event listeners
    }
  };
}, [currentStep]); // Re-run when step changes
  // Check if cart is empty and redirect if needed
  useEffect(() => {
    if (cart.length === 0 && !orderCreated && typeof window !== "undefined") {
      router.push("/cart");
    }
  }, [cart, orderCreated, router]);

  // Calculate order summary
  const subtotal = totals[currency] || 0;

  // Calculate shipping cost based on weight and shipping method
  const shippingCost = useMemo(() => {
    return calculateShippingCost(cart, watchShippingMethod, currency);
  }, [cart, watchShippingMethod, currency]);

  // Calculate tax (assumed 10%)
  const taxRate = 0.1;
  const tax = subtotal * taxRate;

  // Calculate total
  const total = subtotal + tax + shippingCost;

  // Calculate total weight for display
  const totalWeight = useMemo(() => {
    let weight = 0;
    cart.forEach((item) => {
      const quantity = item.quantity || 1;
      if (item.weight) {
        weight += parseFloat(item.weight) * quantity;
      } else if (item.variant && item.variant.weight) {
        weight += parseFloat(item.variant.weight) * quantity;
      }
    });
    return weight;
  }, [cart]);

  // Check for Razorpay
  useEffect(() => {
    if (typeof window !== "undefined" && window.Razorpay) {
      setRazorpayLoaded(true);
    }
  }, []);

  const initializeRazorpay = async (orderData) => {
    try {
      if (typeof window === "undefined") {
        return; // Exit if running server-side
      }
  
      // First, ensure Razorpay script is loaded
      if (!window.Razorpay) {
        // You can provide more user-friendly handling here
        toast.error("Payment service is not available. Please try again later.");
        setIsProcessing(false);
        return;
      }
  
      // Create a Razorpay order first
      const razorpayOrder = await createRazorpayOrder({
        amount: total,
        currency: currency,
        orderId: orderData.id
      });
  
      if (!razorpayOrder.success || !razorpayOrder.orderId) {
        throw new Error(razorpayOrder.error || "Failed to create payment order");
      }
  
      // Set up Razorpay options
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_jG2ZIwR6d1w09S", // Replace with your actual test key
        amount: Math.round(total * 100), // Convert to smallest currency unit (paise)
        currency: currency,
        name: "Kauthuk",
        description: `Order #${orderData.id}`,
        order_id: razorpayOrder.orderId,
        handler: function (response) {
          // This function runs after successful payment
          handlePaymentSuccess(response, orderData.id);
        },
        prefill: {
          name: `${getValues("firstName")} ${getValues("lastName")}`,
          email: getValues("email"),
          contact: getValues("phone"), // Make sure this includes country code
        },
        notes: {
          address: getValues("billingAddress1"),
          orderId: orderData.id,
        },
        theme: {
          color: "#6B2F1A",
        },
        modal: {
          ondismiss: function () {
            setIsProcessing(false);
            toast.error("Payment cancelled");
          },
        },
      };
  
      // Create and open Razorpay payment form
      const paymentObject = new window.Razorpay(options);
      
      // Add event listeners for different payment scenarios
      paymentObject.on("payment.failed", function (response) {
        const error = response.error || {};
        toast.error(`Payment failed: ${error.description || "Unknown error"}`);
        console.error("Payment failed:", response);
        setIsProcessing(false);
      });
  
      paymentObject.open();
    } catch (error) {
      console.error("Razorpay initialization error:", error);
      toast.error("Failed to initialize payment: " + (error.message || "Please try again"));
      setIsProcessing(false);
    }
  };

  const handlePaymentSuccess = async (response, orderId) => {
    try {
      setIsProcessing(true);

      // Verify the payment
      const verificationResult = await verifyPayment({
        paymentData: {
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_order_id: response.razorpay_order_id,
          razorpay_signature: response.razorpay_signature,
        },
        orderId: orderId
      });

      if (verificationResult.success) {
        setPaymentSuccess(true);
        clearCart();
        toast.success("Payment successful!");
      } else {
        throw new Error("Payment verification failed");
      }
    } catch (error) {
      toast.error("Payment verification failed. Please contact support.");
      console.error("Payment verification error:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const processOrder = async (data) => {
    try {
      setIsProcessing(true);

      // Combine shipping and billing if sameAsBilling is true
      if (data.sameAsBilling) {
        data.shippingAddress1 = data.billingAddress1;
        data.shippingAddress2 = data.billingAddress2;
        data.shippingCity = data.billingCity;
        data.shippingState = data.billingState;
        data.shippingPostalCode = data.billingPostalCode;
        data.shippingCountry = data.billingCountry;
      }

      // Prepare the order data
      const orderData = {
        ...data,
        items: cart,
        currency,
        subtotal,
        shipping: shippingCost,
        tax,
        total,
        totalWeight,
        isGuest: !isAuthenticated,
        userId: user?.id,
        paymentStatus: data.paymentMethod === "cod" ? "pending" : "pending",
        orderStatus: "placed",
      };

      // Create the order in the database
      const result = await createGuestOrder(orderData);

      if (!result.success) {
        throw new Error(result.error || "Failed to create order");
      }

      setOrder(result.order);
      setOrderCreated(true);

      // Handle different payment methods
      if (data.paymentMethod === "cod") {
        // For COD, mark as success immediately
        setTimeout(() => {
          setPaymentSuccess(true);
          clearCart();
          setIsProcessing(false);
        }, 1500);
      } else {
        // For online payments, initialize Razorpay
        await initializeRazorpay(result.order);
      }
    } catch (error) {
      console.error("Order processing error:", error);
      toast.error(
        error.message || "An error occurred while processing your order"
      );
      setIsProcessing(false);
    }
  };

  const onSubmit = async (data) => {
    // Different behavior based on current step
    if (currentStep === "contact") {
      // Validate contact information
      const isContactValid = await trigger([
        "firstName",
        "lastName",
        "email",
        "phone",
      ]);
      
      // Also validate password if creating account
      if (data.createAccount) {
        await trigger(["password"]);
      }
      
      if (isContactValid) {
        setCurrentStep("shipping");
        window.scrollTo(0, 0);
      }
    } else if (currentStep === "shipping") {
      // Validate shipping & billing information
      const fieldsToValidate = [
        "billingAddress1",
        "billingCity",
        "billingState",
        "billingPostalCode",
        "billingCountry",
        "shippingMethod",
      ];

      if (!watchSameAsBilling) {
        fieldsToValidate.push(
          "shippingAddress1",
          "shippingCity",
          "shippingState",
          "shippingPostalCode",
          "shippingCountry"
        );
      }

      const isShippingValid = await trigger(fieldsToValidate);
      if (isShippingValid) {
        setCurrentStep("payment");
        window.scrollTo(0, 0);
      }
    } else if (currentStep === "payment") {
      // Validate payment information and complete the order
      const isPaymentValid = await trigger(["paymentMethod", "termsAccepted"]);
      if (isPaymentValid) {
        processOrder(data);
      }
    }
  };

  // Handle going back to previous step
  const handleBack = () => {
    if (currentStep === "shipping") {
      setCurrentStep("contact");
    } else if (currentStep === "payment") {
      setCurrentStep("shipping");
    }
    window.scrollTo(0, 0);
  };

  // Handle mode switch between guest checkout and login
  const handleModeSwitch = (mode) => {
    setCheckoutMode(mode);
  };

  // If cart is empty, redirect to cart page
  if (cart.length === 0 && !orderCreated) {
    return (
      <div className="min-h-screen bg-[#FFFBF9] py-16">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-md mx-auto">
            <div className="flex justify-center mb-6">
              <div className="p-6 bg-white rounded-full shadow-sm">
                <ShoppingBag className="h-12 w-12 text-gray-400" />
              </div>
            </div>
            <h1 className="text-3xl font-bold mb-4">
              Your cart is empty
            </h1>
            <p className="text-gray-600 mb-8">
              Please add some products to your cart before checking out.
            </p>
            <Link href="/products">
              <Button className="px-8 py-6 text-lg bg-[#6B2F1A] hover:bg-[#5A2814]">
                <ChevronLeft className="h-5 w-5 mr-2" />
                Browse Products
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Show payment success page
  if (paymentSuccess) {
    return (
      <div className="min-h-screen bg-[#FFFBF9] py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-sm p-8">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 bg-[#fee3d8] rounded-full flex items-center justify-center mb-6">
                <CheckCircle2 className="h-10 w-10 text-[#6B2F1A]" />
              </div>
              <h1 className="text-3xl font-bold text-[#6B2F1A] mb-4">
                Order Confirmed!
              </h1>
              <p className="text-lg text-gray-600 mb-6">
                Thank you for your purchase. Your order has been placed
                successfully.
              </p>
              <div className="w-full bg-[#FFF5F1] rounded-lg p-6 mb-6">
                <div className="flex justify-between mb-2">
                  <span className="font-medium">Order Number:</span>
                  <span>{order?.id || "ORD123456"}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="font-medium">Order Date:</span>
                  <span>{new Date().toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Order Total:</span>
                  <span className="font-semibold text-[#6B2F1A]">
                    {formatPrice(total)}
                  </span>
                </div>
              </div>
              <p className="text-gray-600 mb-8">
                We've sent a confirmation email to{" "}
                <strong>{getValues("email")}</strong> with all the details of
                your order.
              </p>
              {watchCreateAccount && !isAuthenticated && (
                <Alert className="mb-8 bg-[#FFF5F1] border-[#fee3d8]">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#6B2F1A]" />
                    <AlertTitle className="text-[#6B2F1A]">
                      Account Created
                    </AlertTitle>
                  </div>
                  <AlertDescription className="text-[#6B2F1A]/80 mt-1">
                    Your account has been created successfully. You can now log in with your email and password.
                  </AlertDescription>
                </Alert>
              )}
              <div className="flex flex-col sm:flex-row gap-4 w-full">
                <Link href="/my-account" className="flex-1">
                  <Button
                    variant="outline"
                    className="w-full border-[#6B2F1A]/20 text-[#6B2F1A] hover:bg-[#fee3d8] hover:text-[#6B2F1A]"
                  >
                    View My Orders
                  </Button>
                </Link>
                <Link href="/products" className="flex-1">
                  <Button className="w-full bg-[#6B2F1A] hover:bg-[#5A2814]">
                    Continue Shopping
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="lazyOnload"
        onLoad={() => setRazorpayLoaded(true)}
      />

      <div className="min-h-screen bg-[#FFFBF9] py-8">
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <Link
              href="/cart"
              className="inline-flex items-center text-sm text-[#6B2F1A] hover:text-[#5A2814]"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to Cart
            </Link>
          </div>

          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-[#6B2F1A]">
              Checkout
            </h1>
            <div className="hidden sm:flex items-center space-x-4">
              <div
                className={`flex items-center ${
                  currentStep === "contact"
                    ? "text-[#6B2F1A] font-medium"
                    : "text-gray-500"
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center mr-2 ${
                    currentStep === "contact"
                      ? "bg-[#6B2F1A] text-white"
                      : "bg-gray-200 text-gray-600"
                  }`}
                >
                  1
                </div>
                <span>Contact</span>
              </div>
              <div className="w-8 h-0.5 bg-gray-200"></div>
              <div
                className={`flex items-center ${
                  currentStep === "shipping"
                    ? "text-[#6B2F1A] font-medium"
                    : "text-gray-500"
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center mr-2 ${
                    currentStep === "shipping"
                      ? "bg-[#6B2F1A] text-white"
                      : "bg-gray-200 text-gray-600"
                  }`}
                >
                  2
                </div>
                <span>Shipping</span>
              </div>
              <div className="w-8 h-0.5 bg-gray-200"></div>
              <div
                className={`flex items-center ${
                  currentStep === "payment"
                    ? "text-[#6B2F1A] font-medium"
                    : "text-gray-500"
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center mr-2 ${
                    currentStep === "payment"
                      ? "bg-[#6B2F1A] text-white"
                      : "bg-gray-200 text-gray-600"
                  }`}
                >
                  3
                </div>
                <span>Payment</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column - Order Form */}
            <div className="lg:col-span-8">
              <form onSubmit={handleSubmit(onSubmit)}>
                {/* Contact Information */}
                {currentStep === "contact" && (
                  <Card className="mb-8 border-gray-200 shadow-sm">
                    <CardContent className="p-6">
                      {/* Guest Checkout / Login Options (only show if not logged in) */}
                      {!isAuthenticated && (
                        <div className="mb-6">
                          <Tabs defaultValue="guest" onValueChange={handleModeSwitch} value={checkoutMode}>
                            <TabsList className="grid w-full grid-cols-2 mb-4">
                              <TabsTrigger value="guest">
                                <UserPlus className="h-4 w-4 mr-2" />
                                Guest Checkout
                              </TabsTrigger>
                              <TabsTrigger value="login">
                                <LogIn className="h-4 w-4 mr-2" />
                                Login
                              </TabsTrigger>
                            </TabsList>
                            
                            <TabsContent value="guest">
                              <div className="bg-[#FFF5F1] p-4 rounded-md mb-6">
                                <p className="text-sm text-[#6B2F1A]">
                                  Continue as a guest. You can create an account during checkout if you wish.
                                </p>
                              </div>
                            </TabsContent>
                            
                            <TabsContent value="login">
                              <div className="space-y-4 mb-4">
                                <div>
                                  <label
                                    htmlFor="login-email"
                                    className="block text-sm font-medium text-gray-700 mb-1"
                                  >
                                    Email
                                  </label>
                                  <Input
                                    id="login-email"
                                    placeholder="Email address"
                                    onChange={(e) => setValue("email", e.target.value)}
                                  />
                                </div>
                                <div>
                                  <label
                                    htmlFor="login-password"
                                    className="block text-sm font-medium text-gray-700 mb-1"
                                  >
                                    Password
                                  </label>
                                  <Input
                                    id="login-password"
                                    type="password"
                                    placeholder="Password"
                                  />
                                </div>
                                <Button 
                                  type="button"
                                  className="w-full bg-[#6B2F1A] hover:bg-[#5A2814]"
                                  onClick={async () => {
                                    try {
                                      setIsProcessing(true);
                                      const email = document.getElementById('login-email').value;
                                      const password = document.getElementById('login-password').value;
                                      
                                      if (!email || !password) {
                                        toast.error("Please enter both email and password");
                                        setIsProcessing(false);
                                        return;
                                      }

                                      // Prepare login data
                                      const loginData = new FormData();
                                      loginData.append("email", email);
                                      loginData.append("password", password);

                                      // Attempt to login
                                      const result = await login(loginData);
                                      if (result && result.success) {
                                        toast.success("Logged in successfully");
                                        setCheckoutMode("loggedIn");
                                      } else {
                                        toast.error(result?.error || "Login failed. Please check your credentials.");
                                      }
                                    } catch (error) {
                                      toast.error("Login failed: " + (error.message || "Unknown error"));
                                    } finally {
                                      setIsProcessing(false);
                                    }
                                  }}
                                >
                                  {isProcessing ? (
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  ) : (
                                    <LogIn className="h-4 w-4 mr-2" />
                                  )}
                                  Log In
                                </Button>
                              </div>
                              
                              <div className="text-center">
                                <Button
                                  type="button"
                                  variant="link"
                                  className="text-[#6B2F1A] hover:text-[#5A2814]"
                                  onClick={() => handleModeSwitch("guest")}
                                >
                                  Continue as guest instead
                                </Button>
                              </div>
                              </TabsContent>
                          </Tabs>
                        </div>
                      )}

                      <h2 className="text-xl font-semibold mb-6 flex items-center text-[#6B2F1A]">
                        <User className="h-5 w-5 mr-2" />
                        Contact Information
                      </h2>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                          <label
                            htmlFor="firstName"
                            className="block text-sm font-medium text-gray-700 mb-1"
                          >
                            First Name*
                          </label>
                          <Input
                            id="firstName"
                            {...register("firstName")}
                            placeholder="John"
                            className={`${
                              errors.firstName
                                ? "border-red-300"
                                : "border-gray-300 focus:border-[#6B2F1A]"
                            }`}
                          />
                          {errors.firstName && (
                            <p className="text-red-500 text-sm mt-1">
                              {errors.firstName.message}
                            </p>
                          )}
                        </div>
                        <div>
                          <label
                            htmlFor="lastName"
                            className="block text-sm font-medium text-gray-700 mb-1"
                          >
                            Last Name*
                          </label>
                          <Input
                            id="lastName"
                            {...register("lastName")}
                            placeholder="Doe"
                            className={`${
                              errors.lastName
                                ? "border-red-300"
                                : "border-gray-300 focus:border-[#6B2F1A]"
                            }`}
                          />
                          {errors.lastName && (
                            <p className="text-red-500 text-sm mt-1">
                              {errors.lastName.message}
                            </p>
                          )}
                        </div>
                        <div>
                          <label
                            htmlFor="email"
                            className="block text-sm font-medium text-gray-700 mb-1"
                          >
                            Email Address*
                          </label>
                          <Input
                            id="email"
                            type="email"
                            {...register("email")}
                            placeholder="john.doe@example.com"
                            className={`${
                              errors.email
                                ? "border-red-300"
                                : "border-gray-300 focus:border-[#6B2F1A]"
                            }`}
                          />
                          {errors.email && (
                            <p className="text-red-500 text-sm mt-1">
                              {errors.email.message}
                            </p>
                          )}
                        </div>
                        <div>
                          <label
                            htmlFor="phone"
                            className="block text-sm font-medium text-gray-700 mb-1"
                          >
                            Phone Number*
                          </label>
                          <Input
                            id="phone"
                            {...register("phone")}
                            placeholder="Your phone number"
                            className={`${
                              errors.phone
                                ? "border-red-300"
                                : "border-gray-300 focus:border-[#6B2F1A]"
                            }`}
                          />
                          {errors.phone && (
                            <p className="text-red-500 text-sm mt-1">
                              {errors.phone.message}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Account Creation Option for Guest Users */}
                      {!isAuthenticated && checkoutMode === "guest" && (
                        <div className="mt-6 pt-6 border-t border-gray-200">
                          <div className="flex items-center space-x-3 mb-4">
                            <Checkbox
                              id="createAccount"
                              checked={watchCreateAccount}
                              onCheckedChange={(checked) => {
                                setValue("createAccount", checked === true);
                              }}
                              className="text-[#6B2F1A] border-gray-300 focus:ring-[#6B2F1A]"
                            />
                            <div>
                              <label
                                htmlFor="createAccount"
                                className="text-sm font-medium text-gray-900 cursor-pointer"
                              >
                                Create an account for faster checkout next time
                              </label>
                              <p className="text-xs text-gray-500">
                                Save your details for future purchases
                              </p>
                            </div>
                          </div>

                          {watchCreateAccount && (
                            <div className="mb-2">
                              <label
                                htmlFor="password"
                                className="block text-sm font-medium text-gray-700 mb-1"
                              >
                                Password*
                              </label>
                              <Input
                                id="password"
                                type="password"
                                {...register("password")}
                                placeholder="Create a password (min. 6 characters)"
                                className={`${
                                  errors.password
                                    ? "border-red-300"
                                    : "border-gray-300 focus:border-[#6B2F1A]"
                                }`}
                              />
                              {errors.password && (
                                <p className="text-red-500 text-sm mt-1">
                                  {errors.password.message}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Shipping & Billing */}
                {currentStep === "shipping" && (
                  <>
                    <Card className="mb-6 border-gray-200 shadow-sm">
                      <CardContent className="p-6">
                        <h2 className="text-xl font-semibold mb-6 flex items-center text-[#6B2F1A]">
                          <Building className="h-5 w-5 mr-2" />
                          Billing Information
                        </h2>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                          <div className="sm:col-span-2">
                            <label
                              htmlFor="billingAddress1"
                              className="block text-sm font-medium text-gray-700 mb-1"
                            >
                              Address Line 1*
                            </label>
                            <Input
                              id="billingAddress1"
                              {...register("billingAddress1")}
                              placeholder="Street address"
                              className={`${
                                errors.billingAddress1
                                  ? "border-red-300"
                                  : "border-gray-300 focus:border-[#6B2F1A]"
                              }`}
                            />
                            {errors.billingAddress1 && (
                              <p className="text-red-500 text-sm mt-1">
                                {errors.billingAddress1.message}
                              </p>
                            )}
                          </div>
                          <div className="sm:col-span-2">
                            <label
                              htmlFor="billingAddress2"
                              className="block text-sm font-medium text-gray-700 mb-1"
                            >
                              Address Line 2
                            </label>
                            <Input
                              id="billingAddress2"
                              {...register("billingAddress2")}
                              placeholder="Apartment, suite, unit, etc. (optional)"
                              className="border-gray-300 focus:border-[#6B2F1A]"
                            />
                          </div>
                          <div>
                            <label
                              htmlFor="billingCity"
                              className="block text-sm font-medium text-gray-700 mb-1"
                            >
                              City*
                            </label>
                            <Input
                              id="billingCity"
                              {...register("billingCity")}
                              placeholder="City"
                              className={`${
                                errors.billingCity
                                  ? "border-red-300"
                                  : "border-gray-300 focus:border-[#6B2F1A]"
                              }`}
                            />
                            {errors.billingCity && (
                              <p className="text-red-500 text-sm mt-1">
                                {errors.billingCity.message}
                              </p>
                            )}
                          </div>
                          <div>
                            <label
                              htmlFor="billingState"
                              className="block text-sm font-medium text-gray-700 mb-1"
                            >
                              State/Province*
                            </label>
                            <Input
                              id="billingState"
                              {...register("billingState")}
                              placeholder="State"
                              className={`${
                                errors.billingState
                                  ? "border-red-300"
                                  : "border-gray-300 focus:border-[#6B2F1A]"
                              }`}
                            />
                            {errors.billingState && (
                              <p className="text-red-500 text-sm mt-1">
                                {errors.billingState.message}
                              </p>
                            )}
                          </div>
                          <div>
                            <label
                              htmlFor="billingPostalCode"
                              className="block text-sm font-medium text-gray-700 mb-1"
                            >
                              Postal Code*
                            </label>
                            <Input
                              id="billingPostalCode"
                              {...register("billingPostalCode")}
                              placeholder="Postal code"
                              className={`${
                                errors.billingPostalCode
                                  ? "border-red-300"
                                  : "border-gray-300 focus:border-[#6B2F1A]"
                              }`}
                            />
                            {errors.billingPostalCode && (
                              <p className="text-red-500 text-sm mt-1">
                                {errors.billingPostalCode.message}
                              </p>
                            )}
                          </div>
                          <div>
                            <label
                              htmlFor="billingCountry"
                              className="block text-sm font-medium text-gray-700 mb-1"
                            >
                              Country*
                            </label>
                            <Select
                              defaultValue="India"
                              onValueChange={(value) =>
                                setValue("billingCountry", value)
                              }
                            >
                              <SelectTrigger
                                className={`${
                                  errors.billingCountry
                                    ? "border-red-300"
                                    : "border-gray-300 focus:border-[#6B2F1A]"
                                }`}
                              >
                                <SelectValue placeholder="Select a country" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="India">India</SelectItem>
                                <SelectItem value="United States">
                                  United States
                                </SelectItem>
                                <SelectItem value="United Kingdom">
                                  United Kingdom
                                </SelectItem>
                                <SelectItem value="Canada">Canada</SelectItem>
                                <SelectItem value="Australia">
                                  Australia
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            {errors.billingCountry && (
                              <p className="text-red-500 text-sm mt-1">
                                {errors.billingCountry.message}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center mt-6">
                          <Checkbox
                            id="sameAsBilling"
                            checked={watchSameAsBilling}
                            onCheckedChange={(checked) => {
                              setValue("sameAsBilling", checked === true);
                            }}
                            className="text-[#6B2F1A] border-gray-300 focus:ring-[#6B2F1A]"
                          />
                          <label
                            htmlFor="sameAsBilling"
                            className="ml-2 text-sm font-medium text-gray-700 cursor-pointer"
                          >
                            Same as billing address
                          </label>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Order Notes */}
                    <Card className="mb-6 border-gray-200 shadow-sm">
                      <CardContent className="p-6">
                        <Accordion type="single" collapsible>
                          <AccordionItem
                            value="order-notes"
                            className="border-b-0"
                          >
                            <AccordionTrigger className="text-base font-medium text-[#6B2F1A]">
                              <div className="flex items-center">
                                <Info className="h-4 w-4 mr-2" />
                                <span>
                                  Add Order Notes
                                </span>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className="mt-2">
                                <label
                                  htmlFor="notes"
                                  className="block text-sm font-medium text-gray-700 mb-1"
                                >
                                  Order Notes
                                </label>
                                <Textarea
                                  id="notes"
                                  {...register("notes")}
                                  placeholder="Any special instructions for delivery"
                                  className="h-24 border-gray-300 focus:border-[#6B2F1A]"
                                />
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      </CardContent>
                    </Card>

                    {!watchSameAsBilling && (
                      <Card className="mt-6 border-gray-200 shadow-sm">
                        <CardContent className="p-6">
                          <h2 className="text-xl font-semibold mb-6 flex items-center text-[#6B2F1A]">
                            <MapPin className="h-5 w-5 mr-2" />
                            Shipping Information
                          </h2>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="sm:col-span-2">
                              <label
                                htmlFor="shippingAddress1"
                                className="block text-sm font-medium text-gray-700 mb-1"
                              >
                                Address Line 1*
                              </label>
                              <Input
                                id="shippingAddress1"
                                {...register("shippingAddress1")}
                                placeholder="Street address"
                                className={`${
                                  errors.shippingAddress1
                                    ? "border-red-300"
                                    : "border-gray-300 focus:border-[#6B2F1A]"
                                }`}
                              />
                              {errors.shippingAddress1 && (
                                <p className="text-red-500 text-sm mt-1">
                                  {errors.shippingAddress1.message}
                                </p>
                              )}
                            </div>
                            <div className="sm:col-span-2">
                              <label
                                htmlFor="shippingAddress2"
                                className="block text-sm font-medium text-gray-700 mb-1"
                              >
                                Address Line 2
                              </label>
                              <Input
                                id="shippingAddress2"
                                {...register("shippingAddress2")}
                                placeholder="Apartment, suite, unit, etc. (optional)"
                                className="border-gray-300 focus:border-[#6B2F1A]"
                              />
                            </div>
                            <div>
                              <label
                                htmlFor="shippingCity"
                                className="block text-sm font-medium text-gray-700 mb-1"
                              >
                                City*
                              </label>
                              <Input
                                id="shippingCity"
                                {...register("shippingCity")}
                                placeholder="City"
                                className={`${
                                  errors.shippingCity
                                    ? "border-red-300"
                                    : "border-gray-300 focus:border-[#6B2F1A]"
                                }`}
                              />
                              {errors.shippingCity && (
                                <p className="text-red-500 text-sm mt-1">
                                  {errors.shippingCity.message}
                                </p>
                              )}
                            </div>
                            <div>
                              <label
                                htmlFor="shippingState"
                                className="block text-sm font-medium text-gray-700 mb-1"
                              >
                                State/Province*
                              </label>
                              <Input
                                id="shippingState"
                                {...register("shippingState")}
                                placeholder="State"
                                className={`${
                                  errors.shippingState
                                    ? "border-red-300"
                                    : "border-gray-300 focus:border-[#6B2F1A]"
                                }`}
                              />
                              {errors.shippingState && (
                                <p className="text-red-500 text-sm mt-1">
                                  {errors.shippingState.message}
                                </p>
                              )}
                            </div>
                            <div>
                              <label
                                htmlFor="shippingPostalCode"
                                className="block text-sm font-medium text-gray-700 mb-1"
                              >
                                Postal Code*
                              </label>
                              <Input
                                id="shippingPostalCode"
                                {...register("shippingPostalCode")}
                                placeholder="Postal code"
                                className={`${
                                  errors.shippingPostalCode
                                    ? "border-red-300"
                                    : "border-gray-300 focus:border-[#6B2F1A]"
                                }`}
                              />
                              {errors.shippingPostalCode && (
                                <p className="text-red-500 text-sm mt-1">
                                  {errors.shippingPostalCode.message}
                                </p>
                              )}
                            </div>
                            <div>
                              <label
                                htmlFor="shippingCountry"
                                className="block text-sm font-medium text-gray-700 mb-1"
                              >
                                Country*
                              </label>
                              <Select
                                defaultValue="India"
                                onValueChange={(value) =>
                                  setValue("shippingCountry", value)
                                }
                              >
                                <SelectTrigger
                                  className={`${
                                    errors.shippingCountry
                                      ? "border-red-300"
                                      : "border-gray-300 focus:border-[#6B2F1A]"
                                  }`}
                                >
                                  <SelectValue placeholder="Select a country" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="India">India</SelectItem>
                                  <SelectItem value="United States">
                                    United States
                                  </SelectItem>
                                  <SelectItem value="United Kingdom">
                                    United Kingdom
                                  </SelectItem>
                                  <SelectItem value="Canada">Canada</SelectItem>
                                  <SelectItem value="Australia">
                                    Australia
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                              {errors.shippingCountry && (
                                <p className="text-red-500 text-sm mt-1">
                                  {errors.shippingCountry.message}
                                </p>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    <Card className="mt-6 border-gray-200 shadow-sm">
                      <CardContent className="p-6">
                        <h2 className="text-xl font-semibold mb-6 flex items-center text-[#6B2F1A]">
                          <Truck className="h-5 w-5 mr-2" />
                          Shipping Method
                        </h2>

                        <RadioGroup
                          defaultValue="standard"
                          value={watchShippingMethod}
                          onValueChange={(value) =>
                            setValue("shippingMethod", value)
                          }
                        >
                          <div className="flex flex-col space-y-4">
                            <div
                              className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-all ${
                                watchShippingMethod === "standard"
                                  ? "border-[#6B2F1A] bg-[#FFF5F1]"
                                  : "border-gray-200 hover:border-[#6B2F1A]/30 hover:bg-[#FFF5F1]/50"
                              }`}
                              onClick={() =>
                                setValue("shippingMethod", "standard")
                              }
                            >
                              <div className="flex items-center">
                                <RadioGroupItem
                                  value="standard"
                                  id="standard-shipping"
                                  className="text-[#6B2F1A] border-gray-300"
                                />
                                <div className="ml-3">
                                  <label
                                    htmlFor="standard-shipping"
                                    className="font-medium cursor-pointer"
                                  >
                                    Standard Shipping
                                  </label>
                                  <p className="text-sm text-gray-500">
                                    Delivery in 5-7 business days
                                  </p>
                                </div>
                              </div>
                              <span className="font-medium">
                                {currency === "INR" && shippingCost > 0 ? (
                                  formatPrice(shippingCost)
                                ) : (
                                  <span className="text-green-600">Free</span>
                                )}
                              </span>
                            </div>

                            <div
                              className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-all ${
                                watchShippingMethod === "express"
                                  ? "border-[#6B2F1A] bg-[#FFF5F1]"
                                  : "border-gray-200 hover:border-[#6B2F1A]/30 hover:bg-[#FFF5F1]/50"
                              }`}
                              onClick={() =>
                                setValue("shippingMethod", "express")
                              }
                            >
                              <div className="flex items-center">
                                <RadioGroupItem
                                  value="express"
                                  id="express-shipping"
                                  className="text-[#6B2F1A] border-gray-300"
                                />
                                <div className="ml-3">
                                  <label
                                    htmlFor="express-shipping"
                                    className="font-medium cursor-pointer"
                                  >
                                    Express Shipping
                                  </label>
                                  <p className="text-sm text-gray-500">
                                    Delivery in 2-3 business days
                                  </p>
                                </div>
                              </div>
                              <span className="font-medium">
                                {currency === "INR" ? "₹100.00" : "$10.00"}
                              </span>
                            </div>
                          </div>
                        </RadioGroup>

                        {/* Show weight-based shipping info if applicable */}
                        {currency === "INR" &&
                          totalWeight > 0 &&
                          watchShippingMethod === "standard" && (
                            <div className="mt-4 bg-[#f8f9fa] p-3 rounded-md border border-gray-200">
                              <p className="text-sm text-gray-700 flex items-center">
                                <Info className="h-4 w-4 mr-2 text-[#6B2F1A]" />
                                Weight-based shipping calculation applied
                              </p>
                              <div className="mt-2 pl-6 text-xs text-gray-600 space-y-1">
                                <p>Total weight: {totalWeight}g</p>
                                <p>First 500g: ₹50.00</p>
                                {totalWeight > 500 && (
                                  <p>
                                    Additional{" "}
                                    {Math.ceil((totalWeight - 500) / 500)} x
                                    500g: ₹
                                    {Math.ceil((totalWeight - 500) / 500) * 40}
                                    .00
                                  </p>
                                )}
                              </div>
                            </div>
                          )}
                      </CardContent>
                    </Card>
                  </>
                )}

                {/* Payment Methods */}
                {currentStep === "payment" && (
                  <>
                    <Card className="mb-6 border-gray-200 shadow-sm">
                      <CardContent className="p-6">
                        <h2 className="text-xl font-semibold mb-6 flex items-center text-[#6B2F1A]">
                          <CreditCard className="h-5 w-5 mr-2" />
                          Payment Method
                        </h2>

                        <RadioGroup
                          defaultValue="card"
                          value={watchPaymentMethod}
                          onValueChange={(value) =>
                            setValue("paymentMethod", value)
                          }
                        >
                          <div className="flex flex-col space-y-4">
                            

                            <div
                              className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-all ${
                                watchPaymentMethod === "upi"
                                  ? "border-[#6B2F1A] bg-[#FFF5F1]"
                                  : "border-gray-200 hover:border-[#6B2F1A]/30 hover:bg-[#FFF5F1]/50"
                              }`}
                              onClick={() => setValue("paymentMethod", "upi")}
                            >
                              <div className="flex items-center">
                                <RadioGroupItem
                                  value="upi"
                                  id="upi-payment"
                                  className="text-[#6B2F1A] border-gray-300"
                                />
                                <div className="ml-3">
                                  <label
                                    htmlFor="upi-payment"
                                    className="font-medium cursor-pointer"
                                  >
                                    UPI / Net Banking
                                  </label>
                                  <p className="text-sm text-gray-500">
                                    Pay using UPI or bank transfer
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="h-5 w-8 bg-purple-600 rounded text-white text-xs flex items-center justify-center">
                                  UPI
                                </div>
                                <div className="h-5 w-8 bg-green-500 rounded text-white text-xs flex items-center justify-center">
                                  PAY
                                </div>
                              </div>
                            </div>

                            <div
                              className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-all ${
                                watchPaymentMethod === "cod"
                                  ? "border-[#6B2F1A] bg-[#FFF5F1]"
                                  : "border-gray-200 hover:border-[#6B2F1A]/30 hover:bg-[#FFF5F1]/50"
                              }`}
                              onClick={() => setValue("paymentMethod", "cod")}
                            >
                              <div className="flex items-center">
                                <RadioGroupItem
                                  value="cod"
                                  id="cod-payment"
                                  className="text-[#6B2F1A] border-gray-300"
                                />
                                <div className="ml-3">
                                  <label
                                    htmlFor="cod-payment"
                                    className="font-medium cursor-pointer"
                                  >
                                    Cash on Delivery
                                  </label>
                                  <p className="text-sm text-gray-500">
                                    Pay when you receive your order
                                  </p>
                                </div>
                              </div>
                              <div>
                                <BanknoteIcon className="h-5 w-5 text-gray-400" />
                              </div>
                            </div>
                          </div>
                        </RadioGroup>

                        {watchPaymentMethod === "cod" && (
                          <Alert className="mt-4 bg-[#FFF5F1] text-[#6B2F1A] border-[#fee3d8]">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>
                              Cash on Delivery Information
                            </AlertTitle>
                            <AlertDescription className="text-[#6B2F1A]/80">
                              Please have the exact amount ready at the time of
                              delivery. Our delivery partner will not be able to
                              provide change.
                            </AlertDescription>
                          </Alert>
                        )}
                      </CardContent>
                    </Card>

                    {/* Terms and Conditions */}
                    <Card className="border-gray-200 shadow-sm">
                      <CardContent className="p-6">
                        <div className="flex items-start space-x-3">
                          <Checkbox
                            id="termsAccepted"
                            checked={watch("termsAccepted")}
                            onCheckedChange={(checked) =>
                              setValue("termsAccepted", checked === true)
                            }
                            className="text-[#6B2F1A] border-gray-300 focus:ring-[#6B2F1A]"
                          />
                          <div>
                            <label
                              htmlFor="termsAccepted"
                              className="text-sm font-medium text-gray-700 cursor-pointer"
                            >
                              I accept the terms and conditions
                            </label>
                            <p className="text-xs text-gray-500 mt-1">
                              By placing your order, you agree to our{" "}
                              <Link
                                href="/terms"
                                className="text-[#6B2F1A] hover:text-[#5A2814]"
                              >
                                Terms of Service
                              </Link>{" "}
                              and{" "}
                              <Link
                                href="/privacy"
                                className="text-[#6B2F1A] hover:text-[#5A2814]"
                              >
                                Privacy Policy
                              </Link>
                            </p>
                          </div>
                        </div>
                        {errors.termsAccepted && (
                          <p className="text-red-500 text-sm mt-2 ml-7">
                            {errors.termsAccepted.message}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </>
                )}

                {/* Navigation Buttons */}
                <div className="flex justify-between mt-8">
                  {currentStep !== "contact" && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleBack}
                      className="border-[#6B2F1A]/20 text-[#6B2F1A] hover:bg-[#fee3d8] hover:text-[#6B2F1A] hover:border-[#6B2F1A]/30"
                    >
                      <ChevronLeft className="h-4 w-4 mr-2" />
                      Back
                    </Button>
                  )}

                  <div
                    className={`${currentStep === "contact" ? "ml-auto" : ""}`}
                  >
                    <Button
                      type="submit"
                      className="bg-[#6B2F1A] hover:bg-[#5A2814]"
                      disabled={isProcessing}
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : currentStep === "payment" ? (
                        <>
                          Place Order
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </>
                      ) : (
                        <>
                          Continue
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </form>
            </div>

            {/* Right Column - Order Summary */}
            <div className="lg:col-span-4">
              <div className="sticky top-8 space-y-6">
                <Card className="border-gray-200 shadow-sm">
                  <CardContent className="p-6">
                    <h2 className="text-xl font-semibold mb-6 flex items-center text-[#6B2F1A]">
                      <ShoppingBag className="h-5 w-5 mr-2" />
                      Order Summary
                    </h2>

                    {/* Cart Items */}
                    <div className="space-y-4 mb-6">
                      {cart.map((item, index) => (
                        <div key={index} className="flex gap-4">
                          <div className="relative w-16 h-16 flex-shrink-0 rounded-md overflow-hidden bg-gray-100 border border-gray-200">
                            {item.image ? (
                              <Image
                                src={
                                  item.image.startsWith("http")
                                    ? item.image
                                    : `https://greenglow.in/kauthuk_test/${item.image}`
                                }
                                alt={item.title || "Product"}
                                fill
                                sizes="64px"
                                className="object-cover"
                                onError={(e) => {
                                  // Handle image loading errors
                                  e.currentTarget.src =
                                    "/product-placeholder.jpg";
                                }}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <ShoppingBag className="h-6 w-6 text-gray-400" />
                              </div>
                            )}
                            <div className="absolute -top-1 -right-1 bg-[#6B2F1A] text-white w-5 h-5 rounded-full flex items-center justify-center text-xs">
                              {item.quantity || 1}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-medium text-gray-900 truncate">
                              {item.title || "Product"}
                            </h3>
                            {item.variant && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {item.variant.attributes &&
                                  item.variant.attributes.map((attr, i) => (
                                    <Badge
                                      key={i}
                                      variant="outline"
                                      className="text-xs px-1 py-0 border-[#6B2F1A]/30 text-[#6B2F1A]"
                                    >
                                      {attr.value}
                                    </Badge>
                                  ))}
                              </div>
                            )}
                            <div className="text-sm text-gray-600 mt-1">
                              {currency === "INR" ? (
                                <>
                                  {formatPrice(item.price || 0)} ×{" "}
                                  {item.quantity || 1}
                                </>
                              ) : (
                                <>
                                  {formatPrice(item.priceDollars || 0)} ×{" "}
                                  {item.quantity || 1}
                                </>
                              )}
                            </div>
                            {/* Display weight if available */}
                            {currency === "INR" &&
                              (item.weight ||
                                (item.variant && item.variant.weight)) && (
                                <div className="text-xs text-gray-500 mt-0.5">
                                  Weight:{" "}
                                  {item.weight || item.variant?.weight || 0}g
                                </div>
                              )}
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-medium text-[#6B2F1A]">
                              {currency === "INR" ? (
                                <>
                                  {formatPrice(
                                    (item.price || 0) * (item.quantity || 1)
                                  )}
                                </>
                              ) : (
                                <>
                                  {formatPrice(
                                    (item.priceDollars || 0) *
                                      (item.quantity || 1)
                                  )}
                                </>
                              )}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <Separator className="bg-gray-200" />

                    {/* Price Breakdown */}
                    <div className="py-4 space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Subtotal</span>
                        <span>{formatPrice(subtotal)}</span>
                      </div>

                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Shipping</span>
                        {shippingCost > 0 ? (
                          <span>{formatPrice(shippingCost)}</span>
                        ) : (
                          <span className="text-green-600">Free</span>
                        )}
                      </div>

                      {/* Display total weight if in INR mode */}
                      {currency === "INR" && totalWeight > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 flex items-center">
                            Total Weight
                            <span className="inline-flex ml-1 text-gray-400">
                              <Info className="h-3.5 w-3.5" />
                            </span>
                          </span>
                          <span>{totalWeight}g</span>
                        </div>
                      )}

                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Tax (10%)</span>
                        <span>{formatPrice(tax)}</span>
                      </div>

                      <Separator className="bg-gray-200" />

                      <div className="flex justify-between font-medium">
                        <span>Total</span>
                        <span className="text-lg text-[#6B2F1A]">
                          {formatPrice(total)}
                        </span>
                      </div>
                    </div>

                    {/* Weight-based shipping info */}
                    {currency === "INR" &&
                      totalWeight > 0 &&
                      watchShippingMethod === "standard" && (
                        <div className="mt-4 bg-[#FFF5F1] p-3 rounded-md">
                          <h3 className="text-sm font-medium text-[#6B2F1A] mb-1 flex items-center">
                            <Truck className="h-4 w-4 mr-1" />
                            Weight-based shipping
                          </h3>
                          <p className="text-xs text-[#6B2F1A]/80">
                            Standard shipping cost is calculated based on total
                            product weight:
                            <br />- First 500g: ₹50
                            <br />- Each additional 500g: ₹40
                          </p>
                        </div>
                      )}

                    {/* Trust Elements */}
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <div className="flex items-start space-x-2 mb-2">
                        <Shield className="h-4 w-4 text-[#6B2F1A] mt-0.5" />
                        <p className="text-xs text-gray-600">
                          <span className="font-medium">Secure Checkout:</span>{" "}
                          Your information is protected using SSL encryption.
                        </p>
                      </div>
                      <div className="flex items-start space-x-2 mb-2">
                        <HeartHandshake className="h-4 w-4 text-[#6B2F1A] mt-0.5" />
                        <p className="text-xs text-gray-600">
                          <span className="font-medium">
                            Satisfaction Guaranteed:
                          </span>{" "}
                          30-day money back guarantee.
                        </p>
                      </div>
                      <div className="flex items-start space-x-2">
                        <Wallet className="h-4 w-4 text-[#6B2F1A] mt-0.5" />
                        <p className="text-xs text-gray-600">
                          <span className="font-medium">
                            Flexible Payments:
                          </span>{" "}
                          Pay with credit card, UPI, or cash on delivery.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="hidden lg:block">
                  <Alert className="bg-[#FFF5F1] border-[#fee3d8]">
                    <div className="flex items-center gap-2">
                      <Lock className="h-4 w-4 text-[#6B2F1A]" />
                      <AlertTitle className="text-[#6B2F1A]">
                        Secure Checkout
                      </AlertTitle>
                    </div>
                    <AlertDescription className="text-[#6B2F1A]/80 mt-2">
                      Your transaction is secured with 256-bit SSL encryption
                    </AlertDescription>
                  </Alert>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CheckoutPage;