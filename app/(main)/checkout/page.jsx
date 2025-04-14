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
import { Label } from "@/components/ui/label";
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
import { useForm, Controller } from "react-hook-form";
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
  verifyPayment,
} from "@/actions/order";
import { CountrySelect, StateSelect } from "@/components/CountryStateSelects";
import Head from "next/head";

// Razorpay Script Loader Component
const RazorpayScript = ({ onLoad }) => {
  const [error, setError] = useState(null);

  useEffect(() => {
    // If Razorpay is already loaded, don't load script again
    if (typeof window !== "undefined" && window.Razorpay) {
      console.log("Razorpay already loaded");
      if (onLoad) onLoad();
      return;
    }

    const loadScript = () => {
      console.log("Loading Razorpay script");
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;

      script.onload = () => {
        console.log("Razorpay script loaded successfully");
        if (onLoad) onLoad();
      };

      script.onerror = (e) => {
        console.error("Error loading Razorpay script:", e);
        setError("Failed to load payment service");
      };

      document.body.appendChild(script);
    };

    loadScript();

    // Cleanup
    return () => {
      // Nothing specific to clean up
    };
  }, [onLoad]);

  return (
    <>
      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
          <p className="text-xs text-red-500 mt-1">
            You can still complete your order using Cash on Delivery.
          </p>
        </div>
      )}
    </>
  );
};

// Order Schema (with guest checkout support)
const OrderSchema = z.object({
  // Customer information
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),

  // Account creation option (for guest checkout)
  createAccount: z.boolean().default(false),
  password: z
    .string()
    .optional()
    .refine(
      (val) => {
        // Only validate password if createAccount is true
        if (val === undefined) return true;
        return val.length >= 6 || !val;
      },
      { message: "Password must be at least 6 characters" }
    ),

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
  const {
    user,
    isAuthenticated,
    login,
    register: registerUser,
  } = useUserAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderCreated, setOrderCreated] = useState(false);
  const [order, setOrder] = useState(null);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [currentStep, setCurrentStep] = useState("contact");
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [checkoutMode, setCheckoutMode] = useState(
    isAuthenticated ? "loggedIn" : "guest"
  );

  // Form with validation
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isValid },
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

  // Calculate total (with tax)
  const subtotalWithTax = subtotal * (1 + taxRate);
  const total = subtotalWithTax + shippingCost;

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
      // Ensure we're running on the client side
      if (typeof window === "undefined") return;

      // Check if Razorpay is loaded
      if (!window.Razorpay) {
        console.log("Trying to load Razorpay script directly...");

        try {
          await new Promise((resolve, reject) => {
            const script = document.createElement("script");
            script.src = "https://checkout.razorpay.com/v1/checkout.js";
            script.async = true;
            script.onload = resolve;
            script.onerror = reject;
            document.body.appendChild(script);
          });

          // Verify Razorpay loaded
          if (!window.Razorpay) {
            throw new Error("Razorpay failed to load");
          }
        } catch (scriptError) {
          console.error("Failed to load Razorpay script:", scriptError);
          toast.error(
            "Payment service is not available. Please choose Cash on Delivery."
          );
          setIsProcessing(false);
          return;
        }
      }

      // Validate order data
      if (!orderData || !orderData.id || !total) {
        throw new Error("Invalid order data");
      }

      console.log("Creating Razorpay order for:", orderData);

      // Create a Razorpay order on your server
      const razorpayOrderResponse = await createRazorpayOrder({
        amount: Math.round(total * 100), // Convert to smallest currency unit (paise)
        currency: currency,
        orderId: orderData.id,
      });

      console.log("Razorpay order creation response:", razorpayOrderResponse);

      if (!razorpayOrderResponse.success || !razorpayOrderResponse.orderId) {
        throw new Error(
          razorpayOrderResponse.error || "Failed to create payment order"
        );
      }

      // Set up Razorpay options
      const options = {
        key: "rzp_test_jG2ZIwR6d1w09S", // Hardcode for testing
        amount: Math.round(total * 100), // Convert to paise
        currency: currency,
        name: "Kauthuk",
        description: `Order #${orderData.id}`,
        order_id: razorpayOrderResponse.orderId,
        handler: function (response) {
          // This function runs after successful payment
          handlePaymentSuccess(response, orderData.id);
        },
        prefill: {
          name: `${getValues("firstName")} ${getValues("lastName")}`.trim(),
          email: getValues("email"),
          contact: getValues("phone"),
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
        console.error("Payment failed:", response);
        toast.error(`Payment failed: ${error.description || "Unknown error"}`);
        setIsProcessing(false);
      });

      console.log("Opening Razorpay payment form");
      paymentObject.open();
    } catch (error) {
      console.error("Razorpay initialization error:", error);
      toast.error(
        "Failed to initialize payment: " + (error.message || "Please try again")
      );
      setIsProcessing(false);
    }
  };

  const handlePaymentSuccess = async (response, orderId) => {
    try {
      setIsProcessing(true);
      console.log("Payment success response:", response);

      // Comprehensive validation of payment response
      const requiredFields = [
        "razorpay_payment_id",
        "razorpay_order_id",
        "razorpay_signature",
      ];

      const missingFields = requiredFields.filter((field) => !response[field]);

      if (missingFields.length > 0) {
        console.error("Missing required payment verification fields", {
          response,
          missingFields,
        });

        toast.error(
          `Payment verification failed - missing: ${missingFields.join(", ")}`
        );
        setIsProcessing(false);
        return;
      }

      // Verify the payment
      const verificationResult = await verifyPayment({
        paymentData: {
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_order_id: response.razorpay_order_id,
          razorpay_signature: response.razorpay_signature,
        },
        orderId: orderId,
      });

console.log("verificationResult",verificationResult)


      if (verificationResult.success) {
        setPaymentSuccess(true);
        clearCart();
        toast.success("Payment successful!");
        router.push(`/thank-you?orderId=${orderId}&total=${total}&currency=${currency}&items=${itemCount}`);

        // Optional: Redirect or show success page
        // router.push('/order-confirmation');
      } else {
        throw new Error(
          verificationResult.error || "Payment verification failed"
        );
      }
    } catch (error) {
      console.error("Comprehensive payment verification error:", {
        error,
        errorMessage: error.message,
        errorStack: error.stack,
      });

      toast.error(
        "Payment verification failed. Please contact support with the following details: " +
          (error.message || "Unknown error occurred")
      );

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
        subtotal: subtotalWithTax, // Already includes tax
        shipping: shippingCost,
        tax: tax, // Store tax separately even if included in subtotal
        total: total,
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
          router.push(`/thank-you?orderId=${result.order.id}&total=${total}&currency=${currency}&items=${itemCount}`);

        }, 1500);
        
      } else if (
        data.paymentMethod === "card" ||
        data.paymentMethod === "upi"
      ) {
        // For online payments, check if Razorpay is available
        if (!razorpayLoaded) {
          toast.error(
            "Payment service is not available. Please try again later or choose Cash on Delivery."
          );
          setIsProcessing(false);
          return;
        }

        try {
          // Initialize Razorpay with a proper order object format
          await initializeRazorpay({
            id: result.order.id,
            total: total,
            currency: currency,
          });
        } catch (paymentError) {
          console.error("Payment initialization error:", paymentError);
          toast.error(
            "There was an issue with the payment service. Please try again or choose Cash on Delivery."
          );
          setIsProcessing(false);
        }
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
    try {
      // Different behavior based on current step
      if (currentStep === "contact") {
        // Just move to the next step without validation here
        // (validation will happen automatically via the handleSubmit function)
        setCurrentStep("shipping");
        window.scrollTo(0, 0);
        return;
      } else if (currentStep === "shipping") {
        // Just move to the next step
        setCurrentStep("payment");
        window.scrollTo(0, 0);
        return;
      } else if (currentStep === "payment") {
        // For the final step, process the order
        await processOrder(data);
      }
    } catch (error) {
      console.error("Form submission error:", error);
      toast.error("There was an error processing your request");
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
      <div className="min-h-screen bg-[#FAFAFA] py-16">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-md mx-auto bg-white p-8 rounded-xl shadow-sm">
            <div className="flex justify-center mb-6">
              <div className="p-6 bg-[#F8F8F8] rounded-full">
                <ShoppingBag className="h-12 w-12 text-gray-400" />
              </div>
            </div>
            <h1 className="text-3xl font-bold mb-4">Your cart is empty</h1>
            <p className="text-gray-600 mb-8">
              Please add some products to your cart before checking out.
            </p>
            <Link href="/products">
              <Button className="px-8 py-6 text-lg bg-[#6B2F1A] hover:bg-[#5A2814] transition-all duration-300">
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
      <div className="min-h-screen bg-[#FAFAFA] py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-sm p-10">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 bg-[#F1F9EC] rounded-full flex items-center justify-center mb-8">
                <CheckCircle2 className="h-10 w-10 text-green-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Order Confirmed!
              </h1>
              <p className="text-lg text-gray-600 mb-8">
                Thank you for your purchase. Your order has been placed
                successfully.
              </p>
              <div className="w-full bg-[#F9F9F9] rounded-xl p-6 mb-8">
                <div className="flex justify-between mb-3">
                  <span className="font-medium text-gray-600">
                    Order Number:
                  </span>
                  <span className="font-semibold">
                    {order?.id || "ORD123456"}
                  </span>
                </div>
                <div className="flex justify-between mb-3">
                  <span className="font-medium text-gray-600">Order Date:</span>
                  <span>{new Date().toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between mb-3">
                  <span className="font-medium text-gray-600">
                    Payment Method:
                  </span>
                  <span className="capitalize">{watchPaymentMethod}</span>
                </div>
                <div className="flex justify-between pt-3 border-t border-gray-200">
                  <span className="font-medium text-gray-600">
                    Order Total:
                  </span>
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
                <Alert className="mb-8 bg-[#F1F9EC] border-green-200">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertTitle className="text-green-700">
                      Account Created
                    </AlertTitle>
                  </div>
                  <AlertDescription className="text-green-600/80 mt-1">
                    Your account has been created successfully. You can now log
                    in with your email and password.
                  </AlertDescription>
                </Alert>
              )}
              <div className="flex flex-col sm:flex-row gap-4 w-full">
                <Link href="/my-account" className="flex-1">
                  <Button
                    variant="outline"
                    className="w-full border-[#6B2F1A]/20 text-[#6B2F1A] hover:bg-[#FFF5F1] hover:text-[#6B2F1A] transition-all duration-300"
                  >
                    Track My Order
                  </Button>
                </Link>
                <Link href="/products" className="flex-1">
                  <Button className="w-full bg-[#6B2F1A] hover:bg-[#5A2814] transition-all duration-300">
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
      <RazorpayScript onLoad={() => setRazorpayLoaded(true)} />
      <Head>
        <title>Checkout - Kauthuk</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link
          rel="preconnect"
          href="https://checkout.razorpay.com"
          crossOrigin="anonymous"
        />
      </Head>

      <div className="min-h-screen bg-[#FAFAFA] py-8">
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <Link
              href="/cart"
              className="inline-flex items-center text-sm text-[#6B2F1A] hover:text-[#5A2814] transition-all duration-300"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to Cart
            </Link>
          </div>

          <div className="flex flex-col mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Checkout</h1>

            {/* Progress bar */}
            <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden mb-6">
              <div
                className="h-full bg-[#6B2F1A] transition-all duration-300"
                style={{
                  width:
                    currentStep === "contact"
                      ? "33.33%"
                      : currentStep === "shipping"
                      ? "66.66%"
                      : "100%",
                }}
              ></div>
            </div>

            <div className="flex justify-between items-center">
              <div
                className={`flex flex-col items-center ${
                  currentStep === "contact"
                    ? "text-[#6B2F1A] font-medium"
                    : currentStep === "shipping" || currentStep === "payment"
                    ? "text-gray-400"
                    : ""
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 
                  ${
                    currentStep === "contact"
                      ? "bg-[#6B2F1A] text-white"
                      : "bg-gray-200 text-gray-600"
                  }`}
                >
                  1
                </div>
                <span className="text-sm">Contact</span>
              </div>

              <div
                className={`flex flex-col items-center ${
                  currentStep === "shipping"
                    ? "text-[#6B2F1A] font-medium"
                    : currentStep === "payment"
                    ? "text-gray-400"
                    : "text-gray-400"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center mb-1
                  ${
                    currentStep === "shipping"
                      ? "bg-[#6B2F1A] text-white"
                      : currentStep === "payment"
                      ? "bg-gray-200 text-gray-600"
                      : "bg-gray-200 text-gray-600"
                  }`}
                >
                  2
                </div>
                <span className="text-sm">Shipping</span>
              </div>

              <div
                className={`flex flex-col items-center ${
                  currentStep === "payment"
                    ? "text-[#6B2F1A] font-medium"
                    : "text-gray-400"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center mb-1
                  ${
                    currentStep === "payment"
                      ? "bg-[#6B2F1A] text-white"
                      : "bg-gray-200 text-gray-600"
                  }`}
                >
                  3
                </div>
                <span className="text-sm">Payment</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column - Order Form */}
            <div className="lg:col-span-8">
              <form onSubmit={handleSubmit(onSubmit)}>
                {/* Contact Information */}
                {currentStep === "contact" && (
                  <Card className="mb-8 border-0 rounded-xl overflow-hidden shadow-sm">
                    <CardContent className="p-8">
                      {/* Guest Checkout / Login Options (only show if not logged in) */}
                      {!isAuthenticated && (
                        <div className="mb-8">
                          <Tabs
                            defaultValue="guest"
                            onValueChange={handleModeSwitch}
                            value={checkoutMode}
                            className="w-full"
                          >
                            <TabsList className="grid w-full grid-cols-2 mb-6 bg-gray-100 p-1 rounded-lg">
                              <TabsTrigger
                                value="guest"
                                className="rounded-md py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm"
                              >
                                <UserPlus className="h-4 w-4 mr-2" />
                                Guest Checkout
                              </TabsTrigger>
                              <TabsTrigger
                                value="login"
                                className="rounded-md py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm"
                              >
                                <LogIn className="h-4 w-4 mr-2" />
                                Login
                              </TabsTrigger>
                            </TabsList>

                            <TabsContent value="guest">
                              <div className="bg-blue-50 p-4 rounded-lg mb-6 border border-blue-100">
                                <p className="text-sm text-blue-700 flex items-center">
                                  <Info className="h-4 w-4 mr-2 text-blue-500" />
                                  Continue as a guest. You can create an account
                                  during checkout if you wish.
                                </p>
                              </div>
                            </TabsContent>

                            <TabsContent value="login">
                              <div className="space-y-4 mb-4">
                                <div>
                                  <Label
                                    htmlFor="login-email"
                                    className="text-sm font-medium text-gray-700 mb-1.5 block"
                                  >
                                    Email
                                  </Label>
                                  <Input
                                    id="login-email"
                                    placeholder="Enter your email address"
                                    className="w-full rounded-lg"
                                    onChange={(e) =>
                                      setValue("email", e.target.value)
                                    }
                                  />
                                </div>
                                <div>
                                  <Label
                                    htmlFor="login-password"
                                    className="text-sm font-medium text-gray-700 mb-1.5 block"
                                  >
                                    Password
                                  </Label>
                                  <Input
                                    id="login-password"
                                    type="password"
                                    placeholder="Enter your password"
                                    className="w-full rounded-lg"
                                  />
                                </div>
                                <Button
                                  type="button"
                                  className="w-full bg-[#6B2F1A] hover:bg-[#5A2814] transition-all duration-300 py-2.5 mt-2"
                                  onClick={async () => {
                                    try {
                                      setIsProcessing(true);
                                      const email =
                                        document.getElementById(
                                          "login-email"
                                        ).value;
                                      const password =
                                        document.getElementById(
                                          "login-password"
                                        ).value;

                                      if (!email || !password) {
                                        toast.error(
                                          "Please enter both email and password"
                                        );
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
                                        toast.error(
                                          result?.error ||
                                            "Login failed. Please check your credentials."
                                        );
                                      }
                                    } catch (error) {
                                      toast.error(
                                        "Login failed: " +
                                          (error.message || "Unknown error")
                                      );
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

                              <div className="text-center mt-4">
                                <Button
                                  type="button"
                                  variant="link"
                                  className="text-[#6B2F1A] hover:text-[#5A2814] transition-all duration-300"
                                  onClick={() => handleModeSwitch("guest")}
                                >
                                  Continue as guest instead
                                </Button>
                              </div>
                            </TabsContent>
                          </Tabs>
                        </div>
                      )}

                      <h2 className="text-xl font-semibold mb-6 flex items-center text-gray-800">
                        <User className="h-5 w-5 mr-2 text-[#6B2F1A]" />
                        Contact Information
                      </h2>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                          <Label
                            htmlFor="firstName"
                            className="text-sm font-medium text-gray-700 mb-1.5 block"
                          >
                            First Name*
                          </Label>
                          <Input
                            id="firstName"
                            {...register("firstName")}
                            placeholder="John"
                            className={`w-full rounded-lg ${
                              errors.firstName
                                ? "border-red-300 focus:ring-red-500"
                                : "border-gray-300 focus:ring-[#6B2F1A]"
                            }`}
                          />
                          {errors.firstName && (
                            <p className="text-red-500 text-sm mt-1.5">
                              {errors.firstName.message}
                            </p>
                          )}
                        </div>
                        <div>
                          <Label
                            htmlFor="lastName"
                            className="text-sm font-medium text-gray-700 mb-1.5 block"
                          >
                            Last Name*
                          </Label>
                          <Input
                            id="lastName"
                            {...register("lastName")}
                            placeholder="Doe"
                            className={`w-full rounded-lg ${
                              errors.lastName
                                ? "border-red-300 focus:ring-red-500"
                                : "border-gray-300 focus:ring-[#6B2F1A]"
                            }`}
                          />
                          {errors.lastName && (
                            <p className="text-red-500 text-sm mt-1.5">
                              {errors.lastName.message}
                            </p>
                          )}
                        </div>
                        <div>
                          <Label
                            htmlFor="email"
                            className="text-sm font-medium text-gray-700 mb-1.5 block"
                          >
                            Email Address*
                          </Label>
                          <Input
                            id="email"
                            type="email"
                            {...register("email")}
                            placeholder="john.doe@example.com"
                            className={`w-full rounded-lg ${
                              errors.email
                                ? "border-red-300 focus:ring-red-500"
                                : "border-gray-300 focus:ring-[#6B2F1A]"
                            }`}
                          />
                          {errors.email && (
                            <p className="text-red-500 text-sm mt-1.5">
                              {errors.email.message}
                            </p>
                          )}
                        </div>
                        <div>
                          <Label
                            htmlFor="phone"
                            className="text-sm font-medium text-gray-700 mb-1.5 block"
                          >
                            Phone Number*
                          </Label>
                          <Input
                            id="phone"
                            {...register("phone")}
                            placeholder="Your phone number"
                            className={`w-full rounded-lg ${
                              errors.phone
                                ? "border-red-300 focus:ring-red-500"
                                : "border-gray-300 focus:ring-[#6B2F1A]"
                            }`}
                          />
                          {errors.phone && (
                            <p className="text-red-500 text-sm mt-1.5">
                              {errors.phone.message}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Account Creation Option for Guest Users */}
                      {!isAuthenticated && checkoutMode === "guest" && (
                        <div className="mt-8 pt-6 border-t border-gray-200">
                          <div className="flex items-start space-x-3 mb-4">
                            <Controller
                              name="createAccount"
                              control={control}
                              render={({ field }) => (
                                <Checkbox
                                  id="createAccount"
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  className="mt-1 text-[#6B2F1A] border-gray-300 rounded focus:ring-[#6B2F1A]"
                                />
                              )}
                            />
                            <div>
                              <label
                                htmlFor="createAccount"
                                className="text-sm font-medium text-gray-900 cursor-pointer"
                              >
                                Create an account for faster checkout next time
                              </label>
                              <p className="text-xs text-gray-500 mt-0.5">
                                Save your details for future purchases and order
                                tracking
                              </p>
                            </div>
                          </div>

                          {watchCreateAccount && (
                            <div className="ml-7 mt-4">
                              <Label
                                htmlFor="password"
                                className="text-sm font-medium text-gray-700 mb-1.5 block"
                              >
                                Password*
                              </Label>
                              <Input
                                id="password"
                                type="password"
                                {...register("password")}
                                placeholder="Create a password (min. 6 characters)"
                                className={`w-full rounded-lg ${
                                  errors.password
                                    ? "border-red-300 focus:ring-red-500"
                                    : "border-gray-300 focus:ring-[#6B2F1A]"
                                }`}
                              />
                              {errors.password && (
                                <p className="text-red-500 text-sm mt-1.5">
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
                    <Card className="mb-6 border-0 rounded-xl overflow-hidden shadow-sm">
                      <CardContent className="p-8">
                        <h2 className="text-xl font-semibold mb-6 flex items-center text-gray-800">
                          <Building className="h-5 w-5 mr-2 text-[#6B2F1A]" />
                          Billing Information
                        </h2>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                          <div className="sm:col-span-2">
                            <Label
                              htmlFor="billingAddress1"
                              className="text-sm font-medium text-gray-700 mb-1.5 block"
                            >
                              Address Line 1*
                            </Label>
                            <Input
                              id="billingAddress1"
                              {...register("billingAddress1")}
                              placeholder="Street address"
                              className={`w-full rounded-lg ${
                                errors.billingAddress1
                                  ? "border-red-300 focus:ring-red-500"
                                  : "border-gray-300 focus:ring-[#6B2F1A]"
                              }`}
                            />
                            {errors.billingAddress1 && (
                              <p className="text-red-500 text-sm mt-1.5">
                                {errors.billingAddress1.message}
                              </p>
                            )}
                          </div>
                          <div className="sm:col-span-2">
                            <Label
                              htmlFor="billingAddress2"
                              className="text-sm font-medium text-gray-700 mb-1.5 block"
                            >
                              Address Line 2
                            </Label>
                            <Input
                              id="billingAddress2"
                              {...register("billingAddress2")}
                              placeholder="Apartment, suite, unit, etc. (optional)"
                              className="w-full rounded-lg border-gray-300 focus:ring-[#6B2F1A]"
                            />
                          </div>
                          <div>
                            <Label
                              htmlFor="billingCity"
                              className="text-sm font-medium text-gray-700 mb-1.5 block"
                            >
                              City*
                            </Label>
                            <Input
                              id="billingCity"
                              {...register("billingCity")}
                              placeholder="City"
                              className={`w-full rounded-lg ${
                                errors.billingCity
                                  ? "border-red-300 focus:ring-red-500"
                                  : "border-gray-300 focus:ring-[#6B2F1A]"
                              }`}
                            />
                            {errors.billingCity && (
                              <p className="text-red-500 text-sm mt-1.5">
                                {errors.billingCity.message}
                              </p>
                            )}
                          </div>
                          <div>
                            <div>
                              <Controller
                                name="billingState"
                                control={control}
                                render={({ field }) => (
                                  <StateSelect
                                    id="billingState"
                                    label="State/Province"
                                    value={field.value}
                                    onChange={field.onChange}
                                    countryId={getValues("billingCountry")}
                                    error={errors.billingState?.message}
                                    required={true}
                                  />
                                )}
                              />
                            </div>
                          </div>
                          <div>
                            <Label
                              htmlFor="billingPostalCode"
                              className="text-sm font-medium text-gray-700 mb-1.5 block"
                            >
                              Postal Code*
                            </Label>
                            <Input
                              id="billingPostalCode"
                              {...register("billingPostalCode")}
                              placeholder="Postal code"
                              className={`w-full rounded-lg ${
                                errors.billingPostalCode
                                  ? "border-red-300 focus:ring-red-500"
                                  : "border-gray-300 focus:ring-[#6B2F1A]"
                              }`}
                            />
                            {errors.billingPostalCode && (
                              <p className="text-red-500 text-sm mt-1.5">
                                {errors.billingPostalCode.message}
                              </p>
                            )}
                          </div>
                          <div>
                            <div>
                              <Controller
                                name="billingCountry"
                                control={control}
                                render={({ field }) => (
                                  <CountrySelect
                                    id="billingCountry"
                                    label="Country"
                                    value={field.value}
                                    onChange={field.onChange}
                                    error={errors.billingCountry?.message}
                                    required={true}
                                  />
                                )}
                              />
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center mt-6">
                          <Controller
                            name="sameAsBilling"
                            control={control}
                            render={({ field }) => (
                              <Checkbox
                                id="sameAsBilling"
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                className="text-[#6B2F1A] border-gray-300 rounded focus:ring-[#6B2F1A]"
                              />
                            )}
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
                    <Card className="mb-6 border-0 rounded-xl overflow-hidden shadow-sm">
                      <CardContent className="p-8">
                        <Accordion type="single" collapsible>
                          <AccordionItem
                            value="order-notes"
                            className="border-b-0"
                          >
                            <AccordionTrigger className="text-base font-medium text-gray-800 py-2">
                              <div className="flex items-center">
                                <Info className="h-4 w-4 mr-2 text-[#6B2F1A]" />
                                <span>Add Order Notes</span>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className="mt-4">
                                <Label
                                  htmlFor="notes"
                                  className="text-sm font-medium text-gray-700 mb-1.5 block"
                                >
                                  Order Notes
                                </Label>
                                <Textarea
                                  id="notes"
                                  {...register("notes")}
                                  placeholder="Any special instructions for delivery"
                                  className="h-24 w-full rounded-lg border-gray-300 focus:ring-[#6B2F1A]"
                                />
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      </CardContent>
                    </Card>

                    {!watchSameAsBilling && (
                      <Card className="mt-6 border-0 rounded-xl overflow-hidden shadow-sm">
                        <CardContent className="p-8">
                          <h2 className="text-xl font-semibold mb-6 flex items-center text-gray-800">
                            <MapPin className="h-5 w-5 mr-2 text-[#6B2F1A]" />
                            Shipping Information
                          </h2>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="sm:col-span-2">
                              <Label
                                htmlFor="shippingAddress1"
                                className="text-sm font-medium text-gray-700 mb-1.5 block"
                              >
                                Address Line 1*
                              </Label>
                              <Input
                                id="shippingAddress1"
                                {...register("shippingAddress1")}
                                placeholder="Street address"
                                className={`w-full rounded-lg ${
                                  errors.shippingAddress1
                                    ? "border-red-300 focus:ring-red-500"
                                    : "border-gray-300 focus:ring-[#6B2F1A]"
                                }`}
                              />
                              {errors.shippingAddress1 && (
                                <p className="text-red-500 text-sm mt-1.5">
                                  {errors.shippingAddress1.message}
                                </p>
                              )}
                            </div>
                            <div className="sm:col-span-2">
                              <Label
                                htmlFor="shippingAddress2"
                                className="text-sm font-medium text-gray-700 mb-1.5 block"
                              >
                                Address Line 2
                              </Label>
                              <Input
                                id="shippingAddress2"
                                {...register("shippingAddress2")}
                                placeholder="Apartment, suite, unit, etc. (optional)"
                                className="w-full rounded-lg border-gray-300 focus:ring-[#6B2F1A]"
                              />
                            </div>
                            <div>
                              <Label
                                htmlFor="shippingCity"
                                className="text-sm font-medium text-gray-700 mb-1.5 block"
                              >
                                City*
                              </Label>
                              <Input
                                id="shippingCity"
                                {...register("shippingCity")}
                                placeholder="City"
                                className={`w-full rounded-lg ${
                                  errors.shippingCity
                                    ? "border-red-300 focus:ring-red-500"
                                    : "border-gray-300 focus:ring-[#6B2F1A]"
                                }`}
                              />
                              {errors.shippingCity && (
                                <p className="text-red-500 text-sm mt-1.5">
                                  {errors.shippingCity.message}
                                </p>
                              )}
                            </div>
                            <div>
                              <Controller
                                name="shippingState"
                                control={control}
                                render={({ field }) => (
                                  <StateSelect
                                    id="shippingState"
                                    label="State/Province"
                                    value={field.value}
                                    onChange={field.onChange}
                                    countryId={getValues("shippingCountry")}
                                    error={errors.shippingState?.message}
                                    required={true}
                                  />
                                )}
                              />
                            </div>
                            <div>
                              <Label
                                htmlFor="shippingPostalCode"
                                className="text-sm font-medium text-gray-700 mb-1.5 block"
                              >
                                Postal Code*
                              </Label>
                              <Input
                                id="shippingPostalCode"
                                {...register("shippingPostalCode")}
                                placeholder="Postal code"
                                className={`w-full rounded-lg ${
                                  errors.shippingPostalCode
                                    ? "border-red-300 focus:ring-red-500"
                                    : "border-gray-300 focus:ring-[#6B2F1A]"
                                }`}
                              />
                              {errors.shippingPostalCode && (
                                <p className="text-red-500 text-sm mt-1.5">
                                  {errors.shippingPostalCode.message}
                                </p>
                              )}
                            </div>
                            <div>
                              <Controller
                                name="shippingCountry"
                                control={control}
                                render={({ field }) => (
                                  <CountrySelect
                                    id="shippingCountry"
                                    label="Country"
                                    value={field.value}
                                    onChange={field.onChange}
                                    error={errors.shippingCountry?.message}
                                    required={true}
                                  />
                                )}
                              />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    <Card className="mt-6 border-0 rounded-xl overflow-hidden shadow-sm">
                      <CardContent className="p-8">
                        <h2 className="text-xl font-semibold mb-6 flex items-center text-gray-800">
                          <Truck className="h-5 w-5 mr-2 text-[#6B2F1A]" />
                          Shipping Method
                        </h2>

                        <Controller
                          name="shippingMethod"
                          control={control}
                          render={({ field }) => (
                            <RadioGroup
                              value={field.value}
                              onValueChange={field.onChange}
                              className="space-y-4"
                            >
                              <label
                                className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-all ${
                                  field.value === "standard"
                                    ? "border-[#6B2F1A] bg-[#FFF5F1]"
                                    : "border-gray-200 hover:border-[#6B2F1A]/30 hover:bg-[#FFF5F1]/50"
                                }`}
                              >
                                <div className="flex items-center">
                                  <RadioGroupItem
                                    value="standard"
                                    id="standard-shipping"
                                    className="text-[#6B2F1A] border-gray-300"
                                  />
                                  <div className="ml-3">
                                    <span className="font-medium">
                                      Standard Shipping
                                    </span>
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
                              </label>

                              <label
                                className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-all ${
                                  field.value === "express"
                                    ? "border-[#6B2F1A] bg-[#FFF5F1]"
                                    : "border-gray-200 hover:border-[#6B2F1A]/30 hover:bg-[#FFF5F1]/50"
                                }`}
                              >
                                <div className="flex items-center">
                                  <RadioGroupItem
                                    value="express"
                                    id="express-shipping"
                                    className="text-[#6B2F1A] border-gray-300"
                                  />
                                  <div className="ml-3">
                                    <span className="font-medium">
                                      Express Shipping
                                    </span>
                                    <p className="text-sm text-gray-500">
                                      Delivery in 2-3 business days
                                    </p>
                                  </div>
                                </div>
                                <span className="font-medium">
                                  {currency === "INR" ? "₹100.00" : "$10.00"}
                                </span>
                              </label>
                            </RadioGroup>
                          )}
                        />

                        {/* Show weight-based shipping info if applicable */}
                        {currency === "INR" &&
                          totalWeight > 0 &&
                          watchShippingMethod === "standard" && (
                            <div className="mt-4 bg-[#F9FAFC] p-4 rounded-lg border border-gray-200">
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
                    <Card className="mb-6 border-0 rounded-xl overflow-hidden shadow-sm">
                      <CardContent className="p-8">
                        <h2 className="text-xl font-semibold mb-6 flex items-center text-gray-800">
                          <CreditCard className="h-5 w-5 mr-2 text-[#6B2F1A]" />
                          Payment Method
                        </h2>

                        <Controller
                          name="paymentMethod"
                          control={control}
                          render={({ field }) => (
                            <RadioGroup
                              value={field.value}
                              onValueChange={field.onChange}
                              className="space-y-4"
                            >
                              <label
                                className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-all ${
                                  field.value === "upi"
                                    ? "border-[#6B2F1A] bg-[#FFF5F1]"
                                    : "border-gray-200 hover:border-[#6B2F1A]/30 hover:bg-[#FFF5F1]/50"
                                }`}
                              >
                                <div className="flex items-center">
                                  <RadioGroupItem
                                    value="upi"
                                    id="upi-payment"
                                    className="text-[#6B2F1A] border-gray-300"
                                  />
                                  <div className="ml-3">
                                    <span className="font-medium">
                                      UPI / Net Banking
                                    </span>
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
                              </label>

                              <label
                                className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-all ${
                                  field.value === "cod"
                                    ? "border-[#6B2F1A] bg-[#FFF5F1]"
                                    : "border-gray-200 hover:border-[#6B2F1A]/30 hover:bg-[#FFF5F1]/50"
                                }`}
                              >
                                <div className="flex items-center">
                                  <RadioGroupItem
                                    value="cod"
                                    id="cod-payment"
                                    className="text-[#6B2F1A] border-gray-300"
                                  />
                                  <div className="ml-3">
                                    <span className="font-medium">
                                      Cash on Delivery
                                    </span>
                                    <p className="text-sm text-gray-500">
                                      Pay when you receive your order
                                    </p>
                                  </div>
                                </div>
                                <div>
                                  <BanknoteIcon className="h-5 w-5 text-gray-400" />
                                </div>
                              </label>
                            </RadioGroup>
                          )}
                        />

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

                        {watchPaymentMethod === "upi" && !razorpayLoaded && (
                          <Alert className="mt-4 bg-yellow-50 text-amber-800 border-amber-200">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Payment Service Notice</AlertTitle>
                            <AlertDescription className="text-amber-800/80">
                              The payment service is currently loading. If it
                              doesn't become available, you may want to try
                              refreshing the page or selecting Cash on Delivery
                              instead.
                            </AlertDescription>
                          </Alert>
                        )}
                      </CardContent>
                    </Card>

                    {/* Terms and Conditions */}
                    <Card className="border-0 rounded-xl overflow-hidden shadow-sm">
                      <CardContent className="p-8">
                        <div className="flex items-start space-x-3">
                          <Controller
                            name="termsAccepted"
                            control={control}
                            render={({ field }) => (
                              <Checkbox
                                id="termsAccepted"
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                className="mt-1 text-[#6B2F1A] border-gray-300 rounded focus:ring-[#6B2F1A]"
                              />
                            )}
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
                                className="text-[#6B2F1A] hover:underline hover:text-[#5A2814] transition-all duration-300"
                              >
                                Terms of Service
                              </Link>{" "}
                              and{" "}
                              <Link
                                href="/privacy"
                                className="text-[#6B2F1A] hover:underline hover:text-[#5A2814] transition-all duration-300"
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

                {(currentStep === "contact" || currentStep === "shipping") && (
                  <div className="flex justify-between mt-8">
                    {currentStep === "shipping" && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleBack}
                        className="border-[#6B2F1A]/20 text-[#6B2F1A] hover:bg-[#FFF5F1] hover:text-[#6B2F1A] hover:border-[#6B2F1A]/30 transition-all duration-300 py-2.5 px-5"
                      >
                        <ChevronLeft className="h-4 w-4 mr-2" />
                        Back
                      </Button>
                    )}
                    <Button
                      type="button"
                      className={`bg-[#6B2F1A] hover:bg-[#5A2814] transition-all duration-300 py-2.5 px-5 ${
                        currentStep === "contact" ? "ml-auto" : ""
                      }`}
                      onClick={async () => {
                        if (currentStep === "contact") {
                          // Validate contact information
                          const isContactValid = await trigger([
                            "firstName",
                            "lastName",
                            "email",
                            "phone",
                          ]);

                          // Also validate password if creating account
                          if (watchCreateAccount) {
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

                          const isShippingValid = await trigger(
                            fieldsToValidate
                          );
                          if (isShippingValid) {
                            setCurrentStep("payment");
                            window.scrollTo(0, 0);
                          }
                        }
                      }}
                    >
                      Continue
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                )}

                {currentStep === "payment" && (
                  <div className="flex justify-between mt-8">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleBack}
                      className="border-[#6B2F1A]/20 text-[#6B2F1A] hover:bg-[#FFF5F1] hover:text-[#6B2F1A] hover:border-[#6B2F1A]/30 transition-all duration-300 py-2.5 px-5"
                    >
                      <ChevronLeft className="h-4 w-4 mr-2" />
                      Back
                    </Button>
                    <Button
                      type="submit"
                      className="bg-[#6B2F1A] hover:bg-[#5A2814] transition-all duration-300 py-2.5 px-5"
                      disabled={isProcessing}
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          Place Order
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </form>
            </div>

            {/* Right Column - Order Summary */}
            <div className="lg:col-span-4">
              <div className="sticky top-8 space-y-6">
                <Card className="border-0 rounded-xl overflow-hidden shadow-sm">
                  <CardContent className="p-6">
                    <h2 className="text-xl font-semibold mb-4 flex items-center text-gray-800">
                      <ShoppingBag className="h-5 w-5 mr-2 text-[#6B2F1A]" />
                      Order Summary
                    </h2>

                    {/* Cart Items */}
                    <div className="space-y-4 mb-6 max-h-[320px] overflow-y-auto pr-2">
                      {cart.map((item, index) => (
                        <div key={index} className="flex gap-3 py-2">
                          <div className="relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
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
                            <div className="absolute -top-1 -right-1 bg-[#6B2F1A] text-white w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium">
                              {item.quantity || 1}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-medium text-gray-900 line-clamp-1">
                              {item.title || "Product"}
                            </h3>
                            {item.variant && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {item.variant.attributes &&
                                  item.variant.attributes.map((attr, i) => (
                                    <Badge
                                      key={i}
                                      variant="outline"
                                      className="text-xs px-1.5 py-0.5 border-[#6B2F1A]/30 text-[#6B2F1A] rounded-md"
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

                    <Separator className="bg-gray-200 my-4" />

                    {/* Price Breakdown */}
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 flex items-center">
                          Subtotal ({itemCount}{" "}
                          {itemCount === 1 ? "item" : "items"})
                          <span className="inline-flex ml-1 text-gray-400">
                            <Info
                              className="h-3.5 w-3.5"
                              title="Includes 10% tax"
                            />
                          </span>
                        </span>
                        <span>{formatPrice(subtotalWithTax)}</span>
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
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>Total Weight</span>
                          <span>{totalWeight}g</span>
                        </div>
                      )}

                      <Separator className="bg-gray-200 my-2" />

                      <div className="flex justify-between font-medium">
                        <span>Total</span>
                        <span className="text-lg text-[#6B2F1A]">
                          {formatPrice(total)}
                        </span>
                      </div>
                    </div>

                    {/* Trust Elements */}
                    <div className="mt-6 bg-[#F9FAFC] p-4 rounded-lg border border-gray-100">
                      <h3 className="text-sm font-medium text-gray-700 mb-3">
                        We Guarantee
                      </h3>
                      <div className="space-y-3">
                        <div className="flex items-start space-x-3">
                          <Shield className="h-4 w-4 text-[#6B2F1A] mt-0.5" />
                          <p className="text-xs text-gray-600">
                            <span className="font-medium">
                              Secure Checkout:
                            </span>{" "}
                            Protected with 256-bit SSL encryption
                          </p>
                        </div>
                        <div className="flex items-start space-x-3">
                          <HeartHandshake className="h-4 w-4 text-[#6B2F1A] mt-0.5" />
                          <p className="text-xs text-gray-600">
                            <span className="font-medium">
                              Satisfaction Guaranteed:
                            </span>{" "}
                            30-day money back guarantee
                          </p>
                        </div>
                        <div className="flex items-start space-x-3">
                          <Wallet className="h-4 w-4 text-[#6B2F1A] mt-0.5" />
                          <p className="text-xs text-gray-600">
                            <span className="font-medium">
                              Flexible Payments:
                            </span>{" "}
                            Multiple payment options available
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {currentStep === "payment" && (
                  <Alert className="bg-[#F9FAFC] border-[#6B2F1A]/10 shadow-sm">
                    <div className="flex items-center gap-2">
                      <Lock className="h-4 w-4 text-[#6B2F1A]" />
                      <AlertTitle className="text-gray-800 text-sm">
                        Safe & Secure Checkout
                      </AlertTitle>
                    </div>
                    <AlertDescription className="text-gray-600 text-xs mt-2">
                      Your payment information is processed securely. We do not
                      store your credit card details.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CheckoutPage;
